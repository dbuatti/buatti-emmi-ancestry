import type { Person } from '@/types';

export interface ResearchGoal {
  id: string;
  personId: string;
  description: string;
  where: string;
  status: 'Found' | 'Searching' | 'Pending' | 'Not Found';
  priority: number;
}

const comuneFromPlace = (place?: string): string | null => {
  if (!place) return null;
  const parts = place.split(',');
  return parts[0].trim();
};

const yearFromDate = (date?: string): number | null => {
  if (!date) return null;
  const m = date.match(/(\d{4})/);
  return m ? parseInt(m[1]) : null;
};

const isDeceasedBy = (deathDate?: string): string | null => {
  if (!deathDate) return null;
  const m = deathDate.match(/(\d{4})/);
  return m ? m[0] : null;
};

interface AntenatiInfo {
  available: boolean;
  years: string;
  note?: string;
}

const antenatiCoverage: Record<string, AntenatiInfo> = {
  'Linguaglossa': { available: true, years: '1820–1929' },
  'Fiumefreddo di Sicilia': { available: true, years: '1820–1929' },
  'Calatabiano': { available: true, years: '1820–1929' },
  'Castiglione di Sicilia': { available: true, years: '1820–1929' },
  'Randazzo': { available: true, years: '1820–1929' },
  'Piedimonte Etneo': { available: true, years: '1820–1929' },
  'Milo': { available: true, years: '1820–1929' },
  'Ascoli Piceno': { available: false, years: 'up to 1880 (FS), 1915–1919 (Antenati)', note: 'gap 1881–1914' },
  'San Benedetto del Tronto': { available: false, years: 'none digitised' },
  'Giarre': { available: true, years: '1820–1929' },
  'Acireale': { available: true, years: '1820–1929' },
};

const nearbyTownsByLine: Record<string, string[]> = {
  Buatti: ['Ascoli Piceno', 'San Benedetto del Tronto'],
  Chiappini: ['Ascoli Piceno', 'San Benedetto del Tronto', 'Porto San Giorgio'],
  Emmi: ['Linguaglossa', 'Fiumefreddo di Sicilia', 'Calatabiano', 'Castiglione di Sicilia', 'Randazzo', 'Piedimonte Etneo', 'Giarre'],
  Patanè: ['Fiumefreddo di Sicilia', 'Calatabiano', 'Milo', 'Giarre', 'Linguaglossa'],
  Other: ['Linguaglossa', 'Fiumefreddo di Sicilia', 'Calatabiano', 'Ascoli Piceno'],
};

const nearbyTownsAll = ['Linguaglossa', 'Fiumefreddo di Sicilia', 'Calatabiano', 'Castiglione di Sicilia', 'Randazzo', 'Piedimonte Etneo', 'Giarre', 'Ascoli Piceno', 'San Benedetto del Tronto'];

const recordStatus = (person: Person, typePrefix: string): 'Found' | 'Searching' | 'Not Found' | undefined => {
  if (!person.records) return undefined;
  const found = person.records.find(
    r => r.type.toLowerCase().startsWith(typePrefix.toLowerCase())
  );
  if (!found) return undefined;
  if (found.status === 'Requested' || found.status === 'Searching') return 'Searching';
  if (found.status === 'Found') return 'Found';
  if (found.status === 'Not Found') return 'Not Found';
  return undefined;
};

const hasFoundRecord = (person: Person, typePrefix: string): boolean =>
  recordStatus(person, typePrefix) === 'Found';

const hasSearchingRecord = (person: Person, typePrefix: string): boolean =>
  recordStatus(person, typePrefix) === 'Searching';

const hasRequestedRecord = (person: Person, typePrefix: string): boolean =>
  recordStatus(person, typePrefix) === 'Searching';

const isNotFoundRecord = (person: Person, typePrefix: string): boolean =>
  recordStatus(person, typePrefix) === 'Not Found';

