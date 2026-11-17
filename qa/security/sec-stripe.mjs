// Pagamento online (Stripe Checkout). Sobe uma Stripe FALSA local e uma API :3002 apontando para ela. Nenhuma chamada real, nenhum dinheiro.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backendEnv } from '../env/env.mjs';
import { checker } from './_lib.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const API = 'http://localhost:3002';
const FAKE = 4010;
const t = checker();
const WIN = process.platform === 'win32';

// Stripe falsa: guarda as sessoes criadas e permite "pagar" uma delas pelo teste.
const sessoes = new Map(); const chamadas = [];
const stripe = createServer((req, res) => {
  let corpo = ''; req.on('data', (c) => { corpo += c; });
  req.on('end', () => {
    chamadas.push({ metodo: req.method, url: req.url, auth: req.headers.authorization, corpo });
    const json = (status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
    if (req.method === 'POST' && req.url === '/v1/checkout/sessions') {
      const f = new URLSearchParams(corpo);
      const id = `cs_test_${Math.random().toString(36).slice(2).padEnd(24, 'x')}`;
      const s = { id, url: `https://checkout.stripe.test/${id}`, payment_status: 'unpaid', status: 'open', amount_total: Number(f.get('line_items[0][price_data][unit_amount]')), currency: f.get('line_items[0][price_data][currency]'), metadata: { pedidoId: f.get('metadata[pedidoId]'), idUsuario: f.get('metadata[idUsuario]') }, success_url: f.get('success_url'), cancel_url: f.get('cancel_url') };
      sessoes.set(id, s); return json(200, s);
    }
    const m = req.url.match(/^\/v1\/checkout\/sessions\/(.+)$/);
    if (req.method === 'GET' && m) { const s = sessoes.get(decodeURIComponent(m[1])); return s ? json(200, s) : json(404, { error: { message: 'No such session' } }); }
    json(404, { error: { message: 'rota desconhecida' } });
  });
});
await new Promise((r) => stripe.listen(FAKE, r));

const subir = (extra) => {
  const env = backendEnv({ PORT: '3002', ...extra });
  env.LOGIN_THROTTLE_LIMIT = '1000';
  return spawn(WIN ? 'npx.cmd' : 'npx', ['ts-node', '--transpile-only', 'src/main.ts'], { cwd: join(ROOT, 'backend'), env, stdio: 'ignore', detached: !WIN, shell: WIN });
};
const parar = (p) => { try { if (WIN) spawnSync('taskkill', ['/PID', String(p.pid), '/T', '/F']); else process.kill(-p.pid, 'SIGTERM'); } catch {} };
const esperar = async () => { for (let i = 0; i < 160; i++) { try { if ((await fetch(`${API}/`)).ok) return; } catch {} await new Promise((r) => setTimeout(r, 500)); } throw new Error('servidor nao subiu'); };
const call = async (method, path, token, body) => { const r = await fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }); let json = null; try { json = await r.json(); } catch {} return { status: r.status, json, texto: JSON.stringify(json) }; };
const login = async (tipo, email) => (await call('POST', `/api/auth/login/${tipo}`, null, { email, senha: 'Demo@123' })).json.accessToken;
const is4xx = (r) => r.status >= 400 && r.status < 500;
const uid = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
// Pedido pronto para pagar: empresa cria, usina propoe, empresa aceita.
const pedidoParaPagar = async (emp, usina, valor = '1000') => {
  const p = (await call('POST', '/api/pedidos', emp, { peca: `Eixo QA ${uid()}`, categoria: 'Eixos', material: 'Aco', quantidade: '10', prazo: '15 dias', descricao: 'teste', urgencia: 'media' })).json;
  const pr = (await call('POST', '/api/propostas', usina, { pedidoId: String(p.idPedido), valor, prazo: '10', frete: '0', observacao: 'qa' })).json;
  await call('PATCH', `/api/propostas/${pr.idProposta}/aceitar`, emp);
  return p;
};

