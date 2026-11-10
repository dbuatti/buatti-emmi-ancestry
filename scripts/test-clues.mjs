// Run: pnpm test:clues
import assert from 'node:assert/strict';
import { consistencyChecks, findCitedActs, citedButNotFiled, brickWalls, siblingGaps } from '../src/lib/clues.ts';

let failures = 0, n = 0;
const check = (name, fn) => { n++; try { fn(); console.log('ok  ', name); } catch (e) { failures++; console.log('FAIL', name, '\n     ', e.message); } };
const P = (id, o = {}) => ({ id, name: o.name ?? id, generation: 0, line: 'Emmi', gender: 'M', spouses: [], parents: [], children: [], ...o });
const kinds = (cs) => cs.map((c) => c.kind);

check('clean family → no checks', () => {
  const dad = P('dad', { birthDate: '1850', deathDate: '1910', children: ['kid'], spouses: ['mum'] });
  const mum = P('mum', { gender: 'F', birthDate: 'c. 1855', children: ['kid'], spouses: ['dad'] });
  const kid = P('kid', { birthDate: '3 Feb 1880', parents: ['dad', 'mum'] });
  assert.deepEqual(consistencyChecks([dad, mum, kid]), []);
});

check('dangling id is reported', () => {
  const cs = consistencyChecks([P('a', { children: ['ghost'] })]);
  assert.deepEqual(kinds(cs), ['dangling-link']);
  assert.match(cs[0].detail, /ghost/);
});

check('one-way parent/child link, both directions', () => {
  assert.deepEqual(kinds(consistencyChecks([P('a', { children: ['b'] }), P('b')])), ['one-way-link']);
  assert.deepEqual(kinds(consistencyChecks([P('a'), P('b', { parents: ['a'] })])), ['one-way-link']);
});

check('one-way spouse link reported once', () => {
  assert.equal(consistencyChecks([P('a', { spouses: ['b'] }), P('b')]).length, 1);
});

check('death before birth', () => {
  const cs = consistencyChecks([P('a', { birthDate: '1900', deathDate: '1890' })]);
  assert.equal(cs[0].kind, 'impossible-dates'); assert.equal(cs[0].severity, 'error');
});

check('vague dates never trigger: "c." and "before"', () => {
  // c. 1890 = 1888–1892; child 1903 → parent could be 11–15: not impossible under every reading
  const par = P('p', { birthDate: 'c. 1890', children: ['k'] });
  const kid = P('k', { birthDate: '1903', parents: ['p'] });
  assert.deepEqual(consistencyChecks([par, kid]), []);
  // "Before 1889" death gives only an upper bound; birth unknown → nothing
  assert.deepEqual(consistencyChecks([P('x', { birthDate: 'Unknown', deathDate: 'Before 1889' })]), []);
});

check('parent under 13 at birth', () => {
  const par = P('p', { birthDate: '1895', children: ['k'] });
  const kid = P('k', { birthDate: '1900', parents: ['p'] });
  assert.ok(consistencyChecks([par, kid]).some((c) => c.kind === 'parent-age' && /under 13/.test(c.title)));
});

check('child born after mother died; father gets a 1-year grace', () => {
  const mum = P('m', { gender: 'F', birthDate: '1850', deathDate: '1880', children: ['k'] });
  const kid = P('k', { birthDate: '1881', parents: ['m'] });
  assert.ok(consistencyChecks([mum, kid]).some((c) => /born after/.test(c.title)));
  const dad = P('d', { birthDate: '1850', deathDate: '1880', children: ['k2'] });
  const kid2 = P('k2', { birthDate: '1881', parents: ['d'] });
  assert.ok(!consistencyChecks([dad, kid2]).some((c) => /born after/.test(c.title)));
});

check('mother over 52 flagged', () => {
  const mum = P('m', { gender: 'F', birthDate: '1820', children: ['k'] });
  const kid = P('k', { birthDate: '1880', parents: ['m'] });
  assert.ok(consistencyChecks([mum, kid]).some((c) => /over 52/.test(c.title)));
});

check('three parents is an error', () => {
  const k = P('k', { parents: ['a', 'b', 'c'] });
  const ps = ['a', 'b', 'c'].map((id) => P(id, { children: ['k'] }));
  assert.ok(consistencyChecks([k, ...ps]).some((c) => c.kind === 'too-many-parents' && c.severity === 'error'));
});

check('same name: flagged unless far apart, related, or declared distinct', () => {
  const a = P('a', { name: 'Egidio Emmi', birthDate: '1870' });
  assert.equal(kinds(consistencyChecks([a, P('b', { name: 'Emmi Egidio', birthDate: '1868' })])).join(), 'possible-duplicate');
  assert.deepEqual(consistencyChecks([a, P('b', { name: 'Egidio Emmi', birthDate: '1930' })]), []);
  assert.deepEqual(consistencyChecks([a, P('b', { name: 'Egidio Emmi', birthDate: '1868', notes: ['NOT the same person as Egidio (1870).'] })]), []);
  const dad = P('d', { name: 'Egidio Emmi', children: ['s'] }), son = P('s', { name: 'Egidio Emmi', parents: ['d'] });
  assert.deepEqual(consistencyChecks([dad, son]), []);
});

