(function () {
  const ui = window.UsinaLinkUi;
  const service = window.UsinaLinkPayments;
  if (!ui || !service) return;

  const params = new URLSearchParams(window.location.search);

  function paymentLink(order) {
    return `pagamento-pedido.html?pedidoId=${encodeURIComponent(order.id)}`;
  }

  function detailsLink(order) {
    return `detalhes-pedido.html?pedidoId=${encodeURIComponent(order.id)}`;
  }

  function receiptLink(order) {
    return `confirmacao-pedido.html?pedidoId=${encodeURIComponent(order.id)}`;
  }

  const PEDIDO_STATUS_LABEL = {
    aberto: "Aberto",
    em_negociacao: "Em negociação",
    proposta_aceita: "Proposta aceita",
    em_producao: "Em produção",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  function statusPedidoLabel(status) {
    return PEDIDO_STATUS_LABEL[status] || status || "Pendente";
  }

  // Na conta da usina, proposta recusada ou cancelada não é pedido em andamento.
  function statusParaUsina(order) {
    if (service.currentSession().tipo === "usina" && ["recusada", "cancelada"].includes(order.propostaStatus)) return order.propostaStatus === "recusada" ? "Proposta recusada" : "Proposta cancelada";
    return statusPedidoLabel(order.statusPedido);
  }

  function proximoPasso(order, isUsina) {
    const pago = order.statusPagamento === "Pago";
    const status = order.statusPedido;
    if (status === "cancelado") return "Este pedido foi cancelado.";
    if (status === "concluido") return "Pedido concluido. A entrega foi confirmada.";
    if (status === "em_producao") {
      return isUsina
        ? "Pagamento recebido. Produza o pedido e, depois de entregar, clique em \"Confirmar entrega\" (o comprador tambem pode confirmar ao receber)."
        : "Pagamento confirmado. Quando receber a mercadoria, clique em \"Confirmar entrega\" para concluir o pedido.";
    }
    if (status === "proposta_aceita" && !pago) {
      return isUsina
        ? "Proposta aceita. Aguardando a empresa pagar o pedido."
        : "Proposta aceita. Proximo passo: clique em \"Pagar pedido\". Depois do pagamento, confirme a entrega para concluir.";
    }
    return "Aguardando a empresa aceitar uma proposta.";
  }

  async function renderPaymentsPage() {
    const container = document.querySelector("[data-payments-list]");
    if (!container) return;
    container.innerHTML = '<div class="loading-state" aria-busy="true">Carregando pagamentos...</div>';
    const orders = await service.getOrders();
    const stat = document.querySelector("[data-stat-aguardando-pagamento]");
    if (stat) stat.textContent = orders.filter(order => order.statusPedido === "proposta_aceita" && order.statusPagamento !== "Pago").length;
    const pagos = orders.filter(order => order.statusPagamento === "Pago");
    const statPagos = document.querySelector("[data-stat-pagos]");
    if (statPagos) statPagos.textContent = pagos.length;
    const statTotal = document.querySelector("[data-stat-total-pago]");
    if (statTotal) statTotal.textContent = ui.formatCurrency(pagos.reduce((soma, order) => soma + (Number(order.totals?.total) || 0), 0));
    if (!orders.length) {
      container.innerHTML = '<div class="empty-state"><strong>Nenhum pedido encontrado</strong><span>Assim que houver propostas aceitas, os pedidos aparecem aqui.</span><a class="btn btn-small" href="' + (service.currentSession().tipo === "pessoa_fisica" ? "pecas-comerciais-pessoa-fisica.html" : "pedidos-sob-medida.html") + '">' + (service.currentSession().tipo === "pessoa_fisica" ? "Ver o catálogo" : "Ver solicitações") + '</a></div>';
      return;
    }
    container.innerHTML = orders.map(order => `
      <article class="card payment-list-card">
        <div>
          <span class="eyebrow">${ui.orderNumber(order.id)}</span>
          <h2>${ui.escapeHtml(order.peca || "Pedido industrial")}</h2>
          <p>${ui.escapeHtml(order.descricao || "Pedido em validacao.")}</p>
        </div>
        <div class="payment-card-meta">
          <div><span>Comprador</span><strong>${ui.escapeHtml(order.empresa || "Cliente")}</strong></div>
          <div><span>Usina</span><strong>${ui.escapeHtml(order.usina)}</strong></div>
          <div><span>Total</span><strong>${ui.formatCurrency(order.totals.total)}</strong></div>
          <div><span>Pagamento</span>${ui.statusBadge(order.statusPagamento)}</div>
        </div>
        <div class="card-actions">
          <a class="btn btn-ghost" href="${detailsLink(order)}">Ver detalhes</a>
          ${order.statusPagamento === "Pago" ? `<a class="btn" href="${receiptLink(order)}">Ver comprovante</a>` : order.statusPedido === "proposta_aceita" ? `<a class="btn" href="${paymentLink(order)}">Pagar pedido</a>` : ""}
        </div>
      </article>
    `).join("");
  }

  function setMethod(method) {
    document.querySelectorAll("[data-payment-method]").forEach(button => button.classList.toggle("active", button.dataset.paymentMethod === method));
    document.querySelectorAll("[data-method-panel]").forEach(panel => panel.hidden = panel.dataset.methodPanel !== method);
    const input = document.querySelector("#payment-method");
    if (input) input.value = method;
  }

  function validatePayment(method) {
    if (method !== "Cartao") return true;
    const required = [...document.querySelectorAll("[data-card-field]")];
    let valid = true;
    required.forEach(input => {
      const ok = input.value.trim().length >= Number(input.dataset.min || 1);
      input.closest(".field")?.classList.toggle("has-error", !ok);
      valid = valid && ok;
    });
    if (!valid) ui.showFeedback("Preencha os campos ficticios do cartao para continuar.", "error");
    return valid;
  }

  async function renderPaymentPage() {
    const root = document.querySelector("[data-payment-page]");
    if (!root) return;
    // Volta da Stripe: o servidor confere la se o pagamento foi feito antes de marcar o pedido como pago.
    const stripeVolta = params.get("stripe");
    if (stripeVolta === "ok" && params.get("session_id")) {
      root.innerHTML = '<div class="empty-state" role="status"><strong>Confirmando seu pagamento...</strong><span>Só um instante.</span></div>';
      const espera = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
      // PIX (e boleto) podem levar alguns instantes para a Stripe marcar como pago: a tela espera e pergunta de novo, até 2 minutos.
      for (let tentativa = 0; ; tentativa += 1) {
        try {
          await service.confirmarStripe(params.get("session_id"));
          window.location.replace(`confirmacao-pedido.html?pedidoId=${encodeURIComponent(params.get("pedidoId") || "")}`);
          return;
        } catch (error) {
          const aindaNao = /ainda nao foi confirmado/i.test(String(error.message));
          if (aindaNao && tentativa < 30) {
            root.innerHTML = '<div class="empty-state" role="status"><strong>Aguardando a confirmação do pagamento...</strong><span>O PIX pode levar alguns instantes. Não feche esta página.</span></div>';
            await espera(4000);
            continue;
          }
          const texto = aindaNao ? "A Stripe ainda não confirmou o pagamento. Se você já pagou, aguarde um minuto e confira de novo: o pedido se atualiza sozinho assim que a confirmação chegar." : (ui.escapeHtml ? ui.escapeHtml(error.message) : "Tente novamente em instantes.");
          root.innerHTML = `<div class="empty-state" role="alert"><strong>${aindaNao ? "Pagamento ainda não confirmado" : "Não foi possível confirmar o pagamento"}</strong><span>${texto}</span><a class="btn btn-small" href="${window.location.href.replace(/&/g, "&amp;")}">Conferir de novo</a> <a class="btn btn-small btn-ghost" href="historico-pedidos.html">Ver histórico de pedidos</a></div>`;
          return;
        }
      }
    }
    const order = await service.getOrder(params.get("pedidoId"));
    if (!order) {
      root.innerHTML = '<div class="empty-state"><strong>Pedido nao encontrado</strong><span>Volte para pagamentos e tente novamente.</span></div>';
      return;
    }
    if (order.statusPagamento === "Pago" || order.statusPedido !== "proposta_aceita") {
      const jaPago = order.statusPagamento === "Pago";
      const msg = jaPago ? ["Este pedido já foi pago", "Veja o comprovante do pagamento."] : ["Este pedido não está aguardando pagamento", "O pagamento só é liberado depois que uma proposta é aceita."];
      root.innerHTML = `<div class="empty-state" role="status"><strong>${msg[0]}</strong><span>${msg[1]}</span><a class="btn btn-small" href="${jaPago ? receiptLink(order) : detailsLink(order)}">${jaPago ? "Ver comprovante" : "Ver o pedido"}</a></div>`;
      return;
    }
    const totals = order.totals;
    document.querySelectorAll("[data-order-number]").forEach(item => item.textContent = ui.orderNumber(order.id));
    document.querySelector("[data-payment-title]").textContent = order.peca || "Pedido industrial";
    document.querySelector("[data-payment-description]").textContent = order.descricao || "Servico industrial contratado.";
    document.querySelector("[data-payment-company]").textContent = order.empresa || "Cliente";
    document.querySelector("[data-payment-plant]").textContent = order.usina;
    document.querySelector("[data-payment-quantity]").textContent = order.quantidade || "1 unidade";
    document.querySelector("[data-payment-unit]").textContent = ui.formatCurrency(totals.subtotal);
    document.querySelector("[data-payment-total]").textContent = ui.formatCurrency(totals.total);
    document.querySelector("[data-payment-deadline]").textContent = order.prazo;
    document.querySelector("[data-payment-address]").textContent = order.endereco;
    document.querySelector("[data-summary-subtotal]").textContent = ui.formatCurrency(totals.subtotal);
    document.querySelector("[data-summary-discount]").textContent = ui.formatCurrency(totals.discount);
    document.querySelector("[data-summary-taxes]").textContent = ui.formatCurrency(totals.taxes);
    document.querySelector("[data-summary-total]").textContent = ui.formatCurrency(totals.total);
    document.querySelector("[data-copy-pix]")?.addEventListener("click", () => navigator.clipboard?.writeText("pix-teste@usinalink.com").then(() => ui.showFeedback("Chave PIX copiada.")));
    document.querySelector("[data-copy-boleto]")?.addEventListener("click", () => navigator.clipboard?.writeText("34191.79001 01043.510047 91020.150008 8 98760000018500").then(() => ui.showFeedback("Linha digitavel copiada.")));
    document.querySelectorAll("[data-payment-method]").forEach(button => button.addEventListener("click", () => setMethod(button.dataset.paymentMethod)));
    const stripe = await service.stripeAtivo();
    if (!stripe) {
      // Pagamento simulado: só agora as formas de pagamento aparecem (antes ficam escondidas, para não piscarem com a Stripe ligada).
      document.querySelector(".payment-methods")?.removeAttribute("hidden");
      setMethod("PIX");
    }
    if (stripe) {
      // Pagamento online: esconde as formas ficticias e leva o cliente para a pagina segura da Stripe.
      document.querySelectorAll(".payment-methods, .method-panel").forEach(el => { el.hidden = true; });
      const painel = document.querySelector("#payment-method")?.closest(".payment-panel");
      if (painel) {
        const aviso = document.createElement("p");
        aviso.textContent = "Você será levado à página segura de pagamento da Stripe para pagar com cartão. Seus dados de cartão não passam pelo site da Usinalink.";
        painel.appendChild(aviso);
      }
      const teste = document.querySelector(".test-warning"); if (teste) teste.textContent = "Ambiente de testes. Use o cartão 4242 4242 4242 4242, qualquer validade futura e qualquer CVV. Nenhuma cobrança real.";
      const pequeno = document.querySelector(".payment-summary small"); if (pequeno) pequeno.textContent = "Pagamento processado pela Stripe.";
      const botao = document.querySelector("[data-confirm-payment]"); if (botao) botao.textContent = "Pagar com cartão";
      if (params.get("stripe") === "cancelado") ui.showFeedback("Pagamento cancelado. Você pode tentar de novo quando quiser.", "info");
    }
    document.querySelector("[data-confirm-payment]")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      if (stripe) {
        button.disabled = true;
        button.textContent = "Abrindo pagamento...";
        try {
          window.location.href = await service.iniciarStripe(order);
        } catch (error) {
          ui.showFeedback(error.message, "error");
          button.disabled = false;
          button.textContent = "Pagar com cartão";
        }
        return;
      }
      const method = document.querySelector("#payment-method").value;
      if (!validatePayment(method)) return;
      button.disabled = true;
      button.textContent = "Processando...";
      try {
        await new Promise(resolve => window.setTimeout(resolve, 900));
        await service.savePayment(order, method);
        ui.showFeedback("Pagamento de teste confirmado.", "success");
        window.location.href = `confirmacao-pedido.html?pedidoId=${encodeURIComponent(order.id)}`;
      } catch (error) {
        ui.showFeedback(error.message, "error");
        button.disabled = false;
        button.textContent = "Confirmar pagamento";
      }
    });
  }

  async function renderReceiptPage() {
    const root = document.querySelector("[data-receipt-page]");
    if (!root) return;
    const alvo = root.querySelector(".app-main") || root;
    const order = await service.getOrder(params.get("pedidoId")).catch(() => null);
    if (!order) {
      alvo.innerHTML = '<div class="empty-state" role="status"><strong>Não foi possível abrir o comprovante</strong><span>Confira sua conexão e tente de novo, ou volte ao histórico de pedidos.</span><a class="btn btn-small" href="historico-pedidos.html">Ver histórico</a></div>';
      return;
    }
    const raw = order.pagamento;
    if (!raw && order.statusPedido !== "proposta_aceita") {
      alvo.innerHTML = `<div class="empty-state" role="status"><strong>Este pedido não tem comprovante</strong><span>${order.statusPedido === "cancelado" ? "O pedido foi cancelado." : "O comprovante aparece depois do pagamento, que é liberado quando uma proposta é aceita."}</span><a class="btn btn-small" href="${detailsLink(order)}">Ver o pedido</a></div>`;
      return;
    }
    if (!raw) {
      // Nunca paga sozinho ao abrir a tela: sem pagamento, orienta o usuário.
      const aviso = document.createElement("div");
      aviso.className = "empty-state";
      aviso.setAttribute("role", "status");
      aviso.innerHTML = '<strong>Este pedido ainda não foi pago</strong><span>O comprovante aparece depois do pagamento.</span>';
      const link = document.createElement("a");
      link.className = "btn btn-primary";
      link.href = "pagamento-pedido.html?pedidoId=" + encodeURIComponent(params.get("pedidoId") || "");
      link.textContent = "Ir para o pagamento";
      aviso.appendChild(link);
      alvo.replaceChildren(aviso);
      return;
    }
    const payment = {
      method: raw.metodo || raw.method || "PIX",
      protocol: raw.protocol || "USL-" + String(raw.idPagamento ?? raw.id ?? "").padStart(6, "0"),
      createdAt: raw.dataPagamento || raw.createdAt || new Date().toISOString(),
    };
    const set = (sel, val) => document.querySelectorAll(sel).forEach(el => { el.textContent = val; });
    const usina = order.usinaDados || {};
    const comprador = order.empresaDados || {};
    const nomeUsina = order.usina;
    const total = order.totals.total;
    const frete = Number(order.frete || 0);
    set("[data-order-number]", ui.orderNumber(order.id));
    set("[data-receipt-date]", ui.formatDateTime(payment.createdAt));
    set("[data-receipt-method]", payment.method);
    set("[data-receipt-deadline]", order.prazo);
    set("[data-receipt-total]", ui.formatCurrency(total));
    set("[data-receipt-address]", order.endereco);
    set("[data-receipt-protocol], [data-receipt-protocol-2], [data-receipt-protocol-3]", payment.protocol);
    set("[data-danfe-emitente], [data-danfe-emitente-2]", nomeUsina);
    set("[data-danfe-emitente-info]", [usina.email, usina.telefone].filter(Boolean).join(" · "));
    const protegido = service.currentSession().tipo === "usina" ? "Dado protegido" : "-";
    set("[data-danfe-emitente-cnpj]", usina.cnpj || "-");
    set("[data-danfe-dest]", order.empresa);
    set("[data-danfe-dest-doc]", comprador.cnpj || comprador.cpf || protegido);
    set("[data-danfe-dest-fone]", comprador.telefone || protegido);
    set("[data-danfe-produtos]", ui.formatCurrency(order.totals.subtotal));
    set("[data-danfe-frete]", ui.formatCurrency(frete));
    set("[data-danfe-taxa]", ui.formatCurrency(order.totals.taxes));
    set("[data-danfe-total]", ui.formatCurrency(total));
    const unitario = Number(order.quantidade) ? order.totals.subtotal / Number(order.quantidade) : order.totals.subtotal;
    document.querySelector("[data-receipt-items]").innerHTML = `<tr><td>${ui.escapeHtml(String(order.id).padStart(5, "0"))}</td><td>${ui.escapeHtml(order.peca)}</td><td>UN</td><td>${ui.escapeHtml(order.quantidade)}</td><td>${ui.formatCurrency(unitario)}</td><td>${ui.formatCurrency(order.totals.subtotal)}</td></tr>`;
    document.querySelector("[data-print-receipt]")?.addEventListener("click", () => window.print());
    document.querySelector("[data-share-receipt]")?.addEventListener("click", async () => {
      const text = `Pedido ${ui.orderNumber(order.id)} confirmado no UsinaLink. Total ${ui.formatCurrency(order.totals.total)}.`;
      if (navigator.share) await navigator.share({ title: "Comprovante UsinaLink", text, url: window.location.href });
      else await navigator.clipboard?.writeText(`${text} ${window.location.href}`);
      ui.showFeedback("Comprovante compartilhado ou copiado.", "success");
    });
  }

  function acaoPendente(order) {
    if (service.currentSession().tipo === "usina") return "";
    if (order.statusPedido === "proposta_aceita" && order.statusPagamento !== "Pago") return `<a class="table-action" href="${paymentLink(order)}">Pagar pedido</a>`;
    if (order.statusPedido === "em_producao") return `<a class="table-action" href="${detailsLink(order)}">Confirmar entrega</a>`;
    return "";
  }

  async function renderHistoryPage() {
    const table = document.querySelector("[data-history-body]");
    const cards = document.querySelector("[data-history-cards]");
    if (!table || !cards) return;
    let orders = await service.getOrders();
    const render = () => {
      const status = document.querySelector("[data-history-filter].active")?.dataset.historyFilter || "Todos";
      const query = (document.querySelector("[data-history-search]")?.value || "").toLowerCase();
      const date = document.querySelector("[data-history-date]")?.value || "";
      const filtered = orders.filter(order => {
        const haystack = `${order.id} ${order.empresa} ${order.usina} ${order.peca} ${order.statusPedido} ${order.statusPagamento}`.toLowerCase();
        const dateOk = !date || String(order.dataCriacao || "").startsWith(date);
        const statusOk = status === "Todos" || order.statusPedido === status || (status === "Pago" && order.statusPagamento === "Pago") || (status === "Aguardando pagamento" && order.statusPedido === "proposta_aceita" && order.statusPagamento !== "Pago");
        return haystack.includes(query) && dateOk && statusOk;
      });
      table.innerHTML = filtered.map(order => `<tr><td>${ui.orderNumber(order.id)}</td><td>${ui.formatDate(order.dataCriacao)}</td><td>${ui.escapeHtml(order.empresa)}</td><td>${ui.escapeHtml(order.usina)}</td><td>${ui.escapeHtml(order.peca)}</td><td>${ui.formatCurrency(order.totals.total)}</td><td>${ui.escapeHtml(order.formaPagamento)}</td><td>${ui.statusBadge(statusParaUsina(order))}</td><td>${ui.statusBadge(order.statusPagamento)}</td><td>${ui.escapeHtml(order.prazo)}</td><td><a class="table-action" href="${detailsLink(order)}">Ver detalhes</a>${acaoPendente(order)}${order.statusPagamento === "Pago" ? `<a class="table-action" href="${receiptLink(order)}">Ver comprovante</a>` : ""}</td></tr>`).join("");
      cards.innerHTML = filtered.map(order => `<article class="card history-mobile-card"><strong>${ui.orderNumber(order.id)} - ${ui.escapeHtml(order.peca)}</strong><span>${ui.escapeHtml(order.empresa)} / ${ui.escapeHtml(order.usina)}</span><span>${ui.formatCurrency(order.totals.total)}</span><div>${ui.statusBadge(order.statusPagamento)}</div><a class="btn btn-small" href="${detailsLink(order)}">Ver detalhes</a></article>`).join("");
      document.querySelector("[data-history-empty]").hidden = Boolean(filtered.length);
    };
    document.querySelectorAll("[data-history-filter]").forEach(button => button.addEventListener("click", () => {
      document.querySelectorAll("[data-history-filter]").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      render();
    }));
    document.querySelector("[data-history-search]")?.addEventListener("input", render);
    document.querySelector("[data-history-date]")?.addEventListener("input", render);
    render();
  }

  async function renderDetailsPage() {
    const root = document.querySelector("[data-details-page]");
    if (!root) return;
    const idPedido = params.get("pedidoId");
    const order = idPedido ? await service.getOrder(idPedido).catch(() => null) : null;
    if (!order) {
      const pf = service.currentSession().tipo === "pessoa_fisica";
      root.innerHTML = `<header class="page-header premium-header"><div><span class="eyebrow">Detalhes do pedido</span><h1>${idPedido ? "Pedido não encontrado" : "Nenhum pedido selecionado"}</h1><p>${idPedido ? "Não achamos este pedido na sua conta. Ele pode ter sido removido." : "Escolha um pedido na lista para ver os detalhes."}</p></div></header><div class="empty-state" role="status"><strong>Veja seus pedidos</strong><span>O histórico mostra todos os pedidos e o andamento de cada um.</span><a class="btn btn-small" href="historico-pedidos.html">${pf ? "Ver meus pedidos" : "Ver histórico de pedidos"}</a></div>`;
      return;
    }
    document.querySelector("[data-detail-title]").textContent = `${ui.orderNumber(order.id)} - ${order.peca}`;
    document.querySelector("[data-detail-description]").textContent = order.descricao || "Pedido em acompanhamento.";
    document.querySelector("[data-detail-facts]").innerHTML = `
      <div><span>Comprador</span><strong>${ui.escapeHtml(order.empresa)}</strong></div>
      <div><span>Usina</span><strong>${ui.escapeHtml(order.usina)}</strong></div>
      <div><span>Status</span>${ui.statusBadge(statusParaUsina(order))}</div>
      <div><span>Pagamento</span>${ui.statusBadge(order.statusPagamento)}</div>
      <div><span>Total</span><strong>${ui.formatCurrency(order.totals.total)}</strong></div>
      <div><span>Prazo</span><strong>${ui.escapeHtml(order.prazo)}</strong></div>
      <div><span>Endereco</span><strong>${ui.escapeHtml(order.endereco)}</strong></div>
      <div><span>Anexo</span><strong>${ui.escapeHtml(order.arquivo || "Sem anexo")}</strong></div>`;
    const STEP_ORDER = ["aberto", "em_negociacao", "proposta_aceita", "em_producao", "concluido"];
    const steps = ["Pedido criado", "Proposta recebida", "Proposta aceita", "Pagamento realizado", "Pedido concluido"];
    const cancelado = order.statusPedido === "cancelado";
    const currentIndex = STEP_ORDER.indexOf(order.statusPedido);
    document.querySelector("[data-detail-timeline]").innerHTML = cancelado
      ? `<li class="cancelled"><span>X</span><strong>Pedido cancelado</strong></li>`
      : steps.map((step, index) => `<li class="${index <= currentIndex ? "done" : ""}"><span>${index + 1}</span><strong>${step}</strong></li>`).join("");
    const isUsina = service.currentSession().tipo === "usina";
    let passo = root.querySelector("[data-detail-next]");
    if (!passo) {
      passo = document.createElement("div");
      passo.className = "card detail-card";
      passo.dataset.detailNext = "";
      root.querySelector(".detail-layout")?.before(passo);
    }
    passo.innerHTML = `<h2>Proximo passo</h2><p>${ui.escapeHtml(proximoPasso(order, isUsina))}</p>`;
    const receiptButton = document.querySelector("[data-detail-receipt]");
    if (receiptButton) receiptButton.hidden = order.statusPagamento !== "Pago";
    if (receiptButton) receiptButton.href = receiptLink(order);
    const payButton = document.querySelector("[data-detail-pay]");
    if (payButton) {
      payButton.hidden = isUsina || order.statusPagamento === "Pago" || order.statusPedido !== "proposta_aceita";
      payButton.href = paymentLink(order);
    }
    const actions = root.querySelector(".card-actions");
    let avaliar = actions?.querySelector("[data-detail-review]");
    if (actions && !avaliar) {
      avaliar = document.createElement("a");
      avaliar.className = "btn";
      avaliar.dataset.detailReview = "";
      avaliar.textContent = "Avaliar usina";
      actions.appendChild(avaliar);
    }
    if (avaliar) {
      avaliar.hidden = isUsina || order.statusPedido !== "concluido";
      avaliar.href = service.currentSession().tipo === "pessoa_fisica" ? "avaliacoes-pessoa-fisica.html" : "avaliacoes-empresa.html";
    }
    const confirmButton = document.querySelector("[data-detail-confirm-delivery]");
    if (confirmButton) {
      confirmButton.hidden = order.statusPedido !== "em_producao";
      confirmButton.onclick = async () => {
        confirmButton.disabled = true;
        confirmButton.textContent = "Confirmando...";
        try {
          await service.confirmarEntrega(order);
          ui.showFeedback("Entrega confirmada com sucesso.", "success");
          await renderDetailsPage();
        } catch (error) {
          ui.showFeedback(error.message, "error");
          confirmButton.disabled = false;
          confirmButton.textContent = "Confirmar entrega";
        }
      };
    }
  }

  renderPaymentsPage();
  renderPaymentPage();
  renderReceiptPage();
  renderHistoryPage();
  renderDetailsPage();
}());
