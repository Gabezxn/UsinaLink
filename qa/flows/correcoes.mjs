// Correções da equipe (16/11): nomes do menu, aba Usinas para a empresa, CEP no cadastro, endereço da pessoa física,
// local de entrega nas propostas e foto do projeto em janela (sem abrir página nova).
import { playwright, SITE, loginAs } from '../lib/login.mjs';
import { call, login, registrar, checker } from '../security/_lib.mjs';
const t = checker();
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// ---- API: cadastro exige CEP, cidade e estado; endereço da pessoa física
{
  const base = { nome: 'QA Sem CEP', email: `qa-semcep-${Date.now()}@teste.com`, senha: 'Demo@123', confirmarSenha: 'Demo@123', cnpj: '11222333000181', telefone: '11999990000', responsavel: 'QA' };
  let r = await call('POST', '/api/cadastro/empresa', null, base);
  t.ok(r.status === 400, `cadastro sem CEP deveria dar 400 (deu ${r.status})`);
  r = await call('POST', '/api/cadastro/empresa', null, { ...base, cep: '123', cidade: 'Sao Paulo', estado: 'SP' });
  t.ok(r.status === 400, `CEP curto deveria dar 400 (deu ${r.status})`);
  r = await call('POST', '/api/cadastro/empresa', null, { ...base, cep: '01310100', cidade: 'Sao Paulo', estado: 'XX' });
  t.ok(r.status === 400, `estado inexistente deveria dar 400 (deu ${r.status})`);
  const pf = await registrar('pessoa_fisica');
  const perfil = (await call('GET', '/api/pessoas-fisicas/perfil', pf.token)).json;
  t.ok(perfil?.cep === '01310100' && perfil?.cidade === 'Sao Paulo' && perfil?.estado === 'SP', `endereço do cadastro deveria aparecer no perfil (${JSON.stringify(perfil)})`);
  r = await call('PATCH', '/api/pessoas-fisicas/perfil', pf.token, { rua: 'Rua A', numero: '10', bairro: 'Centro', cep: '20040020', cidade: 'Rio de Janeiro', estado: 'rj' });
  t.ok(r.status < 300 && r.json?.estado === 'RJ' && r.json?.rua === 'Rua A', `PF deveria salvar endereço (${r.status} ${JSON.stringify(r.json)})`);
  r = await call('PATCH', '/api/pessoas-fisicas/perfil', pf.token, { cep: '12' });
  t.ok(r.status === 400, `CEP inválido no perfil deveria dar 400 (deu ${r.status})`);
  const emp = await registrar('empresa');
  const pe = (await call('GET', '/api/empresas/perfil', emp.token)).json;
  t.ok(pe?.endereco?.cep === '01310100' && pe?.endereco?.estado === 'SP', `empresa deveria nascer com endereço (${JSON.stringify(pe?.endereco)})`);
  const us = await registrar('usina');
  const pu = (await call('GET', '/api/usinas/perfil', us.token)).json;
  t.ok(pu?.endereco?.cep === '01310100' && pu?.endereco?.estado === 'SP', `usina deveria nascer com endereço (${JSON.stringify(pu?.endereco)})`);
}

const { chromium } = playwright();
const browser = await chromium.launch();
const nav = (page) => page.locator('.side-nav a').allInnerTexts();

// ---- Menus
{
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await loginAs(page, 'empresa');
  await page.waitForSelector('.side-nav a');
  const m = await nav(page);
  t.ok(m.some((x) => /Pedido sob medida/.test(x)) && !m.some((x) => /^Solicitações$/.test(x.trim())), `menu da empresa deveria dizer "Pedido sob medida" (${m.join(' | ')})`);
  t.ok(m.some((x) => /^Usinas$/.test(x.trim())), `menu da empresa sem "Usinas" (${m.join(' | ')})`);
  await page.click('.side-nav a:has-text("Usinas")');
  await page.waitForURL('**/usinas-pessoa-fisica.html');
  await page.waitForSelector('[data-usinas] .card', { timeout: 10000 }).catch(() => t.ok(false, 'lista de usinas não carregou para a empresa'));
  const nomeUsina = await page.locator('[data-usinas] .card a:has-text("Ver usina")').first().getAttribute('href').catch(() => null);
  t.ok(!!nomeUsina, 'usina sem link para detalhes');
  if (nomeUsina) { await page.goto(`${SITE}/${nomeUsina}`); await page.waitForSelector('[data-usina-titulo]'); await page.waitForTimeout(800); t.ok(!/Carregando/.test(await page.locator('[data-usina-titulo]').innerText()), 'detalhe da usina não carregou para a empresa'); }
  const pf = await (await browser.newContext()).newPage();
  await loginAs(pf, 'pessoa_fisica');
  await pf.waitForSelector('.side-nav a');
  const mp = await nav(pf);
  t.ok(mp.some((x) => /Propostas recebidas/.test(x)), `menu da pessoa física sem "Propostas recebidas" (${mp.join(' | ')})`);
}

