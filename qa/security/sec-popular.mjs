// Popular contas vazias (SEED_POPULAR_CONTAS): toda conta nova ganha movimento, rodar de novo não duplica e "remover" desfaz.
import { spawn, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backendEnv } from '../env/env.mjs';
import { checker, registrar, call } from './_lib.mjs';
import { existsSync } from 'node:fs';
import { PGPORT } from '../env/env.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const API2 = 'http://localhost:3002';
const WIN = process.platform === 'win32';
const t = checker();
const PGBIN = process.env.QA_PGBIN || ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/lib/postgresql/14/bin'].find(existsSync);
const apagarMarca = () => spawnSync(join(PGBIN, WIN ? 'psql.exe' : 'psql'), ['-h', 'localhost', '-p', String(PGPORT), '-U', 'postgres', '-d', 'usinalink_qa', '-c', 'delete from configuracao_sistema'], { encoding: 'utf8' });

const subir = (modo, extra = {}) => {
  const env = backendEnv({ PORT: '3002', SEED_POPULAR_CONTAS: modo, ...extra });
  return spawn(WIN ? 'npx.cmd' : 'npx', ['ts-node', '--transpile-only', 'src/main.ts'], { cwd: join(ROOT, 'backend'), env, stdio: 'ignore', detached: !WIN, shell: WIN });
};
const parar = (p) => { try { if (WIN) spawnSync('taskkill', ['/PID', String(p.pid), '/T', '/F']); else process.kill(-p.pid, 'SIGTERM'); } catch {} };
const esperar = async () => { for (let i = 0; i < 160; i++) { try { if ((await fetch(`${API2}/`)).ok) return; } catch {} await new Promise((r) => setTimeout(r, 500)); } throw new Error('servidor nao subiu'); };
const rodar = async (modo, extra) => { const p = subir(modo, extra); try { await esperar(); await new Promise((r) => setTimeout(r, 1500)); } finally { parar(p); } };

const emp = await registrar('empresa');
const emp2 = await registrar('empresa');
const pf = await registrar('pessoa_fisica');
const usi = await registrar('usina');
const usi2 = await registrar('usina');
const conta = async (c) => ({
  pedidos: (await call('GET', '/api/pedidos/meus', c.token)).json?.length ?? -1,
  propostas: (await call('GET', '/api/propostas/enviadas', c.token)).json?.length ?? -1,
  compras: (await call('GET', '/api/solicitacoes-comerciais/minhas', c.token)).json?.length ?? -1,
  pecas: (await call('GET', '/api/pecas-comerciais', c.token)).json?.length ?? -1,
});
const antes = await conta(emp);
t.ok(antes.pedidos === 0, `conta nova deveria começar sem pedidos (${antes.pedidos})`);

// Automático: no Render (RENDER=true) roda sozinho na primeira subida, sem variável nenhuma
apagarMarca();
await rodar('', { RENDER: 'true' });
for (const [nome, c] of [['empresa', emp], ['empresa2', emp2], ['pessoa física', pf]]) {
  const r = await conta(c);
  t.ok(r.pedidos >= 1, `${nome}: deveria ter pelo menos 1 pedido (${r.pedidos})`);
  t.ok(r.compras >= 1, `${nome}: deveria ter pelo menos 1 compra de catálogo (${r.compras})`);
}
for (const [nome, c] of [['usina', usi], ['usina2', usi2]]) {
  const r = await conta(c);
  t.ok(r.propostas >= 1, `${nome}: deveria ter pelo menos 1 proposta (${r.propostas})`);
}
const estados = new Set();
for (const c of [emp, emp2, pf]) for (const p of (await call('GET', '/api/pedidos/meus', c.token)).json || []) estados.add(p.status);
t.ok(estados.size >= 2, `os pedidos de exemplo deveriam ter estados variados (${[...estados]})`);

// Rodar de novo (automático ou forçado) não duplica
const depois1 = await conta(emp);
await rodar('', { RENDER: 'true' });
await rodar('true');
const depois2 = await conta(emp);
t.ok(depois1.pedidos === depois2.pedidos && depois1.compras === depois2.compras, `rodar de novo não deveria criar mais (${JSON.stringify(depois1)} -> ${JSON.stringify(depois2)})`);

// Remover desfaz
await rodar('remover');
const final = await conta(emp);
t.ok(final.pedidos === 0 && final.compras === 0, `remover deveria deixar a conta vazia de novo (${JSON.stringify(final)})`);
// Depois de rodar (ou remover), subir de novo no Render NÃO recria sozinho
await rodar('', { RENDER: 'true' });
const aindaVazia = await conta(emp);
t.ok(aindaVazia.pedidos === 0, `subida automática seguinte não deveria recriar os pedidos (${JSON.stringify(aindaVazia)})`);
t.done('sec-popular');
