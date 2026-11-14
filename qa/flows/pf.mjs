// Fluxo da pessoa física pela UI: catálogo → solicitar compra → usina aceita → pagar → separar/enviar → PF confirma entrega → avaliar.
// Imprime só falhas e o total de cliques. Uso: node qa/flows/pf.mjs
import { playwright, loginAs, SITE } from '../lib/login.mjs';
import { call, login, checker } from '../security/_lib.mjs';
const t = checker();
let clicks = 0; const log = [];
const { chromium } = playwright();
const browser = await chromium.launch();
const nome = `Peca QA ${Date.now()}`;

// Preparação (API): a usina demo cadastra a peça do catálogo.
const usiTok = await login('usina');
const peca = await call('POST', '/api/pecas-comerciais', usiTok, { nome, material: 'Aco', categoria: 'Eixos', descricao: 'qa', estoque: '50', unidadeEstoque: 'un', valorUnitario: '100', prazoEntregaDias: '5' });
t.ok(peca.status < 300, `preparação: peça não criada (${peca.status})`);

async function clique(page, loc, desc) {
  try { await loc.first().click({ timeout: 8000 }); clicks++; log.push(desc); }
  catch (e) { t.ok(false, `não conseguiu clicar em: ${desc} (${String(e.message).split('\n')[0]})`); throw e; }
}
async function confirmarModal(page, texto) {
  await clique(page, page.locator('[role="dialog"]:visible button, .modal:visible button, dialog[open] button').filter({ hasText: new RegExp(`^${texto}$`) }), `confirmar "${texto}"`);
}
const pf = await browser.newContext(); const pPf = await pf.newPage();
const us = await browser.newContext(); const pUs = await us.newPage();
try {
  await loginAs(pPf, 'pessoa_fisica'); await loginAs(pUs, 'usina');
  // 1) catálogo → peça
  await pPf.goto(`${SITE}/catalogo-pessoa-fisica.html`); clicks++;
  await pPf.fill('.js-table-search', nome);
  const card = pPf.locator('article.order-opportunity', { hasText: nome });
  t.ok(await card.count() === 1, 'a peça nova deveria aparecer no catálogo');
  await clique(pPf, card.locator('a.btn-primary'), 'Ver detalhes e comprar');
  // 2) solicitar compra
  await pPf.fill('input[name="quantidade"]', '2');
  await clique(pPf, pPf.getByRole('button', { name: 'Solicitar compra' }), 'Solicitar compra');
  await pPf.waitForTimeout(1500);
  // 3) usina aceita
  await pUs.goto(`${SITE}/solicitacoes-pecas-usina.html`); clicks++;
  const linhaU = pUs.locator('tr', { hasText: nome });
  await linhaU.first().waitFor({ timeout: 8000 }).catch(() => t.ok(false, 'usina deveria ver a solicitação da peça'));
  await clique(pUs, linhaU.locator('[data-acao="aceitar"]'), 'Usina: Aceitar'); await confirmarModal(pUs, 'Aceitar');
  await pUs.waitForTimeout(800);
  // 4) PF paga
  await pPf.goto(`${SITE}/compras-pessoa-fisica.html`); clicks++;
  const linha = pPf.locator('tr', { hasText: nome });
  t.ok(await linha.count() > 0 && /aceita/i.test(await linha.first().innerText()), 'compra deveria aparecer como aceita para a PF');
  await clique(pPf, linha.getByRole('link', { name: 'Pagar' }), 'PF: Pagar (lista)');
  await clique(pPf, pPf.locator('[data-acao="pagar"]'), 'PF: Pagar agora');
  await clique(pPf, pPf.getByRole('button', { name: 'Confirmar pagamento' }), 'PF: Confirmar pagamento');
  await pPf.waitForTimeout(1000);
  // 5) usina separa e envia
  await pUs.reload(); await pUs.waitForTimeout(800);
  await clique(pUs, pUs.locator('tr', { hasText: nome }).locator('[data-acao="separar"]'), 'Usina: Iniciar separação'); await confirmarModal(pUs, 'Iniciar separação');
  await pUs.waitForTimeout(800);
  await clique(pUs, pUs.locator('tr', { hasText: nome }).locator('[data-acao="enviar"]'), 'Usina: Marcar como enviada'); await confirmarModal(pUs, 'Marcar como enviada');
  await pUs.waitForTimeout(800);
  // 6) PF confirma entrega
  await pPf.goto(`${SITE}/compras-pessoa-fisica.html`); clicks++;
  await clique(pPf, pPf.locator('tr', { hasText: nome }).getByRole('link', { name: 'Confirmar entrega' }), 'PF: Confirmar entrega (lista)');
  await clique(pPf, pPf.locator('[data-acao="entrega"]'), 'PF: Confirmar entrega');
  await confirmarModal(pPf, 'Sim, recebi');
  await pPf.waitForTimeout(1000);
  // 7) PF vê concluída e pode avaliar
  await pPf.goto(`${SITE}/compras-pessoa-fisica.html`); clicks++;
  const final = pPf.locator('tr', { hasText: nome });
  t.ok(/entregue/i.test(await final.first().innerText()), 'compra deveria aparecer como entregue');
  t.ok(await final.getByRole('link', { name: 'Avaliar' }).count() > 0, 'PF deveria poder avaliar a compra entregue');
} catch (e) { t.ok(false, `fluxo interrompido: ${String(e.message).split('\n')[0]}`); }
await browser.close();
console.log(`pf: ${clicks} cliques/navegações`);
t.done('pf');
