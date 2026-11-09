// ---------------------------------------------------------------------------
// Detect multiple civil records within a single OCR'd PDF.
// Input: OCR text with "--- Page N ---" markers (or unmarked text).
// Output: array of detected records with page ranges, form types, and key fields.
// ---------------------------------------------------------------------------

export type DetectedForm = 'birth' | 'marriage' | 'death' | 'unknown';

export interface DetectedRecord {
  /** 1-based page numbers belonging to this record (inclusive range). */
  pages: number[];
  /** Human-readable label, e.g. "Pages 1-2". */
  pageLabel: string;
  /** Detected form type. */
  form: DetectedForm;
  /** Act number if found. */
  atto: string | null;
  /** Year if found. */
  year: string | null;
  /** Comune/place if found. */
  comune: string | null;
  /** Key names found (surname, given names). */
  names: string[];
  /** People mentioned (father, mother, spouse). */
  people: string[];
  /** Confidence of detection. */
  confidence: 'high' | 'medium' | 'low';
  /** Raw text of this record's pages. */
  text: string;
}

const FORM_MARKERS: { re: RegExp; form: DetectedForm }[] = [
  { re: /ATTO DI NASCITA|ACTE DE NAISSANCE|FORMUL[AE] A\b/i, form: 'birth' },
  { re: /ATTO DI MATRIMONIO|ACTE DE MARIAGE|FORMUL[AE] B\b/i, form: 'marriage' },
  { re: /ATTO DI MORTE|ACTE DE DECES|FORMUL[AE] C\b/i, form: 'death' },
];

function detectFormType(text: string): DetectedForm {
  for (const { re, form } of FORM_MARKERS) {
    if (re.test(text)) return form;
  }
  return 'unknown';
}

function extractAtto(text: string): string | null {
  const m = text.match(/ATTO DI (?:NASCITA|MATRIMONIO|MORTE)\s+N\.?\s*(\d+)/i)
    || text.match(/ESTRATTO DELL['']?ATTO DI (?:NASCITA|MATRIMONIO|MORTE)\s+N\.?\s*(\d+)/i)
    || text.match(/N\.?\s*(\d{1,4})\b/);
  return m ? m[1] : null;
}

function extractYear(text: string): string | null {
  // Try "anno 1900" or "MILLENOVECENTOTRENTA" patterns
  const m = text.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  return m ? m[1] : null;
}

function extractComune(text: string): string | null {
  const m = text.match(/SERVIZIO DELLO STATO CIVILE\s+([A-Z][A-Z\s]+?)(?:\s+PROVINCIA|\s*$)/im);
  if (m) return m[1].trim();
  const m2 = text.match(/COMUNE DI\s+([A-Z][A-Z\s]+?)(?:\s*\n|\s+PROVINCIA)/im);
  if (m2) return m2[1].trim();
  return null;
}

function extractNames(text: string): string[] {
  const names: string[] = [];
  // "COGNOME EMMI" / "NOM EMMI"
  const surnameMatch = text.match(/(?:COGNOME|NOM)\s+([A-Z]{2,}(?:\s+[A-Z]{2,})*)/i);
  if (surnameMatch) names.push(surnameMatch[1].trim());
  // "PRENOMI EGIDIO" / "PRÉNOMS EGIDIO"
  const givenMatch = text.match(/(?:PRENOMI|PRÉNOMS|PRENOM)\s+([A-Z][A-Za-z\s]+?)(?:\s+SESSO|\s+PADRE|\s+MADRE|\s+COGNOME|$)/i);
  if (givenMatch) names.push(givenMatch[1].trim());
  return names;
}

function extractPeople(text: string): string[] {
  const people: string[] = [];
  // Look for "ha contratto matrimonio con X" patterns
  const marriageMatch = text.match(/ha contratto matrimonio con\s+([A-Za-z\s]+?)(?:\s+il\s|\s+nell)/i);
  if (marriageMatch) people.push(marriageMatch[1].trim());
  // Look for "figlio di X e Y" patterns
  const parentsMatch = text.match(/figlio di\s+([A-Za-z\s]+?)\s+e\s+([A-Za-z\s]+?)(?:\s*[,.]|\s*$)/i);
  if (parentsMatch) {
    people.push(parentsMatch[1].trim(), parentsMatch[2].trim());
  }
  return people;
}

/**
 * Detect records from OCR text. The text may contain "--- Page N ---" markers
 * (from the OCR endpoint) or be unmarked (user pasted from preview).
 */
