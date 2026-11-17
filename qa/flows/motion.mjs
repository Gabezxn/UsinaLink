// Animações (versão de teste): chat "digitando…", troca de tipo de conta "pintada" e entrada ao rolar; tudo some com movimento reduzido.
import { playwright, SITE } from '../lib/login.mjs';
import { checker } from '../security/_lib.mjs';
const t = checker();
const { chromium } = playwright();
const browser = await chromium.launch();

// 1) Chat: bolinha de digitando, depois a resposta (tempo conforme o tamanho)
{
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${SITE}/index.html`);
  await page.click('.chat-abrir');
  const curta = 'Falar com atendimento';
  const longa = 'Como funciona?';
  const t0 = Date.now();
  await page.click(`.chat-atalhos button:has-text("${longa}")`);
  await page.waitForTimeout(250);
  t.ok(await page.locator('.chat-digitando').count() === 1, 'chat: não mostrou a bolinha de digitando');
  t.ok(await page.locator('.chat-bot', { hasText: 'Empresas e pessoas físicas' }).count() === 0, 'chat: respondeu na hora, sem digitar');
  t.ok(await page.locator('.chat-atalhos button').first().isDisabled(), 'chat: atalhos deveriam ficar desativados enquanto digita');
  await page.locator('.chat-bot', { hasText: 'Empresas e pessoas físicas' }).waitFor({ timeout: 6000 }).catch(() => t.ok(false, 'chat: resposta nunca apareceu'));
  const dur = Date.now() - t0;
  t.ok(dur >= 2000 && dur <= 4500, `chat: resposta longa levou ${dur} ms (esperado 2 a 4,5 s)`);
  t.ok(await page.locator('.chat-digitando').count() === 0, 'chat: a bolinha deveria sumir quando a resposta chega');
  t.ok(!(await page.locator('.chat-atalhos button').first().isDisabled()), 'chat: atalhos deveriam voltar a funcionar');
  // resposta curta é mais rápida que a longa
  const t1 = Date.now();
  await page.click('.chat-atalhos button:has-text("Quanto custa?")');
  await page.locator('.chat-bot', { hasText: 'cadastro é gratuito' }).waitFor({ timeout: 6000 });
  const dur2 = Date.now() - t1;
  t.ok(dur2 < dur, `chat: resposta curta (${dur2} ms) deveria ser mais rápida que a longa (${dur} ms)`);
  void curta;
}
// 2) Chat com movimento reduzido: quase imediato
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce' }); const page = await ctx.newPage();
  await page.goto(`${SITE}/index.html`);
  await page.click('.chat-abrir');
  const t0 = Date.now();
  await page.click('.chat-atalhos button:has-text("Como funciona?")');
  await page.locator('.chat-bot', { hasText: 'Empresas e pessoas físicas' }).waitFor({ timeout: 3000 });
  t.ok(Date.now() - t0 < 1200, 'chat (movimento reduzido): deveria responder rápido');
  await ctx.close();
}
// 3) Troca de tipo de conta: camada de pintura aparece, termina e limpa
{
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${SITE}/cadastro.html`);
  await page.click('[data-choice-card="pessoa"]');
  await page.waitForTimeout(300);
  t.ok(await page.locator('.paint-layer').count() === 1, 'pintura: camada não apareceu durante a troca');
  t.ok(await page.evaluate(() => document.body.classList.contains('pf-mode')), 'pintura: tema novo não foi aplicado');
  await page.screenshot({ path: process.env.TEMP + '/paint-meio.png' });
  await page.waitForTimeout(1300);
  t.ok(await page.locator('.paint-layer').count() === 0, 'pintura: camada não foi removida no fim');
  t.ok(!(await page.evaluate(() => document.body.classList.contains('paint-anim'))), 'pintura: classe temporária ficou no body');
  // clicar rápido várias vezes não deixa lixo nem quebra
  for (const tipo of ['usina', 'empresa', 'pessoa', 'usina']) await page.click(`[data-choice-card="${tipo}"]`);
  await page.waitForTimeout(1600);
  t.ok(await page.locator('.paint-layer').count() === 0, 'pintura: camadas sobraram após cliques rápidos');
  t.ok(await page.evaluate(() => document.body.classList.contains('signup-usina') && !document.body.classList.contains('pf-mode')), 'pintura: estado final errado após cliques rápidos');
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
}
// 4) Movimento reduzido: troca instantânea, sem camada
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce' }); const page = await ctx.newPage();
  await page.goto(`${SITE}/cadastro.html`);
  await page.click('[data-choice-card="pessoa"]');
  t.ok(await page.locator('.paint-layer').count() === 0, 'pintura (movimento reduzido): não deveria animar');
  t.ok(await page.evaluate(() => document.body.classList.contains('pf-mode')), 'pintura (movimento reduzido): tema não mudou');
  await ctx.close();
}
// 5) Página inicial: blocos entram ao rolar e acabam todos visíveis
{
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.goto(`${SITE}/index.html`);
  t.ok(await page.evaluate(() => document.documentElement.classList.contains('js-motion')), 'rolagem: efeito não foi ativado');
  const altura = await page.evaluate(() => document.body.scrollHeight);
  const naTela = () => page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight * 0.85 && r.bottom > 80; }).filter((el) => !el.classList.contains('is-visible')).length);
  const visiveis = () => page.evaluate(() => document.querySelectorAll('[data-reveal].is-visible').length);
  for (let y = 0; y < altura; y += 400) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.waitForTimeout(900);
  t.ok(await naTela() === 0, 'rolagem: bloco na tela ficou invisível');
  const primeiro = await page.evaluate(() => document.querySelector('[data-reveal]').classList.contains('is-visible'));
  t.ok(!primeiro, 'rolagem: bloco do topo deveria voltar ao estado inicial depois de sair da tela');
  // voltando ao topo, anima de novo
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1200);
  t.ok(await naTela() === 0, 'rolagem: ao voltar ao topo os blocos não reapareceram');
  t.ok(await visiveis() > 0, 'rolagem: nada visível ao voltar ao topo');
}
await browser.close();
t.done('motion');
