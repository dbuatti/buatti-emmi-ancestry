// ---------------------------------------------------------------------------
// Parser for standard Italian "estratti" (extracts) from comuni.
// Unlike the Vienna-1976 multilingual forms (Formula A/B/C), these are
// plain Italian documents: "ESTRATTO DI ATTO DI NASCITA/MORTE/MATRIMONIO".
// ---------------------------------------------------------------------------

export interface ItalianField {
  key: string;
  label: string;       // Italian label
  labelEn: string;     // English label
  value: string;
  confidence: 'high' | 'medium' | 'low';
  note?: string;
}

export interface ItalianExtractResult {
  isItalianExtract: boolean;
  form: 'birth' | 'marriage' | 'death' | 'unknown';
  fields: ItalianField[];
  problems: string[];
  score: number;       // 0-100
}

// Italian number words → digits
const IT_NUMBERS: Record<string, string> = {
  'UNO': '1', 'DUE': '2', 'TRE': '3', 'QUATTRO': '4', 'CINQUE': '5',
  'SEI': '6', 'SETTE': '7', 'OTTO': '8', 'NOVE': '9', 'DIECI': '10',
  'UNDICI': '11', 'DODICI': '12', 'TREDICI': '13', 'QUATTORDICI': '14',
  'QUINDICI': '15', 'SEDICI': '16', 'DICIASETTE': '17', 'DICIOTTO': '18',
  'DICIANNOVE': '19', 'VENTI': '20', 'VENTUNO': '21', 'VENTIDUE': '22',
  'VENTITRE': '23', 'VENTIQUATTRO': '24', 'VENTICINQUE': '25',
  'VENTISEI': '26', 'VENTISETTE': '27', 'VENTOTTO': '28', 'VENTINOVE': '29',
  'TRENTA': '30', 'TRENTUNO': '31',
};

const IT_MONTHS: Record<string, string> = {
  'GENNAIO': '01', 'FEBBRAIO': '02', 'MARZO': '03', 'APRILE': '04',
  'MAGGIO': '05', 'GIUGNO': '06', 'LUGLIO': '07', 'AGOSTO': '08',
  'SETTEMBRE': '09', 'OTTOBRE': '10', 'NOVEMBRE': '11', 'DICEMBRE': '12',
};

function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
}

function field(key: string, label: string, labelEn: string, value: string, confidence: 'high' | 'medium' | 'low', note?: string): ItalianField {
  return { key, label, labelEn, value, confidence, ...(note ? { note } : {}) };
}