// --- cited acts ------------------------------------------------------------
const one = (t) => { const r = findCitedActs(t); assert.equal(r.length, 1, JSON.stringify(r)); return r[0]; };

check('register word year: "Nati 1877, atto n. 58" (ignores 2026 found-date)', () => {
  const c = one('Birth record found 10 Jul 2026: Linguaglossa Nati 1877, atto n. 58. Born 10 Mar 1877.');
  assert.deepEqual([c.number, c.year, c.kind], ['58', 1877, 'birth']);
});
check('year right before: "04/11/1900 atto № 59"', () => {
  const c = one('d. 1889. Married Concetta Sgroi 04/11/1900 atto № 59. Father Antonino d. 1889.');
  assert.deepEqual([c.number, c.year, c.kind], ['59', 1900, 'marriage']);
});
check('year after: "Atto 12, 23 April 1911"', () => {
  const c = one('MARRIAGE ACT FOUND: Atto 12, 23 April 1911, Fiumefreddo.');
  assert.deepEqual([c.number, c.year], ['12', 1911]);
});
check('slash form: "atto 110/1879"', () => assert.deepEqual([one('see atto 110/1879 (Salvatore)').number, one('see atto 110/1879 (Salvatore)').year], ['110', 1879]));
check('"atto 8 Oct 1911" is a date, not act 8', () => assert.deepEqual(findCitedActs('married, atto 8 Oct 1911, Fiumefreddo n. 26'), []));
check('"Data dell\'atto: 26 gennaio 1970" is a date', () => assert.deepEqual(findCitedActs("Data dell'atto: 26 gennaio 1970"), []));
check('death register', () => assert.equal(one('Morti 1889, atto n. 27, Linguaglossa. Died 11 Mar 1889').kind, 'death'));

check('already-filed act is not reported; unfiled one is', () => {
  const people = [P('egidio', { name: 'Egidio Emmi' })];
  const filed = [{ id: 'r1', atto: '59', year: '1900', type: 'Marriage Record', comune: 'Linguaglossa', people: ['egidio'] }];
  const src = (text) => [{ personId: 'egidio', label: "Egidio Emmi's notes", text }];
  assert.deepEqual(citedButNotFiled(src('Linguaglossa Matrimoni 1900, atto n. 59.'), filed, people), []);
  // same number in his own notes with a mis-guessable year is still the filed act
  assert.deepEqual(citedButNotFiled(src('Father died 1889 … see marriage (atto n. 59).'), filed, people), []);
  const r = citedButNotFiled(src('Antenati: Morti 1889, atto n. 27, Linguaglossa.'), filed, people);
  assert.equal(r.length, 1); assert.match(r[0].title, /Death act n\. 27 of 1889 — seen, not filed/);
});

check('ruled-out / excluded acts are skipped; duplicates collapse', () => {
  const people = [P('a'), P('b')];
  assert.deepEqual(citedButNotFiled([{ personId: 'a', label: 'x', text: 'RULED OUT: Calatabiano Nati 1884 atto 103 — different person.' }], [], people), []);
  const r = citedButNotFiled([
    { personId: 'a', label: 'x', text: 'Nati 1850, atto n. 15.' },
    { personId: 'b', label: 'y', text: 'her birth: Nati 1850, atto n. 15.' },
  ], [], people);
  assert.equal(r.length, 1); assert.deepEqual(r[0].personIds, ['a', 'b']);
});

// --- openings --------------------------------------------------------------
check('brick walls: nearest generation first, names the missing act', () => {
  const me = P('me', { parents: ['f', 'm'] });
  const f = P('f', { name: 'Father', children: ['me'], parents: ['gf'], records: [{ type: 'Death Record', status: 'Found' }] });
  const m = P('m', { name: 'Mother', gender: 'F', children: ['me'], records: [{ type: 'Death Record', status: 'Found' }] });
  const gf = P('gf', { name: 'Grandfather', children: ['f'] });
  const w = brickWalls([me, f, m, gf], 'me');
  assert.deepEqual(w.map((c) => c.personIds[0]), ['f', 'm', 'gf']);
  assert.match(w[0].title, /Father — mother unknown/);
  assert.match(w[1].action, /marriage act/);   // death is on file → next is marriage
  assert.match(w[2].action, /death act/);
});

check('sibling gap of 6+ years, exact-ish dates only', () => {
  const dad = P('d', { children: ['a', 'b', 'c'] }), mum = P('m', { gender: 'F', children: ['a', 'b', 'c'] });
  const kids = [['a', '1880'], ['b', '1882'], ['c', '1891']].map(([id, y]) => P(id, { birthDate: y, parents: ['d', 'm'], birthPlace: 'Linguaglossa, Catania' }));
  const g = siblingGaps([dad, mum, ...kids]);
  assert.equal(g.length, 1); assert.match(g[0].title, /9-year gap/); assert.match(g[0].action, /Linguaglossa for 1883–1890/);
  kids[2].birthDate = 'Unknown';
  assert.deepEqual(siblingGaps([dad, mum, ...kids]), []);
});

console.log(failures ? `${failures} of ${n} failed` : `all ${n} passed`);
if (failures) process.exit(1);
