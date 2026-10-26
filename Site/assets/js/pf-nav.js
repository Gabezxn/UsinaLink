// Menu lateral da pessoa fisica, gerado em um unico lugar.
// Roda nas paginas exclusivas da PF e nas paginas compartilhadas com a empresa (so troca o menu quando a sessao e de PF).
(function () {
  let session = {};
  try {
    session = JSON.parse(sessionStorage.getItem("usinalinkSession") || localStorage.getItem("usinalinkSession") || "null") || {};
  } catch { /* sem sessao legivel */ }

  const nav = document.querySelector("[data-role-nav]");
  if (!nav || session.tipo !== "pessoa_fisica") return;
  document.body.classList.add("pf-mode");

  const itens = [
    ["dashboard-pessoa-fisica.html", "D", "Início"],
    ["catalogo-pessoa-fisica.html", "P", "Peças comerciais"],
    ["usinas-pessoa-fisica.html", "U", "Usinas"],
    ["favoritos-pessoa-fisica.html", "F", "Favoritos"],
    ["compras-pessoa-fisica.html", "C", "Minhas compras"],
    ["solicitacoes.html", "S", "Pedido sob medida"],
    ["propostas.html", "R", "Propostas recebidas"],
    ["historico-pedidos.html", "H", "Meus pedidos"],
    ["pagamentos-pessoa-fisica.html", "$", "Pagamentos"],
    ["avaliacoes-pessoa-fisica.html", "A", "Avaliações"],
    ["notificacoes-pessoa-fisica.html", "N", "Notificações"],
    ["perfil-pessoa-fisica.html", "I", "Perfil"],
  ];

  // paginas internas destacam o item "pai" do menu
  const pai = {
    "peca-pessoa-fisica.html": "catalogo-pessoa-fisica.html",
    "usina-pessoa-fisica.html": "usinas-pessoa-fisica.html",
    "compra-pessoa-fisica.html": "compras-pessoa-fisica.html",
    "nova-solicitacao.html": "solicitacoes.html",
    "detalhes-pedido.html": "historico-pedidos.html",
    "pagamento-pedido.html": "historico-pedidos.html",
    "confirmacao-pedido.html": "historico-pedidos.html",
  };
  // Hospedagens como o Cloudflare Pages servem a pagina sem a extensao (/compras-pessoa-fisica).
  let atual = window.location.pathname.split("/").pop() || "dashboard-pessoa-fisica.html";
  if (!atual.includes(".")) atual += ".html";
  const ativo = pai[atual] || atual;

  nav.dataset.roleNav = "pessoa_fisica";
  nav.className = "side-nav";
  nav.innerHTML = itens
    .map(([href, icone, rotulo]) => `<a ${href === ativo ? 'class="active" ' : ""}href="${href}" data-icon="${icone}">${rotulo}</a>`)
    .join("") + '<a href="index.html" data-icon="X">Sair</a>';

  // contador de notificacoes nao lidas no item do menu
  if (window.UsinaLinkApi) {
    window.UsinaLinkApi.get("/notificacoes").then((rows) => {
      const naoLidas = rows.filter((n) => !n.lida).length;
      const link = nav.querySelector('a[href="notificacoes-pessoa-fisica.html"]');
      if (link && naoLidas) link.insertAdjacentHTML("beforeend", ` <span class="badge info nav-count">${naoLidas}</span>`);
    }).catch(() => {});
  }
}());
