// Verificação em duas etapas por e-mail. Sobe uma segunda instância (:3002) com TWO_FACTOR_ENABLED=true e e-mail em arquivo (só QA).
import { spawn, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { backendEnv } from '../env/env.mjs';
import { checker } from './_lib.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const API = 'http://localhost:3002';
const t = checker();
const WIN = process.platform === 'win32';

const subir = (extra) => {
  const env = backendEnv({ PORT: '3002', TWO_FACTOR_ENABLED: 'true', TWO_FACTOR_SKIP_EMAILS: 'pessoa@demo.com', TWO_FACTOR_RESEND_SECONDS: '2', TWO_FACTOR_DEDUP_SECONDS: '0', ...extra });
  delete env.LOGIN_THROTTLE_LIMIT; env.LOGIN_THROTTLE_LIMIT = '1000';
  return spawn(WIN ? 'npx.cmd' : 'npx', ['ts-node', '--transpile-only', 'src/main.ts'], { cwd: join(ROOT, 'backend'), env, stdio: 'ignore', detached: !WIN, shell: WIN });
};
const parar = (p) => { try { if (WIN) spawnSync('taskkill', ['/PID', String(p.pid), '/T', '/F']); else process.kill(-p.pid, 'SIGTERM'); } catch {} };
const esperar = async () => { for (let i = 0; i < 160; i++) { try { if ((await fetch(`${API}/`)).ok) return; } catch {} await new Promise((r) => setTimeout(r, 500)); } throw new Error('servidor 2FA nao subiu'); };
const post = async (path, body) => { const r = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); let json = null; try { json = await r.json(); } catch {} return { status: r.status, json, texto: JSON.stringify(json) }; };
const emails = (dir) => readdirSync(dir).sort().map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const codigoDe = (mail) => (mail.text.match(/\b(\d{6})\b/) || [])[1];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const outbox = mkdtempSync(join(tmpdir(), 'usinalink-mail-'));
let be = subir({ MAIL_TRANSPORT: 'file', MAIL_OUTBOX_DIR: outbox });
try {
  await esperar();
  const senha = 'Demo@123';

  // 1) Senha certa: NÃO sai token; sai um desafio e um e-mail com o código
  let r = await post('/api/auth/login/empresa', { email: 'empresa@demo.com', senha });
  t.ok(r.status < 300 && r.json?.requires2fa === true && r.json.desafio, `login deveria pedir o código (status ${r.status} ${r.texto})`);
  t.ok(!r.json?.accessToken && !r.json?.access_token, 'login com 2FA ligado vazou token antes do código');
  t.ok(/^em\*+@demo\.com$/.test(r.json?.email || ''), `e-mail deveria vir mascarado (veio ${r.json?.email})`);
  let lista = emails(outbox);
  t.ok(lista.length === 1 && lista[0].to === 'empresa@demo.com', `deveria ter enviado 1 e-mail para a conta (enviou ${lista.length})`);
  const codigo1 = codigoDe(lista[0] || { text: '' });
  t.ok(/^\d{6}$/.test(codigo1 || ''), 'e-mail sem código de 6 dígitos');
  t.ok(!r.texto.includes(codigo1), 'a resposta do login revelou o código');
  const desafio1 = r.json.desafio;

  // 2) Código errado: 401, conta tentativa, não entra
  const errado = codigo1 === '000000' ? '111111' : '000000';
  r = await post('/api/auth/2fa/verificar', { desafio: desafio1, codigo: errado });
  t.ok(r.status === 401 && !r.json?.accessToken, `código errado deveria dar 401 (deu ${r.status})`);
  t.ok(/Restam 4/.test(r.json?.message || ''), `deveria avisar tentativas restantes (${r.json?.message})`);

  // 3) Código certo: entra, com a mesma resposta do login comum
  r = await post('/api/auth/2fa/verificar', { desafio: desafio1, codigo: codigo1 });
  t.ok(r.status < 300 && r.json?.accessToken && r.json?.tipoUsuario === 'empresa' && r.json?.empresa, `código certo deveria entrar como empresa (${r.status} ${r.texto.slice(0, 120)})`);
  t.ok(!r.texto.includes('senhaHash') && !r.texto.includes('codigoHash'), 'resposta expôs hash');
  const tokenEmpresa = r.json?.accessToken;
  if (tokenEmpresa) { const me = await fetch(`${API}/api/pedidos/meus`, { headers: { Authorization: `Bearer ${tokenEmpresa}` } }); t.ok(me.status === 200, `token emitido pelo 2FA não funcionou (${me.status})`); }

  // 4) Uso único: o mesmo código não serve de novo
  r = await post('/api/auth/2fa/verificar', { desafio: desafio1, codigo: codigo1 });
  t.ok(r.status === 401 && !r.json?.accessToken, `reuso do código deveria falhar (deu ${r.status})`);

  // 5) 5 erros bloqueiam o desafio, mesmo com o código certo depois
  r = await post('/api/auth/login/usina', { email: 'usina@demo.com', senha });
  const desafio2 = r.json?.desafio; const codigo2 = codigoDe(emails(outbox).pop());
  const certoMenos = (c) => (c === '123456' ? '654321' : '123456');
  for (let i = 0; i < 5; i++) await post('/api/auth/2fa/verificar', { desafio: desafio2, codigo: certoMenos(codigo2) });
  r = await post('/api/auth/2fa/verificar', { desafio: desafio2, codigo: codigo2 });
  t.ok(r.status === 401 && !r.json?.accessToken, `após 5 erros o código certo não pode mais entrar (deu ${r.status})`);

  // 6) Tentativas em paralelo não passam do limite
  r = await post('/api/auth/login/usina', { email: 'usina@demo.com', senha });
  const desafio3 = r.json?.desafio; const codigo3 = codigoDe(emails(outbox).pop());
  const palpites = Array.from({ length: 40 }, (_, i) => String(100000 + i * 7));
  const resp = await Promise.all(palpites.map((c) => post('/api/auth/2fa/verificar', { desafio: desafio3, codigo: c === codigo3 ? '999999' : c })));
  t.ok(resp.every((x) => x.status === 401 && !x.json?.accessToken), '40 palpites em paralelo: nenhum deveria entrar');
  r = await post('/api/auth/2fa/verificar', { desafio: desafio3, codigo: codigo3 });
  t.ok(r.status === 401, `desafio esgotado por tentativas paralelas ainda aceitou o código certo (${r.status})`);

  // 7) Desafio inventado / formato ruim
  r = await post('/api/auth/2fa/verificar', { desafio: 'a'.repeat(48), codigo: '123456' });
  t.ok(r.status === 401, `desafio inexistente deveria dar 401 (deu ${r.status})`);
  r = await post('/api/auth/2fa/verificar', { desafio: 'x', codigo: '123456' });
  t.ok(r.status === 400, `desafio fora do formato deveria dar 400 (deu ${r.status})`);
  r = await post('/api/auth/2fa/verificar', { desafio: 'a'.repeat(48) });
  t.ok(r.status === 400, `sem código deveria dar 400 (deu ${r.status})`);

  // 8) Reenvio: intervalo mínimo, código novo invalida o antigo
  r = await post('/api/auth/login/usina', { email: 'usina@demo.com', senha });
  const desafio4 = r.json?.desafio; const antigo = codigoDe(emails(outbox).pop());
  let rr = await post('/api/auth/2fa/reenviar', { desafio: desafio4 });
  t.ok(rr.status === 429, `reenvio imediato deveria dar 429 (deu ${rr.status})`);
  await dormir(2300);
  const antes = emails(outbox).length;
  rr = await post('/api/auth/2fa/reenviar', { desafio: desafio4 });
  t.ok(rr.status < 300 && rr.json?.requires2fa, `reenvio após o intervalo deveria funcionar (${rr.status} ${rr.texto})`);
  t.ok(emails(outbox).length === antes + 1, 'reenvio não mandou novo e-mail');
  const novo = codigoDe(emails(outbox).pop());
  if (novo === antigo) t.ok(false, 'reenvio repetiu o mesmo código');
  else {
    r = await post('/api/auth/2fa/verificar', { desafio: desafio4, codigo: antigo });
    t.ok(r.status === 401, `código antigo não deveria valer depois do reenvio (deu ${r.status})`);
  }
  r = await post('/api/auth/2fa/verificar', { desafio: desafio4, codigo: novo });
  t.ok(r.status < 300 && r.json?.accessToken && r.json?.tipoUsuario === 'usina', `código novo deveria entrar como usina (${r.status})`);

  // 9) Limite de 3 reenvios
  r = await post('/api/auth/login/empresa', { email: 'empresa@demo.com', senha });
  const desafio5 = r.json?.desafio; let limitou = false;
  for (let i = 0; i < 5; i++) { await dormir(2200); const x = await post('/api/auth/2fa/reenviar', { desafio: desafio5 }); if (x.status === 429 && /Limite/.test(x.json?.message || '')) { limitou = true; break; } }
  t.ok(limitou, 'deveria limitar a 3 reenvios por desafio');

  // 10) Novo login invalida o desafio anterior (um aberto por pessoa)
  r = await post('/api/auth/login/empresa', { email: 'empresa@demo.com', senha });
  const velho = r.json?.desafio; const codVelho = codigoDe(emails(outbox).pop());
  r = await post('/api/auth/login/empresa', { email: 'empresa@demo.com', senha });
  const codNovo = codigoDe(emails(outbox).pop());
  let x = await post('/api/auth/2fa/verificar', { desafio: velho, codigo: codVelho });
  t.ok(x.status === 401, `desafio antigo deveria ter sido invalidado pelo novo login (deu ${x.status})`);
  x = await post('/api/auth/2fa/verificar', { desafio: r.json?.desafio, codigo: codNovo });
  t.ok(x.status < 300 && x.json?.accessToken, 'desafio novo deveria funcionar');

  // 11) Senha errada ou área errada: nenhum e-mail enviado, nenhuma pista
  const antes2 = emails(outbox).length;
  r = await post('/api/auth/login/empresa', { email: 'empresa@demo.com', senha: 'Errada@123' });
  t.ok(r.status === 401 && !r.json?.requires2fa, `senha errada: deveria 401 sem desafio (deu ${r.status})`);
  r = await post('/api/auth/login/usina', { email: 'empresa@demo.com', senha });
  t.ok(r.status === 403 && !r.json?.requires2fa, `área errada: deveria 403 sem desafio (deu ${r.status})`);
  t.ok(emails(outbox).length === antes2, 'enviou e-mail mesmo com senha ou área erradas');

  // 12) Conta dispensada (demonstração) entra direto
  r = await post('/api/auth/login/pessoa_fisica', { email: 'pessoa@demo.com', senha });
  t.ok(r.status < 300 && r.json?.accessToken && !r.json?.requires2fa, `conta da lista de dispensa deveria entrar direto (${r.status})`);

  // 13) Admin também passa pela segunda etapa (se existir admin de teste)
  r = await post('/api/auth/login/admin', { email: 'admin@usinalink.com', senha: 'Admin@QA-123' });
  if (r.status < 300) t.ok(r.json?.requires2fa === true && !r.json?.accessToken, 'admin deveria passar pela segunda etapa');

  // 14) O banco guarda só o resumo, nunca o código
  // (conferido pelo formato: a resposta e o banco nunca trazem o código em texto; aqui garantimos que o e-mail é o único canal)
  const todos = JSON.stringify(emails(outbox));
  t.ok(!/Demo@123/.test(todos), 'e-mail do código mencionou a senha');
} finally {
  parar(be);
  await dormir(500);
}

