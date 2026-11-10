/**
 * Clue finder — things the data already implies but nobody has acted on.
 *
 * Three kinds of clue, all computed from the tree and the filed records
 * (no network, no AI, nothing is changed):
 *
 *  1. CHECKS    — places where the tree contradicts itself (a child born
 *                 before a parent, a link that only goes one way, an id
 *                 that points at nobody). Each is either a typo to fix or a
 *                 sign that two different people have been merged.
 *  2. CITED     — acts that the notes and transcriptions mention by number
 *                 and year but that are not filed as a record. Each one is
 *                 a document that is known to exist and can be asked for.
 *  3. OPENINGS  — where the next discovery is most likely: ancestors whose
 *                 parents are unknown (and which act would name them), and
 *                 long gaps between known siblings.
 *
 * Rule: a check only fires when even the most generous reading of the dates
 * is impossible. "c. 1850" is treated as 1848–1852, "before 1889" as an
 * upper bound only, and anything without a year is left alone.
 */
import type { Person } from '@/types';
import { parseDateBound } from './triangulate.ts';

export type ClueSeverity = 'error' | 'warning' | 'info';

export interface Clue {
  key: string;
  kind:
    | 'dangling-link' | 'one-way-link' | 'impossible-dates' | 'parent-age'
    | 'too-many-parents' | 'possible-duplicate'
    | 'cited-act' | 'brick-wall' | 'sibling-gap';
  severity: ClueSeverity;
  title: string;
  detail: string;
  /** What to do about it, in one sentence. */
  action: string;
  personIds: string[];
  /** Verbatim source text for cited acts. */
  snippet?: string;
}

interface Bound { min?: number; max?: number }

const birthOf = (p: Person): Bound => parseDateBound(p.birthDate);
const deathOf = (p: Person): Bound => parseDateBound(p.deathDate);
const fmt = (b: Bound) =>
  b.min !== undefined && b.max !== undefined
    ? (b.min === b.max ? `${b.min}` : `${b.min}–${b.max}`)
    : b.min !== undefined ? `after ${b.min}` : b.max !== undefined ? `before ${b.max}` : 'unknown';

// ---------------------------------------------------------------------------
// 1. Checks
// ---------------------------------------------------------------------------

