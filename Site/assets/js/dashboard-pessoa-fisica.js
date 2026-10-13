(function () {
  const { api, esc, money, date, statusBadge, FINALIZADOS, emptyState } = window.PF;

  function sessao() {
    try { return JSON.parse(sessionStorage.getItem("usinalinkSession") || localStorage.getItem("usinalinkSession") || "null") || {}; } catch { return {}; }
  }

  const nome = sessao().nome || "Minha conta";
  document.querySelectorAll("[data-user-name]").forEach((el) => { el.textContent = nome; });
  // script.js (carregado depois) troca o titulo pelo nome da sessao; a saudacao entra apos o load.
  window.addEventListener("load", () => {
    const saudacao = document.querySelector("[data-saudacao]");
    if (saudacao) saudacao.textContent = `Olá, ${nome.split(" ")[0]}`;
  });

  const valor = (r) => (r.status === "fulfilled" ? r.value : []);
  const set = (seletor, texto) => { const el = document.querySelector(seletor); if (el) el.textContent = texto; };

  async function carregar() {
    const [compras, pedidos, propostas, notificacoes] = (await Promise.allSettled([
      api().get("/solicitacoes-comerciais/minhas"),
      api().get("/pedidos/meus"),
      api().get("/propostas/recebidas"),
      api().get("/notificacoes"),
    ])).map(valor);

    const andamento = compras.filter((c) => !FINALIZADOS.includes(c.status));
    const comprasAPagar = compras.filter((c) => c.status === "aceita");
    const pedidosAPagar = pedidos.filter((p) => p.status === "proposta_aceita");
    const propostasPendentes = propostas.filter((p) => ["enviada", "em_analise"].includes(p.status));

    set("[data-stat-andamento]", andamento.length);
    set("[data-stat-pagar]", comprasAPagar.length + pedidosAPagar.length);
    set("[data-stat-propostas]", propostasPendentes.length);
    set("[data-stat-notificacoes]", notificacoes.filter((n) => !n.lida).length);

    // ---- o que precisa de atencao ----
    const acoes = [];
    compras.forEach((c) => {
      const link = `compra-pessoa-fisica.html?id=${c.idSolicitacaoComercial}`;
      if (c.status === "aceita") acoes.push([`A usina aceitou <strong>${esc(c.peca)}</strong>. Pague para ela começar a separar.`, link, "Pagar"]);
      if (c.status === "enviada") acoes.push([`<strong>${esc(c.peca)}</strong> foi enviada. Confirme quando receber.`, link, "Confirmar entrega"]);
      if (c.status === "entregue" && !c.avaliacao) acoes.push([`Como foi a compra de <strong>${esc(c.peca)}</strong>? Avalie a usina.`, "avaliacoes-pessoa-fisica.html", "Avaliar"]);
    });
    pedidosAPagar.forEach((p) => {
      acoes.push([`Proposta aceita no pedido <strong>${esc(p.itens?.[0]?.nome || p.numeroPedido || "#" + p.idPedido)}</strong>. Falta pagar.`, `pagamento-pedido.html?pedidoId=${p.idPedido}`, "Pagar pedido"]);
    });
    pedidos.filter((p) => p.status === "em_producao").forEach((p) => {
      acoes.push([`Pedido <strong>${esc(p.itens?.[0]?.nome || "#" + p.idPedido)}</strong> em produção. Confirme quando receber.`, `detalhes-pedido.html?pedidoId=${p.idPedido}`, "Ver pedido"]);
    });
    if (propostasPendentes.length) {
      acoes.push([`Você tem <strong>${propostasPendentes.length}</strong> proposta(s) aguardando decisão nos seus pedidos sob medida.`, "propostas.html", "Ver propostas"]);
    }

    const lista = document.querySelector("[data-acoes]");
    lista.innerHTML = acoes.length
      ? acoes.map(([texto, href, botao]) => `<div class="pf-action-item"><span>${texto}</span><a class="btn btn-small btn-primary" href="${esc(href)}">${esc(botao)}</a></div>`).join("")
      : emptyState("Tudo em dia", "Nenhuma pendência no momento. Que tal explorar as peças comerciais?");

    // ---- ultimas compras ----
    const tabela = document.querySelector("[data-ultimas-compras]");
    tabela.innerHTML = compras.length
      ? compras.slice(0, 5).map((c) => `<tr><td><a class="text-link" href="compra-pessoa-fisica.html?id=${esc(c.idSolicitacaoComercial)}">${esc(c.peca)}</a></td><td>${esc(c.usina?.nome || c.fornecedor || "-")}</td><td>${esc(c.quantidade ?? 1)}</td><td>${esc(c.total != null ? money(c.total) : "Sob consulta")}</td><td>${statusBadge(c.status)}</td><td>${esc(date(c.criadoEm))}</td></tr>`).join("")
      : '<tr><td colspan="6" style="text-align:center; padding: 24px;">Você ainda não fez nenhuma compra. Veja as peças comerciais!</td></tr>';
  }

  carregar().catch((error) => {
    document.querySelector("[data-acoes]").innerHTML = emptyState("Não foi possível carregar", error.message);
  });
}());
