// Tela do código de verificação no login (2FA por e-mail). Sobe uma API :3002 com 2FA e encaminha as chamadas do site para ela.
import { spawn, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { backendEnv } from '../env/env.mjs';
import { playwright, SITE } from '../lib/login.mjs';
import { checker } from '../security/_lib.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const t = checker();
const WIN = process.platform === 'win32';
const outbox = mkdtempSync(join(tmpdir(), 'usinalink-mail-ui-'));
const env = backendEnv({ PORT: '3002', TWO_FACTOR_ENABLED: 'true', TWO_FACTOR_SKIP_EMAILS: '', TWO_FACTOR_RESEND_SECONDS: '3', MAIL_TRANSPORT: 'file', MAIL_OUTBOX_DIR: outbox });
const be = spawn(WIN ? 'npx.cmd' : 'npx', ['ts-node', '--transpile-only', 'src/main.ts'], { cwd: join(ROOT, 'backend'), env, stdio: 'ignore', detached: !WIN, shell: WIN });
const ultimoCodigo = () => { const f = readdirSync(outbox).sort().pop(); return f ? (JSON.parse(readFileSync(join(outbox, f), 'utf8')).text.match(/\b(\d{6})\b/) || [])[1] : null; };
try {
  for (let i = 0; i < 160; i++) { try { if ((await fetch('http://localhost:3002/')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 760 } });
  const page = await ctx.newPage();
  await page.route('http://localhost:3000/api/**', (route) => route.continue({ url: route.request().url().replace('localhost:3000', 'localhost:3002') }));
  const erros = []; page.on('pageerror', (e) => erros.push(e.message));

  await page.goto(`${SITE}/login-empresa.html`);
  await page.fill('input[name="email"]', 'empresa@demo.com'); await page.fill('input[name="senha"]', 'Demo@123');
  await page.locator('form.js-login-form [type="submit"]').dblclick(); // duplo clique: um painel e um e-mail só
  await page.waitForSelector('.two-factor', { timeout: 15000 }).catch(() => t.ok(false, 'tela do código não apareceu'));
  t.ok(await page.locator('form.js-login-form').isHidden(), 'formulário de senha deveria sumir');
  await page.waitForTimeout(1500);
  t.ok(await page.locator('.two-factor').count() === 1 && await page.locator('input[name="codigo"]').count() === 1, 'duplo clique não deveria criar dois campos de código');
  t.ok(readdirSync(outbox).length === 1, `duplo clique deveria mandar 1 e-mail (mandou ${readdirSync(outbox).length})`);
  t.ok(/em\*+@demo\.com/.test(await page.locator('.two-factor-intro').innerText()), 'e-mail mascarado não apareceu na tela');
  t.ok(!(await page.evaluate(() => sessionStorage.getItem('accessToken'))), 'token foi guardado antes do código');
  t.ok(await page.evaluate(() => document.activeElement?.name === 'codigo'), 'campo do código deveria estar em foco');
  t.ok(await page.locator('[data-tf-reenviar]').isDisabled(), 'reenviar deveria começar bloqueado (contagem)');
  await page.screenshot({ path: process.env.TEMP + '/2fa-tela.png' });
  // só números, no máximo 6
  await page.fill('input[name="codigo"]', 'ab12cd345678');
  t.ok(await page.inputValue('input[name="codigo"]') === '123456', 'campo deveria aceitar só 6 números');
  // código incompleto
  await page.fill('input[name="codigo"]', '123');
  await page.click('.two-factor [type="submit"]');
  t.ok(/6 números/.test((await page.locator('.two-factor .field-message').innerText())), 'deveria pedir os 6 números');
  // código errado
  const certo = ultimoCodigo();
  await page.fill('input[name="codigo"]', certo === '000000' ? '111111' : '000000');
  await page.click('.two-factor [type="submit"]');
  await page.waitForFunction(() => /incorreto/i.test(document.querySelector('.two-factor .field-message')?.textContent || ''), null, { timeout: 8000 }).catch(() => t.ok(false, 'erro de código incorreto não apareceu'));
  t.ok(page.url().includes('login-empresa'), 'não deveria sair do login com código errado');
  // reenviar depois da contagem
  await page.waitForFunction(() => !document.querySelector('[data-tf-reenviar]').disabled, null, { timeout: 8000 }).catch(() => t.ok(false, 'reenviar nunca liberou'));
  await page.click('[data-tf-reenviar]');
  await page.waitForTimeout(800);
  const novo = ultimoCodigo();
  t.ok(novo && novo !== certo, 'reenviar deveria mandar um código novo');
  // voltar e entrar de novo
  await page.click('[data-tf-voltar]');
  t.ok(await page.locator('form.js-login-form').isVisible() && await page.locator('.two-factor').count() === 0, 'voltar deveria mostrar o formulário de senha');
  await page.click('form.js-login-form [type="submit"]');
  await page.waitForSelector('.two-factor');
  await page.waitForTimeout(600);
  const ultimo = ultimoCodigo();
  await page.fill('input[name="codigo"]', ultimo);
  await Promise.all([page.waitForURL('**/dashboard-empresa.html', { timeout: 15000 }).catch(() => t.ok(false, 'não entrou com o código certo')), page.click('.two-factor [type="submit"]')]);
  t.ok(!!(await page.evaluate(() => sessionStorage.getItem('accessToken'))), 'token deveria ser guardado depois do código');
  t.ok(erros.length === 0, `erros de JavaScript: ${erros.join(' | ')}`);
  await browser.close();
} finally {
  try { if (WIN) spawnSync('taskkill', ['/PID', String(be.pid), '/T', '/F']); else process.kill(-be.pid, 'SIGTERM'); } catch {}
  try { rmSync(outbox, { recursive: true, force: true }); } catch {}
}
t.done('two-factor-ui');
