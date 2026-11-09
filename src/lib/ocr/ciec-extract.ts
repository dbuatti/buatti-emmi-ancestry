/**
 * Parser for Italian "estratto" certificates issued on the multilingual
 * CIEC forms (Vienna Convention, 8 Sept 1976):
 *   Formula A = birth, Formula B = marriage, Formula C = death.
 *
 * These forms are NOT "label: value" text. Each box has an Italian label, a
 * French label underneath, then the value on the French line, e.g.
 *
 *   COGNOME
 *   NOM EMMI
 *
 * and parent boxes put father + mother on ONE line ("NOM EMMI RAITI").
 * Around 70% of the page is printed boilerplate in ten languages, which a
 * generic quality checker scores as "low" line after line. This module:
 *   1. finds the real fields (atto no., date/place, names, parents, notes,
 *      issue date, officer) in raw OCR or copy-pasted PDF text,
 *   2. marks every printed boilerplate line so it is ignored,
 *   3. gives each field a confidence plus a reason when it is uncertain,
 *   4. builds the record.md "## Transcription" block (Italian + English).
 *
 * Pure functions, no DOM, no dependencies — safe in the browser and in Node.
 * It never guesses: anything it cannot read comes back as a flagged problem.
 */

export type CiecForm = 'birth' | 'marriage' | 'death' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low';

export interface CiecField {
  key: string;
  /** Italian label as used in record.md */
  label: string;
  /** English label as used in record.md */
  labelEn: string;
  value: string;
  confidence: Confidence;
  /** Why the confidence is not high (shown to the user) */
  note?: string;
  /**
   * Every reading still possible when the text is ambiguous. May contain
   * "?" wildcards ("27/10/????"). crossCheck() intersects these.
   */
  candidates?: string[];
}

export interface CiecResult {
  isCiecForm: boolean;
  form: CiecForm;
  fields: CiecField[];
  /** Lines recognised as printed form text (excluded from scoring) */
  boilerplateLines: number;
  /** Lines that are neither a field nor boilerplate — worth a look */
  unexplainedLines: string[];
  /** 0–100, based only on the fields this form type should have */
  score: number;
  problems: string[];
}

// ---------------------------------------------------------------------------
// Text normalisation
// ---------------------------------------------------------------------------

