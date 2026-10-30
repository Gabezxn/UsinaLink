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

  function proximoPasso(order, isUsina) {
    const pago = order.statusPagamento === "Pago";
    const status = order.statusPedido;
    if (status === "cancelado") return "Este pedido foi cancelado.";
    if (status === "concluido") return "Pedido concluido. A entrega foi confirmada pela empresa.";
    if (status === "em_producao") {
      return isUsina
        ? "Pagamento recebido. Produza o pedido; a empresa confirma a entrega quando receber."
        : "Pagamento confirmado. Quando receber a mercadoria, clique em \"Confirmar entrega\" para concluir o pedido.";
    }
    if (status === "proposta_aceita" && !pago) {
      return isUsina
        ? "Proposta aceita. Aguardando a empresa pagar o pedido."
        : "Proposta aceita. Proximo passo: clique em \"Pagar pedido\". Depois do pagamento, confirme a entrega para concluir.";
    }
    return "Aguardando a empresa aceitar uma proposta.";
  }

  function applySharedRoleNav() {
    const nav = document.querySelector("[data-role-nav]");
    const session = service.currentSession();
    const sharedPage = /historico-pedidos|detalhes-pedido|confirmacao-pedido/.test(window.location.pathname);
    if (!nav || !sharedPage) return;
    if (session.tipo === "pessoa_fisica") return; // o menu da PF vem de pf-nav.js
    const isUsina = session.tipo === "usina";
    document.body.classList.toggle("orange-mode", isUsina);
    document.querySelector(".sidebar .brand-icon")?.classList.toggle("orange-icon", isUsina);
    nav.dataset.roleNav = isUsina ? "usina" : "empresa";
    nav.className = isUsina ? "side-nav orange-nav" : "side-nav";
    nav.innerHTML = isUsina ? `
        <a href="dashboard-usina.html" data-icon="D">Início</a>
        <a href="perfil-usina.html" data-icon="I">Perfil</a>
        <a href="funcionarios-usina.html" data-icon="F">Funcion&aacute;rios</a>
        <a href="pedidos-disponiveis.html" data-icon="P">Pedidos dispon&iacute;veis</a>
        <a href="propostas-usina.html" data-icon="E">Propostas enviadas</a>
        <a href="solicitacoes-pecas-usina.html" data-icon="S">Solicita&ccedil;&otilde;es de pe&ccedil;as</a>
        <a href="pecas-comerciais-usina.html" data-icon="C">Cat&aacute;logo de pe&ccedil;as</a>
        <a class="active" href="historico-pedidos.html" data-icon="H">Hist&oacute;rico relacionado</a>
        <a href="avaliacoes-usina.html" data-icon="A">Avalia&ccedil;&otilde;es recebidas</a>
        <a href="index.html" data-icon="X">Sair</a>` : `
        <a href="dashboard-empresa.html" data-icon="D">Início</a>
        <a href="dashboard-pessoa-juridica.html" data-icon="P">Pe&ccedil;as comerciais</a>
        <a href="perfil-empresa.html" data-icon="I">Perfil</a>
        <a href="funcionarios.html" data-icon="F">Funcion&aacute;rios</a>
        <a href="solicitacoes.html" data-icon="S">Solicita&ccedil;&otilde;es</a>
        <a href="propostas.html" data-icon="R">Propostas recebidas</a>
        <a class="active" href="historico-pedidos.html" data-icon="H">Hist&oacute;rico de pedidos</a>
        <a href="avaliacoes.html" data-icon="A">Avalia&ccedil;&otilde;es</a>
        <a href="solicitacoes-bloqueio-usina.html" data-icon="B">Usinas bloqueadas</a>
        <a href="index.html" data-icon="X">Sair</a>`;
  }

  async function renderPaymentsPage() {
    const container = document.querySelector("[data-payments-list]");
    if (!container) return;
    container.innerHTML = '<div class="loading-state">Carregando pagamentos...</div>';
    const orders = await service.getOrders();
    const stat = document.querySelector("[data-stat-aguardando-pagamento]");
    if (stat) stat.textContent = orders.filter(order => order.statusPagamento !== "Pago").length;
    if (!orders.length) {
      container.innerHTML = '<div class="empty-state"><strong>Nenhum pedido encontrado</strong><span>Assim que houver propostas aceitas, os pedidos aparecem aqui.</span></div>';
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
          <div><span>Empresa</span><strong>${ui.escapeHtml(order.empresa || "Cliente")}</strong></div>
          <div><span>Usina</span><strong>${ui.escapeHtml(order.usina)}</strong></div>
          <div><span>Total</span><strong>${ui.formatCurrency(order.totals.total)}</strong></div>
          <div><span>Pagamento</span>${ui.statusBadge(order.statusPagamento)}</div>
        </div>
        <div class="card-actions">
          <a class="btn btn-ghost" href="${detailsLink(order)}">Ver detalhes</a>
          <a class="btn" href="${paymentLink(order)}">${order.statusPagamento === "Pago" ? "Ver pagamento" : "Pagar pedido"}</a>
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
    const order = await service.getOrder(params.get("pedidoId"));
    if (!order) {
      root.innerHTML = '<div class="empty-state"><strong>Pedido nao encontrado</strong><span>Volte para pagamentos e tente novamente.</span></div>';
      return;
    }
    const totals = order.totals;
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
    set("[data-danfe-emitente-cnpj]", usina.cnpj || "-");
    set("[data-danfe-dest]", order.empresa);
    set("[data-danfe-dest-doc]", comprador.cnpj || comprador.cpf || "-");
    set("[data-danfe-dest-fone]", comprador.telefone || "-");
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
        const statusOk = status === "Todos" || order.statusPedido === status || order.statusPagamento === status;
        return haystack.includes(query) && dateOk && statusOk;
      });
      table.innerHTML = filtered.map(order => `<tr><td>${ui.orderNumber(order.id)}</td><td>${ui.formatDate(order.dataCriacao)}</td><td>${ui.escapeHtml(order.empresa)}</td><td>${ui.escapeHtml(order.usina)}</td><td>${ui.escapeHtml(order.peca)}</td><td>${ui.formatCurrency(order.totals.total)}</td><td>${ui.escapeHtml(order.formaPagamento)}</td><td>${ui.statusBadge(statusPedidoLabel(order.statusPedido))}</td><td>${ui.statusBadge(order.statusPagamento)}</td><td>${ui.escapeHtml(order.prazo)}</td><td><a class="table-action" href="${detailsLink(order)}">Ver detalhes</a>${acaoPendente(order)}${order.statusPagamento === "Pago" ? `<a class="table-action" href="${receiptLink(order)}">Ver comprovante</a>` : ""}</td></tr>`).join("");
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
    const order = await service.getOrder(params.get("pedidoId"));
    if (!order) return;
    document.querySelector("[data-detail-title]").textContent = `${ui.orderNumber(order.id)} - ${order.peca}`;
    document.querySelector("[data-detail-description]").textContent = order.descricao || "Pedido em acompanhamento.";
    document.querySelector("[data-detail-facts]").innerHTML = `
      <div><span>Empresa</span><strong>${ui.escapeHtml(order.empresa)}</strong></div>
      <div><span>Usina</span><strong>${ui.escapeHtml(order.usina)}</strong></div>
      <div><span>Status</span>${ui.statusBadge(statusPedidoLabel(order.statusPedido))}</div>
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
    if (receiptButton) receiptButton.hidden = isUsina || order.statusPagamento !== "Pago";
    if (receiptButton) receiptButton.href = receiptLink(order);
    const payButton = document.querySelector("[data-detail-pay]");
    if (payButton) {
      payButton.hidden = isUsina || order.statusPagamento === "Pago" || order.statusPedido !== "proposta_aceita";
      payButton.href = paymentLink(order);
    }
    const confirmButton = document.querySelector("[data-detail-confirm-delivery]");
    if (confirmButton) {
      confirmButton.hidden = isUsina || order.statusPedido !== "em_producao";
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

  applySharedRoleNav();
  renderPaymentsPage();
  renderPaymentPage();
  renderReceiptPage();
  renderHistoryPage();
  renderDetailsPage();
}());
