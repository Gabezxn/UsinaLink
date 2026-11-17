// SEC-3,4,5,6,8: autorização de pedido/proposta. Uso: node qa/security/sec-authz.mjs
import { call, login, registrar, checker, novoPedido, novaProposta } from './_lib.mjs';
const t = checker();
const empA = await login('empresa');
const usiA = await login('usina');
const usiB = (await registrar('usina')).token;
const empB = (await registrar('empresa')).token;

// SEC-3: quem não é o comprador não cancela nem altera pedido
let p = await novoPedido(empA);
await novaProposta(usiA, p.idPedido);
for (const [quem, tok] of [['usina com proposta', usiA], ['usina sem proposta', usiB], ['outra empresa', empB]]) {
  const r = await call('PATCH', `/api/pedidos/${p.idPedido}/cancelar`, tok);
  t.ok([403, 404].includes(r.status), `SEC-3 ${quem} cancelou pedido alheio (status ${r.status})`);
  const r2 = await call('PATCH', `/api/pedidos/${p.idPedido}`, tok, { observacoes: 'invadido' });
  t.ok([403, 404].includes(r2.status), `SEC-3 ${quem} alterou pedido alheio (status ${r2.status})`);
}
t.ok((await call('GET', `/api/pedidos/${p.idPedido}`, empA)).json?.status !== 'cancelado', 'SEC-3 pedido foi cancelado por terceiro');

// SEC-4: comprador não pula etapas pelo PATCH
p = await novoPedido(empA); await novaProposta(usiA, p.idPedido);
await call('PATCH', `/api/pedidos/${p.idPedido}`, empA, { status: 'concluido' });
const st = (await call('GET', `/api/pedidos/${p.idPedido}`, empA)).json?.status;
t.ok(st === 'em_negociacao', `SEC-4 PATCH status mudou o pedido para "${st}"`);

// SEC-5: aceitar/recusar só o comprador dono; cancelar só a usina dona
p = await novoPedido(empA); const prop = await novaProposta(usiA, p.idPedido);
let r = await call('PATCH', `/api/propostas/${prop.idProposta}/aceitar`, usiA);
t.ok([403, 404].includes(r.status), `SEC-5 usina aceitou a própria proposta (status ${r.status})`);
r = await call('PATCH', `/api/propostas/${prop.idProposta}/recusar`, usiA);
t.ok([403, 404].includes(r.status), `SEC-5 usina recusou a própria proposta (status ${r.status})`);
r = await call('PATCH', `/api/propostas/${prop.idProposta}/cancelar`, empA);
t.ok([403, 404].includes(r.status), `SEC-5 empresa cancelou proposta da usina (status ${r.status})`);
r = await call('PATCH', `/api/propostas/${prop.idProposta}/aceitar`, empB);
t.ok([403, 404].includes(r.status), `SEC-5 outra empresa aceitou proposta (status ${r.status})`);
t.ok((await call('GET', `/api/propostas/${prop.idProposta}`, empA)).json?.status === 'enviada', 'SEC-5 proposta mudou de status por terceiro');

// SEC-6: aceitar só proposta enviada em pedido aberto; não reaceitar
r = await call('PATCH', `/api/propostas/${prop.idProposta}/aceitar`, empA);
t.ok(r.status < 300, `SEC-6 comprador não conseguiu aceitar proposta válida (status ${r.status})`);
r = await call('PATCH', `/api/propostas/${prop.idProposta}/aceitar`, empA);
t.ok(r.status >= 400 && r.status < 500, `SEC-6 reaceitar proposta já aceita deveria falhar (status ${r.status})`);
const p2 = await novoPedido(empA); const prop2 = await novaProposta(usiA, p2.idPedido);
await call('PATCH', `/api/pedidos/${p2.idPedido}/cancelar`, empA);
r = await call('PATCH', `/api/propostas/${prop2.idProposta}/aceitar`, empA);
t.ok(r.status >= 400 && r.status < 500, `SEC-6 aceitar proposta de pedido cancelado deveria falhar (status ${r.status})`);
t.ok((await call('GET', `/api/pedidos/${p2.idPedido}`, empA)).json?.status === 'cancelado', 'SEC-6 pedido cancelado foi reaberto');

// SEC-8: usina vê só as próprias propostas e dados públicos do comprador
const p3 = await novoPedido(empA); await novaProposta(usiA, p3.idPedido, { valor: '7777' });
const lista = (await call('GET', '/api/pedidos/disponiveis', usiB)).json || [];
const visto = lista.find((x) => x.idPedido === p3.idPedido);
t.ok(!!visto, 'SEC-8 pedido aberto deveria aparecer para a usina B');
t.ok(!visto || (visto.propostas || []).length === 0, `SEC-8 usina B vê propostas de concorrente (${(visto?.propostas || []).length})`);
const det = (await call('GET', `/api/pedidos/${p3.idPedido}`, usiB)).json || {};
t.ok((det.propostas || []).length === 0, 'SEC-8 detalhe mostra proposta da concorrente');
const emp = det.empresaCompradora || {};
for (const k of ['cnpj', 'email', 'telefone', 'contratoSocialArquivo', 'alvaraArquivo', 'idUsuario']) t.ok(emp[k] === undefined, `SEC-8 empresaCompradora expõe "${k}" para a usina`);
t.done('sec-authz');
