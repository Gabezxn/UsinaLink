// Cabeçalhos de segurança (Site/_headers, aplicados por qa/env/static.mjs): presentes e sem violações de CSP em nenhuma página.
import { playwright, loginAs, SITE } from '../lib/login.mjs';
import { listPages } from '../lib/pages.mjs';
import { checker } from '../security/_lib.mjs';
const t = checker();
const { chromium } = playwright();
const browser = await chromium.launch();

// 1) Cabeçalhos presentes
const r = await fetch(`${SITE}/index.html`);
const h = (n) => r.headers.get(n) || '';
t.ok(/default-src/.test(h('content-security-policy')) && /frame-ancestors/.test(h('content-security-policy')), 'Content-Security-Policy ausente ou sem default-src/frame-ancestors');
t.ok(!/unsafe-inline/.test((h('content-security-policy').match(/script-src[^;]*/) || [''])[0]), "CSP: script-src não deveria permitir 'unsafe-inline'");
t.ok(h('x-content-type-options').toLowerCase() === 'nosniff', 'X-Content-Type-Options: nosniff ausente');
t.ok(!!h('referrer-policy'), 'Referrer-Policy ausente');
t.ok(/deny|sameorigin/i.test(h('x-frame-options')), 'X-Frame-Options ausente');
t.ok(/frame-ancestors\s+'none'|frame-ancestors\s+'self'/.test(h('content-security-policy')), "CSP: frame-ancestors deveria ser 'none' ou 'self'");
const nf = await fetch(`${SITE}/nao-existe-qa.html`);
t.ok(nf.status === 404 && /não encontrada|nao encontrada|n&atilde;o encontrada/i.test(await nf.text()), '404.html não é servida para páginas inexistentes');

// 2) Nenhuma violação de CSP ao carregar páginas (públicas e logadas)
const violacoes = new Set();
function hook(page, nome) {
  page.on('console', (m) => { if (/Content Security Policy|violates the following/i.test(m.text())) violacoes.add(`${nome} | ${m.text().slice(0, 170)}`); });
}
{
  const ctx = await browser.newContext(); const page = await ctx.newPage(); let atual = '';
  page.on('console', (m) => { if (/Content Security Policy|violates the following/i.test(m.text())) violacoes.add(`${atual} | ${m.text().slice(0, 170)}`); });
  for (const p of listPages().filter((x) => !x.roles.length)) { atual = p.file; await page.goto(`${SITE}/${p.file}`); await page.waitForTimeout(400); }
  await ctx.close();
}
for (const role of ['empresa', 'usina', 'pessoa_fisica']) {
  const ctx = await browser.newContext(); const page = await ctx.newPage(); let atual = `login-${role}`;
  page.on('console', (m) => { if (/Content Security Policy|violates the following/i.test(m.text())) violacoes.add(`[${role}] ${atual} | ${m.text().slice(0, 170)}`); });
  await loginAs(page, role);
  for (const p of listPages().filter((x) => x.roles.includes(role))) { atual = p.file; await page.goto(`${SITE}/${p.file}`); await page.waitForTimeout(700); }
  await ctx.close();
}
await browser.close();
for (const v of violacoes) t.ok(false, `violação de CSP: ${v}`);
t.done('headers');
