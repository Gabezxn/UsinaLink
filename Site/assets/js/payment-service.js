(function () {
  const ui = () => window.UsinaLinkUi;

  function currentSession() {
    try {
      const raw = JSON.parse(sessionStorage.getItem("usinalinkSession") || localStorage.getItem("usinalinkSession") || "null") || {};
      return { tipo: raw.tipo, empresaId: raw.empresaId, usinaId: raw.usinaId, nome: raw.nome };
    } catch {
      return {};
    }
  }

  async function apiGet(path) {
    if (window.UsinaLinkApi) return window.UsinaLinkApi.get(path);
    throw new Error("Cliente da API nao carregado.");
  }

  async function apiPost(path, body) {
    if (window.UsinaLinkApi) return window.UsinaLinkApi.post(path, body);
    throw new Error("Cliente da API nao carregado.");
  }

  function primeiroItem(order) {
    return (order.itens && order.itens[0]) || {};
  }

  function nomeEmpresa(empresa) {
    return empresa?.nomeFantasia || empresa?.razaoSocial || "Cliente";
  }

  function nomeUsina(usina) {
    return usina?.nomeFantasia || usina?.razaoSocial || "Usina a definir";
  }

  async function loadSourceData() {
    const [orders, proposals] = await Promise.all([apiGet("/pedidos/meus"), apiGet("/propostas/recebidas")]);
    return { orders, proposals };
  }

  // A API devolve os campos com prefixo (idPedido, idUsina...). As telas de pagamento/historico
  // foram escritas esperando nomes genericos (id, usina, peca...). Essa funcao faz essa ponte.
  function enrichOrder(order, proposals, payments) {
    const propostaAceita = proposals.find(item => item.idPedido === order.idPedido && item.status === "aceita");
    const proposta = propostaAceita || proposals.find(item => item.idPedido === order.idPedido) || {};
    const payment = payments.find(item => item.idPedido === order.idPedido) || null;
    const item = primeiroItem(order);
    const totals = ui().calculateTotals(order, proposta, payment);
    const statusPagamento = payment?.status === "pago" ? "Pago" : "Aguardando pagamento";
    return {
      id: order.idPedido,
      idPedido: order.idPedido,
      peca: item.nome || "Pedido industrial",
      quantidade: item.quantidade || 1,
      descricao: order.observacoes || "Pedido em validacao.",
      empresa: nomeEmpresa(order.empresaCompradora),
      empresaId: order.idEmpresaCompradora,
      usina: nomeUsina(proposta.usina),
      usinaId: proposta.idUsina || "",
      propostaId: proposta.idProposta || "",
      valor: payment?.valor || proposta.valor || totals.total,
      frete: 0,
      prazo: proposta.prazo || "A definir",
      endereco: order.endereco || "Endereco de entrega em validacao",
      arquivo: (order.arquivos && order.arquivos[0]?.nomeArquivo) || "",
      formaPagamento: payment?.metodo || "Nao selecionada",
      statusPagamento,
      statusPedido: order.status || "Pendente",
      dataCriacao: order.dataPedido,
      pagamento: payment,
      totals,
    };
  }

  async function getOrders() {
    const { orders, proposals } = await loadSourceData();
    const payments = await apiGet("/pagamentos").catch(() => []);
    return orders
      .map(order => enrichOrder(order, proposals, payments))
      .sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0));
  }

  async function getOrder(id) {
    const orders = await getOrders();
    return orders.find(order => String(order.id) === String(id)) || null;
  }

  async function savePayment(order, method) {
    const payment = await apiPost("/pagamentos", { pedidoId: order.idPedido, propostaId: order.propostaId, metodo: method });
    return {
      id: payment.idPagamento,
      orderId: order.id,
      method,
      status: "Pago",
      orderStatus: "Em producao",
      valorTotal: ui().formatCurrency(Number(payment.valor)),
      protocol: `USL-${payment.idPagamento}`,
      createdAt: payment.dataPagamento || new Date().toISOString(),
    };
  }

  window.UsinaLinkPayments = { getOrders, getOrder, savePayment, currentSession };
}());
