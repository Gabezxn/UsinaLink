// Tela de pagamento com Stripe ligada (Stripe FALSA local): botao leva ao checkout, a volta confirma e mostra a confirmacao.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backendEnv } from '../env/env.mjs';
import { playwright, SITE } from '../lib/login.mjs';
import { checker } from '../security/_lib.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const API = 'http://localhost:3002';
const FAKE = 4011;
const t = checker();
const WIN = process.platform === 'win32';
const sessoes = new Map();
const stripe = createServer((req, res) => {
  let corpo = ''; req.on('data', (c) => { corpo += c; });
  req.on('end', () => {
    const json = (s, o) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (req.method === 'POST' && req.url === '/v1/checkout/sessions') {
      const f = new URLSearchParams(corpo); const id = `cs_test_${Math.random().toString(36).slice(2).padEnd(24, 'x')}`;
      const s = { id, url: `https://checkout.stripe.test/${id}`, payment_status: 'unpaid', amount_total: Number(f.get('line_items[0][price_data][unit_amount]')), currency: 'brl', metadata: { pedidoId: f.get('metadata[pedidoId]'), idUsuario: f.get('metadata[idUsuario]') }, success: f.get('success_url'), cancel: f.get('cancel_url') };
      sessoes.set(id, s); return json(200, s);
    }
    const m = req.url.match(/^\/v1\/checkout\/sessions\/(.+)$/);
    if (req.method === 'GET' && m && sessoes.has(m[1])) return json(200, sessoes.get(m[1]));
    json(404, { error: { message: 'x' } });
  });
});
await new Promise((r) => stripe.listen(FAKE, r));
const env = backendEnv({ PORT: '3002', STRIPE_SECRET_KEY: 'sk_test_falsa', STRIPE_API_BASE: `http://localhost:${FAKE}` });
const be = spawn(WIN ? 'npx.cmd' : 'npx', ['ts-node', '--transpile-only', 'src/main.ts'], { cwd: join(ROOT, 'backend'), env, stdio: 'ignore', detached: !WIN, shell: WIN });
const call = async (method, path, token, body) => { const r = await fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, json: await r.json().catch(() => null) }; };
try {
  for (let i = 0; i < 160; i++) { try { if ((await fetch(`${API}/`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }
  const login = async (tipo, email) => (await call('POST', `/api/auth/login/${tipo}`, null, { email, senha: 'Demo@123' })).json.accessToken;
  const emp = await login('empresa', 'empresa@demo.com'); const usina = await login('usina', 'usina@demo.com');
  const p = (await call('POST', '/api/pedidos', emp, { peca: 'Eixo Stripe UI', categoria: 'Eixos', material: 'Aco', quantidade: '5', prazo: '15 dias', descricao: 'teste', urgencia: 'media' })).json;
  const pr = (await call('POST', '/api/propostas', usina, { pedidoId: String(p.idPedido), valor: '800', prazo: '10', frete: '0', observacao: 'qa' })).json;
  await call('PATCH', `/api/propostas/${pr.idProposta}/aceitar`, emp);

  const { chromium } = playwright();
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 800 } })).newPage();
  await page.route('http://localhost:3000/api/**', (route) => route.continue({ url: route.request().url().replace('localhost:3000', 'localhost:3002') }));
  await page.route('https://checkout.stripe.test/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Stripe falsa</h1>' }));
  const erros = []; page.on('pageerror', (e) => erros.push(e.message));
  await page.goto(`${SITE}/login-empresa.html`);
  await page.fill('input[name="email"]', 'empresa@demo.com'); await page.fill('input[name="senha"]', 'Demo@123');
  await Promise.all([page.waitForURL('**/dashboard-empresa.html', { timeout: 15000 }), page.click('form.js-login-form [type="submit"]')]);

  await page.goto(`${SITE}/pagamento-pedido.html?pedidoId=${p.idPedido}`);
  await page.waitForSelector('[data-confirm-payment]');
  await page.waitForFunction(() => /cartão/i.test(document.querySelector('[data-confirm-payment]').textContent), null, { timeout: 8000 }).catch(() => t.ok(false, 'botao deveria virar "Pagar com cartão"'));
  t.ok(await page.locator('.payment-methods').isHidden(), 'formas de pagamento ficticias deveriam sumir com a Stripe ligada');
  t.ok(/Stripe/.test(await page.locator('.payment-panel').nth(1).innerText()), 'tela deveria explicar que o pagamento e na Stripe');
  await Promise.all([page.waitForURL('https://checkout.stripe.test/**', { timeout: 10000 }).catch(() => t.ok(false, 'nao foi levado a Stripe')), page.click('[data-confirm-payment]')]);
  const s = [...sessoes.values()].pop();
  t.ok(s && s.amount_total === 80000, `valor enviado a Stripe deveria ser 80000 (veio ${s?.amount_total})`);

  // cancelou na Stripe: volta avisando, pedido continua aguardando
  await page.goto(s.cancel.replace('https://usinalink.com.br', SITE));
  await page.waitForSelector('[data-confirm-payment]');
  t.ok(/cancelado/i.test(await page.locator('.toast').innerText().catch(() => '')), 'volta cancelada deveria avisar');
  // pagou na Stripe: volta e o site confirma sozinho
  s.payment_status = 'paid';
  await Promise.all([page.waitForURL('**/confirmacao-pedido.html**', { timeout: 15000 }).catch(() => t.ok(false, 'volta da Stripe nao levou a confirmacao')), page.goto(s.success.replace('https://usinalink.com.br', SITE).replace('{CHECKOUT_SESSION_ID}', s.id))]);
  const meu = (await call('GET', '/api/pedidos/meus', emp)).json.find((x) => x.idPedido === p.idPedido);
  t.ok(meu?.status === 'em_producao', `pedido deveria estar em producao (esta ${meu?.status})`);
  t.ok(erros.length === 0, `erros de JavaScript: ${erros.join(' | ')}`);
  await browser.close();
} finally {
  try { if (WIN) spawnSync('taskkill', ['/PID', String(be.pid), '/T', '/F']); else process.kill(-be.pid, 'SIGTERM'); } catch {}
  stripe.close();
}
t.done('stripe-ui');
