// Acessibilidade das páginas: modais, avisos, erros de formulário, autocomplete, menu, tabelas, títulos. Imprime só falhas.
import { playwright, loginAs, SITE } from '../lib/login.mjs';
import { listPages } from '../lib/pages.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checker } from '../security/_lib.mjs';
const t = checker();
const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'Site');
const { chromium } = playwright();
const browser = await chromium.launch();

// --- A11Y-10: toda página tem <h1>; A11Y-5: autocomplete em login/cadastro (estático)
for (const p of listPages()) {
  const html = readFileSync(join(SITE_DIR, p.file), 'utf8');
  if (!/<h1[\s>]/.test(html) && !/data-compra-titulo|<h1/.test(html)) t.ok(false, `A11Y-10 ${p.file} sem <h1>`);
  if (/^(login|cadastro)/.test(p.file)) {
    for (const m of html.matchAll(/<input[^>]*type="(email|password)"[^>]*>/g)) t.ok(/autocomplete=/.test(m[0]), `A11Y-5 ${p.file}: input ${m[1]} sem autocomplete`);
  }
}

// --- botão de acessibilidade não cobre o "Fale conosco" (nem o painel dele quando aberto)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const page = await ctx.newPage();
  await page.goto(`${SITE}/index.html`); await page.waitForTimeout(800);
  const cruza = (a, b) => a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  const toggle = await page.locator('#a11y-toggle').boundingBox();
  t.ok(!cruza(toggle, await page.locator('.chat-abrir').boundingBox()), 'botão de acessibilidade sobrepõe o "Fale conosco"');
  await page.locator('.chat-abrir').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  t.ok(!cruza(toggle, await page.locator('.chat-painel').boundingBox()), 'botão de acessibilidade sobrepõe o painel do chat');
  await page.locator('#a11y-toggle').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  t.ok(!cruza(await page.locator('#a11y-panel').boundingBox(), await page.locator('.chat-abrir').boundingBox()), 'painel de acessibilidade sobrepõe o "Fale conosco"');
  await ctx.close();
}
// --- login: toast com role, erros de formulário ligados
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto(`${SITE}/login-empresa.html`);
  await page.click('form.js-login-form [type="submit"]');
  await page.waitForTimeout(500);
  const campo = await page.evaluate(() => { const i = document.querySelector('input[name="email"]'); const d = i.getAttribute('aria-describedby'); const el = d && document.getElementById(d.split(' ')[0]); return { invalid: i.getAttribute('aria-invalid'), desc: d, msg: el ? el.textContent.trim() : '' }; });
  t.ok(campo.invalid === 'true' && campo.desc && campo.msg.length > 3, `A11Y-4 erro do campo e-mail não está ligado por aria-describedby (invalid=${campo.invalid}, desc=${campo.desc}, msg="${campo.msg}")`);
  await page.fill('input[name="email"]', 'x@y.com'); await page.fill('input[name="senha"]', 'errada123');
  await page.click('form.js-login-form [type="submit"]');
  await page.waitForSelector('.toast', { timeout: 8000 }).catch(() => t.ok(false, 'A11Y-2 o aviso (toast) não apareceu'));
  const toast = await page.evaluate(() => { const e = document.querySelector('.toast'); return e ? { role: e.getAttribute('role'), live: e.getAttribute('aria-live') } : null; });
  t.ok(toast && (toast.role === 'alert' || toast.role === 'status' || toast.live), `A11Y-2 toast sem role/aria-live (${JSON.stringify(toast)})`);
  await ctx.close();
}
// --- cadastro: autocomplete nos campos gerados por JS
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto(`${SITE}/cadastro-empresa.html`); await page.waitForTimeout(500);
  const faltando = await page.$$eval('form input[type="email"], form input[type="password"], form input[data-field-key="nome"]', (els) => els.filter((e) => !e.getAttribute('autocomplete')).map((e) => e.name || e.dataset.fieldKey || e.type));
  t.ok(faltando.length === 0, `A11Y-5 cadastro-empresa: campos sem autocomplete: ${faltando.join(', ')}`);
  await ctx.close();
}
// --- páginas logadas: menu, tabelas, modal
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await loginAs(page, 'usina');
  for (const file of ['dashboard-usina.html', 'propostas-usina.html', 'historico-pedidos.html']) {
    await page.goto(`${SITE}/${file}`); await page.waitForTimeout(1200);
    const r = await page.evaluate(() => ({
      nav: [...document.querySelectorAll('nav')].filter((n) => !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby')).length,
      aside: [...document.querySelectorAll('aside')].filter((n) => !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby')).length,
      ativoSemCurrent: [...document.querySelectorAll('nav a.active')].filter((a) => a.getAttribute('aria-current') !== 'page').length,
      tabelasSemCaption: [...document.querySelectorAll('table')].filter((tb) => !tb.querySelector('caption')).length,
      thSemScope: [...document.querySelectorAll('table th')].filter((th) => !th.getAttribute('scope')).length,
      wrapSemFoco: [...document.querySelectorAll('.table-wrap')].filter((w) => w.scrollWidth > w.clientWidth && w.getAttribute('tabindex') !== '0').length,
    }));
    t.ok(r.nav === 0, `A11Y-7 ${file}: ${r.nav} <nav> sem nome`);
    t.ok(r.aside === 0, `A11Y-10 ${file}: ${r.aside} <aside> sem nome`);
    t.ok(r.ativoSemCurrent === 0, `A11Y-7 ${file}: link ativo sem aria-current="page"`);
    t.ok(r.tabelasSemCaption === 0, `A11Y-8 ${file}: ${r.tabelasSemCaption} tabela(s) sem <caption>`);
    t.ok(r.thSemScope === 0, `A11Y-8 ${file}: ${r.thSemScope} <th> sem scope`);
    t.ok(r.wrapSemFoco === 0, `A11Y-8 ${file}: área rolável sem tabindex=0`);
  }
  // modal por teclado: foco entra, fica preso, ESC fecha e devolve o foco
  await page.goto(`${SITE}/propostas-usina.html`); await page.waitForTimeout(1200);
  const abrir = page.getByRole('button', { name: 'Ver detalhes' }).first();
  if (await abrir.count()) {
    await abrir.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    const dentro = () => page.evaluate(() => { const d = document.querySelector('.modal-backdrop:not([hidden]) [role="dialog"]'); return !!d && d.contains(document.activeElement); });
    t.ok(await dentro(), 'A11Y-3 ao abrir o modal o foco deveria entrar nele');
    let saiu = false;
    for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); if (!(await dentro())) { saiu = true; break; } }
    t.ok(!saiu, 'A11Y-3 o foco escapou do modal com Tab');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    t.ok(await page.evaluate(() => !document.querySelector('.modal-backdrop:not([hidden])')), 'A11Y-3 ESC deveria fechar o modal');
    t.ok(await page.evaluate(() => document.activeElement && document.activeElement.textContent.trim() === 'Ver detalhes'), 'A11Y-3 ao fechar o foco deveria voltar ao botão que abriu');
  } else t.ok(false, 'preparação: nenhuma proposta com "Ver detalhes" na tela da usina');
  await ctx.close();
}
// --- menu móvel: botão com aria-expanded
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } }); const page = await ctx.newPage();
  await loginAs(page, 'empresa'); await page.waitForTimeout(500);
  const tog = await page.evaluate(() => { const b = document.querySelector('.menu-toggle, [data-menu-toggle], button[aria-controls*="menu" i], button.mobile-menu'); return b ? { exp: b.getAttribute('aria-expanded'), ctl: b.getAttribute('aria-controls') } : null; });
  t.ok(tog && tog.exp !== null && tog.ctl, `A11Y-7 botão de menu móvel sem aria-expanded/aria-controls (${JSON.stringify(tog)})`);
  await ctx.close();
}
await browser.close();
t.done('a11y-pages');
