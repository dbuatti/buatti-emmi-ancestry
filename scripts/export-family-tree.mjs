#!/usr/bin/env node
/**
 * One-click export of the whole family tree:
 *
 *   pnpm export:tree            (or: node scripts/export-family-tree.mjs)
 *
 * - builds the plain-text/markdown export from src/data/familyData.ts
 * - writes it to ./family-tree-export.md (upload fallback for long pastes)
 * - copies the same text to the macOS clipboard via pbcopy
 *
 * Flags:
 *   --no-clipboard   write the file only
 *   --out <path>     write to a different file (default: family-tree-export.md)
 *
 * The data file is TypeScript, but Node >= 22.18 strips types natively, so no
 * build step is needed. All imports in the data file are type-only.
 */

import { writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');

const argv = process.argv.slice(2);
const noClipboard = argv.includes('--no-clipboard');
const outFlagIndex = argv.indexOf('--out');
const outPath = path.resolve(REPO_ROOT, outFlagIndex >= 0 ? argv[outFlagIndex + 1] || 'family-tree-export.md' : 'family-tree-export.md');

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

let data;
let builder;
try {
  data = await import(pathToFileURL(path.join(REPO_ROOT, 'src/data/familyData.ts')).href);
  builder = await import(pathToFileURL(path.join(REPO_ROOT, 'src/lib/exportFamilyTree.ts')).href);
} catch (err) {
  fail(
    `Could not load the family data / exporter. Node 22.18+ is required (type stripping).\n  ${err && err.message ? err.message : err}`,
  );
}

const { initialPeople, initialResearchLeads, initialOpenQuestions } = data;
const { buildFamilyTreeExport } = builder;

if (!Array.isArray(initialPeople) || initialPeople.length === 0) {
  fail('src/data/familyData.ts exported no people — nothing to export.');
}

const text = buildFamilyTreeExport(initialPeople, initialResearchLeads, initialOpenQuestions, { date: new Date() });

await writeFile(outPath, text, 'utf8');

const blocks = (text.match(/^### /gm) || []).length;
const lines = text.split('\n').length;

console.log('');
console.log('  Buatti — Emmi family tree export');
console.log('  ───────────────────────────────────────────────');
console.log(`  people exported : ${initialPeople.length}`);
console.log(`  person blocks   : ${blocks >= initialPeople.length ? blocks : `${blocks} headings`}`);
console.log(`  size            : ${text.length.toLocaleString()} characters, ${lines} lines`);
console.log(`  file            : ${outPath}`);

if (noClipboard) {
  console.log('  clipboard       : skipped (--no-clipboard)');
  console.log('');
  process.exit(0);
}

if (process.platform !== 'darwin') {
  console.log('  clipboard       : skipped (pbcopy is macOS-only)');
  console.log('');
  process.exit(0);
}

const copy = spawnSync('pbcopy', { input: text, encoding: 'utf8' });
if (copy.error) {
  console.error(`\n  clipboard       : FAILED (${copy.error.message}). The file was still written.\n`);
  process.exit(1);
}
if (copy.status !== 0) {
  console.error(`\n  clipboard       : FAILED (pbcopy exit ${copy.status}: ${(copy.stderr || '').trim()}). The file was still written.\n`);
  process.exit(1);
}

// Verify by reading the clipboard back and comparing byte length.
const verify = spawnSync('pbpaste', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
if (verify.status === 0 && typeof verify.stdout === 'string' && verify.stdout.length === text.length) {
  console.log(`  clipboard       : OK — ${verify.stdout.length.toLocaleString()} characters verified via pbpaste`);
} else if (verify.status === 0) {
  console.log(
    `  clipboard       : written, but pbpaste returned ${verify.stdout ? verify.stdout.length : 0} chars (expected ${text.length}) — check for clipboard managers truncating large text.`,
  );
} else {
  console.log('  clipboard       : written (could not verify via pbpaste)');
}
console.log('');
console.log('  Paste it into Claude, or upload the .md file if the paste is truncated.');
console.log('');
