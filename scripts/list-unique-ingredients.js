// Utility to list unique ingredient names from creation-import-errors-2.log
// Run with: node scripts/list-unique-ingredients.js

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.join(__dirname, 'creation-import-errors-2.log');

function main() {
  const text = readFileSync(logPath, 'utf8');
  const lines = text.split(/\r?\n/);
  const ingredients = new Set();

  for (const line of lines) {
    const match = line.match(/ingredient="([^"]+)"/);
    if (match) {
      ingredients.add(match[1]);
    }
  }

  const sorted = Array.from(ingredients).sort((a, b) => a.localeCompare(b));

  console.log(`Found ${sorted.length} unique ingredients:\n`);
  for (const name of sorted) {
    console.log(name);
  }
}

main();
