/**
 * Triangulator core: turn everything known about a person into search
 * constraints for finding their missing records.
 *
 * Pure functions (no React) so they can be unit-checked with node.
 * All date handling is year-granularity — Italian record requests only
 * need years, and the stored dates are too messy for anything finer.
 */
import type { Person } from '@/types';

export type TriTarget = 'birth' | 'marriage' | 'death';

export interface TriFact {
  label: string;
  value: string;
  source: string;
  recordId?: string;
  personId?: string;
}

export interface TriWindow {
  birthMin?: number;
  birthMax?: number;
  deathMin?: number;
  deathMax?: number;
  explanations: string[];
}

export interface TriPlace {
  place: string;
  count: number;
  via: string[];
}

export interface TriSnippet {
  recordId: string;
  recordType: string;
  line: string;
}

export interface TriRecordLike {
  id: string;
  type: string;
  body: string;
  people: string[];
}

/** All 4-digit years 1500–2099 in a string. */
export function extractYears(text: string): number[] {
  if (!text) return [];
  const out: number[] = [];
  for (const m of text.matchAll(/\b(1[5-9]\d{2}|20[0-2]\d)\b/g)) {
    const y = Number(m[1]);
    if (!out.includes(y)) out.push(y);
  }
  return out.sort((a, b) => a - b);
}

function firstYear(text: string): number | undefined {
  const ys = extractYears(text || '');
  return ys.length > 0 ? ys[0] : undefined;
}

interface YearBound {
  min?: number;
  max?: number;
}

/**
 * Interpret a messy stored date ("c. 1886", "Unknown", "Deceased by 1953",
 * "1810s–1820s", "age 21 in Feb 1886") as a year bound.
 * `ageContextYear` lets "age 21 in 1886" imply birth ~1865 (used for birth).
 */
export function parseDateBound(dateStr: string | undefined, ageContextYear?: number): YearBound {
  if (!dateStr) return {};
  const t = dateStr.toLowerCase();
  if (/unknown|to be confirmed|tbc/.test(t) && !/\d{4}/.test(t) && !/age \d+/.test(t)) return {};

  // "age N in <month?> YYYY" or "age N at ... YYYY"
  const ageMatch = t.match(/age (\d{1,3})[^.\n]{0,30}?(\d{4})/);
  if (ageMatch) {
    const est = Number(ageMatch[2]) - Number(ageMatch[1]);
    return { min: est - 1, max: est + 1 };
  }
  const ctxMatch = ageContextYear !== undefined && /age (\d{1,3})/.test(t)
    ? t.match(/age (\d{1,3})/)
    : null;
  if (ctxMatch && ageContextYear !== undefined) {
    const est = ageContextYear - Number(ctxMatch[1]);
    return { min: est - 1, max: est + 1 };
  }

  // Decade ranges "1810s–1820s"
  const rangeMatch = t.match(/(\d{4})s?\s*[–—-]\s*(\d{4})s?/);
  if (rangeMatch) {
    return { min: Number(rangeMatch[1]), max: Number(rangeMatch[2]) + 9 };
  }

  const ys = extractYears(t);
  if (ys.length === 0) return {};
  const circa = /[~≈c.]\s*\d|circa|about|likely|possibly/.test(t);
  if (/before|prior to|predeceased|deceased by|\bfu\b|by \d/.test(t) && !/after/.test(t)) {
    return { max: ys[0] };
  }
  if (/after|since|from \d/.test(t)) {
    return { min: ys[0] };
  }
  if (circa) {
    return { min: ys[0] - 2, max: ys[ys.length - 1] + 2 };
  }
  return { min: ys[0], max: ys[ys.length - 1] };
}

