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

  let pecasPorId = {};
  let editandoId = null;

  function pecaRowMarkup(peca) {
    return `<tr data-search-row data-peca-id="${esc(peca.idPecaComercial)}">
      <td>${esc(peca.nome)}</td>
      <td>${esc(peca.material || "-")}</td>
      <td>${esc(peca.estoque != null ? `${peca.estoque} ${peca.unidadeEstoque || "unidades"}` : "-")}</td>
      <td>${esc(peca.valorUnitario != null ? money(peca.valorUnitario) : "-")}</td>
      <td>${esc(peca.prazoEntregaDias ? peca.prazoEntregaDias + " dias" : "A combinar")}</td>
      <td><button class="table-action js-edit-peca" type="button">Editar</button><button class="table-action js-remove-peca" type="button">Remover</button></td>
    </tr>`;
  }

  async function loadMinhasPecas() {
    const body = document.querySelector("[data-pecas-comerciais-body]");
    if (!body || !window.UsinaLinkApi) return;
    try {
      const pecas = await window.UsinaLinkApi.get("/pecas-comerciais/minhas");
      pecasPorId = Object.fromEntries(pecas.map((p) => [String(p.idPecaComercial), p]));
      body.innerHTML = pecas.length
        ? pecas.map(pecaRowMarkup).join("")
        : '<tr><td colspan="6" style="text-align:center; padding: 24px;">Nenhuma peça cadastrada ainda.</td></tr>';
    } catch (error) {
      body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;">Falha ao carregar: ${esc(error.message)}</td></tr>`;
    }
  }

  const modal = document.querySelector("#peca-modal");
  const form = document.querySelector("#peca-form");

  function abrirModal(peca) {
    if (!modal || !form) return;
    form.reset();
    editandoId = peca ? String(peca.idPecaComercial) : null;
    document.querySelector("#peca-modal-title").textContent = peca ? "Editar peça" : "Adicionar peça";
    form.querySelector('button[type="submit"]').textContent = peca ? "Salvar alterações" : "Salvar peça";
    if (peca) {
      const set = (name, value) => { form.elements[name].value = value ?? ""; };
      set("nome", peca.nome);
      set("material", peca.material);
      set("categoria", peca.categoria);
      set("descricao", peca.descricao);
      set("estoque", peca.estoque);
      set("unidadeEstoque", peca.unidadeEstoque);
      set("valorUnitario", peca.valorUnitario != null ? Number(peca.valorUnitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "");
      set("prazoEntregaDias", peca.prazoEntregaDias);
    }
    modal.hidden = false;
  }

  document.querySelector(".js-open-peca-modal")?.addEventListener("click", () => abrirModal(null));

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
      const editando = editandoId !== null;
      // Na edicao, campo vazio vai como "" para limpar o valor; na criacao, simplesmente nao vai.
      const opcional = (nome) => (data.get(nome) || (editando ? "" : undefined));
      const payload = {
        nome: data.get("nome"),
        material: opcional("material"),
        categoria: opcional("categoria"),
        descricao: opcional("descricao"),
        estoque: opcional("estoque"),
        unidadeEstoque: opcional("unidadeEstoque"),
        valorUnitario: valor != null ? String(valor) : (editando ? "" : undefined),
        prazoEntregaDias: opcional("prazoEntregaDias"),
      };
      if (editando) await window.UsinaLinkApi.patch(`/pecas-comerciais/${editandoId}`, payload);
      else await window.UsinaLinkApi.post("/pecas-comerciais", payload);
      if (window.showToast) window.showToast(editando ? "Peça atualizada" : "Peça adicionada ao catálogo");
      closePecaModal();
      await loadMinhasPecas();
    } catch (error) {
      if (window.showToast) window.showToast(error.message);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });

  document.addEventListener("click", (event) => {
    const editar = event.target.closest(".js-edit-peca");
    if (editar) {
      const peca = pecasPorId[editar.closest("[data-peca-id]")?.dataset.pecaId];
      if (peca) abrirModal(peca);
      return;
    }

    const button = event.target.closest(".js-remove-peca");
    if (!button) return;
    const row = button.closest("[data-peca-id]");
    const id = row?.dataset.pecaId;
    if (!id) return;
    const nome = pecasPorId[id]?.nome || row.firstElementChild?.textContent || "esta peça";
    // Só exclui depois do "Sim"; cancelar/Voltar apenas fecha o aviso.
    openSimpleConfirm({
      title: "Excluir peça",
      message: `Tem certeza que deseja excluir a peça ${nome}?`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      orange: true,
      onConfirm: async () => {
        try {
          await window.UsinaLinkApi.delete(`/pecas-comerciais/${id}`);
          row.remove();
          delete pecasPorId[id];
          if (window.showToast) window.showToast("Peça excluída do catálogo");
        } catch (error) {
          if (window.showToast) window.showToast(error.message);
        }
      }
    });
  });

  loadMinhasPecas();
}());
