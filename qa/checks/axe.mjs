// Uso: node qa/checks/axe.mjs [--role=empresa|usina|pessoa_fisica] [--only=arquivo.html] [--summary]
// Imprime só violações serious|critical: pagina | regra | seletor. Sai 1 se houver alguma.
import { createRequire } from 'node:module';
import { playwright, loginAs, SITE } from '../lib/login.mjs';
import { listPages } from '../lib/pages.mjs';
const require = createRequire(import.meta.url);
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const { chromium } = playwright();
const axePath = require.resolve('axe-core');
const ROLES = args.role ? [args.role] : ['empresa', 'usina', 'pessoa_fisica'];
const pages = listPages().filter((p) => !args.only || p.file === args.only);
const lines = []; const porRegra = {};
const browser = await chromium.launch();

async function scan(page, file) {
  await page.addScriptTag({ path: axePath });
  const res = await page.evaluate(async () => await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
  for (const v of res.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) {
    for (const n of v.nodes.slice(0, 3)) { lines.push(`${file} | ${v.id} | ${n.target.join(' ')}`); }
    porRegra[v.id] = (porRegra[v.id] || 0) + v.nodes.length;
  }
}
const seen = new Set();
// Páginas públicas
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  for (const p of pages.filter((p) => !p.roles.length)) {
    try { await page.goto(`${SITE}/${p.file}`, { waitUntil: 'load' }); await page.waitForTimeout(300); await scan(page, p.file); seen.add(p.file); }
    catch (e) { lines.push(`${p.file} | erro-de-visita | ${String(e.message).split('\n')[0]}`); }
  }
  await ctx.close();
}
// Páginas protegidas, por papel
for (const role of ROLES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  try { await loginAs(page, role); } catch (e) { lines.push(`login-${role} | erro-de-login | ${String(e.message).split('\n')[0]}`); await ctx.close(); continue; }
  for (const p of pages.filter((p) => p.roles.includes(role))) {
    const key = `${role}:${p.file}`;
    try { await page.goto(`${SITE}/${p.file}`, { waitUntil: 'load' }); await page.waitForTimeout(800); await scan(page, `${p.file} [${role}]`); seen.add(key); }
    catch (e) { lines.push(`${p.file} [${role}] | erro-de-visita | ${String(e.message).split('\n')[0]}`); }
  }
  await ctx.close();
}
await browser.close();
if ('summary' in args) console.log(Object.entries(porRegra).sort((a, b) => b[1] - a[1]).map(([r, c]) => `${r}: ${c}`).join('\n'));
else console.log(lines.join('\n'));
console.log(`TOTAL violações serious/critical: ${lines.length}`);
process.exit(lines.length ? 1 : 0);
