// SEC-7: atrás de proxy (X-Forwarded-For) o limite de login vale por cliente, não pela plataforma inteira.
// Sobe uma segunda instância (:3001) com o limite de login padrão de produção.
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backendEnv } from '../env/env.mjs';
import { checker } from './_lib.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const API = 'http://localhost:3001';
const t = checker();
const env = backendEnv({ PORT: '3001' }); delete env.LOGIN_THROTTLE_LIMIT; delete env.SEED_ADMIN_PASSWORD;
const be = spawn('npx', ['ts-node', '--transpile-only', 'src/main.ts'], { cwd: join(ROOT, 'backend'), env, stdio: 'ignore', detached: true });
try {
  for (let i = 0; i < 120; i++) { try { if ((await fetch(`${API}/`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }
  const login = async (xff, email, senha) => (await fetch(`${API}/api/auth/login/empresa`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': xff }, body: JSON.stringify({ email, senha }) })).status;
  let limitou = false;
  for (let i = 0; i < 14; i++) if ((await login('9.9.9.1', 'empresa@demo.com', 'errada')) === 429) limitou = true;
  t.ok(limitou, 'SEC-7 tentativas erradas em excesso deveriam receber 429');
  const outroIp = await login('9.9.9.2', 'empresa@demo.com', 'Demo@123');
  t.ok(outroIp < 300, `SEC-7 outro cliente (IP diferente) foi bloqueado por culpa de terceiros (status ${outroIp})`);
  const outroEmail = await login('9.9.9.1', 'outra-pessoa@teste.com', 'qualquer');
  t.ok(outroEmail !== 429, 'SEC-7 limite deveria ser por IP+e-mail, não só por IP');
} finally { try { process.kill(-be.pid, 'SIGTERM'); } catch {} }
t.done('sec-7-throttle');
