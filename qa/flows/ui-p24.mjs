// Pedido 24: cores das contas, "Mostrar senha" no cadastro de pessoa física, aviso x botão de acessibilidade, prazo em dias/meses.
import { playwright, SITE, API, loginAs } from '../lib/login.mjs';
import { checker } from '../security/_lib.mjs';
const t = checker();
const { chromium } = playwright();
const browser = await chromium.launch();

const fundoBotao = (page, sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).backgroundImage + '|' + getComputedStyle(el).backgroundColor);

// 1) Cores: cada conta com a sua
{
  const page = await (await browser.newContext()).newPage();
  const cores = {};
  for (const [nome, arq] of [['empresa', 'login-empresa.html'], ['pf', 'login-pessoa-fisica.html'], ['usina', 'login-usina.html']]) {
    await page.goto(`${SITE}/${arq}`);
    cores[nome] = await fundoBotao(page, 'form.js-login-form [type="submit"]');
    cores[nome + '_fundo'] = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
  }
  t.ok(cores.empresa !== cores.pf, 'login: botão da pessoa física tem a mesma cor da empresa');
  t.ok(cores.empresa_fundo !== cores.pf_fundo, 'login: fundo da pessoa física igual ao da empresa');
  t.ok(cores.pf !== cores.usina, 'login: botão da pessoa física igual ao da usina');
  // cadastro: trocar de tipo muda o tema
  await page.goto(`${SITE}/cadastro.html`);
  const fundoEmp = await page.evaluate(() => getComputedStyle(document.querySelector('.signup-panel')).borderColor);
  await page.click('[data-choice-card="pessoa"]');
  const fundoPf = await page.evaluate(() => getComputedStyle(document.querySelector('.signup-panel')).borderColor);
  t.ok(fundoEmp !== fundoPf, 'cadastro: painel da pessoa física igual ao da empresa');
  t.ok(await page.evaluate(() => document.body.classList.contains('pf-mode')), 'cadastro: pessoa física sem tema próprio');
  await page.click('[data-choice-card="usina"]');
  t.ok(await page.evaluate(() => document.body.classList.contains('signup-usina') && !document.body.classList.contains('pf-mode')), 'cadastro: usina sem tema próprio');
}

// 2) Mostrar senha em todos os tipos de conta, mesmo trocando o tipo no cadastro
{
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${SITE}/cadastro.html`);
  for (const [tipo, ids] of [['pessoa', ['signup-field-5', 'signup-field-6']], ['empresa', ['signup-field-6']], ['usina', ['signup-field-6']], ['pessoa', ['signup-field-5', 'signup-field-6']]]) {
    await page.click(`[data-choice-card="${tipo}"]`);
    for (const id of ids) {
      const btn = page.locator(`#${id}`).locator('xpath=..').locator('.pass-toggle');
      t.ok(await btn.count() === 1 && await btn.isVisible(), `cadastro ${tipo}: campo ${id} sem botão Mostrar`);
      if (await btn.count()) {
        await btn.click();
        t.ok(await page.locator(`#${id}`).getAttribute('type') === 'text', `cadastro ${tipo}: ${id} não mostrou a senha`);
        await btn.click();
        t.ok(await page.locator(`#${id}`).getAttribute('type') === 'password', `cadastro ${tipo}: ${id} não voltou a ocultar`);
      }
    }
    // campo que não é senha neste tipo não pode ter botão
    const cargo = tipo === 'pessoa' ? 'signup-field-4' : 'signup-field-5';
    t.ok(await page.locator(`#${cargo}`).locator('xpath=..').locator('.pass-toggle').count() === 0, `cadastro ${tipo}: ${cargo} não é senha mas tem botão Mostrar`);
  }
  for (const arq of ['login-pessoa-fisica.html', 'login-empresa.html', 'login-usina.html']) {
    await page.goto(`${SITE}/${arq}`);
    t.ok(await page.locator('.pass-toggle').isVisible(), `${arq}: sem botão Mostrar`);
  }
}

// 3) Aviso "sucesso" não fica atrás nem em cima do botão de acessibilidade
{
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 780 }]) {
    const ctx = await browser.newContext({ viewport }); const page = await ctx.newPage();
    await page.goto(`${SITE}/login-empresa.html`);
    await page.evaluate(() => window.showToast('Login realizado com sucesso'));
    await page.waitForTimeout(400);
    const [a, b] = await Promise.all([page.locator('.toast.show').boundingBox(), page.locator('.a11y-toggle').boundingBox()]);
    const sobrepoe = a && b && !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
    t.ok(a && b, `aviso (${viewport.width}px): aviso ou botão de acessibilidade não apareceu`);
    t.ok(!sobrepoe, `aviso (${viewport.width}px): sobreposto pelo botão de acessibilidade`);
    await ctx.close();
  }
}

// 4) Prazo: só um número; unidade automática (dias ou meses); acentos
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await loginAs(page, 'usina');
  const token = await page.evaluate(() => sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken'));
  const lista = await (await fetch(`${API}/api/pedidos/disponiveis`, { headers: { Authorization: `Bearer ${token}` } })).json().catch(() => []);
  const pedido = (Array.isArray(lista) ? lista : []).find((p) => ['aberto', 'em_negociacao'].includes(p.status));
  t.ok(!!pedido, 'sem pedido aberto para testar o prazo');
  if (pedido) {
    await page.goto(`${SITE}/enviar-proposta.html?pedidoId=${pedido.idPedido}`);
    await page.waitForSelector('#proposal-deadline');
    t.ok(await page.locator('#proposal-deadline').getAttribute('type') === 'number', 'prazo: campo deveria ser numérico');
    const caso = async (digitado, esperado) => {
      await page.fill('#proposal-deadline', digitado);
      const prev = (await page.locator('#preview-deadline').innerText()).trim();
      t.ok(prev === esperado, `prazo ${digitado}: resumo mostra "${prev}", esperado "${esperado}"`);
    };
    await caso('1', '1 dia'); await caso('18', '18 dias'); await caso('30', '1 mês'); await caso('45', '45 dias'); await caso('90', '3 meses'); await caso('100', '100 dias');
    t.ok(/Prazo de fabricação/.test(await page.locator('.quote-preview').innerText()), 'resumo sem acento em "fabricação"');
    await page.fill('#proposal-value', '1500,00'); await page.fill('#proposal-deadline', '90');
    await page.click('.js-send-proposal');
    await page.waitForURL('**/propostas-usina.html', { timeout: 20000 }).catch(() => t.ok(false, 'prazo: proposta não foi enviada'));
    await page.waitForSelector('tbody tr[data-search-row]');
    const linhas = await page.locator('tbody tr[data-search-row]').allInnerTexts();
    t.ok(linhas.some((l) => /3 meses/.test(l)), 'lista de propostas enviadas não mostra "3 meses"');
    await page.locator('tbody tr[data-search-row]', { hasText: '3 meses' }).first().locator('button', { hasText: /detalhes/i }).click();
    await page.waitForTimeout(400);
    const modal = await page.locator('#action-modal').innerText();
    t.ok(/prazo de fabricação/i.test(modal) && /observações/i.test(modal) && !/fabricacao|observacoes/i.test(modal), `detalhes da proposta sem acento: ${modal.slice(0, 160).replace(/\n/g, ' | ')}`);
  }
  await ctx.close();
}
await browser.close();
t.done('ui-p24');
