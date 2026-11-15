// Review Focus 1: Render dormindo (resposta lenta ou 503) mostra "Acordando o servidor…" e depois carrega, sem tela em branco nem erro.
import { playwright, SITE, API } from '../lib/login.mjs';
import { checker } from '../security/_lib.mjs';
const t = checker();

// /api/health
{
  const r = await fetch(`${API}/api/health`); const j = await r.json().catch(() => ({}));
  t.ok(r.status === 200 && j.ok === true && j.db === true, `health: esperado 200 {ok:true,db:true}, veio ${r.status} ${JSON.stringify(j)}`);
  t.ok(!Object.keys(j).some((k) => !['ok', 'db'].includes(k)), 'health não deveria expor dados além de ok/db');
}

const { chromium } = playwright();
const browser = await chromium.launch();

// 1) Primeira resposta demora 6 s: aviso aparece, some, login conclui
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  let primeira = true;
  await page.route('**/api/auth/login/empresa', async (route) => {
    if (primeira) { primeira = false; await new Promise((r) => setTimeout(r, 6000)); }
    await route.continue();
  });
  await page.goto(`${SITE}/login-empresa.html`);
  await page.fill('input[name="email"]', 'empresa@demo.com'); await page.fill('input[name="senha"]', 'Demo@123');
  await page.click('form.js-login-form [type="submit"]');
  const aviso = page.locator('[role="status"]', { hasText: /acordando o servidor/i });
  await aviso.first().waitFor({ state: 'visible', timeout: 6000 }).catch(() => t.ok(false, 'resposta lenta: aviso "Acordando o servidor…" não apareceu'));
  await page.waitForURL('**/dashboard-empresa.html', { timeout: 20000 }).catch(() => t.ok(false, `resposta lenta: login não concluiu (em ${page.url().replace(SITE, '')})`));
  await page.waitForTimeout(500);
  t.ok(await aviso.count() === 0 || !(await aviso.first().isVisible()), 'o aviso deveria sumir depois que o servidor respondeu');
  await ctx.close();
}
// 2) Servidor devolve 503 duas vezes (acordando) e depois responde: a tela carrega os dados
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  const { loginAs } = await import('../lib/login.mjs');
  await loginAs(page, 'empresa');
  let falhas = 0, total = 0;
  await page.route('**/api/pedidos/meus', async (route) => {
    total++;
    if (falhas < 2) { falhas++; await route.fulfill({ status: 503, contentType: 'text/plain', body: 'Service Unavailable' }); } else await route.continue();
  });
  await page.goto(`${SITE}/historico-pedidos.html`);
  await page.waitForTimeout(12000);
  t.ok(total >= 3, `503: deveria tentar de novo (chamadas: ${total})`);
  const texto = await page.locator('main').innerText();
  t.ok(!/503|Service Unavailable|Failed to fetch|Unauthorized/i.test(texto), `503: a tela mostra erro técnico: ${(texto.match(/.{0,30}(503|Service Unavailable|Failed to fetch).{0,20}/) || [''])[0]}`);
  t.ok(await page.locator('table tbody tr').count() > 0, '503: a tabela deveria carregar depois das tentativas');
  await ctx.close();
}
// 3) Sem rede: mensagem em português, sem erro técnico
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.route('**/api/auth/login/empresa', (route) => route.abort('connectionrefused'));
  await page.goto(`${SITE}/login-empresa.html`);
  await page.fill('input[name="email"]', 'empresa@demo.com'); await page.fill('input[name="senha"]', 'Demo@123');
  await page.click('form.js-login-form [type="submit"]');
  await page.waitForTimeout(1500);
  const msgs = (await page.locator('.toast, [role="alert"], [role="status"]').allInnerTexts()).join(' | ');
  t.ok(!/Failed to fetch|NetworkError|TypeError/i.test(msgs), `sem rede: mensagem técnica na tela: ${msgs.slice(0, 100)}`);
  await ctx.close();
}
await browser.close();
t.done('cold-start');
