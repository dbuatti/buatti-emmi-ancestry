/**
 * Tree hints: what a record's transcription implies for the family tree.
 *
 * Role-gated and conservative by design:
 * - Only family-role lines trigger (Padre/Madre/Sposo/Sposa/Marito/Moglie/
 *   Vedovo/a, Coniuge + English equivalents). Officers, witnesses and
 *   notaries NEVER produce hints.
 * - Nothing is applied: hints are proposals with copy-able instructions.
 *   Only brand-new person pages can be created in-app (sidecar addPerson);
 *   links and facts on existing people go through OpenCode in chat.
 *
 * Pure functions (no React) — unit-checked with node.
 */
import type { Person } from '@/types';

export type HintRole = 'father' | 'mother' | 'spouse';
export type HintKind = 'link-parent' | 'link-spouse' | 'new-person';

export interface TreeHint {
  /** Stable key for dismiss persistence. */
  key: string;
  kind: HintKind;
  role: HintRole;
  subjectId: string;
  subjectName: string;
  /** Display name as read, Given Surname order. */
  name: string;
  surname: string;
  given: string;
  /** True when the surname came from the subject (single given name in the act). */
  surnameInferred: boolean;
  /** Existing person matches (token-subset), best first. Empty = truly new. */
  options: string[];
  /** Already-linked person id when the slot is taken by someone else. */
  conflictsWith?: string;
  lineLabel: string;
  lineValue: string;
  recordId: string;
  reason: string;
  suggestedId: string;
  suggestedGender: 'M' | 'F';
}

export interface HintLine {
  label: string;
  value: string;
}

const TITLES = new Set([
  'fu', 'late', 'sig', 'sig.', 'signor', 'signora', 'dott', 'dott.', 'don', 'don.',
  'cav', 'cav.', 'di', 'de', 'della', 'del', 'e', 'ed', 'da', 'dal', 'in',
  'residente', 'resident', 'domiciliato', 'nato', 'nata', 'vedovo', 'vedova',
  'marito', 'moglie', 'sposo', 'sposa', 'sposi', 'coniuge',
]);

