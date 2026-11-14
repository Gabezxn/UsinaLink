// SEC-9,10,11,12,13,18 e BUG-3: pagamento, avaliação, vazamentos, upload e valor da proposta.
import { call, login, registrar, checker, novoPedido, novaProposta } from './_lib.mjs';
const t = checker();
const empA = await login('empresa');
const usiA = await login('usina');
const pfT = await login('pessoa_fisica');
const empB = (await registrar('empresa')).token;
const is4xx = (r) => r.status >= 400 && r.status < 500;

// SEC-9: pagamento só com proposta aceita, uma vez, em pedido aberto para pagamento
let p = await novoPedido(empA); const prop = await novaProposta(usiA, p.idPedido);
let r = await call('POST', '/api/pagamentos', empA, { pedidoId: String(p.idPedido), metodo: 'pix' });
t.ok(is4xx(r), `SEC-9 pagou pedido sem proposta aceita (status ${r.status})`);
t.ok((await call('GET', `/api/pedidos/${p.idPedido}`, empA)).json?.status !== 'em_producao', 'SEC-9 pedido foi para produção sem aceite');
await call('PATCH', `/api/propostas/${prop.idProposta}/aceitar`, empA);
r = await call('POST', '/api/pagamentos', empB, { pedidoId: String(p.idPedido), metodo: 'pix' });
t.ok(is4xx(r), `SEC-9 outra empresa pagou o pedido (status ${r.status})`);
r = await call('POST', '/api/pagamentos', empA, { pedidoId: String(p.idPedido), metodo: 'pix' });
t.ok(r.status < 300, `SEC-9 pagamento válido falhou (status ${r.status} ${JSON.stringify(r.json).slice(0, 80)})`);
r = await call('POST', '/api/pagamentos', empA, { pedidoId: String(p.idPedido), metodo: 'pix' });
t.ok(is4xx(r), `SEC-9 pagamento duplicado deveria falhar (status ${r.status})`);
const pc = await novoPedido(empA); const propc = await novaProposta(usiA, pc.idPedido);
await call('PATCH', `/api/propostas/${propc.idProposta}/aceitar`, empA); await call('PATCH', `/api/pedidos/${pc.idPedido}/cancelar`, empA);
r = await call('POST', '/api/pagamentos', empA, { pedidoId: String(pc.idPedido), metodo: 'pix' });
t.ok(is4xx(r), `SEC-9 pagou pedido cancelado (status ${r.status})`);

// SEC-10: avaliação só depois de concluído
const pn = await novoPedido(empA); await novaProposta(usiA, pn.idPedido);
const nota = { notaGeral: 1, qualidade: 1, prazo: 1, comunicacao: 1, comentario: 'qa' };
r = await call('POST', '/api/avaliacoes', empA, { pedidoId: String(pn.idPedido), ...nota });
t.ok(is4xx(r), `SEC-10 avaliou pedido em negociação (status ${r.status})`);
await call('PATCH', `/api/pedidos/${p.idPedido}/confirmar-entrega`, empA);
r = await call('POST', '/api/avaliacoes', empA, { pedidoId: String(p.idPedido), ...nota, notaGeral: 5 });
t.ok(r.status < 300, `SEC-10 avaliação de pedido concluído falhou (status ${r.status})`);

// SEC-11: leitura de avaliações exige login; resumo público sem ids internos
for (const path of ['/api/avaliacoes/usina/1', '/api/avaliacoes/empresa/1', '/api/avaliacoes/pedido/1']) {
  r = await call('GET', path, null);
  t.ok(r.status === 401, `SEC-11 ${path} sem token respondeu ${r.status}`);
}
r = await call('GET', '/api/avaliacoes/pedido/' + p.idPedido, empB);
t.ok(is4xx(r), `SEC-11 outra empresa leu avaliação do pedido alheio (status ${r.status})`);

// SEC-12: listagem/consulta de usuários só admin
for (const path of ['/api/usuarios?tipo=empresa', '/api/usuarios?status=ativo', '/api/usuarios/1']) {
  r = await call('GET', path, empA);
  t.ok(r.status === 403, `SEC-12 ${path} com conta comum respondeu ${r.status}`);
}

// SEC-13: buscar empresa/usina exige login e não devolve dados sensíveis
for (const path of ['/api/empresas/buscar?nome=Metal', '/api/usinas/buscar?nome=Atlas']) {
  r = await call('GET', path, null);
  t.ok(r.status === 401, `SEC-13 ${path} sem token respondeu ${r.status}`);
  r = await call('GET', path, pfT);
  const d = r.json || {};
  for (const k of ['cnpj', 'email', 'telefone', 'contratoSocialArquivo', 'alvaraArquivo', 'idUsuario']) t.ok(d[k] === undefined, `SEC-13 ${path} expõe "${k}"`);
}

// SEC-18: anexos só PDF/imagem em data URL e com tamanho limitado
const base = { peca: 'x', categoria: 'x', material: 'x', quantidade: '1', prazoDesejado: '2026-12-01', urgencia: 'media', localEntrega: 'x', descricao: 'x', arquivoTecnicoNome: 'a.pdf' };
for (const ruim of ['javascript:alert(1)', 'data:text/html;base64,PGgxPmE8L2gxPg==', 'x" onmouseover="alert(1)']) {
  r = await call('POST', '/api/solicitacoes', pfT, { ...base, arquivoTecnico: ruim });
  t.ok(is4xx(r), `SEC-18 anexo "${ruim.slice(0, 25)}" aceito (status ${r.status})`);
}
r = await call('POST', '/api/solicitacoes', pfT, { ...base, arquivoTecnico: 'data:application/pdf;base64,JVBERi0xLjQK' });
t.ok(r.status < 300, `SEC-18 PDF válido recusado (status ${r.status} ${JSON.stringify(r.json).slice(0, 100)})`);
r = await call('POST', '/api/pecas-comerciais', usiA, { nome: 'p', imagem: 'javascript:alert(1)', valorUnitario: '10', estoque: '1' });
t.ok(is4xx(r), `SEC-18 imagem de peça com javascript: aceita (status ${r.status})`);

// BUG-3: valor da proposta positivo e com teto
const pv = await novoPedido(empA);
for (const v of ['-5', '0', '99999999999']) {
  r = await call('POST', '/api/propostas', usiA, { pedidoId: String(pv.idPedido), valor: v, prazo: '10 dias' });
  t.ok(is4xx(r), `BUG-3 valor "${v}" aceito (status ${r.status})`);
}
t.done('sec-p1');