const recordNote = (person: Person, typePrefix: string): string | undefined => {
  if (!person.records) return undefined;
  const found = person.records.find(
    r => r.type.toLowerCase().startsWith(typePrefix.toLowerCase())
  );
  return found?.notes;
};

const goalStatus = (person: Person, typePrefix: string): 'Found' | 'Searching' | 'Not Found' | 'Pending' => {
  if (hasFoundRecord(person, typePrefix)) return 'Found';
  if (hasSearchingRecord(person, typePrefix)) return 'Searching';
  if (isNotFoundRecord(person, typePrefix)) return 'Not Found';
  return 'Pending';
};

const antenatiUrl = (comune: string, tipo: string, anno?: string): string => {
  let url = `https://antenati.cultura.gov.it/search-registry/?comune=${encodeURIComponent(comune)}&tipologia=${tipo}`;
  if (anno) url += `&anno=${anno}`;
  return url;
};

export function generateGoals(person: Person): ResearchGoal[] {
  const goals: ResearchGoal[] = [];
  const comune = comuneFromPlace(person.birthPlace);
  const birthYear = yearFromDate(person.birthDate);
  const deathYear = isDeceasedBy(person.deathDate);
  const ante = comune ? antenatiCoverage[comune] : null;
  let priority = 0;

  const push = (desc: string, where: string, status: 'Found' | 'Searching' | 'Pending' | 'Not Found') => {
    goals.push({
      id: `goal-${person.id}-${priority}`,
      personId: person.id,
      description: desc,
      where,
      status,
      priority: priority++,
    });
  };

  // --- BIRTH ACT (civil) ---
  if (!hasFoundRecord(person, 'Birth Record') || recordNote(person, 'Birth Record')?.includes('Not Yet Read')) {
    if (comune && ante?.available && birthYear && birthYear <= 1929) {
      push(
        `1. Go to Antenati — filter: ${comune} > Nati > ${birthYear}\n2. Open the register, scroll to the last pages first (indice/annual index)\n3. Find "${person.name.split(' ')[0]}" in the index, note the act number\n4. Jump to that act and verify parents match`,
        antenatiUrl(comune, 'nati', String(birthYear)),
        goalStatus(person, 'Birth Record')
      );
    }
    if (comune && birthYear) {
      push(
        `1. Open FamilySearch Catalog (link below)\n2. Search "${comune}"\n3. Filter: Civil Registration\n4. Browse Nati (~${birthYear}) and check for ${person.name}`,
        `https://www.familysearch.org/search/catalog?q=${encodeURIComponent(comune)}&filter=recordType%3ACivil%20Registration`,
        goalStatus(person, 'Birth Record')
      );
    }
    if (ante && !ante.available) {
      push(
        `1. Write a letter (raccomandata A/R) to Comune di ${comune}, Ufficio di Stato Civile\n2. Request: "estratto di nascita" for ${person.name}\n3. Include: full name, estimated birth year (~${birthYear || 'unknown'}), parents' names if known\n4. Enclose: self-addressed envelope + international reply coupon or check their PEC`,
        `Comune di ${comune}, Ufficio di Stato Civile`,
        hasRequestedRecord(person, 'Birth Record') ? 'Searching' : 'Pending'
      );
    }
    if (!comune && !birthYear) {
      const towns = nearbyTownsByLine[person.line] || nearbyTownsAll;
      push(
        `1. Birthplace is unknown — start with the most likely towns for the ${person.line} line:\n   ${towns.slice(0, 4).join(', ')}\n2. On Antenati, search each town's Nati registers\n3. Start with the index (last pages) for each year range\n4. Look for ${person.name.split(' ')[0]} in the surname section`,
        `https://antenati.cultura.gov.it/search-registry/?cognome=${encodeURIComponent(person.name.split(' ').slice(-1)[0])}`,
        'Pending'
      );
    }
  }

  // --- BAPTISM ---
  if (!hasFoundRecord(person, 'Baptism')) {
    if (comune && birthYear) {
      push(
        `1. On FamilySearch, search Catalog for "${comune}"\n2. Filter: Church Records\n3. Look for Battesimi (baptism) register ~${birthYear}\n4. Open and search for ${person.name.split(' ')[0]}`,
        `https://www.familysearch.org/search/catalog/results?q=${encodeURIComponent(comune)}&filter=recordType%3AChurch%20Records`,
        goalStatus(person, 'Baptism')
      );
    }
    if (comune === 'Fiumefreddo di Sicilia' || comune === 'Linguaglossa') {
      push(
        `1. Follow up on the email sent to Diocesi di Acireale (28 Jun 2026)\n2. If no reply, re-send or call — ask for baptism record of ${person.name}\n3. Provide: full name, estimated birth year ~${birthYear || 'unknown'}, parents' names`,
        `Diocesi di Acireale — emails sent 28 Jun 2026`,
        hasSearchingRecord(person, 'Baptism') ? 'Searching' : 'Pending'
      );
    }
  }

  // --- MARRIAGE ---
  if (person.spouses.length > 0 && !hasFoundRecord(person, 'Marriage Record')) {
    if (ante?.available) {
      const marriageYearEstimate = birthYear ? birthYear + 25 : undefined;
      push(
        `1. On Antenati, open ${comune} > Matrimoni\n2. Start with the index at the back of each year's register\n3. Search for ${person.name.split(' ')[0]} + spouse surname\n4. Try years around ${marriageYearEstimate || 'estimated birth year + 25'}`,
        antenatiUrl(comune, 'matrimoni'),
        goalStatus(person, 'Marriage Record')
      );
      push(
        `1. On Antenati, open ${comune} > Pubblicazioni (marriage banns)\n2. Banns often contain more detail than the marriage act itself\n3. Search same years as Matrimoni — they'll be a few weeks before the wedding`,
        antenatiUrl(comune, 'pubblicazioni'),
        goalStatus(person, 'Marriage Record')
      );
    }
    push(
      `1. Contact Comune di ${comune || 'unknown'}\n2. Request: certificate of marriage (certificato di matrimonio)\n3. If ~1920 or later, the record will be under privacy — explain genealogical research purpose\n4. Include: both spouses' names, approximate marriage year`,
      `Comune di ${comune || 'unknown'}, Ufficio di Stato Civile`,
      hasRequestedRecord(person, 'Marriage Record') ? 'Searching' : 'Pending'
    );
  }

  // --- DEATH ---
  if (!hasFoundRecord(person, 'Death Record')) {
    if (comune && deathYear) {
      if (ante?.available && parseInt(deathYear) <= 1929) {
        push(
          `1. On Antenati, open ${comune} > Morti > ${deathYear}\n2. Start at the index (last pages of the register)\n3. Find ${person.name.split(' ')[0]} in the surname section, note the act number\n4. Jump to that act and check: age at death, parents named, spouse named`,
          antenatiUrl(comune, 'morti', deathYear),
          goalStatus(person, 'Death Record')
        );
      }
      if (parseInt(deathYear) <= 1929) {
        push(
          `1. On Antenati, open ${comune} > Morti\n2. Search ${parseInt(deathYear) - 2} through ${parseInt(deathYear) + 2}\n3. The death index is at the back of each year — check each year's index\n4. Morti indexes are faster to scan than Nati — one page per year typically`,
          antenatiUrl(comune, 'morti'),
          goalStatus(person, 'Death Record')
        );
      }
    }
    if (person.deathPlace?.toLowerCase().includes('australia')) {
      push(
        `1. Open Ryerson Index (link below)\n2. Search: ${person.name}\n3. Try variants: initials, maiden name for women\n4. Note the date, publication, and newspaper reference — then search Trove for the full notice`,
        `https://ryersonindex.net/search.php`,
        'Pending'
      );
      push(
        `1. Open Trove (link below)\n2. Search: "${person.name}"\n3. Filter: Australian newspapers only\n4. Try date range narrowing and name variants if too many results`,
        `https://trove.nla.gov.au/newspaper/search?adv_y=on&l-australian=y&l-word=${encodeURIComponent(person.name)}`,
        'Pending'
      );
    }
    push(
      `1. Search online cemetery database for ${comune || person.deathPlace || 'the person'}\n2. Try: Find a Grave, BillionGraves, or the comune's own cemetery portal\n3. ${comune ? `For Italian comuni, try the comune website's "Cimitero" or "Servizi al Cittadino" section` : 'Search by full name and death year if known'}`,
      comune ? `https://www.findagrave.com/memorial/search?firstname=&lastname=${encodeURIComponent(person.name.split(' ').slice(-1)[0])}` : 'Cemetery database online search',
      'Pending'
    );
  }

  // --- SOMEONE'S PARENTS (generation 0 unknowns) ---
  if (person.parents.length === 0 && person.generation >= 1) {
    push(
      `1. Find ${person.name}'s marriage act (Matrimoni or Pubblicazioni on Antenati)\n2. Marriage acts always name both parents — the "processetti" (allegati) volume has full birth-cert copies\n3. Check if ${comune || 'the relevant comune'}'s allegati/processetti are on Antenati\n4. The marriage act alone will usually give both parents' names`,
      `Search for marriage record first`,
      'Pending'
    );
  }

  // --- DECENNIAL INDEXES ---
  if (comune && birthYear && ante?.available) {
    const decadeStart = Math.floor((birthYear - 5) / 10) * 10;
    push(
      `1. On Antenati, find ${comune} > Indici Decennali (10-year indexes)\n2. Open the index covering ${decadeStart}-${decadeStart + 9}\n3. These aggregate all births in one alphabetical list — much faster than browsing year-by-year\n4. Find ${person.name.split(' ')[0]} and note the year + act number, then jump directly to that act`,
      `https://antenati.cultura.gov.it/search-registry/?comune=${encodeURIComponent(comune)}&tipologia=indici_decennali`,
      'Pending'
    );
  }

  // --- NAA / TROVE (for anyone who migrated) ---
  if (person.migration || person.migration?.voyages?.length) {
    push(
      `1. Open NAA RecordSearch (link below)\n2. Search: "${person.name}"\n3. Try narrowing: add a filter for year range or record type (B78 = immigration files)\n4. Look for: passenger lists, alien registration, naturalisation, immigration case files`,
      `https://recordsearch.naa.gov.au`,
      goalStatus(person, 'Immigration File')
    );
  }

  // --- FULL TEXT SEARCH ---
  if (comune) {
    push(
      `1. FamilySearch full-text search can find names inside handwritten documents\n2. Go to the link below and search for "${person.name}"\n3. Try adding "${comune}" to narrow results\n4. Note: results are OCR-generated, so try name variants (Egidio/Egidia, etc.)`,
      `https://www.familysearch.org/search/full-text?q=${encodeURIComponent(person.name)}`,
      'Pending'
    );
  }

  // --- SIBLING / WIDER NETWORK ---
  if (person.parents.length > 0) {
    const parentNames = person.parents.map(id => id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(' + ');
    push(
      `1. On Antenati, browse ${comune || 'the comune'} Nati registers\n2. Search for other children with the SAME parents (${parentNames})\n3. Siblings help confirm parentage and may reveal migration patterns (e.g., one sibling sponsors another)\n4. Log every sibling found with year, act number, and any margin annotations`,
      `${comune ? antenatiUrl(comune, 'nati') : 'Antenati search'}`,
      'Pending'
    );
  }

  // --- SPECIFIC EDGE CASES ---

  // Egidio Emmi
  if (person.id === 'egidio-emmi' && !hasFoundRecord(person, 'Birth Record')) {
    // === ALREADY CHECKED (Not Found — strikethrough) ===
    push(
      `Searched Linguaglossa Nati 1868, 1869, 1870, 1871, 1873, 1874 — all images browsed, Egidio not found`,
      `Antenati — 6 years fully checked`,
      'Not Found'
    );
    push(
      `Searched Randazzo Nati 1868-1874, Castiglione di Sicilia 1868-1874, Piedimonte Etneo 1870, Calatabiano 1870 — not found`,
      `Antenati — 5 comuni checked`,
      'Not Found'
    );
    push(
      `Milo: confirmed no civil records on Antenati at all`,
      `Antenati — no records for this comune`,
      'Not Found'
    );
    push(
      `Checked Matrimoni allegati on Antenati — series stops at 1893, 1900 allegati not available online`,
      `Antenati — serie 81163, Matrimoni allegati only 1866-1893`,
      'Not Found'
    );
    push(
      `Checked Matrimoni indexes 1866-1872 for Antonino Emmi × Rosaria — found three Antonino marriages, none to a Nasti. Conclusion: they married pre-1866 (Borbonic series)`,
      `Antenati — Matrimoni 1866-1872`,
      'Not Found'
    );

    // === STILL TO DO (Pending) ===
    push(
      `KILLER MOVE: Request marriage allegati from Archivio di Stato di Catania
1. Send email to: Archivio di Stato di Catania (asct@pec.cultura.gov.it)
2. Subject: "Richiesta riproduzione allegati al matrimonio — Linguaglossa 1900 atto n. 59"
3. Body (in Italian): request copy of "allegati al matrimonio atto n. 59 del 1900, Comune di Linguaglossa, sposi: Emmi Egidio e Sgroi Concetta"
4. This single request retrieves: Egidio's certified birth-act copy (year + act number), Concetta's birth-act copy
5. Expect: small reproduction fee, digital copy by email`,
      `Archivio di Stato di Catania — PEC: asct@pec.cultura.gov.it`,
      'Pending'
    );
    const remainingNatiYears = [
      { year: '1867', note: 'BEST BET — clerk rounded other Egidio to 32 (was 31), so our "30" could be 29 → born 1867' },
      { year: '1872', note: 'second priority' },
      { year: '1866', note: 'third priority — index shows an "Egidio son of Antonino + Giuseppa Gullo"' },
    ];
    remainingNatiYears.forEach(({ year, note }) => {
      push(
        `1. On Antenati, open Linguaglossa > Nati > ${year}\n2. Go to the index at the back of the register\n3. Look for "Emmi" in the E section\n4. ${note}\n5. If you find "Emmi Egidio" or "Emmi Antonino", check parents (mother must be Rosaria Nasti, father "fu" Antonino)`,
        antenatiUrl('Linguaglossa', 'nati', year),
        'Pending'
      );
    });
    push(
      `1. On Antenati, look for the pre-1866 Borbonic series for Linguaglossa\n2. These are in a different serie from the unified Nati (1866-1929)\n3. Births before Italian unification used a different numbering system\n4. Browse starting from 1865 and work backwards`,
      `https://antenati.cultura.gov.it/search-registry/?comune=Linguaglossa&tipologia=nati`,
      'Pending'
    );
    push(
      `HOUSEHOLD HUNT: Stop looking only for Egidio — look for his SIBLINGS
1. In every Nati index you open, scan ALL "Emmi" entries
2. Log any child whose father is "Antonino" and mother is "Rosaria"
3. A sibling tells you: the quartiere, Antonino's patronymic, and whether the family had a consistent naming pattern
4. Once you find one sibling, Egidio's act becomes findable by triangulation`,
      `Linguaglossa Nati 1866-1875 on Antenati`,
      'Pending'
    );
    push(
      `SCAN MORTI for Antonino Emmi (died between ~1872 and Sep 1900)
1. On Antenati, open Linguaglossa > Morti
2. Start from 1893 and work BACKWARDS (older men die older, so 1880s-90s most likely)
3. Check the index at the back of each year — look for "Emmi Antonino"
4. The death act will name his widow: "Rosaria Nasti" — this confirms the connection
5. It will also name his parents — resolving which Antonino is ours
6. Morti indexes are typically 1-3 pages per year — very fast`,
      `https://antenati.cultura.gov.it/search-registry/?comune=Linguaglossa&tipologia=morti`,
      'Pending'
    );
    push(
      `CHURCH ROUTE: Santa Maria delle Grazie baptisms
1. On FamilySearch, search Catalog for "Linguaglossa"
2. Filter: Church Records
3. Look for "Registri ecclesiastici di Linguaglossa 1539-1928"
4. Find the Battesimi register covering ~1866-1872
5. Search for Egidio Emmi — or any child of Antonino + Rosaria Nasti
6. Baptismal records are independent of civil records — may survive even if civil act is lost`,
      `https://www.familysearch.org/search/catalog/results?q=Linguaglossa&filter=recordType%3AChurch%20Records`,
      'Pending'
    );
    push(
      `Send corrected follow-up to Comune di Linguaglossa:
1. Reference your earlier email
2. Correct mother's surname: Nasti (not Raiti — handwriting confirms across Acts 41 & 59)
3. Marriage date: 4 Nov 1900 (atto 59) — not 8 Sep (that was the banns)
4. Father: "fu" Antonino (deceased by 1900)
5. Warn them: the Egidio born 1868 to Antonino + Rosa Vecchio (atto 141) is NOT the one you want
6. Ask them to search Nati 1866-1872 for our Egidio`,
      `Comune di Linguaglossa, Ufficio di Stato Civile`,
      hasSearchingRecord(person, 'Birth Record') ? 'Searching' : 'Pending'
    );
    push(
      `LOW PRIORITY: Visit FamilySearch center for DGS 7841071 (Nati 1866-1875)
Note: likely the SAME Archivio di Stato Catania images already browsed on Antenati, but may have different annotations`,
      `FamilySearch center — DGS 7841071, segnatura 8541 on Antenati`,
      'Pending'
    );
  }

  // Gregorio Sgroi
  if (person.id === 'gregorio-sgroi' && !hasFoundRecord(person, 'Birth Record')) {
    push(
      `1. On Antenati, open Linguaglossa > Nati\n2. Search years 1847 through 1852 (age 27 at Concetta's birth, 10 Mar 1877)\n3. Start with the index at the back of each year — look for "Sgroi"\n4. When you find Gregorio Sgroi, check: father's name (to confirm right one)`,
      `https://antenati.cultura.gov.it/search-registry/?comune=Linguaglossa&tipologia=nati`,
      'Pending'
    );
  }

  // Santa Calì
  if (person.id === 'santa-cali' && !hasFoundRecord(person, 'Birth Record')) {
    push(
      `1. On Antenati, open Linguaglossa > Nati\n2. Search for "Calì" or "Santa Calì" — estimate: born ~1850-1860 (was a mother in 1877)\n3. Check the yearly indexes (last pages of each register)\n4. Her marriage record to Gregorio Sgroi (below) will confirm her parentage`,
      `https://antenati.cultura.gov.it/search-registry/?comune=Linguaglossa&tipologia=nati`,
      'Pending'
    );
    push(
      `1. On Antenati, open Linguaglossa > Matrimoni\n2. Search ~1869-1876 for "Gregorio Sgroi" × "Santa Calì"\n3. They were married before Concetta was born (Mar 1877)\n4. The marriage act lists both sets of parents for both spouses`,
      `https://antenati.cultura.gov.it/search-registry/?comune=Linguaglossa&tipologia=matrimoni`,
      'Pending'
    );
  }

  // Concetta Sgroi
  if (person.id === 'concetta-sgroi' && !hasFoundRecord(person, 'Death Record')) {
    push(
      `Concetta's birth-act copy is filed alongside Egidio's in allegati of atto 59/1900 — one request to ASCt retrieves both`,
      `Archivio di Stato di Catania — same request as Egidio's allegati`,
      'Pending'
    );
  }

  // Cap at 20
  return goals.slice(0, 20);
}