// ---- Cadastro: campos de endereço obrigatórios
{
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${SITE}/cadastro.html`);
  for (const tipo of ['empresa', 'pessoa', 'usina']) {
    await page.click(`[data-choice-card="${tipo}"]`); await page.waitForTimeout(400);
    const rotulos = await page.locator('.signup-dynamic-form .field:not([hidden]) > span:first-child').allInnerTexts();
    t.ok(['CEP', 'Cidade', 'Estado (UF)'].every((r) => rotulos.includes(r)), `cadastro ${tipo}: faltam CEP/Cidade/UF (${rotulos.join(', ')})`);
    t.ok(rotulos[rotulos.length - 1] === 'Confirmar senha', `cadastro ${tipo}: confirmar senha deveria ser o último campo`);
  }
  await page.click('[data-choice-card="empresa"]'); await page.waitForTimeout(400);
  await page.fill('[data-field-key="cep"]', '0131');
  await page.fill('[data-field-key="estado"]', 'zz9');
  t.ok(await page.inputValue('[data-field-key="estado"]') === 'ZZ', 'UF deveria virar 2 letras maiúsculas');
  t.ok(/CEP/i.test(await page.locator('[data-field-key="cep"]').locator('xpath=ancestor::label').locator('.field-message').innerText()), 'CEP curto deveria avisar');
}

// ---- Propostas com local de entrega + foto em janela
{
  const empT = await login('empresa'); const usT = await login('usina');
  const ped = (await call('POST', '/api/solicitacoes', empT, { peca: 'Eixo Foto QA', categoria: 'Usinagem', material: 'Aco', quantidade: '3', prazoDesejado: '2027-12-30', urgencia: 'Normal', localEntrega: 'Rua Teste 10, Campinas - SP', descricao: 'qa', arquivoTecnico: PNG, arquivoTecnicoNome: 'foto-projeto.png' })).json;
  const idPedido = ped?.idPedido || ped?.pedido?.idPedido || ped?.id;
  t.ok(!!idPedido, `solicitação de teste não criada (${JSON.stringify(ped)})`);
  if (idPedido) {
    const ctxU = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    // usina: ver a foto sem abrir página nova
    const pu = await ctxU.newPage();
    await loginAs(pu, 'usina');
    await pu.goto(`${SITE}/pedidos-disponiveis.html`);
    await pu.waitForSelector('.order-opportunity');
    const alvo = pu.locator('.order-opportunity', { hasText: 'Eixo Foto QA' }).first();
    await alvo.getByRole('button', { name: 'Ver detalhes' }).click();
    const paginasAntes = ctxU.pages().length;
    await pu.getByRole('button', { name: 'Visualizar' }).click();
    await pu.waitForSelector('.photo-lightbox', { timeout: 5000 }).catch(() => t.ok(false, 'a foto não abriu em janela'));
    t.ok(ctxU.pages().length === paginasAntes, 'ver a foto não deveria abrir página/aba nova');
    t.ok(await pu.locator('.photo-lightbox img').count() === 1, 'janela da foto sem imagem');
    await pu.keyboard.press('Escape');
    t.ok(await pu.locator('.photo-lightbox').count() === 0, 'Esc deveria fechar a foto');
    await call('POST', '/api/propostas', usT, { pedidoId: String(idPedido), valor: '900', prazo: '10', frete: '10', observacao: 'qa' });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await loginAs(page, 'empresa');
    await page.goto(`${SITE}/propostas.html`); await page.waitForSelector('.proposal-card');
    const textos = await page.locator('.proposal-card').allInnerTexts();
    t.ok(textos.some((x) => /Entrega em/.test(x) && /Campinas/.test(x)), 'cartão da proposta deveria mostrar o local de entrega');
    t.ok(textos.every((x) => !/Aceitar proposta/.test(x) || /Recusar proposta/.test(x)), 'proposta com Aceitar deveria ter Recusar ao lado');
    const card = page.locator('.proposal-card', { hasText: 'Campinas' }).first();
    await card.getByRole('button', { name: 'Ver detalhes' }).click();
    await page.waitForSelector('#action-modal:not([hidden])');
    t.ok(/Local de entrega/i.test(await page.locator('#action-modal').innerText()) && /Campinas/.test(await page.locator('#action-modal').innerText()), 'detalhes deveriam mostrar o local de entrega');

  }
}
await browser.close();
t.done('correcoes');
