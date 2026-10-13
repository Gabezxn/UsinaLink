(function () {
  const { api, esc, pecaCard, emptyState, favoritos } = window.PF;
  const grade = document.querySelector("[data-catalogo]");
  const filtros = document.querySelector("[data-categorias]");
  let categoria = "todas";

  // a busca de texto (script.js) usa a classe is-hidden; o filtro de categoria usa cat-hidden
  function aplicarCategoria() {
    grade.querySelectorAll("[data-search-row]").forEach((card) => {
      card.classList.toggle("cat-hidden", categoria !== "todas" && card.dataset.categoria !== categoria);
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
        ? ['<button class="filter-pill active" type="button" data-cat="todas">Todas</button>']
            .concat(categorias.map((c) => `<button class="filter-pill" type="button" data-cat="${esc(c)}">${esc(c)}</button>`)).join("")
        : "";
      filtros.querySelectorAll("[data-cat]").forEach((botao) => botao.addEventListener("click", () => {
        filtros.querySelectorAll("[data-cat]").forEach((b) => b.classList.remove("active"));
        botao.classList.add("active");
        categoria = botao.dataset.cat;
        aplicarCategoria();
      }));
      await favoritos.pintar(grade);
    } catch (error) {
      grade.innerHTML = emptyState("Falha ao carregar o catálogo", error.message);
    }
  }

  carregar();
}());
