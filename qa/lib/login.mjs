import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const SITE = process.env.SITE || 'http://localhost:5500';
export const API = process.env.API || 'http://localhost:3000';
export function playwright() {
  try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); }
}
const ACCOUNTS = {
  empresa: { email: 'empresa@demo.com', page: 'login-empresa.html', dash: 'dashboard-empresa.html' },
  usina: { email: 'usina@demo.com', page: 'login-usina.html', dash: 'dashboard-usina.html' },
  pessoa_fisica: { email: 'pessoa@demo.com', page: 'login-pessoa-fisica.html', dash: 'dashboard-pessoa-fisica.html' },
};
export const DEMO = { ...ACCOUNTS, senha: 'Demo@123' };
/** Login pela UI com a conta demo e espera o dashboard. */
export async function loginAs(page, role, creds) {
  const a = ACCOUNTS[role];
  if (!a) throw new Error(`papel inválido: ${role}`);
  await page.goto(`${SITE}/${a.page}`);
  await page.fill('input[name="email"]', creds?.email || a.email);
  await page.fill('input[name="senha"]', creds?.senha || 'Demo@123');
  await Promise.all([page.waitForURL(`**/${a.dash}`, { timeout: 120000 }), page.click('form.js-login-form [type="submit"]')]);
}
