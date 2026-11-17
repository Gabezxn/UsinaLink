// Roda toda a bateria de QA e imprime UMA linha por verificação (e só as linhas de falha). Uso: node qa/run-all.mjs [--fresh]
// Pré-requisito: ambiente no ar (npm --prefix qa run up). Com --fresh recria o banco de teste antes (recomendado para axe/console).
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sh = (cmd, args, cwd = ROOT, timeout = 600000) => spawnSync(cmd === 'node' ? process.execPath : cmd === 'npm' && process.platform === 'win32' ? 'npm.cmd' : cmd, args, { cwd, encoding: 'utf8', timeout, shell: cmd === 'npm' && process.platform === 'win32' });
if (process.argv.includes('--fresh')) { sh('node', ['qa/env/down.mjs', '--wipe']); const up = sh('node', ['qa/env/up.mjs']); if (up.status !== 0) { console.log('FALHA ao subir o ambiente:\n' + (up.stderr || up.stdout).slice(-400)); process.exit(1); } }
const passos = [
  ['backend: npm test', 'npm', ['--prefix', 'backend', 'test', '--silent']],
  ['backlog-lint', 'node', ['qa/backlog-lint.mjs']],
  ['security/sec-authz', 'node', ['qa/security/sec-authz.mjs']],
  ['security/sec-p1', 'node', ['qa/security/sec-p1.mjs']],
  ['security/sec-p2', 'node', ['qa/security/sec-p2.mjs']],
  ['security/sec-1-2-seed-jwt', 'node', ['qa/security/sec-1-2-seed-jwt.mjs']],
  ['security/sec-7-throttle', 'node', ['qa/security/sec-7-throttle.mjs']],
  ['security/sec-2fa', 'node', ['qa/security/sec-2fa.mjs']],
  ['security/sec-senha', 'node', ['qa/security/sec-senha.mjs']],
  ['security/sec-revisao', 'node', ['qa/security/sec-revisao.mjs']],
  ['security/sec-popular', 'node', ['qa/security/sec-popular.mjs']],
  ['security/sec-stripe', 'node', ['qa/security/sec-stripe.mjs']],
  ['security/xss-sweep', 'node', ['qa/security/xss-sweep.mjs']],
  ['flows/a11y-base', 'node', ['qa/flows/a11y-base.mjs']],
  ['flows/a11y-pages', 'node', ['qa/flows/a11y-pages.mjs']],
  ['flows/pf', 'node', ['qa/flows/pf.mjs']],
  ['flows/empresa-usina', 'node', ['qa/flows/empresa-usina.mjs']],
  ['flows/empresa-compra', 'node', ['qa/flows/empresa-compra.mjs']],
  ['flows/session-expired', 'node', ['qa/flows/session-expired.mjs']],
  ['flows/cold-start', 'node', ['qa/flows/cold-start.mjs']],
  ['flows/headers', 'node', ['qa/flows/headers.mjs']],
  ['flows/ui-p24', 'node', ['qa/flows/ui-p24.mjs']],
  ['flows/motion', 'node', ['qa/flows/motion.mjs']],
  ['flows/two-factor-ui', 'node', ['qa/flows/two-factor-ui.mjs']],
  ['flows/stripe-ui', 'node', ['qa/flows/stripe-ui.mjs']],
  ['flows/correcoes', 'node', ['qa/flows/correcoes.mjs']],
  ['checks/axe', 'node', ['qa/checks/axe.mjs']],
  ['checks/console', 'node', ['qa/checks/console.mjs']],
];
let falhas = 0;
for (const [nome, cmd, args] of passos) {
  const t0 = Date.now(); const r = sh(cmd, args);
  const ok = r.status === 0; if (!ok) falhas++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nome}  (${Math.round((Date.now() - t0) / 1000)}s)`);
  if (!ok) console.log(((r.stdout || '') + (r.stderr || '')).split('\n').filter(Boolean).slice(-8).map((l) => '      ' + l.slice(0, 200)).join('\n'));
}
console.log(falhas ? `\n${falhas} verificação(ões) com falha` : '\nTUDO VERDE');
process.exit(falhas ? 1 : 0);