export function parseItalianExtract(rawText: string): ItalianExtractResult {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const text = lines.join('\n');
  const nText = norm(text);
  const fields: ItalianField[] = [];
  const problems: string[] = [];

  // Detect form type
  let form: 'birth' | 'marriage' | 'death' | 'unknown' = 'unknown';
  if (/ESTRATTO (?:DI|DELL[''])? ?ATTO DI NASCITA/i.test(nText)) form = 'birth';
  else if (/ESTRATTO (?:DI|DELL[''])? ?ATTO DI MATRIMONIO/i.test(nText)) form = 'marriage';
  else if (/ESTRATTO (?:DI|DELL[''])? ?ATTO DI MORTE/i.test(nText)) form = 'death';

  const isItalianExtract = form !== 'unknown' || /UFFICIO DELLO STATO CIVILE/.test(nText);

  if (!isItalianExtract) {
    return { isItalianExtract: false, form: 'unknown', fields: [], problems: ['Not a standard Italian estratto'], score: 0 };
  }

  // --- Comune ---
  {
    // "Città di San Benedetto del Tronto" or "Comune di X"
    const m = nText.match(/CITT[ÀA]\s+DI\s+([A-Z][A-Z\s]+?)(?:\s+PROVINCIA|\s*$)/);
    if (m) {
      fields.push(field('comune', 'Comune', 'Comune / Municipality', m[1].trim(), 'high'));
    } else {
      // Try "UFFICIO DELLO STATO CIVILE" followed by city
      const m2 = nText.match(/UFFICIO DELLO STATO CIVILE\s*\n?\s*([A-Z][A-Z\s]+?)(?:\s*\n|\s+PROVINCIA)/);
      if (m2) fields.push(field('comune', 'Comune', 'Comune / Municipality', m2[1].trim(), 'medium'));
      else problems.push('Comune not found');
    }
  }

  // --- Provincia ---
  {
    const m = nText.match(/PROVINCIA DI ([A-Z][A-Z\s]+?)(?:\s*\n|\s+UFFICIO)/);
    if (m) fields.push(field('provincia', 'Provincia', 'Province', m[1].trim(), 'high'));
  }

  // --- Atto number ---
  {
    const m = nText.match(/ATTO (?:NR\.?|N\.?|ORIGINALE DI)\s*(\d+)/);
    if (m) fields.push(field('atto', 'Atto Nr.', 'Act number', m[1], 'high'));
    else {
      // Try "Atto Nr. 196"
      const m2 = nText.match(/ATTO\s*(?:NR\.?|N\.?)\s*(\d+)/);
      if (m2) fields.push(field('atto', 'Atto Nr.', 'Act number', m2[1], 'high'));
      else problems.push('Act number not found');
    }
  }

  // --- Parte / Serie ---
  {
    const m = nText.match(/PARTE\s+(\d+|I{1,3}|[IVX]+)/);
    if (m) fields.push(field('parte', 'Parte', 'Part', m[1], 'medium'));
    const m2 = nText.match(/SERIE\s+(?:DELEG\.?\s*)?(\d+|[A-Z])/);
    if (m2) fields.push(field('serie', 'Serie', 'Series', m2[1], 'medium'));
  }

  // --- Date of birth ---
  {
    // "Il giorno TRE del mese LUGLIO dell'anno MILLENOVECENTOTRENTA"
    const m = nText.match(/IL GIORNO\s+([A-Z]+)\s+DEL\s*MESE\s+([A-Z]+)\s+DELL['']?ANNO\s+([A-Z]+)/);
    if (m) {
      const day = IT_NUMBERS[m[1]] || m[1];
      const month = IT_MONTHS[m[2]] || m[2];
      // Year: MILLENOVECENTOTRENTA → 1930
      const yearStr = m[3].replace(/MILLE/g, '1').replace(/NOVECENTO/g, '900').replace(/CENTO/g, '100');
      // Simple heuristic: if it contains NOVECENTO, it's 19xx
      let year = m[3];
      if (year.includes('MILLENOVECENTO')) {
        const rest = year.replace('MILLENOVECENTO', '');
        // Convert rest to number
        const restNum = IT_NUMBERS[rest] || rest;
        year = restNum.match(/^\d+$/) ? '19' + restNum.padStart(2, '0') : '19??';
      }
      // Try direct number words
      if (!year.startsWith('19')) {
        // Map common year words
        const yearMap: Record<string, string> = {
          'MILLENOVECENTOTRENTA': '1930', 'MILLENOVECENTOTRENTUNO': '1931',
          'MILLENOVECENTOTRENTADUE': '1932', 'MILLENOVECENTOTRENTATRE': '1933',
          'MILLENOVECENTOTRENTAQUATTRO': '1934', 'MILLENOVECENTOTRENTACINQUE': '1935',
          'MILLENOVECENTOTRENTASEI': '1936', 'MILLENOVECENTOTRENTASETTE': '1937',
          'MILLENOVECENTOTRENTOTTO': '1938', 'MILLENOVECENTOTRENTANOVE': '1939',
          'MILLENOVECINQUANTA': '1950', 'MILLENOVECINQUANTUNO': '1951',
          'MILLENOVECINQUANTADUE': '1952', 'MILLENOVECINQUANTATRE': '1953',
          'MILLENOVECINQUANTAQUATTRO': '1954', 'MILLENOVECINQUANTACINQUE': '1955',
          'MILLENOVECINQUANTASEI': '1956', 'MILLENOVECINQUANTASETTE': '1957',
          'MILLENOVECINQUANTOTTO': '1958', 'MILLENOVECINQUANTANOVE': '1959',
          'MILLENOVECENTOVENTI': '1920', 'MILLENOVECENTOVENTUNO': '1921',
          'MILLENOVECENTOVENTIDUE': '1922', 'MILLENOVECENTOVENTITRE': '1923',
          'MILLENOVECENTOVENTIQUATTRO': '1924', 'MILLENOVECENTOVENTICINQUE': '1925',
          'MILLENOVECENTOVENTISEI': '1926', 'MILLENOVECENTOVENTISETTE': '1927',
          'MILLENOVECENTOVENTOTTO': '1928', 'MILLENOVECENTOVENTINOVE': '1929',
          'MILLENOVECENTO': '1900',
        };
        year = yearMap[m[3]] || m[3];
      }
      const dateStr = `${day}/${month}/${year}`;
      fields.push(field('birthDate', 'Data di nascita', 'Date of birth', dateStr, 'high'));
    }
    // Place
    const placeMatch = nText.match(/IN\s+([A-Z][A-Z\s]+?)\s*\(\s*[A-Z]{2}\s*\)/);
    if (placeMatch) {
      fields.push(field('birthPlace', 'Luogo di nascita', 'Place of birth', placeMatch[1].trim(), 'high'));
    }
  }

  // --- Sex ---
  {
    const m = nText.match(/SESSO\s+(FEMMINILE|MASCHILE)/);
    if (m) fields.push(field('sex', 'Sesso', 'Sex', m[1].toLowerCase(), 'high'));
    else {
      const m2 = nText.match(/SESSO\s+FEMMINILE|SESSO\s+MASCHILE/);
      if (m2) fields.push(field('sex', 'Sesso', 'Sex', m2[0].replace('SESSO ', '').toLowerCase(), 'high'));
    }
  }

  // --- Surname ---
  {
    const m = nText.match(/CON IL COGNOME DI\s+([A-Z]+)/);
    if (m) fields.push(field('surname', 'Cognome', 'Surname', m[1], 'high'));
    else problems.push('Surname not found (look for "con il cognome di")');
  }

  // --- Given names ---
  {
    const m = nText.match(/IL NOME DI\s+([A-Z]+)/);
    if (m) fields.push(field('givenNames', 'Prenomi', 'Given names', m[1], 'high'));
    else problems.push('Given names not found (look for "il nome di")');
  }

  // --- Annotations ---
  {
    const idx = nText.indexOf('ANNOTAZIONI');
    if (idx !== -1) {
      const rest = nText.slice(idx + 'ANNOTAZIONI'.length).trim();
      // Take until "In carta libera" or "UFFICIALE" or end
      const endMarkers = ['IN CARTA LIBERA', 'UFFICIALE DELLO STATO CIVILE', 'IL PRESENTE CERTIFICATO'];
      let endIdx = rest.length;
      for (const marker of endMarkers) {
        const mi = rest.indexOf(marker);
        if (mi !== -1 && mi < endIdx) endIdx = mi;
      }
      const annotation = rest.slice(0, endIdx).trim();
      if (annotation) {
        fields.push(field('annotations', 'Annotazioni', 'Annotations', annotation, 'medium', 'Marriage/death annotations extracted from the certificate'));
      }
    }
  }

  // --- Issue date ---
  {
    // "San Benedetto del Tronto, li 06/08/2026"
    const m = nText.match(/LI\s+(\d{2}\/\d{2}\/\d{4})/);
    if (m) fields.push(field('issueDate', 'Data di rilascio', 'Date of issue', m[1], 'high'));
    else {
      const m2 = nText.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (m2) fields.push(field('issueDate', 'Data di rilascio', 'Date of issue', m2[1], 'medium', 'Date found but context unclear'));
    }
  }

  // --- Officer ---
  {
    const m = nText.match(/UFFICIALE DELLO STATO CIVILE\}?\s*([A-Z][A-Z\s.]+?)(?:\s*$|\s*N@)/);
    if (m) fields.push(field('officer', 'Ufficiale', 'Issuing officer', m[1].trim(), 'medium'));
    else {
      // Try "DI FALCO R. VAY" pattern
      const m2 = nText.match(/DI FALCO\s+[A-Z.\s]+/);
      if (m2) fields.push(field('officer', 'Ufficiale', 'Issuing officer', m2[0].trim(), 'medium'));
    }
  }

  // --- Parents (when listed) ---
  // Italian estratti often don't list parents in the extract, only in the full act

  const score = fields.length > 0 ? Math.min(100, Math.round((fields.filter((f) => f.confidence === 'high').length / fields.length) * 100 + 20)) : 0;
  return { isItalianExtract: true, form, fields, problems, score };
}

export function toItalianMarkdown(result: ItalianExtractResult): string {
  if (!result.isItalianExtract) return '';
  const lines: string[] = [`## Transcription (estratto italiano — ${result.form})`];
  for (const f of result.fields) {
    lines.push(`- ${f.label}: ${f.value}`);
    lines.push(`  en: ${f.labelEn}: ${f.value}`);
  }
  if (result.problems.length) {
    lines.push('');
    lines.push('## Uncertain readings');
    for (const p of result.problems) lines.push(`- ${p}`);
  }
  return lines.join('\n');
}