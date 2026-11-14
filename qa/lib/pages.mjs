import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'Site');
/** Lista { file, roles[] } de todas as páginas; roles vazio = pública. */
export function listPages() {
  return readdirSync(SITE_DIR).filter((f) => f.endsWith('.html') && f !== '404.html').sort().map((file) => {
    const m = readFileSync(join(SITE_DIR, file), 'utf8').match(/data-user-role="([^"]+)"/);
    return { file, roles: m ? m[1].split(',').map((s) => s.trim()) : [] };
  });
}
