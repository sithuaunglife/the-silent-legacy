import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
let files = 0;
function check(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) check(p);
    else if (p.endsWith('.jsx')) {
      files++;
      const source = fs.readFileSync(p, 'utf8');
      if (!/import\s+React\b[^;]*from\s+['"]react['"]/.test(source)) {
        throw new Error(`Missing React import for classic JSX transform: ${path.relative(root, p)}`);
      }
    }
  }
}
check(root);
console.log(`PASS: ${files} JSX files import React`);
