// Limpeza dos registros com script/HTML deixados por testes de segurança: apaga o que é lixo, neutraliza contas, não encosta no resto.
import { spawn, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backendEnv } from '../env/env.mjs';
import { checker, registrar, call, login, novoPedido, novaProposta } from './_lib.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const API2 = 'http://localhost:3002';
const WIN = process.platform === 'win32';
const t = checker();

const subir = () => {
  const env = backendEnv({ PORT: '3002', LIMPEZA_TESTE: 'true' });
  return spawn(WIN ? 'npx.cmd' : 'npx', ['ts-node', '--transpile-only', 'src/main.ts'], { cwd: join(ROOT, 'backend'), env, stdio: 'ignore', detached: !WIN, shell: WIN });
};
const parar = (p) => { try { if (WIN) spawnSync('taskkill', ['/PID', String(p.pid), '/T', '/F']); else process.kill(-p.pid, 'SIGTERM'); } catch {} };
const esperar = async () => { for (let i = 0; i < 160; i++) { try { if ((await fetch(`${API2}/`)).ok) return; } catch {} await new Promise((r) => setTimeout(r, 500)); } throw new Error('servidor nao subiu'); };

const XSS = '<img src=x onerror=alert(1)>';
const SCRIPT = '<script>alert(2)</script>';

// Contas: uma com nome malicioso (só neutraliza), uma normal
const suja = await registrar('empresa', { nome: SCRIPT, responsavel: 'QA' });
const normal = await registrar('empresa');
const usina = await login('usina');

// Pedido inteiro malicioso (some) e pedido legítimo com proposta maliciosa (só a proposta some)
const pedidoLixo = await novoPedido(normal.token, { peca: XSS });
const pedidoBom = await novoPedido(normal.token, { peca: 'Eixo legitimo 5 < 6 e a < b' });
const propostaLixo = await novaProposta(usina, pedidoBom.idPedido, { observacao: SCRIPT });
// Peça de catálogo maliciosa (some) e uma normal (fica)
const pecaLixo = (await call('POST', '/api/pecas-comerciais', usina, { nome: '<svg onload=alert(3)>', valorUnitario: '10' })).json;
const pecaBoa = (await call('POST', '/api/pecas-comerciais', usina, { nome: 'Flange legitimo', valorUnitario: '10' })).json;
t.ok(pedidoLixo?.idPedido && pecaLixo?.idPecaComercial && propostaLixo?.idProposta, 'preparação dos dados falhou');

const p = subir();
let resumo = null;
try {
  await esperar();
  resumo = await (await fetch(`${API2}/api/health/limpeza`)).json();
} finally { parar(p); }

t.ok(resumo?.rodou === true, `a limpeza deveria ter rodado (${JSON.stringify(resumo)})`);
t.ok((resumo?.erros || []).length === 0, `a limpeza não deveria ter erros (${JSON.stringify(resumo?.erros)})`);

const meus = (await call('GET', '/api/pedidos/meus', normal.token)).json || [];
t.ok(!meus.some((x) => x.idPedido === pedidoLixo.idPedido), 'o pedido com HTML deveria ter sido apagado');
t.ok(meus.some((x) => x.idPedido === pedidoBom.idPedido), 'o pedido legítimo (com "<" solto no texto) deveria continuar');
const enviadas = (await call('GET', '/api/propostas/enviadas', usina)).json || [];
t.ok(!enviadas.some((x) => x.idProposta === propostaLixo.idProposta), 'a proposta com script deveria ter sido apagada');
t.ok((await call('GET', `/api/pedidos/${pedidoBom.idPedido}`, usina)).status < 300, 'o pedido da proposta apagada deveria continuar existindo');
const pecas = (await call('GET', '/api/pecas-comerciais', usina)).json || [];
t.ok(!pecas.some((x) => x.idPecaComercial === pecaLixo.idPecaComercial), 'a peça com HTML deveria ter sido apagada');
t.ok(pecas.some((x) => x.idPecaComercial === pecaBoa.idPecaComercial), 'a peça legítima deveria continuar');
// Conta suja: continua entrando, com nome neutro
const novo = await login('empresa', suja.email, 'Demo@123', true);
t.ok(novo.accessToken, 'a conta com nome malicioso deveria continuar entrando');
t.ok(!/[<>]/.test(JSON.stringify(novo)), `o nome da conta não deveria mais ter HTML (${JSON.stringify(novo).slice(0, 160)})`);
t.done('sec-limpeza');
