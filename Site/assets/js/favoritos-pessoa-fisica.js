(function () {
  const { api, pecaCard, usinaCard, emptyState, favoritos } = window.PF;
  const grade = document.querySelector("[data-favoritos]");
  let filtro = "todos";
  let itens = []; // { tipo, id, html }

  function render() {
    const visiveis = itens.filter((i) => filtro === "todos" || i.tipo === filtro);
    grade.innerHTML = visiveis.length
      ? visiveis.map((i) => i.html).join("")
      : emptyState("Nada por aqui ainda", "Toque no coração (♡) de uma peça ou usina para guardá-la aqui.");
    favoritos.pintar(grade);
  }

  async function carregar() {
    try {
      const [lista, pecas, usinas] = await Promise.all([api().get("/favoritos"), api().get("/pecas-comerciais"), api().get("/usinas/diretorio")]);
      await favoritos.carregar();
      itens = lista.flatMap((f) => {
        if (f.tipo === "peca") {
          const peca = pecas.find((p) => p.idPecaComercial === f.idReferencia);
          return peca ? [{ tipo: "peca", id: f.idReferencia, html: pecaCard(peca) }] : [];
        }
        const usina = usinas.find((u) => u.idUsina === f.idReferencia);
        return usina ? [{ tipo: "usina", id: f.idReferencia, html: usinaCard(usina) }] : [];
      });
      render();
    } catch (error) {
      grade.innerHTML = emptyState("Falha ao carregar os favoritos", error.message);
    }
  }

  document.querySelectorAll("[data-fav-filtro]").forEach((botao) => botao.addEventListener("click", () => {
    document.querySelectorAll("[data-fav-filtro]").forEach((b) => b.classList.remove("active"));
    botao.classList.add("active");
    filtro = botao.dataset.favFiltro;
    render();
  }));

  // ao desfavoritar aqui, o card sai da lista
  document.addEventListener("pf:favorito", (event) => {
    if (event.detail.favorito) return;
    itens = itens.filter((i) => !(i.tipo === event.detail.tipo && String(i.id) === String(event.detail.id)));
    render();
  });

  carregar();
}());