/** Surname from a display name (strips nicknames + suffixes). */
export function triSurname(personName: string): string {
  const clean = (personName || '').replace(/\([^)]*\)/g, ' ').replace(/["“”']/g, ' ').trim();
  const tokens = clean
    .split(/\s+/)
    .map((x) => x.replace(/\.+$/, ''))
    .filter((x) => x.length > 2 && !/^(sr|jr|ii|iii|iv|senior|junior)$/i.test(x));
  return tokens.length > 0 ? tokens[tokens.length - 1] : '';
}

function personById(all: Person[], id: string): Person | undefined {
  return all.find((p) => p.id === id);
}

function displayName(all: Person[], id: string): string {
  return personById(all, id)?.name ?? id;
}

/** Every structured fact about the person, each with its source. */
export function gatherFacts(person: Person, all: Person[]): TriFact[] {
  const facts: TriFact[] = [];
  const pid = person.id;
  if (person.birthDate) facts.push({ label: 'Birth date', value: person.birthDate, source: 'Person record', personId: pid });
  if (person.birthPlace) facts.push({ label: 'Birth place', value: person.birthPlace, source: 'Person record', personId: pid });
  if (person.deathDate) facts.push({ label: 'Death date', value: person.deathDate, source: 'Person record', personId: pid });
  if (person.deathPlace) facts.push({ label: 'Death place', value: person.deathPlace, source: 'Person record', personId: pid });
  if (person.burialPlace) facts.push({ label: 'Burial place', value: person.burialPlace, source: 'Person record', personId: pid });
  for (const par of person.parents ?? []) {
    const pp = personById(all, par);
    facts.push({
      label: pp?.gender === 'F' ? 'Mother' : 'Father',
      value: displayName(all, par) + (pp?.birthDate ? ` (b. ${pp.birthDate})` : ''),
      source: 'Family link',
      personId: par,
    });
  }
  for (const sp of person.spouses ?? []) {
    const ps = personById(all, sp);
    facts.push({
      label: 'Spouse',
      value: displayName(all, sp) + (ps?.birthDate ? ` (b. ${ps.birthDate})` : ''),
      source: 'Family link',
      personId: sp,
    });
  }
  for (const ch of person.children ?? []) {
    const pc = personById(all, ch);
    facts.push({
      label: 'Child',
      value:
        displayName(all, ch) +
        (pc?.birthDate ? ` (b. ${pc.birthDate}` : ' (birth unknown') +
        (pc?.birthPlace ? `, ${pc.birthPlace}` : '') +
        ')',
      source: 'Family link',
      personId: ch,
    });
  }
  for (const r of person.residences ?? []) {
    facts.push({ label: 'Residence', value: r, source: 'Person record', personId: pid });
  }
  for (const rec of person.records ?? []) {
    facts.push({
      label: `${rec.type} (${rec.status})`,
      value: rec.notes || rec.status,
      source: `Record entry · ${person.name}`,
      personId: pid,
    });
  }
  return facts;
}

/** Date windows implied by the person's own dates + relatives' dates. */
export function deriveWindows(person: Person, all: Person[]): TriWindow {
  const explanations: string[] = [];
  let birthMin: number | undefined;
  let birthMax: number | undefined;
  let deathMin: number | undefined;
  let deathMax: number | undefined;
  const widen = (cur: number | undefined, v: number | undefined, dir: 'min' | 'max') => {
    if (v === undefined) return cur;
    if (cur === undefined) return v;
    return dir === 'min' ? Math.min(cur, v) : Math.max(cur, v);
  };
  const narrow = (cur: number | undefined, v: number | undefined, dir: 'min' | 'max') => {
    if (v === undefined) return cur;
    if (cur === undefined) return v;
    return dir === 'min' ? Math.max(cur, v) : Math.min(cur, v);
  };

  const ownBirth = parseDateBound(person.birthDate);
  birthMin = ownBirth.min;
  birthMax = ownBirth.max;
  if (ownBirth.min !== undefined || ownBirth.max !== undefined) {
    explanations.push(`Own birth field gives ${fmtRange(ownBirth.min, ownBirth.max)}.`);
  }
  const ownDeath = parseDateBound(person.deathDate);
  deathMin = ownDeath.min;
  deathMax = ownDeath.max;
  if (ownDeath.min !== undefined || ownDeath.max !== undefined) {
    explanations.push(`Own death field gives ${fmtRange(ownDeath.min, ownDeath.max)}.`);
  }

  // Alive at each child's birth.
  for (const ch of person.children ?? []) {
    const pc = personById(all, ch);
    const y = pc?.birthDate ? firstYear(pc.birthDate) : undefined;
    if (y !== undefined) {
      deathMin = widen(deathMin, y, 'min');
      explanations.push(`Alive when child ${pc?.name ?? ch} was born (${y}).`);
    }
  }
  // Born after parents' birth (+15 years sanity).
  for (const par of person.parents ?? []) {
    const pp = personById(all, par);
    const y = pp?.birthDate ? firstYear(pp.birthDate) : undefined;
    if (y !== undefined) {
      birthMin = narrow(birthMin, y + 15, 'min');
      explanations.push(`Born ≥15y after parent ${pp?.name ?? par} (b. ${y}).`);
    }
  }
  // Spouse overlap (weak): only fills gaps the parents/own data leave open.
  for (const sp of person.spouses ?? []) {
    const ps = personById(all, sp);
    const y = ps?.birthDate ? firstYear(ps.birthDate) : undefined;
    if (y !== undefined) {
      if (birthMin === undefined) birthMin = y - 40;
      if (birthMax === undefined) birthMax = y + 40;
    }
  }
  // Bounds buried in free text: "died before 1952", "window 1930–1952".
  // Only trusted on Death/Birth record notes + the person's own notes.
  const noteTexts: string[] = [...(person.notes ?? [])];
  for (const rec of person.records ?? []) {
    if (/death|birth/i.test(rec.type)) noteTexts.push(rec.notes || '');
  }
  for (const nt of noteTexts) {
    const w = nt.match(/[Ww]indow[^.\n]{0,12}(\d{4})\s*[\u2013\u2014-]\s*(\d{4})/);
    if (w) {
      if (/death|morte|deceased|died|morta|morto/i.test(nt)) {
        deathMin = narrow(deathMin, Number(w[1]), 'min');
        deathMax = narrow(deathMax, Number(w[2]), 'max');
        explanations.push(`Record notes give a death window ${w[1]}–${w[2]}.`);
      } else if (/birth|nascita|born|nato|nata/i.test(nt)) {
        birthMin = narrow(birthMin, Number(w[1]), 'min');
        birthMax = narrow(birthMax, Number(w[2]), 'max');
        explanations.push(`Record notes give a birth window ${w[1]}–${w[2]}.`);
      }
      continue;
    }
    const b = nt.match(/(?:died\s+before|deceased\s+(?:by|before)|prior\s+to|before)\s+[^.\n]{0,24}?(\d{4})/i);
    if (b && /death|morte|deceased|died|morta|morto|death record/i.test(nt)) {
      deathMax = narrow(deathMax, Number(b[1]), 'max');
      explanations.push(`Recorded as deceased before ${b[1]}.`);
    }
  }
  return { birthMin, birthMax, deathMin, deathMax, explanations: [...new Set(explanations)] };
}

/** Italian number words for age clues in transcriptions. */
const IT_NUMBERS: Record<string, number> = {
  uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8,
  nove: 9, dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14,
  quindici: 15, sedici: 16, diciassette: 17, diciasette: 17, diciotto: 18,
  diciannove: 19, diciannove_: 19, venti: 20, ventuno: 21, ventidue: 22,
  ventitre: 23, ventitré: 23, ventiquattro: 24, venticinque: 25, ventisei: 26,
  ventisette: 27, ventotto: 28, ventinove: 29, trenta: 30, trentuno: 31,
  quaranta: 40, cinquanta: 50, sessanta: 60, settanta: 70, ottanta: 80,
};

/**
 * "di anni diciotto" + a record year → birth estimate.
 * Returns a bound + explanation, or null.
 */
export function ageClue(line: string, recordYear?: number): { min: number; max: number; explanation: string } | null {
  const m = line.toLowerCase().match(/ann[oi]\s+([a-zà-ÿ]+|\d{1,3})/);
  if (!m) return null;
  const raw = m[1];
  const age = /^\d+$/.test(raw) ? Number(raw) : IT_NUMBERS[raw];
  if (!age || age > 110) return null;
  const years = extractYears(line);
  const refYear = years.length > 0 ? years[0] : recordYear;
  if (!refYear) return null;
  return {
    min: refYear - age - 1,
    max: refYear - age + 1,
    explanation: `Aged ${age} in ${refYear} (“${line.slice(0, 80)}”).`,
  };
}

function fmtRange(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return min === max ? `${min}` : `${min}–${max}`;
  if (min !== undefined) return `from ${min}`;
  if (max !== undefined) return `by ${max}`;
  return 'unknown';
}

function fmtRangeIt(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return min === max ? `${min}` : `tra il ${min} e il ${max}`;
  if (min !== undefined) return `dopo il ${min}`;
  if (max !== undefined) return `entro il ${max}`;
  return '[data sconosciuta]';
}

/** Ranked place candidates: own places + spouse/children birthplaces. */
export function rankPlaces(person: Person, all: Person[]): TriPlace[] {
  const map = new Map<string, { count: number; via: Set<string> }>();
  const add = (place: string | undefined, via: string) => {
    const p = (place || '').trim();
    if (!p || /unknown/i.test(p)) return;
    const cur = map.get(p) ?? { count: 0, via: new Set<string>() };
    cur.count += 1;
    cur.via.add(via);
    map.set(p, cur);
  };
  add(person.birthPlace, 'own birth');
  add(person.deathPlace, 'own death');
  add(person.burialPlace, 'own burial');
  for (const r of person.residences ?? []) add(r, 'own residence');
  for (const sp of person.spouses ?? []) {
    const ps = personById(all, sp);
    add(ps?.birthPlace, `spouse ${ps?.name ?? sp} birth`);
  }
  for (const ch of person.children ?? []) {
    const pc = personById(all, ch);
    add(pc?.birthPlace, `child ${pc?.name ?? ch} birth`);
  }
  return [...map.entries()]
    .map(([place, v]) => ({ place, count: v.count, via: [...v.via] }))
    .sort((a, b) => b.count - a.count || a.place.localeCompare(b.place));
}

/**
 * Transcription lines across all records that mention the person's surname.
 * Lines containing a year sort first (they carry datable facts).
 */
export function findSnippets(records: TriRecordLike[], personName: string, cap = 12): TriSnippet[] {
  const surname = triSurname(personName).toLowerCase();
  if (surname.length < 3) return [];
  const out: TriSnippet[] = [];
  for (const r of records) {
    for (const rawLine of r.body.split('\n')) {
      const line = rawLine.trim().replace(/^-\s*/, '').replace(/^en:\s*/i, '');
      if (line.length < 4 || !line.toLowerCase().includes(surname)) continue;
      if (/^#{1,3}\s/.test(line)) continue;
      out.push({ recordId: r.id, recordType: r.type, line: line.slice(0, 220) });
      if (out.length >= cap * 3) break;
    }
    if (out.length >= cap * 3) break;
  }
  const withYear = out.filter((s) => /\d{4}/.test(s.line));
  const withoutYear = out.filter((s) => !/\d{4}/.test(s.line));
  return [...withYear, ...withoutYear].slice(0, cap);
}

/** Act references (atto n. X) found in notes + snippets. */
export function attoRefs(texts: string[]): string[] {
  const found: string[] = [];
  for (const t of texts) {
    for (const m of (t || '').matchAll(/atto[^.\n]{0,10}(?:n\.?|no\.?|nr\.?|num\.?|numero)?\s*(\d{1,4})/gi)) {
      const ref = `atto n. ${m[1]}`;
      if (!found.includes(ref)) found.push(ref);
    }
  }
  return found.slice(0, 6);
}

const TARGET_IT: Record<TriTarget, { cosa: string; tipo: string }> = {
  birth: { cosa: "l'estratto per riassunto dell'atto di nascita", tipo: 'nascita' },
  marriage: { cosa: "l'estratto per riassunto dell'atto di matrimonio", tipo: 'matrimonio' },
  death: { cosa: "l'estratto per riassunto dell'atto di morte", tipo: 'morte' },
};

export interface SearchPack {
  italian: string;
  english: string;
  office: string;
}

/** Draft request skeleton with every known slot filled, gaps bracketed. */
export function buildSearchPack(
  person: Person,
  all: Person[],
  target: TriTarget,
  windows: TriWindow,
  places: TriPlace[],
  refs: string[]
): SearchPack {
  const t = TARGET_IT[target];
  const topPlace = places[0]?.place ?? '[luogo da verificare]';
  const office = topPlace.startsWith('[') ? '[Comune da verificare]' : `Comune di ${topPlace.split(',')[0].trim()}`;
  const spouseNames = (person.spouses ?? []).map((id) => displayName(all, id)).join(', ') || '[coniuge sconosciuto]';
  const parentNames =
    (person.parents ?? []).map((id) => displayName(all, id)).join(' e ') || '[genitori sconosciuti]';
  const childBits = (person.children ?? [])
    .map((id) => {
      const c = personById(all, id);
      const y = c?.birthDate ? extractYears(c.birthDate)[0] : undefined;
      return `${c?.name ?? id}${y ? ` (n. ${y}${c?.birthPlace ? `, ${c.birthPlace}` : ''})` : ''}`;
    })
    .join('; ');
  const birthBit = `nascita: ${fmtRangeIt(windows.birthMin, windows.birthMax)}`;
  const deathBit = `morte: ${fmtRangeIt(windows.deathMin, windows.deathMax)}`;
  const dateBit = target === 'birth' ? birthBit : target === 'death' ? deathBit : `${birthBit}; ${deathBit}`;

  const italian = [
    `Spett.le Ufficio dello Stato Civile — ${office},`,
    ``,
    `richiedo ${t.cosa} di ${person.name} (${dateBit}).`,
    ``,
    `Elementi in mio possesso: coniuge ${spouseNames}; genitori ${parentNames}${childBits ? `; figli: ${childBits}` : ''}.`,
    refs.length > 0 ? `Riferimenti già noti: ${refs.join(', ')}.` : ``,
    `Se l'atto non fosse reperibile, Vi pregherei di indicarmi dove altro potrei cercare.`,
    ``,
    `Ringraziando per l'attenzione, porgo cordiali saluti.`,
  ]
    .filter((l) => l !== null)
    .join('\n');

  const english = [
    `Requesting ${target} extract for ${person.name} (${dateBit}).`,
    `Top place to request from: ${office}.`,
    refs.length > 0 ? `Known references: ${refs.join(', ')}.` : `No act references known yet.`,
  ].join(' ');

  return { italian, english, office };
}
