// Helpers dos testes de segurança (API direta). Cada teste imprime só falhas.
export const API = process.env.API || 'http://localhost:3000';
export const DEMO = { empresa: 'empresa@demo.com', usina: 'usina@demo.com', pessoa_fisica: 'pessoa@demo.com', senha: 'Demo@123' };
export async function call(method, path, token, body, headers = {}) {
  const r = await fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null; try { json = await r.json(); } catch {}
  return { status: r.status, json };
}
export async function login(tipo, email = DEMO[tipo], senha = DEMO.senha) {
  const r = await call('POST', `/api/auth/login/${tipo}`, null, { email, senha });
  if (!r.json?.accessToken) throw new Error(`login ${tipo} ${email}: ${r.status} ${JSON.stringify(r.json)}`);
  return r.json.accessToken;
}
const uid = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
const digits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
/** Cria conta nova e devolve { token, email }. extra permite sobrescrever nome etc. */
export async function registrar(tipo, extra = {}) {
  const email = `qa-${tipo}-${uid()}@teste.com`;
  const body = { tipo, nome: `QA ${tipo} ${uid()}`, email, senha: 'Demo@123', confirmarSenha: 'Demo@123', cnpj: digits(14), cpf: digits(11), telefone: '11999990000', responsavel: 'QA', ...extra };
  const r = await call('POST', `/api/cadastro/${tipo}`, null, body);
  if (r.status >= 300) throw new Error(`cadastro ${tipo}: ${r.status} ${JSON.stringify(r.json)}`);
  return { token: await login(tipo, email), email, body };
}
export function checker() {
  const fails = [];
  return { fails, ok: (c, m) => { if (!c) fails.push(m); }, done(nome) { if (fails.length) { console.log(fails.map((f) => `${nome}: ${f}`).join('\n')); process.exit(1); } console.log(`OK ${nome}`); } };
}
export async function novoPedido(token, extra = {}) {
  const r = await call('POST', '/api/pedidos', token, { peca: `Eixo QA ${uid()}`, categoria: 'Eixos', material: 'Aco', quantidade: '10', prazo: '15 dias', descricao: 'teste', urgencia: 'media', ...extra });
  if (r.status >= 300) throw new Error(`pedido: ${r.status} ${JSON.stringify(r.json)}`);
  return r.json;
}
export async function novaProposta(token, pedidoId, extra = {}) {
  const r = await call('POST', '/api/propostas', token, { pedidoId: String(pedidoId), valor: '1000', prazo: '10 dias', frete: '50', observacao: 'qa', ...extra });
  if (r.status >= 300) throw new Error(`proposta: ${r.status} ${JSON.stringify(r.json)}`);
  return r.json;
}
