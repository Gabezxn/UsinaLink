// FLX-1 e FLX-2: compra de peça do catálogo pela EMPRESA (acompanhar/pagar) e peça sem valor.
import { playwright, loginAs, SITE } from '../lib/login.mjs';
import { call, login, checker } from '../security/_lib.mjs';
const t = checker();
const { chromium } = playwright();
const browser = await chromium.launch();
const usi = await login('usina'); const emp = await login('empresa');
const nome = `Peca Empresa QA ${Date.now()}`;

// FLX-2: peça sem valor unitário não pode ser cadastrada
let r = await call('POST', '/api/pecas-comerciais', usi, { nome: `Sem valor ${Date.now()}`, estoque: '5' });
t.ok(r.status >= 400 && r.status < 500, `FLX-2 peça sem valor foi cadastrada (status ${r.status})`);

// Preparação: peça com valor, empresa solicita, usina aceita (API)
const peca = (await call('POST', '/api/pecas-comerciais', usi, { nome, valorUnitario: '250', estoque: '20', unidadeEstoque: 'un', prazoEntregaDias: '4' })).json;
const idPeca = peca.idPeca || peca.idPecaComercial;
const sol = await call('POST', '/api/solicitacoes-comerciais', emp, { peca: nome, pecaId: String(idPeca), quantidade: '2', valorUnitario: '250' });
t.ok(sol.status < 300, `preparação: solicitação da empresa falhou (${sol.status})`);
const idSol = sol.json?.idSolicitacaoComercial;
await call('PATCH', `/api/solicitacoes-comerciais/${idSol}/acao`, usi, { acao: 'aceitar' });

const ctx = await browser.newContext(); const page = await ctx.newPage();
try {
  await loginAs(page, 'empresa');
  await page.goto(`${SITE}/pecas-comerciais-empresa.html`); await page.waitForTimeout(1500);
  const linha = page.locator('tr', { hasText: nome });
  const txt = await linha.first().innerText().catch(() => '');
  t.ok(/aceita/i.test(txt) && !/registrada/i.test(txt), `FLX-1 a tabela deveria mostrar o status real "Aceita" (mostra: ${txt.replace(/\s+/g, ' ').slice(0, 80)})`);
  const link = linha.locator('a[href*="compra.html"]').first();
  t.ok(await link.count() > 0, 'FLX-1 deveria haver link para acompanhar/pagar a compra');
  await link.click({ timeout: 5000 });
  await page.waitForSelector('[data-acao="pagar"]', { timeout: 8000 }).catch(() => t.ok(false, 'FLX-1 a empresa deveria ver "Pagar agora" na compra aceita'));
  const logado = await page.evaluate(() => JSON.parse(sessionStorage.getItem('usinalinkSession') || '{}').tipo);
  t.ok(logado === 'empresa', 'FLX-1 a empresa foi desconectada ao abrir a compra');
  const menu = await page.locator('nav.side-nav a').allInnerTexts();
  t.ok(menu.some((m) => /pe[cç]as comerciais/i.test(m)) && !menu.some((m) => /minhas compras/i.test(m)), `FLX-1 menu da compra deveria ser o da empresa (${menu.slice(0, 4).join(', ')})`);
  await page.click('[data-acao="pagar"]');
  await page.getByRole('button', { name: 'Confirmar pagamento' }).click({ timeout: 5000 }).catch(() => t.ok(false, 'FLX-1 formulário de pagamento não abriu'));
  await page.waitForTimeout(1200);
  const apos = (await call('GET', `/api/solicitacoes-comerciais/${idSol}`, emp)).json?.status;
  t.ok(apos === 'paga', `FLX-1 após pagar o status deveria ser "paga" (é "${apos}")`);
} catch (e) { t.ok(false, `fluxo interrompido: ${String(e.message).split('\n')[0]}`); }
await browser.close();
t.done('empresa-compra');
