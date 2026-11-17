(function () {
  const params = new URLSearchParams(window.location.search);
  const pedidoId = params.get("pedidoId");

  function notify(message) {
    if (window.showToast) window.showToast(message);
  }

  function showError(message, field) {
    const el = document.querySelector("#proposal-error");
    document.querySelectorAll("#proposal-value, #proposal-deadline, #proposal-freight").forEach((i) => i.removeAttribute("aria-invalid"));
    if (!el) { notify(message); return; }
    el.textContent = message || "";
    el.hidden = !message;
    if (field && message) { field.setAttribute("aria-invalid", "true"); field.focus(); }
  }

  function esc(value) {
    return typeof escapeHtml === "function" ? escapeHtml(value ?? "") : String(value ?? "");
  }

  function parseMoney(value) {
    // Vírgula = decimal (pontos são milhar). Sem vírgula: "1.500" é milhar, "1500.50" e "380.5" são decimais.
    let clean = String(value || "").replace(/[^\d,.-]/g, "");
    if (clean.includes(",")) clean = clean.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(clean)) clean = clean.replace(/\./g, "");
    const number = Number(clean);
    return Number.isFinite(number) ? number : null;
  }

  // Prazo em dias (so o numero); a unidade (dias ou meses) e escolhida sozinha por formatPrazo.
  function prazoDigitado(value) {
    const n = parseInt(String(value || "").replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
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
      if (!["aberto", "em_negociacao"].includes(pedido.status)) {
        showError("Este pedido não recebe mais propostas.");
        if (sendButton) sendButton.disabled = true;
      }
      const item = (pedido.itens && pedido.itens[0]) || {};
      card.querySelector("h2").textContent = item.nome || "Pedido industrial";
      card.querySelector(".quote-facts").innerHTML = `
        <div><span>Peça</span><strong>${esc(item.nome || "Não informado")}</strong></div>
        <div><span>Material</span><strong>${esc(item.material || "Não informado")}</strong></div>
        <div><span>Quantidade</span><strong>${esc(item.quantidade || "Não informado")}</strong></div>
        <div><span>Prazo desejado</span><strong>${esc(pedido.prazoEntregaDias ? formatPrazo(pedido.prazoEntregaDias) : "A combinar")}</strong></div>
        <div><span>Empresa</span><strong>${esc(pedido.empresaCompradora?.nomeFantasia || pedido.empresaCompradora?.razaoSocial || "-")}</strong></div>
        <div><span>Categoria</span><strong>${esc(item.categoria || "Não informado")}</strong></div>
        <div><span>Urgência</span><strong>${esc(formatUrgencia(pedido.urgencia))}</strong></div>`;
      return pedido;
    } catch (error) {
      card.innerHTML = `<p>Não foi possível carregar este pedido: ${esc(error.message)}</p>`;
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
    document.querySelector("#preview-deadline").textContent = prazoDigitado(deadline.value) ? formatPrazo(prazoDigitado(deadline.value)) : "A combinar";
    const dica = document.querySelector("#deadline-hint");
    if (dica) dica.textContent = prazoDigitado(deadline.value) ? `Será mostrado como: ${formatPrazo(prazoDigitado(deadline.value))}` : "Digite só o número de dias. Prazos de 30, 60, 90 dias… aparecem em meses automaticamente.";
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
      showError("");
      if (!pedidoId) { showError("Nenhum pedido selecionado."); return; }
      if (!valorNum || valorNum <= 0) { showError("Informe um valor válido para a proposta.", value); return; }
      if (!prazoDigitado(deadline.value)) { showError("Informe o prazo de fabricação em dias (número maior que zero).", deadline); return; }

      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Enviando...";
      try {
        await window.UsinaLinkApi.post("/propostas", {
          pedidoId,
          valor: String(valorNum),
          prazo: formatPrazo(prazoDigitado(deadline.value)),
          frete: freight.value.trim() ? String(parseMoney(freight.value) ?? "") : undefined,
          observacao: note.value.trim() || undefined,
        });
        notify("Proposta enviada com sucesso");
        window.setTimeout(() => { window.location.href = "propostas-usina.html"; }, 800);
      } catch (error) {
        showError(error.message);
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  }


  // Frete estimado: mesmo estado, mesma regiao ou outra regiao, mais um adicional por quantidade.
  const REGIAO = { AC: "N", AP: "N", AM: "N", PA: "N", RO: "N", RR: "N", TO: "N", AL: "NE", BA: "NE", CE: "NE", MA: "NE", PB: "NE", PE: "NE", PI: "NE", RN: "NE", SE: "NE", DF: "CO", GO: "CO", MT: "CO", MS: "CO", ES: "SE", MG: "SE", RJ: "SE", SP: "SE", PR: "S", RS: "S", SC: "S" };
  function ufDe(texto) {
    const achados = (String(texto || "").toUpperCase().match(/\b[A-Z]{2}\b/g) || []).filter((uf) => REGIAO[uf]);
    return achados.length ? achados[achados.length - 1] : "";
  }
  function calcularFrete(ufOrigem, ufDestino, quantidade) {
    const base = !ufOrigem || !ufDestino ? 500 : ufOrigem === ufDestino ? 150 : REGIAO[ufOrigem] === REGIAO[ufDestino] ? 400 : 750;
    return base + Math.min(Math.max(Number(quantidade) || 1, 1) * 5, 300);
  }
  async function aplicarFrete(pedido) {
    const campo = document.querySelector("#proposal-freight");
    if (!campo || !pedido) return;
    let ufOrigem = "";
    try {
      const perfil = await window.UsinaLinkApi.get("/usinas/perfil");
      ufOrigem = ufDe((perfil.endereco && perfil.endereco.estado) || perfil.estado);
    } catch { /* sem endereco da usina: usa o valor base */ }
    const valor = calcularFrete(ufOrigem, ufDe(pedido.localEntrega), pedido.itens && pedido.itens[0] && pedido.itens[0].quantidade);
    campo.value = valor.toFixed(2).replace(".", ",");
    campo.dispatchEvent(new Event("input", { bubbles: true }));
  }

  loadPedido().then(aplicarFrete);
  bindPreview();
  bindSubmit();
}());
