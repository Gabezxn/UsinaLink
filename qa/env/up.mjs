// Sobe Postgres de teste + backend (:3000) + site estático (:5500). Nunca usa credenciais reais.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, openSync, chmodSync, chownSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WORK = process.env.QA_DIR || join(tmpdir(), 'usinalink-qa');
const PGPORT = 54329;
const PGBIN = ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/lib/postgresql/14/bin'].find(existsSync);
if (!PGBIN) throw new Error('PostgreSQL não encontrado (instale com apt-get install -y postgresql)');
mkdirSync(WORK, { recursive: true });
chmodSync(WORK, 0o755);
const PGDATA = join(WORK, 'pgdata');
const asPg = (cmd, args, opts = {}) => execFileSync('runuser', ['-u', 'postgres', '--', cmd, ...args], { stdio: 'pipe', ...opts });
const pids = {};

async function waitFor(url, ms = 90000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    try { const r = await fetch(url); if (r.status < 500) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`timeout esperando ${url}`);
}

// 1) Banco
if (!existsSync(PGDATA)) {
  mkdirSync(PGDATA); chownSync(PGDATA, 102, 104); chmodSync(PGDATA, 0o700);
  const uid = Number(execFileSync('id', ['-u', 'postgres']).toString());
  const gid = Number(execFileSync('id', ['-g', 'postgres']).toString());
  chownSync(WORK, uid, gid); chownSync(PGDATA, uid, gid);
  asPg(join(PGBIN, 'initdb'), ['-D', PGDATA, '-A', 'trust', '-U', 'postgres']);
}
try { asPg(join(PGBIN, 'pg_ctl'), ['-D', PGDATA, 'status']); } catch {
  asPg(join(PGBIN, 'pg_ctl'), ['-D', PGDATA, '-o', `-p ${PGPORT} -k ${WORK}`, '-l', join(WORK, 'pg.log'), '-w', 'start']);
}
try { asPg(join(PGBIN, 'createdb'), ['-h', 'localhost', '-p', String(PGPORT), 'usinalink_qa']); } catch {}

// 2) Backend
const env = { ...process.env, PORT: '3000', DB_TYPE: 'postgres', DB_HOST: 'localhost', DB_PORT: String(PGPORT), DB_USERNAME: 'postgres', DB_PASSWORD: '', DB_NAME: 'usinalink_qa', DB_SSL: 'false', DB_SYNCHRONIZE: 'true', JWT_SECRET: 'qa-only-secret', THROTTLE_LIMIT: '100000', ALLOWED_ORIGINS: 'http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000' };
const logB = openSync(join(WORK, 'backend.log'), 'a');
const be = spawn('npx', ['ts-node', '--transpile-only', 'src/main.ts'], { cwd: join(ROOT, 'backend'), env, detached: true, stdio: ['ignore', logB, logB] });
pids.backend = be.pid; be.unref();

// 3) Site estático
const logS = openSync(join(WORK, 'static.log'), 'a');
const st = spawn('node', [join(ROOT, 'qa', 'env', 'static.mjs')], { env: { ...process.env, PORT: '5500' }, detached: true, stdio: ['ignore', logS, logS] });
pids.static = st.pid; st.unref();
writeFileSync(join(WORK, 'pids.json'), JSON.stringify({ ...pids, PGDATA, PGBIN }));

await waitFor('http://localhost:3000/');
await waitFor('http://localhost:5500/index.html');
console.log('API=http://localhost:3000 SITE=http://localhost:5500');
