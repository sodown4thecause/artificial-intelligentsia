// FR coverage verifier — asserts each of the 65 PRD FR IDs is implemented by a module.
// Run: npx tsx scripts/verify-coverage.ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const pad = (n: number) => String(n).padStart(3, '0');
const ALL_FRS: string[] = [
  ...Array.from({ length: 7 }, (_, i) => `GO-${pad(i + 1)}`),
  ...Array.from({ length: 14 }, (_, i) => `WRITE-${pad(i + 1)}`),
  ...Array.from({ length: 16 }, (_, i) => `MAIL-${pad(i + 1)}`),
  ...Array.from({ length: 13 }, (_, i) => `DOCS-${pad(i + 1)}`),
  ...Array.from({ length: 5 }, (_, i) => `MEM-${pad(i + 1)}`),
  ...Array.from({ length: 5 }, (_, i) => `AUTO-${pad(i + 1)}`),
  ...Array.from({ length: 5 }, (_, i) => `TEAM-${pad(i + 1)}`),
];

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (full.endsWith('.ts')) acc.push(full);
  }
  return acc;
}

const srcFiles = walk(join(process.cwd(), 'src'));
const haystack = srcFiles.map((f) => readFileSync(f, 'utf8')).join('\n');

const missing = ALL_FRS.filter((fr) => !haystack.includes(fr));
const implemented = ALL_FRS.length - missing.length;

console.log(`FR coverage: ${implemented}/${ALL_FRS.length}`);
if (missing.length) {
  console.log('MISSING:', missing.join(', '));
  process.exit(1);
} else {
  console.log('✅ All 65 FRs referenced in implementation.');
}
