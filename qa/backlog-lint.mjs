// Valida docs/BACKLOG.md. Uso: node qa/backlog-lint.mjs [caminho]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'BACKLOG.md');
const lines = readFileSync(file, 'utf8').split('\n');
const ID = /^(SEC|FLX|A11Y|BUG)-\d+$/;
const SEV = new Set(['P0', 'P1', 'P2']);
const STATUS = new Set(['aberto', 'corrigido', 'descartado']);
let n = 0, p0 = 0, p1 = 0, errors = 0;
for (const raw of lines) {
  const line = raw.trim();
  if (!line.startsWith('|')) continue;
  const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  if (cells[0] === 'ID' || /^-+$/.test(cells[0].replace(/:/g, ''))) continue; // cabeçalho/separador
  n++;
  const err = (m) => { console.log(`linha ${n}: ${m}`); errors++; };
  if (cells.length !== 7) { if (!SEV.has(cells[1])) err('Sev inválida'); else err('esperados 7 campos'); continue; }
  if (!ID.test(cells[0])) err('ID inválido');
  if (!SEV.has(cells[1])) err('Sev inválida');
  if (!STATUS.has(cells[6])) err('Status inválido');
  if (cells[6] === 'aberto') { if (cells[1] === 'P0') p0++; if (cells[1] === 'P1') p1++; }
}
console.log(`P0 abertos: ${p0}, P1 abertos: ${p1}`);
process.exit(errors ? 1 : 0);
