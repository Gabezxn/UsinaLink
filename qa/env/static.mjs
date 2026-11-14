// Servidor estático para Site/. Aplica as regras de Site/_headers quando o arquivo existir.
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'Site');
const PORT = Number(process.env.PORT || 5500);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };

function parseHeaders() { // formato Cloudflare Pages: linha "/*" seguida de "  Nome: valor"
  const f = join(SITE, '_headers');
  if (!existsSync(f)) return [];
  const rules = []; let cur = null;
  for (const raw of readFileSync(f, 'utf8').split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) { cur = { pattern: raw.trim(), headers: [] }; rules.push(cur); continue; }
    const i = raw.indexOf(':'); if (cur && i > 0) cur.headers.push([raw.slice(0, i).trim(), raw.slice(i + 1).trim()]);
  }
  return rules;
}
function matches(pattern, path) {
  const re = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return re.test(path);
}

http.createServer((req, res) => {
  let path = decodeURIComponent((req.url || '/').split('?')[0]);
  if (path === '/') path = '/index.html';
  const file = normalize(join(SITE, path));
  const rules = parseHeaders();
  const apply = () => { for (const r of rules) if (matches(r.pattern, path)) for (const [k, v] of r.headers) res.setHeader(k, v); };
  if (!file.startsWith(SITE) || !existsSync(file) || !statSync(file).isFile()) {
    const nf = join(SITE, '404.html'); apply();
    res.statusCode = 404; res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(existsSync(nf) ? readFileSync(nf) : 'Não encontrado');
  }
  apply();
  res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream');
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`site em http://localhost:${PORT}`));
