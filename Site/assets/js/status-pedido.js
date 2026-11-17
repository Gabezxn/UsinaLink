// Status que o comprador vê nas listas de "Pedido sob medida". Vem do pedido (aberto, aguardando pagamento, em produção...),
// e não da solicitação, que ficava "Concluída" assim que uma proposta era aceita, antes de pagar.
(function () {
  const POR_PEDIDO = {
    aberto: ["info", "Aberta"],
    em_negociacao: ["warning", "Recebendo propostas"],
    proposta_aceita: ["warning", "Aguardando pagamento"],
    em_producao: ["info", "Em produção"],
    enviado: ["info", "Enviado"],
    concluido: ["success", "Concluída"],
    cancelado: ["muted", "Cancelada"],
  };
  const POR_SOLICITACAO = { aberta: ["info", "Aberta"], em_analise: ["warning", "Em análise"], concluida: ["success", "Concluída"], cancelada: ["muted", "Cancelada"] };

  function status(item) {
    return POR_PEDIDO[item.statusPedido] || POR_SOLICITACAO[item.status] || ["info", item.status || "Aberta"];
  }

  window.UsinaLinkStatus = {
    rotulo: (item) => status(item)[1],
    badge: (item) => `<span class="badge ${status(item)[0]}">${status(item)[1]}</span>`,
    // Próximo passo do comprador: pagar quando a proposta foi aceita; acompanhar depois que paga.
    acao: (item) => {
      if (!item.idPedido) return "";
      if (item.statusPedido === "proposta_aceita") return `<a class="table-action" href="pagamento-pedido.html?pedidoId=${encodeURIComponent(item.idPedido)}">Pagar pedido</a>`;
      if (["em_producao", "enviado", "concluido"].includes(item.statusPedido)) return `<a class="table-action" href="detalhes-pedido.html?pedidoId=${encodeURIComponent(item.idPedido)}">Acompanhar pedido</a>`;
      return "";
    },
  };
})();
