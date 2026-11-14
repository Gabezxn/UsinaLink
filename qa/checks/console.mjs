// Uso: node qa/checks/console.mjs [--role=...] . Imprime: pagina | tipo | detalhe (só falhas). Sai 1 se houver.
import { playwright, loginAs, SITE, API } from '../lib/login.mjs';
import { listPages } from '../lib/pages.mjs';
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const { chromium } = playwright();
const ROLES = args.role ? [args.role] : ['empresa', 'usina', 'pessoa_fisica'];
const lines = new Set(); let current = '';
const browser = await chromium.launch();
const add = (t, d) => lines.add(`${current} | ${t} | ${String(d).slice(0, 160)}`);
function hook(page) {
  page.on('console', (m) => { if (m.type() === 'error') add('console', m.text()); });
  page.on('pageerror', (e) => add('excecao', e.message));
  page.on('response', (r) => { if (r.status() >= 400 && (r.url().startsWith(SITE) || r.url().startsWith(API))) add(`http-${r.status()}`, r.url().replace(SITE, '').replace(API, 'API')); });
}
async function links(page) { // links internos quebrados
  const hrefs = await page.$$eval('a[href]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))].filter((h) => h && !/^(#|mailto:|tel:|javascript:|https?:)/.test(h)));
  for (const h of hrefs) { const f = h.split('#')[0].split('?')[0]; if (!f) continue; const r = await page.request.get(`${SITE}/${f.replace(/^\//, '')}`); if (r.status() >= 400) add('link-quebrado', h); }
}
{ const ctx = await browser.newContext(); const page = await ctx.newPage(); hook(page);
  for (const p of listPages().filter((p) => !p.roles.length)) { current = p.file; try { await page.goto(`${SITE}/${p.file}`, { waitUntil: 'load' }); await page.waitForTimeout(400); await links(page); } catch (e) { add('visita', e.message.split('\n')[0]); } }
  await ctx.close(); }
for (const role of ROLES) {
  const ctx = await browser.newContext(); const page = await ctx.newPage(); hook(page); current = `login-${role}`;
  try { await loginAs(page, role); } catch (e) { add('login', e.message.split('\n')[0]); await ctx.close(); continue; }
  for (const p of listPages().filter((p) => p.roles.includes(role))) { current = `${p.file} [${role}]`; try { await page.goto(`${SITE}/${p.file}`, { waitUntil: 'load' }); await page.waitForTimeout(800); await links(page); } catch (e) { add('visita', e.message.split('\n')[0]); } }
  await ctx.close();
}
await browser.close();
console.log([...lines].join('\n')); console.log(`TOTAL problemas: ${lines.size}`);
process.exit(lines.size ? 1 : 0);