export function consistencyChecks(people: Person[]): Clue[] {
  const out: Clue[] = [];
  const byId = new Map(people.map((p) => [p.id, p]));
  const name = (id: string) => byId.get(id)?.name ?? id;

  for (const p of people) {
    const parents = p.parents ?? [], children = p.children ?? [], spouses = p.spouses ?? [];

    // Ids that point at nobody
    for (const [field, ids] of [['parent', parents], ['child', children], ['spouse', spouses]] as const) {
      for (const id of ids) {
        if (!byId.has(id)) {
          out.push({
            key: `dangling|${p.id}|${field}|${id}`, kind: 'dangling-link', severity: 'warning',
            title: `${p.name} lists a ${field} who isn't in the tree`,
            detail: `The ${field} id "${id}" doesn't match any person. They were probably renamed or removed.`,
            action: `Either add "${id}" back as a person or remove the link from ${p.name}.`,
            personIds: [p.id],
          });
        }
      }
    }

    // Links that only go one way
    for (const cid of children) {
      const c = byId.get(cid);
      if (c && !(c.parents ?? []).includes(p.id)) {
        out.push({
          key: `oneway|child|${p.id}|${cid}`, kind: 'one-way-link', severity: 'warning',
          title: `${p.name} → ${c.name}: link only goes one way`,
          detail: `${p.name} lists ${c.name} as a child, but ${c.name} doesn't list ${p.name} as a parent. Trees and reports that walk upward will miss this link.`,
          action: `Add ${p.name} to ${c.name}'s parents — or remove the child link if it was a mistake.`,
          personIds: [p.id, cid],
        });
      }
    }
    for (const pid of parents) {
      const par = byId.get(pid);
      if (par && !(par.children ?? []).includes(p.id)) {
        out.push({
          key: `oneway|parent|${p.id}|${pid}`, kind: 'one-way-link', severity: 'warning',
          title: `${p.name} → ${par.name}: link only goes one way`,
          detail: `${p.name} lists ${par.name} as a parent, but ${par.name} doesn't list ${p.name} as a child.`,
          action: `Add ${p.name} to ${par.name}'s children — or remove the parent link if it was a mistake.`,
          personIds: [p.id, pid],
        });
      }
    }
    for (const sid of spouses) {
      const s = byId.get(sid);
      if (s && !(s.spouses ?? []).includes(p.id) && p.id < sid) {
        out.push({
          key: `oneway|spouse|${p.id}|${sid}`, kind: 'one-way-link', severity: 'warning',
          title: `${p.name} ↔ ${s.name}: marriage recorded on one side only`,
          detail: `${p.name} lists ${s.name} as a spouse, but not the other way round.`,
          action: `Add ${p.name} to ${s.name}'s spouses.`,
          personIds: [p.id, sid],
        });
      }
    }

    // More than two parents, or two of the same sex
    const knownParents = parents.map((id) => byId.get(id)).filter((x): x is Person => !!x);
    if (knownParents.length > 2) {
      out.push({
        key: `parents|${p.id}`, kind: 'too-many-parents', severity: 'error',
        title: `${p.name} has ${knownParents.length} parents`,
        detail: `Listed: ${knownParents.map((x) => x.name).join(', ')}. One is probably a candidate that was never removed.`,
        action: 'Keep the two supported by a record; move any other to the notes as a ruled-out candidate.',
        personIds: [p.id, ...knownParents.map((x) => x.id)],
      });
    } else if (knownParents.length === 2 && knownParents[0].gender === knownParents[1].gender) {
      out.push({
        key: `parents-sex|${p.id}`, kind: 'too-many-parents', severity: 'warning',
        title: `${p.name}'s two parents are both recorded as ${knownParents[0].gender === 'M' ? 'male' : 'female'}`,
        detail: `${knownParents[0].name} and ${knownParents[1].name}. One gender field is probably wrong.`,
        action: 'Correct the gender on whichever is wrong.',
        personIds: [p.id, knownParents[0].id, knownParents[1].id],
      });
    }

    // Died before born / impossibly long life
    const b = birthOf(p), d = deathOf(p);
    if (b.min !== undefined && d.max !== undefined && d.max < b.min) {
      out.push({
        key: `dates|${p.id}`, kind: 'impossible-dates', severity: 'error',
        title: `${p.name}: death is before birth`,
        detail: `Born ${fmt(b)} ("${p.birthDate}"), died ${fmt(d)} ("${p.deathDate}").`,
        action: 'One of the two dates is wrong, or two people with the same name have been merged.',
        personIds: [p.id],
      });
    } else if (b.max !== undefined && d.min !== undefined && d.min - b.max > 105) {
      out.push({
        key: `age|${p.id}`, kind: 'impossible-dates', severity: 'warning',
        title: `${p.name}: lived at least ${d.min - b.max} years`,
        detail: `Born ${fmt(b)} ("${p.birthDate}"), died ${fmt(d)} ("${p.deathDate}").`,
        action: 'Check both dates against their source — a lifespan over 105 years usually means a misread year or a same-name relative.',
        personIds: [p.id],
      });
    }

    // Parent / child ages (only when impossible under every reading)
    for (const par of knownParents) {
      const pb = birthOf(par), pd = deathOf(par);
      if (b.max !== undefined && pb.min !== undefined && b.max - pb.min < 13) {
        out.push({
          key: `page|young|${p.id}|${par.id}`, kind: 'parent-age', severity: 'error',
          title: `${par.name} would be under 13 at ${p.name}'s birth`,
          detail: `${par.name} born ${fmt(pb)}; ${p.name} born ${fmt(b)}.`,
          action: 'One birth year is wrong, or this is a same-name relative of the real parent (a grandparent, uncle or aunt).',
          personIds: [p.id, par.id],
        });
      }
      const limit = par.gender === 'F' ? 52 : 80;
      if (b.min !== undefined && pb.max !== undefined && b.min - pb.max > limit) {
        out.push({
          key: `page|old|${p.id}|${par.id}`, kind: 'parent-age', severity: 'warning',
          title: `${par.name} would be over ${limit} at ${p.name}'s birth`,
          detail: `${par.name} born ${fmt(pb)}; ${p.name} born ${fmt(b)}.`,
          action: par.gender === 'F'
            ? 'Check whether this is really the mother, or a grandmother of the same name.'
            : 'Check whether a generation is missing between them.',
          personIds: [p.id, par.id],
        });
      }
      const grace = par.gender === 'F' ? 0 : 1; // a father can die up to ~9 months before the birth
      if (b.min !== undefined && pd.max !== undefined && b.min - pd.max > grace) {
        out.push({
          key: `page|dead|${p.id}|${par.id}`, kind: 'parent-age', severity: 'error',
          title: `${p.name} was born after ${par.name} died`,
          detail: `${par.name} died ${fmt(pd)} ("${par.deathDate}"); ${p.name} born ${fmt(b)} ("${p.birthDate}").`,
          action: 'One date is wrong, or the parent link belongs to a different person of the same name.',
          personIds: [p.id, par.id],
        });
      }
    }
  }

  // Same name + overlapping birth window = possibly the same person entered twice
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/\(.*?\)|["“”'].*?["“”']/g, '').replace(/\b(sr|jr|senior|junior)\b\.?/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  const groups = new Map<string, Person[]>();
  for (const p of people) {
    const k = norm(p.name).split(' ').sort().join(' ');
    if (k.split(' ').length < 2) continue;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  for (const g of groups.values()) {
    for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {
      const a = g[i], c = g[j];
      const ba = birthOf(a), bc = birthOf(c);
      const disjoint = ba.max !== undefined && bc.min !== undefined && ba.max + 5 < bc.min
        || bc.max !== undefined && ba.min !== undefined && bc.max + 5 < ba.min;
      // Parent and child sharing a name is normal, not a duplicate
      const related = (a.children ?? []).includes(c.id) || (c.children ?? []).includes(a.id)
        || (a.parents ?? []).includes(c.id) || (c.parents ?? []).includes(a.id);
      const declared = [a, c].some((x) => /not the same|the other|different person|distinct from/i.test(`${x.name} ${(x.notes ?? []).join(' ')}`));
      if (disjoint || related || declared) continue;
      out.push({
        key: `dup|${a.id}|${c.id}`, kind: 'possible-duplicate', severity: 'info',
        title: `${a.name} and ${c.name} may be the same person`,
        detail: `Same name; births ${fmt(ba)} and ${fmt(bc)}. Ids: ${a.id}, ${c.id}.`,
        action: 'If they are different people, say so in both sets of notes (as done for the two Egidio Emmis). If the same, merge them.',
        personIds: [a.id, c.id],
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. Acts cited in the text but not on file
// ---------------------------------------------------------------------------

export interface FiledAct { id: string; atto: string; year: string; type: string; comune: string; people?: string[] }
export interface TextSource { personId?: string; recordId?: string; label: string; text: string }

export type ActKind = 'birth' | 'marriage' | 'death' | 'unknown';

export interface CitedAct {
  number: string;
  year?: number;
  kind: ActKind;
  snippet: string;
}

const MONTH_AFTER = /^\s*(?:gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic|jan|may|jun|jul|aug|sep|oct|dec)[a-z]*\b/i;

const KIND_WORDS: [ActKind, RegExp][] = [
  ['birth', /\b(nati|nascit[ae]|birth|born|naissance|battesim\w*|baptis\w*)\b/i],
  ['marriage', /\b(matrimon\w*|marriage|married|sposi|mariage|pubblicazion\w*|banns)\b/i],
  ['death', /\b(mort[ei]|death|died|deceased|decess\w*|d[eé]c[eè]s)\b/i],
];

/** Find "atto n. 59" style references with the nearest year and register type. */
export function findCitedActs(text: string): CitedAct[] {
  const out: CitedAct[] = [];
  if (!text) return out;
  const re = /\batt[oi]\b[^.\n\d]{0,14}?(?:n\.?|no\.?|nr\.?|num\.?|numero|№)?\s*(\d{1,4})\b/gi;
  for (const m of text.matchAll(re)) {
    const number = String(Number(m[1]));
    const at = m.index ?? 0;
    // Skip "atto 59/1900"-style second halves and plain years mistaken for numbers
    if (Number(number) === 0 || (Number(number) >= 1500 && Number(number) <= 2100)) continue;
    const start = Math.max(0, at - 90), end = Math.min(text.length, at + m[0].length + 90);
    const window = text.slice(start, end);
    const local = at - start;
    // "atto 8 Oct 1911" / "dell'atto: 26 gennaio" is a date, not act number 8 / 26
    const tail = text.slice(at + m[0].length, at + m[0].length + 14);
    if (MONTH_AFTER.test(tail)) continue;

    // Which year does the act belong to? In order of trust:
    //   0. written with it: "atto 110/1879"
    //   1. immediately before: "04/11/1900 atto № 59", "(1868 atto 141)"
    //   2. attached to a register word nearby: "Nati 1877, atto n. 58"
    //   3. the first year after the number: "atto 12, 23 April 1911"
    //   4. the nearest year shortly before
    // Years from 2020 on are when the research was done, not the act's year.
    const years = [...window.matchAll(/\b(1[5-9]\d{2}|20[01]\d)\b/g)]
      .map((y) => ({ y: Number(y[1]), at: y.index ?? 0 }));
    const matchEnd = local + m[0].length;
    let year: number | undefined;
    const slash = tail.match(/^\s*\/\s*(1[5-9]\d{2}|20[01]\d)\b/);
    if (slash) year = Number(slash[1]);
    if (year === undefined) {
      const just = years.filter((y) => y.at < local && local - (y.at + 4) <= 3).pop();
      if (just) year = just.y;
    }
    if (year === undefined) {
      const reg = [...window.matchAll(/\b(?:nati|nascit[ae]|matrimoni[o]?|mort[ei]|pubblicazioni)\s+(?:di\s+)?(1[5-9]\d{2}|20[01]\d)\b/gi)]
        .map((r) => ({ y: Number(r[1]), dist: Math.abs((r.index ?? 0) - local) }))
        .filter((r) => r.dist <= 60)
        .sort((x, y) => x.dist - y.dist)[0];
      if (reg) year = reg.y;
    }
    if (year === undefined) year = years.find((y) => y.at >= matchEnd && y.at - matchEnd <= 45)?.y;
    if (year === undefined) {
      const before = years.filter((y) => y.at < local).pop();
      if (before && local - before.at <= 60) year = before.y;
    }
    // Nearest register word
    let kind: ActKind = 'unknown', kbest = Infinity;
    for (const [k, kre] of KIND_WORDS) {
      for (const w of window.matchAll(new RegExp(kre.source, 'gi'))) {
        const dist = Math.abs((w.index ?? 0) - local);
        if (dist < kbest) { kbest = dist; kind = k; }
      }
    }
    out.push({ number, year, kind, snippet: window.replace(/\s+/g, ' ').trim() });
  }
  return out;
}

const kindOfType = (type: string, id: string): ActKind => {
  const t = `${type} ${id}`.toLowerCase();
  if (/birth|nascita|baptis/.test(t)) return 'birth';
  if (/marriage|matrimonio/.test(t)) return 'marriage';
  if (/death|morte/.test(t)) return 'death';
  return 'unknown';
};

export function citedButNotFiled(sources: TextSource[], filed: FiledAct[], people: Person[]): Clue[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  const filedKeys = new Set<string>();
  for (const f of filed) {
    const n = String(Number((f.atto || '').replace(/\D/g, '') || '0'));
    if (n === '0') continue;
    filedKeys.add(`${n}|${f.year}`);
    filedKeys.add(`${n}|${f.year}|${kindOfType(f.type, f.id)}`);
  }
  // Act numbers already filed for each person / record: a citation of the same
  // number in that person's own notes is the filed act, whatever year we guess.
  const numsByPerson = new Map<string, Set<string>>();
  const numByRecord = new Map<string, string>();
  for (const f of filed) {
    const n = String(Number((f.atto || '').replace(/\D/g, '') || '0'));
    if (n === '0') continue;
    numByRecord.set(f.id, n);
    for (const pid of f.people ?? []) numsByPerson.set(pid, new Set([...(numsByPerson.get(pid) ?? []), n]));
  }
  const seen = new Map<string, Clue>();
  for (const src of sources) {
    for (const c of findCitedActs(src.text)) {
      if (src.personId && numsByPerson.get(src.personId)?.has(c.number)) continue;
      if (src.recordId && numByRecord.get(src.recordId) === c.number) continue;
      if (!c.year) continue; // without a year it can't be requested or matched
      if (filedKeys.has(`${c.number}|${c.year}`)) continue;
      // Acts noted only to say they belong to someone else aren't worth fetching
      if (/ruled out|excluded|different person|not our|not the same|unrelated/i.test(c.snippet)) continue;
      const key = `cited|${c.number}|${c.year}`;
      const kindWord = c.kind === 'unknown' ? 'Act' : `${c.kind[0].toUpperCase()}${c.kind.slice(1)} act`;
      const existing = seen.get(key);
      if (existing) {
        if (src.personId && !existing.personIds.includes(src.personId)) existing.personIds.push(src.personId);
        continue;
      }
      const who = src.personId ? byId.get(src.personId)?.name : undefined;
      const seenOnline = /\b(found|antenati|familysearch|dgs|ark:)\b/i.test(c.snippet);
      seen.set(key, {
        key, kind: 'cited-act', severity: 'info',
        title: `${kindWord} n. ${c.number} of ${c.year} — ${seenOnline ? 'seen, not filed' : 'cited, not on file'}`,
        detail: `Mentioned in ${src.label}${who && !src.label.includes(who) ? ` (${who})` : ''}. No filed record has this act number and year.`,
        action: seenOnline
          ? 'The notes say this act was found. Save its image to the inbox and file it, so it goes through transcribe → check → FamilySearch like the others.'
          : 'A known act that can be requested by number and year — the cheapest kind of request, since no search is needed.',
        personIds: src.personId ? [src.personId] : [],
        snippet: c.snippet,
      });
    }
  }
  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// 3. Openings
// ---------------------------------------------------------------------------

/** Ancestors (of rootId) with no parents recorded, nearest generation first. */
export function brickWalls(people: Person[], rootId: string): Clue[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  const out: Clue[] = [];
  const seen = new Set<string>();
  let frontier = [rootId];
  let depth = 0;
  while (frontier.length && depth < 12) {
    const next: string[] = [];
    for (const id of frontier) {
      const p = byId.get(id);
      if (!p || seen.has(id)) continue;
      seen.add(id);
      const parents = (p.parents ?? []).filter((x) => byId.has(x));
      if (parents.length === 0 && depth > 0) {
        const hasRecord = (re: RegExp) => (p.records ?? []).some((r) => re.test(r.type) && /^found/i.test(r.status));
        const lookFor = !hasRecord(/death/i) ? 'death act' : !hasRecord(/marriage/i) ? 'marriage act' : !hasRecord(/birth|baptis/i) ? 'birth or baptism act' : null;
        const b = birthOf(p);
        out.push({
          key: `wall|${p.id}`, kind: 'brick-wall', severity: 'info',
          title: `${p.name} — parents unknown`,
          detail: `${depth} generation${depth === 1 ? '' : 's'} above Daniele, ${p.line} line.${b.min !== undefined || b.max !== undefined ? ` Born ${fmt(b)}${p.birthPlace && !/unknown/i.test(p.birthPlace) ? `, ${p.birthPlace.split(',')[0]}` : ''}.` : ''}`,
          action: lookFor
            ? `Their ${lookFor} isn't on file and would normally name both parents — that is the document to look for.`
            : 'Birth, marriage and death are all on file. Re-read them for the parents\' names ("di" / "fu" + father, mother\'s maiden name).',
          personIds: [p.id],
        });
      } else if (parents.length === 1 && depth > 0) {
        const have = byId.get(parents[0])!;
        out.push({
          key: `wall1|${p.id}`, kind: 'brick-wall', severity: 'info',
          title: `${p.name} — ${have.gender === 'M' ? 'mother' : 'father'} unknown`,
          detail: `${depth} generation${depth === 1 ? '' : 's'} above Daniele, ${p.line} line. Only ${have.name} is linked.`,
          action: `${p.name}'s birth, marriage or death act should name the other parent.`,
          personIds: [p.id],
        });
      }
      next.push(...parents);
    }
    frontier = next;
    depth++;
  }
  return out;
}

/** Couples whose known children have a gap of 6+ years between births. */
export function siblingGaps(people: Person[], minGap = 6): Clue[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  const out: Clue[] = [];
  const doneCouples = new Set<string>();
  for (const p of people) {
    const kids = (p.children ?? []).map((id) => byId.get(id)).filter((x): x is Person => !!x);
    if (kids.length < 2) continue;
    // Group by the full parent set so half-siblings aren't mixed
    const byCouple = new Map<string, Person[]>();
    for (const k of kids) {
      const key = [...(k.parents ?? [])].sort().join('+');
      byCouple.set(key, [...(byCouple.get(key) ?? []), k]);
    }
    for (const [couple, group] of byCouple) {
      if (doneCouples.has(couple) || group.length < 2) continue;
      doneCouples.add(couple);
      const dated = group
        .map((k) => ({ k, b: birthOf(k) }))
        .filter((x) => x.b.min !== undefined && x.b.max !== undefined && x.b.max - x.b.min <= 4)
        .sort((a, c) => a.b.min! - c.b.min!);
      for (let i = 1; i < dated.length; i++) {
        const gap = dated[i].b.min! - dated[i - 1].b.max!;
        if (gap >= minGap) {
          const parentNames = couple.split('+').map((id) => byId.get(id)?.name ?? id).join(' × ');
          const place = dated[i].k.birthPlace || dated[i - 1].k.birthPlace || '';
          out.push({
            key: `gap|${couple}|${dated[i - 1].k.id}|${dated[i].k.id}`, kind: 'sibling-gap', severity: 'info',
            title: `${gap}-year gap between children of ${parentNames}`,
            detail: `${dated[i - 1].k.name} (${fmt(dated[i - 1].b)}) then ${dated[i].k.name} (${fmt(dated[i].b)}). Families of the period usually had a child every 2–3 years.`,
            action: `Check the birth indexes${place ? ` for ${place.split(',')[0]}` : ''} for ${dated[i - 1].b.max! + 1}–${dated[i].b.min! - 1} under the father's surname — and the death indexes, since infants who died young are the usual explanation.`,
            personIds: [...couple.split('+').filter((id) => byId.has(id)), dated[i - 1].k.id, dated[i].k.id],
          });
        }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Everything together
// ---------------------------------------------------------------------------

/** Every free-text field on a person, labelled, for citation scanning. */
export function personTextSources(people: Person[]): TextSource[] {
  const out: TextSource[] = [];
  for (const p of people) {
    const add = (label: string, text?: string) => { if (text) out.push({ personId: p.id, label: `${p.name}'s ${label}`, text }); };
    for (const n of p.notes ?? []) add('notes', n);
    for (const r of p.records ?? []) add(`${r.type} entry`, r.notes);
    add('research status', p.researchStatus?.details);
    for (const s of p.researchStatus?.nextSteps ?? []) add('next steps', s);
  }
  return out;
}

export interface ClueReport {
  checks: Clue[];
  cited: Clue[];
  walls: Clue[];
  gaps: Clue[];
}

export function buildClueReport(
  people: Person[], rootId: string, filed: FiledAct[], extraSources: TextSource[] = [],
): ClueReport {
  const rank: Record<ClueSeverity, number> = { error: 0, warning: 1, info: 2 };
  return {
    checks: consistencyChecks(people).sort((a, b) => rank[a.severity] - rank[b.severity]),
    cited: citedButNotFiled([...personTextSources(people), ...extraSources], filed, people),
    walls: brickWalls(people, rootId),
    gaps: siblingGaps(people),
  };
}
