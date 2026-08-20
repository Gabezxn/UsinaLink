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

  function applySharedRoleNav() {
    const nav = document.querySelector("[data-role-nav]");
    const session = service.currentSession();
    const sharedPage = /historico-pedidos|detalhes-pedido/.test(window.location.pathname);
    if (!nav || !sharedPage) return;
    const isUsina = session.tipo === "usina";
    document.body.classList.toggle("orange-mode", isUsina);
    nav.dataset.roleNav = isUsina ? "usina" : "empresa";
    nav.className = isUsina ? "side-nav orange-nav" : "side-nav";
    nav.innerHTML = isUsina ? `
        <a href="dashboard-usina.html" data-icon="D">Dashboard usina</a>
        <a href="perfil-usina.html" data-icon="I">Perfil</a>
        <a href="funcionarios-usina.html" data-icon="F">Funcion&aacute;rios</a>
        <a href="pedidos-disponiveis.html" data-icon="P">Pedidos dispon&iacute;veis</a>
        <a href="propostas-usina.html" data-icon="E">Propostas enviadas</a>
        <a class="active" href="historico-pedidos.html" data-icon="H">Hist&oacute;rico relacionado</a>
        <a href="avaliacoes-usina.html" data-icon="A">Avalia&ccedil;&otilde;es recebidas</a>
        <a href="index.html" data-icon="X">Sair</a>` : `
        <a href="dashboard-empresa.html" data-icon="D">Dashboard empresa</a>
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
    setMethod("PIX");
    document.querySelector("[data-confirm-payment]")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
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
    const order = await service.getOrder(params.get("pedidoId"));
    if (!order) return;
    const payment = order.pagamento || await service.savePayment(order, "PIX");
    document.querySelectorAll("[data-order-number]").forEach(item => item.textContent = ui.orderNumber(order.id));
    document.querySelector("[data-receipt-date]").textContent = ui.formatDateTime(payment.createdAt);
    document.querySelector("[data-receipt-method]").textContent = payment.method;
    document.querySelector("[data-receipt-deadline]").textContent = order.prazo;
    document.querySelector("[data-receipt-total]").textContent = ui.formatCurrency(order.totals.total);
    document.querySelector("[data-receipt-address]").textContent = order.endereco;
    document.querySelector("[data-receipt-protocol]").textContent = payment.protocol;
    document.querySelector("[data-receipt-items]").innerHTML = `<tr><td>${ui.escapeHtml(order.peca)}</td><td>${ui.escapeHtml(order.quantidade)}</td><td>${ui.formatCurrency(order.totals.subtotal)}</td><td>${ui.formatCurrency(order.totals.total)}</td></tr>`;
    document.querySelector("[data-print-receipt]")?.addEventListener("click", () => window.print());
    document.querySelector("[data-share-receipt]")?.addEventListener("click", async () => {
      const text = `Pedido ${ui.orderNumber(order.id)} confirmado no UsinaLink. Total ${ui.formatCurrency(order.totals.total)}.`;
      if (navigator.share) await navigator.share({ title: "Comprovante UsinaLink", text, url: window.location.href });
      else await navigator.clipboard?.writeText(`${text} ${window.location.href}`);
      ui.showFeedback("Comprovante compartilhado ou copiado.", "success");
    });
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
      table.innerHTML = filtered.map(order => `<tr><td>${ui.orderNumber(order.id)}</td><td>${ui.formatDate(order.dataCriacao)}</td><td>${ui.escapeHtml(order.empresa)}</td><td>${ui.escapeHtml(order.usina)}</td><td>${ui.escapeHtml(order.peca)}</td><td>${ui.formatCurrency(order.totals.total)}</td><td>${ui.escapeHtml(order.formaPagamento)}</td><td>${ui.statusBadge(order.statusPedido)}</td><td>${ui.statusBadge(order.statusPagamento)}</td><td>${ui.escapeHtml(order.prazo)}</td><td><a class="table-action" href="${detailsLink(order)}">Ver detalhes</a>${order.statusPagamento === "Pago" ? `<a class="table-action" href="${receiptLink(order)}">Ver comprovante</a>` : ""}</td></tr>`).join("");
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
      <div><span>Status</span>${ui.statusBadge(order.statusPedido)}</div>
      <div><span>Pagamento</span>${ui.statusBadge(order.statusPagamento)}</div>
      <div><span>Total</span><strong>${ui.formatCurrency(order.totals.total)}</strong></div>
      <div><span>Prazo</span><strong>${ui.escapeHtml(order.prazo)}</strong></div>
      <div><span>Endereco</span><strong>${ui.escapeHtml(order.endereco)}</strong></div>
      <div><span>Anexo</span><strong>${ui.escapeHtml(order.arquivo || "Sem anexo")}</strong></div>`;
    const steps = ["Pedido criado", "Proposta recebida", "Proposta aceita", "Pagamento realizado", "Producao iniciada", "Pedido enviado", "Pedido concluido"];
    const paid = order.statusPagamento === "Pago";
    document.querySelector("[data-detail-timeline]").innerHTML = steps.map((step, index) => `<li class="${index < (paid ? 5 : 3) ? "done" : ""}"><span>${index + 1}</span><strong>${step}</strong></li>`).join("");
    const receiptButton = document.querySelector("[data-detail-receipt]");
    if (receiptButton) receiptButton.hidden = order.statusPagamento !== "Pago";
    if (receiptButton) receiptButton.href = receiptLink(order);
    document.querySelector("[data-detail-pay]").href = paymentLink(order);
  }

  applySharedRoleNav();
  renderPaymentsPage();
  renderPaymentPage();
  renderReceiptPage();
  renderHistoryPage();
  renderDetailsPage();
}());
