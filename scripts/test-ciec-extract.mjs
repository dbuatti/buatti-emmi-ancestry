// Run: node --experimental-strip-types scripts/test-ciec-extract.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import * as mod from '../src/lib/ocr/ciec-extract.ts';
const { parseCiecExtract, crossCheck, toRecordMarkdown, translateAnnotation } = mod;

const fx = (n) => readFileSync(new URL(`./fixtures/ocr/${n}`, import.meta.url), 'utf8');
const get = (r, k) => r.fields.find((f) => f.key === k);
let failures = 0;
const check = (name, fn) => { try { fn(); console.log('ok  ', name); } catch (e) { failures++; console.log('FAIL', name, '\n     ', e.message); } };

for (const file of ['egidio-1870-tesseract.txt', 'egidio-1870-textlayer.txt']) {
  const r = parseCiecExtract(fx(file));
  check(`${file}: form`, () => { assert.equal(r.form, 'birth'); assert.ok(r.isCiecForm); });
  check(`${file}: comune`, () => assert.equal(get(r, 'comune')?.value, 'LINGUAGLOSSA'));
  check(`${file}: birth date/place`, () => assert.equal(get(r, 'eventDate')?.value, '03/02/1870 LINGUAGLOSSA'));
  check(`${file}: surname`, () => assert.equal(get(r, 'surname')?.value, 'EMMI'));
  check(`${file}: given names`, () => assert.equal(get(r, 'givenNames')?.value, 'EGIDIO'));
  check(`${file}: sex`, () => assert.equal(get(r, 'sex')?.value, 'maschile'));
  check(`${file}: father`, () => assert.equal(get(r, 'father')?.value, 'EMMI, ANTONINO'));
  check(`${file}: mother`, () => assert.equal(get(r, 'mother')?.value, 'RAITI, ROSARIA'));
  check(`${file}: annotation`, () => assert.match(get(r, 'annotations')?.value ?? '', /^Emmi Egidio ha contratto .*n\.59\.$/));
  check(`${file}: issue date never the 1966 treaty date`, () => assert.notEqual(get(r, 'issueDate')?.value, '16/11/1966'));
  if (file.includes('tesseract')) check(`${file}: issue date 27/10/2026 offered, flagged`, () => {
    const f = get(r, 'issueDate'); assert.ok(f.candidates.includes('27/10/2026'), JSON.stringify(f));
    assert.notEqual(f.confidence, 'high');
  });
  check(`${file}: officer`, () => assert.equal(get(r, 'officer')?.value, 'FOTI MARIA ANGELA'));
  check(`${file}: atto flagged, not trusted`, () => { assert.equal(get(r, 'atto')?.confidence, 'low'); assert.match(get(r, 'atto').note, /31/); });
  check(`${file}: score ≥ 80`, () => assert.ok(r.score >= 80, `score ${r.score}`));
  check(`${file}: few unexplained lines`, () => assert.ok(r.unexplainedLines.length <= 8, r.unexplainedLines.join(' | ')));
}

check('cross-check flags atto disagreement 311 vs 31', () => {
  const a = parseCiecExtract(fx('egidio-1870-textlayer.txt'));
  const b = parseCiecExtract(fx('egidio-1870-tesseract.txt'));
  const c = crossCheck(a, b);
  const atto = get(c, 'atto');
  const iss = get(c, 'issueDate');
  assert.equal(iss.value, '27/10/2026', JSON.stringify(iss));
  assert.equal(iss.confidence, 'medium');
  assert.equal(atto.confidence, 'low');
  assert.match(atto.note, /31.*311|311.*31/);
  assert.equal(get(c, 'father').confidence, 'high');
});

check('annotation translation', () => assert.equal(
  translateAnnotation("Emmi Egidio ha contratto matrimonio con Sgroi Concetta il 04/11/1900 nel Comune di Linguaglossa. L'atto fu i/trascritto nei registri di matrimonio del Comune di Linguaglossa anno 1900 parte/serie /n.59."),
  'Egidio Emmi married Concetta Sgroi on 04/11/1900 in the Comune of Linguaglossa. The act was entered/transcribed in the marriage registers of the Comune of Linguaglossa, year 1900, part/series [left blank], no. 59.'));

check('annotation with part/series filled (Gregorio 1915 wording)', () => assert.match(
  translateAnnotation("Emmi Gregorio ha contratto matrimonio con Patanè Rosaria il 07/07/1948 nel Comune di Fiumefreddo di Sicilia L'atto fu i/trascritto nei registri di matrimonio del Comune di Fiumefreddo di Sicilia anno 1948 parte 2° serie A n.34.") ?? '',
  /part\/series .*2° serie A, no\. 34/));

check('slash read as 1: all readings returned', () => {
  // These are from the real tesseract stamp line "2 71012026."
  const { slashAsOneCandidates } = mod;
  assert.deepEqual(slashAsOneCandidates('271012026').sort(), ['27/01/2026', '27/10/2026']);
  assert.deepEqual(slashAsOneCandidates('27102026'), ['27/10/2026']);
});

check('non-CIEC text is not mistaken for a form', () => {
  const r = parseCiecExtract('Anno Domini Millesimo noncentesimo\nbaptizavi infantem');
  assert.equal(r.isCiecForm, false);
});

const md = toRecordMarkdown(crossCheck(parseCiecExtract(fx('egidio-1870-textlayer.txt')), parseCiecExtract(fx('egidio-1870-tesseract.txt'))));
console.log('\n' + md + '\n');
if (failures) { console.log(`${failures} failed`); process.exit(1); }
console.log('all passed');