let be = null;
try {
  // A) Sem chave da Stripe: tudo como antes (pagamento simulado continua valendo)
  be = subir({});
  await esperar();
  let emp = await login('empresa', 'empresa@demo.com'); let usina = await login('usina', 'usina@demo.com');
  let r = await call('GET', '/api/pagamentos/config', emp);
  t.ok(r.status === 200 && r.json?.stripe === false, `config deveria dizer stripe=false sem chave (${r.texto})`);
  r = await call('POST', '/api/pagamentos/checkout', emp, { pedidoId: '1' });
  t.ok(r.status === 503, `checkout sem chave deveria dar 503 (deu ${r.status})`);
  let p = await pedidoParaPagar(emp, usina);
  r = await call('POST', '/api/pagamentos', emp, { pedidoId: String(p.idPedido), metodo: 'PIX' });
  t.ok(r.status < 300, `pagamento simulado sem Stripe deveria funcionar (${r.status} ${r.texto})`);
  parar(be); await new Promise((r2) => setTimeout(r2, 1500));

  // B) Com a Stripe (falsa) ligada
  be = subir({ STRIPE_SECRET_KEY: 'sk_test_falsa', STRIPE_API_BASE: `http://localhost:${FAKE}` });
  await esperar();
  emp = await login('empresa', 'empresa@demo.com'); usina = await login('usina', 'usina@demo.com');
  const pf = await login('pessoa_fisica', 'pessoa@demo.com');
  r = await call('GET', '/api/pagamentos/config', emp);
  t.ok(r.json?.stripe === true, 'config deveria dizer stripe=true');
  t.ok(is4xx(await call('GET', '/api/pagamentos/config')) , 'config sem login deveria ser negada');

  p = await pedidoParaPagar(emp, usina, '1234.56');
  // pagamento simulado fica bloqueado quando a Stripe esta ligada
  r = await call('POST', '/api/pagamentos', emp, { pedidoId: String(p.idPedido), metodo: 'PIX' });
  t.ok(is4xx(r), `pagamento simulado deveria ser bloqueado com Stripe ligada (status ${r.status})`);

  // checkout: so o dono do pedido, valor vindo do servidor, retorno so para origens conhecidas
  const outra = await login('empresa', 'empresa@demo.com'); // mesma conta; teste de outra conta abaixo
  r = await call('POST', '/api/pagamentos/checkout', usina, { pedidoId: String(p.idPedido) });
  t.ok(is4xx(r), `usina nao pode abrir checkout do pedido (status ${r.status})`);
  r = await call('POST', '/api/pagamentos/checkout', pf, { pedidoId: String(p.idPedido) });
  t.ok(is4xx(r), `pessoa fisica nao pode abrir checkout de pedido da empresa (status ${r.status})`);
  r = await call('POST', '/api/pagamentos/checkout', emp, { pedidoId: String(p.idPedido), retorno: 'https://site-malicioso.com' });
  t.ok(r.status < 300 && /^https:\/\/checkout\.stripe\.test\//.test(r.json?.url || ''), `checkout deveria devolver o endereco da Stripe (${r.status} ${r.texto})`);
  const criada = [...sessoes.values()].pop();
  t.ok(criada && criada.amount_total === 123456 && criada.currency === 'brl', `valor deveria ser 123456 centavos em BRL (veio ${criada?.amount_total} ${criada?.currency})`);
  t.ok(criada && criada.success_url.startsWith('https://usinalink.com.br/pagamento-pedido.html'), `retorno malicioso deveria cair no site oficial (veio ${criada?.success_url})`);
  t.ok(chamadas.every((c) => c.auth === 'Bearer sk_test_falsa'), 'chamadas a Stripe sem a chave correta');
  r = await call('POST', '/api/pagamentos/checkout', emp, { pedidoId: String(p.idPedido), retorno: 'https://teste-2fa-usinalink.tibiel2010.workers.dev' });
  const ultima = [...sessoes.values()].pop();
  t.ok(ultima.success_url.startsWith('https://teste-2fa-usinalink.tibiel2010.workers.dev/'), 'retorno para a versao de teste do site deveria ser aceito');

  // confirmar: nada de pagar so porque o navegador disse
  r = await call('POST', '/api/pagamentos/checkout/confirmar', emp, { sessionId: ultima.id });
  t.ok(is4xx(r), `sessao nao paga nao pode confirmar (status ${r.status})`);
  t.ok((await call('GET', '/api/pedidos/meus', emp)).json.find((x) => x.idPedido === p.idPedido)?.status === 'proposta_aceita', 'pedido nao deveria mudar sem pagamento');
  r = await call('POST', '/api/pagamentos/checkout/confirmar', emp, { sessionId: 'cs_test_inventada' });
  t.ok(is4xx(r), `sessao inexistente deveria ser recusada (status ${r.status})`);
  r = await call('POST', '/api/pagamentos/checkout/confirmar', emp, { sessionId: '../../etc' });
  t.ok(is4xx(r), `id de sessao malformado deveria ser recusado (status ${r.status})`);

  // outra pessoa nao pode usar a sessao de quem pagou
  ultima.payment_status = 'paid'; ultima.status = 'complete';
  r = await call('POST', '/api/pagamentos/checkout/confirmar', usina, { sessionId: ultima.id });
  t.ok(is4xx(r), `outra conta nao pode confirmar a sessao (status ${r.status})`);
  // valor diferente do pedido nao confere
  const adulterada = { ...ultima, id: 'cs_test_adulterada0000000000000', amount_total: 100 }; sessoes.set(adulterada.id, adulterada);
  r = await call('POST', '/api/pagamentos/checkout/confirmar', emp, { sessionId: adulterada.id });
  t.ok(is4xx(r), `valor pago diferente do pedido deveria ser recusado (status ${r.status})`);
  t.ok((await call('GET', '/api/pedidos/meus', emp)).json.find((x) => x.idPedido === p.idPedido)?.status === 'proposta_aceita', 'pedido nao deveria mudar com valor errado');

  // pagamento verdadeiro
  r = await call('POST', '/api/pagamentos/checkout/confirmar', emp, { sessionId: ultima.id });
  t.ok(r.status < 300 && r.json?.status === 'pago' && Number(r.json?.valor) === 1234.56, `confirmacao valida deveria marcar como pago (${r.status} ${r.texto})`);
  t.ok((await call('GET', '/api/pedidos/meus', emp)).json.find((x) => x.idPedido === p.idPedido)?.status === 'em_producao', 'pedido deveria ir para producao');
  // repetir a confirmacao (pagina recarregada) nao paga duas vezes
  const r2 = await call('POST', '/api/pagamentos/checkout/confirmar', emp, { sessionId: ultima.id });
  t.ok(r2.status < 300 && r2.json?.idPagamento === r.json?.idPagamento, 'confirmar de novo deveria devolver o mesmo pagamento');
  const lista = (await call('GET', '/api/pagamentos', emp)).json.filter((x) => x.idPedido === p.idPedido);
  t.ok(lista.length === 1, `deveria existir 1 pagamento para o pedido (existem ${lista.length})`);
  // pedido pago nao abre novo checkout
  r = await call('POST', '/api/pagamentos/checkout', emp, { pedidoId: String(p.idPedido) });
  t.ok(is4xx(r), `pedido pago nao pode abrir novo checkout (status ${r.status})`);
} finally {
  if (be) parar(be);
  stripe.close();
}
t.done('sec-stripe');
