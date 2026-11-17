// Correcoes da revisao do TCC: pagamento duplicado, validacao de numeros/datas, compra forjada e cancelamento de pedido.
import { call, login, registrar, checker, novoPedido, novaProposta } from './_lib.mjs';
const t = checker();
const emp = (await registrar('empresa')).token;
const usi = await login('usina');
const pf = (await registrar('pessoa_fisica')).token;

// 1) Pagamento: cinco cliques ao mesmo tempo geram um unico pagamento
const ped = await novoPedido(emp);
const prop = await novaProposta(usi, ped.idPedido);
await call('PATCH', `/api/propostas/${prop.idProposta}/aceitar`, emp);
const resp = await Promise.all(Array.from({ length: 5 }, () => call('POST', '/api/pagamentos', emp, { pedidoId: String(ped.idPedido), metodo: 'pix' })));
const ok = resp.filter((r) => r.status < 300).length;
t.ok(ok === 1, `pagamento simultaneo: esperava 1 sucesso, deu ${ok} (${resp.map((r) => r.status)})`);
const meus = (await call('GET', '/api/pagamentos', emp)).json || [];
t.ok(meus.filter((p) => p.idPedido === ped.idPedido).length === 1, 'deveria existir 1 pagamento do pedido');

// 2) Cancelar pedido com proposta aceita cancela a proposta e avisa a usina
const ped2 = await novoPedido(emp);
const prop2 = await novaProposta(usi, ped2.idPedido);
await call('PATCH', `/api/propostas/${prop2.idProposta}/aceitar`, emp);
await call('PATCH', `/api/pedidos/${ped2.idPedido}/cancelar`, emp);
const enviadas = (await call('GET', '/api/propostas/enviadas', usi)).json || [];
t.ok(enviadas.find((p) => p.idProposta === prop2.idProposta)?.status === 'cancelada', 'proposta do pedido cancelado deveria ficar cancelada');
const notifs = JSON.stringify((await call('GET', '/api/notificacoes', usi)).json || []);
t.ok(notifs.includes('Pedido cancelado'), 'a usina deveria receber aviso de pedido cancelado');

// 3) Valores absurdos sao recusados com 400 (nunca 500)
const base = { peca: 'x', categoria: 'x', material: 'x', quantidade: '1', prazoDesejado: '2099-01-01', urgencia: 'Normal', localEntrega: 'x', descricao: 'x', arquivoTecnico: 'data:image/png;base64,iVBORw0KGgo=', arquivoTecnicoNome: 'a.png' };
for (const [campo, valor] of [['quantidade', '-5'], ['quantidade', '1.5'], ['quantidade', '0'], ['prazoDesejado', 'abc'], ['prazoDesejado', '2020-01-01'], ['prazoDesejado', '2099-02-31'], ['urgencia', 'xpto']]) {
  const r = await call('POST', '/api/solicitacoes', emp, { ...base, [campo]: valor });
  t.ok(r.status === 400, `solicitacao com ${campo}=${valor} deveria dar 400 (deu ${r.status})`);
}
const bom = await call('POST', '/api/solicitacoes', emp, base);
t.ok(bom.status < 300, `solicitacao valida deveria passar (${bom.status} ${JSON.stringify(bom.json)})`);
for (const extra of [{ frete: '-100' }, { valor: '-1' }, { valor: '0' }, { prazo: 'x'.repeat(5000) }]) {
  const p = await novoPedido(emp);
  const r = await call('POST', '/api/propostas', usi, { pedidoId: String(p.idPedido), valor: '100', prazo: '5 dias', ...extra });
  t.ok(r.status === 400, `proposta com ${JSON.stringify(extra).slice(0, 30)} deveria dar 400 (deu ${r.status})`);
}
for (const extra of [{ valorUnitario: '-10' }, { valorUnitario: '0' }, { estoque: '-3' }]) {
  const r = await call('POST', '/api/pecas-comerciais', usi, { nome: 'Peca QA', valorUnitario: '10', ...extra });
  t.ok(r.status === 400, `peca com ${JSON.stringify(extra)} deveria dar 400 (deu ${r.status})`);
}

// 4) Cadastro com CPF/CNPJ de digitos repetidos
for (const [tipo, extra] of [['pessoa_fisica', { cpf: '00000000000' }], ['empresa', { cnpj: '00000000000000' }]]) {
  const r = await call('POST', `/api/cadastro/${tipo}`, null, { tipo, nome: 'QA', email: `qa-doc-${Date.now()}@teste.com`, senha: 'Demo@123', confirmarSenha: 'Demo@123', telefone: '11999990000', responsavel: 'QA', cep: '01310100', cidade: 'Sao Paulo', estado: 'SP', cpf: '12345678909', cnpj: '12345678000195', ...extra });
  t.ok(r.status === 400, `cadastro com documento repetido (${tipo}) deveria dar 400 (deu ${r.status})`);
}

// 5) Compra de catalogo exige peca cadastrada e ignora preco/fornecedor do cliente
const forjada = await call('POST', '/api/solicitacoes-comerciais', pf, { peca: 'Flange ANSI 150', fornecedor: 'Atlas Metais', valorUnitario: '0.01', quantidade: '1' });
t.ok(forjada.status === 400, `compra sem pecaId deveria dar 400 (deu ${forjada.status})`);
t.done('sec-revisao');
