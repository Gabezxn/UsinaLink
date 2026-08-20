(function () {
  function esc(value) {
    return typeof escapeHtml === "function" ? escapeHtml(value ?? "") : String(value ?? "");
  }

  function money(value) {
    return typeof formatMoneyBR === "function" ? formatMoneyBR(value) : `R$ ${Number(value || 0).toFixed(2)}`;
  }

  function parseMoney(value) {
    const clean = String(value || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const number = Number(clean);
    return Number.isFinite(number) ? number : null;
  }

  function pecaRowMarkup(peca) {
    return `<tr data-search-row data-peca-id="${esc(peca.idPecaComercial)}">
      <td>${esc(peca.nome)}</td>
      <td>${esc(peca.material || "-")}</td>
      <td>${esc(peca.estoque != null ? `${peca.estoque} ${peca.unidadeEstoque || "unidades"}` : "-")}</td>
      <td>${esc(peca.valorUnitario != null ? money(peca.valorUnitario) : "-")}</td>
      <td>${esc(peca.prazoEntregaDias ? peca.prazoEntregaDias + " dias" : "A combinar")}</td>
      <td><button class="table-action js-remove-peca" type="button">Remover</button></td>
    </tr>`;
  }

  async function loadMinhasPecas() {
    const body = document.querySelector("[data-pecas-comerciais-body]");
    if (!body || !window.UsinaLinkApi) return;
    try {
      const pecas = await window.UsinaLinkApi.get("/pecas-comerciais/minhas");
      body.innerHTML = pecas.length
        ? pecas.map(pecaRowMarkup).join("")
        : '<tr><td colspan="6" style="text-align:center; padding: 24px;">Nenhuma peça cadastrada ainda.</td></tr>';
    } catch (error) {
      body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;">Falha ao carregar: ${esc(error.message)}</td></tr>`;
    }
  }

  const modal = document.querySelector("#peca-modal");
  const form = document.querySelector("#peca-form");

  document.querySelector(".js-open-peca-modal")?.addEventListener("click", () => {
    if (!modal) return;
    form?.reset();
    modal.hidden = false;
  });

  function closePecaModal() {
    if (modal) modal.hidden = true;
  }

  document.querySelectorAll(".js-close-peca-modal").forEach((button) => button.addEventListener("click", closePecaModal));
  modal?.addEventListener("click", (event) => { if (event.target === modal) closePecaModal(); });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Salvando...";
    try {
      const valor = parseMoney(data.get("valorUnitario"));
      await window.UsinaLinkApi.post("/pecas-comerciais", {
        nome: data.get("nome"),
        material: data.get("material") || undefined,
        categoria: data.get("categoria") || undefined,
        descricao: data.get("descricao") || undefined,
        estoque: data.get("estoque") || undefined,
        unidadeEstoque: data.get("unidadeEstoque") || undefined,
        valorUnitario: valor != null ? String(valor) : undefined,
        prazoEntregaDias: data.get("prazoEntregaDias") || undefined,
      });
      if (window.showToast) window.showToast("Peça adicionada ao catálogo");
      closePecaModal();
      await loadMinhasPecas();
    } catch (error) {
      if (window.showToast) window.showToast(error.message);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest(".js-remove-peca");
    if (!button) return;
    const row = button.closest("[data-peca-id]");
    const id = row?.dataset.pecaId;
    if (!id) return;
    button.disabled = true;
    try {
      await window.UsinaLinkApi.delete(`/pecas-comerciais/${id}`);
      row.remove();
    } catch (error) {
      if (window.showToast) window.showToast(error.message);
      button.disabled = false;
    }
  });

  loadMinhasPecas();
}());
