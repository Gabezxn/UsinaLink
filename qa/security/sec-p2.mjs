// SEC-14, SEC-15, SEC-16, SEC-24, BUG-4. Uso: node qa/security/sec-p2.mjs
import { call, login, registrar, checker, novoPedido, novaProposta, DEMO } from './_lib.mjs';
const t = checker();
// SEC-14: e-mail inexistente e senha errada dão a mesma resposta
const a = await call('POST', '/api/auth/login/empresa', null, { email: 'naoexiste-qa@teste.com', senha: 'Qualquer@1' });
const b = await call('POST', '/api/auth/login/empresa', null, { email: DEMO.empresa, senha: 'Errada@123' });
t.ok(a.status === b.status && a.json?.message === b.json?.message, `SEC-14 mensagens distintas: "${a.json?.message}" x "${b.json?.message}"`);
const ad = await call('POST', '/api/auth/login/admin', null, { email: DEMO.empresa, senha: 'Errada@123' });
t.ok(ad.status === 401, `SEC-14 login admin com senha errada em conta não-admin deu ${ad.status}`);
// SEC-15: token expira em no máximo 12h
const full = await login('empresa', DEMO.empresa, DEMO.senha, true);
const exp = JSON.parse(Buffer.from(full.accessToken.split('.')[1], 'base64url').toString());
t.ok(exp.exp - exp.iat <= 12 * 3600, `SEC-15 token dura ${(exp.exp - exp.iat) / 3600}h`);
// SEC-16: titular continua gerenciando funcionários
const emp = await login('empresa');
let r = await call('POST', '/api/funcionarios', emp, { nome: 'QA Func', email: `qa-func-${Date.now()}@teste.com` });
t.ok(r.status < 300, `SEC-16 titular não conseguiu criar funcionário (status ${r.status})`);
// SEC-24: tipo de conta errado recebe 403/404, nunca 500
const usi = await login('usina'); const pf = (await registrar('pessoa_fisica')).token;
const p = await novoPedido(emp); const pr = await novaProposta(usi, p.idPedido);
for (const [n, tk] of [['pf', pf], ['empresa', emp], ['usina', usi]]) {
  for (const [m, u, bd] of [['POST', '/api/propostas', { pedidoId: String(p.idPedido), valor: '10', prazo: '1 dia' }], ['PATCH', `/api/pedidos/${p.idPedido}/confirmar-entrega`], ['PATCH', `/api/propostas/${pr.idProposta}/cancelar`], ['GET', `/api/propostas/${pr.idProposta}`], ['GET', '/api/propostas/recebidas'], ['GET', '/api/propostas/enviadas'], ['GET', '/api/pedidos/disponiveis'], ['GET', '/api/pedidos/meus']]) {
    const x = await call(m, u, tk, bd); t.ok(x.status < 500, `SEC-24 ${n} ${m} ${u} deu ${x.status}`);
  }
}
// BUG-4: texto gigante é recusado
r = await call('POST', '/api/avaliacoes', emp, { pedidoId: String(p.idPedido), nota: 5, comentario: 'x'.repeat(5000) });
t.ok(r.status >= 400 && r.status < 500, `BUG-4 comentário de 5000 caracteres aceito (status ${r.status})`);
t.done('sec-p2');
