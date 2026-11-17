// BUG-1 / Review Focus 5: token inválido ou expirado no meio da sessão leva ao login com mensagem, sem laço de redirecionamento.
import { playwright, SITE } from '../lib/login.mjs';
import { checker } from '../security/_lib.mjs';
const t = checker();
const { chromium } = playwright();
const browser = await chromium.launch();
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwtExpirado = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 1, tipoUsuario: 'empresa', exp: Math.floor(Date.now() / 1000) - 3600 })}.assinatura-falsa`;
const casos = [
  ['token inválido (lixo)', 'lixo-que-nao-e-jwt', 'dashboard-empresa.html', 'login-empresa.html', 'empresa'],
  ['token expirado', jwtExpirado, 'dashboard-usina.html', 'login-usina.html', 'usina'],
  ['token assinado por outro segredo', `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 1, tipoUsuario: 'pessoa_fisica', exp: Math.floor(Date.now() / 1000) + 3600 })}.assinatura-falsa`, 'dashboard-pessoa-fisica.html', 'login-pessoa-fisica.html', 'pessoa_fisica'],
];
for (const [nome, token, pagina, loginEsperado, tipo] of casos) {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await ctx.addInitScript(([tk, tp]) => {
    try { if (!sessionStorage.getItem('qa-init')) { sessionStorage.setItem('qa-init', '1'); sessionStorage.setItem('accessToken', tk); sessionStorage.setItem('tipoUsuario', tp); sessionStorage.setItem('usinalinkSession', JSON.stringify({ tipo: tp, nome: 'QA' })); } } catch {}
  }, [token, tipo]);
  let navs = 0; page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs++; });
  await page.goto(`${SITE}/${pagina}`);
  await page.waitForURL(new RegExp(loginEsperado), { timeout: 15000 }).catch(() => t.ok(false, `${nome}: não foi para ${loginEsperado} (parou em ${page.url().replace(SITE, '')})`));
  await page.waitForTimeout(2500);
  t.ok(page.url().includes(loginEsperado), `${nome}: deveria terminar em ${loginEsperado} (terminou em ${page.url().replace(SITE, '')})`);
  t.ok(navs <= 3, `${nome}: laço de redirecionamento (${navs} navegações)`);
  const aviso = await page.locator('[role="alert"], [role="status"], .toast, .form-notice').allInnerTexts();
  t.ok(aviso.some((x) => /sess[aã]o|entre novamente|expirou/i.test(x)), `${nome}: falta mensagem visível sobre a sessão (achou: ${aviso.join(' / ').slice(0, 80)})`);
  await ctx.close();
}
await browser.close();
t.done('session-expired');
