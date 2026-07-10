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

const recordStatus = (person: Person, typePrefix: string): 'Found' | 'Searching' | 'Not Found' | undefined => {
  if (!person.records) return undefined;
  const found = person.records.find(
    r => r.type.toLowerCase().startsWith(typePrefix.toLowerCase())
  );
  if (!found) return undefined;
  // Handle 'Requested' as 'Searching'
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

const recordNote = (person: Person, typePrefix: string): string | undefined => {
  if (!person.records) return undefined;
  const found = person.records.find(
    r => r.type.toLowerCase().startsWith(typePrefix.toLowerCase())
  );
  return found?.notes;
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
    if (ante?.available && birthYear && birthYear <= 1929) {
      push(
        `Search ${comune} Nati ${birthYear} on Antenati`,
        `https://antenati.cultura.gov.it/search/?comune=${encodeURIComponent(comune!)}&tipo=nati&anno=${birthYear}`,
        hasFoundRecord(person, 'Birth Record') ? 'Found' : hasSearchingRecord(person, 'Birth Record') ? 'Searching' : 'Pending'
      );
    }
    if (comune && birthYear) {
      push(
        `Search FamilySearch catalog for ${comune} civil registration (Nati ~${birthYear})`,
        `https://www.familysearch.org/search/catalog?q=${encodeURIComponent(comune!)}&filter=recordType%3ACivil%20Registration`,
        hasFoundRecord(person, 'Birth Record') ? 'Found' : hasSearchingRecord(person, 'Birth Record') ? 'Searching' : 'Pending'
      );
    }
    if (ante && !ante.available) {
      push(
        `Request estratto di nascita from Comune di ${comune} (raccomandata A/R)`,
        `Comune di ${comune}, Ufficio di Stato Civile`,
        hasRequestedRecord(person, 'Birth Record') ? 'Searching' : 'Pending'
      );
    }
    if (!comune && birthYear) {
      push(
        `Estimate birthplace from known records; search Antenati Nati ${birthYear} for surrounding towns`,
        `https://antenati.cultura.gov.it/search/`,
        'Pending'
      );
    }
  }

  // --- BAPTISM ---
  if (!hasFoundRecord(person, 'Baptism')) {
    if (comune && birthYear) {
      push(
        `Search ${comune} parish baptism registers on FamilySearch (~${birthYear})`,
        `https://www.familysearch.org/search/catalog/results?q=${encodeURIComponent(comune!)}&filter=recordType%3AChurch%20Records`,
        hasFoundRecord(person, 'Baptism') ? 'Found' : hasSearchingRecord(person, 'Baptism') ? 'Searching' : 'Pending'
      );
    }
    if (comune === 'Fiumefreddo di Sicilia' || comune === 'Linguaglossa') {
      push(
        `Check Diocesi di Acireale church records for ${comune} baptisms`,
        `Emails sent 28 Jun 2026 — follow up if no reply`,
        hasSearchingRecord(person, 'Baptism') ? 'Searching' : 'Pending'
      );
    }
  }

  // --- MARRIAGE ---
  if (person.spouses.length > 0 && !hasFoundRecord(person, 'Marriage Record')) {
    const spousePlace = comune; // approximation
    if (ante?.available) {
      push(
        `Search ${comune} Matrimoni for ${person.name}'s marriage`,
        `https://antenati.cultura.gov.it/search/?comune=${encodeURIComponent(comune!)}&tipo=matrimoni`,
        hasFoundRecord(person, 'Marriage Record') ? 'Found' : hasSearchingRecord(person, 'Marriage Record') ? 'Searching' : 'Pending'
      );
      push(
        `Search ${comune} Pubblicazioni (marriage banns) for ${person.name}`,
        `https://antenati.cultura.gov.it/search/?comune=${encodeURIComponent(comune!)}&tipo=pubblicazioni`,
        hasFoundRecord(person, 'Marriage Record') ? 'Found' : hasSearchingRecord(person, 'Marriage Record') ? 'Searching' : 'Pending'
      );
    }
    push(
      `Request marriage certificate from Comune di ${comune || 'unknown'} (if ~1920 or later)`,
      `Comune di ${comune || 'unknown'}, Ufficio di Stato Civile`,
      hasRequestedRecord(person, 'Marriage Record') ? 'Searching' : 'Pending'
    );
  }

  // --- DEATH ---
  if (!hasFoundRecord(person, 'Death Record')) {
    if (comune && deathYear) {
      if (ante?.available && parseInt(deathYear) <= 1929) {
        push(
          `Search ${comune} Morti ${deathYear} on Antenati`,
          `https://antenati.cultura.gov.it/search/?comune=${encodeURIComponent(comune!)}&tipo=morti&anno=${deathYear}`,
          'Pending'
        );
      }
      if (parseInt(deathYear) <= 1929) {
        push(
          `Search ${comune} Morti indexes on Antenati (${deathYear} ±2 years)`,
          `https://antenati.cultura.gov.it/search/?comune=${encodeURIComponent(comune!)}&tipo=morti`,
          'Pending'
        );
      }
    }
    if (person.deathPlace?.toLowerCase().includes('australia')) {
      push(
        `Search Ryerson Index for ${person.name}'s death notice`,
        `https://ryersonindex.net/search.php`,
        'Pending'
      );
      push(
        `Search Trove for ${person.name} death notice`,
        `https://trove.nla.gov.au/newspaper/search?adv_y=on&l-australian=y&l-word=${encodeURIComponent(person.name)}`,
        'Pending'
      );
    }
    push(
      `Search burial in online cemetery database (${comune || person.deathPlace || 'unknown'})`,
      `e.g., ${comune ? `https://www1.comune.${comune.toLowerCase().replace(/\s+/g, '')}.it/cimitero` : 'comune cemetery portal'}`,
      'Pending'
    );
  }

  // --- SOMEONE'S PARENTS (generation 0 unknowns) ---
  if (person.parents.length === 0 && person.generation >= 1) {
    push(
      `Search for ${person.name}'s parents via marriage act allegati (processetti)`,
      `Processetti volumes often list both sets of parents — check on Antenati if available`,
      'Pending'
    );
  }

  // --- DECENNIAL INDEXES ---
  if (comune && birthYear && ante?.available) {
    const decadeStart = Math.floor((birthYear - 5) / 10) * 10;
    push(
      `Check ${comune} Indici Decennali ${decadeStart}-${decadeStart + 9} for ${person.name}`,
      `Antenati — often faster than browsing year-by-year`,
      'Pending'
    );
  }

  // --- NAA / TROVE (for anyone who migrated) ---
  if (person.migration || person.migration?.voyages?.length) {
    push(
      `Search NAA RecordSearch for ${person.name}`,
      `https://recordsearch.naa.gov.au`,
      hasFoundRecord(person, 'Immigration File') ? 'Found' : hasSearchingRecord(person, 'Immigration File') ? 'Searching' : 'Pending'
    );
  }

  // --- FULL TEXT SEARCH ---
  if (comune) {
    push(
      `FamilySearch full-text search for "${person.name}" in ${comune} records`,
      `https://www.familysearch.org/search/full-text?q=${encodeURIComponent(person.name)}`,
      'Pending'
    );
  }

  // --- SIBLING / WIDER NETWORK ---
  if (person.parents.length > 0) {
    push(
      `Search for siblings to triangulate family cluster`,
      `Same comune, same parent names — helps confirm parentage`,
      'Pending'
    );
  }

  // --- SPECIFIC EDGE CASES ---

  // Egidio Emmi: birth not found in 1868-1871, 1873-1874 — see Claude's strategic advice
  if (person.id === 'egidio-emmi' && !hasFoundRecord(person, 'Birth Record')) {
    // TOP PRIORITY: allegati shortcut — request marriage allegati from ASCt
    push(
      `Request allegati of marriage atto 59/1900 from Archivio di Stato di Catania — contains certified copy of Egidio's birth act (no year-guessing needed) and Concetta's birth act in same folder`,
      `Archivio di Stato di Catania — one email request, ref: allegati al matrimonio atto n. 59 del 1900, Linguaglossa (Emmi–Sgroi)`,
      'Pending'
    );
    // Remaining Nati years: 1867 first (most likely per Scarlata's age rounding tolerance), then 1872, then 1866
    const remainingNatiYears = [
      { year: '1867', note: 'first priority — clerk rounded other Egidio 32→31, so ours "30" spans 1866–1872' },
      { year: '1872', note: 'second priority' },
      { year: '1866', note: 'third priority — note index shows "Egidio son of Antonino + Giuseppa Gullo"' },
    ];
    remainingNatiYears.forEach(({ year, note }) => {
      push(
        `Search Linguaglossa Nati ${year} on Antenati (${note})`,
        `https://antenati.cultura.gov.it/search/?comune=Linguaglossa&tipo=nati&anno=${year}`,
        'Pending'
      );
    });
    push(
      `Search Linguaglossa Nati pre-1866 (Borbonic series) — Egidio's birth may be there`,
      `Antenati — covers births before unification`,
      'Pending'
    );
    // Hunt the household: scan for siblings
    push(
      `Hunt the household: scan every Emmi birth in Nati indexes — log any child of Antonino + Rosaria Nasti to identify family, quartiere, and Antonino's patronymic`,
      `Linguaglossa Nati on Antenati — sibling's act makes Egidio findable by triangulation`,
      'Pending'
    );
    // Morti registers for Antonino
    push(
      `Scan Linguaglossa Morti 1866-1893 for Antonino Emmi's death act — will name widow Rosaria Nasti and his parents`,
      `Antenati — Morti indexes at back of each year, much faster to scan than Nati`,
      'Pending'
    );
    // Church route
    push(
      `Check Santa Maria delle Grazie baptism registers (Registri ecclesiastici 1539-1928) on FamilySearch — baptism ~1866-1872 naming Antonino Emmi + Rosaria Nasti gives birth date independent of civil series`,
      `https://www.familysearch.org/search/catalog/results?q=Linguaglossa&filter=recordType%3AChurch%20Records`,
      'Pending'
    );
    // Comune follow-up (lower priority than allegati)
    push(
      `Send corrected follow-up to Comune di Linguaglossa: mother Nasti (not Raiti), marriage 4 Nov 1900 (atto 59), father fu Antonino, clarify atto 141 is not the one wanted`,
      `Comune di Linguaglossa, Ufficio di Stato Civile`,
      hasSearchingRecord(person, 'Birth Record') ? 'Searching' : 'Pending'
    );
    // DGS 7841071: deprioritized — likely same ASCt images already browsed on Antenati
    push(
      `[LOW PRIORITY] Visit FamilySearch center for DGS 7841071 (Nati 1866-1875) — likely same Archivio di Stato Catania images already browsed, but worth checking for annotation differences`,
      `FamilySearch center — segnatura 8541 on Antenati`,
      'Pending'
    );
  }

  // Gregorio Sgroi: birth window narrowed to ~1847-1852
  if (person.id === 'gregorio-sgroi' && !hasFoundRecord(person, 'Birth Record')) {
    push(
      `Search Linguaglossa Nati ~1847-1852 for Gregorio Sgroi (age 27 in Mar 1877)`,
      `https://antenati.cultura.gov.it/search/?comune=Linguaglossa&tipo=nati`,
      'Pending'
    );
  }

  // Santa Calì: parents unknown from Concetta's birth act — needs marriage record
  if (person.id === 'santa-cali' && !hasFoundRecord(person, 'Birth Record')) {
    push(
      `Search Linguaglossa Nati for Santa Calì (husband: Gregorio Sgroi, falegname)`,
      `https://antenati.cultura.gov.it/search/?comune=Linguaglossa&tipo=nati`,
      'Pending'
    );
    push(
      `Search Linguaglossa Matrimoni ~1869-1876 for Gregorio Sgroi + Santa Calì marriage`,
      `https://antenati.cultura.gov.it/search/?comune=Linguaglossa&tipo=matrimoni`,
      'Pending'
    );
  }

  // Everyone: allegati shortcut for anyone married in Linguaglossa 1900 with missing birth
  if (person.id === 'concetta-sgroi' && !hasFoundRecord(person, 'Death Record')) {
    push(
      `Concetta's birth act is also in the Egidio–Sgroi allegati folder (atto 59/1900) — request from Archivio di Stato di Catania alongside Egidio's`,
      `Archivio di Stato di Catania — one request covers both`,
      'Pending'
    );
  }

  // Cap at 20
  return goals.slice(0, 20);
}
