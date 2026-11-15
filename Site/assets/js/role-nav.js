// Menu lateral de TODAS as contas, gerado em um unico lugar.
// Para adicionar ou tirar um link de uma conta, mexa so na tabela MENU abaixo:
//   - a ORDEM das linhas e a ordem do menu (igual para todas as contas);
//   - cada linha diz, por conta, o endereco e o texto do link; conta que nao esta na linha nao ve o link.
(function () {
  const nav = document.querySelector("[data-role-nav]");
  if (!nav) return;

  let session = {};
  try {
    session = JSON.parse(sessionStorage.getItem("usinalinkSession") || localStorage.getItem("usinalinkSession") || "null") || {};
  } catch { /* sem sessao legivel */ }

  // [endereco, texto, icone (opcional: usa o da linha)]
  const MENU = [
    { chave: "inicio", icone: "D", empresa: ["dashboard-empresa.html", "Início"], usina: ["dashboard-usina.html", "Início"], pessoa_fisica: ["dashboard-pessoa-fisica.html", "Início"] },
    { chave: "perfil", icone: "I", empresa: ["perfil-empresa.html", "Perfil"], usina: ["perfil-usina.html", "Perfil"], pessoa_fisica: ["perfil-pessoa-fisica.html", "Perfil"] },
    { chave: "funcionarios", icone: "F", empresa: ["funcionarios.html", "Funcionários"], usina: ["funcionarios-usina.html", "Funcionários"] },
    { chave: "pecas", icone: "P", empresa: ["dashboard-pessoa-juridica.html", "Peças comerciais"], usina: ["pecas-comerciais-usina.html", "Catálogo de peças", "C"], pessoa_fisica: ["catalogo-pessoa-fisica.html", "Peças comerciais"] },
    { chave: "usinas", icone: "U", pessoa_fisica: ["usinas-pessoa-fisica.html", "Usinas"] },
    { chave: "favoritos", icone: "F", pessoa_fisica: ["favoritos-pessoa-fisica.html", "Favoritos"] },
    { chave: "pedidos", icone: "P", usina: ["pedidos-disponiveis.html", "Pedidos disponíveis"] },
    { chave: "solicitacoes", icone: "S", empresa: ["solicitacoes.html", "Solicitações"], usina: ["solicitacoes-pecas-usina.html", "Solicitações de peças"], pessoa_fisica: ["solicitacoes.html", "Pedido sob medida"] },
    { chave: "propostas", icone: "R", empresa: ["propostas.html", "Propostas recebidas"], usina: ["propostas-usina.html", "Propostas enviadas"] },
    { chave: "compras", icone: "C", pessoa_fisica: ["compras-pessoa-fisica.html", "Minhas compras"] },
    { chave: "historico", icone: "H", empresa: ["historico-pedidos.html", "Histórico de pedidos"], usina: ["historico-pedidos.html", "Histórico relacionado"], pessoa_fisica: ["historico-pedidos.html", "Meus pedidos"] },
    { chave: "pagamentos", icone: "$", pessoa_fisica: ["pagamentos-pessoa-fisica.html", "Pagamentos"] },
    { chave: "avaliacoes", icone: "A", empresa: ["avaliacoes.html", "Avaliações"], usina: ["avaliacoes-usina.html", "Avaliações recebidas"], pessoa_fisica: ["avaliacoes-pessoa-fisica.html", "Avaliações"] },
    { chave: "notificacoes", icone: "N", pessoa_fisica: ["notificacoes-pessoa-fisica.html", "Notificações"] },
    { chave: "bloqueadas", icone: "B", empresa: ["solicitacoes-bloqueio-usina.html", "Usinas bloqueadas"] },
  ];

  // Paginas internas destacam o item "pai" do menu.
  const PAI = {
    "peca-pessoa-fisica.html": "pecas",
    "usina-pessoa-fisica.html": "usinas",
    "compra-pessoa-fisica.html": "compras",
    "nova-solicitacao.html": "solicitacoes",
    "detalhes-pedido.html": "historico",
    "pagamento-pedido.html": "historico",
    "confirmacao-pedido.html": "historico",
    "enviar-proposta.html": "pedidos",
  };

  const CONTAS = ["empresa", "usina", "pessoa_fisica"];
  const paginaDe = (href) => (href || "").split("?")[0].split("#")[0].split("/").pop();
  const chaveDoEndereco = (href) => {
    const arq = paginaDe(href);
    const item = MENU.find((m) => CONTAS.some((c) => m[c] && m[c][0] === arq));
    return item ? item.chave : null;
  };

  // Qual conta e esta pagina: a sessao vence quando e uma conta valida e a pagina a permite; senao vale a da pagina.
  const permitidas = (document.body.dataset.userRole || "").split(",").map((r) => r.trim()).filter(Boolean);
  const doNav = (nav.dataset.roleNav || "").trim();
  let conta = CONTAS.includes(session.tipo) && (!permitidas.length || permitidas.includes(session.tipo)) ? session.tipo : doNav;
  if (!CONTAS.includes(conta)) return;

  // Item ativo: o que a pagina ja marcou, senao pelo endereco, senao pelo "pai".
  let atual = window.location.pathname.split("/").pop() || "index.html";
  if (!atual.includes(".")) atual += ".html";
  const marcado = nav.querySelector("a.active");
  const ativa = (marcado && chaveDoEndereco(marcado.getAttribute("href"))) || chaveDoEndereco(atual) || PAI[atual] || null;

  document.body.classList.toggle("orange-mode", conta === "usina");
  document.body.classList.toggle("pf-mode", conta === "pessoa_fisica");
  document.querySelector(".sidebar .brand-icon")?.classList.toggle("orange-icon", conta === "usina");
  nav.dataset.roleNav = conta;
  nav.className = conta === "usina" ? "side-nav orange-nav" : "side-nav";

  const escapar = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  nav.innerHTML = MENU.filter((m) => m[conta])
    .map((m) => {
      const [href, texto, icone] = m[conta];
      return `<a ${m.chave === ativa ? 'class="active" ' : ""}href="${escapar(href)}" data-icon="${escapar(icone || m.icone)}">${escapar(texto)}</a>`;
    })
    .join("") + '<a href="index.html" data-icon="X">Sair</a>';

  // Contador de notificacoes nao lidas no item do menu da pessoa fisica (empresa/usina: script.js).
  if (conta === "pessoa_fisica" && window.UsinaLinkApi) {
    window.UsinaLinkApi.get("/notificacoes").then((rows) => {
      const naoLidas = rows.filter((n) => !n.lida).length;
      const link = nav.querySelector('a[href="notificacoes-pessoa-fisica.html"]');
      if (link && naoLidas) link.insertAdjacentHTML("beforeend", ` <span class="badge info nav-count">${naoLidas}</span>`);
    }).catch(() => {});
  }
}());
