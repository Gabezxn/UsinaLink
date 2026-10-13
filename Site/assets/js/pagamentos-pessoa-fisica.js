(function () {
  const { api, esc, money, date, emptyState } = window.PF;
  const set = (seletor, texto) => { const el = document.querySelector(seletor); if (el) el.textContent = texto; };
  const vazio = (colunas, texto) => `<tr><td colspan="${colunas}" style="text-align:center; padding: 24px;">${texto}</td></tr>`;
  const valor = (r) => (r.status === "fulfilled" ? r.value : []);

  async function carregar() {
    const [compras, pedidos, pagamentos, propostas] = (await Promise.allSettled([
      api().get("/solicitacoes-comerciais/minhas"),
      api().get("/pedidos/meus"),
      api().get("/pagamentos"),
      api().get("/propostas/recebidas"),
    ])).map(valor);

    const nomePedido = (idPedido) => {
      const p = pedidos.find((x) => x.idPedido === idPedido);
      return p?.itens?.[0]?.nome || p?.numeroPedido || `Pedido #${idPedido}`;
    };

    // ---- pagos ----
    const pagos = [
      ...compras.filter((c) => c.pago).map((c) => ({
        origem: "Compra de catálogo", descricao: `${c.quantidade}x ${c.peca}`, valor: Number(c.total), metodo: c.metodoPagamento,
        data: c.dataPagamento, protocolo: c.protocoloPagamento, href: `compra-pessoa-fisica.html?id=${c.idSolicitacaoComercial}`,
      })),
      ...pagamentos.filter((p) => p.status === "pago").map((p) => ({
        origem: "Pedido sob medida", descricao: nomePedido(p.idPedido), valor: Number(p.valor), metodo: p.metodo,
        data: p.dataPagamento, protocolo: `USL-${p.idPagamento}`, href: `confirmacao-pedido.html?pedidoId=${p.idPedido}`,
      })),
    ].sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

    document.querySelector("[data-pagos]").innerHTML = pagos.length
      ? pagos.map((p) => `<tr><td>${esc(p.origem)}</td><td>${esc(p.descricao)}</td><td>${esc(money(p.valor))}</td><td>${esc(p.metodo || "-")}</td><td>${esc(date(p.data))}</td><td>${esc(p.protocolo || "-")}</td><td><a class="table-action" href="${esc(p.href)}">Ver comprovante</a></td></tr>`).join("")
      : vazio(7, "Nenhum pagamento realizado ainda.");

    // ---- a pagar ----
    const aPagarCompras = compras.filter((c) => c.status === "aceita").map((c) => ({
      origem: "Compra de catálogo", descricao: `${c.quantidade}x ${c.peca}`, valor: Number(c.total), href: `compra-pessoa-fisica.html?id=${c.idSolicitacaoComercial}`,
    }));
    const aPagarPedidos = pedidos.filter((p) => p.status === "proposta_aceita").map((p) => {
      const aceita = propostas.find((x) => x.idPedido === p.idPedido && x.status === "aceita");
      return { origem: "Pedido sob medida", descricao: nomePedido(p.idPedido), valor: aceita ? Number(aceita.valor) + Number(aceita.frete || 0) : NaN, href: `pagamento-pedido.html?pedidoId=${p.idPedido}` };
    });
    const aPagar = [...aPagarCompras, ...aPagarPedidos];
    document.querySelector("[data-a-pagar]").innerHTML = aPagar.length
      ? aPagar.map((p) => `<tr><td>${esc(p.origem)}</td><td>${esc(p.descricao)}</td><td>${Number.isFinite(p.valor) ? esc(money(p.valor)) : "-"}</td><td><a class="btn btn-small btn-primary" href="${esc(p.href)}">Pagar</a></td></tr>`).join("")
      : vazio(4, "Nada aguardando pagamento.");

    set("[data-stat-pago]", money(pagos.reduce((s, p) => s + (Number.isFinite(p.valor) ? p.valor : 0), 0)));
    set("[data-stat-qtd]", pagos.length);
    set("[data-stat-apagar]", money(aPagar.reduce((s, p) => s + (Number.isFinite(p.valor) ? p.valor : 0), 0)));
  }

  carregar().catch((error) => {
    document.querySelector("[data-pagos]").innerHTML = vazio(7, `Falha ao carregar: ${esc(error.message)}`);
  });
}());
