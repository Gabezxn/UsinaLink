(function () {
  const params = new URLSearchParams(window.location.search);
  const pedidoId = params.get("pedidoId");

  function notify(message) {
    if (window.showToast) window.showToast(message);
  }

  function esc(value) {
    return typeof escapeHtml === "function" ? escapeHtml(value ?? "") : String(value ?? "");
  }

  function parseMoney(value) {
    const clean = String(value || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const number = Number(clean);
    return Number.isFinite(number) ? number : null;
  }

  function formatBRL(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
  }

  async function loadPedido() {
    const card = document.querySelector(".quote-card");
    const sendButton = document.querySelector(".js-send-proposal");
    if (!card) return null;
    if (!pedidoId) {
      card.innerHTML = "<p>Nenhum pedido selecionado. Volte para <a href=\"pedidos-disponiveis.html\">Pedidos disponíveis</a> e escolha um pedido.</p>";
      if (sendButton) sendButton.disabled = true;
      return null;
    }
    try {
      const pedido = await window.UsinaLinkApi.get(`/pedidos/${pedidoId}`);
      const item = (pedido.itens && pedido.itens[0]) || {};
      card.querySelector("h2").textContent = item.nome || "Pedido industrial";
      card.querySelector(".quote-facts").innerHTML = `
        <div><span>Peca</span><strong>${esc(item.nome || "Nao informado")}</strong></div>
        <div><span>Material</span><strong>${esc(item.material || "Nao informado")}</strong></div>
        <div><span>Quantidade</span><strong>${esc(item.quantidade || "Nao informado")}</strong></div>
        <div><span>Prazo desejado</span><strong>${esc(pedido.prazoEntregaDias ? pedido.prazoEntregaDias + " dias" : "A combinar")}</strong></div>
        <div><span>Empresa</span><strong>${esc(pedido.empresaCompradora?.nomeFantasia || pedido.empresaCompradora?.razaoSocial || "-")}</strong></div>
        <div><span>Categoria</span><strong>${esc(item.categoria || "Nao informado")}</strong></div>
        <div><span>Urgencia</span><strong>${esc(pedido.urgencia || "Normal")}</strong></div>`;
      return pedido;
    } catch (error) {
      card.innerHTML = `<p>Nao foi possivel carregar este pedido: ${esc(error.message)}</p>`;
      if (sendButton) sendButton.disabled = true;
      return null;
    }
  }

  function updatePreview() {
    const value = document.querySelector("#proposal-value");
    const deadline = document.querySelector("#proposal-deadline");
    const freight = document.querySelector("#proposal-freight");
    const note = document.querySelector("#proposal-note");
    if (!value) return;
    const valorNum = parseMoney(value.value) || 0;
    const freteNum = parseMoney(freight.value) || 0;
    document.querySelector("#preview-total").textContent = formatBRL(valorNum + freteNum);
    document.querySelector("#preview-value").textContent = formatBRL(valorNum);
    document.querySelector("#preview-freight").textContent = formatBRL(freteNum);
    document.querySelector("#preview-deadline").textContent = deadline.value || "A combinar";
    document.querySelector("#preview-note").textContent = note.value || "Sem observações adicionais.";
  }

  function bindPreview() {
    document.querySelectorAll("#proposal-value, #proposal-deadline, #proposal-freight, #proposal-note").forEach((input) => {
      input.addEventListener("input", updatePreview);
    });
    updatePreview();
  }

  function bindSubmit() {
    const button = document.querySelector(".js-send-proposal");
    if (!button) return;
    button.addEventListener("click", async () => {
      if (button.disabled) return;
      const value = document.querySelector("#proposal-value");
      const deadline = document.querySelector("#proposal-deadline");
      const freight = document.querySelector("#proposal-freight");
      const note = document.querySelector("#proposal-note");
      const valorNum = parseMoney(value.value);
      if (!pedidoId) { notify("Nenhum pedido selecionado."); return; }
      if (!valorNum || valorNum <= 0) { notify("Informe um valor valido para a proposta."); return; }
      if (!deadline.value.trim()) { notify("Informe o prazo de fabricacao."); return; }

      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Enviando...";
      try {
        await window.UsinaLinkApi.post("/propostas", {
          pedidoId,
          valor: String(valorNum),
          prazo: deadline.value.trim(),
          frete: freight.value.trim() ? String(parseMoney(freight.value) ?? "") : undefined,
          observacao: note.value.trim() || undefined,
        });
        notify("Proposta enviada com sucesso");
        window.setTimeout(() => { window.location.href = "propostas-usina.html"; }, 800);
      } catch (error) {
        notify(error.message);
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  }

  loadPedido();
  bindPreview();
  bindSubmit();
}());