function tokensOf(raw: string): string[] {
  return (raw || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/["“”']/g, ' ')
    .split(/[\s,;]+/)
    .map((t) => t.replace(/^[.(°·\-–—]+|[.(°·\-–—]+$/g, ''))
    .filter((t) => /^[A-Za-zà-ÿ]{3,}/.test(t) && !TITLES.has(t.toLowerCase()));
}

function personTokens(p: Person): string[] {
  return (p.name || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/["“”']/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/\.+$/, '').toLowerCase())
    .filter((t) => t.length > 2 && !/^(sr|jr|ii|iii|iv|senior|junior)$/.test(t));
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function roleOf(label: string, value?: string): HintRole | null {
  const t = label.toLowerCase();
  if (/padre|father|patern/.test(t)) return 'father';
  if (/madre|mother|matern/.test(t)) return 'mother';
  if (/vedov|sposo|sposa|marito|moglie|coniuge|spouse|husband|wife|widow/.test(t)) return 'spouse';
  // "Stato civile: vedova di X" carries the role in the value, not the label.
  if (/stato/i.test(t) && value && /vedov|coniuge|marito|moglie|sposo|sposa/i.test(value)) return 'spouse';
  return null;
}

/**
 * Parse a family-role value into { surname, given }.
 * Acts write Surname Givenname ("Rosati Virginia"); a lone given name
 * ("Antonio") inherits the subject's surname (flagged as inferred).
 */
function parseRoleName(
  value: string,
  subjectSurname: string
): { surname: string; given: string; inferred: boolean } | null {
  // First segment only — everything after a comma is residence/notes.
  const head = (value || '').split(/[,;]/)[0];
  const toks = tokensOf(head);
  if (toks.length === 0) return null;
  if (toks.length === 1) {
    if (!subjectSurname) return null;
    return { surname: subjectSurname, given: toks[0], inferred: true };
  }
  // Act order: surname first.
  const [surname, ...given] = toks;
  // Guard: a single-letter initial or obvious fragment isn't a name.
  if (surname.length < 3 || given.length === 0) return null;
  return { surname, given: given.join(' '), inferred: false };
}

function surnameOfPerson(all: Person[], name: string): string {
  void all;
  const toks = name
    .replace(/\([^)]*\)/g, ' ')
    .replace(/["“”']/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/\.+$/, ''))
    .filter((t) => t.length > 2 && !/^(sr|jr|ii|iii|iv|senior|junior)$/i.test(t));
  return toks.length > 0 ? toks[toks.length - 1] : '';
}

/**
 * Build tree hints for one record.
 * @param subjectIds record subjects (frontMatter.people) — hints anchor on the first.
 */
export function buildHints(
  recordId: string,
  subjectIds: string[],
  lines: HintLine[],
  all: Person[]
): TreeHint[] {
  const hints: TreeHint[] = [];
  if (subjectIds.length === 0) return hints;
  const subject = all.find((p) => p.id === subjectIds[0]);
  if (!subject) return hints;
  const subjectSurname = surnameOfPerson(all, subject.name);
  const existingIds = new Set(all.map((p) => p.id));

  const slotFilled = (role: HintRole): string | undefined => {
    if (role === 'spouse') {
      return (subject.spouses ?? []).find((id) => existingIds.has(id));
    }
    const wantGender = role === 'father' ? 'M' : 'F';
    return (subject.parents ?? []).find((id) => all.find((p) => p.id === id)?.gender === wantGender);
  };

  for (const line of lines) {
    const role = roleOf(line.label, line.value);
    if (!role) continue;
    const parsed = parseRoleName(line.value, subjectSurname);
    if (!parsed) continue;
    const { surname, given, inferred } = parsed;
    const display = `${given} ${surname}`;
    const wantTokens = [surname.toLowerCase(), ...given.toLowerCase().split(/\s+/)];

    // Candidate existing people: name token set covers all hint tokens.
    const options = all
      .filter((p) => {
        const pt = personTokens(p);
        return wantTokens.every((t) => pt.includes(t));
      })
      .map((p) => p.id)
      .slice(0, 4);

    const base = {
      subjectId: subject.id,
      subjectName: subject.name,
      role,
      name: display,
      surname,
      given,
      surnameInferred: inferred,
      options,
      lineLabel: line.label,
      lineValue: line.value,
      recordId,
    };

    if (role === 'spouse') {
      const linkedId = slotFilled('spouse');
      const hit = options.find((id) => (subject.spouses ?? []).includes(id));
      if (hit) continue; // already linked — nothing to propose
      if (options.length > 0) {
        const other = linkedId;
        hints.push({
          ...base,
          key: `${recordId}|spouse|${slug(display)}`,
          kind: 'link-spouse',
          reason: other
            ? `Differs from the linked spouse (${nameOf(all, other)}).`
            : `${subject.name} has no spouse linked.`,
          conflictsWith: other,
          suggestedId: uniqueId(display, existingIds),
          suggestedGender: subject.gender === 'M' ? 'F' : 'M',
        });
      } else if (linkedId) {
        hints.push({
          ...base,
          key: `${recordId}|new-spouse|${slug(display)}`,
          kind: 'new-person',
          reason: `No person page exists for this name, and it differs from the linked spouse (${nameOf(all, linkedId)}) — possible second marriage, or a misreading.`,
          conflictsWith: linkedId,
          suggestedId: uniqueId(display, existingIds),
          suggestedGender: subject.gender === 'M' ? 'F' : 'M',
        });
      } else {
        hints.push({
          ...base,
          key: `${recordId}|new-spouse|${slug(display)}`,
          kind: 'new-person',
          reason: `No person page exists for this name, and ${subject.name} has no spouse linked.`,
          suggestedId: uniqueId(display, existingIds),
          suggestedGender: subject.gender === 'M' ? 'F' : 'M',
        });
      }
      continue;
    }

    // father / mother
    const linkedId = slotFilled(role);
    const hit = options.find((id) =>
      (subject.parents ?? []).includes(id)
    );
    if (hit) continue; // already linked — nothing to propose
    if (options.length > 0) {
      hints.push({
        ...base,
        key: `${recordId}|${role}|${slug(display)}`,
        kind: 'link-parent',
        reason: linkedId
          ? `Differs from the linked ${role} (${nameOf(all, linkedId)}).`
          : `${subject.name} has no ${role} linked.`,
        conflictsWith: linkedId,
        suggestedId: uniqueId(display, existingIds),
        suggestedGender: role === 'father' ? 'M' : 'F',
      });
    } else if (linkedId) {
      hints.push({
        ...base,
        key: `${recordId}|new-${role}|${slug(display)}`,
        kind: 'new-person',
        reason: `No person page exists for this name, and it differs from the linked ${role} (${nameOf(all, linkedId)}) — possible misreading, or a second ${role === 'father' ? 'father-figure' : 'mother-figure'}.`,
        conflictsWith: linkedId,
        suggestedId: uniqueId(display, existingIds),
        suggestedGender: role === 'father' ? 'M' : 'F',
      });
    } else {
      hints.push({
        ...base,
        key: `${recordId}|new-${role}|${slug(display)}`,
        kind: 'new-person',
        reason: `No person page exists for this name, and ${subject.name} has no ${role} linked.`,
        suggestedId: uniqueId(display, existingIds),
        suggestedGender: role === 'father' ? 'M' : 'F',
      });
    }
  }
  return hints;
}

function nameOf(all: Person[], id: string): string {
  return all.find((p) => p.id === id)?.name ?? id;
}

function uniqueId(display: string, existing: Set<string>): string {
  const id = slug(display);
  if (!existing.has(id)) return id;
  let n = 2;
  while (existing.has(`${id}-${n}`)) n++;
  return `${id}-${n}`;
}

/** One-line instruction Daniele pastes to OpenCode to apply a link hint. */
export function linkInstruction(h: TreeHint, personId?: string): string {
  const target = personId ?? h.options[0];
  const rel = h.role === 'spouse' ? 'spouse' : h.role === 'father' ? 'father' : 'mother';
  return (
    `Link ${target} as ${rel} of ${h.subjectId} ` +
    `(source: record ${h.recordId}, line "${h.lineLabel}: ${h.lineValue}"). ` +
    `Add the record as evidence on both people.`
  );
}