/** Upper-case, strip accents, collapse whitespace. For matching only. */
function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`´]/g, "'")
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** "0 3 / 0 2 / 1 8 7 0" → "03/02/1870"; also fixes O→0, l/I→1 inside digit runs. */
export function normaliseDigits(s: string): string {
  // Join spaced single digits: "1 8 7 0" → "1870"
  let out = s.replace(/\b(\d)(?: (?=\d\b))/g, '$1');
  out = out.replace(/(\d) ?\/ ?(\d)/g, '$1/$2');
  // Common OCR letter↔digit confusions, only when sandwiched by digits
  out = out.replace(/(?<=\d)[Oo](?=\d)/g, '0').replace(/(?<=\d)[lI|](?=\d)/g, '1');
  return out;
}

const DATE_RE = /\b(\d{2})\/(\d{2})\/(\d{4})\b/;

function isPlausibleDate(d: string, m: string, y: string, minYear = 1700, maxYear = 2100): boolean {
  const day = Number(d), mon = Number(m), yr = Number(y);
  return day >= 1 && day <= 31 && mon >= 1 && mon <= 12 && yr >= minYear && yr <= maxYear;
}

/** Find a dd/mm/yyyy date, also from 8 run-together digits ("27102026"). */
function findDate(text: string, minYear: number, maxYear: number): { value: string; exact: boolean } | null {
  const t = normaliseDigits(text);
  const m = t.match(DATE_RE);
  if (m && isPlausibleDate(m[1], m[2], m[3], minYear, maxYear)) {
    return { value: `${m[1]}/${m[2]}/${m[3]}`, exact: true };
  }
  // Separators lost by OCR: keep digits only and look for ddmmyyyy
  const digits = t.replace(/\D/g, '');
  for (let i = 0; i + 8 <= digits.length; i++) {
    const d = digits.slice(i, i + 2), mo = digits.slice(i + 2, i + 4), y = digits.slice(i + 4, i + 8);
    if (isPlausibleDate(d, mo, y, minYear, maxYear)) return { value: `${d}/${mo}/${y}`, exact: false };
  }
  return null;
}

/**
 * OCR often reads a "/" as "1" ("27/10/2026" → "271012026"). Return EVERY
 * plausible modern date in a run of digits, trying each separator position
 * with and without a "1". More than one result = genuinely ambiguous.
 */
export function slashAsOneCandidates(digits: string, minYear = 1990, maxYear = 2100): string[] {
  const out = new Set<string>();
  for (let i = 0; i + 8 <= digits.length; i++) {
    const dd = digits.slice(i, i + 2);
    for (const s1 of [0, 1]) {
      if (s1 && digits[i + 2] !== '1') continue;
      const mm = digits.slice(i + 2 + s1, i + 4 + s1);
      for (const s2 of [0, 1]) {
        const at = i + 4 + s1;
        if (s2 && digits[at] !== '1') continue;
        const yyyy = digits.slice(at + s2, at + s2 + 4);
        if (yyyy.length === 4 && isPlausibleDate(dd, mm, yyyy, minYear, maxYear)) out.add(`${dd}/${mm}/${yyyy}`);
      }
    }
  }
  return [...out];
}

/** "27/10220 2 0…" → "27/10/????": the day/month survived, the year did not. */
function partialDate(line: string): string | null {
  const m = normaliseDigits(line).match(/\b(\d{2})\/(\d{2})(?!\/\d{4})/);
  if (!m || !isPlausibleDate(m[1], m[2], '2000')) return null;
  return `${m[1]}/${m[2]}/????`;
}

function matchesPattern(value: string, pattern: string): boolean {
  return value.length === pattern.length && [...pattern].every((c, i) => c === '?' || c === value[i]);
}

// ---------------------------------------------------------------------------
// Boilerplate: printed text that is identical on every CIEC form
// ---------------------------------------------------------------------------

const BOILERPLATE_PATTERNS: RegExp[] = [
  /^FORMUL[AE] [ABC]$/,
  /^[\d |;:.,_\-—–]*$/, // stray box numbers / rules
  /SYMBOLE|ZEICHEN|SIMBOL|ISARETLER/,
  /^-? ?(JO|MO|AN|M|F|MAR|SC|DIV|A|D|DM|DF)\b ?[:-]?.*\/.*\//, // symbol key rows
  /\/.*\/.*\//, // any line with 3+ slashes = multilingual list
  /CONVENTION|CONVENZIONE|CONVENIO|UBEREINKOMMEN|OVEREENKOMST|CONVENCAO|KONVENCIJE|SOZLESME|VIYANADA|ΣΥΜΒΑΣ/,
  /^IN RELAZIONE AL DISPOSTO/,
  /^(GLI ATTI DESTINATI|ULTIMA RESIDENZA DEI GENITORI|LUOGO DI ORIGINE IN SVIZZERA|COMPLETATI DAI SEGUENTI DATI)/,
  /^N\.B\.?$/,
  /^«?AI SENSI DEGLI ARTT/,
  /^- ?(LE ISCRIZIONI|LE DATE|IL NOME DI OGNI|II NOME DI OGNI|I SIMBOLI|SE LA FORMULAZIONE|L'AGGIUNTA)/,
  /^(LIZZATA PER|CIFRE, L'ANNO|STATO NEL QUALE|GNOME DEL CONIUGE)/,
  /^(IL PRESENTE CERTIFICATO|PRIVATI GESTORI)/,
  /^(CASAMENTO|EVLENME|FIZITKA|IPTAL|MORTE DEL MARITO|DELLA MOGLIE|RODJENIH|IDARESI|PECAT|OP 8 SEPTEMBER)/,
  /^(TRAPEZ|TPANETYS|EVIOS|EYYPAAI|ENTO °|GEBOORTEAKTE|YERI VE|KENING|DO ASSENTO|XPOVO|VIZIO DELLO STATO CIVILE \/)/,
  /^(STAAT|VORNAMEN|NAME \/|GESCHLECHT|VATER|MUTTER|ANDERE ANGABEN|TAG DER|TAG UND ORT|AUSZUG)/,
  /^\d{1,2} (STAAT|GESCHLECHT|VATER|MUTTER)/,
  // Italian / French box labels (the labels themselves are not values)
  /^(\d{1,2} )?(STATO|ETAT|ETAT:?)$/,
  /^SERVICE DE L'ETAT CIVIL DE$/,
  /^EXTRAIT DE L'ACTE DE (NAISSANCE|MARIAGE|DECES) N\.?$/,
  /^(\d{1,2} )?(DATA E LUOGO DI (NASCITA|MATRIMONIO|MORTE)|DATE ET LIEU DE (NAISSANCE|MARIAGE|DECES))$/,
  /^(\d{1,2} )?(COGNOME|PRENOMI|SESSO|PADRE|MADRE|PERE|MERE|GIORNO|MESE|ANNO|GIORNO MESE|SESSO PADRE MADRE)( \S{1,3})?$/,
  /^(\d{1,2} )?(ALTRE ENUNCIAZIONI DELL'ATTO|AUTRES ENONCIATIONS DE L'ACTE)$/,
  /^(N )?(DATA DI RILASCIO|FIRMA - BOLLO|DATE DE DELIVRANCE,?|SIGNATURE, SCEAU)\b/,
  /^(MARITO|MOGLIE|MARI|FEMME|SPOSO|SPOSA)$/,
];

function isBoilerplate(line: string): boolean {
  const n = norm(line);
  if (!n) return true;
  return BOILERPLATE_PATTERNS.some((re) => re.test(n));
}

// ---------------------------------------------------------------------------
// Field extraction
// ---------------------------------------------------------------------------

function detectForm(text: string): CiecForm {
  const n = norm(text);
  if (/ATTO DI NASCITA|ACTE DE NAISSANCE|FORMUL[AE] A\b/.test(n)) return 'birth';
  if (/ATTO DI MATRIMONIO|ACTE DE MARIAGE|FORMUL[AE] B\b/.test(n)) return 'marriage';
  if (/ATTO DI MORTE|ACTE DE DECES|FORMUL[AE] C\b/.test(n)) return 'death';
  return 'unknown';
}

/** Value after a French box label on the same line: "NOM EMMI i" → "EMMI". */
function valuesAfter(lines: string[], labelRe: RegExp): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const n = norm(raw).replace(/^\d{1,2} \|?\\?/, '').replace(/^\d{1,2} /, '');
    const m = n.match(labelRe);
    if (m) {
      const rest = n.slice((m.index ?? 0) + m[0].length).trim();
      if (rest) out.push(rest);
    }
  }
  return out;
}

/** Drop OCR crumbs: trailing 1–2 char lowercase-ish junk and lone symbols. */
function cleanTokens(value: string): { tokens: string[]; dropped: string[]; lastRun: string[] } {
  const tokens: string[] = [];
  const dropped: string[] = [];
  let lastRun: string[] = [];
  for (const tok of value.split(' ')) {
    const t = tok.replace(/[|\\;:,.]+$/g, '').replace(/^[|\\;:,.]+/g, '');
    if (!t) continue;
    // Real name tokens are ≥2 letters (allow apostrophe: D'AGATA)
    if (/^[A-Z][A-Z']+$/.test(t) && t.length >= 2) { tokens.push(t); lastRun.push(t); }
    else { dropped.push(tok); lastRun = []; }
  }
  return { tokens, dropped, lastRun };
}

function field(
  key: string, label: string, labelEn: string, value: string,
  confidence: Confidence, note?: string,
): CiecField {
  return { key, label, labelEn, value, confidence, ...(note ? { note } : {}) };
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
}

const KIND_IT: Record<CiecForm, string> = {
  birth: 'NASCITA', marriage: 'MATRIMONIO', death: 'MORTE', unknown: '',
};

export function parseCiecExtract(rawText: string): CiecResult {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const text = lines.join('\n');
  const nText = norm(text);
  const form = detectForm(text);
  const isCiecForm = form !== 'unknown' && /STATO CIVILE|ETAT CIVIL/.test(nText);
  const fields: CiecField[] = [];
  const problems: string[] = [];
  const used = new Set<number>();

  const markUsed = (re: RegExp) => lines.forEach((l, i) => { if (re.test(norm(l))) used.add(i); });

  // --- Comune -------------------------------------------------------------
  {
    const i = lines.findIndex((l) => /SERVIZIO DELLO STATO CIVILE/.test(norm(l)));
    const rest = i >= 0 ? norm(lines[i]).replace(/^.*SERVIZIO DELLO STATO CIVILE (?:DI |DEL COMUNE DI )?/, '') : '';
    const name = cleanTokens(rest).tokens.join(' ');
    if (name) {
      fields.push(field('comune', 'Servizio dello Stato Civile', 'Civil registration office', name, 'high'));
      used.add(i);
    } else problems.push('Comune not found (look for "SERVIZIO DELLO STATO CIVILE …").');
  }

  // --- Atto number --------------------------------------------------------
  {
    const rawLine = lines.find((l) => /ATTO DI (NASCITA|MATRIMONIO|MORTE)/.test(norm(l))) ?? '';
    const after = normaliseDigits(rawLine.replace(/^.*?ATTO DI \S+\s*N\.?\s*/i, ''));
    const m = rawLine ? after.match(/^(\d+)\s*(.*)$/) : null;
    if (m) {
      const digits = m[1];
      const tail = m[2].trim();
      const label = `Estratto dell'atto di ${(KIND_IT[form] || 'nascita').toLowerCase()} n.`;
      // A stray stroke after the number ("31 l") or a final 1 followed by
      // punctuation ("311.") is the classic misread on these forms.
      const strayAfter = tail.length > 0 && !/^\.?$/.test(tail);
      const maybeExtra1 = digits.length >= 3 && digits.endsWith('1') && tail === '.';
      if (strayAfter || maybeExtra1) {
        const alt = maybeExtra1 ? digits.slice(0, -1) : `${digits}1`;
        fields.push(field('atto', label, 'Extract of act no.', digits, 'low',
          `Read as "N. ${rawLine.replace(/^.*ATTO DI \S+\s*N\.?\s*/i, '').trim()}" — could be ${digits} or ${alt} (stray mark next to the number). Check the image.`));
      } else {
        fields.push(field('atto', label, 'Extract of act no.', digits, 'high'));
      }
      lines.forEach((l, i) => { if (/ATTO DI (NASCITA|MATRIMONIO|MORTE)/.test(norm(l))) used.add(i); });
    } else problems.push('Act number not found.');
  }

  // --- Event date + place -------------------------------------------------
  {
    const idx = lines.findIndex((l) => /DATE ET LIEU DE|LINGUAGLOSSA|^\s*[0-9 ]+\/[0-9 ]+\/[0-9 ]+/.test(norm(l)) && findDate(l, 1500, 2100));
    if (idx >= 0) {
      const line = normaliseDigits(lines[idx]);
      const d = findDate(line, 1500, 2100)!;
      const after = norm(line.slice(line.search(/\d{2}\/\d{2}\/\d{4}/) + 10)).replace(/^[^A-Z]+/, '');
      const place = cleanTokens(after).tokens.join(' ');
      const label = form === 'marriage' ? 'Data e luogo di matrimonio' : form === 'death' ? 'Data e luogo di morte' : 'Data e luogo di nascita';
      const labelEn = form === 'marriage' ? 'Date and place of marriage' : form === 'death' ? 'Date and place of death' : 'Date and place of birth';
      fields.push(field('eventDate', label, labelEn, `${d.value}${place ? ' ' + place : ''}`,
        place ? 'high' : 'medium', place ? undefined : 'Place not found on the date line.'));
      used.add(idx);
    } else problems.push('Event date not found.');
  }

  // --- Names --------------------------------------------------------------
  // French label lines carry the values: NOM <child> / NOM <father> <mother>
  const noms = valuesAfter(lines, /^NOM\b/);
  const prenoms = valuesAfter(lines, /^PRENOMS\b/);
  lines.forEach((l, i) => { if (/^(\d{1,2} )?(NOM|PRENOMS)\b/.test(norm(l))) used.add(i); });

  if (form === 'birth' || form === 'death') {
    const sur = noms[0] ? cleanTokens(noms[0]) : null;
    const giv = prenoms[0] ? cleanTokens(prenoms[0]) : null;
    if (sur?.tokens.length) {
      fields.push(field('surname', 'Cognome', 'Surname', sur.tokens.join(' '),
        sur.dropped.length ? 'medium' : 'high',
        sur.dropped.length ? `Ignored OCR marks: ${sur.dropped.join(' ')}` : undefined));
    } else problems.push('Surname not found (line starting "NOM").');
    if (giv?.tokens.length) {
      fields.push(field('givenNames', 'Prenomi', 'First names', giv.tokens.join(' '),
        giv.dropped.length ? 'medium' : 'high'));
    } else problems.push('First names not found (line starting "PRÉNOMS").');

    // Parents: second NOM / PRENOMS lines = "<father> <mother>"
    const pSur = noms[1] ? cleanTokens(noms[1]).tokens : [];
    const pGiv = prenoms[1] ? cleanTokens(prenoms[1]).tokens : [];
    const split = (toks: string[]) => toks.length === 2 ? [toks[0], toks[1]] : null;
    const s = split(pSur), g = split(pGiv);
    if (s && g) {
      fields.push(field('father', 'Padre (cognome, prenomi)', 'Father (surname, first names)', `${s[0]}, ${g[0]}`, 'high'));
      fields.push(field('mother', 'Madre (cognome, prenomi)', 'Mother (surname, first names)', `${s[1]}, ${g[1]}`, 'high'));
    } else if (pSur.length || pGiv.length) {
      const note = `Father and mother share one line ("${pSur.join(' ')}" / "${pGiv.join(' ')}") and it can't be split safely. Multi-word names (DE ANGELIS, MARIA ROSA) need checking by eye.`;
      fields.push(field('father', 'Padre (cognome, prenomi)', 'Father (surname, first names)', `${pSur.join(' ')} / ${pGiv.join(' ')}`, 'low', note));
      fields.push(field('mother', 'Madre (cognome, prenomi)', 'Mother (surname, first names)', '?', 'low', note));
    } else problems.push('Parents not found.');
  }

  // --- Sex ----------------------------------------------------------------
  {
    const m = nText.match(/\b(MASCHILE|FEMMINILE)\b/);
    if (m && form !== 'marriage') {
      fields.push(field('sex', 'Sesso', 'Sex', m[1].toLowerCase(), 'high'));
      lines.forEach((l, i) => { if (/SEXE|SESSO/.test(norm(l)) && /MASCHILE|FEMMINILE/.test(norm(l))) used.add(i); });
    } else if (form === 'birth') problems.push('Sex not found.');
  }

  // --- Annotations (Altre enunciazioni) -----------------------------------
  {
    const start = lines.findIndex((l) => /AUTRES ENONCIATIONS|ALTRE ENUNCIAZIONI/.test(norm(l)));
    if (start >= 0) {
      const body: string[] = [];
      for (let i = start + 1; i < lines.length; i++) {
        const n = norm(lines[i]);
        if (/^(\d{1,2} )?(AUTRES ENONCIATIONS|ALTRE ENUNCIAZIONI)/.test(n)) { used.add(i); continue; }
        if (/^(N\.B\.?|IN RELAZIONE AL DISPOSTO|\d{1,2}$|DATA DI RILASCIO|FIRMA)/.test(n)) break;
        if (/^[|\\ È]{1,4}$/.test(lines[i]) || n.length <= 2) { used.add(i); continue; }
        body.push(lines[i]);
        used.add(i);
      }
      // Rejoin wrapped lines; strip OCR crumbs like a trailing "Did"
      let joined = body.join(' ').replace(/\s+/g, ' ').trim();
      const crumb = joined.match(/\.\s+([A-Za-z]{1,3})$/);
      let note: string | undefined;
      if (crumb) { joined = joined.slice(0, -crumb[1].length).trim(); note = `Dropped trailing OCR mark "${crumb[1]}".`; }
      if (joined) fields.push(field('annotations', "Altre enunciazioni dell'atto", 'Other particulars of the act', joined, note ? 'medium' : 'high', note));
    }
  }

  // --- Issue date + officer ----------------------------------------------
  {
    // Issue dates sit in the stamp box AFTER the "DATA DI RILASCIO" label.
    // Never look above it: the Swiss-treaty line (16/11/1966) is right there.
    const s = lines.findIndex((l) => /DATA DI RILASCIO|DATE DE DELIVRANCE/.test(norm(l)));
    const window = s >= 0 ? lines.slice(s, s + 8) : [];
    let issuedField: CiecField | null = null;
    const L = 'Data di rilascio', LE = 'Date of issue';
    for (const l of window) {
      const n = normaliseDigits(l);
      const m = n.match(DATE_RE);
      if (m && isPlausibleDate(m[1], m[2], m[3], 1990, 2100)) {
        issuedField = field('issueDate', L, LE, `${m[1]}/${m[2]}/${m[3]}`, 'high');
        break;
      }
      // A surviving "dd/mm" beats any digit-soup guess on the same line
      const partial = partialDate(l);
      if (partial) {
        issuedField = { ...field('issueDate', L, LE, partial, 'low',
          `Only day/month readable in the stamp ("${l.trim()}"); year lost. Check the image.`), candidates: [partial] };
        break;
      }
      const cands = slashAsOneCandidates(n.replace(/\D/g, ''));
      if (cands.length === 1) {
        issuedField = { ...field('issueDate', L, LE, cands[0], 'medium',
          'Separators lost in the stamp area; rebuilt from the digits. Check the image.'), candidates: cands };
        break;
      }
      if (cands.length > 1) {
        issuedField = { ...field('issueDate', L, LE, '?', 'low',
          `Stamp area garbled ("${l.trim()}") — could be ${cands.join(' or ')}. Check the image.`), candidates: cands };
        break;
      }
    }
    if (issuedField) fields.push(issuedField);
    else problems.push('Issue date not found (stamp area unreadable).');

    const offIdx = lines.findIndex((l) => /STATO CIVILE DELEGATO|UFFICIALE (DELLO|DI) STATO CIVILE/.test(norm(l)));
    if (offIdx >= 0) {
      used.add(offIdx);
      for (let i = offIdx + 1; i < Math.min(lines.length, offIdx + 3); i++) {
        // Signature/stamp scribble often precedes the typed name: take the
        // last unbroken run of name-like words on the line.
        const { lastRun, dropped } = cleanTokens(norm(lines[i]));
        if (lastRun.length >= 2 && lastRun.length <= 4 && !/SYMBOL|SIMBOL/.test(lastRun.join(' '))) {
          const extra = dropped.length || lastRun.length !== cleanTokens(norm(lines[i])).tokens.length;
          fields.push(field('officer', 'Ufficiale', 'Official', lastRun.join(' '),
            extra ? 'medium' : 'high', extra ? 'Ignored signature/stamp marks before the name.' : undefined));
          used.add(i);
          break;
        }
      }
    }
    if (!fields.some((f) => f.key === 'officer')) problems.push('Issuing officer not found.');
  }

  // --- Classify every remaining line -------------------------------------
  let boilerplateLines = 0;
  const unexplainedLines: string[] = [];
  lines.forEach((l, i) => {
    if (used.has(i)) return;
    if (isBoilerplate(l)) boilerplateLines++;
    else unexplainedLines.push(l);
  });

  const score = rescore({ isCiecForm, form, fields, boilerplateLines, unexplainedLines, score: 0, problems });

  return { isCiecForm, form, fields, boilerplateLines, unexplainedLines, score, problems };
}

