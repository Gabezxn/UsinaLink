// SEC-1: admin demo não loga com Demo@123. SEC-2: token forjado com o segredo de exemplo é recusado.
import { createHmac } from 'node:crypto';
import { call, checker } from './_lib.mjs';
const t = checker();
let r = await call('POST', '/api/auth/login/admin', null, { email: 'admin@demo.com', senha: 'Demo@123' });
t.ok(r.status >= 400, `SEC-1 admin@demo.com/Demo@123 conseguiu entrar (status ${r.status})`);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const head = b64({ alg: 'HS256', typ: 'JWT' }), body = b64({ sub: 1, tipoUsuario: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 });
const sig = createHmac('sha256', 'usinalink-dev-secret').update(`${head}.${body}`).digest('base64url');
r = await call('GET', '/api/solicitacoes-bloqueio-usina/admin/todas', `${head}.${body}.${sig}`);
t.ok(r.status === 401 || r.status === 403, `SEC-2 token forjado com segredo público foi aceito (status ${r.status})`);
t.done('sec-1-2-seed-jwt');
