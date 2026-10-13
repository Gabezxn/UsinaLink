(function () {
  const { api, usinaCard, emptyState, favoritos } = window.PF;
  const grade = document.querySelector("[data-usinas]");
  const ordem = document.querySelector("[data-ordem]");
  let usinas = [];

  function ordenar() {
    const criterio = ordem.value;
    return [...usinas].sort((a, b) => {
      if (criterio === "nota") return (b.mediaAvaliacoes - a.mediaAvaliacoes) || (b.quantidadeAvaliacoes - a.quantidadeAvaliacoes);
      if (criterio === "pecas") return b.quantidadePecas - a.quantidadePecas;
      return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
    });
  }

  function render() {
    grade.innerHTML = usinas.length ? ordenar().map(usinaCard).join("") : emptyState("Nenhuma usina cadastrada", "Assim que houver usinas, elas aparecem aqui.");
    favoritos.pintar(grade);
    // reaplica a busca de texto ja digitada
    document.querySelector(".js-table-search")?.dispatchEvent(new Event("input"));
  }

  ordem.addEventListener("change", render);

  api().get("/usinas/diretorio")
    .then((lista) => { usinas = lista; render(); })
    .catch((error) => { grade.innerHTML = emptyState("Falha ao carregar as usinas", error.message); });
}());