// ---------------------------------------------------------------------------
// record.md output
// ---------------------------------------------------------------------------

/** English for the standard marriage annotation; null when the wording differs. */
export function translateAnnotation(it: string): string | null {
  const m = it.trim().match(/^(.+?) ha contratto matrimonio con (.+?) il (\d{2}\/\d{2}\/\d{4}) nel Comune di (.+?)\.?\s+L'atto fu i?\/?trascritto nei registri di matrimonio del Comune di (.+?) anno (\d{4}) parte\s*(.*?)\s*n\.?\s*(\d+)\.?$/i);
  if (!m) return null;
  const [, a, b, date, place, regPlace, year, ps, n] = m;
  // "Emmi Egidio" (surname first) → "Egidio Emmi"; keeps multi-word surnames together only when 2 words
  const fmt = (s: string) => { const w = s.trim().split(/\s+/); return titleCase(w.length === 2 ? `${w[1]} ${w[0]}` : s); };
  // "/serie /" (blank form) → ""; "2° serie A" stays as written
  const partSeries = ps.replace(/^\/?serie\s*\/?\s*$/i, '').replace(/^\/\s*/, '').trim();
  return `${fmt(a)} married ${fmt(b)} on ${date} in the Comune of ${place}. The act was entered/transcribed in the marriage registers of the Comune of ${regPlace}, year ${year}, part/series ${partSeries || '[left blank]'}, no. ${n}.`;
}

/** Build the "## Transcription" block in the same line format as other records. */
export function toRecordMarkdown(result: CiecResult): string {
  const out: string[] = [`## Transcription (estratto, multilingual form — Formula ${result.form === 'birth' ? 'A' : result.form === 'marriage' ? 'B' : result.form === 'death' ? 'C' : '?'}, Vienna Convention 1976)`];
  const uncertain: string[] = [];
  for (const f of result.fields) {
    let en = f.value;
    if (f.key === 'annotations') en = translateAnnotation(f.value) ?? '[translation needed]';
    else if (f.key === 'sex') en = f.value === 'maschile' ? 'male' : f.value === 'femminile' ? 'female' : f.value;
    else en = f.value.replace(/[A-ZÀ-Ý][A-ZÀ-Ý']+/g, (w) => titleCase(w));
    const flag = f.confidence === 'high' ? '' : ' [?]';
    out.push(`- ${f.label}: ${f.value}${flag}`);
    out.push(`  en: ${f.labelEn}: ${en}${flag}`);
    if (f.note) uncertain.push(`- **${f.labelEn}:** ${f.note}`);
  }
  for (const p of result.problems) uncertain.push(`- ${p}`);
  out.push('', '## Uncertain readings', ...(uncertain.length ? uncertain : ['- None flagged by the parser. Still check against the image.']));
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// Cross-check two readings of the same page (PDF text layer vs OCR, or two
// OCR engines). Agreement raises confidence; disagreement is flagged with both.
// ---------------------------------------------------------------------------

function cmpKey(v: string): string {
  return norm(v).replace(/[^A-Z0-9/]/g, '');
}

export function crossCheck(primary: CiecResult, secondary: CiecResult): CiecResult {
  const fields = primary.fields.map((f) => {
    const other = secondary.fields.find((x) => x.key === f.key);
    if (!other) return f;
    if (f.candidates || other.candidates) {
      const a = f.candidates ?? [f.value];
      const b = other.candidates ?? [other.value];
      const both = [...a, ...b].filter((v) => !v.includes('?') && v !== '?'
        && a.some((p) => matchesPattern(v, p)) && b.some((p) => matchesPattern(v, p)));
      const agreed = [...new Set(both)];
      if (agreed.length === 1) {
        return { ...f, value: agreed[0], confidence: 'medium' as Confidence, candidates: agreed,
          note: `Only ${agreed[0]} fits both readings ("${f.value}" / "${other.value}"). Check the image.` };
      }
      const all = [...new Set([...a, ...b])];
      return { ...f, value: agreed[0] ?? '?', confidence: 'low' as Confidence, candidates: agreed.length ? agreed : all,
        note: `Ambiguous — possible readings: ${(agreed.length ? agreed : all).join(', ')}. Check the image.` };
    }
    if (cmpKey(other.value) === cmpKey(f.value)) {
      // Two independent readings agree: promote one level
      if (f.confidence === 'low' && other.confidence !== 'low') return { ...other };
      return f.confidence === 'high' ? f : { ...f, confidence: 'high' as Confidence,
        note: `${f.note ? f.note + ' ' : ''}Both readings agree.` };
    }
    // Disagree: keep the more confident one, record the other, never resolve silently
    const best = weightOf(other) > weightOf(f) ? other : f;
    const alt = best === f ? other : f;
    return { ...best, confidence: 'low' as Confidence,
      note: `Readings disagree: "${best.value}" vs "${alt.value}". ${best.note ?? ''}`.trim() };
  });
  for (const o of secondary.fields) if (!fields.some((f) => f.key === o.key)) fields.push({ ...o, note: `${o.note ? o.note + ' ' : ''}Found only in the second reading.` });
  const problems = primary.problems.filter((p) => !fields.some((f) => p.toLowerCase().includes(f.labelEn.toLowerCase().split(' ')[0])));
  const scoreOf = (fs: CiecField[]) => {
    const r = { ...primary, fields: fs };
    return rescore(r);
  };
  return { ...primary, fields, problems, score: scoreOf(fields) };
}

function weightOf(f: CiecField): number {
  return f.confidence === 'high' ? 3 : f.confidence === 'medium' ? 2 : 1;
}

const EXPECTED: Record<CiecForm, string[]> = {
  birth: ['comune', 'atto', 'eventDate', 'surname', 'givenNames', 'sex', 'father', 'mother', 'issueDate', 'officer'],
  death: ['comune', 'atto', 'eventDate', 'surname', 'givenNames', 'issueDate', 'officer'],
  marriage: ['comune', 'atto', 'eventDate', 'issueDate', 'officer'],
  unknown: [],
};

function rescore(r: CiecResult): number {
  const want = EXPECTED[r.form];
  const w: Record<Confidence, number> = { high: 1, medium: 0.7, low: 0.3 };
  const got = want.reduce((sum, k) => {
    const f = r.fields.find((x) => x.key === k);
    return sum + (f ? w[f.confidence] : 0);
  }, 0);
  return want.length ? Math.round((got / want.length) * 100) : 0;
}
