// Teste da base de acessibilidade (a11y.css + a11y.js). Imprime só falhas.
import { createRequire } from 'node:module';
import { playwright, loginAs, SITE } from '../lib/login.mjs';
const require = createRequire(import.meta.url);
const { chromium } = playwright();
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const browser = await chromium.launch();

async function suite(nome, page, url) {
  const t = (m) => `${nome}: ${m}`;
  await page.goto(url);
  await page.evaluate(() => { try { localStorage.removeItem('usinalinkA11y'); } catch {} });
  await page.reload();
  await page.waitForTimeout(300);
  // 1) skip link é o primeiro foco
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), href: document.activeElement?.getAttribute('href') }));
  ok(/Pular para o conte/i.test(first.text || ''), t(`primeiro Tab deveria focar "Pular para o conteúdo", focou "${first.text}"`));
  const alvo = await page.evaluate(() => { const m = document.querySelector('main'); return m && m.id; });
  ok(alvo === 'conteudo', t(`main deveria ter id="conteudo", tem "${alvo}"`));
  // 2) fonte
  await page.evaluate(() => window.UsinaA11y.set({ fontScale: 150 }));
  ok(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize) === '24px', t('fontScale 150 deveria dar 24px em <html>'));
  await page.reload(); await page.waitForTimeout(300);
  ok(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize) === '24px', t('fontScale deveria persistir após reload'));
  await page.evaluate(() => window.UsinaA11y.reset());
  // 3) alto contraste
  const bgNormal = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.evaluate(() => window.UsinaA11y.set({ contrast: 'high' }));
  const bgHigh = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(bgHigh !== bgNormal, t(`contraste alto deveria mudar o fundo do body (${bgNormal} → ${bgHigh})`));
  await page.addScriptTag({ path: require.resolve('axe-core') });
  const cc = await page.evaluate(async () => { const r = await window.axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] } }); return r.violations.flatMap((v) => v.nodes.map((n) => n.target.join(' '))).slice(0, 5); });
  ok(cc.length === 0, t(`contraste alto deveria passar no axe color-contrast: ${cc.join(', ')}`));
  await page.evaluate(() => window.UsinaA11y.reset());
  // 4) reduzir animações
  await page.evaluate(() => { const s = document.createElement('style'); s.textContent = '@keyframes qa-spin{to{transform:rotate(1turn)}}#qa-probe{animation:qa-spin 2s infinite}'; document.head.appendChild(s); const d = document.createElement('div'); d.id = 'qa-probe'; document.body.appendChild(d); });
  const dur0 = await page.evaluate(() => getComputedStyle(document.getElementById('qa-probe')).animationDuration);
  await page.evaluate(() => window.UsinaA11y.set({ reduceMotion: true }));
  const dur1 = await page.evaluate(() => getComputedStyle(document.getElementById('qa-probe')).animationDuration);
  ok(dur0 === '2s' && dur1 === '0s', t(`reduceMotion deveria zerar animation-duration (${dur0} → ${dur1})`));
  await page.evaluate(() => window.UsinaA11y.reset());
  // 5) VLibras
  ok(await page.evaluate(() => !!document.querySelector('[vw]')), t('elemento [vw] do VLibras ausente'));
  // 6) teclado: abrir painel, foco preso, ESC devolve foco
  await page.focus('#a11y-toggle');
  await page.keyboard.press('Enter');
  ok(await page.evaluate(() => { const p = document.getElementById('a11y-panel'); return !!p && !p.hidden && document.getElementById('a11y-toggle').getAttribute('aria-expanded') === 'true'; }), t('Enter no botão deveria abrir o painel'));
  ok(await page.evaluate(() => document.getElementById('a11y-panel').contains(document.activeElement)), t('foco deveria entrar no painel'));
  let escapou = false;
  for (let i = 0; i < 40; i++) { await page.keyboard.press(i % 2 ? 'Tab' : 'Tab'); if (!(await page.evaluate(() => document.getElementById('a11y-panel').contains(document.activeElement)))) { escapou = true; break; } }
  for (let i = 0; i < 40 && !escapou; i++) { await page.keyboard.press('Shift+Tab'); if (!(await page.evaluate(() => document.getElementById('a11y-panel').contains(document.activeElement)))) { escapou = true; break; } }
  ok(!escapou, t('foco deveria ficar preso no painel'));
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => document.getElementById('a11y-panel').hidden), t('ESC deveria fechar o painel'));
  ok(await page.evaluate(() => document.activeElement === document.getElementById('a11y-toggle')), t('ESC deveria devolver o foco ao botão'));
}

{ const ctx = await browser.newContext(); const page = await ctx.newPage(); await suite('index', page, `${SITE}/index.html`); await ctx.close(); }
{ const ctx = await browser.newContext(); const page = await ctx.newPage(); await loginAs(page, 'empresa'); await suite('dashboard-empresa', page, `${SITE}/dashboard-empresa.html`); await ctx.close(); }
await browser.close();
if (fails.length) { console.log(fails.join('\n')); process.exit(1); }
console.log('OK a11y-base');