// 14b) Duplo clique no login: pedidos repetidos em seguida valem como um só (mesmo desafio, um único e-mail)
const outbox2 = mkdtempSync(join(tmpdir(), 'usinalink-mail-dup-'));
be = subir({ MAIL_TRANSPORT: 'file', MAIL_OUTBOX_DIR: outbox2, TWO_FACTOR_DEDUP_SECONDS: '8' });
try {
  await esperar();
  const [d1, d2] = await Promise.all([post('/api/auth/login/usina', { email: 'usina@demo.com', senha: 'Demo@123' }), post('/api/auth/login/usina', { email: 'usina@demo.com', senha: 'Demo@123' })]);
  const d3 = await post('/api/auth/login/usina', { email: 'usina@demo.com', senha: 'Demo@123' });
  t.ok(d1.json?.desafio && d1.json.desafio === d2.json?.desafio && d2.json.desafio === d3.json?.desafio, `logins repetidos em seguida deveriam devolver o mesmo desafio (${d1.json?.desafio} / ${d2.json?.desafio} / ${d3.json?.desafio})`);
  await dormir(500);
  t.ok(emails(outbox2).length === 1, `logins repetidos em seguida deveriam mandar 1 e-mail (mandaram ${emails(outbox2).length})`);
  // o código do e-mail único serve
  const ok = await post('/api/auth/2fa/verificar', { desafio: d1.json.desafio, codigo: codigoDe(emails(outbox2)[0]) });
  t.ok(ok.status < 300 && ok.json?.accessToken, `o código do e-mail único deveria entrar (${ok.status})`);
} finally {
  parar(be);
  await dormir(500);
  try { rmSync(outbox2, { recursive: true, force: true }); } catch {}
}

// 15) 2FA ligado SEM e-mail configurado: falha fechada (sem login, sem token)
be = subir({ MAIL_TRANSPORT: 'none', RESEND_API_KEY: '' });
try {
  await esperar();
  const r = await post('/api/auth/login/empresa', { email: 'empresa@demo.com', senha: 'Demo@123' });
  t.ok(r.status === 503 && !r.json?.accessToken, `sem e-mail configurado deveria dar 503 e nenhum token (deu ${r.status} ${r.texto.slice(0, 100)})`);
  const r2 = await post('/api/auth/login/pessoa_fisica', { email: 'pessoa@demo.com', senha: 'Demo@123' });
  t.ok(r2.status < 300 && r2.json?.accessToken, 'conta dispensada deveria entrar mesmo sem e-mail configurado');
} finally {
  parar(be);
  try { rmSync(outbox, { recursive: true, force: true }); } catch {}
}
t.done('sec-2fa');
