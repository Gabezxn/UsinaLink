(function () {
  const { api, esc, pecaCard, emptyState, favoritos } = window.PF;
  const grade = document.querySelector("[data-catalogo]");
  const filtros = document.querySelector("[data-categorias]");
  let selecionadas = new Set();

  // a busca de texto (script.js) usa a classe is-hidden; o filtro de categoria usa cat-hidden
  function aplicarCategoria() {
    grade.querySelectorAll("[data-search-row]").forEach((card) => {
      card.classList.toggle("cat-hidden", selecionadas.size > 0 && !selecionadas.has(card.dataset.categoria));
    });
  }

  async function carregar() {
    try {
      const pecas = await api().get("/pecas-comerciais");
      if (!pecas.length) {
        grade.innerHTML = emptyState("Nenhuma peça no catálogo", "As usinas ainda não cadastraram peças comerciais.");
        return;
      }
      grade.innerHTML = pecas.map(pecaCard).join("");

      const categorias = [...new Set(pecas.map((p) => p.categoria).filter(Boolean))];
      filtros.innerHTML = categorias.length
        ? categorias.map((c) => `<label class="check-chip"><input type="checkbox" value="${esc(c)}" data-cat> ${esc(c)}</label>`).join("")
        : "";
      filtros.querySelectorAll("[data-cat]").forEach((caixa) => caixa.addEventListener("change", () => {
        selecionadas = new Set([...filtros.querySelectorAll("[data-cat]:checked")].map((c) => c.value));
        aplicarCategoria();
      }));
      await favoritos.pintar(grade);
    } catch (error) {
      grade.innerHTML = emptyState("Falha ao carregar o catálogo", error.message);
    }
  }

  carregar();
}());
