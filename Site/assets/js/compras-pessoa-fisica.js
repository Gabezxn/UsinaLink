(function () {
  const { api, esc, money, date, statusBadge, FINALIZADOS } = window.PF;
  const corpo = document.querySelector("[data-compras]");
  let compras = [];
  let filtro = "todas";

  function grupo(compra) {
    if (compra.status === "entregue") return "entregue";
    if (FINALIZADOS.includes(compra.status)) return "encerrada";
    return "andamento";
  }

  function acaoRapida(c) {
    const href = `compra-pessoa-fisica.html?id=${esc(c.idSolicitacaoComercial)}`;
    const principal = { aceita: "Pagar", enviada: "Confirmar entrega" }[c.status];
    const avaliar = c.status === "entregue" && !c.avaliacao ? '<a class="table-action" href="avaliacoes-pessoa-fisica.html">Avaliar</a>' : "";
    return `<a class="table-action" href="${href}">Acompanhar</a>${principal ? `<a class="table-action" href="${href}">${principal}</a>` : ""}${avaliar}`;
  }

  function render() {
    const visiveis = compras.filter((c) => filtro === "todas" || grupo(c) === filtro);
    corpo.innerHTML = visiveis.length
      ? visiveis.map((c) => `<tr data-search-row>
          <td><a class="text-link" href="compra-pessoa-fisica.html?id=${esc(c.idSolicitacaoComercial)}">${esc(c.peca)}</a></td>
          <td>${esc(c.usina?.nome || c.fornecedor || "-")}</td>
          <td>${esc(c.quantidade ?? 1)}</td>
          <td>${esc(c.total != null ? money(c.total) : "Sob consulta")}</td>
          <td>${statusBadge(c.status)}</td>
          <td>${esc(date(c.criadoEm))}</td>
          <td>${acaoRapida(c)}</td>
        </tr>`).join("")
      : `<tr><td colspan="7" style="text-align:center; padding: 24px;">${compras.length ? "Nenhuma compra neste filtro." : 'Você ainda não solicitou nenhuma peça. <a class="text-link" href="catalogo-pessoa-fisica.html">Ver o catálogo</a>.'}</td></tr>`;
  }

  document.querySelectorAll("[data-compra-filtro]").forEach((botao) => botao.addEventListener("click", () => {
    document.querySelectorAll("[data-compra-filtro]").forEach((b) => b.classList.remove("active"));
    botao.classList.add("active");
    filtro = botao.dataset.compraFiltro;
    render();
  }));

  api().get("/solicitacoes-comerciais/minhas")
    .then((lista) => { compras = lista; render(); })
    .catch((error) => { corpo.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px;">Falha ao carregar: ${esc(error.message)}</td></tr>`; });
}());
