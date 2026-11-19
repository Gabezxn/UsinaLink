// "Esqueci minha senha" mantém o tipo de conta: o "voltar" e o fim da troca de senha levam ao login certo (e não sempre ao mesmo).
import { playwright, SITE } from '../lib/login.mjs';
import { checker } from '../security/_lib.mjs';
const t = checker();
const { chromium } = playwright();
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
const erros = []; page.on('pageerror', (e) => erros.push(e.message));
const casos = [['login-empresa.html', 'empresa'], ['login-pessoa-fisica.html', 'pessoa_fisica'], ['login-usina.html', 'usina']];
for (const [login, tipo] of casos) {
  await page.goto(`${SITE}/${login}`);
  await page.click('text=Esqueci minha senha');
  await page.waitForURL(`**/esqueci-senha.html?tipo=${tipo}`);
  t.ok((await page.getAttribute('a.text-link.centered', 'href')) === login, `${login}: "Voltar para o login" deveria voltar para ${login}`);
  const classe = await page.evaluate(() => document.body.className);
  t.ok(tipo === 'usina' ? /usina-auth/.test(classe) : tipo === 'pessoa_fisica' ? /pf-mode/.test(classe) : !/usina-auth|pf-mode/.test(classe), `${login}: a tela de esqueci deveria seguir o padrão do tipo (${tipo}); classes do body: ${classe}`);
}
// Entrando pelo login geral, volta para o login geral
await page.goto(`${SITE}/login.html`);
await page.click('text=Esqueci minha senha');
t.ok((await page.getAttribute('a.text-link.centered', 'href')) === 'login.html', 'do login geral deveria voltar para login.html');
// Tela de nova senha: o tipo vem no link do e-mail e o código é apagado do endereço
const token = 'a'.repeat(64);
for (const [login, tipo] of casos) {
  await page.goto('about:blank'); // só a parte depois do # muda: sem isto o navegador não recarrega a página
  await page.goto(`${SITE}/redefinir-senha.html#token=${token}&tipo=${tipo}`);
  t.ok((await page.getAttribute('a.text-link.centered', 'href')) === login, `nova senha (${tipo}): o botão voltar deveria ir para ${login}`);
  t.ok(!page.url().includes('token='), 'o código deveria sair do endereço');
}
// Depois de trocar a senha, vai para o login do tipo da conta (resposta do servidor simulada aqui)
await page.route('**/api/auth/senha/redefinir', (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ mensagem: 'Senha alterada.' }) }));
await page.goto('about:blank');
await page.goto(`${SITE}/redefinir-senha.html#token=${token}&tipo=usina`);
await page.fill('#redefinir-senha', 'Nova@123'); await page.fill('#redefinir-confirmar', 'Nova@123');
await page.click('#form-redefinir [type="submit"]');
await page.waitForURL('**/login-usina.html', { timeout: 8000 }).catch(() => t.ok(false, 'depois da nova senha deveria ir para login-usina.html'));
t.ok(erros.length === 0, `erros de JavaScript: ${erros.join(' | ')}`);
await browser.close();
t.done('esqueci-senha-ui');
