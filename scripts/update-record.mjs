#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const [recordId, section, content] = process.argv.slice(2);

if (!recordId || !section || !content) {
  console.error('Usage: node scripts/update-record.mjs <record-id> <section> <content>');
  console.error('Sections: front-matter, discrepancies');
  process.exit(1);
}

const recordMd = path.resolve('records', recordId, 'record.md');

if (!fs.existsSync(recordMd)) {
  console.error(`Record not found: ${recordMd}`);
  process.exit(1);
}

let raw = fs.readFileSync(recordMd, 'utf-8');

const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!fmMatch) {
  console.error('Invalid record.md format: no front matter');
  process.exit(1);
}

const [, fmYaml, body] = fmMatch;

if (section === 'discrepancies') {
  let newBody = body;
  const discHeader = '## Discrepancies';
  const discIdx = newBody.indexOf(discHeader);
  if (discIdx !== -1) {
    // Find end of discrepancies section (next ## header or end of string)
    const rest = newBody.slice(discIdx + discHeader.length);
    const nextHeaderIdx = rest.indexOf('\n## ');
    let insertionPoint;
    if (nextHeaderIdx !== -1) {
      insertionPoint = discIdx + discHeader.length + nextHeaderIdx;
    } else {
      insertionPoint = newBody.length;
    }
    const before = newBody.slice(0, insertionPoint);
    const after = newBody.slice(insertionPoint);
    const sep = before.endsWith('\n') ? '' : '\n';
    newBody = before + sep + `- ${content}\n` + after;
  } else {
    newBody = newBody.trimEnd() + `\n\n## Discrepancies\n- ${content}\n`;
  }

  const newRaw = `---\n${fmYaml}\n---\n${newBody}\n`;
  fs.writeFileSync(recordMd, newRaw);
  console.log(`Updated discrepancies in ${recordMd}`);
} else if (section === 'front-matter') {
  // Parse key=value from content, e.g. "verified=true"
  const [key, value] = content.split('=');
  if (!key || !value) {
    console.error('Front-matter content must be key=value format');
    process.exit(1);
  }
  const boolValue = value === 'true';
  const isBool = value === 'true' || value === 'false';
  const normalized = isBool ? boolValue : `"${value}"`;
  const lines = fmYaml.split('\n');
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${key}:`)) {
      lines[i] = `${key}: ${normalized}`;
      found = true;
      break;
    }
  }
  if (!found) {
    lines.push(`${key}: ${normalized}`);
  }
  const newRaw = `---\n${lines.join('\n')}\n---\n${body}\n`;
  fs.writeFileSync(recordMd, newRaw);
  console.log(`Updated front-matter ${key}=${value} in ${recordMd}`);
} else {
  console.error(`Unknown section: ${section}`);
  process.exit(1);
}
