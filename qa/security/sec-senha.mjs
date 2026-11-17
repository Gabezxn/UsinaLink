// Esqueci minha senha. Sobe uma instancia (:3002) com e-mail em arquivo (so QA) e confere: sem vazar quem tem conta,
// link de uso unico, validade, link novo invalida o anterior, senha antiga para de funcionar, limites.
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
  const env = backendEnv({ PORT: '3002', ...extra });
  env.LOGIN_THROTTLE_LIMIT = '1000';
  return spawn(WIN ? 'npx.cmd' : 'npx', ['ts-node', '--transpile-only', 'src/main.ts'], { cwd: join(ROOT, 'backend'), env, stdio: 'ignore', detached: !WIN, shell: WIN });
};
const parar = (p) => { try { if (WIN) spawnSync('taskkill', ['/PID', String(p.pid), '/T', '/F']); else process.kill(-p.pid, 'SIGTERM'); } catch {} };
const esperar = async () => { for (let i = 0; i < 160; i++) { try { if ((await fetch(`${API}/`)).ok) return; } catch {} await new Promise((r) => setTimeout(r, 500)); } throw new Error('servidor nao subiu'); };
const post = async (path, body) => { const r = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); let json = null; try { json = await r.json(); } catch {} return { status: r.status, json, texto: JSON.stringify(json) }; };
const emails = (dir) => readdirSync(dir).sort().map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const tokenDe = (mail) => (mail.text.match(/#token=([a-f0-9]{64})/) || [])[1];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const outbox = mkdtempSync(join(tmpdir(), 'usinalink-mail-'));
let be = subir({ MAIL_TRANSPORT: 'file', MAIL_OUTBOX_DIR: outbox });
try {
  await esperar();
  const email = `qa-reset-${Date.now()}@teste.com`;
  const cad = await post('/api/cadastro/empresa', { nome: 'QA Reset', email, senha: 'Antiga@123', confirmarSenha: 'Antiga@123', cnpj: String(Date.now()).padStart(14, "7").slice(-14), telefone: '11999990000', responsavel: 'QA', cep: '01310100', cidade: 'Sao Paulo', estado: 'SP' });
  t.ok(cad.status < 300, `cadastro de teste falhou (${cad.status} ${cad.texto})`);

  // 1) Conta inexistente e conta real recebem a MESMA resposta; so a real recebe e-mail
  const inexistente = await post('/api/auth/senha/esqueci', { email: 'ninguem-aqui@teste.com' });
  t.ok(inexistente.status < 300 && emails(outbox).length === 0, `conta inexistente nao deveria enviar e-mail (${inexistente.status}, ${emails(outbox).length} e-mails)`);
  let r = await post('/api/auth/senha/esqueci', { email, origem: 'https://site-malicioso.com' });
  t.ok(r.status < 300 && r.texto === inexistente.texto, `resposta deveria ser igual exista a conta ou nao (${r.texto} x ${inexistente.texto})`);
  let lista = emails(outbox);
  t.ok(lista.length === 1 && lista[0].to === email, `deveria enviar 1 e-mail para a conta (enviou ${lista.length})`);
  const token1 = tokenDe(lista[0] || { text: '' });
  t.ok(!!token1, 'e-mail sem link de nova senha');
  t.ok(lista[0].text.includes('https://usinalink.com.br/redefinir-senha.html#token='), `origem de fora deveria cair no site oficial (${(lista[0].text.match(/https?:\/\/\S+/) || [])[0]})`);
  t.ok(!r.texto.includes(token1), 'a resposta do pedido revelou o codigo');

  // 2) Nao deixa pedir de novo no mesmo minuto (nao manda outro e-mail)
  await post('/api/auth/senha/esqueci', { email });
  t.ok(emails(outbox).length === 1, 'pedido repetido em menos de 1 minuto nao deveria mandar outro e-mail');

  // 3) Link invalido, senha curta e confirmacao diferente sao recusados
  r = await post('/api/auth/senha/redefinir', { token: 'a'.repeat(64), novaSenha: 'Nova@1234', confirmarSenha: 'Nova@1234' });
  t.ok(r.status === 400, `link inventado deveria dar 400 (deu ${r.status})`);
  r = await post('/api/auth/senha/redefinir', { token: 'curto', novaSenha: 'Nova@1234', confirmarSenha: 'Nova@1234' });
  t.ok(r.status === 400, `link malformado deveria dar 400 (deu ${r.status})`);
  r = await post('/api/auth/senha/redefinir', { token: token1, novaSenha: '123', confirmarSenha: '123' });
  t.ok(r.status === 400, `senha curta deveria dar 400 (deu ${r.status})`);
  r = await post('/api/auth/senha/redefinir', { token: token1, novaSenha: 'Nova@1234', confirmarSenha: 'Outra@1234' });
  t.ok(r.status === 400, `confirmacao diferente deveria dar 400 (deu ${r.status})`);
  r = await post('/api/auth/login/empresa', { email, senha: 'Antiga@123' });
  t.ok(r.status < 300, 'tentativas recusadas nao deveriam mudar a senha');

  // 4) Redefinir com o link certo
  r = await post('/api/auth/senha/redefinir', { token: token1, novaSenha: 'Nova@1234', confirmarSenha: 'Nova@1234' });
  t.ok(r.status < 300, `redefinir deveria funcionar (${r.status} ${r.texto})`);
  r = await post('/api/auth/login/empresa', { email, senha: 'Antiga@123' });
  t.ok(r.status === 401, `senha antiga deveria parar de funcionar (deu ${r.status})`);
  r = await post('/api/auth/login/empresa', { email, senha: 'Nova@1234' });
  t.ok(r.status < 300 && r.json?.accessToken, `senha nova deveria entrar (${r.status})`);

  // 5) Uso unico
  r = await post('/api/auth/senha/redefinir', { token: token1, novaSenha: 'Terceira@123', confirmarSenha: 'Terceira@123' });
  t.ok(r.status === 400, `o mesmo link nao pode servir duas vezes (deu ${r.status})`);
  r = await post('/api/auth/login/empresa', { email, senha: 'Nova@1234' });
  t.ok(r.status < 300, 'reuso do link nao deveria mudar a senha');

  // 6) Link novo invalida o anterior (espera passar o intervalo de 1 minuto simulando com dois pedidos de contas diferentes nao serve; usa a mesma conta)
  await dormir(61_000);
  await post('/api/auth/senha/esqueci', { email });
  await dormir(61_000);
  await post('/api/auth/senha/esqueci', { email });
  lista = emails(outbox).filter((m) => m.to === email);
  t.ok(lista.length === 3, `deveria ter 3 e-mails no total (tem ${lista.length})`);
  const velho = tokenDe(lista[1]); const novo = tokenDe(lista[2]);
  r = await post('/api/auth/senha/redefinir', { token: velho, novaSenha: 'Quarta@1234', confirmarSenha: 'Quarta@1234' });
  t.ok(r.status === 400, `link antigo deveria ser invalidado pelo novo (deu ${r.status})`);
  r = await post('/api/auth/senha/redefinir', { token: novo, novaSenha: 'Quarta@1234', confirmarSenha: 'Quarta@1234' });
  t.ok(r.status < 300, `link novo deveria funcionar (${r.status} ${r.texto})`);

  // 7) E-mail invalido no pedido
  r = await post('/api/auth/senha/esqueci', { email: 'isso-nao-e-email' });
  t.ok(r.status === 400, `e-mail invalido deveria dar 400 (deu ${r.status})`);
} finally {
  parar(be);
  try { rmSync(outbox, { recursive: true, force: true }); } catch {}
}
t.done('sec-senha');
