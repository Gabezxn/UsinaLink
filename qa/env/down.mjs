import { readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const WORK = process.env.QA_DIR || join(tmpdir(), 'usinalink-qa');
const f = join(WORK, 'pids.json');
if (!existsSync(f)) { console.log('nada para encerrar'); process.exit(0); }
const p = JSON.parse(readFileSync(f, 'utf8'));
const WIN = process.platform === 'win32';
for (const k of ['backend', 'static']) { try { if (WIN) execFileSync('taskkill', ['/PID', String(p[k]), '/T', '/F'], { stdio: 'ignore' }); else process.kill(-p[k], 'SIGTERM'); } catch {} }
try { if (WIN) execFileSync(join(p.PGBIN, 'pg_ctl.exe'), ['-D', p.PGDATA, '-m', 'fast', 'stop'], { stdio: 'ignore' }); else execFileSync('runuser', ['-u', 'postgres', '--', join(p.PGBIN, 'pg_ctl'), '-D', p.PGDATA, '-m', 'fast', 'stop'], { stdio: 'ignore' }); } catch {}
if (process.argv.includes('--wipe')) { try { rmSync(join(WORK, 'pgdata'), { recursive: true, force: true }); } catch {} console.log('banco de teste apagado (será recriado no próximo up)'); }
console.log('encerrado');
