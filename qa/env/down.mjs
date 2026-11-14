import { readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const WORK = process.env.QA_DIR || join(tmpdir(), 'usinalink-qa');
const f = join(WORK, 'pids.json');
if (!existsSync(f)) { console.log('nada para encerrar'); process.exit(0); }
const p = JSON.parse(readFileSync(f, 'utf8'));
for (const k of ['backend', 'static']) { try { process.kill(-p[k], 'SIGTERM'); } catch {} }
try { execFileSync('runuser', ['-u', 'postgres', '--', join(p.PGBIN, 'pg_ctl'), '-D', p.PGDATA, '-m', 'fast', 'stop'], { stdio: 'ignore' }); } catch {}
console.log('encerrado');
