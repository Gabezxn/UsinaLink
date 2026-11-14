// SEC-19/20 (Review Focus 3): texto do usuário com HTML aparece como texto, sem executar, em TODAS as telas.
// Semeia payloads em todos os campos de texto via API e visita cada página de cada papel, clicando em botões de detalhe.
import { playwright, loginAs, SITE } from '../lib/login.mjs';
import { listPages } from '../lib/pages.mjs';
import { call, registrar, checker, novoPedido, novaProposta } from './_lib.mjs';
const t = checker();
const P = '<img src=x onerror=window.__xss=1>';
const ATTR = 'x" onmouseover="window.__xss=1" data-x="';
const JS = 'javascript:window.__xss=1';
const ep = await registrar('empresa', { nome: P, responsavel: P, cargo: P });
const up = await registrar('usina', { nome: P, responsavel: P, especialidade: P });
const fp = await registrar('pessoa_fisica', { nome: P });
const idUsina = up.full.usina?.idUsina;
const seed = [];
const tryCall = async (nome, ...a) => { const r = await call(...a); if (r.status >= 300) seed.push(`${nome}: status ${r.status}`); return r; };

const peca = (await tryCall('peca', 'POST', '/api/pecas-comerciais', up.token, { nome: P, material: P, categoria: P, descricao: P, imagem: ATTR, estoque: '10', unidadeEstoque: P, valorUnitario: '10', prazoEntregaDias: '5' })).json;
const ped = await novoPedido(ep.token, { peca: P, categoria: P, material: P, descricao: P, prazo: '15 dias', regiao: P, arquivo: JS, urgencia: P, quantidade: '5' });
const prop = await novaProposta(up.token, ped.idPedido, { observacao: P, prazo: P, valor: '1000', frete: '10' });
await tryCall('aceitar', 'PATCH', `/api/propostas/${prop.idProposta}/aceitar`, ep.token);
await tryCall('pagar', 'POST', '/api/pagamentos', ep.token, { pedidoId: String(ped.idPedido), metodo: P });
await tryCall('entrega', 'PATCH', `/api/pedidos/${ped.idPedido}/confirmar-entrega`, ep.token);
const av = (await tryCall('avaliar', 'POST', '/api/avaliacoes', ep.token, { pedidoId: String(ped.idPedido), notaGeral: 4, qualidade: 4, prazo: 4, comunicacao: 4, comentario: P })).json;
if (av?.idAvaliacao) await tryCall('responder', 'POST', `/api/avaliacoes/${av.idAvaliacao}/resposta`, up.token, { respostaDaUsina: P });
// pedido sob medida da PF
await tryCall('solicitacao', 'POST', '/api/solicitacoes', fp.token, { peca: P, categoria: P, material: P, quantidade: '2', prazoDesejado: '2026-12-01', urgencia: 'media', localEntrega: P, descricao: P, arquivoTecnico: ATTR, arquivoTecnicoNome: P });
await tryCall('solicitacao2', 'POST', '/api/solicitacoes', fp.token, { peca: 'Peca JS', categoria: 'x', material: 'y', quantidade: '2', prazoDesejado: '2026-12-02', urgencia: 'media', localEntrega: 'x', descricao: 'x', arquivoTecnico: JS, arquivoTecnicoNome: 'a.pdf' });
const pedFp = (await call('GET', '/api/pedidos/meus', fp.token)).json?.[0];
if (pedFp) await novaProposta(up.token, pedFp.idPedido, { observacao: P, prazo: P }).catch(() => {});
// compra de peça comercial, favoritos, bloqueio, funcionário
const idPeca = peca?.idPeca || peca?.idPecaComercial;
if (idPeca) await tryCall('compra', 'POST', '/api/solicitacoes-comerciais', fp.token, { peca: P, pecaId: String(idPeca), quantidade: '1', valorUnitario: '10' });
if (idUsina) {
  await tryCall('fav-usina', 'POST', `/api/favoritos/usina/${idUsina}`, fp.token);
  await tryCall('bloqueio', 'POST', '/api/solicitacoes-bloqueio-usina', ep.token, { usinaId: String(idUsina), pedidoId: String(ped.idPedido), motivo: P, descricao: P });
}
await tryCall('funcionario', 'POST', '/api/funcionarios', ep.token, { nome: P, email: `f${Date.now()}@teste.com`, cargo: P });

const { chromium } = playwright();
const browser = await chromium.launch();
const contas = [['empresa', ep], ['usina', up], ['pessoa_fisica', fp]];
for (const [role, conta] of contas) {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  await loginAs(page, role, { email: conta.email, senha: 'Demo@123' });
  for (const pg of listPages().filter((p) => p.roles.includes(role))) {
    const q = `?pedidoId=${ped.idPedido}&id=${ped.idPedido}`;
    try {
      await page.goto(`${SITE}/${pg.file}${q}`, { waitUntil: 'load' }); await page.waitForTimeout(900);
      let x = await page.evaluate(() => window.__xss);
      if (x) { t.ok(false, `[${role}] ${pg.file}: payload executou ao carregar`); continue; }
      const botoes = await page.$$('button:not([disabled]), a[role="button"], .table-action').catch(() => []);
      let n = 0;
      for (const b of botoes) {
        if (n >= 10) break;
        const txt = ((await b.textContent().catch(() => '')) || '').trim();
        if (!/(ver|detalh|abrir|editar|acompanh|a[cç][õo]es|proposta|solicit|\.\.\.)/i.test(txt) || /sair|excluir|cancelar|pagar|aceitar|recusar|confirmar/i.test(txt)) continue;
        n++;
        const url = page.url();
        await b.click({ timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(250);
        for (const a of (await page.$$('[onmouseover]').catch(() => [])).slice(0, 5)) await a.hover({ timeout: 1000 }).catch(() => {});
        for (const a of (await page.$$('a[href^="javascript:"]').catch(() => [])).slice(0, 3)) await a.click({ timeout: 1000 }).catch(() => {});
        x = await page.evaluate(() => window.__xss).catch(() => undefined);
        if (x) { t.ok(false, `[${role}] ${pg.file}: payload executou após clicar "${txt.slice(0, 20)}"`); break; }
        if (page.url() !== url) { await page.goto(`${SITE}/${pg.file}${q}`, { waitUntil: 'load' }); await page.waitForTimeout(500); }
        await page.keyboard.press('Escape');
      }
      for (const a of (await page.$$('[onmouseover]')).slice(0, 5)) await a.hover().catch(() => {});
      x = await page.evaluate(() => window.__xss).catch(() => undefined);
      if (x) t.ok(false, `[${role}] ${pg.file}: payload executou (hover/atributo injetado)`);
    } catch (e) { t.ok(false, `[${role}] ${pg.file}: erro ${String(e.message).split('\n')[0]}`); }
  }
  await ctx.close();
}
await browser.close();
if (seed.length) console.log(`(aviso, semeadura incompleta: ${seed.join('; ')})`);
t.done('xss-sweep');
