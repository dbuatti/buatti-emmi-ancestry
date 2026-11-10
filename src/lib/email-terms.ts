/**
 * Key-term extraction for correspondence lookups.
 *
 * The old card searched imported mail for the entire "where it is" sentence
 * verbatim, which can never match anything. These helpers break a task down
 * into short searchable terms (years, act numbers, surnames, office tokens)
 * so each one can be looked up with a LIKE query and the hits merged.
 */

export interface EmailKeyTerms {
  /** Full years mentioned, e.g. ["1948"] */
  years: string[];
  /** Act-number variants, e.g. ["atto 34", "n. 34"] */
  attos: string[];
  /** Person name variants, e.g. ["Emmi", "Gregorio Emmi"] */
  names: string[];
  /** Office/place tokens, e.g. ["fiumefreddo", "sicilia"] */
  places: string[];
}

/** Tokens that carry no search value (mailbox names, TLDs, generic offices). */
const STOPWORDS = new Set([
  'comune', 'comuni', 'ufficio', 'uffici', 'stato', 'civile', 'anagrafe',
  'servizio', 'servizi', 'protocollo', 'pec', 'mail', 'email', 'posta',
  'gmail', 'hotmail', 'libero', 'aruba', 'cert', 'sicilia', 'it', 'com',
  'org', 'net', 'eu', 'di', 'del', 'della', 'dei', 'delle', 'al', 'allo',
  'alla', 'dal', 'dallo', 'dalla', 'nel', 'nello', 'nella', 'sul', 'sullo',
  'sulla', 'per', 'con', 'che', 'una', 'uno', 'delle', 'degli', 'lo', 'la',
  'il', 'i', 'gli', 'le', 'da', 'in', 'a', 'e', 'ed', 'o', 'od', 'ct', 'me',
  'ap', 'via', 'piazza', 'n', 'nr', 'atto', 'parte', 'serie', 'anno',
]);

const NAME_SUFFIXES = new Set(['sr', 'sr.', 'jr', 'jr.', 'ii', 'iii', 'iv', 'senior', 'junior']);

/** Name tokens: no nicknames, no generational suffixes, no stubs. */
function nameTokens(personName: string): string[] {
  const clean = (personName || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/["“”']/g, ' ')
    .trim();
  return clean
    .split(/\s+/)
    .map((t) => t.replace(/\.+$/, ''))
    .filter((t) => t.length > 2 && !NAME_SUFFIXES.has(t.toLowerCase()));
}

/**
 * Best-effort surname from a display name like
 * 'Bruna Lilia Chiappini ("Nonna Lilia")' -> 'Chiappini',
 * 'Alfredo Buatti Sr.' -> 'Buatti'.
 * Strips parenthetical nicknames/notes, returns the last token.
 */
export function surnameOf(personName: string): string {
  const tokens = nameTokens(personName);
  return tokens.length > 0 ? tokens[tokens.length - 1] : '';
}

/** Given names (all tokens except the surname), for full-name search. */
export function givenNamesOf(personName: string): string[] {
  const surname = surnameOf(personName);
  return nameTokens(personName).filter((t) => t.toLowerCase() !== surname.toLowerCase());
}

function uniq(list: string[], cap: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = item.toLowerCase();
    if (!seen.has(key) && key.length > 0) {
      seen.add(key);
      out.push(item);
      if (out.length >= cap) break;
    }
  }
  return out;
}

/**
 * Break task text + person name into searchable terms.
 * `texts` are searched for years/atto numbers (whereItIs, note, office);
 * `personName` contributes surname + full name.
 */
export function extractKeyTerms(texts: (string | undefined)[], personName: string): EmailKeyTerms {
  const combined = texts.filter(Boolean).join('\n') as string;

  // Years 1800 up to last year (the record's year, not the request year —
  // searching the current year matches nearly every imported email).
  const thisYear = new Date().getFullYear();
  const years = uniq(
    [...combined.matchAll(/\b((?:18|19|20)\d{2})\b/g)]
      .map((m) => m[1])
      .filter((y) => Number(y) < thisYear),
    4
  );

  // Act numbers: "atto ... n. 34", "n. 34", "atto 34"
  const attoNums = uniq(
    [
      ...[...combined.matchAll(/atto[^.\d\n]{0,16}(?:n\.?|no\.?|nr\.?|num\.?|numero)?\s*(\d{1,4})/gi)].map((m) => m[1]),
      ...[...combined.matchAll(/(?:^|[\s(])n\.\s*(\d{1,4})/gi)].map((m) => m[1]),
    ],
    3
  );
  const attos: string[] = [];
  for (const n of attoNums) {
    attos.push(`atto ${n}`, `n. ${n}`);
  }

  // Names
  const surname = surnameOf(personName);
  const given = givenNamesOf(personName);
  const names: string[] = [];
  if (surname) names.push(surname);
  if (surname && given.length > 0) names.push(`${given[0]} ${surname}`);

  // Places: office tokens (email addresses, domains, "Comune di X")
  const placeTokens: string[] = [];
  const emailMatch = combined.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
  for (const email of emailMatch) {
    for (const tok of email.toLowerCase().split(/[^a-zà-ÿ]+/)) {
      if (tok.length > 3 && !STOPWORDS.has(tok) && !/^\d+$/.test(tok)) placeTokens.push(tok);
    }
  }
  const comuneMatch = combined.match(/comune\s+di\s+([A-Za-zà-ÿ' ]+?)(?:\s*[—,–\-(\n]|\s+—|$)/gi) || [];
  for (const m of comuneMatch) {
    const name = m.replace(/comune\s+di\s+/i, '').trim().toLowerCase();
    for (const tok of name.split(/[^a-zà-ÿ]+/)) {
      if (tok.length > 3 && !STOPWORDS.has(tok)) placeTokens.push(tok);
    }
  }
  const places = uniq(placeTokens, 4);

  return { years, attos: uniq(attos, 6), names, places };
}

/** Search terms for a record page's "mentioned in email" section.
 * Act numbers + linked surnames only — years and places match too broadly
 * on their own. Capped so the panel fires a handful of LIKE queries. */
export function recordTerms(
  fm: { atto?: string; year?: string; date?: string },
  surnames: string[]
): string[] {
  const terms: string[] = [];
  const attoMatch = (fm.atto || '').match(/\d{1,4}/);
  if (attoMatch) {
    terms.push(`atto ${attoMatch[0]}`, `n. ${attoMatch[0]}`);
  }
  for (const s of surnames) {
    const t = (s || '').trim();
    if (t.length > 2) terms.push(t);
  }
  return uniq(terms, 6);
}

/** Flatten terms to an ordered search list (most specific first). */
export function flattenTerms(terms: EmailKeyTerms): string[] {
  return uniq([...terms.attos, ...terms.names, ...terms.places, ...terms.years], 10);
}
