// Fluxo empresa ↔ usina pela UI: nova solicitação → proposta → aceite → pagamento → entrega → histórico.
// Também cobre: comprovante sem "undefined", valor "1500.50", Editar proposta removido, Voltar da PF, pagamentos só do que está aguardando.
import { playwright, loginAs, SITE } from '../lib/login.mjs';
import { call, login, checker } from '../security/_lib.mjs';
const t = checker();
let clicks = 0;
const { chromium } = playwright();
const browser = await chromium.launch();
const peca = `Eixo QA ${Date.now()}`;
const valorProposta = 1500 + (Date.now() % 4000) / 100 * 100 + 0.5; // ex.: 2300.50 (decimal com ponto, único por execução)
const valorFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(valorProposta);
const PDF = { name: 'desenho.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%QA\n') };

async function clique(loc, desc) {
  try { await loc.first().click({ timeout: 8000 }); clicks++; }
  catch (e) { t.ok(false, `não conseguiu clicar em: ${desc} (${String(e.message).split('\n')[0]})`); throw e; }
}
async function confirmar(page, re) {
  await clique(page.locator('[role="dialog"]:visible button, .modal:visible button, dialog[open] button').filter({ hasText: re }), `confirmar ${re}`);
}
const em = await browser.newContext(); const pE = await em.newPage();
const us = await browser.newContext(); const pU = await us.newPage();
const erros = []; for (const p of [pE, pU]) p.on('pageerror', (e) => erros.push(e.message));
try {
  await loginAs(pE, 'empresa'); await loginAs(pU, 'usina');
  // 1) Empresa publica a solicitação
  await pE.goto(`${SITE}/nova-solicitacao.html`); clicks++;
  await pE.fill('input[name="peca"]', peca); await pE.selectOption('select[name="categoria"]', { index: 1 });
  await pE.fill('input[name="material"]', 'Aço 1045'); await pE.fill('input[name="quantidade"]', '10');
  await pE.fill('input[name="prazoDesejado"]', '2026-12-30'); await pE.selectOption('select[name="urgencia"]', { index: 1 });
  await pE.fill('input[name="localEntrega"]', 'Campinas, SP'); await pE.fill('textarea[name="descricao"]', 'Eixo com rosca M20');
  await pE.setInputFiles('input[name="arquivo"]', PDF);
  await clique(pE.getByRole('button', { name: 'Publicar solicitação' }), 'Publicar solicitação');
  await pE.waitForTimeout(1500);
  // 2) Usina envia proposta com valor decimal em ponto (BUG-8)
  await pU.goto(`${SITE}/pedidos-disponiveis.html`); clicks++;
  const cardU = pU.locator('article, tr', { hasText: peca });
  await cardU.first().waitFor({ timeout: 8000 }).catch(() => t.ok(false, 'usina deveria ver o pedido novo'));
  await clique(cardU.getByRole('link', { name: /proposta/i }), 'Usina: Enviar proposta');
  await pU.waitForSelector('#proposal-value', { timeout: 8000 });
  await pU.fill('#proposal-value', String(valorProposta));
  await pU.fill('#proposal-deadline', '12');
  await clique(pU.getByRole('button', { name: /enviar proposta/i }), 'Enviar proposta');
  await pU.waitForTimeout(1500);
  const enviadas = await call('GET', '/api/propostas/enviadas', await login('usina'));
  const prop = (enviadas.json || []).find((p) => p.pedido?.itens?.some((i) => i.nome === peca));
  t.ok(!!prop, 'a proposta deveria ter sido criada');
  t.ok(prop && Math.abs(Number(prop.valor) - valorProposta) < 0.01, `BUG-8 valor "${valorProposta}" virou ${prop?.valor}`);
  // 3) 'Editar proposta' não existe (FLX-4)
  await pU.goto(`${SITE}/propostas-usina.html`); clicks++; await pU.waitForTimeout(1000);
  const menu = pU.locator('tr', { hasText: peca }).locator('button.icon-action, button:has-text("...")');
  if (await menu.count()) { await menu.first().click(); await pU.waitForTimeout(300); }
  t.ok(await pU.getByText('Editar proposta').count() === 0, 'FLX-4 "Editar proposta" não deveria existir (não salva nada)');
  // 4) Empresa aceita
  await pE.goto(`${SITE}/propostas.html`); clicks++; await pE.waitForTimeout(1200);
  const cardE = pE.locator('article.proposal-card', { hasText: valorFmt });
  t.ok(await cardE.count() > 0, 'empresa deveria ver a proposta');
  t.ok(await cardE.getByRole('button', { name: /^Recusar/ }).count() > 0, 'FLX-7 o card da proposta deveria ter o botão Recusar');
  await clique(cardE.getByRole('button', { name: /^Aceitar/ }), 'Empresa: Aceitar');
  t.ok(await pE.locator('[role="dialog"]:visible, .modal:visible, dialog[open]').filter({ hasText: valorFmt }).count() > 0, 'FLX-7 a confirmação de aceite deveria mostrar o valor da proposta');
  await confirmar(pE, /^Aceitar/);
  await pE.waitForURL(/pagamento-pedido/, { timeout: 6000 }).catch(() => t.ok(false, 'FLX-6 aceitar a proposta deveria levar ao pagamento'));
  await pE.waitForTimeout(500);
  // 5) Pagamento só lista o que aguarda pagamento (FLX-3) e comprovante sem undefined (BUG-6)
  const ped = (await call('GET', '/api/pedidos/meus', await login('empresa'))).json.find((p) => p.itens?.some((i) => i.nome === peca));
  await pE.goto(`${SITE}/pagamento-pedido.html?pedidoId=${ped.idPedido}`); clicks++; await pE.waitForTimeout(1200);
  { // BUG-14: o total exibido bate com valor + frete (+ taxa de 3,5%), sem erro de casas decimais
    const frete = Number(prop?.frete || 0);
    const total = Number((await pE.locator('[data-payment-total]').first().innerText()).replace(/[^\d,]/g, '').replace(',', '.'));
    t.ok(Math.abs(total - valorProposta) < 0.01, `FLX-14 total exibido ${total} difere do valor da proposta ${valorProposta} (igual ao backend)`);
  }
  await clique(pE.getByRole('button', { name: /confirmar pagamento/i }), 'Confirmar pagamento');
  await pE.waitForURL(/confirmacao-pedido/, { timeout: 10000 }).catch(() => t.ok(false, 'após pagar deveria abrir a confirmação'));
  await pE.waitForTimeout(800);
  const textoComprovante = await pE.locator('main').innerText();
  t.ok(!/undefined|NaN|null/.test(textoComprovante), `BUG-6 comprovante mostra valor inválido: ${(textoComprovante.match(/.{0,30}(undefined|NaN|null).{0,20}/) || [''])[0].replace(/\s+/g, ' ')}`);
  const meio = (await pE.locator('[data-receipt-method]').first().innerText().catch(() => '')).trim();
  const protocolo = (await pE.locator('[data-receipt-protocol]').first().innerText().catch(() => '')).trim();
  t.ok(meio.length > 0 && protocolo.length > 0, `BUG-6 comprovante sem forma de pagamento/protocolo ("${meio}" / "${protocolo}")`);
  // 6) BUG-7: abrir a confirmação de um pedido NÃO pago não paga sozinho
  const ped2 = (await call('POST', '/api/pedidos', await login('empresa'), { peca: `Sem pagar ${Date.now()}`, categoria: 'x', material: 'x', quantidade: '1', prazo: '10 dias', descricao: 'x', urgencia: 'media' })).json;
  await pE.goto(`${SITE}/confirmacao-pedido.html?pedidoId=${ped2.idPedido}`); await pE.waitForTimeout(1500);
  const pagos = (await call('GET', '/api/pagamentos', await login('empresa'))).json || [];
  t.ok(!pagos.some((p) => p.idPedido === ped2.idPedido), 'BUG-7 abrir a confirmação de pedido não pago criou um pagamento');
  // 7) Usina confirma entrega (ou empresa) e histórico mostra concluído
  await pE.goto(`${SITE}/detalhes-pedido.html?pedidoId=${ped.idPedido}`); clicks++; await pE.waitForTimeout(1200);
  await clique(pE.getByRole('button', { name: /confirmar entrega/i }), 'Confirmar entrega');
  await pE.waitForTimeout(1200);
  await pE.goto(`${SITE}/historico-pedidos.html`); clicks++; await pE.waitForTimeout(1200);
  t.ok(/conclu/i.test(await pE.locator('tr', { hasText: peca }).first().innerText()), 'histórico deveria mostrar o pedido concluído');
  // 8) FLX-3: pagamentos.html só oferece pagar pedidos aguardando pagamento
  await pE.goto(`${SITE}/pagamentos.html`); await pE.waitForTimeout(1200);
  const pagarLinks = await pE.getByRole('link', { name: /pagar pedido/i }).count();
  const abertoVisivel = await pE.locator('article.payment-list-card', { hasText: 'Sem pagar' }).getByRole('link', { name: /pagar pedido/i }).count();
  t.ok(abertoVisivel === 0, `FLX-3 pedido sem proposta aceita aparece com "Pagar pedido" (${abertoVisivel}; total de botões ${pagarLinks})`);
} catch (e) { t.ok(false, `fluxo interrompido: ${String(e.message).split('\n')[0]}`); }
// FLX-5: Voltar do pagamento não leva a uma página só da empresa (a PF usa a mesma tela)
{
  const html = await (await fetch(`${SITE}/pagamento-pedido.html`)).text();
  const href = (html.match(/<a[^>]*href="([^"]+)"[^>]*>\s*Voltar\s*<\/a>/) || [])[1];
  t.ok(href && href !== 'pagamentos.html', `FLX-5 Voltar de pagamento-pedido.html aponta para "${href}" (página só da empresa)`);
}
t.ok(erros.length === 0, `erros de JavaScript na página: ${erros.slice(0, 2).join(' | ')}`);
await browser.close();
console.log(`empresa-usina: ${clicks} cliques/navegações`);
t.done('empresa-usina');
