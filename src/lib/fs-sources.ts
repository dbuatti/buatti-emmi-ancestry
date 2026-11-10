/**
 * FamilySearch Sources → app mirror check.
 *
 * Daniele pastes a person's FS Sources list; we parse entries, match them
 * against the app's record files, and report what's missing so each gap can
 * become a record stub with one click. No FS API involved (unavailable) —
 * same structured-paste trick as the Details compare.
 *
 * Pure functions (no React) — unit-checked with node.
 */

export type FsEventType =
  | 'birth'
  | 'baptism'
  | 'marriage'
  | 'death'
  | 'burial'
  | 'census'
  | 'military'
  | 'other';

export interface FsSourceEntry {
  title: string;
  years: number[];
  eventType: FsEventType;
  urls: string[];
  place: string;
  raw: string;
}

export interface AppRecordLike {
  id: string;
  type: string;
  year: string;
  date: string;
}

const TYPE_PATTERNS: [RegExp, FsEventType][] = [
  [/battesim|baptis/i, 'baptism'],
  [/matrimoni|marriage|wedding|nozze|spos/i, 'marriage'],
  [/ Morti\b|morte\b|death|decedut|burial|sepolt|funeral/i, 'death'],
  [/nascit|birth|battesim/i, 'birth'],
  [/censimento|census|stato delle anime|population/i, 'census'],
  [/leva|militare|military|ruolo matricolare|draft|enlist/i, 'military'],
  [/seppell|tumulaz/i, 'burial'],
];

const PLACE_STOP = new Set([
  'italy', 'italia', 'australia', 'register', 'registration', 'registers',
  'index', 'indexes', 'collection', 'collections', 'record', 'records',
  'act', 'acts', 'atto', 'atti', 'stato', 'civile', 'civil', 'church',
  'parish', 'diocese', 'archive', 'archives', 'familysearch', 'family',
  'search', 'catalog', 'film', 'images', 'image', 'library',
]);

function guessEvent(title: string): FsEventType {
  for (const [re, t] of TYPE_PATTERNS) {
    if (re.test(title)) return t;
  }
  return 'other';
}

function guessPlace(title: string): string {
  const segs = title.split(/[,—–\-–|]/).map((s) => s.trim());
  for (const seg of segs) {
    const clean = seg.replace(/\(.*?\)/g, '').trim();
    if (clean.length < 4 || /\d/.test(clean)) continue;
    const words = clean.split(/\s+/).filter((w) => w.length > 2);
    if (words.length === 0) continue;
    if (words.every((w) => PLACE_STOP.has(w.toLowerCase()))) continue;
    // Drop leading country + trailing collection words.
    return clean;
  }
  return '';
}

/** Split a pasted Sources list into entries (blank-line separated). */
export function parseFsSources(pasted: string): FsSourceEntry[] {
  const out: FsSourceEntry[] = [];
  const chunks = pasted
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) continue;
    const title = lines[0].replace(/^\d+[.)]\s*/, '').slice(0, 200);
    const urls = [...chunk.matchAll(/https?:\/\/[^\s)]+/g)].map((m) => m[0]);
    const years = [
      ...new Set(
        [...chunk.matchAll(/\b(1[5-9]\d{2}|20[0-2]\d)\b/g)].map((m) => Number(m[1]))
      ),
    ].sort((a, b) => a - b);
    // Skip non-source junk (nav chrome, "Add source" buttons).
    if (/^(add source|attach|detach|edit|delete|share|print)$/i.test(title)) continue;
    out.push({
      title,
      years,
      eventType: guessEvent(chunk),
      urls,
      place: guessPlace(title),
      raw: chunk.slice(0, 500),
    });
  }
  return out;
}

export type FsMatchStatus = 'matched' | 'possible' | 'missing';

export interface FsMatch {
  entry: FsSourceEntry;
  status: FsMatchStatus;
  recordId?: string;
  reason: string;
}

function recordYears(r: AppRecordLike): number[] {
  const out: number[] = [];
  for (const m of `${r.year} ${r.date}`.matchAll(/\b(1[5-9]\d{2}|20[0-2]\d)\b/g)) {
    out.push(Number(m[1]));
  }
  return [...new Set(out)];
}

const APP_TYPE_TO_EVENT: [RegExp, FsEventType][] = [
  [/bapt/i, 'baptism'],
  [/marri/i, 'marriage'],
  [/death|mort/i, 'death'],
  [/burial/i, 'burial'],
  [/birth|nascita/i, 'birth'],
  [/population/i, 'census'],
  [/migration|natura|passenger|alien/i, 'other'],
  [/military|pow/i, 'military'],
  [/student|school|diploma|university/i, 'other'],
];

/**
 * Match one FS entry against the person's app records.
 * matched: same event type + shared year. possible: same event type only.
 * Everything else is missing (the mirror gap).
 */
export function matchSource(
  entry: FsSourceEntry,
  records: AppRecordLike[]
): FsMatch {
  if (entry.eventType === 'other') {
    return { entry, status: 'missing', reason: 'Could not tell the record type — review by hand.' };
  }
  const sameType = records.filter((r) => {
    const t = (r.type || '').toLowerCase();
    return APP_TYPE_TO_EVENT.some(
      ([re, ev]) => ev === entry.eventType && re.test(t)
    );
  });
  if (sameType.length === 0) {
    return { entry, status: 'missing', reason: `No ${entry.eventType} record in the app.` };
  }
  for (const r of sameType) {
    const ry = recordYears(r);
    if (entry.years.some((y) => ry.includes(y))) {
      return { entry, status: 'matched', recordId: r.id, reason: `${entry.eventType} ${entry.years.join('/')} matches ${r.id}.` };
    }
  }
  const first = sameType[0];
  return {
    entry,
    status: 'possible',
    recordId: first.id,
    reason: `Same type (${entry.eventType}) but years differ — check whether ${first.id} already covers it.`,
  };
}
