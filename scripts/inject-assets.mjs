// Insere a11y.css e a11y.js em cada Site/*.html. Idempotente. Uso: node scripts/inject-assets.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', 'Site');
const LINKS = ['<link rel="stylesheet" href="assets/css/a11y.css">', '<script src="assets/js/safe-html.js"></script>'];
const SCRIPTS = ['<script src="assets/js/a11y.js" defer></script>'];
let changed = 0;
for (const f of readdirSync(SITE).filter((n) => n.endsWith('.html') && n !== '404.html')) {
  const p = join(SITE, f); let h = readFileSync(p, 'utf8'); const orig = h;
  for (const l of LINKS) if (!h.includes(l)) h = h.replace('</head>', `  ${l}\n</head>`);
  for (const s of SCRIPTS) if (!h.includes(s)) h = h.replace('</body>', `  ${s}\n</body>`);
  if (h !== orig) { writeFileSync(p, h); changed++; }
}
console.log(`${changed} arquivos atualizados`);
