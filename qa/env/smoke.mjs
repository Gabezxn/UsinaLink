// Teste de fumaça: backend, login demo e site estático no ar.
const API = process.env.API || 'http://localhost:3000';
const SITE = process.env.SITE || 'http://localhost:5500';
const fail = [];
async function check(nome, fn) { try { await fn(); } catch (e) { fail.push(`${nome}: ${e.message}`); } }
await check('GET API/', async () => { const r = await fetch(`${API}/`); if (r.status !== 200) throw new Error(`status ${r.status}`); });
await check('login empresa', async () => {
  const r = await fetch(`${API}/api/auth/login/empresa`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'empresa@demo.com', senha: 'Demo@123' }) });
  const j = await r.json().catch(() => ({}));
  if (!(r.status === 200 || r.status === 201) || !(j.token || j.accessToken || j.access_token)) throw new Error(`status ${r.status} ${JSON.stringify(j).slice(0, 120)}`);
});
await check('GET SITE/index.html', async () => { const r = await fetch(`${SITE}/index.html`); if (r.status !== 200) throw new Error(`status ${r.status}`); });
if (fail.length) { console.log(fail.join('\n')); process.exit(1); }
console.log('OK');