export function detectRecords(ocrText: string): DetectedRecord[] {
  // Split into pages
  const pagePattern = /---\s*Page\s+(\d+)\s*---/gi;
  let pages: { num: number; text: string }[] = [];

  const matches = [...ocrText.matchAll(pagePattern)];
  if (matches.length > 0) {
    // Text has page markers — split on them
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index! + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index! : ocrText.length;
      pages.push({ num: parseInt(matches[i][1], 10), text: ocrText.slice(start, end).trim() });
    }
  } else {
    // No page markers — treat entire text as one page
    pages.push({ num: 1, text: ocrText });
  }

  // Detect form type per page
  const pageForms = pages.map((p) => ({
    ...p,
    form: detectFormType(p.text),
  }));

  // Group consecutive pages with the same form type into records
  const records: DetectedRecord[] = [];
  let currentGroup: typeof pageForms = [];

  for (let i = 0; i < pageForms.length; i++) {
    const page = pageForms[i];
    if (currentGroup.length === 0 || currentGroup[currentGroup.length - 1].form === page.form) {
      currentGroup.push(page);
    } else {
      // Form type changed — finalize current group
      if (currentGroup.length > 0) {
        records.push(buildRecord(currentGroup));
      }
      currentGroup = [page];
    }
  }
  if (currentGroup.length > 0) {
    records.push(buildRecord(currentGroup));
  }

  return records;
}

function buildRecord(pages: { num: number; text: string; form: DetectedForm }[]): DetectedRecord {
  const combinedText = pages.map((p) => p.text).join('\n');
  const form = pages[0].form;
  const pageNumbers = pages.map((p) => p.num);
  const pageLabel = pageNumbers.length === 1
    ? `Page ${pageNumbers[0]}`
    : `Pages ${pageNumbers[0]}-${pageNumbers[pageNumbers.length - 1]}`;

  const atto = extractAtto(combinedText);
  const year = extractYear(combinedText);
  const comune = extractComune(combinedText);
  const names = extractNames(combinedText);
  const people = extractPeople(combinedText);

  // Confidence: high if we found atto + year + comune, medium if 2/3, low if 1/3
  const found = [atto, year, comune].filter(Boolean).length;
  const confidence = found >= 3 ? 'high' : found >= 2 ? 'medium' : 'low';

  return {
    pages: pageNumbers,
    pageLabel,
    form,
    atto,
    year,
    comune,
    names,
    people,
    confidence,
    text: combinedText,
  };
}

/**
 * Match detected records against existing records.
 * Returns a suggestion for each detected record.
 */
export interface RecordMatch {
  detected: DetectedRecord;
  suggestedRecordId: string | null;
  score: number;
  reasons: string[];
}

export function matchRecords(
  detected: DetectedRecord[],
  existingRecords: { id: string; type: string; year: string; atto: string; comune: string; people: string[] }[]
): RecordMatch[] {
  return detected.map((d) => {
    let bestId: string | null = null;
    let bestScore = 0;
    const reasons: string[] = [];

    for (const rec of existingRecords) {
      let score = 0;
      const matchReasons: string[] = [];

      // Type match
      const typeMap: Record<DetectedForm, string> = { birth: 'Birth Record', marriage: 'Marriage Record', death: 'Death Record', unknown: '' };
      if (d.form !== 'unknown' && rec.type === typeMap[d.form]) {
        score += 40;
        matchReasons.push('type matches');
      }

      // Atto match
      if (d.atto && rec.atto && d.atto === rec.atto) {
        score += 25;
        matchReasons.push(`atto ${d.atto} matches`);
      }

      // Year match
      if (d.year && rec.year && d.year === rec.year) {
        score += 20;
        matchReasons.push(`year ${d.year} matches`);
      }

      // Comune match
      if (d.comune && rec.comune && d.comune.toLowerCase() === rec.comune.toLowerCase()) {
        score += 10;
        matchReasons.push('comune matches');
      }

      // People overlap
      const dNames = d.names.map((n) => n.toLowerCase());
      const recPeople = rec.people.map((p) => p.toLowerCase());
      for (const name of dNames) {
        if (recPeople.some((rp) => rp.includes(name) || name.includes(rp))) {
          score += 10;
          matchReasons.push('person matches');
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestId = rec.id;
        reasons.length = 0;
        reasons.push(...matchReasons);
      }
    }

    return {
      detected: d,
      suggestedRecordId: bestScore >= 40 ? bestId : null,
      score: bestScore,
      reasons: bestScore >= 40 ? reasons : [],
    };
  });
}