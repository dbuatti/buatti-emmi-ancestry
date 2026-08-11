import type { Person, ResearchLead, OpenQuestion } from '@/types';

export type { Person, ResearchLead, OpenQuestion };

export const initialPeople: Person[] = [
  // --- GENERATION 1: Great-Grandparents ---
  // Buatti Line
  {
    id: 'alfredo-buatti-sr',
    name: 'Alfredo Buatti (Sr.)',
    generation: 1,
    line: 'Buatti',
    gender: 'M',
    birthDate: '18 March 1888',
    birthPlace: 'Ascoli Piceno, Duomo parish (family home: Borgo Solestà)',
    deathDate: '9 May 1964',
    burialPlace: 'Cimitero di Borgo Solestà (Cimitero 01), Ascoli Piceno',
    burialDetails: 'Settore L (loculi), Blocco L074O, Lotto 074 (ossari), Posto 8, Fila 1. Confirmed via the Comune di Ascoli Piceno\'s online cemetery search.',
    burialLink: 'https://www1.comune.ascolipiceno.it/cimitero/cimiteroweb/forms/DefuntoRicerca.asp',
    spouses: ['ida-galanti'],
    parents: ['giovanni-buatti', 'emidia-bruni'],
    children: ['ezio-buatti'],
    notes: [
      'Birth date confirmed 18 Mar 1888 via foglio famiglia N. 1527 (Registro di Popolazione, Comune di Ascoli Piceno) and cartellino individuale — received from Archivio di Stato di Ascoli Piceno (Alessandra Buondi) 17 Jul 2026.',
      'Foglio famiglia N. 1527 shows Alfredo in his grandparents\' household (head: Lenzi Antonia, widow of Buatti Emidio). Parents: Giovanni Buatti (muratore) + Emidia Bruni.',
      'Giovanni\'s later residence noted as Roma — the family may have relocated for work.',
      'Aunt Ida Buatti (b. ~Mar 1886) — lettura incerta on foglio (could read Ida or Lela). Potential source of confusion with his wife Ida Galanti in future records.',
      'Siblings: Attilio (5 Jan 1885), Ida/Lela (~Mar 1886, lettura incerta), Adolfo (26 Feb 1887), Sperandia (27 Mar 1889), Antonio (24 Feb 1894), Elvira (30 Jul 1899). Two infant deaths: Elisa (13 Apr 1883–21 Jul 1884) and Arturo (2 Jan 1892–11 Oct 1892).',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '18 Mar 1888 — foglio famiglia N. 1527 + cartellino individuale (Archivio di Stato di Ascoli Piceno, 17 Jul 2026). Links: foglio https://antenati.cultura.gov.it/ark:/12657/an_ua8378/oLplvkL cartellino https://antenati.cultura.gov.it/ark:/12657/an_ua8562/5gKpOz5' },
      { type: 'Marriage Record', status: 'Searching', notes: 'To Ida Galanti — likely ~1920–1922. Requested from Comune di Ascoli Piceno (prot. 0062771). Tribunale di Ascoli Piceno route CLOSED 20 Jul 2026 (Dott. Maurizio Norcini Pala: court archive interdetto, State Archive notified). USP Ascoli Piceno (21 Jul): no records for 1949–52.' },
      { type: 'Death Record', status: 'Found', notes: '9 May 1964 — confirmed via Comune cemetery search (database shows 9/5/1964, Italian format)' },
      { type: 'Burial Record', status: 'Found', notes: 'Cimitero di Borgo Solestà, Settore L, Blocco L074O' }
    ,
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'In Progress',
      details: 'Birth confirmed 18 Mar 1888 via foglio famiglia N. 1527 (Alessandra Buondi, 17 Jul 2026). Parents: Giovanni Buatti + Emidia Bruni. Grandparents: Emidio Buatti + Antonia Lenzi. Marriage to Ida Galanti and her parentage still outstanding — Perugia file (4 Aug 2026) confirms "Galanti Ida" as Ezio\'s mother but no birth date or paternity. Tribunale AP route CLOSED (archive interdetto, 20 Jul).',
      nextSteps: [
        'Await Comune AP replies: prot. 66127/2026 (Ezio birth act, lodged 20 Jul — chased with 1944 photo attestation) and prot. 0062771 (marriage cert, Sergio De Angelis).',
        'Perugia follow-up with Monica Fiore (sent 5 Aug 2026) — 1944 certificato di nascita (enclosure 3) may name Ida Galanti.',
        'Widen Comune di San Benedetto del Tronto request (prot. 0054400/2026) to stato di famiglia storico, citing Buondi letter prot. 1805-P.',
        'Note the Ida Buatti (b. 1886, Alfredo\'s sister) as potential confusion with Ida Galanti in old indexes.'
      ]
    },
    sources: [
      {
        title: 'Comune di Ascoli Piceno Cemetery Search',
        type: 'Online Database',
        link: 'https://www1.comune.ascolipiceno.it/cimitero/cimiteroweb/forms/DefuntoRicerca.asp'
      },
      {
        title: 'Foglio Famiglia N. 1527 — Archivio di Stato di Ascoli Piceno',
        type: 'Civil Registry',
        reference: 'Registro di Popolazione, Comune di Ascoli Piceno. Received via Alessandra Buondi 17 Jul 2026.'
      },
      {
        title: 'Cartellino Individuale — Alfredo Buatti',
        type: 'Civil Registry',
        reference: 'Archivio di Stato di Ascoli Piceno. Cross-referenced to foglio 1527. Received 17 Jul 2026.'
      }
    ]
  },
  {
    id: 'ida-galanti',
    name: 'Ida Galanti',
    generation: 1,
    line: 'Buatti',
    gender: 'F',
    birthDate: '19 March 1893 (foglio 5120 — marriage to Alfredo unconfirmed)',
    birthPlace: 'Ascoli Piceno',
    deathDate: '26 January 1970',
    burialPlace: 'Cimitero di Borgo Solestà (Cimitero 01), Ascoli Piceno',
    burialDetails: 'Settore L (loculi), Blocco L074O, Lotto 074 (ossari), Posto 8, Fila 1 (same plot as her husband Alfredo Buatti Sr.). Confirmed via the Comune di Ascoli Piceno\'s online cemetery search.',
    burialLink: 'https://www1.comune.ascolipiceno.it/cimitero/cimiteroweb/forms/DefuntoRicerca.asp',
    spouses: ['alfredo-buatti-sr'],
    parents: ['antonio-galanti', 'virginia-rosati'],
    children: ['ezio-buatti'],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '19 Mar 1893 — foglio famiglia 5120 (Registro 55, Ascoli Piceno). Daughter of Antonio Galanti (b. 1857, Lisciano, possidente) + Virginia Rosati (b. 1867, Maltignano). Confirmed as a real person — marriage to Alfredo Buatti unconfirmed (right-hand columns not visible). Family from Lisciano (frazione of Ascoli). 1904 Ida candidate (f. 5545) still unchecked.' },
      { type: 'Marriage Record', status: 'Requested', notes: 'To Alfredo Buatti Sr., ~1920–1922. Requested from Comune di Ascoli Piceno 10 Jul 2026 (protocol 0062771, assigned Sergio De Angelis). Will settle whether 1893 Ida is THE Ida. CAUTION: Alfredo\'s sister Ida Buatti (b. 20 Mar 1886) is a different person.' },
      { type: 'Death Record', status: 'Found', notes: '26 Jan 1970 — confirmed via cemetery search' },
      { type: 'Burial Record', status: 'Found', notes: 'Cimitero di Borgo Solestà, same plot as Alfredo' }
    ,
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'In Progress — Marriage Cert Requested',
      details: '1893 Ida confirmed as real person (foglio 5120): born 19 Mar 1893 to Antonio Galanti + Virginia Rosati, landowning family from Lisciano. Right-hand columns visible but BLANK — no marriage annotation. Register closed ~1901. 1904 Ida (f. 5545, d/o Ignazio Galanti the barber + Clementina Curcozzi) also documented. BREAKTHROUGH (22 Jul 2026): Galanti Alessandro on WWI Morti allegati confirms Ignazio + Clementina as a real couple with children — first hard evidence beyond the single birth entry. Makes 1904 candidate more credible. Perugia file (4 Aug 2026) confirms "Galanti Ida" as Ezio\'s mother across four independent institutional sources, but gives no birth date or paternity. Tiebreaker still awaits marriage cert / birth cert.',
      nextSteps: [
        'Await Comune AP reply for Ezio\'s copia integrale di nascita (prot. 66127/2026, lodged 20 Jul — chased with 1944 photo attestation). Ida\'s age at his birth settles 1893 vs 1904.',
        'Perugia follow-up (Monica Fiore, sent 5 Aug 2026): 1944 certificato di nascita deposited as enclosure 3 of Ezio\'s admission application — ask if it survives in file 2005.',
        'Await marriage cert reply from Comune (protocol 0062771, Sergio De Angelis).',
        'Tribunale AP route CLOSED 20 Jul 2026 (archive interdetto, Dott. Maurizio Norcini Pala).',
        'Widen Comune SBT request (prot. 0054400/2026) to stato di famiglia storico, citing Buondi letter (AS-AP prot. 1805-P, 21 Jul).',
        'Check remaining Morti allegati divisions (5-Div 1, 5-Div 2, 6-Div 1) for any other Galanti siblings — clustering common in war-dead lists.',
      ]
    },
    sources: [
      {
        title: 'Comune di Ascoli Piceno Cemetery Search',
        type: 'Online Database',
        link: 'https://www1.comune.ascolipiceno.it/cimitero/cimiteroweb/forms/DefuntoRicerca.asp'
      },
      {
        title: 'Foglio Famiglia 5120 — Registro 55, Ascoli Piceno',
        type: 'Civil Registry',
        reference: 'Antenati, Censimento series. Ida Galanti, born 19 Mar 1893, daughter of Antonio Galanti + Virginia Rosati. Viewed 18 Jul 2026.'
      },
      {
        title: 'Comune di Ascoli Piceno — Marriage Cert Request',
        type: 'Civil Registration Request',
        reference: 'Protocol 0062771, 10 Jul 2026. Alfredo Buatti + Ida Galanti. Assigned to Sergio De Angelis, Settore 4 - Servizi al Cittadino.'
      }
    ]
  },
  // --- GENERATION 0: Great-Great-Grandparents (Buatti Line) ---
  {
    id: 'giovanni-buatti',
    name: 'Giovanni Buatti',
    generation: 0,
    line: 'Buatti',
    gender: 'M',
    birthDate: '25 June 1852',
    birthPlace: 'Ascoli Piceno, Duomo parish',
    occupations: ['Muratore (bricklayer/mason)'],
    deathDate: 'Unknown',
    spouses: ['emidia-bruni'],
    parents: ['emidio-buatti', 'antonia-lenzi'],
    children: ['alfredo-buatti-sr'],
    notes: [
      'CONFIRMED 17 Jul 2026 via foglio famiglia N. 1527 (Archivio di Stato di Ascoli Piceno, Alessandra Buondi).',
      'Son of Emidio Buatti and Antonia Lenzi. Married Emidia Bruni.',
      'Occupation originally listed as "domestico," corrected to "muratore" on the foglio famiglia.',
      'Later residence noted as Roma — suggests the family relocated for work.',
      'Children: Rosa (1846), Rita (1850), Giovanni (1852) from Emidio & Antonia; then by Giovanni & Emidia: Elisa (1883–1884), Attilio (1885), Ida (1886, lettura incerta — could read Lela), Adolfo (1887), Alfredo (1888), Sperandia (1889), Arturo (1892), Antonio (1894), Elvira (1899).',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '25 Jun 1852, Ascoli Piceno (Duomo parish) — per foglio famiglia N. 1527' },
      { type: 'Death Record', status: 'Not Found', notes: 'Unknown — likely post-1899' }
    ,
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'Confirmed',
      details: 'Identified via foglio famiglia N. 1527 (17 Jul 2026). Son of Emidio Buatti + Antonia Lenzi. Father of Alfredo Buatti (b. 18 Mar 1888). Later residence: Roma.',
    }
  },
  {
    id: 'emidia-bruni',
    name: 'Emidia Bruni',
    generation: 0,
    line: 'Buatti',
    gender: 'F',
    birthDate: '26 November 1857',
    birthPlace: 'Ascoli Piceno, S. Vittore parish',
    deathDate: 'Unknown',
    spouses: ['giovanni-buatti'],
    parents: ['achille-bruni', 'sperandia-sagretani'],
    children: ['alfredo-buatti-sr'],
    notes: [
      'CONFIRMED 17 Jul 2026 via foglio famiglia N. 1527 (Archivio di Stato di Ascoli Piceno, Alessandra Buondi).',
      'Wife of Giovanni Buatti. Daughter of Achille Bruni and Sperandia Sagretani (lettura incerta on mother\'s maiden name — may read Sagretani or similar).',
      'Mother of Alfredo Buatti (b. 18 Mar 1888) and his siblings.',
      'Born 26 Nov 1857 in S. Vittore parish, Ascoli Piceno.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '26 Nov 1857, Ascoli Piceno (S. Vittore parish) — per foglio famiglia N. 1527' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ,
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'Confirmed',
      details: 'Identified via foglio famiglia N. 1527 (17 Jul 2026). Daughter of Achille Bruni + Sperandia Sagretani (lettura incerta).',
    }
  },

  // --- GENERATION -1: Great-Great-Great-Grandparents (Buatti Line) ---
  {
    id: 'emidio-buatti',
    name: 'Emidio Buatti',
    generation: -1,
    line: 'Buatti',
    gender: 'M',
    birthDate: 'Unknown — likely 1810s–1820s',
    birthPlace: 'Likely Ascoli Piceno area',
    deathDate: 'Before 4 October 1899 (predeceased wife)',
    spouses: ['antonia-lenzi'],
    parents: [],
    children: ['giovanni-buatti'],
    notes: [
      'CONFIRMED 17 Jul 2026 via foglio famiglia N. 1527 (Archivio di Stato di Ascoli Piceno).',
      'Predeceased his wife Antonia Lenzi — she is listed as "widow of Buatti Emidio" (head of household).',
      'Father of Rosa (b. 1846), Rita (b. 1850), and Giovanni (b. 1852).',
      'Pushes the known Buatti line back six generations from Daniele Buatti.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Likely pre-unitary records (pre-1861) — search Archivio di Stato di Ascoli Piceno' },
      { type: 'Death Record', status: 'Not Found', notes: 'Before 1899 — not yet located' }
    ,
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'Confirmed',
      details: 'Direct ancestor confirmed via foglio famiglia N. 1527 (17 Jul 2026). Birth/death records outstanding.',
    }
  },
  {
    id: 'antonia-lenzi',
    name: 'Antonia Lenzi',
    generation: -1,
    line: 'Buatti',
    gender: 'F',
    birthDate: 'Unknown',
    birthPlace: 'Rotella (Province of Ascoli Piceno)',
    deathDate: '4 October 1899',
    spouses: ['emidio-buatti'],
    parents: ['domenico-lenzi', 'luigia'],
    children: ['giovanni-buatti'],
    notes: [
      'CONFIRMED 17 Jul 2026 via foglio famiglia N. 1527 (Archivio di Stato di Ascoli Piceno).',
      'Listed as head of household (Capo) as widow of Buatti Emidio. Daughter of fu Domenico and fu Luigia.',
      'Born in Rotella (~20km from Ascoli Piceno). Occupation: casalinga (housewife).',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Rotella — search pre-unitary records' },
      { type: 'Death Record', status: 'Found', notes: '4 Oct 1899 — per foglio famiglia N. 1527' }
    ,
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'Confirmed',
      details: 'Direct ancestor confirmed via foglio famiglia N. 1527 (17 Jul 2026). Birth record outstanding (Rotella pre-unitary series).',
    }
  },

  // --- GENERATION -1: Possible Great-Great-Great-Grandparents (Galanti Line — unconfirmed) ---
  {
    id: 'antonio-galanti',
    name: 'Antonio Galanti',
    generation: -1,
    line: 'Buatti',
    gender: 'M',
    birthDate: '29 October 1857',
    birthPlace: 'Lisciano (frazione of Ascoli Piceno)',
    occupations: ['Possidente (landowner)'],
    deathDate: 'Unknown',
    spouses: ['virginia-rosati'],
    parents: ['domenico-galanti', 'feliciani-angela-maria'],
    children: ['ida-galanti'],
    notes: [
      'CONFIRMED as father of Ida Galanti (b. 19 Mar 1893) via foglio famiglia 5120 (Registro 55, 18 Jul 2026).',
      'Son of Domenico Galanti (b. 29 Oct 1816, Lisciano, possidente, d. 9 Mar 1889) and fu Vincenza Michetti.',
      'Son of a large landowning family from Lisciano (hill frazione of Ascoli Piceno).',
      'Father Domenico was a widower of Feliciani Angela Maria. Antonio\'s brothers: Annibale (b. 1855, moved to Folignano 1901) and Ottavio (b. 1863).',
      'Siblings with Ida on foglio 5120: Tito (b. 18 Nov 1891), Emidia (b. 3 Aug 1894), Linda (b. 18 Aug 1897), Ersilia (b. 16 Jun 1901).',
      'IMPORTANT: Marriage to Alfredo Buatti unconfirmed. 1904 Ida candidate (d/o Ignazio Galanti + Clementina Curcozzi, foglio 5545, Registro 59) also checked — both candidates unconfirmed. BREAKTHROUGH (22 Jul 2026): Galanti Alessandro on WWI Morti allegati (an_ua8575, 6-Div 2) — fu Ignazio Galanti, mother Clementina Curcozzi. First hard evidence that Ignazio + Clementina were a real couple with children in Ascoli Piceno. Makes 1904 Ida candidate more credible (second confirmed child of same parents). Alessandro born ~1895 (dates disagree between documents: 13 Jul vs 8 Nov 1895). Still awaiting marriage cert tiebreaker.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '29 Oct 1857, Lisciano — per foglio famiglia 5120' },
      { type: 'Death Record', status: 'Not Found', notes: 'Not yet located' }
    ,
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'In Progress',
      details: 'Confirmed father of Ida Galanti (b. 1893). Landowning family from Lisciano. Marriage connection to Alfredo Buatti unconfirmed.',
    }
  },
  {
    id: 'virginia-rosati',
    name: 'Virginia Rosati',
    generation: -1,
    line: 'Buatti',
    gender: 'F',
    birthDate: '7 February 1867',
    birthPlace: 'Maltignano (Province of Ascoli Piceno)',
    deathDate: 'Unknown',
    spouses: ['antonio-galanti'],
    parents: ['luigi-rosati', 'filippini'],
    children: ['ida-galanti'],
    notes: [
      'CONFIRMED as mother of Ida Galanti (b. 19 Mar 1893) via foglio famiglia 5120 (Registro 55, 18 Jul 2026).',
      'Daughter of Luigi Rosati and Filippini (surname uncertain).',
      'Born in Maltignano, a comune ~8km from Ascoli Piceno. Entered the household 4 Feb 1891 (marriage to Antonio).',
      'Marriage connection to Alfredo Buatti unconfirmed.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '7 Feb 1867, Maltignano — per foglio famiglia 5120' },
      { type: 'Death Record', status: 'Not Found', notes: 'Not yet located' }
    ,
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'In Progress',
      details: 'Confirmed mother of Ida Galanti (b. 1893). From Maltignano. Marriage connection to Alfredo Buatti unconfirmed.',
    }
  },
  // --- 1904 Ida Candidate's Parents (unconfirmed — awaiting marriage cert tiebreaker) ---
  {
    id: 'ignazio-galanti',
    name: 'Ignazio Galanti',
    generation: -1,
    line: 'Buatti',
    gender: 'M',
    birthDate: 'Unknown',
    birthPlace: 'Ascoli Piceno (assumed)',
    occupations: ['Barber (barbiere)'],
    deathDate: 'Unknown',
    spouses: ['clementina-curcozzi'],
    parents: [],
    children: ['ida-galanti-1904-candidate', 'galanti-alessandro'],
    notes: [
      'Father of 1904 Ida Galanti candidate (foglio 5545, Registro 59, Ascoli Piceno). Occupation: barber.',
      'BREAKTHROUGH (22 Jul 2026): Confirmed as real person via WWI Morti allegati — son Galanti Alessandro (fu Ignazio) died 16 Oct 1917. First hard evidence beyond single birth entry that Ignazio + Clementina were a real couple with children in Ascoli Piceno.',
      'PENDING: 1904 Ida candidate is NOT confirmed as Alfredo\'s wife — marriage cert tiebreaker still awaited.',
    ],
    records: [
      { type: 'Population Register', status: 'Found (indirect)', notes: 'Named in son Alessandro\'s WWI death record (an_ua8575, 6-Div 2) and in foglio 5545 as father of Ida (b. 1904).' },
    ],
    researchStatus: {
      status: 'Confirmed (indirect)',
      details: 'Named in son Alessandro\'s WWI death record and foglio 5545. Barber. Father of Ida Galanti (1904 candidate) and Alessandro (b. ~1895, d. 1917).',
      nextSteps: ['Marriage cert tiebreaker will confirm or rule out as Ida\'s father.']
    }
  },
  {
    id: 'clementina-curcozzi',
    name: 'Clementina Curcozzi',
    generation: -1,
    line: 'Buatti',
    gender: 'F',
    birthDate: 'Unknown',
    birthPlace: 'Unknown',
    deathDate: 'Unknown',
    spouses: ['ignazio-galanti'],
    parents: [],
    children: ['ida-galanti-1904-candidate', 'galanti-alessandro'],
    notes: [
      'Mother of 1904 Ida Galanti candidate (foglio 5545). Surname spelled variously: Curcozzi, Curiozzi, Furcozzi across documents — all clearly the same name.',
      'BREAKTHROUGH (22 Jul 2026): Confirmed as real person via WWI Morti allegati — recorded as mother of Galanti Alessandro (d. 1917). First hard evidence beyond single birth entry.',
    ],
    records: [
      { type: 'Population Register', status: 'Found (indirect)', notes: 'Named in son Alessandro\'s WWI death record (an_ua8575, 6-Div 2) as "Clementina" with surname variant Curcozzi/Curiozzi/Furcozzi.' },
    ],
    researchStatus: {
      status: 'Confirmed (indirect)',
      details: 'Named in son Alessandro\'s WWI death record and foglio 5545. Mother of Ida Galanti (1904 candidate) and Alessandro.',
    }
  },
  // --- GENERATION -2: Great-Great-Great-Great-Grandparents (Buatti/Galanti/Bruni/Lenzi/Rosati Lines) ---
  {
    id: 'domenico-galanti',
    name: 'Domenico Galanti',
    generation: -2,
    line: 'Buatti',
    gender: 'M',
    birthDate: '29 October 1816',
    birthPlace: 'Lisciano (frazione of Ascoli Piceno)',
    occupations: ['Possidente (landowner)'],
    deathDate: '9 March 1889',
    spouses: ['feliciani-angela-maria'],
    parents: ['luigi-galanti', 'vincenza-michetti'],
    children: ['antonio-galanti'],
    notes: [
      'CONFIRMED via foglio famiglia 5120 (Registro 55, 18 Jul 2026): father of Antonio Galanti, grandfather of Ida Galanti (1893).',
      'Son of fu Luigi Galanti and fu Vincenza Michetti. Widower of Feliciani Angela Maria.',
      'Landowning family from Lisciano, a hillside frazione of Ascoli Piceno.',
    ],
    records: [
      { type: 'Birth Record (Population Register)', status: 'Found', notes: '29 Oct 1816, Lisciano — from foglio famiglia 5120. Not a civil birth act.' },
      { type: 'Civil Birth Record', status: 'Searching', notes: 'Pre-1861 Borbonic records — not yet searched in Archivio di Stato' },
      { type: 'Death Record (Population Register)', status: 'Found', notes: '9 Mar 1889 — from foglio famiglia 5120. Not a civil death act.' },
      { type: 'Civil Death Record', status: 'Searching', notes: 'Pre-1861 Borbonic records — not yet searched' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'To Feliciani Angela Maria — not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Pre-unitary parish records, likely Chiesa di Lisciano' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Identified via foglio 5120. Landowner, Lisciano. Father of Antonio Galanti. Pre-1861 records.',
    }
  },
  {
    id: 'feliciani-angela-maria',
    name: 'Feliciani Angela Maria',
    generation: -2,
    line: 'Buatti',
    gender: 'F',
    birthDate: 'Unknown',
    birthPlace: 'Unknown',
    deathDate: 'Before 1889 (predeceased husband)',
    spouses: ['domenico-galanti'],
    parents: [],
    children: ['antonio-galanti'],
    notes: [
      'CONFIRMED via foglio famiglia 5120: wife of Domenico Galanti (he is listed as "widower of Feliciani Angela Maria").',
      'Presumed mother of Antonio Galanti (b. 1857), Annibale Galanti (b. 1855), and Ottavio Galanti (b. 1863).',
    ],

    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Death Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Wife of Domenico Galanti. Mother of Antonio. Predeceased 1889.',
    }
  },
  {
    id: 'luigi-rosati',
    name: 'Luigi Rosati',
    generation: -2,
    line: 'Buatti',
    gender: 'M',
    birthDate: 'Unknown',
    birthPlace: 'Maltignano (Province of Ascoli Piceno)',
    deathDate: 'Unknown',
    spouses: ['filippini'],
    parents: [],
    children: ['virginia-rosati'],
    notes: [
      'CONFIRMED via foglio famiglia 5120: father of Virginia Rosati (b. 1867).',
      'From Maltignano, a comune ~8km from Ascoli Piceno.',
    ],

    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Death Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Father of Virginia Rosati. From Maltignano.',
    }
  },
  {
    id: 'filippini',
    name: 'Filippini (first name unknown)',
    generation: -2,
    line: 'Buatti',
    gender: 'F',
    birthDate: 'Unknown',
    birthPlace: 'Unknown',
    deathDate: 'Unknown',
    spouses: ['luigi-rosati'],
    parents: [],
    children: ['virginia-rosati'],
    notes: [
      'CONFIRMED via foglio famiglia 5120: mother of Virginia Rosati, wife of Luigi Rosati.',
      'Only the surname Filippini is recorded — first name not given on foglio 5120.',
    ],

    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Death Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Mother of Virginia Rosati. Surname only — first name unknown.',
    }
  },
  {
    id: 'domenico-lenzi',
    name: 'Domenico Lenzi',
    generation: -2,
    line: 'Buatti',
    gender: 'M',
    birthDate: 'Unknown',
    birthPlace: 'Rotella (Province of Ascoli Piceno)',
    deathDate: 'Before 1899 (listed as "fu" on foglio 1527)',
    spouses: ['luigia'],
    parents: [],
    children: ['antonia-lenzi'],
    notes: [
      'CONFIRMED via foglio famiglia N. 1527 (17 Jul 2026): father of Antonia Lenzi, listed as "fu Domenico".',
      'From Rotella (~20km from Ascoli Piceno).',
    ],

    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Death Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Father of Antonia Lenzi. From Rotella. Predeceased 1899.',
    }
  },
  {
    id: 'luigia',
    name: 'Luigia (surname unknown)',
    generation: -2,
    line: 'Buatti',
    gender: 'F',
    birthDate: 'Unknown',
    birthPlace: 'Unknown',
    deathDate: 'Before 1899 (listed as "fu" on foglio 1527)',
    spouses: ['domenico-lenzi'],
    parents: [],
    children: ['antonia-lenzi'],
    notes: [
      'CONFIRMED via foglio famiglia N. 1527 (17 Jul 2026): mother of Antonia Lenzi, listed as "fu Luigia".',
      'Only the given name Luigia is recorded — surname not given on foglio 1527.',
    ],

    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Death Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Mother of Antonia Lenzi. Given name only — surname unknown.',
    }
  },
  {
    id: 'achille-bruni',
    name: 'Achille Bruni',
    generation: -2,
    line: 'Buatti',
    gender: 'M',
    birthDate: 'Unknown',
    birthPlace: 'Likely Ascoli Piceno area',
    deathDate: 'Unknown',
    spouses: ['sperandia-sagretani'],
    parents: [],
    children: ['emidia-bruni'],
    notes: [
      'Father of Emidia Bruni per foglio famiglia N. 1527 (Archivio di Stato di Ascoli Piceno, 17 Jul 2026).',
      'Name from foglio: "Bruni Emidia di Achille e Sperandia Sag[retani?]".',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Death Record', status: 'Not Found', notes: 'Not yet located' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Father of Emidia Bruni per foglio famiglia N. 1527. All other details unknown.',
    }
  },
  {
    id: 'sperandia-sagretani',
    name: 'Sperandia Sagretani',
    generation: -2,
    line: 'Buatti',
    gender: 'F',
    birthDate: 'Unknown',
    birthPlace: 'Unknown',
    deathDate: 'Unknown',
    spouses: ['achille-bruni'],
    parents: [],
    children: ['emidia-bruni'],
    notes: [
      'Mother of Emidia Bruni per foglio famiglia N. 1527. Maiden name from foglio: "Sperandia Sag[retani?]" — lettura incerta, may read differently.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Death Record', status: 'Not Found', notes: 'Not yet located' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Mother of Emidia Bruni per foglio famiglia N. 1527. Maiden name lettura incerta.',
    }
  },

  // --- GENERATION -3: Great-Great-Great-Great-Great-Grandparents (Galanti Line) ---
  {
    id: 'luigi-galanti',
    name: 'Luigi Galanti',
    generation: -3,
    line: 'Buatti',
    gender: 'M',
    birthDate: 'Unknown — likely late 1700s',
    birthPlace: 'Lisciano (frazione of Ascoli Piceno)',
    deathDate: 'Before 1816 (listed as "fu" on foglio 5120)',
    spouses: ['vincenza-michetti'],
    parents: [],
    children: ['domenico-galanti'],
    notes: [
      'CONFIRMED via foglio famiglia 5120: father of Domenico Galanti (b. 1816), listed as "fu Luigi" (the late Luigi).',
      'Likely born late 1700s in Lisciano.',
    ],

    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Death Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Father of Domenico Galanti. Pre-unitary records. Predeceased 1816.',
    }
  },
  {
    id: 'vincenza-michetti',
    name: 'Vincenza Michetti',
    generation: -3,
    line: 'Buatti',
    gender: 'F',
    birthDate: 'Unknown',
    birthPlace: 'Unknown',
    deathDate: 'Before 1816 (listed as "fu" on foglio 5120)',
    spouses: ['luigi-galanti'],
    parents: [],
    children: ['domenico-galanti'],
    notes: [
      'CONFIRMED via foglio famiglia 5120: mother of Domenico Galanti, listed as "fu Vincenza Michetti".',
    ],

    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Death Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Mother of Domenico Galanti. Predeceased 1816.',
    }
  },

  // Chiappini Line
  {
    id: 'remo-chiappini',
    name: 'Remo Chiappini',
    generation: 1,
    line: 'Chiappini',
    gender: 'M',
    birthDate: 'Unknown / to be confirmed',
    deathDate: 'Unknown / to be confirmed',
    spouses: ['irma-pirri'],
    parents: [],
    children: ['bruna-lilia-chiappini'],
    siblings: ['At least one son'],
    notes: [
      'Father of Bruna Lilia Chiappini — confirmed via Branxton Catholic Parish marriage register extract (4 Oct 1952, Ezio Buatti + Lilia Chiappini). Wife: Irma Pirri. Both residing in Ascoli Piceno, Italy.',
      'Family account (relayed by Alfred Buatti, originally from an aunt): Remo\'s wife (possibly Irma) survived childbirth — contrary to an earlier family assumption that she had died giving birth — but contracted an infection (tuberculosis).',
      'Remo was reportedly sent away to a port town referred to as "San Giorgio" to keep him away from their son, and his wife died about a month later.',
      'Details (which son, exact location/town of "San Giorgio," and dates) still need confirming, as this was relayed informally.',
      'NSW marriage certificate 27340/1952 (Ezio + Lilia, 4 Oct 1952): Remo recorded as LIVING as of 4 Oct 1952 (no "deceased" notation — only Irma carries it). Recorded occupation: Labourer; birthplace per certificate: Italy (no town stated).'
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found — entirely unknown' },
      { type: 'Marriage Record', status: 'Requested', notes: 'To Irma Pirri — San Benedetto del Tronto, 1930. Copia integrale of the 1930 marriage act requested from SBT anagrafe (Rosa De Falco) — email sent Aug 2026. The act names both sets of parents. Also recorded as father on NSW marriage cert 27340/1952.' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ,
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'In Progress',
      details: 'Name confirmed as father of Lilia via Branxton marriage extract 10 Jul 2026. Wife now named (Irma Pirri). 1930 marriage act (Remo × Irma) requested from SBT anagrafe (Rosa De Falco) — the act will name both sets of parents. Remo\'s own details still unknown.',
      nextSteps: [
        'Await Rosa De Falco reply (SBT anagrafe) re copia integrale of the 1930 marriage act — it will name both sets of parents.',
        'Search for Remo Chiappini records in San Benedetto del Tronto or Ascoli Piceno.',
        'Confirm the "San Giorgio" story and locate the town (possibly Porto San Giorgio in Fermo, Marche).',
        'Search for birth records of Remo Chiappini in San Benedetto del Tronto or Ascoli Piceno.'
      ]
    }
  },
  {
    id: 'irma-pirri',
    name: 'Irma Pirri',
    generation: 1,
    line: 'Chiappini',
    gender: 'F',
    birthDate: 'Unknown / to be confirmed',
    deathDate: 'Unknown / to be confirmed',
    spouses: ['remo-chiappini'],
    parents: [],
    children: ['bruna-lilia-chiappini'],
    notes: [
      'Mother of Bruna Lilia Chiappini, confirmed via Branxton Catholic Parish marriage register extract (4 Oct 1952, Ezio Buatti + Lilia Chiappini). Listed as "Irma Pirri", residing in Ascoli Piceno, Italy.',
      'The family story about Remo\'s wife dying of tuberculosis after childbirth (relayed via Alfred Buatti from an aunt) may refer to Irma or may refer to a different wife — unclear whether the story involves the mother of a son (not Lilia) or Irma herself.',
      'KEY FINDING (Aug 2026): Irma Pirri was ALREADY DEAD by 4 October 1952 — recorded on the NSW marriage certificate (reg. 27340/1952, Maitland district) for Ezio Buatti + Lilia Chiappini. Death window 1930–1952, almost certainly at San Benedetto del Tronto; she would have been at most about forty. The narrowest unexplored question in the Chiappini line — nobody has searched for her death record.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Name now known — search Ascoli Piceno area' },
      { type: 'Marriage Record', status: 'Requested', notes: 'To Remo Chiappini — San Benedetto del Tronto, 1930 (Lilia born Jul 1930). Copia integrale of the 1930 marriage act requested from SBT anagrafe (Rosa De Falco) — email sent Aug 2026. The act names both sets of parents.' },
      { type: 'Death Record', status: 'Searching', notes: 'DIED BEFORE 4 Oct 1952 (recorded on NSW marriage cert 27340/1952). Window 1930–1952, probably San Benedetto del Tronto. Route: Curia di San Benedetto del Tronto — Sig.ra Veccia already has a request circulating among the SBT parishes; a burial record would sit in those registers. Thread warm, do not poke before September.' }
    ,
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'In Progress',
      details: 'Name confirmed as Lilia Chiappini\'s mother via Branxton marriage extract 10 Jul 2026. KEY: already dead by 4 Oct 1952 (NSW marriage cert 27340/1952) — death window 1930–1952, probably San Benedetto del Tronto. 1930 marriage act (Remo × Irma) requested from SBT anagrafe.',
      nextSteps: [
        'Act after September: ask Curia di San Benedetto del Tronto (Sig.ra Veccia) for Irma Pirri\'s death/burial record in the SBT parish registers.',
        'Await Rosa De Falco reply (SBT anagrafe) re copia integrale of the 1930 marriage act — it names both sets of parents.',
        'Search for birth records of Irma Pirri in Ascoli Piceno or San Benedetto del Tronto.',
        'Ask papa about Irma Pirri and whether the TB story relates to her.'
      ]
    },
    sources: [
      {
        title: 'NSW Marriage Certificate (Ezio Buatti + Lilia Chiappini)',
        type: 'Marriage Certificate',
        reference: 'Reg. 27340/1952, Maitland district, NSW. Records Irma Pirri as deceased by 4 Oct 1952. Ordered via NSW BDM Jul 2026.'
      },
      {
        title: 'Branxton Catholic Parish Marriage Extract',
        type: 'Parish Register',
        reference: 'Ezio Buatti + Lilia Chiappini, 4 Oct 1952, St Anthony\'s Greta. Names parents Remo Chiappini + Irma Pirri. Issued 10 Jul 2026.'
      }
    ]
  },
  // Emmi Line
  {
    id: 'egidio-emmi',
    name: 'Egidio Emmi',
    generation: 1,
    line: 'Emmi',
    gender: 'M',
    birthDate: '~1870 (age 30 at marriage on 4 Nov 1900)',
    birthPlace: 'Linguaglossa, Province of Catania, Sicily, Italy',
    occupation: 'Farmer (contadino)',
    deathDate: 'Deceased prior to 1943',
    notes: [
      'Recorded as "DEC" on Gregorio\'s 1943 POW report, and as "fu Egidio" (the late Egidio) on the 1949 Comune di Linguaglossa certificate.',
      'Parents: fu Antonino Emmi (bracciante, b. ~1849, d. 11 Mar 1889) + Rosaria Nasti (surname confirmed by two independent clerks: Carmelo Vecchio in Antonino\'s death act 1889, and Concetto Scarlata in marriage act 1900. The "Raiti" in the banns was a clerical slip). Given name "Rosaria" (reads "Rocaria/Rosaria" in both acts).',
      'Married Concetta Sgroi on 4 Nov 1900 in Linguaglossa (atto № 59). Officer: Concetto Scarlata. Witnesses: Cassaniti Vincenzo (40, contadino) and Arlotta Giuseppe (23). Both spouses illiterate.',
      'Father Antonino died when Egidio was ~19. Family lived on Via S. Egidio — Egidio\'s name likely derives from the street.',
      'Father was a bracciante (day labourer), NOT the same Antonino (industrioso, son of Francesco) who fathered the other Egidio Emmi (1868).',
      'Banns (pubblicazioni) issued 8 Sep 1900, act n. 59 (same number as marriage act — coincidental). Published Sundays 9 and 16 Sep 1900. ~7-week gap between banns and wedding — slightly unusual, banns stayed valid. The marriage act\'s reference to "last month" (October) was likely loose boilerplate or a misreading of "settembre scorso"; the banns record is authoritative for September.',
      'Had at least one older son (that son\'s family now in Venezuela — per Connie Emmi 28 Jun 2026).',
      'NOT the same person as Egidio Emmi (b. 5 Sep 1868, son of Antonino [son of Francesco] + Rosa Vecchio) who married Angela Nasti on 2 Jul 1900 — same father name, different mother, different Antonino (son of Francesco, industrioso vs ours: bracciante). Definitively distinguished.',
    ],
    spouses: ['concetta-sgroi'],
    parents: ['antonino-emmi', 'rosaria-nasti'],
    children: ['gregorio-emmi', 'emmi-older-brother-venezuela'],
    records: [
      { type: 'Birth Record', status: 'Searching', notes: '~1870, Linguaglossa. Cited as issued in banns processetti — definitely exists in Nati registers (DGS 7841071). Allegati volume for 1900 not filmed (1894–1910 gap). Not yet located in Nati 1868-1871 or 1873-1874. Remaining years: 1866, 1867, 1872, and pre-1866 Borbonic series.' },
      { type: 'Marriage Record', status: 'Found', notes: 'Marriage act atto № 59, 4 Nov 1900, Linguaglossa. Officer: Concetto Scarlata. Witnesses: Cassaniti Vincenzo (40), Arlotta Giuseppe (23). Both illiterate. Banns also atto № 59 (8 Sep 1900) — coincidental same number. CORRECTS earlier banns which had wrong mother (Raiti — clerical slip), father (Salvatore), age (20), and bride occupation (contadina vs industriosa).' },
      { type: 'Death Record', status: 'Found', notes: 'Pre-1943 per POW report — confirmed "fu Egidio" on 1949 certificate' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Marriage act found (4 Nov 1900, atto № 59). Parents: Antonino Emmi (bracciante, d. 1889) + Rosaria Nasti. Surname Nasti confirmed by independent clerks Vecchio (1889) and Scarlata (1900). Age ~30 (born ~1870). Farmer. Illiterate.',
      nextSteps: [
        'TRIBUNALE DEAD END (22 Jul 2026): Dott. Stefano Marino confirmed officials are not authorized to search the archive. Directed to Comune di Catania (likely boilerplate). Allegati route via Tribunale closed.',
        'NEW ROUTE: Email Comune di Linguaglossa anagrafe (anagrafe@comune.linguaglossa.ct.it) — ask if they hold a local duplicate of atto 59/1900 allegati. Draft email prepared.',
        'Search remaining Nati years: 1867 (first), 1872, 1866, and pre-1866 Borbonic series.',
        'Hunt the household: scan every Emmi birth for siblings of Antonino + Rosaria Nasti.',
        'Check Santa Maria delle Grazie baptism registers on FamilySearch.',
      ]
    },
    sources: [
      {
        title: 'Gregorio Emmi 1943 POW Report',
        type: 'Military Record',
        reference: 'NAA: MP1103/2, 55491'
      },
      {
        title: '1949 Comune di Linguaglossa Certificate',
        type: 'Civil Certificate',
        reference: 'fu Egidio notation'
      },
      {
        title: 'Linguaglossa Marriage Act 1900',
        type: 'Civil Record',
        reference: 'Atto № 59, 4 Nov 1900. Egidio Emmi (30) + Concetta Sgroi (23). Parents: fu Antonino Emmi + Rosaria Nasti (groom); Gregorio Sgroi + Santa Calì (bride). Officer: Concetto Scarlata. Witnesses: Cassaniti Vincenzo, Arlotta Giuseppe.'
      },
      {
        title: 'Linguaglossa Banns (Pubblicazioni) 1900',
        type: 'Civil Record',
        reference: 'Atto № 59, 8 Sep 1900. Published 9 & 16 Sep 1900. Witnesses: De Francesco Francesco (~44, guardia), Cesareo Giacomo (40). Confirms banns dates. Both acts by same officer Concetto Scarlata.'
      },
      {
        title: 'Antonino Emmi Death Act 1889',
        type: 'Civil Record',
        reference: 'Linguaglossa Morti 1889, atto n. 27. Died 11 Mar 1889, age 40, bracciante, husband of Rosaria Nasti, son of fu Antonino + fu Nunzia Pavone. Officer: Carmelo Vecchio.'
      }
    ]
  },
  {
    id: 'concetta-sgroi',
    name: 'Concetta Sgroi',
    generation: 1,
    line: 'Emmi',
    gender: 'F',
    birthDate: '10 March 1877',
    birthPlace: 'Linguaglossa, Province of Catania, Sicily, Italy',
    occupation: 'Industriosa (home-based textile/domestic work)',
    deathDate: 'Deceased prior to 1967',
    spouses: ['egidio-emmi'],
    parents: ['gregorio-sgroi', 'santa-cali'],
    children: ['gregorio-emmi', 'emmi-older-brother-venezuela'],
    notes: [
      'Birth record found 10 Jul 2026: Linguaglossa Nati 1877, atto n. 58. Born 10 Mar 1877 at 5:46 PM, via Liotto 120. Registered 11 Mar 1877. Father: Gregorio Sgroi (27, falegname). Mother: Santa Calì (industriosa). Witnesses: Mariano Vecchio (24), Pietro Stagnitti (22). Officer: Carmelo Vecchio. Margin: married Egidio Emmi di fu Antonino, 4 Nov 1900.',
      'Maiden name confirmed via Gregorio\'s 1943 Report on Prisoners of War; an earlier guess of "Sofia Concetta" is superseded.',
      'Occupation: "industriosa" (home-based textile/domestic work, per banns), NOT "contadina" as previously recorded. Her mother Santa Calì was also industriosa.',
      'The earlier banns (pubblicazioni, 8 Sep 1900, same officer Scarlata) recorded father as Salvatore Sgroi and age as 20 — both errors corrected by the marriage ceremony (4 Nov 1900). Banns witnesses: De Francesco Francesco (~44, guardia) and Cesareo Giacomo (40, possibly mugnaio).',
      'Gregorio\'s own daughter Concetta was very likely named after this grandmother.',
      'Had at least one older son (that son\'s family migrated to Venezuela — per Connie Emmi 28 Jun 2026).',
      'Egidio and Concetta are both illiterate per the 1900 marriage record — neither signed.'
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: 'Atto n. 58, 11 Mar 1877, Linguaglossa Nati 1877 (Antenati). Born 10 Mar 1877 at 5:46 PM, via Liotto 120. Father: Gregorio Sgroi (27, falegname). Mother: Santa Calì (industriosa). Witnesses: Mariano Vecchio (24), Pietro Stagnitti (22). Officer: Carmelo Vecchio. Margin: married Egidio Emmi 4 Nov 1900. Link: https://antenati.cultura.gov.it/ark:/12657/an_ua81372/LeG9zQR (page 23).' },
      { type: 'Marriage Record', status: 'Found', notes: 'Marriage act atto № 59, 4 Nov 1900, Linguaglossa. Officer: Concetto Scarlata. CORRECTS earlier banns (8 Sep 1900). Bride age 23, father Gregorio Sgroi.' },
      { type: 'Death Record', status: 'Not Found', notes: 'Pre-1967 per later church records. Exact date unknown.' },
      { type: 'Surname Confirmation', status: 'Found', notes: '"Sgroi" confirmed via Gregorio\'s 1943 POW record and 1900 marriage record' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Birth record found 10 Jul 2026 (atto n. 58, 11 Mar 1877, Linguaglossa Nati). Parents confirmed: Gregorio Sgroi (falegname, b. ~1850) + Santa Calì (industriosa). Born 10 Mar 1877 at via Liotto 120. Married Egidio Emmi 4 Nov 1900.',
      nextSteps: [
        'Tribunale di Catania cannot search archives (confirmed 22 Jul 2026). Allegati route closed. Try Comune di Linguaglossa directly — ask if they hold local duplicate of atto 59/1900 allegati (contains both Egidio\'s and Concetta\'s birth acts).',
        'Search for Gregorio Sgroi\'s birth ~1850 in Linguaglossa.',
        'Search for Santa Calì\'s birth records.',
        'Search for Concetta\'s death record (pre-1967).'
      ]
    },
    sources: [
      {
        title: 'Linguaglossa Nati 1877, Atto n. 58 (Antenati)',
        type: 'Civil Registry',
        reference: 'Concetta Sgroi, born 10 Mar 1877 to Gregorio Sgroi (27, falegname) + Santa Calì (industriosa). Via Liotto 120. Margin: married Egidio Emmi 4 Nov 1900.'
      },
      {
        title: 'Gregorio Emmi 1943 POW Report',
        type: 'Military Record',
        reference: 'NAA: MP1103/2, 55491 (records "Mother\'s Pre-marriage Name: Sgroi Concetta")'
      },
      {
        title: 'Linguaglossa Marriage Act 1900',
        type: 'Civil Record',
        reference: 'Atto № 59, 4 Nov 1900. Egidio Emmi (30) + Concetta Sgroi (23). Parents: Gregorio Sgroi + Santa Calì. Officer: Concetto Scarlata. Witnesses: Cassaniti Vincenzo, Arlotta Giuseppe.'
      },
      {
        title: 'Linguaglossa Banns (Pubblicazioni) 1900',
        type: 'Civil Record',
        reference: 'Atto № 59, 8 Sep 1900. Same officer. Corrects earlier misread: Concetta = industriosa, not contadina. Witnesses: De Francesco Francesco (~44, guardia), Cesareo Giacomo (40, possibly mugnaio).'
      }
    ]
  },
  // Patanè Line
  {
    id: 'rosario-patane-sr',
    name: 'Rosario Patanè',
    generation: 1,
    line: 'Patanè',
    gender: 'M',
    birthDate: '8 February 1889',
    birthPlace: 'Contrada Trifilippi, Calatabiano, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown / to be confirmed',
    occupations: ['Castaldo (farm manager)', 'Bracciante (day labourer)'],
    residences: ['Contrada Trappitelli, Calatabiano', 'Sezione Castello, Fiumefreddo di Sicilia'],
    spouses: ['venera-vecchio'],
    parents: ['sebastiano-patane-sr', 'rosaria-dagata'],
    children: ['rosaria-patane', 'sebastiano-patane'],
    notes: [
      'Civil birth record found (28 Jun 2026): Antenati, Calatabiano Nati 1889, atto n. 28. Born 8 Feb 1889 at 4:15 AM in Contrada Trifilippi, Calatabiano. Declared 10 Feb 1889.',
      'DATE DISCREPANCY: Civil record says 8 Feb (4:15 AM); baptism extract says 9 Feb ("born yesterday" on 10 Feb). Civil record is the legal document, so 8 Feb 1889 is the official date.',
      'Father at birth: Sebastiano Patanè (39, castaldo/farm manager). Mother: Rosaria D\'Agata (his legitimate wife).',
      'Witnesses at registration: Sebastiano Intelisano (60, bracciante) & Giuseppe Intelisano (30, bracciante). Both illiterate.',
      'MARRIAGE ACT FOUND: Atto 12, 23 April 1911, Fiumefreddo Matrimoni 1911 Parte I. Married Venera Vecchio (23, casalinga, born Fiumefreddo). Officer: Luigi Continella, assessore titolare. Time: 7:10 PM. Witnesses: Giuseppe Cardone (27, calzolaio) & Rosario Pagano (23, bracciante). Groom\'s parents present, giving consent. Bride\'s father Vincenzo Vecchio (47, bracciante) present. LITERATE: Rosario signed his own name — first literate generation; his father Sebastiano could not write.',
      'Banns (atto 8, 2 Apr 1911): confirmed Rosario born Calatabiano, age 22, bracciante. Bride\'s mother named as Rosaria Raiti (not Raciti). Both spouses resident Fiumefreddo over a year. Publications affixed 9 and 16 April, completed 19 April.',
      'Church marriage: 24 Apr 1911, Fiumefreddo. Liber Matrimoniorum N.18. Witnesses: Ascenzio Giuliano & Rosario Pagano. Celebrated by Fr. Eutichio Scarcella.',
      'Second witness Rosario Pagano — almost certainly kin of Orazio Pagano, who married Rosario\'s sister Venera six months later. The two families were already interlinked in April.',
      'Age 34 in May 1924, per Rosaria\'s birth record.',
      'Baptism certificate (10 Feb 1889, Calatabiano) found in marriage processetti packet. Baptized by Sac. Salvatore Catalano, godfather Giuseppe Caruso.',
      'RULED OUT (28 June 2026): A 1923 marriage banns for a Rosario Patanè (son of Michele Patanè & Caterina Mangano) marrying Grazia Coco — different person.',
      'RULED OUT: Calatabiano Nati 1884 atto 103 — Rosario Patanè (son of Giuseppe Patanè × Francesca Prestipino) — different person.',
      'NAA file A446, 1967/39646 (Item ID 7775953) requested — access application RK26/00009589 submitted 28 Jun 2026.',
      'Giuseppe Patanè (born 4 Feb 1887) confirmed as brother via civil birth act.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '8 Feb 1889, Calatabiano — atto n. 28, Antenati. Born at 4:15 AM in Contrada Trifilippi. Father: Sebastiano Patanè (39, castaldo). Mother: Rosaria D\'Agata.' },
      { type: 'Baptismal Record', status: 'Found', notes: '9/10 Feb 1889, Calatabiano. Baptized by Sac. Salvatore Catalano. Godfather: Giuseppe Caruso.' },
      { type: 'Marriage Banns (Civil)', status: 'Found', notes: 'Atto 8, 2 Apr 1911, Fiumefreddo Matrimoni 1911 Parte I. Confirms Rosario born Calatabiano, age 22, bracciante. Bride\'s mother: Rosaria Raiti. Publications affixed 9 & 16 Apr, completed 19 Apr.' },
      { type: 'Marriage Record (Civil)', status: 'Found', notes: 'Atto 12, 23 Apr 1911, Fiumefreddo Matrimoni 1911 Parte I. Married Venera Vecchio (23). Officer: Luigi Continella. Witnesses: Giuseppe Cardone (27, calzolaio), Rosario Pagano (23, bracciante). Groom signed (literate). Bride, second witness, and parents could not write.' },
      { type: 'Marriage Record (Church)', status: 'Found', notes: '24 Apr 1911, Fiumefreddo. Liber Matrimoniorum N.18. Witnesses: Ascenzio Giuliano & Rosario Pagano. Celebrated by Fr. Eutichio Scarcella.' },
      { type: 'Death Record', status: 'Not Found', notes: 'Unknown — Morti search window opens Nov 1911 (film 2278546 / DGS 7851868)' },
      { type: 'NAA File (A446 1967/39646)', status: 'Searching', notes: 'Requested 28 Jun 2026 — due 2 Nov 2026' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Birth act (8 Feb 1889, Calatabiano n. 28), baptism (9/10 Feb 1889), banns (atto 8, 2 Apr 1911), and marriage act (atto 12, 23 Apr 1911) all found. Literate (signed his name). Married Venera Vecchio. Parents and children confirmed from primary sources.',
      nextSteps: [
        'Search Fiumefreddo Morti 1911–1928 (film 2278546 / DGS 7851868) for Rosario\'s death.',
        'Investigate connection to Pietro Patanè (cane farm owner in Ingham).',
        'Await NAA file A446, 1967/39646.'
      ]
    },
    sources: [
      {
        title: 'Civil Birth Register (Calatabiano)',
        type: 'Civil Registry',
        reference: 'Nati 1889, atto n. 28 (Antenati)'
      },
      {
        title: 'Rosaria Patanè Civil Birth Record',
        type: 'Civil Registry',
        reference: 'Numero 71, Fiumefreddo di Sicilia, 1924'
      },
      {
        title: 'Parish Marriage Certificate (28 Mar 1911)',
        type: 'Ecclesiastical Record',
        reference: 'Parrocchia Maria SS.ma Immacolata, Fiumefreddo di Sicilia'
      },
      {
        title: 'Diocesan Marriage Record (24 Apr 1911)',
        type: 'Ecclesiastical Record',
        reference: 'Curia Parochialis, Fiumefreddo di Sicilia'
      },
      {
        title: 'Baptism Certificate Extract (Calatabiano, 10 Feb 1889)',
        type: 'Ecclesiastical Record',
        reference: 'Processetti Matrimoniali, Fiumefreddo 1911 — issued by Archipresbyter Vincentius Carupio, 28 Mar 1911'
      }
    ]
  },
  {
    id: 'venera-vecchio',
    name: 'Venera Vecchio',
    generation: 1,
    line: 'Patanè',
    gender: 'F',
    birthDate: '8 January 1888',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Deceased by 1953',
    occupations: ['Casalinga (housewife)', 'Tailor (sartora)'],
    residences: ['Sezione Castello, Fiumefreddo di Sicilia'],
    spouses: ['rosario-patane-sr'],
    parents: ['vincenzo-vecchio', 'rosaria-raiti'],
    children: ['rosaria-patane', 'sebastiano-patane'],
    notes: [
      'Surname confirmed via Rosaria\'s civil birth record (1924).',
      'Recalled in family memory as a tailor (sartora).',
      'Recorded as "fu Venera" (the late Venera) on a 1953 Comune di Fiumefreddo photo-identity certificate.',
      'Note the recurrence of the name "Venera" in this family line, later given to her granddaughter Venera Buatti.',
      'BREAKTHROUGH (28 Jun 2026): Baptism register entry found — Fiumefreddo Battesimi 1762-1904, folio 240, entry n. 8. Exact birth date: 8 January 1888. Full name recorded as "Veneranda Vecchio." Baptized same day by Rev. Nicola Sgarlata. Godparents: Alfio Musumeci Casalino & Maria Raciti (daughter of Giuseppe). Midwife: Concetta Marano.',
      'Margin note in baptism register: "Matrim. fuit de [---] cum Rosario Patanè die 24 Aprilis 1911."',
      'Nickname: "Ni Ni Na" (Nenina?) per family memory (Connie Emmi, 28 Jun 2026).',
      'RULED OUT (28 Jun 2026): A 1923 marriage banns for a Venera Vecchio (daughter of Carmelo Vecchio & Rosaria Ragonesi) marrying Giuseppe Di Blasi was investigated and confirmed to be a different person.',
      'SURNAME CORRECTION: Earlier sources (Liber Matrimoniorum N.18, parish marriage cert) recorded mother as "Raciti." The 1911 civil banns (atto 8) and marriage act (atto 12, both by officer Continella) both clearly read Raiti. Two independent acts settle it: mother is Rosaria Raiti, not Raciti. "Rapisardi" on the marriage certificate was a separate scribal error.',
      'Marriage: 23 April 1911, atto 12, Fiumefreddo Matrimoni 1911 Parte I. Groom: Rosario Patanè (22, bracciante, born Calatabiano). Bride: Venera Vecchio (23, casalinga, born Fiumefreddo). Officer: Luigi Continella, assessore titolare. Witnesses: Giuseppe Cardone (27, calzolaio) & Rosario Pagano (23, bracciante). Both spouses resident Fiumefreddo over a year. Groom\'s parents present, giving consent. Signed: Rosario Patanè and Giuseppe Cardone (bride, second witness, and parents could not write).',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '6 Jan 1888, atto 6, Fiumefreddo Nati 1888 (DGS 7836468). Father: Vincenzo Vecchio (24, bracciante). Mother: Rosaria Raiti (raciti in this act — variant of Raiti). Margin note: marriage 23 Apr 1911.' },
      { type: 'Baptism Record', status: 'Found', notes: '8 Jan 1888, Fiumefreddo. Baptized same day by Rev. Nicola Sgarlata. Godparents: Alfio Musumeci Casalino & Maria Raciti. Midwife: Concetta Marano. Full name: Veneranda. Entry n. 8, folio 240.' },
      { type: 'Marriage Record (Civil)', status: 'Found', notes: 'Atto 12, 23 Apr 1911, Fiumefreddo Matrimoni 1911 Parte I. Groom: Rosario Patanè (22, bracciante, born Calatabiano). Bride: Venera Vecchio (23, casalinga, born Fiumefreddo). Parents: Vincenzo Vecchio (47, bracciante) & Rosaria Raiti (casalinga) — bride\'s parents; Sebastiano Patanè (61, bracciante) & Rosaria D\'Agata (casalinga) — groom\'s parents. Witnesses: Giuseppe Cardone (27, calzolaio), Rosario Pagano (23, bracciante). Officer: Luigi Continella.' },
      { type: 'Marriage Record (Church)', status: 'Found', notes: '24 Apr 1911, Fiumefreddo. Liber Matrimoniorum N.18. Witnesses: Ascenzio Giuliano & Rosario Pagano. Celebrated by Fr. Eutichio Scarcella.' },
      { type: 'Death Record', status: 'Searching', notes: 'Death window: 1930–1953 (absent from Morti 1911–1929; "fu Venera" on 1953 cert confirms deceased by 1953). Under 100-year embargo. QLD BDM search needed if she emigrated.' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Baptism found 28 Jun 2026 (Fiumefreddo Battesimi 1762-1904, fol. 240 n. 8). Civil birth found: atto 6, 6 Jan 1888 (Fiumefreddo Nati 1888, DGS 7836468). Marriage act found: atto 12, 23 Apr 1911 (Fiumefreddo Matrimoni 1911). Parents: Vincenzo Vecchio (47, bracciante) & Rosaria Raiti. Mother\'s surname corrected from Raciti to Raiti per two independent 1911 acts. Death pre-1953.',
      nextSteps: [
        'Search Fiumefreddo Nati ~1886–1887 indices for possible elder siblings (Sebastiana or Sebastiano Vecchio — naming-convention hypothesis).',
        'Death window: 1930–1953 (absent from Fiumefreddo Morti through 1929; "fu Venera" on 1953 cert). Every year under 100-year embargo — no film will show it. Two scenarios: died in Fiumefreddo 1930–1953 (comune territory) or followed Rosario to Australia and died there pre-1953 (QLD BDM, free index).',
        'QLD BDM historical index search (free, online): Deaths — surname Patane/Patanè, given Venera/Veneranda, ~1930–1953; also try maiden Vecchio.',
        'Ask Connie Emmi: did Venera ever leave Sicily? What was the 1953 certificate for and whose? (Smells like paperwork for someone\'s emigration — possibly Rosaria and Gregorio\'s, or Sebastiano\'s.)',
        'Ryerson + Trove: Patane, Ingham QLD — funeral notices for the whole family cluster.',
        'Investigate connection to Leonardo Vecchio (co-signer of Rosaria\'s accommodation guarantee in Ingham).',
      ]
    },
    sources: [
      {
        title: 'Rosaria Patanè Civil Birth Record',
        type: 'Civil Registry',
        reference: 'Numero 71, Fiumefreddo di Sicilia, 1924'
      },
      {
        title: 'Comune di Fiumefreddo Photo-Identity Certificate',
        type: 'Civil Certificate',
        reference: '1953 (records "fu Venera")'
      },
      {
        title: 'Fiumefreddo Matrimoni 1911, Atto 12 (Civil Marriage)',
        type: 'Civil Registry',
        reference: '23 Apr 1911. Rosario Patanè (22) × Venera Vecchio (23). Officer: Luigi Continella. Witnesses: Giuseppe Cardone, Rosario Pagano.'
      },
      {
        title: 'Fiumefreddo Matrimoni 1911, Pubblicazioni Atto 8 (Banns)',
        type: 'Civil Registry',
        reference: '2 Apr 1911. Groom born Calatabiano. Bride\'s mother: Rosaria Raiti.'
      },
      {
        title: 'Parish Marriage Certificate (24 Apr 1911)',
        type: 'Ecclesiastical Record',
        reference: 'Liber Matrimoniorum N.18, Fiumefreddo di Sicilia'
      },
      {
        title: 'Parish Baptism Register (1888)',
        type: 'Ecclesiastical Record',
        reference: 'Fiumefreddo Battesimi 1762-1904, folio 240, entry n. 8 (8 Jan 1888)'
      }
    ]
  },
  // --- GENERATION 1 SIBLINGS: Rosario Patanè's Brother & Sister ---
  {
    id: 'giuseppe-patane-sibling',
    name: 'Giuseppe Patanè',
    generation: 1,
    line: 'Patanè',
    gender: 'M',
    birthDate: '4 February 1887',
    birthPlace: 'Contrada Trifilippi, Calatabiano, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['sebastiana-guglielmino'],
    parents: ['sebastiano-patane-sr', 'rosaria-dagata'],
    children: [],
    notes: [
      'Brother of Rosario Patanè.',
      'Civil birth act found: Calatabiano Nati 1887, atto n. 31. Born 4 February 1887 at 7:20 AM in Contrada Trifilippi, Calatabiano. Declared 6 February 1887 by father Sebastiano Patanè (37, bracciante). Mother: Rosaria D\'Agata. Witnesses: Leonardo Fazio (72, possidente) and Giuseppe Napoli (30, bracciante). All illiterate. Officer: Francesco Raineri Vecchio.',
      'MARRIAGE ACT FOUND: Atto 8, 19 February 1911, 9:10 AM, Fiumefreddo Matrimoni 1911 Parte I, before Luigi Continella. Groom: Giuseppe Patanè, celibe, 23, bracciante, born Calatabiano. Bride: Sebastiana Gugliandolo, nubile, 20, casalinga, born Fiumefreddo, daughter of fu Michele (death act 31 Jan 1911) and Caterina Mangano.',
      'Groom\'s parents and bride\'s mother consented at the banns. Giuseppe signed (literate — a second literate son after Rosario); the bride could not.',
      'Witnesses: Rosario Menardello (22, insegnante — a schoolteacher, a small step up the social ladder among the witnesses) and Giuseppe Ligresti (47, muratore).',
      'Bride\'s father: the late Michele (death act dated 31 January 1911 among the documents). Mother: Caterina Mangano (not Strangano — corrected per marriage act).',
      'Age 23 at marriage — consistent with February 1887 birth to within days.',
      'First direct documentary sighting of Rosaria D\'Agata as a living named mother in a civil act.',
      'Three of Sebastiano and Rosaria\'s children married in 1911: Giuseppe (~Feb), Rosario (~Apr), Venera III (~Oct). Parents attended all three.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '4 Feb 1887, Calatabiano — atto n. 31, Nati 1887. Father: Sebastiano Patanè (37, bracciante). Mother: Rosaria D\'Agata.' },
      { type: 'Marriage Record (Civil)', status: 'Found', notes: 'Atto 8, 19 Feb 1911, 9:10 AM, Fiumefreddo Matrimoni 1911 Parte I. Bride: Gugliandolo Sebastiana (20, casalinga, daughter of the late Michele & Caterina Mangano). Publications 5 & 12 Feb. Groom\'s parents and bride\'s mother consented at banns. Giuseppe signed (literate); bride could not. Witnesses: Rosario Menardello (22, insegnante), Giuseppe Ligresti (47, muratore).' },
      { type: 'Marriage Record (Church)', status: 'Found', notes: '20 Feb 1911, Fiumefreddo (parish). Groom: Giuseppe Patanè. Bride: Sebastiana Guglielmino.' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Civil birth act (atto 31/1887, Calatabiano) and marriage act (atto 8, 19 Feb 1911, Fiumefreddo Matrimoni 1911 Parte I) both found. Parents confirmed. Bride\'s mother: Caterina Mangano (not Strangano). Giuseppe was literate. Witnesses: Rosario Menardello (insegnante) and Giuseppe Ligresti (muratore).',
      nextSteps: []
    }
  },
  {
    id: 'venera-patane-sibling',
    name: 'Venera Patanè (second, died in infancy)',
    generation: 1,
    line: 'Patanè',
    gender: 'F',
    birthDate: '22 October 1885',
    birthPlace: 'Contrada Trifilippi, Calatabiano, Province of Catania, Sicily, Italy',
    deathDate: '6 March 1889',
    deathPlace: 'Calatabiano, Province of Catania, Sicily, Italy',
    parents: ['sebastiano-patane-sr', 'rosaria-dagata'],
    children: [],
    notes: [
      'Sister of Rosario Patanè — born after the family\'s move from Fiumefreddo to Calatabiano.',
      'SECOND Venera — the first (b. 13 Mar 1879, Fiumefreddo) died aged 9 months. This daughter received the reused name.',
      'Civil birth act: Calatabiano Nati 1885, atto n. 160. Born 22 October 1885 at 4:20 PM, Contrada Trifilippi, Calatabiano. Declared 24 October 1885 by father Sebastiano Patanè (35, castaldo). Mother: Rosaria D\'Agata. Witnesses: Leonardo Fazio (70) and Salvatore Scalora (70).',
      'DEATH: Calatabiano Morti 1889, atto n. 20. Died 6 March 1889, aged 3. Rosario was born 4 weeks before her death (8 Feb 1889).',
      'Name reuse: the name Venera was given again to the next daughter (Venera III, b. 14 Feb 1891) — the survivor who married Orazio Pagano.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '22 Oct 1885, Calatabiano — atto n. 160, Nati 1885. Contrada Trifilippi. Father: Sebastiano Patanè (35, castaldo). Mother: Rosaria D\'Agata.' },
      { type: 'Death Record', status: 'Found', notes: '6 Mar 1889, Calatabiano — atto n. 20, Morti 1889. Aged 3 years, ~4 months.' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Second bearer of the name Venera (first died 1879, this one died age 3 in 1889). Born Calatabiano 1885 after the family\'s Fiumefreddo→Calatabiano move. Died 4 weeks after brother Rosario\'s birth. NOT the Venera who married Orazio Pagano — that was Venera III (b. 1891).',
      nextSteps: []
    }
  },
  {
    id: 'venera-patane-pagano',
    name: 'Venera Patanè (third, married Pagano)',
    generation: 1,
    line: 'Patanè',
    gender: 'F',
    birthDate: '14 February 1891',
    birthPlace: 'Calatabiano, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    occupations: ['Casalinga (homemaker)'],
    residences: ['Fiumefreddo di Sicilia'],
    spouses: ['orazio-pagano-sibling'],
    parents: ['sebastiano-patane-sr', 'rosaria-dagata'],
    children: [],
    notes: [
      'THIRD Venera Patanè — the survivor. First two Veneras (b. 1879, b. 1885) both died before age 4.',
      'Civil birth act: Calatabiano Nati 1891, atto n. 31. Born 14 February 1891 in Calatabiano.',
      'MARRIAGE ACT: Atto 26, 8 October 1911, Fiumefreddo Matrimoni 1911 Parte I. Celebrated 8 Oct 1911 at 6:20 PM at the Casa Comunale of Fiumefreddo Sicilia, before Luigi Continella (assessore titolare — the same officer who married Rosario in April and ran all the banns).',
      'Groom: Pagano Orazio, celibe, 25, bracciante, born Acireale, resident Fiumefreddo, son of Santo (resident Fiumefreddo) and the late Rosaria Leonardi (fu).',
      'Bride: Patanè Venera, nubile, 20, casalinga, born Calatabiano, resident Fiumefreddo, daughter of Sebastiano (resident Fiumefreddo) and D\'Agata Rosaria (resident Fiumefreddo) — no fu, both still living.',
      'Witnesses: Angelo Calì (26, bracciante) and Giuseppe Grioli (23, industrioso). Bride\'s parents\' consent was recorded as given at the banns. Neither spouse could sign — the witnesses and officer signed alone.',
      'LITERACY NOTE: Of Sebastiano\'s children, the sons Rosario and Giuseppe signed their acts; the daughters did not — schooling in that generation ran along gender lines.',
      'Margin note on civil birth act: "unita in matrimonio con Pagano Orazio di Santo, atto dell\'8 ottobre 1911, scritto in Fiumefreddo, n. 26." The earlier reading of "trascritto" was over-interpreted — the wedding happened right in Fiumefreddo.',
      'Mother recorded as "Ignazia D\'Agata" on civil banns (scribal variation for Rosaria).',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '14 Feb 1891, Calatabiano — atto n. 31, Nati 1891. Margin note: married Orazio Pagano, atto 8 Oct 1911, Fiumefreddo n. 26.' },
      { type: 'Marriage Banns (Civil)', status: 'Found', notes: 'Atto 21, Sep 1911, Fiumefreddo Matrimoni 1911 Parte I. Publications 24 Sep & 1 Oct, completed 4 Oct.' },
      { type: 'Marriage Record (Civil)', status: 'Found', notes: 'Atto 26, 8 Oct 1911, Fiumefreddo Matrimoni 1911 Parte I. Celebrated 6:20 PM at Casa Comunale, Fiumefreddo, before Luigi Continella. Groom: Pagano Orazio (25, bracciante, born Acireale, son of Santo & fu Rosaria Leonardi). Bride: Patanè Venera (20, casalinga, born Calatabiano). Bride\'s father Sebastiano (61) present, consenting. Witnesses: Angelo Calì (26, bracciante), Giuseppe Grioli (23, industrioso). Neither spouse could sign.' },
      { type: 'Marriage Banns (Civil)', status: 'Found', notes: 'Atto 21, Sep 1911, Fiumefreddo Matrimoni 1911 Parte I. Publications 24 Sep & 1 Oct, completed 4 Oct.' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Third bearer of the name Venera. Born Calatabiano 1891, survived to adulthood. Married Orazio Pagano 1911. The family had returned to Fiumefreddo by this time (siblings married there 1905, 1906, 1911).',
      nextSteps: []
    }
  },
  // --- ADDITIONAL CHILDREN OF SEBASTIANO × ROSARIA (Fiumefreddo-born, before the Calatabiano posting) ---
  {
    id: 'leonarda-patane-fiumefreddo',
    name: 'Leonarda Patanè',
    generation: 1,
    line: 'Patanè',
    gender: 'F',
    birthDate: '25 May 1877',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    parents: ['sebastiano-patane-sr', 'rosaria-dagata'],
    children: [],
    notes: [
      'Firstborn daughter of Sebastiano Patanè and Rosaria D\'Agata — named for paternal grandmother Leonarda Buonaventura.',
      'Fiumefreddo Nati 1877, atto 40. Born 25 May 1877 in Fiumefreddo.',
      'First of four children born in Fiumefreddo before the family\'s move to Calatabiano (~1884).',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '25 May 1877, Fiumefreddo — atto 40, Nati 1877.' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Birth confirmed Fiumefreddo Nati 1877 atto 40. Firstborn, named for paternal grandmother.',
    }
  },
  {
    id: 'venera-patane-infant',
    name: 'Venera Patanè (first, died in infancy)',
    generation: 1,
    line: 'Patanè',
    gender: 'F',
    birthDate: '13 March 1879',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: '13 December 1879',
    deathPlace: 'Sezione Feudogrande, Fiumefreddo di Sicilia',
    parents: ['sebastiano-patane-sr', 'rosaria-dagata'],
    children: [],
    notes: [
      'First Venera Patanè — named for maternal grandmother Venera Maccarrone.',
      'Birth: Fiumefreddo Nati 1879, atto 20. Born 13 March 1879.',
      'DEATH: Fiumefreddo Morti 1879, atto 58. Died 13 December 1879 at 9 PM, aged 9 months (exactly 9 months to the day). Declared 14 Dec 1879. Parents confirmed in death act: Sebastiano Patanè (bracciante) and Rosaria D\'Agata (bracciante). Declarants: Nicolò Panarello (gravedigger) and Salvatore Raiti.',
      'Name reuse: the name Venera was given to the next daughter born in Calatabiano (22 Oct 1885) — Venera Patanè II (died age 3, 1889). Given a third time to the next daughter (14 Feb 1891) — Venera III, the survivor who married Orazio Pagano.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '13 Mar 1879, Fiumefreddo — atto 20, Nati 1879.' },
      { type: 'Death Record', status: 'Found', notes: '13 Dec 1879, Fiumefreddo — atto 58, Morti 1879. Aged 9 months. Declared by Nicolò Panarello and Salvatore Raiti. Confirms parents Sebastiano Patanè + Rosaria D\'Agata.' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Birth and death both confirmed in Fiumefreddo records. Name reused twice: Venera II (1885, died age 3) and Venera III (1891, married Pagano).',
    }
  },
  {
    id: 'mariano-patane-jr',
    name: 'Mariano Patanè',
    generation: 1,
    line: 'Patanè',
    gender: 'M',
    birthDate: '20 September 1880',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: '21 November 1928',
    parents: ['sebastiano-patane-sr', 'rosaria-dagata'],
    children: [],
    notes: [
      'Firstborn son of Sebastiano Patanè and Rosaria D\'Agata — named for paternal grandfather Mariano Patanè.',
      'Fiumefreddo Nati 1880, atto 62. Born 20 September 1880.',
      'Married Stefana Andolaro in Fiumefreddo (Matrimoni 1905, atto 2). Marriage act would restate his parents — free triple-confirmation.',
      'DEATH ACT FOUND: Fiumefreddo Morti 1928, atto n. 60 (DGS 7851868). Died 21 November 1928, age ~48. Death act lists father Sebastiano Patanè as domiciliato in Fiumefreddo (confirming Sebastiano was still alive at age ~78).',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '20 Sep 1880, Fiumefreddo — atto 62, Nati 1880.' },
      { type: 'Marriage Record', status: 'Found', notes: '1905, Fiumefreddo — atto 2. Married Stefana Andolaro.' },
      { type: 'Death Record', status: 'Found', notes: '21 Nov 1928, Fiumefreddo — atto n. 60, Morti 1928 (DGS 7851868). Age ~48. Father listed as domiciliato in Fiumefreddo.' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Birth (atto 62/1880), marriage (atto 2/1905 to Stefana Andolaro), and death (atto 60/1928) all found. Death act confirms father Sebastiano still alive, domiciliato in Fiumefreddo.',
    }
  },
  {
    id: 'salvatore-patane-fiumefreddo',
    name: 'Salvatore Patanè',
    generation: 1,
    line: 'Patanè',
    gender: 'M',
    birthDate: '12 October 1883',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    parents: ['sebastiano-patane-sr', 'rosaria-dagata'],
    children: [],
    notes: [
      'Named for maternal grandfather Salvatore D\'Agata.',
      'Fiumefreddo Nati 1883, atto [circa 37-38]. Born 12 October 1883.',
      'Last child born in Fiumefreddo before the family\'s move to Calatabiano (~1884-85).',
      'Married Rosa Bottaro in Fiumefreddo (Matrimoni 1906, 17 December). Marriage act restates parents.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '12 Oct 1883, Fiumefreddo — Nati 1883.' },
      { type: 'Marriage Record', status: 'Found', notes: '17 Dec 1906, Fiumefreddo — married Rosa Bottaro.' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Birth confirmed Fiumefreddo Nati 1883. Married 1906 to Rosa Bottaro. Last Fiumefreddo-born child before the Calatabiano move.',
    }
  },
  {
    id: 'sebastiana-guglielmino',
    name: 'Sebastiana Guglielmino',
    generation: 1,
    line: 'Patanè',
    gender: 'F',
    birthDate: 'c. 1891 (age 20 at marriage, Feb 1911)',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['giuseppe-patane-sibling'],
    parents: [],
    children: [],
    notes: [
      'Wife of Giuseppe Patanè (brother of Rosario).',
      '20 years old, casalinga, residing in Fiumefreddo in 1911.',
      'Daughter of the late Michele Guglielmino/Gugliandolo & Caterina Mangano (not Strangano — corrected per marriage act atto 5).',
      'Surname variants across records: Guglielmino, Gugliandalo, Gugliandolo, Cogliandolo.',
      'Father\'s death act (dated 31 January 1911) was among the marriage documents.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'c. 1891, likely Fiumefreddo' },
      { type: 'Marriage Record', status: 'Found', notes: 'Atto 5, Fiumefreddo Matrimoni 1911 Parte I (~early Feb 1911). Married Giuseppe Patanè (23). Publications 5 & 12 Feb.' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Marriage confirmed via Fiumefreddo Matrimoni 1911 atto 5. Parents: the late Michele & Caterina Mangano.',
      nextSteps: ['Search Fiumefreddo records for her birth.']
    }
  },
  {
    id: 'orazio-pagano-sibling',
    name: 'Orazio Pagano',
    generation: 1,
    line: 'Patanè',
    gender: 'M',
    birthDate: 'c. 1886',
    birthPlace: 'Acireale, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['venera-patane-pagano'],
    parents: [],
    children: [],
    notes: [
      'Husband of Venera Patanè (third, b. 1891, sister of Rosario) — the survivor who married in 1911.',
      '25 years old, bracciante, resident Fiumefreddo in 1911. Born Acireale (stated explicitly in banns and marriage act).',
      'Son of Santo Pagano (54, fruttaiuolo/fruit grower) & the late Rosaria Leonardi.',
      'MARRIAGE ACT: Atto 26, 8 October 1911, Fiumefreddo Matrimoni 1911 Parte I. Celebrated 8 Oct 1911 at 6:20 PM at the Casa Comunale of Fiumefreddo Sicilia, before Luigi Continella. Publications 24 Sep & 1 Oct, completed 4 Oct. Bride\'s father Sebastiano Patanè (61) present, giving consent. Neither spouse could sign.',
      'Second witness at Rosario × Venera Vecchio\'s wedding (23 Apr 1911) was Rosario Pagano (23, bracciante) — almost certainly kin of Orazio.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'c. 1886, Acireale — not yet located' },
      { type: 'Marriage Banns (Civil)', status: 'Found', notes: 'Atto 21, Sep 1911, Fiumefreddo Matrimoni 1911 Parte I. Groom born Acireale. Publications 24 Sep & 1 Oct, completed 4 Oct.' },
      { type: 'Marriage Record (Civil)', status: 'Found', notes: 'Atto 26, 8 Oct 1911, Fiumefreddo Matrimoni 1911 Parte I. Celebrated 6:20 PM at Casa Comunale, Fiumefreddo, before Luigi Continella. Groom: Pagano Orazio (25, bracciante, born Acireale, son of Santo & fu Rosaria Leonardi). Bride: Patanè Venera (20, casalinga, born Calatabiano). Bride\'s father Sebastiano (61) present, consenting. Witnesses: Angelo Calì (26, bracciante), Giuseppe Grioli (23, industrioso). Neither spouse could sign.' },
      { type: 'Marriage Banns (Civil)', status: 'Found', notes: 'Atto 21, Sep 1911, Fiumefreddo Matrimoni 1911 Parte I. Groom born Acireale. Publications 24 Sep & 1 Oct, completed 4 Oct.' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Marriage act found: atto 26, 8 Oct 1911 (Fiumefreddo Matrimoni 1911 Parte I). Celebrated at Casa Comunale, Fiumefreddo, before Luigi Continella. Born Acireale, son of Santo Pagano & fu Rosaria Leonardi. Neither spouse could sign.',
      nextSteps: ['Search Acireale records for his birth (~1886).']
    }
  },

  // --- EXCLUDED AS SIBLING: Salvatore Patanè (son of Antonino, not Sebastiano) ---
  {
    id: 'salvatore-patane-possible-sibling',
    name: 'Salvatore Patanè',
    generation: 1,
    line: 'Patanè',
    gender: 'M',
    birthDate: '15 September 1875',
    birthPlace: 'Calatabiano, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['maria-sgarlato'],
    parents: [],
    children: ['rosaria-patane-salvatore-daughter'],
    notes: [
      'Civil birth act found: Calatabiano Nati 1875, atto n. 93. Born 15 Sep 1875 at 9:30 PM, Via Annunziata, Calatabiano. Father: Antonino Patanè (40, falegname/carpenter). Mother: Maria Catena Panessi [lettura incerta — possibly Pennisi or Panebianco]. Witnesses: two shoemakers, illiterate. Officer: Mayor Giuseppe Macherone.',
      'EXCLUDED as sibling of Rosario Patanè — parents are Antonino Patanè & Maria Catena, NOT Sebastiano & Rosaria D\'Agata.',
      'Age 34 at daughter Rosaria\'s birth (Feb 1911) = born ~1876-77, close enough to this 15 Sep 1875 birth to be the same person.',
      'Occupation: bracciante (day labourer), same as Rosario but different father. Shares the Patanè surname from a separate household (Antonino Patanè line, falegname trade).',
      'No documentary link to Rosario\'s family. "Possible sibling" hypothesis ruled out.',
      'Exclusion log — three additional Salvatore Patanè births in Calatabiano 1876-1879, all excluded (none di Sebastiano): atto 6/1876 (Salvatore di Paolo Patanè, 42, falegname × Giorgina Giordano — likely died infant, name reused 1878); atto 17/1878 (Salvatore di Paolo Patanè, 44, falegname × Giorgina Giordano, secondo — Paolo literate, signed); atto 110/1879 (Salvatore di Mario Patanè, 26, sarto × Sebastiana Sciacca).',
      'Four Salvatores across 1875-1879, fathers: Antonino, Paolo (×2), Mario — all falegname/sarto, none bracciante/castaldo. Sebastiano reads as an outsider posted to an estate, distinct from the local carpenter Patanè clan.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '15 Sep 1875, Calatabiano — atto n. 93, Nati 1875. Father: Antonino Patanè (40, falegname). Mother: Maria Catena Panessi. Via Annunziata. Officer: Sindaco Giuseppe Macherone.' },
      { type: 'Birth of Daughter (Rosaria)', status: 'Found', notes: '10 Feb 1911, Fiumefreddo — daughter Rosaria born to Salvatore Patanè (34, bracciante) & Maria Sgarlato. Contrada Panormitana No. 2.' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Ruled Out',
      details: 'Birth act found (atto 93/1875, Calatabiano). Parents: Antonino Patanè (falegname) + Maria Catena Panessi. Excluded as sibling. Four Salvatore Patanè births in Calatabiano 1875-1879 (Antonino, Paolo ×2, Mario) — none di Sebastiano. Calatabiano birthplace exhausted for this couple.',
      nextSteps: [
        'Log Antonino Patanè (falegname, b. ~1835) as a separate Patanè family line in Calatabiano.',
        'Search for marriage of Salvatore Patanè (di Antonino) & Maria Sgarlato to confirm parents named.',
        'Fiumefreddo Matrimoni ~1874-1886 and Fiumefreddo Nati ~1876-1886 now the primary pivot.',
      ]
    }
  },
  {
    id: 'maria-sgarlato',
    name: 'Maria Sgarlato',
    generation: 1,
    line: 'Patanè',
    gender: 'F',
    birthDate: 'Unknown',
    deathDate: 'Unknown',
    spouses: ['salvatore-patane-possible-sibling'],
    parents: [],
    children: ['rosaria-patane-salvatore-daughter'],
    notes: [
      'Wife of Salvatore Patanè (son of Antonino Patanè, falegname — separate line from Rosario\'s family).',
      'Villica (farmworker) residing in Contrada Panormitana, Fiumefreddo in 1911.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'To Salvatore Patanè (di Antonino) — not yet located' },
    ],
    researchStatus: {
      status: 'Outstanding',
      details: 'Name confirmed via daughter\'s birth record. Husband identified as Salvatore Patanè di Antonino (atto 93/1875 Calatabiano). All other details unknown.'
    }
  },
  {
    id: 'rosaria-patane-salvatore-daughter',
    name: 'Rosaria Patanè (1911, di Salvatore)',
    generation: 2,
    line: 'Patanè',
    gender: 'F',
    birthDate: '10 February 1911',
    birthPlace: 'Fiumefreddo di Sicilia, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: [],
    parents: ['salvatore-patane-possible-sibling', 'maria-sgarlato'],
    children: [],
    notes: [
      'Daughter of Salvatore Patanè (di Antonino) & Maria Sgarlato — NOT the same Rosaria who married Gregorio Emmi.',
      'Registered 13 Feb 1911, born 10 Feb 1911 at 10:15 PM, Contrada Panormitana No. 2.',
      'Baptised 21 Feb 1912 at the local parish.',
      'NOT a cousin of Rosaria Patanè Emmi (b. 1924) — Salvatore excluded as sibling of Rosario (different parents: Antonino Patanè & Maria Catena, not Sebastiano & Rosaria D\'Agata).',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '10 Feb 1911, Fiumefreddo — civil birth act' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Ruled Out',
      details: 'Birth record confirmed. Salvatore\'s birth act (atto 93/1875 Calatabiano) names parents Antonino Patanè + Maria Catena Panessi — separate Patanè line from Rosario\'s family.',
    }
  },
  // --- 1904 Ida Candidate's Siblings (unconfirmed — awaiting marriage cert tiebreaker) ---
  {
    id: 'galanti-alessandro',
    name: 'Alessandro Galanti',
    generation: 0,
    line: 'Buatti',
    gender: 'M',
    birthDate: '~1895 (13 Jul vs 8 Nov — document disagreement; trust official stato civile extract)',
    birthPlace: 'Ascoli Piceno',
    deathDate: '16 October 1917',
    deathPlace: 'Hospital in Cividale, Italy',
    deathCause: 'Septic gangrene in both legs',
    occupations: ['Soldier, 238° Reggimento Fanteria, 10ª Compagnia'],
    spouses: [],
    parents: ['ignazio-galanti', 'clementina-curcozzi'],
    children: [],
    notes: [
      'BREAKTHROUGH (22 Jul 2026): First hard evidence that Ignazio Galanti + Clementina Curcozzi were a real couple with children in Ascoli Piceno — makes 1904 Ida candidate more credible.',
      'WWI Morti allegati (an_ua8575, 6-Div 2): fu Ignazio Galanti, mother Clementina Curcozzi. Soldier, 238° Reggimento Fanteria, 10ª Compagnia. Died 16 Oct 1917 at hospital in Cividale from septic gangrene. Remains repatriated to Ascoli Piceno 28 Jul 1923.',
      'Official birth certificate extract confirms: son of Ignazio + Curcozzi Clementina, born Ascoli Piceno.',
      'Two documents disagree on birth date: handwritten allegato says 13 Jul 1895, official certificate says 8 Nov 1895. Both agree on year.',
      'PENDING: Brother of 1904 Ida Galanti candidate — NOT confirmed as Alfredo\'s wife\'s brother yet.',
    ],
    records: [
      { type: 'Death Record (WWI)', status: 'Found', notes: '16 Oct 1917, Cividale. Morti allegati, an_ua8575 (6-Div 2). Soldier, 238° Rgt Fanteria, 10ª Compagnia. Septic gangrene. Remains repatriated 28 Jul 1923.' },
      { type: 'Birth Record', status: 'Found (extract)', notes: '~1895, Ascoli Piceno. Official certificate extract: son of Ignazio + Curcozzi Clementina.' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'WWI death record and birth certificate extract confirm identity. Son of Ignazio Galanti + Clementina Curcozzi.',
      nextSteps: ['Check remaining Morti allegati divisions for more Galanti siblings.']
    }
  },

  // --- GENERATION 0: Great-Great-Grandparents (Emmi Line) ---
  {
    id: 'antonino-emmi',
    name: 'Antonino Emmi',
    generation: 0,
    line: 'Emmi',
    gender: 'M',
    birthDate: '~1849 (age 40 at death, 11 Mar 1889)',
    birthPlace: 'Linguaglossa, Province of Catania, Sicily, Italy',
    occupation: 'Bracciante (day labourer)',
    deathDate: '11 March 1889',
    deathPlace: 'Via S. Egidio, Linguaglossa',
    spouses: ['rosaria-nasti'],
    parents: ['antonino-emmi-sr', 'nunzia-pavone'],
    children: ['egidio-emmi'],
    notes: [
      'DEATH ACT FOUND: Morti 1889, atto n. 27, Linguaglossa. Died 11 Mar 1889 at 2:20 PM, aged 40, born ~1849, bracciante. Declarants: Gregorio Pennisi (60, municipal guard) and Antonino D\'Amico (50, gravedigger). Died in house on Via S. Egidio — note: his son is named Egidio, possibly after the street/saint.',
      'Husband of Rosaria Nasti (the word reads "Nasti" in Carmelo Vecchio\'s hand — independent clerk from Scarlata, strongly corroborating Nasti over Raiti).',
      'Son of fu Antonino and fu Nunzia Pavone (reading of surname to verify on original).',
      'Officer: Carmelo Vecchio. Witnesses: Gaetano Petrone (47) and Mariano Vecchio (27). Declarants illiterate.',
      'Confirmed as "fu Antonino" at Egidio\'s marriage (4 Nov 1900). Died 11 years before Egidio married.',
      'Occupation: bracciante (day labourer) — NOT the same as the other Antonino Emmi (son of Francesco, industrioso, ~1842) who fathered the other Egidio (1868).',
      'The name Egidio for his son may derive from Via S. Egidio where the family lived.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located in Nati ~1848-1850, Linguaglossa' },
      { type: 'Death Record', status: 'Found', notes: 'Morti 1889, atto n. 27 — died 11 Mar 1889, age 40, bracciante, husband of Rosaria Nasti, son of fu Antonino + fu Nunzia Pavone' }
    ,
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'Confirmed',
      details: 'Death act found 11 Mar 1889. Confirms occupation bracciante, wife Rosaria Nasti, parents Antonino + Nunzia Pavone.',
      nextSteps: [
        'Search Nati ~1848-1850 for Antonino\'s birth record (son of Antonino + Nunzia Pavone).',
        'Nasti surname now strongly corroborated by independent clerk Carmelo Vecchio.'
      ]
    }
  },
  {
    id: 'rosaria-nasti',
    name: 'Rosaria Nasti',
    generation: 0,
    line: 'Emmi',
    gender: 'F',
    birthDate: 'Unknown — possibly ~1850-1855 (wife of Antonino ~1849)',
    deathDate: 'Living at time of Egidio\'s marriage (1900)',
    spouses: ['antonino-emmi'],
    parents: [],
    children: ['egidio-emmi'],
    notes: [
      'Mother of Egidio Emmi. Surname now strongly corroborated as NASTI, not Raiti.',
      'Recorded as "Nasti" in both Egidio\'s marriage act (atto 59, 4 Nov 1900, by Concetto Scarlata) and Antonino\'s death act (atto 27, 11 Mar 1889, by Carmelo Vecchio). Two independent clerks, 11 years apart, both read "Nasti". The banns "Raiti" (also by Scarlata) appears to be a clerical slip.',
      'Given name uncertain: reads "Rocaria/Rosaria" in both acts.',
      'Living at the time of Egidio\'s marriage (not listed as "fu").',
      'Husband Antonino died when she was ~39-40, Egidio was ~19.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found yet' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ,
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'Confirmed — Surname Resolved',
      details: 'Existence confirmed as mother of Egidio Emmi. Nasti confirmed: independently corroborated by Carmelo Vecchio (Antonino\'s death act, 1889) and Concetto Scarlata (marriage act, 1900). The banns "Raiti" was a clerical slip.'
    }
  },
  {
    id: 'antonino-emmi-sr',
    name: 'Antonino Emmi (senior)',
    generation: -1,
    line: 'Emmi',
    gender: 'M',
    birthDate: 'Unknown — possibly ~1810-1820',
    birthPlace: 'Linguaglossa, Province of Catania, Sicily, Italy',
    occupation: 'Unknown',
    deathDate: 'Deceased by 1889 (listed as "fu" in son\'s death act)',
    spouses: ['nunzia-pavone'],
    parents: [],
    children: ['antonino-emmi'],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Borbonic pre-1866 series' },
      { type: 'Death Record', status: 'Not Found', notes: 'Pre-1866 or prior to records start' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Confirmed father of Antonino Emmi (d. 1889) in death act n. 27/1889. Wife: Nunzia Pavone.',
    }
  },
  {
    id: 'nunzia-pavone',
    name: 'Nunzia Pavone',
    generation: -1,
    line: 'Emmi',
    gender: 'F',
    birthDate: 'Unknown',
    birthPlace: 'Linguaglossa, Province of Catania, Sicily, Italy',
    deathDate: 'Deceased by 1889 (listed as "fu" in son\'s death act)',
    spouses: ['antonino-emmi-sr'],
    parents: [],
    children: ['antonino-emmi'],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Borbonic pre-1866 series' },
      { type: 'Death Record', status: 'Not Found', notes: 'Pre-1866 or prior to records start' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'To Antonino Emmi Sr. — not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Linguaglossa parish records, pre-1866' },
      { type: 'Population Register', status: 'Not Found', notes: 'Pre-1866 Borbonic series — not yet searched' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Confirmed mother of Antonino Emmi (d. 1889) in death act n. 27/1889. Husband: Antonino Emmi Sr. Surname reading to verify on original image.',
    }
  },
  {
    id: 'egidio-emmi-older',
    name: 'Egidio Emmi (the other — son of Antonino + Rosa Vecchio)',
    generation: 1,
    line: 'Emmi',
    gender: 'M',
    birthDate: '5 September 1868',
    birthPlace: 'Linguaglossa, Province of Catania, Sicily, Italy',
    occupation: 'Contadino (farmer)',
    deathDate: 'Unknown',
    notes: [
      'Birth act (7 Sep 1868, atto 141): Born 5 Sep 1868 at 3:00 AM. Declarant: Antonino Emmi (son of Francesco, 26, industrioso). Mother: Rosa Vecchio, 26.',
      'Marriage (2 Jul 1900, Linguaglossa, atto 41): Egidio Emmi, 32, contadino, son of Antonino (LIVING) + Rosa Vecchio. Bride: Angela Nasti, 22, contadina, daughter of Giuseppe Nasti + Anna Lo Giudice. Officer: Concetto Scarlata.',
      'GROOM LITERATE: signed "Io sposo Emmi Egidio" — uniquely valuable for distinguishing from our illiterate Egidio.',
      'Fully mapped and permanently distinguishable from OUR Egidio by three discriminators: (1) father Antonino LIVING (ours: "fu" by 1900); (2) GROOM LITERATE (ours: illiterate); (3) wife Angela Nasti (ours: Concetta Sgroi).',
      'Antonino Emmi (this Egidio\'s father) was son of Francesco, born ~1842, industrioso — a DIFFERENT Antonino from our Egidio\'s father.',
      'The 1895 marriage to "Angela Raiti" previously mentioned was a misreading — corrected by Act 41 to Angela Nasti.',
    ],
    spouses: ['angela-nasti-older'],
    parents: [],
    children: [],
    records: [
      { type: 'Birth Record', status: 'Found', notes: 'Atto 141, 7 Sep 1868, Linguaglossa Nati. Declarant: Antonino Emmi (son of Francesco, 26, industrioso). Mother: Rosa Vecchio, 26.' },
      { type: 'Marriage Record', status: 'Found', notes: 'Atto 41, 2 Jul 1900, Linguaglossa Matrimoni. Egidio Emmi (32, son of Antonino + Rosa Vecchio) married Angela Nasti (22, daughter of Giuseppe Nasti + Anna Lo Giudice). Officer: Concetto Scarlata. Groom literate (signed).' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ],
    researchStatus: {
      status: 'Confirmed — Fully Mapped',
      details: 'Birth act (1868 atto 141) and marriage (1900 atto 41) both found. Father Antonino (son of Francesco) living at marriage. Literate. Wife Angela Nasti. Three discriminators from our Egidio.',
      nextSteps: [
        'Search for his death record.',
      ]
    }
  },
  {
    id: 'angela-nasti-older',
    name: 'Angela Nasti',
    generation: 1,
    line: 'Emmi',
    gender: 'F',
    birthDate: '~1878 (age 22 at marriage 2 Jul 1900)',
    spouses: ['egidio-emmi-older'],
    parents: [],
    children: [],
    notes: [
      'Married Egidio Emmi (other) on 2 Jul 1900, Linguaglossa (atto 41).',
      'Age 22 at marriage → born ~1878. Contadina. Daughter of Giuseppe Nasti + Anna Lo Giudice.',
      'Illiterate (did not sign marriage act).',
      'The surname Nasti in this act, written by same clerk Scarlata, matches the letterforms of "Rosaria Nasti" in our Egidio\'s Act 59 — confirms Nasti as the correct reading for our Egidio\'s mother too.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'c. 1878 — search Linguaglossa' },
      { type: 'Marriage Record', status: 'Found', notes: 'Atto 41, 2 Jul 1900, Linguaglossa. Married Egidio Emmi (other).' },
    ],
    researchStatus: { status: 'In Progress' }
  },
  {
    id: 'gregorio-sgroi',
    name: 'Gregorio Sgroi',
    generation: 0,
    line: 'Emmi',
    gender: 'M',
    birthDate: '~1849-1850 (age 27 at Concetta\'s birth, 10 Mar 1877; banns-age 60 was erroneous)',
    occupation: 'Falegname (carpenter)',
    deathDate: 'Unknown',
    spouses: ['santa-cali'],
    parents: [],
    children: ['concetta-sgroi'],
    notes: [
      'Father of Concetta Sgroi, confirmed via Marriage Act (atto № 59, 4 Nov 1900, Linguaglossa) and banns (8 Sep 1900). Officer: Concetto Scarlata.',
      'Age ~60 at banns (Sep 1900) → born ~1840. Occupation: falegname (carpenter) — notably a tradesman, unlike the contadino/salariato pattern in the Emmi line.',
      'Previously thought to be "Salvatore Sgroi" from a misreading of the banns. The marriage ceremony record gives Gregorio.',
      'Listed as living at the time of Concetta\'s marriage (not "fu").',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found yet' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ,
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'Confirmed',
      details: 'Name confirmed as father of Concetta Sgroi via marriage act 4 Nov 1900.'
    }
  },
  {
    id: 'santa-cali',
    name: 'Santa Calì',
    generation: 0,
    line: 'Emmi',
    gender: 'F',
    birthDate: 'Unknown',
    occupation: 'Industriosa (home-based textile/domestic work)',
    deathDate: 'Unknown',
    spouses: ['gregorio-sgroi'],
    parents: [],
    children: ['concetta-sgroi'],
    notes: [
      'Mother of Concetta Sgroi, confirmed via Marriage Act (atto № 59, 4 Nov 1900, Linguaglossa) and banns (8 Sep 1900).',
      'Occupation: industriosa (home-based textile/domestic work, per banns).',
      'Listed as living at the time of Concetta\'s marriage (not "fu").',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found yet' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ,
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'Confirmed',
      details: 'Name confirmed as mother of Concetta Sgroi via marriage act 4 Nov 1900.'
    }
  },

  // --- GENERATION 0: Great-Great-Grandparents (Patanè Line) ---
  {
    id: 'sebastiano-patane-sr',
    name: 'Sebastiano Patanè',
    generation: 0,
    line: 'Patanè',
    gender: 'M',
    birthDate: '13 March 1850',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['rosaria-dagata'],
    parents: ['mariano-patane', 'leonarda-buonaventura'],
    children: ['leonarda-patane-fiumefreddo', 'venera-patane-infant', 'mariano-patane-jr', 'salvatore-patane-fiumefreddo', 'venera-patane-sibling', 'giuseppe-patane-sibling', 'rosario-patane-sr', 'venera-patane-pagano'],
    notes: [
      'BIRTH ACT FOUND: Fiumefreddo Nati 1850, atto n. 15. Born 13 March 1850 at 11 PM. Declared 14 Mar 1850 by midwife Antonina Nicotra (48). Parents: Mariano Patanè (33, bracciante) + Leonarda Buonaventura (31). Baptised 14 Mar 1850.',
      'MARRIAGE FOUND: Fiumefreddo Matrimoni 1876, atto 5 (3 May 1876). Pubblicazioni atto 4 (13 Apr 1876). Age 26, bracciante.',
      'ALLEGATI (fasc. 5): 5 documents — birth extracts (21 Apr 1876), banns cert, two poverty certs.',
      'FATHER of 8 known children: Leonarda (1877), Venera I (1879-d. infancy), Mariano (1880), Salvatore (1883), Venera II (1885-d. age 3), Giuseppe (1887), Rosario (1889), Venera III (1891-survivor). Five of six surviving children have documented marriages (all in Fiumefreddo): Mariano (1905), Salvatore (1906), Giuseppe (Feb 1911), Rosario (Apr 1911), Venera III (Sep 1911). Only Leonarda (b. 1877) remains unaccounted for.',
      'ALIVE through at least November 1928 — listed as domiciliato in Fiumefreddo on his son Mariano\'s death act (atto 60, 21 Nov 1928), age ~78. Physically present at three weddings in 1911 (Giuseppe, Rosario, Venera III), consistently age 61 (born ~1849–50, triple-confirmed). No "fu" anywhere. Rosaria died 3 Mar 1916; Sebastiano survived her by at least 12 years.',
      'MORTI: Rosaria D\'Agata found — Morti 1916, atto 11 (DGS 7851868), died 3 Mar 1916, parents named: Salvatore D\'Agata + Venera Maccarrone. Sebastiano NOT found on film (DGS 7851868 covers Morti 1911, 1913–1928, 1912 missing). Comune email sent requesting death date or annotazione di morte on birth act (atto 15/1850).',
      'Son Mariano\'s death act (atto 60, 21 Nov 1928, Fiumefreddo Morti 1928) confirms Sebastiano was still alive at age ~78, domiciliato in Fiumefreddo.',
      'Occupation: bracciante → castaldo (by 1885). The Calatabiano years (~1884–1893) were a temporary posting at Contrada Trifilippi.',
      'Sibling: Giuseppa Patanè × Alfio Vecchio (1880).',
      'The 1877–1880 witness Salvatore Raiti at three of Sebastiano\'s children\'s births may be a maternal-side connection — the Raiti surname is now confirmed as Venera Vecchio\'s mother\'s maiden name (Rosaria Raiti, corrected from Raciti per two 1911 acts).',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '13 Mar 1850, Fiumefreddo — atto n. 15 (Nati 1850). Declared by midwife Antonina Nicotra. Parents: Mariano Patanè (33, bracciante) + Leonarda Buonaventura (31). Baptised 14 Mar 1850.' },
      { type: 'Marriage Record', status: 'Found', notes: '3 May 1876, Fiumefreddo — atto 5. Pubblicazioni atto 4 (13 Apr 1876). Groom: 26, bracciante. Bride: Rosaria D\'Agata (21, industriosa).' },
      { type: 'Marriage Allegati', status: 'Found', notes: 'Fascicolo n. 5, 5 documents: banns, poverty certs (×2), birth extracts of both spouses (21 Apr 1876).' },
      { type: 'Death Record', status: 'Searching', notes: 'Not found on Fiumefreddo Morti 1911–1928 film (DGS 7851868). Last confirmed alive 21 Nov 1928 (domiciliato in Fiumefreddo per atto 60 — son Mariano\'s death act). Comune email sent requesting death date or annotazione di morte on birth act (atto 15/1850).' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'All Fiumefreddo and Calatabiano records exhausted. 8 known children. Five of six surviving children have documented marriages. Alive through at least Nov 1928 (on son Mariano\'s death act, atto 60). Rosaria died 3 Mar 1916; Sebastiano survived her by 12+ years. Not found on free Morti film — likely died 1929+ (under 100-year embargo at comune).',
      nextSteps: [
        'Await comune reply for Sebastiano\'s death date or annotazione on birth act.',
        'Search for Leonarda Patanè (b. 1877) — the only child without a documented marriage.',
        'Borbonic dig for Generation -2 (pre-1866 Fiumefreddo) waits behind the Morti hunt.'
      ]
    }
  },
  {
    id: 'rosaria-dagata',
    name: 'Rosaria D\'Agata',
    generation: 0,
    line: 'Patanè',
    gender: 'F',
    birthDate: '20 April 1855',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: '3 March 1916',
    spouses: ['sebastiano-patane-sr'],
    parents: ['salvatore-dagata', 'venera-maccarrone'],
    children: ['leonarda-patane-fiumefreddo', 'venera-patane-infant', 'mariano-patane-jr', 'salvatore-patane-fiumefreddo', 'venera-patane-sibling', 'giuseppe-patane-sibling', 'rosario-patane-sr', 'venera-patane-pagano'],
    notes: [
      'BIRTH ACT FOUND: Fiumefreddo Nati 1855, atto n. 28. Born 20 April 1855 at 9 AM. Declared by midwife Donna Rosaria Nicotra (37, prattica ostetrica). Father: Salvatore D\'Agata (38, bracciante). Mother: Venera Maccarrone (37). Baptised 21 April 1855, parish of Fiumefreddo. Witnesses: Santo Puglisi (30, borgese) and Giovanni Raiti (38, bracciante). All illiterate. Sindaco: Rosario Fichera. Full copy in allegati fasc. 5/1876.',
      'Mother of 8 known children: Leonarda (1877), Venera I (1879-d. infancy), Mariano (1880), Salvatore (1883), Venera II (1885-d. age 3), Giuseppe (1887), Rosario (1889), Venera III (1891-survivor).',
      'Marriage: 3 May 1876, Fiumefreddo atto 5. Age 21, industriosa. First child born 13 months later.',
      'Naming conventions confirmed: Leonarda (paternal grandmother), Venera I (maternal grandmother), Mariano (paternal grandfather), Salvatore (maternal grandfather), Venera II (reuse after Venera I\'s infant death — died age 3, 1889), Giuseppe (unknown — possibly paternal great-grandfather), Rosario (unknown), Venera III (reuse again after Venera II\'s death — the survivor who married Pagano 1911).',
      'Both parents alive and physically present at three weddings in 1911 (Giuseppe Feb, Rosario Apr, Venera III Sep), giving consent each time. LAST DOCUMENTED LIVING APPEARANCE: 8 October 1911, at Venera III\'s wedding in Fiumefreddo.',
      'DEATH ACT FOUND: Fiumefreddo Morti 1916, atto n. 11 (DGS 7851868). Died 3 March 1916. Age ~60. Death act names parents: Salvatore D\'Agata and Venera Maccarrone — first documentary confirmation of Generation -2 from the death side.',
      'Her great-granddaughter Rosaria Patanè Emmi (1924-1994) carries the name four generations.',
      'Also "Ignazia D\'Agata" on Venera\'s 1911 banns (scribal variation).',
      'Probable brother: Giovanni D\'Agata (b. ~1840, contadino, literate) — named son Salvatore 1879 (atto 107).',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '20 Apr 1855, Fiumefreddo — atto n. 28 (Nati 1855). Declared by midwife Rosaria Nicotra. Parents: Salvatore D\'Agata (38, bracciante) + Venera Maccarrone (37). Baptised 21 Apr 1855. Full copy in allegati fasc. 5/1876.' },
      { type: 'Death Record', status: 'Found', notes: '3 Mar 1916, Fiumefreddo — atto n. 11, Morti 1916 (DGS 7851868). Parents named: Salvatore D\'Agata + Venera Maccarrone (Generation -2 confirmed).' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Birth, marriage, and death all confirmed. Parents: Salvatore D\'Agata + Venera Maccarrone (confirmed from both birth and death acts). Mother of 8 children. Died 3 Mar 1916, age ~60.',
      nextSteps: []
    }
  },
  // --- ROSARIA'S PROBABLE BROTHER: Giovanni D'Agata ---
  {
    id: 'giovanni-dagata',
    name: 'Giovanni D\'Agata',
    generation: 0,
    line: 'Patanè',
    gender: 'M',
    birthDate: '~1840 (age 39 in 1879)',
    birthPlace: 'Likely Fiumefreddo di Sicilia',
    deathDate: 'Unknown',
    parents: ['salvatore-dagata', 'venera-maccarrone'],
    children: [],
    notes: [
      'Probable brother of Rosaria D\'Agata — named his son Salvatore (1879 atto 107, Fiumefreddo Nati) after their father per naming convention.',
      'Occupation: contadino. Literate (signed "Giovanni Dagata Padre" on son\'s birth act).',
      'Marriage not yet located — wife: Ignazia Pafumi (per son\'s 1879 birth act). Residence: Campagna, Fiumefreddo.',
      'If confirmed as son of Salvatore D\'Agata + Venera Maccarrone, he is Rosaria\'s brother and their parents are confirmed as Generation -1.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: '~1840, Borbonic — not yet located' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'To Ignazia Pafumi — not yet located' },
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Probable brother of Rosaria D\'Agata per naming convention (son Salvatore 1879). Needs confirmation via birth or marriage act naming Salvatore + Venera as parents.',
    }
  },
  // --- GENERATION -1: Great-Great-Great-Grandparents (Patanè Line) ---
  {
    id: 'mariano-patane',
    name: 'Mariano Patanè',
    generation: -1,
    line: 'Patanè',
    gender: 'M',
    birthDate: '~1817 (age 33 at son Sebastiano\'s birth Mar 1850)',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Before April 1876 (recorded as "fu" at son\'s marriage)',
    spouses: ['leonarda-buonaventura'],
    parents: [],
    children: ['sebastiano-patane-sr', 'giuseppa-patane-sibling'],
    notes: [
      'CONFIRMED as father of Sebastiano Patanè via Fiumefreddo Matrimoni atto 5, 3 May 1876. Recorded as "fu Mariano". Son\'s birth act (atto 15/1850) confirms age 33 at time → born ~1817.',
      'Occupation: bracciante (per son\'s birth act).',
      'Also father of Giuseppa Patanè (married Alfio Vecchio Dec 1880).',
      'Death act (pre-1876, Fiumefreddo Morti) names his parents — Generation -2 target.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Pre-1866 Borbonic — Fiumefreddo not yet searched' },
      { type: 'Death Record', status: 'Not Found', notes: 'Before Apr 1876 — search Fiumefreddo Morti pre-1876' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'To Leonarda Buonaventura — not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }
    ],
    researchStatus: {
      status: 'Confirmed — Named Only',
      details: 'Named as deceased father of Sebastiano Patanè in Fiumefreddo Matrimoni atto 5 (3 May 1876). All details unknown beyond name.',
    }
  },
  {
    id: 'leonarda-buonaventura',
    name: 'Leonarda Buonaventura',
    generation: -1,
    line: 'Patanè',
    gender: 'F',
    birthDate: '~1819 (age 31 at son Sebastiano\'s birth Mar 1850)',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown — living in 1876 (not "fu" at son\'s marriage)',
    spouses: ['mariano-patane'],
    parents: [],
    children: ['sebastiano-patane-sr', 'giuseppa-patane-sibling'],
    notes: [
      'CONFIRMED as mother of Sebastiano Patanè via Fiumefreddo Matrimoni atto 5, 3 May 1876. Occupation: industriosa (home-based textile work). Living at time of son\'s marriage (not recorded as "fu").',
      'Also mother of Giuseppa Patanè (married Alfio Vecchio 1880).',
      'Naming convention note: firstborn granddaughter (Rosario\'s daughter Venera, 1885) was named Venera after the maternal grandmother, not Leonarda — suggesting either a Leonarda was born and died in the 1877-1884 gap, or the naming convention wasn\'t strictly followed.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Death Record', status: 'Not Found', notes: 'After 1876 — search Fiumefreddo Morti' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'To Mariano Patanè — not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }
    ],
    researchStatus: {
      status: 'Confirmed — Named Only',
      details: 'Named as living mother of Sebastiano Patanè in Fiumefreddo Matrimoni atto 5 (3 May 1876). Industrious. All other details unknown.',
    }
  },
  {
    id: 'salvatore-dagata',
    name: 'Salvatore D\'Agata',
    generation: -1,
    line: 'Patanè',
    gender: 'M',
    birthDate: '~1817 (age 38 at daughter Rosaria\'s birth Apr 1855, age 59 at her marriage Apr 1876)',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['venera-maccarrone'],
    parents: [],
    children: ['rosaria-dagata'],
    notes: [
      'CONFIRMED as father of Rosaria D\'Agata via Fiumefreddo Matrimoni atto 5, 3 May 1876. Age 38 at Rosaria\'s birth (1855), age 59 at her marriage (1876). Occupation: bracciante.',
      'Wife: Venera Maccarrone (industriosa, living 1876, b. ~1818).',
      'Probable son: Giovanni D\'Agata (b. ~1840, contadino, literate) who named his son Salvatore in 1879 (Fiumefreddo Nati 1879 atto 107) — likely Rosaria\'s brother naming a son after the grandfather.',
      'Death act names his parents — Generation -2 target.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Pre-1866 Borbonic — search Fiumefreddo' },
      { type: 'Death Record', status: 'Not Found', notes: 'Search Fiumefreddo Morti post-1876' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'To Venera Maccarrone — not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }
    ],
    researchStatus: {
      status: 'Confirmed — Named Only',
      details: 'Named as living father of Rosaria D\'Agata in Fiumefreddo Matrimoni atto 5 (3 May 1876). Age 59, bracciante, Fiumefreddo.',
    }
  },
  {
    id: 'venera-maccarrone',
    name: 'Venera Maccarrone',
    generation: -1,
    line: 'Patanè',
    gender: 'F',
    birthDate: '~1818 (age 37 at daughter Rosaria\'s birth Apr 1855)',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown — living in 1876',
    spouses: ['salvatore-dagata'],
    parents: [],
    children: ['rosaria-dagata'],
    notes: [
      'CONFIRMED as mother of Rosaria D\'Agata via Fiumefreddo Matrimoni atto 5, 3 May 1876. Occupation: industriosa (home-based textile work). Living at daughter\'s marriage.',
      'Naming convention: firstborn great-granddaughter Venera Patanè (b. 1885, daughter of Rosaria) was named after this grandmother.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Death Record', status: 'Not Found', notes: 'Search Fiumefreddo Morti post-1876' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'To Salvatore D\'Agata — not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }
    ],
    researchStatus: {
      status: 'Confirmed — Named Only',
      details: 'Named as living mother of Rosaria D\'Agata in Fiumefreddo Matrimoni atto 5 (3 May 1876). Daughter Venera named after her.',
    }
  },
  {
    id: 'giuseppa-patane-sibling',
    name: 'Giuseppa Patanè',
    generation: 0,
    line: 'Patanè',
    gender: 'F',
    birthDate: 'Unknown — likely ~1850s',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: '17 February 1919',
    spouses: ['alfio-vecchio-sibling'],
    parents: ['mariano-patane', 'leonarda-buonaventura'],
    children: [],
    siblings: ['sebastiano-patane-sr'],
    notes: [
      'CONFIRMED sister of Sebastiano Patanè — same parents: fu Mariano Patanè and Leonarda Bonaventura.',
      'Originally identified in Fiumefreddo Pubblicazioni Dec 1880: marriage banns of Alfio Vecchio (24, bracciante, born Fiumefreddo, son of Sebastiano Vecchio and Sebastiana Panebianco) × Giuseppa Patanè (daughter of fu Mariano and Leonarda Bonaventura).',
      'Links the Patanè and Vecchio families two generations before Rosario Patanè married Venera Vecchio in 1911.',
      'Husband Alfio Vecchio (b. ~1856) is NOT the same as Don Alfio Vecchio (b. ~1843, Riposto, civile) who married Teresa Pianella in 1877 — different birth year, birthplace, class, and parents entirely.',
      'DEATH ACT FOUND: Fiumefreddo Morti 1919, atto n. 8 (DGS 7851868). Died 17 February 1919.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located — search Fiumefreddo Nati' },
      { type: 'Marriage Record', status: 'Found', notes: 'Dec 1880, Fiumefreddo — pubblicazioni. Groom: Alfio Vecchio (24, bracciante, son of Sebastiano Vecchio + Sebastiana Panebianco).' },
      { type: 'Death Record', status: 'Found', notes: '17 Feb 1919, Fiumefreddo — atto n. 8, Morti 1919 (DGS 7851868).' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Confirmed as sister of Sebastiano Patanè via pubblicazioni Dec 1880. Marriage and death confirmed. Died 17 Feb 1919. Patanè-Vecchio connection traced two generations deep.',
    }
  },
  {
    id: 'alfio-vecchio-sibling',
    name: 'Alfio Vecchio',
    generation: 0,
    line: 'Patanè',
    gender: 'M',
    birthDate: '~1856 (age 24 in Dec 1880)',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['giuseppa-patane-sibling'],
    parents: [],
    children: [],
    notes: [
      'Husband of Giuseppa Patanè (sister of Sebastiano Patanè Sr.), married Dec 1880 in Fiumefreddo.',
      'Son of Sebastiano Vecchio and Sebastiana Panebianco.',
      'Occupation: bracciante.',
      'NOT the same person as Don Alfio Vecchio (b. ~1843, Riposto, civile class, son of fu Giovanni and Maria Castorina) who married Teresa Pianella in 1877 — different birth year, birthplace, class, and parents.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: '~1856, Fiumefreddo — not yet located' },
      { type: 'Marriage Record', status: 'Found', notes: 'Dec 1880, Fiumefreddo — pubblicazioni. Married Giuseppa Patanè.' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Marriage to Giuseppa Patanè confirmed via Fiumefreddo pubblicazioni Dec 1880. Son of Sebastiano Vecchio + Sebastiana Panebianco.',
    }
  },
  {
    id: 'vincenzo-vecchio',
    name: 'Vincenzo Vecchio',
    generation: 0,
    line: 'Patanè',
    gender: 'M',
    birthDate: '~1863–1864 (age 21 in Feb 1886 marriage; age 24 in Jan 1888 birth act — clerk drift noted)',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    occupations: ['Bracciante (day labourer)'],
    deathDate: 'Unknown',
    spouses: ['rosaria-raiti'],
    parents: ['sebastiano-vecchio', 'sebastiana-panebianco'],
    children: ['venera-vecchio'],
    notes: [
      'Father of Venera Vecchio — confirmed via banns (atto 8) and marriage act (atto 12, Fiumefreddo Matrimoni 1911).',
      'Age 47 in April 1911, bracciante, resident Fiumefreddo. Present in person at daughter\'s wedding (gave consent at banns).',
      'From Fiumefreddo di Sicilia.',
      'MARRIAGE FOUND (20 Jul 2026): Married Rosaria Raiti on 8 Feb 1886, atto 8, Fiumefreddo Matrimoni 1886 (DGS 7841136). Banns published 17 + 24 Jan 1886. Both spouses Fiumefreddo-born — d\'ufficio verification, no extracts needed. Allegati thin by design.',
      'PARENTS CONFIRMED (20 Jul 2026): Per marriage act atto 8 — father: Sebastiano Vecchio (villica?); mother: Sebastiana Panebianco (villica).',
      'Age discrepancy across acts: 21 at marriage (Feb 1886) vs 24 at daughter\'s birth (Jan 1888) — typical Sicilian clerk drift. Actual birth ~1863–1864.',
      'Both alive 23 Apr 1911 (daughter\'s marriage). Absent from Fiumefreddo Morti 1911–1929 → died 1930+ or elsewhere (same pattern as Sebastiano Patanè).',
      'Naming convention note: eldest daughter named Venera (for maternal grandmother Venera Previtera) rather than Sebastiana (for paternal grandmother Sebastiana Panebianco) — suggests either a bent convention or an earlier first daughter named Sebastiana (hypothesis: check Nati 1886–1887 indices).',
      'Disambiguation: Alfio Vecchio (× Giuseppa Patanè, 1880) and Dr. Alfio Vecchio (× Ravella Teresa, 1887) are different people — neither connects to Vincenzo yet.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: '~1863–1864, Fiumefreddo — not yet located. Check Nati 1861–1865 (DGS 7853312) if unlocked.' },
      { type: 'Marriage Record (Civil)', status: 'Found', notes: 'Atto 8, 8 Feb 1886, Fiumefreddo Matrimoni 1886 (DGS 7841136). Banns published 17 + 24 Jan 1886. Both spouses Fiumefreddo-born. Allegati: certificato di pubblicazioni + carta libera per povertà (fascicolo n. 8). Parents named: Sebastiano Vecchio × Sebastiana Panebianco (groom); Salvatore Raiti × Venera Previtera (bride).' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found. Both alive 23 Apr 1911. Absent from Fiumefreddo Morti 1911–1929 → likely died 1930+.' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Name and age confirmed via banns (atto 8) and marriage act (atto 12, Fiumefreddo Matrimoni 1911). Bracciante, ~47 years old. Wife: Rosaria Raiti. Marriage found: 8 Feb 1886, atto 8 (DGS 7841136). Parents: Sebastiano Vecchio × Sebastiana Panebianco.',
      nextSteps: [
        'Nati 1861–1865 (DGS 7853312): browse indices for Vincenzo\'s own birth act — if locked, add to centre-visit list.',
        'Nati 1886–1887 indices: test hypothesis of an elder Sebastiana Vecchio (first daughter) before Venera.',
        'Death: absent from Fiumefreddo Morti 1911–1929 — check later films or comune.',
      ]
    }
  },
  {
    id: 'rosaria-raiti',
    name: 'Rosaria Raiti',
    generation: 0,
    line: 'Patanè',
    gender: 'F',
    birthDate: '~1863–1864 (age 21–22 across two 1886 documents)',
    deathDate: 'Unknown',
    spouses: ['vincenzo-vecchio'],
    parents: ['salvatore-raiti', 'venera-previtera'],
    children: ['venera-vecchio'],
    notes: [
      'Mother of Venera Vecchio. Surname corrected from Raciti to Raiti — two independent 1911 acts (banns atto 8 and marriage atto 12, both by officer Continella) both clearly read Raiti.',
      'SURNAME VARIANTS: Raiti in Matrimoni 1886 atto 8 + pubblicazioni certificato + Matrimoni 1911 atto 12. Raciti in Nati 1888 atto 6 + parish Liber Matrimoniorum. The variant split across independent scribes confirms the spelling is Raiti; "Raciti" is a misreading. "Rapisardi" on the marriage certificate was a separate scribal error.',
      'Salvatore Raiti (1877–1880 Patanè household acts witness) upgraded from speculative to probable — he is Rosaria\'s father, per marriage act atto 8, Fiumefreddo Matrimoni 1886.',
      'Baptism godmother was Maria Raciti (daughter of Giuseppe) — could be a different Rosaria or the same woman with variant spelling; needs resolution via Vecchio-side records.',
      'MARRIAGE FOUND (20 Jul 2026): Married Vincenzo Vecchio on 8 Feb 1886, atto 8, Fiumefreddo Matrimoni 1886 (DGS 7841136). Parents named: Salvatore Raiti (bracciante) × Venera Previtera (villica).',
      'Both alive 23 Apr 1911 (daughter\'s marriage). Absent from Fiumefreddo Morti 1911–1929 → died 1930+ or elsewhere.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: '~1863–1864, Fiumefreddo — not yet located' },
      { type: 'Marriage Record (Civil)', status: 'Found', notes: 'Atto 8, 8 Feb 1886, Fiumefreddo Matrimoni 1886 (DGS 7841136). Banns published 17 + 24 Jan 1886. Parents named: Salvatore Raiti (bracciante) × Venera Previtera (villica).' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found. Both alive 23 Apr 1911. Absent from Fiumefreddo Morti 1911–1929 → likely died 1930+.' }
    ],
    researchStatus: {
      status: 'Confirmed — Surname Corrected',
      details: 'Name confirmed as mother of Venera Vecchio via banns (atto 8) and marriage act (atto 12, Fiumefreddo Matrimoni 1911). Surname: Raiti (not Raciti — corrected per two independent 1911 acts). Marriage found: 8 Feb 1886, atto 8 (DGS 7841136). Parents: Salvatore Raiti (bracciante) × Venera Previtera (villica).'
    }
  },
  {
    id: 'sebastiano-patane',
    name: 'Sebastiano Patanè',
    generation: 2,
    line: 'Patanè',
    gender: 'M',
    birthDate: 'Unknown / to be confirmed',
    deathDate: 'Unknown / to be confirmed',
    occupations: ['Tailor'],
    spouses: [],
    parents: ['rosario-patane-sr', 'venera-vecchio'],
    children: [],
    notes: [
      'Brother of Rosaria Patanè.',
      'Trained his sister Rosaria in tailoring.',
      'Named after his paternal grandfather Sebastiano Patanè (Sr.).',
      'NAA file A446, 1967/39646 (Item ID 7775953) includes a Sebastiano Patanè b. 18 Feb 1936 — could be this person or another Sebastiano. Access application submitted.',
      'Per Connie Emmi (28 Jun 2026): his mother Venera Vecchio had a nickname "Ni Ni Na" (Nenina?).',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found in Fiumefreddo — likely born c. 1920s-1930s' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
      { type: 'NAA File (A446 1967/39646)', status: 'Searching', notes: 'Requested 28 Jun 2026 — due 2 Nov 2026. Includes a Sebastiano Patanè b. 18 Feb 1936' }
    ],
    researchStatus: {
      status: 'Outstanding',
      details: 'Relationship and occupation confirmed. Birth/death dates unknown.',
      nextSteps: [
        'Search for birth record in Fiumefreddo di Sicilia.',
        'Await NAA file A446, 1967/39646.'
      ]
    }
  },

  // --- GENERATION 2: Grandparents ---
  // Buatti Line
  {
    id: 'ezio-buatti',
    name: 'Ezio Buatti',
    generation: 2,
    line: 'Buatti',
    gender: 'M',
    birthDate: '27 April 1923',
    birthPlace: 'Ascoli Piceno, Marche, Italy',
    deathDate: '16 October 1991',
    spouses: ['bruna-lilia-chiappini'],
    parents: ['alfredo-buatti-sr', 'ida-galanti'],
    children: ['alfred-buatti', 'john-buatti-extended'],
    physicalDescription: {
      height: '5 ft 10 in (1.78m)',
      build: 'Normal',
      hair: 'Brown',
      eyes: 'Brown',
      other: 'No distinguishing marks'
    },
    migration: {
      details: 'Arrived per Toscana under Australia/Italy Assisted Passage Agreement. Landed Fremantle 15 Sep 1952, arrived Sydney 27 Sep 1952. Intended address: Immigration Centre, Greta, NSW. Marital status on arrival: single. Returned to Italy per Neptunia 13 Sep 1963 with sons Alfred (age 6) and John — intended as a 6-month visit to see ailing father Alfredo Sr. (colon cancer). Stayed after Alfredo Sr. died (9 May 1964) because Ezio would not uproot his elderly mother Ida. Returned to Australia 1975. Lilia remained in Australia throughout — naturalised 1965 while family was separated.',
      voyages: [
        {
          ship: 'Toscana',
          departure: 'Trieste',
          arrival: 'Sydney (via Fremantle)',
          date: '27 September 1952',
          details: 'Landed Fremantle 15 Sep 1952. Intended address: Immigration Centre, Greta, NSW. Under Assisted Passage Agreement. Marital status: single. Occupation: labourer.'
        },
        {
          ship: 'Neptunia',
          departure: 'Melbourne',
          arrival: 'Italy',
          date: '13 September 1963',
          details: 'Departed Melbourne with sons Alfred (6) and John. Lilia stayed in Australia. Intended as a 6-month visit to see ailing father Alfredo Sr. (colon cancer). "Noted for Return" stamp on 1952 arrival form. After Alfredo died 9 May 1964, Ezio stayed because he would not uproot Ida. Stayed 12 years; returned 1975. B78 file carries handwritten departure annotation: "LEFT PER NEPTUNIA ON 13/9/63 FROM MELB" — ship, port, and date confirmed; aligns with Neptunia outbound manifest 18 Sep 1963 ex Fremantle (PP222/4 item 10153223).',
        }
      ]
    },
    italianAddress: 'Via Mercantini N° 62, Ascoli Piceno (Feb 1952 — university file, seven months before sailing on the Toscana); Via E. B. Barro 11, Ascoli Piceno (Dec 1944, lettura incerta — university file; also pre-1942 per matricolare)',
    passport: {
      number: '3925755 P',
      issued: '19 June 1952',
      issuedBy: 'Ascoli Piceno, Italy'
    },
    alienRegistration: '290718',
    education: [
      'Diploma di Perito Agrario, R. Ist. Tecn. "Celso Ulpiani", Ascoli Piceno, 29 July 1942 — first in the institute\'s diploma register (No. 1, delivered 11 Aug 1942). Grades: Italian 6, Agriculture 8, Economics/Estimo 8, Zootecnia 8, Patologia vegetale 7, Chimica/Industrie agrarie 7, Meccanica agraria 8, Topografia/Costruzioni 8, Educazione fisica 8, Cultura militare 8.',
      'Certificato di cultura generale, R. Liceo Scientifico "Antonio Orsini" (R. Cert. n. 307), issued 16 Dec 1944 — passed in extraordinary session Nov 1944 (Italian Letters 6, History 6). Required supplementary exam for a perito agrario to enter university.',
      'Laurea in Scienze Agrarie, Università di Perugia, 26 November 1949 — 95/110. Matricola n. 2005. Enrolled 1° 1944-45, 2° 1945-46, 3° 1946-47, 4° 1947-48, fuori corso 1948-49. Thesis: "Fabbricati e macchine per la lavorazione dell\'uva in provincia di Ascoli Piceno"; tesina "I diritti sul vino"; practical on tractor unit cost (Buono). Diploma n. 3935, 13.2.1950.',
      'SCHOOL OUTREACH (22 Jul 2026): IIS "Ulpiani" (successor to R. Ist. Tecn. Celso Ulpiani) contacted — protocol 0021194/2026, requesting possible teacher file (fascicolo docente) for Ezio Buatti, former student graduated 1942. If they hold historical records, may contain biographical details, family information, or wartime context.'
    ],
    military: {
      service: 'Italian Army',
      details: 'Conscript class 1923, Distretto Militare di Ascoli Piceno. Recalled by RSI (Salò) Nov 1943, depennato (struck off) 17 Jan 1944. Called up 1950 for officer cadet school (Rieti, Fanteria), discharged "deficiente attitudine militare" after infirmary stay. Final discharge 9 Jan 1951.'
    },
    notes: [
      'Ruolo matricolare n. 20102 received from Archivio di Stato di Ascoli Piceno (Alessandra Buondi) 13 Jul 2026 — waived €4 fee, sent directly. Confirms: full name, parentage (Alfredo + Ida Galanti), DOB 27 Apr 1923, height 1.78m. Education: perito agrario diploma July 1942 (Celso Ulpiani), laurea in Scienze Agrarie 26 Nov 1949 (Perugia). RSI recall Nov 1943, depennato Jan 1944. Officer cadet at Rieti 1950, discharged for deficient military aptitude after infirmary stay. Final congedo illimitato 9 Jan 1951.',
      'PERUGIA FASCICOLO STUDENTE DELIVERED (4 Aug 2026, via PEC prot. 2026-USDPAMM-0309113; incoming UniPG prot. 290425 of 21/07/2026): 21 pages reproduced free of charge by Monica Fiore (responsabile ad interim Ufficio Archivio, servizio.fondistorici@unipg.it; direct: monica.fiore@unipg.it). File posiz. n. 2005, classification 05/08 (conclusione e cessazione della carriera di studio). Includes: autograph admission application 19-12-1944, Perito Agrario diploma 29.7.1942 + notarial copy (notaio Italo Alleva, 19-8-1942), 1946 institute confirmations, certificate of general culture (16 Dec 1944), legalised photograph 18 Dec 1944 (Comune di Ascoli Piceno attesting "BUATTI EZIO di Alfredo e di Galanti Ida, nato e residente in questo Comune"), laurea diploma (second original), degree examination record 26 Nov 1949 (95/110), handwritten practical exam paper marked "Buono", full exam transcript, and 1964 + 1975 certificates.',
      'KEY QUESTION: Enclosure no. 3 of the 19-12-1944 admission application was a Certificato di nascita — NOT among the reproduced pages. If still in file 2005, it likely names Ida Galanti\'s paternity or age. Follow-up email sent to Monica Fiore (5 Aug 2026).',
      'The file confirms "Galanti Ida" as Ezio\'s mother across four independent institutional sources (1942 Ministry diploma, notarial copy, 1944 comune photograph attestation, University cover card) — but no document gives her birth date or her father\'s name. 1893-vs-1904 question remains open.',
      '1975 certificate (20 Jan 1975) issued "per uso ricostruzione di carriera" — implies Italian employment or pension claim after his 1963 departure. 1964 and 1975 certificates show he was transacting with Perugia long after leaving Australia. New research thread on his post-1963 life in Italy.',
      'Discrepancies logged: Chimica/Industrie agrarie = 7 on 1942 diploma vs 8 on 1946 institute certificate (IIS cert. n. 913); cultura generale certificate dated 16/12/1944 on the document but cited 15/12/44 by the Headmaster in 1946. Matricola n. 2005 is the UniPG student number — not the military ruolo matricolare n. 20102/1923.'
    ],
    records: [
      { type: 'Birth Record', status: 'Searching', notes: '27 Apr 1923 — embargo lifted 2023, digital gap in Ascoli Piceno records' },
      { type: 'Death Record', status: 'Found', notes: '16 Oct 1991 — confirmed by family' },
      { type: 'Immigration File (NAA)', status: 'Found', notes: 'B78, ITALIAN/BUATTI EZIO — digitised copy received 9 Jul 2026 (Item 5746087). Full file: arrival form RA, marriage notification, passport photo.' },
      { type: 'Alien Registration', status: 'Found', notes: 'No. 290718, issued Sydney 27 Sep 1952. Re-issued 23 Jan 1957 (entered register 22 Feb 1957).' },
      { type: 'Passenger List', status: 'Found', notes: 'Toscana, 27 Sep 1952 — NAA K269. Also Fremantle customs stamp 15 Sep 1952.' },
      { type: 'Marriage Record', status: 'Found', notes: 'Lilia Chiappini, 4 Oct 1952 at St Anthony\'s Chapel, Greta, NSW — cert C810020; NSW BDM reg. 27340/1952 (West Maitland & Singleton district, register no. 154). Officiant Fr Zefferino Grisendi. Certificate names parents Remo Chiappini + Irma Pirri (deceased); witnesses Emidio Pica + Domenico Michetti. Greta = Greta Migrant Camp (largest post-war reception centre in NSW); the marriage also appears in the Ascoli Piceno civil register.' },
      { type: 'Bankruptcy Record', status: 'Found', notes: 'No. 248 of 1957. Café & milk bar proprietor, Broadford VIC. Petition & sequestration order 2 Oct 1957. Listed as "unemployed" at time. Public examination 2 Sep 1958 (Trove, Commonwealth Gazette 17 Oct 1957 & 28 Aug 1958).' },
      { type: 'Military Record (Ruolo Matricolare)', status: 'Found', notes: 'Foglio matricolare n. 20102, Distretto di Ascoli Piceno. Received from Archivio di Stato di Ascoli Piceno (Alessandra Buondi) 13 Jul 2026. Confirms education, RSI recall/depennato, officer cadet at Rieti, discharge 1951.' },
      { type: 'University Student File', status: 'Found', notes: 'Fascicolo studente posiz. n. 2005, Università di Perugia (Facoltà di Agraria). 21 pages reproduced free by Monica Fiore (Ufficio Archivio), received via PEC 4 Aug 2026 (prot. 2026-USDPAMM-0309113, incoming 290425 of 21/07/2026). Full academic trajectory 1944-1949, exam transcript, laurea 95/110 (26 Nov 1949), legalised photograph 18 Dec 1944. Certificato di nascita (enclosure 3 of 1944 application) NOT among reproduced pages.' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'NAA B78 file digitised and received 9 Jul 2026. Ruolo matricolare received 13 Jul 2026 (Alessandra Buondi). Perugia fascicolo studente RECEIVED 4 Aug 2026 (Monica Fiore) — 21 pages incl. legalised photograph (18 Dec 1944), full exam transcript, thesis title, laurea 95/110 (26 Nov 1949). Certificato di nascita deposited 1944 not among reproduced pages — follow-up emailed. RSI recall/depennato WWII.',
      nextSteps: [
        'Perugia file received 4 Aug 2026. Follow-up sent to monica.fiore@unipg.it (5 Aug 2026) asking whether the 1944 certificato di nascita (enclosure 3 of admission application, prot. 1746) survives in file 2005, and whether omitted annual enrolment forms 1945/46-48/49 record father\'s profession or family residence.',
        'Chase Comune di Ascoli Piceno for copia integrale di nascita (prot. 66127/2026, lodged 20 Jul) — cite the 1944 comune photograph attestation ("BUATTI EZIO di Alfredo e di Galanti Ida, nato e residente in questo Comune").',
        'Purchase NAA Item ID 16189462 (Lilia\'s naturalisation file MP1187/1, V1965/3748, Small–Medium rate) — Kevin Aston Hoey confirmed (NAA1000454740, Aug 2026) that no separate MSD/ARD alien registration records exist; they were amalgamated into the naturalisation file.',
        'Pull the 1975 "ricostruzione di carriera" thread — what did Ezio do in Italy 1963-1975?',
        'Marriage certificate C810020 received (Aug 2026) — reg. 27340/1952 confirms officiant Fr Zefferino Grisendi, witnesses Emidio Pica + Domenico Michetti, parents Remo Chiappini + Irma Pirri (deceased).',
        'RecordSearch BUATTI sweep — search for Lilia\'s naturalisation file V653748, Ezio\'s bankruptcy file 248/1957.',
        'Find Neptunia outbound passenger list for 13 Sep 1963 to confirm who travelled. RESOLVED Aug 2026: B78 file (item 5746087) carries handwritten departure annotation "LEFT PER NEPTUNIA ON 13/9/63 FROM MELB" on the marriage-notification page — ship, port, and date confirmed. No purchase of PP222/4 outbound manifest needed for this question.',
        'Ask family about Ezio\'s university years at Perugia — did he ever teach or work as an agronomist before migrating?'
      ]
    },
    sources: [
      {
        title: 'NAA: B78, ITALIAN/BUATTI EZIO',
        type: 'Immigration File',
        reference: 'Item ID 5746087 (digitised, received 9 Jul 2026)'
      },
      {
        title: 'Toscana Passenger List',
        type: 'Passenger Manifest',
        reference: 'NAA: K269, 15 Sept 1952'
      },
      {
        title: 'Ruolo Matricolare n. 20102',
        type: 'Military Record',
        reference: 'Archivio di Stato di Ascoli Piceno (Alessandra Buondi), received 13 Jul 2026'
      },
      {
        title: 'Fascicolo Studente — Università di Perugia',
        type: 'University Student File',
        reference: 'Posiz. n. 2005. Received via PEC 4 Aug 2026 (prot. 2026-USDPAMM-0309113; incoming 290425 of 21/07/2026). Monica Fiore, Ufficio Archivio (monica.fiore@unipg.it).'
      }
    ]
  },
  {
    id: 'bruna-lilia-chiappini',
    name: 'Bruna Lilia Chiappini ("Nonna Lilia")',
    generation: 2,
    line: 'Chiappini',
    gender: 'F',
    birthDate: '3 July 1930',
    birthPlace: 'San Benedetto del Tronto, Marche, Italy',
    deathDate: '23 May 1998',
    burialPlace: 'Springvale Botanical Cemetery, Springvale, Victoria, Australia',
    burialDetails: 'Spotted Gums, Row AS, Grave 68. Roman Catholic. Interment date 29 May 1998.',
    burialLink: 'https://www.findagrave.com/memorial/231257991/lilia-buatti',
    spouses: ['ezio-buatti'],
    parents: ['remo-chiappini', 'irma-pirri'],
    children: ['alfred-buatti', 'john-buatti-extended'],
    migration: {
      details: 'Travelled as "CHIAPPINI, Lilia", occupation "Servant" (past and future), on the Toscana (voyage 12/52, master Capt. Giuseppe Raggi) Trieste→Sydney via Fremantle. Known within the family as "Nonna Lilia" (went by her middle name). Registration numbers 12 apart (Ezio: 290718, Lilia: 290730) — registered in same batch on landing. Almost certainly travelled as engaged couple, married one week later. Line 178 on K269, directly below "CHIAPPIN[I], Gine" (Gino) line 177 — same rare surname, same destination, almost certainly travelling together. Did NOT return to Italy with Ezio and sons in 1963 — remained in Australia and naturalised 1965 while family was separated.',
      voyages: [
        {
          ship: 'Toscana',
          departure: 'Trieste',
          arrival: 'Fremantle (first AU landfall) / Sydney (disembarked)',
          date: '15 Sep 1952 (Fremantle) / 27 Sep 1952 (Sydney)',
          details: 'Voyage 12/52, master Capt. Giuseppe Raggi. Listed as "Servant" (past and future). Intended address: Commonwealth Migration Office, Sydney. Registration no. 290730.'
        }
      ]
    },
    residences: ['303 Punt Road, Richmond, Victoria (1965)'],
    notes: [
      'Travelled on Toscana K269 line 178 — directly below line 177: Gino Chiappini (b. 1927, labourer, reg 290502, listed as "CHIAPPIN Gino" on manifest). Confirmed by NAA 10 Jul 2026 (A2571, barcode 203679026). NoK field blank on his ID card. He worked as transient fruit-picker in Mildura then Bonalgo NSW. No naturalisation found. 3-year age gap consistent with being her brother.',
      'NAA RecordSearch sweep (11 Aug 2026): general "Chiappini" search returns 2 items. (1) A2571 barcode 203679026 — alien reg card already in hand. (2) NEW: SP1121/1, item 9637786, "Gino Chiappin [Italian - arrived Sydney per TOSCANA, 27 Sep 1952] [Box 191]", Sydney, 1952 — NOT digitised. SP1121/1 is migrant reception/accommodation paperwork (the intake file for his Greta/Villawood processing); likely to fill the blank-NoK gap on the A2571 card. Targeted series searches B78 / A712 / K1146 / MP1187 (alien + naturalisation) all returned NO hits — confirms on record that Gino was never naturalised. Outbound passenger series B659 / K266 also returned no hits (weak negative — outbound lists patchy). Net: no further travel or citizenship documented by NAA; the SP1121/1 intake is the only new Australian paper trail extending past the 1952 arrival.',
      'NSW marriage certificate (reg. 27340/1952, West Maitland & Singleton district, register no. 154) confirms: married Ezio Buatti 4 Oct 1952 at St Anthony\'s Chapel, Greta, "according to the right rites of the Roman Catholic Church", solemnised in the presence of witnesses Emidio Pica and Domenico Michetti (both Greta Camp) by Fr Zefferino Grisendi. Certificate states: Lilia CHIAPPINI, Spinster, 22, Home duties, born San Benedetto del Tronto, resident Immigration Centre Greta; parents Remo Chiappini (Labourer) + Irma Pirri (deceased). Registered 14 Oct 1952 by Victor Reginald Jenkins, District Registrar. Also recorded in the Ascoli Piceno civil register.',
      'Irma Pirri recorded as DECEASED on the 1952 marriage certificate (window 1930–1952, probably San Benedetto del Tronto). Remo Chiappini recorded as LIVING as of 4 Oct 1952 — no "deceased" notation on him.',
      'Clerical error worth preserving: Lilia\'s death annotation on the Italian side is dated 18/12/1963 for a death that occurred 1998.',
      'Trove (Aug 2026): "Buatti Chiappini" and bare "Buatti" return nothing across Trove\'s digitised NSW papers — the surname Buatti is effectively absent from the digitised text. Weak negative (Trove AND-search plus patchy digitisation of Hunter Valley papers for the early 1950s).',
    ],
    records: [
      { type: 'Birth Record', status: 'Searching', notes: '3 Jul 1930 — embargo until 2030, contact Comune di San Benedetto del Tronto' },
      { type: 'Death Record', status: 'Found', notes: '23 May 1998 — burial confirmed' },
      { type: 'Burial Record', status: 'Found', notes: 'Springvale Botanical Cemetery, Spotted Gums, Row AS, Grave 68' },
      { type: 'Alien Registration', status: 'Found', notes: 'No. 290730 — issued same batch as Ezio (290718), Sydney 27 Sep 1952. Per Ezio\'s marriage notification (Form RA 6).' },
      { type: 'Naturalisation Record', status: 'Found', notes: 'Commonwealth Gazette notice, 18 Nov 1965 — lists address 303 Punt Rd, Richmond. Cert EF10155554, file V653748 (Victorian registry). Confirmed by NAA.' },
      { type: 'Passenger List', status: 'Found', notes: 'Toscana, 27 Sep 1952 — listed as "CHIAPPINI, Lilia"' },
      { type: 'Marriage Record', status: 'Found', notes: 'Ezio Buatti, 4 Oct 1952 at St Anthony\'s Chapel, Greta, NSW — cert C810020; NSW BDM reg. 27340/1952 (West Maitland & Singleton district, register no. 154). Officiant Fr Zefferino Grisendi. Certificate names parents Remo Chiappini + Irma Pirri (deceased); witnesses Emidio Pica + Domenico Michetti.' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'NAA B78 file received for Ezio — marriage to Lilia confirmed 4 Oct 1952 St Anthony\'s Greta. Lilia travelled same ship (Toscana), registered same batch (no. 290730). Naturalisation confirmed: 18 Nov 1965, cert EF10155554, file V653748 (Victorian registry). Marriage cert 27340/1952 names parents: Remo Chiappini + Irma Pirri (deceased); officiant Fr Zefferino Grisendi; witnesses Emidio Pica, Domenico Michetti. NAA (NAA1000454740, Aug 2026): no MSD/ARD alien registration records exist for Lilia — amalgamated into her naturalisation file V653748. Toscana passenger list reveals Gino Chiappini (line 177) — same surname, same destination, likely relative. Birth record still outstanding (privacy embargo until 2030).',
      nextSteps: [
        'NAA: purchase Lilia naturalisation file MP1187/1 V1965/3748 (Item ID 16189462) — confirmed as the only place her alien registration records sit (NAA1000454740).',
        'Gino Chiappini NAA sweep done 11 Aug 2026 (see notes). NEW lead: SP1121/1 item 9637786 — request digitisation / purchase copy to obtain Greta/Villawood intake paperwork (likely NoK field, employment, onward movements). BLOCKED on family-relationship confirmation (avoid $26.45 spend on speculation).',
        'Gino Chiappini Ryerson + Trove sweep done 11 Aug 2026: Ryerson = 0 notices (clean negative). Trove = no death/funeral notice for Gino; only unrelated hits (1939 cycling article, 1974/82 gazette entries for a different "Lucien John Antonio..." Chiappini family). Free Australian paper trail for Gino effectively exhausted; remaining avenues cost money (SP1121/1) or need papa.',
        'Gino Chiappini NSW BDM historical death index search 11 Aug 2026 (1950–1995): only 1 hit — CHIAPPINI MARCO (43921/1968, father LUIGI × JUNE, Hamilton). NOT our Chiappini line (father Luigi, not Remo). Gino did not die in NSW 1950–1995 under any Chiappin(i) spelling. Next: try Victorian BDM historical death index.',
        'Gino Chiappini Victorian BDM historical death index search 11 Aug 2026 (my.rio.bdm.vic.gov.au, efamily-history): 0 hits for Chiappin(i). Both NSW + VIC historical death indexes now clean negatives. Gino did not die in NSW or VIC 1950–1995/1976 under any Chiappin(i) spelling. Free Australian BDM avenue exhausted for Gino.',
        'Ask papa (next visit) about Gino Chiappini — brother/cousin of Lilia? Also ask about Irma Pirri.',
        'Await NAA naturalisation case file V653748 (due 20 Aug 2026) — may contain birth details and parentage.',
        'Contact Comune di San Benedetto del Tronto for 1930 birth record.',
        'Search for Irma Pirri records in Ascoli Piceno.'
      ]
    },
    sources: [
      {
        title: 'Commonwealth of Australia Gazette — Naturalisation List',
        type: 'Government Gazette',
        reference: '18 November 1965, p. 3958 (Trove)'
      },
      {
        title: 'Find a Grave — Lilia Buatti',
        type: 'Cemetery Record',
        link: 'https://www.findagrave.com/memorial/231257991/lilia-buatti'
      },
      {
        title: 'Toscana Passenger List',
        type: 'Passenger Manifest',
        reference: 'NAA: K269, 15 Sept 1952'
      },
      {
        title: 'Fremantle Passenger Lists 1897–1963',
        type: 'Passenger Manifest',
        reference: 'Ancestry.com record matching Toscana voyage'
      },
      {
        title: 'Branxton Catholic Parish Marriage Extract',
        type: 'Parish Register',
        reference: 'Ezio Buatti + Lilia Chiappini, 4 Oct 1952, St Anthony\'s Greta. Celebrant Fr Zefferino Grisendi (NSW cert; parish extract read as "Rev Z Lewandowski" — corrected). Witnesses: Emidio Pica, Domenico Michetti. Parents: Remo Chiappini + Irma Pirri. Issued 10 Jul 2026.'
      }
    ]
  },
  // Emmi Line
  {
    id: 'gregorio-emmi',
    name: 'Gregorio Emmi',
    generation: 2,
    line: 'Emmi',
    gender: 'M',
    birthDate: '23 October 1915 (civil) — see note re baptism discrepancy',
    birthPlace: 'Linguaglossa, Province of Catania, Sicily, Italy',
    deathDate: '24 November 1979',
    burialPlace: 'Rookwood Catholic Cemetery, Sydney, NSW',
    burialDetails: 'Lawn (5), plot 1070. Funeral conducted by T. J. Andrews Funeral Services Pty. Ltd., Newtown; officiating clergyman Rev. John Shanahan on 30 November 1979. Death notice: Sydney Morning Herald 30 Nov 1979.',
    spouses: ['rosaria-patane'],
    parents: ['egidio-emmi', 'concetta-sgroi'],
    children: ['venera-buatti', 'angie-mcwilliams-extended', 'connie-emmi-extended', 'john-emmi-extended', 'greg-emmi-extended', 'ross-emmi-extended'],
    residences: ['Via Roma 333, Linguaglossa', 'Black Rock, via Ingham, Queensland', 'Sydney, NSW'],
    occupations: ['Bracciante (farm labourer) in Italy', 'Cane cutter in Australia'],
    notes: [
      '4-day birth date discrepancy: civil birth extract (atto n. 202) says 23 Oct 1915; baptismal record (DGS 5455112, n. 251) says 27 Oct 1915. Civil date legally authoritative — baptism may reflect actual birth reported to parish later.',
      'Married Rosaria Patanè 7 July 1948 in Fiumefreddo di Sicilia (atto n. 34, part 2, series A).',
      'Lost Italian citizenship 26 Jan 1961 per naturalisation certificate EM(2)28650 — acquired Australian citizenship, transcribed at Linguaglossa 1961 atto n. 32 part I.',
      'Had at least 5 siblings per Mum (28 Jun 2026): one older brother (his family migrated to Venezuela — confirmed by Connie Emmi), another brother in NSW, and 3 sisters (one met in Italy).',
      'Connie Emmi also said "there are many Emmis in Griffith NSW that are not directly related to us."',
    ],
    physicalDescription: {
      height: '1.69m',
      build: 'Well-built (corporatura robusta)',
      hair: 'Dark brown',
      eyes: 'Dark/black',
      other: 'Forehead: regular; nose: regular; mouth: regular'
    },
    migration: {
      details: 'Arrived in Australia in March 1950 under the sponsorship of Pietro Patanè. Worked as a cane cutter on Pietro\'s farm at Black Rock, via Ingham.',
      sponsorship: 'Pietro Patanè (Black Rock, via Ingham). An earlier 1949 sponsorship by friend Piero Lalli (Landing Permit C.22712) was apparently not used.',
      voyages: [
        {
          ship: 'M/V Napoli',
          departure: 'Messina',
          arrival: 'Sydney (via Melbourne)',
          date: 'March 1950',
          details: 'Disembarked at Sydney on 13 March 1950 (per Police report); NAA Passenger Arrivals lists Melbourne arrival on 4 March 1950 (multi-port pattern).'
        }
      ]
    },
    military: {
      service: 'Italian Army, Private, Motor Transport, Regimental No. 254584.',
      captured: 'Captured at Asmara, Eritrea, 1 April 1941 (East African Campaign).',
      internment: 'Transported from Bombay to Sydney aboard SS Uruguay (arrived 4 Oct 1943). Interned as POW at Camp No. 12, Cowra, NSW (from 5 Oct 1943); later moved to Murchison, Victoria. Hospitalized at Leongatha (malaria, May 1944) and Tatura/Murchison (epistaxis, Dec 1944).',
      repatriation: 'Repatriated to Italy on 30 September 1946 aboard H.T. Chitral.'
    },
    records: [
      { type: 'Birth (Civil)', status: 'Found', notes: 'Estratto atto n. 202, Comune di Linguaglossa — issued 30 Jun 2026. Date: 23 Oct 1915. (4-day discrepancy with baptismal record: 27 Oct 1915.)' },
      { type: 'Baptismal Record', status: 'Found', notes: 'Parish register Linguaglossa, DGS 5455112 — baptised 5 Dec 1915, entry N.251, folio 80. Officiated by Fr. Rochus La Rosa (per license of Archpriest Blasius Palermo). Godmother: Rosaria Emmi (previously unknown Emmi relative — possibly Egidio\'s sister or cousin). Midwife: Giuseppa Nicotra. Born 27 Oct 1915. No marriage annotations in margin.' },
      { type: 'Death Record', status: 'Found', notes: 'Confirmation: death notice in Sydney Morning Herald 30 Nov 1979 (Ryerson Index). Died 24 Nov 1979, age 64, late of Stanmore, formerly of Highett, Melbourne.' },
      { type: 'Burial Record', status: 'Found', notes: 'Rookwood Catholic Cemetery, Lawn (5) plot 1070' },
      { type: 'POW Record', status: 'Found', notes: 'NAA MP1103/1 & MP1103/2 — captured Asmara 1941, Cowra POW Camp, repatriated 1946' },
      { type: 'Immigration File (NAA)', status: 'Found', notes: 'J25, 1949/13301 — Piero Lalli sponsorship application' },
      { type: 'Passenger List', status: 'Found', notes: 'M/V Napoli, Mar 1950; SS Uruguay, Oct 1943 (POW transport); H.T. Chitral, Sep 1946 (repatriation)' },
      { type: 'Alien Registration', status: 'Found', notes: 'No. 139899, 13 Mar 1950' },
      { type: 'Identity Document', status: 'Found', notes: 'Carta d\'identità No. 17.771.300, Comune di Linguaglossa' },
      { type: 'Police Record', status: 'Found', notes: 'Townsville District Police Report, 15 Sep 1950 — "good character and repute"' },
      { type: 'Medical Record', status: 'Found', notes: 'Malaria (May 1944) & epistaxis (Dec 1944) during POW internment' },
      { type: 'Naturalisation Record', status: 'Found', notes: 'Certificate EM(2)28650, 26 Jan 1961. Transcribed Linguaglossa 1961 atto n. 32 part I. Per civil birth extract (atto n. 202).' },
      { type: 'Marriage Record', status: 'Found', notes: 'Rosaria Patanè, 7 Jul 1948, Fiumefreddo di Sicilia — atto n. 34, part 2, series A. Recorded in margin of civil birth extract (atto n. 202).' },
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Civil birth extract received 30 Jun 2026 (atto n. 202 — confirms 23 Oct 1915 birth). Baptismal record previously found. Marriage to Rosaria Patanè confirmed: 7 Jul 1948, Fiumefreddo. Naturalisation (Australian citizenship) 26 Jan 1961, cert. EM(2)28650.',
      nextSteps: [
        'Request marriage act from Comune di Fiumefreddo (1948 part 2 series A n. 34). Follow up by phone if no reply (Liuzzo Francesca: 095 7777216).',
        'Request naturalisation certificate EM(2)28650 from NAA.',
        'Establish when/why the family relocated from Ingham to Sydney.'
      ]
    },
    sources: [
      {
        title: 'Baptismal Record (Gregorio Emmi)',
        type: 'Ecclesiastical Record',
        reference: 'Registri ecclesiastici di Linguaglossa, Battesimi 1914–1921, DGS 5455112, entry N. 251, folio 80 (Baptized 5 Dec 1915 by Fr. Rochus La Rosa)'
      },
      {
        title: 'POW Report on Prisoners of War',
        type: 'Military Record',
        reference: 'NAA: MP1103/1 (PWI55491) and MP1103/2 (55491)'
      },
      {
        title: 'Alien Registration Certificate',
        type: 'Civil Document',
        reference: 'No. 139899, dated 13 March 1950 (records £200 held at Commonwealth Savings Bank, Ingham)'
      },
      {
        title: 'Carta d\'identità',
        type: 'Identity Card',
        reference: 'No. 17.771.300, Comune di Linguaglossa'
      },
      {
        title: 'Townsville District Police Report',
        type: 'Police Record',
        reference: '15 Sept 1950 (describes him as "a person of good character and repute")'
      },
      {
        title: 'Family Funeral Service Card',
        type: 'Funeral Record',
        reference: 'T. J. Andrews Funeral Services, via Angie McWilliams'
      }
    ]
  },
  // --- EMMI EXTENDED: Gregorio's known siblings (unconfirmed names) ---
  {
    id: 'emmi-older-brother-venezuela',
    name: 'Emmi (older brother, name unknown)',
    generation: 2,
    line: 'Emmi',
    gender: 'M',
    birthDate: 'Unknown',
    deathDate: 'Unknown',
    parents: ['egidio-emmi', 'concetta-sgroi'],
    children: [],
    spouses: [],
    notes: [
      'Older brother of Gregorio Emmi.',
      'His family migrated to Venezuela (per Connie Emmi, 28 Jun 2026).',
      'Name, exact birth date, and death date all unknown — mentioned as "father\'s older brother" by Connie.',
      'May correspond to the brother "in America" mentioned by Mum in phone call (28 Jun 2026).',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Name unknown — no records found' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Outstanding',
      details: 'Existence confirmed by Connie Emmi (28 Jun 2026). All other details unknown.',
      nextSteps: [
        'Ask Connie for his name and any details.',
        'Check if Gregorio\'s NAA files mention siblings.',
        'Search Venezuela Emmi families.'
      ]
    }
  },
  {
    id: 'rosaria-patane',
    name: 'Rosaria Patanè (married Emmi)',
    generation: 2,
    line: 'Patanè',
    gender: 'F',
    birthDate: '23 May 1924',
    birthPlace: 'Fiumefreddo di Sicilia, Sicily, Italy',
    deathDate: '30 March 1994',
    burialPlace: 'Cheltenham Memorial Cemetery, Cheltenham, Victoria, Australia',
    burialDetails: 'Plot 27*377*N. Resided in Highett, Victoria at time of death.',
    spouses: ['gregorio-emmi'],
    parents: ['rosario-patane-sr', 'venera-vecchio'],
    children: ['venera-buatti', 'angie-mcwilliams-extended', 'connie-emmi-extended', 'john-emmi-extended', 'greg-emmi-extended', 'ross-emmi-extended'],
    occupations: ['Tailor (sartora) — trained by her brother Sebastiano', 'Home duties (in Australia)'],
    physicalDescription: {
      height: '5\'4" (1.56m)',
      build: '57kg',
      hair: 'Brown',
      eyes: 'Brown',
      other: 'No special peculiarities'
    },
    migration: {
      details: 'Departed Italy from Messina aboard SS Surriento; arrived Brisbane on 24 March 1951, travelling with daughter Concetta (Aunty Connie as a child). Accommodation guaranteed for 12 months by Pietro Patanè and Leonardo Vecchio at Black Rock, via Ingham.',
      sponsorship: 'Pietro Patanè & Leonardo Vecchio',
      voyages: [
        {
          ship: 'SS Surriento',
          departure: 'Messina',
          arrival: 'Brisbane (via Sydney)',
          date: '24 March 1951',
          details: 'Travelled with daughter Concetta. NAA Passenger Arrivals lists Sydney arrival on 10 March 1951 (multi-port pattern).'
        }
      ]
    },
    records: [
      { type: 'Birth (Civil)', status: 'Found', notes: 'Numero 71, Fiumefreddo di Sicilia 1924 — FS DGS 7851867. Born 23 May 1924 at 6:33 AM, Sezione Castello. Declared 25 May 1924 by father Rosario Patanè (34, bracciante). Mother: Venera Vecchio (casalinga). Witnesses: Francesco Ferrara (25, calzolaio), Leotta Luigi (29, barbiere). Officer: Continella Luigi. Father literate (signed).' },
      { type: 'Baptismal Record', status: 'Searching', notes: 'FS DGS 5429284 restricted — emails sent to Diocesi di Acireale & parish 28 Jun 2026' },
      { type: 'Death Record', status: 'Found', notes: '30 Mar 1994 — burial confirmed' },
      { type: 'Burial Record', status: 'Found', notes: 'Cheltenham Memorial Cemetery, Plot 27*377*N' },
      { type: 'Marriage Record', status: 'Found', notes: 'To Gregorio Emmi, 7 Jul 1948, Fiumefreddo di Sicilia — atto n. 34, part 2, series A. Per Gregorio\'s civil birth extract margin annotation.' },
      { type: 'Immigration File (NAA)', status: 'Found', notes: 'J25, 1950/8776 — 15+ pages, already digitised' },
      { type: 'Passport', status: 'Found', notes: 'No. 3187826, issued 2 Dec 1950, Linguaglossa' },
      { type: 'Passenger List', status: 'Found', notes: 'SS Surriento, Mar 1951 — Messina to Brisbane via Sydney' },
      { type: 'Medical Record', status: 'Found', notes: 'Medical examination, Messina 5-6 Dec 1950, Dott. Francesco Siracusano' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Civil birth record confirmed (Numero 71, 1924). Baptismal record outstanding (FamilySearch DGS 5429284 is restricted). Outreach emails sent to Diocesi di Acireale and parish on 28 June 2026.',
      nextSteps: [
        'Await reply from Diocesi di Acireale secretary and parish (parrocchiamariaimmacolata) regarding baptismal record.',
        'Search indexed collection "Italy, Catania, Diocesi di Acireale, Catholic Church Records, 1560–1950" (collection 2016233) for Rosaria/Rosario/Venera.',
        'Contact Caulfield North FamilySearch Center for restricted microfilm access.'
      ]
    },
    sources: [
      {
        title: 'Civil Birth Register (Fiumefreddo di Sicilia)',
        type: 'Civil Registry',
        reference: 'Numero 71, 1924 (FamilySearch DGS 7851867)'
      },
      {
        title: 'Italian Passport',
        type: 'Passport',
        reference: 'No. 3187826 (Registro No. 5829), issued 2 Dec 1950, Linguaglossa'
      },
      {
        title: 'NAA Department of Immigration Case File',
        type: 'Immigration File',
        reference: 'NAA: J25, 1950/8776 (Brisbane)'
      },
      {
        title: 'Find a Grave — Rosaria Emmi',
        type: 'Cemetery Record',
        link: 'https://www.findagrave.com/memorial/215724580/rosaria-emmi'
      },
      {
        title: 'Medical Examination Record',
        type: 'Medical Record',
        reference: 'Messina, 5–6 Dec 1950, by Dott. Francesco Siracusano'
      }
    ]
  },

  // --- GENERATION 3: Parents ---
  {
    id: 'alfred-buatti',
    name: 'Alfred (Alfredo) Buatti',
    generation: 3,
    line: 'Buatti',
    gender: 'M',
    isLiving: true,
    birthDate: '8 November 1956',
    birthPlace: 'Broadford, Victoria, Australia',
    spouses: ['venera-buatti'],
    parents: ['ezio-buatti', 'bruna-lilia-chiappini'],
    children: ['daniele-buatti', 'roberto-buatti', 'stefano-buatti', 'marco-buatti'],
    notes: [
      'Returned to Italy with father Ezio and brother John per Neptunia Sep 1963 — intended as 6-month visit to dying grandfather Alfredo Sr. (colon cancer). Stayed 12 years after Ezio decided not to uproot Ida. Lived in Ascoli Piceno area. Returned to Australia 1975 (age 18). Brother John returned 1976.',
      'Provided various correspondence and recollections that formed the basis of this research.',
      'Father Ezio went bankrupt Oct 1957 running a café/milk bar in Broadford (Trove, Commonwealth Gazette).'
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '8 Nov 1956, Broadford VIC — confirmed' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Living. Details confirmed.'
    }
  },
  {
    id: 'venera-buatti',
    name: 'Venera Buatti (née Emmi)',
    generation: 3,
    line: 'Emmi',
    gender: 'F',
    isLiving: true,
    birthDate: '1952 (exact date TBC)',
    spouses: ['alfred-buatti'],
    parents: ['gregorio-emmi', 'rosaria-patane'],
    children: ['daniele-buatti', 'roberto-buatti', 'stefano-buatti', 'marco-buatti'],
    siblings: ['Angie McWilliams', 'Concetta ("Connie") Emmi', 'John Emmi', 'Greg Emmi', 'Ross Emmi'],
    notes: [
      'Living.',
      'Born 1952 per self-report.',
      'Named after her grandmother Venera Vecchio, following Italian naming traditions.'
    ],
    records: [
      { type: 'Birth Record', status: 'Searching', notes: 'Born 1952 — ask for exact date and place' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Living. Birth year confirmed as 1952. Exact date and place TBC.',
      nextSteps: [
        'Ask Venera or family for her exact birth date and place.'
      ]
    }
  },

  // --- GENERATION 4: Children ---
  {
    id: 'daniele-buatti',
    name: 'Daniele Ezio Adriano Buatti',
    generation: 4,
    line: 'Buatti',
    gender: 'M',
    birthDate: '20 November 1990',
    birthPlace: 'Parkdale, Victoria, Australia',
    spouses: [],
    parents: ['alfred-buatti', 'venera-buatti'],
    children: [],
    isLiving: true,
    records: [
      { type: 'Birth Record', status: 'Found', notes: '20 Nov 1990, Parkdale VIC — confirmed by individual' }
    ],
    researchStatus: { status: 'Confirmed' }
  },
  {
    id: 'roberto-buatti',
    name: 'Roberto Buatti',
    generation: 4,
    line: 'Buatti',
    gender: 'M',
    spouses: [],
    parents: ['alfred-buatti', 'venera-buatti'],
    children: [],
    isLiving: true,
    researchStatus: { status: 'Confirmed' }
  },
  {
    id: 'stefano-buatti',
    name: 'Stefano Buatti',
    generation: 4,
    line: 'Buatti',
    gender: 'M',
    spouses: [],
    parents: ['alfred-buatti', 'venera-buatti'],
    children: [],
    isLiving: true,
    researchStatus: { status: 'Confirmed' }
  },
  {
    id: 'marco-buatti',
    name: 'Marco Buatti',
    generation: 4,
    line: 'Buatti',
    gender: 'M',
    spouses: [],
    parents: ['alfred-buatti', 'venera-buatti'],
    children: [],
    isLiving: true,
    researchStatus: { status: 'Confirmed' }
  },

  // --- EXTENDED FAMILY MEMBERS (For connections and completeness) ---
  {
    id: 'john-buatti-extended',
    name: 'John Buatti',
    generation: 3,
    line: 'Buatti',
    gender: 'M',
    isLiving: true,
    parents: ['ezio-buatti', 'bruna-lilia-chiappini'],
    spouses: [],
    children: [],
    notes: [
      'Brother of Alfred Buatti.',
      'Lived in Italy c. 1962/63–1976.'
    ],
    researchStatus: { status: 'Confirmed' }
  },
  {
    id: 'angie-mcwilliams-extended',
    name: 'Angie McWilliams (née Emmi)',
    generation: 3,
    line: 'Emmi',
    gender: 'F',
    isLiving: true,
    parents: ['gregorio-emmi', 'rosaria-patane'],
    spouses: [],
    children: [],
    notes: [
      'Sister of Venera Buatti.',
      'Provided crucial family documents (passports, identity card, funeral service card) for this record.'
    ],
    researchStatus: { status: 'Confirmed' }
  },
  {
    id: 'connie-emmi-extended',
    name: 'Concetta ("Connie") Emmi',
    generation: 3,
    line: 'Emmi',
    gender: 'F',
    isLiving: true,
    birthDate: '25 April 1949',
    birthPlace: 'Linguaglossa, Sicily, Italy',
    parents: ['gregorio-emmi', 'rosaria-patane'],
    spouses: [],
    children: [],
    notes: [
      'Sister of Venera Buatti.',
      'Named on Rosaria\'s 1950 passport as a child travelling with her mother.',
      'Living. Divorced; surname remains Emmi.'
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Birth date and details confirmed via passport and family records.'
    }
  },
  {
    id: 'john-emmi-extended',
    name: 'John Emmi',
    generation: 3,
    line: 'Emmi',
    gender: 'M',
    isLiving: true,
    parents: ['gregorio-emmi', 'rosaria-patane'],
    spouses: [],
    children: [],
    notes: ['Brother of Venera Buatti.'],
    researchStatus: { status: 'Confirmed' }
  },
  {
    id: 'greg-emmi-extended',
    name: 'Greg Emmi',
    generation: 3,
    line: 'Emmi',
    gender: 'M',
    isLiving: true,
    parents: ['gregorio-emmi', 'rosaria-patane'],
    spouses: [],
    children: [],
    notes: ['Brother of Venera Buatti.'],
    researchStatus: { status: 'Confirmed' }
  },
  {
    id: 'ross-emmi-extended',
    name: 'Ross Emmi',
    generation: 3,
    line: 'Emmi',
    gender: 'M',
    isLiving: true,
    parents: ['gregorio-emmi', 'rosaria-patane'],
    spouses: [],
    children: [],
    notes: ['Brother of Venera Buatti.'],
    researchStatus: { status: 'Confirmed' }
  },
  {
    id: 'pietro-patane',
    name: 'Pietro Patanè',
    generation: 2,
    line: 'Patanè',
    gender: 'M',
    birthDate: '21 Jul 1911',
    birthPlace: 'Milo, Province of Catania, Sicily, Italy',
    deathDate: '6 February 1994',
    deathPlace: 'Ingham, Queensland, Australia',
    burialPlace: 'New Ingham Cemetery, Ingham, Queensland',
    burialDetails: 'Roman Catholic Sect: 31, Plot: 12. Cause of death: chronic renal failure.',
    spouses: ['maria-ragonesi-patane'],
    parents: [],
    children: ['filadelfo-patane', 'sam-patane'],
    occupations: ['Cane cutter', 'Cane farmer', 'Farmer'],
    residences: ['Milo, Catania, Sicily', 'Farm 732, Wamoon, near Leeton, NSW', 'Black Rock, via Ingham, Queensland'],
    notes: [
      'Arrived Brisbane per ORAMA, 24 November 1930.',
      'Interned at Loveday Camp (South Australia) during WWII as enemy alien. Alien registration no. Q8299, D4028. Captured Gordonvale 11 Mar 1942. Interned Gaythorne → Loveday → Barmera Hospital → released Adelaide 12 Dec 1943.',
      'Applied for naturalisation from Farm 732, Wamoon, near Leeton, NSW (1947). Later owned cane farm at Black Rock, via Ingham, QLD.',
      'Sponsored Gregorio Emmi\'s migration (1949-50) and employed him as a cane cutter.',
      'Guaranteed accommodation for Rosaria Patanè Emmi and daughter Concetta (1950).',
      'Likely a close relative of Rosario Patanè (Rosaria\'s father) — same surname, same region (Milo is ~10km from Linguaglossa, ~15km from Fiumefreddo). POW record Special Observations list "PATANE, Rosario" — potentially the first direct link.',
      'Naturalised 26 September 1938 (A714 4/1530) and again 18 April 1947 (A714 66/21033).',
      'Physical description (1947): 5 ft 7 in, dark brown eyes, black hair, slight scar on centre of forehead.',
      'Wife: Maria Patane (listed on naturalisation). Maiden name unknown.',
      'Birth date discrepancy: D4028 alien card says 22 Jul 1911; A714 66/21033 naturalisation (signed by him) says 21 Jul 1911. Using 21 Jul as canonical.',
      'NAA POW files confirm 1 male child (born before 1942). Never returned to Italy.'
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '21 Jul 1911, Milo CT — naturalisation particulars confirm exact date' },
      { type: 'Death Record', status: 'Found', notes: '6 Feb 1994, Ingham QLD — chronic renal failure, New Ingham Cemetery' },
      { type: 'Burial Record', status: 'Found', notes: 'New Ingham Cemetery, RC Sect: 31, Plot: 12' },
      { type: 'Naturalisation Record', status: 'Found', notes: 'A714 66/21033 (Item 31675770) — viewed 29 Jun 2026. Birthplace Milo 21 Jul 1911. Wife Maria Patane. Farm 732 Wamoon NSW.' },
      { type: 'Naturalisation Record (1938)', status: 'To Order', notes: 'A714 4/1530 (Item 31518779) — 26 Sep 1938. $26.45 to order.' },
      { type: 'Passenger List', status: 'To Order', notes: 'BP9/3 (Item 3458322) — arrived Brisbane per ORAMA, 11 Nov 1930. $26.45 to order.' },
      { type: 'POW/Internment Record', status: 'Found', notes: 'MP1103/1 Q8299 + MP1103/2 Q8299 (Items 8621488, 9910295) — viewed 29 Jun 2026. Gordonvale capture, Loveday camp, released Dec 1943. Special Observations: "PATANE, Rosario" and "ROSA, Messino".' },
      { type: 'Alien Registration', status: 'Found', notes: 'NAA D4028 (Item 9208586) — viewed 29 Jun 2026. Q8299, born Milo 22 Jul 1911, cane cutter, married, arrived 24.11.30 Brisbane.' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Key sponsor and employer of the Emmi family in Australia. Relationship to Rosario Patanè still unconfirmed but plausible — Milo is only ~10km from Linguaglossa.'
    }
  },
  {
    id: 'maria-ragonesi-patane',
    name: 'Maria Patane',
    generation: 2,
    line: 'Patanè',
    gender: 'F',
    birthDate: 'Unknown',
    deathDate: '1980',
    spouses: ['pietro-patane'],
    parents: [],
    children: ['filadelfo-patane', 'sam-patane'],
    notes: ['Wife of Pietro Patanè. Listed as "Maria Patane" on his 1947 naturalisation (married surname). Maiden name unknown. Married before 1939 (Pietro listed as married on 1939 alien registration).'],
    researchStatus: {
      status: 'In Progress',
      details: 'Maiden name unknown. "Ragonesi" was conjectural — removed.'
    }
  },
  {
    id: 'filadelfo-patane',
    name: 'Filadelfo Antonio "Phil" Patanè',
    generation: 3,
    line: 'Patanè',
    gender: 'M',
    birthDate: '1952',
    birthPlace: 'Ingham, Queensland, Australia',
    deathDate: '29 May 1989',
    deathPlace: 'Ingham, Queensland, Australia',
    burialPlace: 'New Ingham Cemetery, Ingham, Queensland',
    burialDetails: 'Roman Catholic Sect: 38, Plot: 56. Cause: Coroner\'s order.',
    parents: ['pietro-patane', 'maria-ragonesi-patane'],
    spouses: [],
    children: [],
    notes: ['Son of Pietro Patanè and Maria Patane.'],
    researchStatus: { status: 'Confirmed' }
  },
  {
    id: 'sam-patane',
    name: 'Sam Patanè',
    generation: 3,
    line: 'Patanè',
    gender: 'M',
    birthDate: '1954',
    birthPlace: 'Ingham, Queensland, Australia',
    deathDate: '23 May 2014',
    deathPlace: 'Ingham, Queensland, Australia',
    burialPlace: 'New Ingham Cemetery, Ingham, Queensland',
    burialDetails: 'Uniting Sect: 12, Plot: 635.',
    parents: ['pietro-patane', 'maria-ragonesi-patane'],
    spouses: [],
    children: [],
    notes: ['Son of Pietro Patanè and Maria Patane. His son Jordan Christopher Patanè (1987-1987) predeceased him.'],
    researchStatus: { status: 'Confirmed' }
  },
  {
    id: 'sebastiano-vecchio',
    name: 'Sebastiano Vecchio',
    generation: -2,
    line: 'Patanè',
    gender: 'M',
    birthDate: 'Unknown',
    birthPlace: 'Unknown',
    deathDate: 'Unknown',
    spouses: ['sebastiana-panebianco'],
    parents: [],
    children: ['vincenzo-vecchio'],
    notes: [
      'Father of Vincenzo Vecchio — per marriage act atto 8, Fiumefreddo Matrimoni 1886 (DGS 7841136).',
      'Profession recorded as villica? (unclear reading on marriage act).',
      'No further records found yet — Vincenzo\'s own birth act (Nati 1861–1865, DGS 7853312) would confirm.',
      'Possible connection to Alfio Vecchio (× Giuseppa Patanè, 1880) or Dr. Alfio Vecchio (× Ravella Teresa, 1887) — Vecchio is common in Fiumefreddo.',
    ],
    records: [
      { type: 'Marriage Record (Civil)', status: 'Found (indirect)', notes: 'Named in son Vincenzo\'s marriage act (atto 8, 8 Feb 1886) as father of groom. Not a party to the act — listed as Sebastiano Vecchio (villica?).' },
    ],
    researchStatus: {
      status: 'Confirmed (indirect)',
      details: 'Named in son Vincenzo\'s marriage act (atto 8, 8 Feb 1886). No direct records yet.',
      nextSteps: [
        'Vincenzo\'s birth act (Nati 1861–1865, DGS 7853312) would confirm both parents.',
        'Check Nati indices for other Vecchio children — may reveal more of the family.',
      ]
    }
  },
  {
    id: 'sebastiana-panebianco',
    name: 'Sebastiana Panebianco',
    generation: -2,
    line: 'Patanè',
    gender: 'F',
    birthDate: 'Unknown',
    birthPlace: 'Unknown',
    deathDate: 'Unknown',
    spouses: ['sebastiano-vecchio'],
    parents: [],
    children: ['vincenzo-vecchio'],
    notes: [
      'Mother of Vincenzo Vecchio — per marriage act atto 8, Fiumefreddo Matrimoni 1886 (DGS 7841136).',
      'Profession recorded as villica? (unclear reading on marriage act).',
      'Naming convention: Vincenzo\'s eldest daughter (if any before Venera) would be named Sebastiana after her. Venera (named for maternal grandmother) was born Jan 1888 — hypothesis of an earlier Sebastiana in 1886–1887 is untested.',
    ],
    records: [
      { type: 'Marriage Record (Civil)', status: 'Found (indirect)', notes: 'Named in son Vincenzo\'s marriage act (atto 8, 8 Feb 1886) as mother of groom.' },
    ],
    researchStatus: {
      status: 'Confirmed (indirect)',
      details: 'Named in son Vincenzo\'s marriage act (atto 8, 8 Feb 1886). No direct records yet.',
      nextSteps: [
        'Vincenzo\'s birth act (Nati 1861–1865, DGS 7853312) would confirm both parents.',
      ]
    }
  },
  {
    id: 'salvatore-raiti',
    name: 'Salvatore Raiti',
    generation: -2,
    line: 'Patanè',
    gender: 'M',
    birthDate: 'Unknown',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    occupations: ['Bracciante (day labourer)'],
    spouses: ['venera-previtera'],
    parents: [],
    children: ['rosaria-raiti'],
    notes: [
      'Father of Rosaria Raiti — per marriage act atto 8, Fiumefreddo Matrimoni 1886 (DGS 7841136).',
      'Profession: bracciante.',
      'PROBABLE WITNESS LINK (20 Jul 2026): Salvatore Raiti witnessed three of Sebastiano Patanè\'s children\'s births in 1877–1880 (Leonarda, Venera I, Mariano). Now confirmed as Rosaria\'s father via marriage act — the witness appearances are no longer speculative but probable family connections.',
    ],
    records: [
      { type: 'Marriage Record (Civil)', status: 'Found (indirect)', notes: 'Named in daughter Rosaria\'s marriage act (atto 8, 8 Feb 1886) as father of bride.' },
    ],
    researchStatus: {
      status: 'Confirmed (indirect)',
      details: 'Named in daughter Rosaria\'s marriage act (atto 8, 8 Feb 1886). Bracciante. Witness appearances at Patanè births (1877–1880) now confirmed as probable family link.',
      nextSteps: [
        'Rosaria\'s birth act (Nati ~1863–1864, DGS 7853312) would confirm both parents.',
      ]
    }
  },
  {
    id: 'venera-previtera',
    name: 'Venera Previtera',
    generation: -2,
    line: 'Patanè',
    gender: 'F',
    birthDate: 'Unknown',
    birthPlace: 'Unknown',
    deathDate: 'Unknown',
    spouses: ['salvatore-raiti'],
    parents: [],
    children: ['rosaria-raiti'],
    notes: [
      'Mother of Rosaria Raiti — per marriage act atto 8, Fiumefreddo Matrimoni 1886 (DGS 7841136).',
      'Profession recorded as villica? (unclear reading on marriage act).',
      'Her name "Venera" was given to granddaughter Venera Vecchio (b. 1888) — following the Sicilian naming convention of honouring the maternal grandmother.',
    ],
    records: [
      { type: 'Marriage Record (Civil)', status: 'Found (indirect)', notes: 'Named in daughter Rosaria\'s marriage act (atto 8, 8 Feb 1886) as mother of bride.' },
    ],
    researchStatus: {
      status: 'Confirmed (indirect)',
      details: 'Named in daughter Rosaria\'s marriage act (atto 8, 8 Feb 1886). No direct records yet.',
      nextSteps: [
        'Rosaria\'s birth act (Nati ~1863–1864, DGS 7853312) would confirm both parents.',
      ]
    }
  }
];

export const initialResearchLeads: ResearchLead[] = [
  {
    id: 'lead-pietro-patane',
    title: 'Pietro Patanè Connection',
    category: 'Emmi/Patanè',
    status: 'In Progress',
    description: 'Pietro Patanè (21 Jul 1911 – 6 Feb 1994), born Milo CT (~10km from Linguaglossa). Arrived Brisbane per ORAMA 24 Nov 1930. Interned Loveday Camp WWII. Farm 732 Wamoon NSW, later Black Rock QLD cane farm. Sponsored Gregorio & Rosaria Emmi. Naturalised 26 Sep 1938 (A714 4/1530) and 18 Apr 1947 (A714 66/21033). Wife Maria Patane (maiden name unknown). Same surname and nearby hometown makes a family connection to Rosario Patanè plausible — POW file Special Observations list "PATANE, Rosario", the first direct link.',
    nextSteps: 'Request 1911 birth act from Comune di Giarre (Milo was part of Giarre until 1923). Also check Q30224 record for other Pietro Patanè (Filadelfo + Maria Lofara) — separate Milo line to investigate.',
    sources: ['NAA: A714 66/21033 (Item 31675770) — viewed', 'NAA: D4028 PATANE PIETRO (Item 9208586) — viewed', 'NAA: MP1103/1+2 Q8299 (Items 8621488, 9910295) — viewed', 'NAA: MP1103/1 Q30224 (Item 8625133) — viewed', 'Find a Grave: New Ingham Cemetery']
  },
  {
    id: 'lead-piero-lalli',
    title: 'Piero Lalli Relationship',
    category: 'Emmi/Patanè',
    status: 'To Investigate',
    description: 'Piero Lalli was a cane farmer at Blackrock, via Ingham, born Todi, Italy, 6 Feb 1895. Naturalised British subject (Cert. No. BB2576, 1927). First sponsor of Gregorio Emmi\'s migration application in 1949, listed as a "friend," not a relative. Lalli was interned in Australia during WWII (Gaythorne -> Hay -> Loveday internment camps, June 1940–Nov 1943).',
    nextSteps: 'Confirm if there is any indirect family connection or if he was purely a community contact.'
  },
  {
    id: 'lead-leonardo-vecchio',
    title: 'Leonardo Vecchio Connection',
    category: 'Emmi/Patanè',
    status: 'To Investigate',
    description: 'Leonardo Vecchio worked Piero Lalli\'s cane farm on a share-profit basis (1949), and later co-signed Rosaria\'s accommodation guarantee with Pietro Patanè at Black Rock (1950). Appears twice in the family\'s Ingham circle; relationship not yet known (possible connection to Rosaria\'s mother Venera Vecchio also worth investigating, given the shared surname).',
    nextSteps: 'Search for Leonardo Vecchio\'s records in NAA or Queensland archives to see if he originates from Fiumefreddo di Sicilia.'
  },
  {
    id: 'lead-carmelo-vecchio-ruled-out',
    title: 'Carmelo Vecchio (Venera Vecchio\'s proposed father)',
    category: 'Emmi/Patanè',
    status: 'Ruled Out',
    description: 'Originally proposed as the father of Venera Vecchio (Rosaria Patanè\'s mother) via a marriage banns record.',
    whyRuledOut: 'Direct examination of the actual document (28 June 2026) showed the date was misread as 1903; the record is in fact dated 1923. It shows a Venera Vecchio (daughter of Carmelo Vecchio and Rosaria Ragonesi) marrying Giuseppe Di Blasi on 18 June 1923 at Fiumefreddo. Since our Rosaria Patanè was born to Rosario Patanè & Venera Vecchio in May 1924, this is a different Venera Vecchio who married a different man entirely. Carmelo Vecchio is NOT confirmed as an ancestor.',
    sources: ['FamilySearch Marriage Banns, Fiumefreddo di Sicilia, 18 June 1923']
  },
  {
    id: 'lead-michele-patane-ruled-out',
    title: 'Michele Patanè & Caterina Mangano (Rosario Patanè\'s proposed parents)',
    category: 'Emmi/Patanè',
    status: 'Ruled Out',
    description: 'Originally proposed as parents of Rosario Patanè (Rosaria Patanè\'s father) via a 1922 marriage banns record.',
    whyRuledOut: 'Direct examination of the actual document (28 June 2026) showed this Rosario Patanè (son of Michele Patanè and Caterina Mangano) married Grazia Coco on 13 January 1923. He did not marry Venera Vecchio. Same common name, different person. Michele Patanè & Caterina Mangano are NOT confirmed as ancestors.',
    sources: ['FamilySearch Marriage Banns, Fiumefreddo di Sicilia, 13 January 1923']
  },
  {
    id: 'lead-sgroi-network',
    title: 'Sgroi Family Network in Linguaglossa',
    category: 'Emmi/Patanè',
    status: 'To Investigate',
    description: 'A search of the indexed "Civil Registration (Tribunale), 1866-1929" collection turned up an unrelated Gregorio Emmi (b. 1903, d. 1904 as an infant) whose parents were Alfio Emmi and Carmela Sgroi. The Sgroi surname matches Egidio Emmi\'s wife Concetta Sgroi, raising the possibility of a wider Sgroi family network in the town.',
    nextSteps: 'Investigate whether Carmela Sgroi and Concetta Sgroi are related (sisters or cousins).'
  },
  {
    id: 'lead-ascoli-piceno-cemetery',
    title: 'Ascoli Piceno Cemetery Search',
    category: 'Buatti/Chiappini',
    status: 'Completed',
    description: 'Use the Comune di Ascoli Piceno cemetery search tool to locate burials of Alfredo Buatti (Sr.) and Ida Galanti.',
    nextSteps: 'Already completed. Confirmed death dates and shared grave location (Cimitero di Borgo Solestà, Settore L, Blocco L074O, Lotto 074, Posto 8, Fila 1). Can be used to check for other Buatti-line burials going forward.',
    sources: ['Comune di Ascoli Piceno Cemetery Search Tool']
  },
  {
    id: 'lead-sicilian-researcher',
    title: 'Hire Local Sicilian Researcher',
    category: 'Emmi/Patanè',
    status: 'To Investigate',
    description: 'Since all FamilySearch/Antenati digital routes for Gregorio\'s civil birth record are now exhausted (restricted microfilm, duplicate catalog entry, and partial indexing all dead-ended), a paid local researcher able to visit Archivio di Stato di Catania in person and photograph the specific 1915 act may now be the fastest route.',
    nextSteps: 'Draft a request and find candidate researchers in Catania province.'
  },
  {
    id: 'lead-facebook-groups',
    title: 'Italian/Sicilian Genealogy Facebook Groups',
    category: 'General',
    status: 'To Investigate',
    description: 'Community groups sometimes have members local to Catania province willing to do a free or low-cost archive lookup.',
    nextSteps: 'Post the specific reference: "Linguaglossa, stato civile (Tribunale), Nati, 1915, Gregorio Emmi, parents Egidio Emmi & Concetta Sgroi" in active groups.'
  },
  {
    id: 'lead-naa-rosario-patane-1967',
    title: 'NAA Record: Rosario Patanè (b. 18 Nov 1895) & Sebastiano Patanè (b. 18 Feb 1936)',
    category: 'Emmi/Patanè',
    status: 'In Progress',
    description: 'NAA file A446, 1967/39646 — "PATANE Rosario born 18 November 1895; Sebastiano born 18 February 1936" (Item ID 7775953, Canberra). Could be Rosaria\'s father Rosario (born c. 1890, close to 1895), or a different Rosario. Rosario Patanè aged ~72 in 1967 would match the c. 1895 birth year. Could also be the Rosario Patanè who married Grazia Coco (ruled out as Rosaria\'s father, but still a Patanè to investigate). File also includes a Sebastiano Patanè (b. 18 Feb 1936) — Rosaria\'s brother was named Sebastiano, but born unknown date.',
    nextSteps: 'Access application submitted 28 June 2026 (Receipt RK26/00009589, due 2 Nov 2026). Wait for file and examine all pages for family connections, addresses, and sponsors.',
    sources: ['NAA: A446, 1967/39646 (Item ID 7775953)']
  },
  {
    id: 'lead-alfio-patane-naturalisation',
    title: 'Alfio Patanè Naturalisation Record (A1, 1930/3825)',
    category: 'Emmi/Patanè',
    status: 'To Investigate',
    description: 'Alfio Patanè (c.1865-1928), cane farmer at Boogan near Innisfail QLD, murdered in "Black Hand" case. NAA naturalisation record A1, 1930/3825 (Item 1500231) — 11 pages fully digitised. Likely contains exact birthplace, parents\' names, arrival date, and possibly mentions of relatives including Pietro Patanè.',
    nextSteps: 'View the digitised images at RecordSearch (B=1500231). Extract parents\' names and town of origin in Sicily. Cross-reference with Pietro Patanè (Milo, 1911-1994).',
    sources: ['NAA: A1, 1930/3825 (Item ID 1500231)']
  },
  {
    id: 'lead-vecchio-emmi-network',
    title: 'Vecchio–Emmi Family Connection (Linguaglossa)',
    category: 'Emmi/Patanè',
    status: 'To Investigate',
    description: 'Nunzio Vecchio (1901-1995, born Linguaglossa) married Sara Emmi, arrived Australia 1932, worked Ingham cane fields. This directly links the Vecchio and Emmi families in Linguaglossa. Leonardo Vecchio (co-signer of Rosaria\'s guarantee, died 1977 aged 75) likely from same network.',
    nextSteps: 'Contact Darrel Vecchio via vecchio.biz to compare family trees. Exact relationship between Sara Emmi and Gregorio Emmi needs to be established.',
    sources: ['vecchio.biz family blog', 'New Ingham Cemetery records']
  },
  {
    id: 'lead-darrel-vecchio-contact',
    title: 'Contact Darrel Vecchio (vecchio.biz)',
    category: 'Emmi/Patanè',
    status: 'To Investigate',
    description: 'Darrel Vecchio (grandson of Nunzio Vecchio & Sara Emmi) runs vecchio.biz and Jondal Industries. Grew up in Ingham. Could provide crucial connections between the Vecchio, Emmi, and Patanè families in the Ingham Italian community.',
    nextSteps: 'Find contact details via vecchio.biz website or LinkedIn. Prepare specific questions about the Vecchio-Emmi-Patanè connections in Ingham.',
  },
  {
    id: 'lead-morti-patane-dagata',
    title: 'Morti Hunt: Sebastiano Patanè & Rosaria D\'Agata Deaths',
    category: 'Emmi/Patanè',
    status: 'Completed',
    description: 'Rosaria D\'Agata found — Morti 1916, atto 11 (DGS 7851868), died 3 Mar 1916. Parents named: Salvatore D\'Agata + Venera Maccarrone (Generation -2 confirmed from the death side). Sebastiano NOT found on the free film (DGS 7851868 covers Morti 1911, 1913–1928). Last confirmed alive 21 Nov 1928 (domiciliato in Fiumefreddo per atto 60 — son Mariano\'s death act). Likely died 1929+, under 100-year embargo at comune. Comune email sent requesting death date or annotazione di morte on birth act (atto 15/1850).',
    nextSteps: 'Await comune reply. The annotazione di morte on his birth act covers all scenarios (died in Fiumefreddo, died elsewhere and transcribed, or moved late in life).',
  },
  {
    id: 'lead-vincenzo-vecchio-marriage',
    title: 'Vincenzo Vecchio × Rosaria Raiti Marriage (~1884–1887)',
    category: 'Emmi/Patanè',
    status: 'Completed',
    description: 'FOUND (20 Jul 2026): Atto 8, 8 Feb 1886, Fiumefreddo Matrimoni 1886 (DGS 7841136). Banns published 17 + 24 Jan 1886. Both spouses Fiumefreddo-born — d\'ufficio verification, no extracts needed. Allegati: certificato di pubblicazioni + carta libera per povertà (fascicolo n. 8). Parents named: Sebastiano Vecchio (villica?) × Sebastiana Panebianco (villica?) — groom\'s parents; Salvatore Raiti (bracciante) × Venera Previtera (villica?) — bride\'s parents.',
    nextSteps: 'Marriage and parents resolved. Next: Vincenzo\'s birth act (Nati 1861–1865, DGS 7853312); Rosaria\'s birth act (same film); possible elder siblings of Venera (Nati 1886–1887 indices).',
  },
  {
    id: 'lead-antenati-anagrafe-buatti',
    title: 'Antenati Anagrafe Archivio 189: Cartellini + Fogli Search',
    category: 'Buatti/Chiappini',
    status: 'To Investigate',
    description: 'Ascoli Piceno anagrafe storica (archivio 189) on Antenati has both fogli di famiglia (household sheets) and cartellini individuali (alphabetical cards). Alfredo Buatti\'s cartellino (an_ua8562/5gKpOz5) cross-references foglio 1527. The next target: find Galanti Ida card(s) in the cartellini series — look for marriage annotation to Buatti or matching foglio number. Also search for Buatti Ezio cartellino. If a post-marriage foglio number is found, navigate to that sheet for the full marital household (Ida as moglie, Ezio and siblings).',
    nextSteps: 'Open cartellini register (parent of an_ua8562) → page from Buatti Alfredo → screenshot any Buatti Ezio / other Buatti cards. Jump to G → find Galanti Ida card(s) → screenshot both if two exist. Decision: card with Buatti marriage annotation / matching foglio number = our Ida. Also watch for "Ida Buatti" (Alfredo\'s sister, b. ~1886) to avoid confusion.',
    sources: ['https://antenati.cultura.gov.it/ark:/12657/an_ua8562/5gKpOz5 (cartellino)', 'https://antenati.cultura.gov.it/ark:/12657/an_ua8378/oLplvkL (foglio 1527)'],
  },
  {
    id: 'lead-ida-1893-vs-1904-comune',
    title: 'Ida Galanti: 1893 vs 1904 — Institutional Routes',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    description: 'Perugia fascicolo studente (received 4 Aug 2026) confirms "Galanti Ida" as Ezio\'s mother across four independent institutional sources (1942 Ministry diploma, notarial copy, 1944 comune photograph attestation, University cover card) but gives no birth date or paternity. Ezio deposited a certificato di nascita with the University in Dec 1944 (enclosure 3 of domanda di ammissione, incoming prot. 1746) — not among the reproduced pages; follow-up emailed to Monica Fiore (monica.fiore@unipg.it, 5 Aug 2026). Tribunale di Ascoli Piceno route CLOSED (20 Jul 2026): archive interdetto, cannot action request (Dott. Maurizio Norcini Pala). Live routes: Comune AP prot. 66127/2026 (Ezio birth act, lodged 20 Jul — chased with 1944 photo attestation), Comune AP prot. 0062771 (marriage cert, Sergio De Angelis), Comune SBT prot. 0054400/2026 (to be widened to stato di famiglia storico per Buondi letter prot. 1805-P).',
    nextSteps: 'Await Monica Fiore reply re 1944 birth cert. Chase Comune AP prot. 66127/2026. Widen Comune SBT prot. 0054400/2026 to stato di famiglia storico, citing Buondi letter prot. MIC|MIC_AS-AP_UO2|21/07/2026|0001805-P.',
  },
  {
    id: 'lead-vecchio-sibling-hypothesis',
    title: 'Vecchio Naming-Convention Hypothesis: Elder Siblings of Venera',
    category: 'Emmi/Patanè',
    status: 'To Investigate',
    description: 'Venera Vecchio (b. 6 Jan 1888) was named for her maternal grandmother Venera Previtera, not her paternal grandmother Sebastiana Panebianco — the pattern expected for a second daughter. With the marriage now fixed at 8 Feb 1886, there is a ~23-month window for an earlier first child. Hypothesis: a Sebastiana Vecchio (or Sebastiano) may exist in Nati 1886 (March onward) or 1887. Additionally, Nati 1888 atto 55 lists a Vecchio Sebastiano — parents need checking.',
    nextSteps: 'Antenati → Fiumefreddo Nati 1887 index → V column → any Vecchio child of Vincenzo × Raiti (photograph index). Same for Nati 1886 (post-February). Nati 1888 atto 55 — Vecchio Sebastiano → open act → parents? Log outcome: naming-convention hypothesis confirmed, or bent convention noted.',
  },
  {
    id: 'lead-vincenzo-rosaria-births',
    title: 'Vincenzo Vecchio & Rosaria Raiti Birth Acts',
    category: 'Emmi/Patanè',
    status: 'To Investigate',
    description: 'Both born ~1863–1864, Fiumefreddo. Best route: Nati 1861–1865 (DGS 7853312). If locked, add to centre-visit list. Alternatively, Liste di leva (Catania province, classe 1864/1865) on Antenati for Vecchio Vincenzo.',
    nextSteps: 'Check lock status of DGS 7853312 on FamilySearch. If open → browse indices 1863, 1864, 1865 → find Vecchio Vincenzo (parents: Sebastiano Vecchio × Sebastiana Panebianco) and Raiti Rosaria (parents: Salvatore Raiti × Venera Previtera) → photograph indexes + acts. If locked → add to centre-visit list. Antenati fallback: Liste di leva, Catania province, classe 1864/1865.',
  },
  {
    id: 'lead-centre-visit-films',
    title: 'Centre-Visit Film List (Moorabbin or Heidelberg)',
    category: 'Emmi/Patanè',
    status: 'To Investigate',
    description: 'Four films queued for in-person archive visit: (1) DGS 5429284 — Fiumefreddo parish baptisms (Rosaria Patanè 1924; Venera Vecchio 1888 fol. 240 n. 8; ask if coverage reaches the 1860s for Vincenzo/Rosaria Raiti); (2) DGS 7851969 — Linguaglossa Nati (Gregorio Emmi b. 1915); (3) DGS 7967575 — Annotazioni su atti di nascita 1857–1893 (death-annotation lottery: Venera Vecchio n. 6/1888, Vincenzo ~1864, Rosaria Raiti ~1863–64); (4) DGS 7853312 — Nati 1861–1865 (only if it proves locked).',
    nextSteps: 'Confirm centre locations and hours. Bring camera/phone for photography. Priority order: annotations first (chance of death dates), then birth acts, then parish baptisms.',
  },
  {
    id: 'lead-vecchio-vincenzo-death',
    title: 'Vincenzo Vecchio & Rosaria Raiti Deaths',
    category: 'Emmi/Patanè',
    status: 'To Investigate',
    description: 'Both alive 23 Apr 1911 (daughter Venera\'s marriage). Absent from Fiumefreddo Morti 1911–1929 → died 1930+ or elsewhere. Same pattern as Sebastiano Patanè (under 100-year comune embargo).',
    nextSteps: 'Comune email can cover both: request death dates/annotations for Vincenzo Vecchio (b. ~1864) and Rosaria Raiti (b. ~1863–64). Also check Emmi × Patanè 1948 marriage act — Venera\'s fu/living status may reveal parents\' death dates.',
  },
  {
    id: 'lead-venera-qlb-bdm',
    title: 'Venera Vecchio: QLD BDM Death Index Search',
    category: 'Emmi/Patanè',
    status: 'To Investigate',
    description: 'Venera Vecchio\'s death window is 1930–1953 (absent from Fiumefreddo Morti through 1929; "fu Venera" on 1953 cert). If she followed Rosario to Queensland, her death could be in QLD BDM — free and searchable online for deaths 30+ years past. No embargo, no comune, no film. Same approach covers Rosario Patanè\'s death if pre-~1994.',
    nextSteps: 'QLD BDM historical index search (free, online): Deaths — surname Patane/Patanè, given Venera/Veneranda, ~1930–1953; also try maiden Vecchio. Same index: Rosario Patanè death. Ryerson Index: Patane, Ingham QLD — funeral notices. Trove: "Patane Ingham" — Italian-community and cane-district papers. NAA RecordSearch: confirm whose file A446, 1967/39646 actually is (search "Patane Rosario" and "Emmi") — if Rosario\'s, it will state arrival date and whether wife accompanied.',
  },
  {
    id: 'lead-buatti-antonio-wwi',
    title: 'Buatti Antonio: WWI Death Record (Morti, Allegati)',
    category: 'Buatti/Chiappini',
    status: 'To Investigate',
    description: '"Buatti Antonio" appears on a WWI mortality list (Morti, allegati) in Antenati doc an_ua8575 (Archivio di Stato di Ascoli Piceno, 6-Div 2). This closely matches Antonio Buatti, b. 14 Feb 1894, son of Giovanni Buatti and Emidia Bruni — Alfredo\'s younger brother, identified on foglio di famiglia N. 1527. Age fits (20–24 during WWI). If confirmed via the specific allegato/index card (same format as Galanti Nazzareno notification letter), this would be a new death record for one of Alfredo\'s siblings — death date, circumstances, and military unit.',
    nextSteps: 'Check remaining 3 divisions of Morti allegati 1915–1919 for Buatti Antonio\'s individual record card: 5-Div 1, 5-Div 2, 6-Div 1. (6-Div 2 already scanned — list entry only found so far.) This is a bounded search: once all 4 are checked, lead is either confirmed or exhausted.',
    sources: ['https://antenati.cultura.gov.it/ark:/12657/an_ua8575 (6-Div 2 — already scanned)'],
  },
  {
    id: 'lead-galanti-wwi-checked',
    title: 'Galanti WWI Casualties: Alessandro Confirmed as 1904 Ida\'s Brother',
    category: 'Buatti/Chiappini',
    status: 'Partially Confirmed',
    description: 'Three Galanti entries found in Morti allegati (an_ua8575, 6-Div 2): (1) Galanti Nazzareno, b. 25 Dec 1875, son of Luigi Galanti + Filomena Marcolini — NOT a match; (2) Galanti Nazzareno, b. ~1885, son of Michele Galanti + Natalina Bollettini, Caporale 17° Rgt Fanteria, KIA 6 Sep 1915 — NOT a match; (3) BREAKTHROUGH: Galanti Alessandro, fu Ignazio Galanti, mother Clementina Curcozzi. Soldier, 238° Reggimento Fanteria, 10ª Compagnia, died 16 Oct 1917 at hospital in Cividale from septic gangrene. Birth certificate extract confirms: son of Ignazio + Curcozzi Clementina, born Ascoli Piceno (~1895). First hard evidence that Ignazio Galanti + Clementina Curcozzi were a real couple with children in Ascoli Piceno — makes 1904 Ida candidate more credible.',
    nextSteps: 'Check remaining Morti allegati divisions (5-Div 1, 5-Div 2, 6-Div 1) for any other Galanti siblings — clustering common in war-dead lists. Alessandro\'s full record may contain more family detail.',
  },
  {
    id: 'lead-idenati-familysearch-catalog',
    title: 'FamilySearch Catalog: Ascoli Piceno Civil Registration Confirmed',
    category: 'Buatti/Chiappini',
    status: 'Completed',
    description: 'FamilySearch catalog "Italy, Ascoli Piceno, Civil Registration (State Archive), 1740-1880, 1915-1919" confirmed: the "1915-1919" portion is specifically "Morti, prima guerra mondiale" (WWI war dead) — not general civil marriages, births, or deaths. The "Matrimoni" series only runs 1808-1815 (Napoleonic era). No digitized register anywhere covers Ascoli Piceno marriages in 1919-1923. The marriage-record dead end is real, not just assumed.',
    nextSteps: 'Marriage trail closed on free routes. Await Comune AP and Tribunale AP email replies.',
  },
  {
    id: 'lead-linguaglossa-allegati',
    title: 'Comune di Linguaglossa / Catania: Allegati Atto 59/1900 Request',
    category: 'Emmi/Patanè',
    status: 'In Progress',
    description: 'Tribunale di Catania (22 Jul 2026, Dott. Stefano Marino) confirmed the court holds the Catania-province civil duplicates but staff are not authorised to search that archive; redirected to Comune di Catania (and Antenati, which stops at 1893 for Linguaglossa — no digital route for 1894–1910). New request to be sent to Comune di Catania, Ufficio Stato Civile: allegati to Linguaglossa marriage act n. 59, 4 Nov 1900, EMMI Egidio (fu Antonino × Rosaria Nasti) × SGROI Concetta — citing the Tribunal referral of 22/07/2026 and AS-CT prot. MIC|MIC_AS-CT|13/07/2026|0001721-P. Comune di Linguaglossa request (anagrafe@comune.linguaglossa.ct.it, 22 Jul) still in flight for a local duplicate of the allegati.',
    nextSteps: 'Send the Comune di Catania request (Ufficio Stato Civile) citing the Tribunale referral. Await Comune di Linguaglossa reply.',
  },
  {
    id: 'lead-ezio-school-outreach',
    title: 'IIS "Ulpiani" — Ezio Buatti Teacher File Request',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    description: 'IIS "Ulpiani" (successor to R. Ist. Tecn. "Celso Ulpiani", where Ezio Buatti graduated as Perito Agrario in July 1942) contacted — protocol 0021194/2026 (22 Jul 2026). Requesting possible fascicolo docente (teacher file) for Ezio Buatti. If they hold historical records, may contain biographical details, family information, wartime context, or classmates/teachers who could provide oral history leads.',
    nextSteps: 'Await reply from IIS Ulpiani. If they hold records, ask for copies. Also ask whether any wartime-era matricole (enrollment registers) survive for the 1938-1942 cohort.',
  },
  {
    id: 'lead-sb-marriage-dead-end',
    title: 'Comune di San Benedetto del Tronto — Stato di Famiglia Storico (Refused)',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    description: 'Request sent 22 Jul 2026 (prot. 0054400/2026, receipt confirmed), originally for the Alfredo Buatti × Ida Galanti marriage — possibly a thread mix-up (no confirmed San Benedetto connection for that couple; Ascoli Piceno is the correct jurisdiction). Widened to a stato di famiglia storico for the Chiappini–Pirri household per Buondi letter (AS-AP prot. 1805-P, 21 Jul 2026). UPDATE (Aug 2026): SBT anagrafe REFUSED the stato di famiglia storico — returned a checklist with nothing ticked. The form asks the requester to state a motivation/purpose (Italian privacy law); the reason is a personal decision Claude cannot answer for the user.',
    nextSteps: 'Answer the motivation question on the SBT anagrafe form (personal decision — Claude should not answer for you), then resubmit the stato di famiglia storico request for the Chiappini–Pirri household.',
  },
  {
    id: 'lead-perugia-birth-cert-followup',
    title: 'Perugia Follow-Up: Certificato di Nascita (Enclosure 3) + Enrolment Forms',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    description: 'Ezio\'s domanda di ammissione of 19-12-1944 (UniPG incoming prot. 1746, arrived 27-12-1944) lists a Certificato di nascita as enclosure no. 3 — not among the 21 pages Monica Fiore reproduced. A 1944 birth cert from Comune di Ascoli Piceno would likely name Ida Galanti and, if an estratto per riassunto, name the parents; if a copia integrale, may carry her age or paternity (settling 1893 vs 1904). Reply email sent 5 Aug 2026 to monica.fiore@unipg.it (direct PEO address — protocollo@cert.unipg.it rejects ordinary Gmail) threading prot. 2026-USDPAMM-0309113 del 04/08/2026 and incoming prot. 290425 del 21/07/2026, asking whether the birth certificate survives in fascicolo posiz. n. 2005 and whether the omitted annual enrolment forms 1945/46-48/49 record the father\'s profession or family residence (with a no-scan fallback: just tell me whether they do).',
    nextSteps: 'Await Monica Fiore reply. If the birth cert is absent from the file, the Comune AP request (prot. 66127/2026) remains the route most likely to decide 1893 vs 1904.',
  },
  {
    id: 'lead-naa-lilia-naturalisation',
    title: 'NAA: Lilia Naturalisation File — Purchase Decision (Item ID 16189462)',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    description: 'NAA1000454740 (3 Aug 2026): Kevin Aston Hoey applied the price indicator to Lilia\'s naturalisation file MP1187/1, V1965/3748, Item ID 16189462 (11 pages, Small–Medium rate) — purchasable online now. Likely the richest document about her outside Italy (arrival details, addresses, employment, often photo and signature). FOLLOW-UP ANSWERED (NAA1000454740, Aug 2026): there are NO separate MSD/ARD alien registration records for Lilia — none in B78 (she arrived in Sydney; Melbourne holds no migrant selection docs), and it was common practice to amalgamate alien registration into the successful naturalisation file. Therefore V653748 is the only place to find them; single purchase, no second order needed.',
    nextSteps: 'Proceed with the online purchase of Item ID 16189462 (Lilia\'s naturalisation file V1965/3748). Delivery of the case file expected ~20 Aug 2026.',
  },
  {
    id: 'lead-ezio-post-1963-italy',
    title: 'Ezio Buatti: Post-1963 Life in Italy (1975 Career Reconstruction)',
    category: 'Buatti/Chiappini',
    status: 'To Investigate',
    description: 'The 1975 Perugia certificate (20 Jan 1975) was issued "per uso ricostruzione di carriera" — implying Italian employment or a pension claim after Ezio left Australia in 1963 and before his return in 1975. The 1964 and 1975 certificates show he was transacting with the University well after his 1963 departure. This is the only real lead on his last sixteen years in Italy. Not time-sensitive.',
    nextSteps: 'Ask family about Ezio\'s work in Italy 1963–1975 (agronomist? teaching?). Consider requesting a carriera record from the pension authority or comune. Pull this thread when archive requests are settled.',
  },
  {
    id: 'lead-irma-pirri-death',
    title: 'Irma Pirri: Death Search (1930–1952)',
    category: 'Buatti/Chiappini',
    status: 'To Investigate',
    description: 'Irma Pirri was already dead by 4 October 1952 — recorded on the NSW marriage certificate (reg. 27340/1952) for Ezio Buatti + Lilia Chiappini. Death window 1930–1952, almost certainly at San Benedetto del Tronto; she would have been at most about forty. The narrowest unexplored question in the Chiappini line — nobody has searched. Route: Curia di San Benedetto del Tronto (Sig.ra Veccia) — a burial record would sit in the same parish registers already circulating among the SBT parishes. Thread warm, do not poke before September.',
    nextSteps: 'After September: ask the Curia (Sig.ra Veccia) for Irma Pirri\'s death/burial record. Certificate checked (Aug 2026): records "Irma Pirri (deceased)"; Remo Chiappini recorded as living as of 4 Oct 1952. No further detail on Irma on the certificate.',
  },
  {
    id: 'lead-chiappini-1930-marriage',
    title: 'Comune di SBT — Copia Integrale 1930 Marriage Act (Remo × Irma)',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    description: 'Narrowed request emailed (Aug 2026) to Rosa De Falco (SBT anagrafe) for the copia integrale of the 1930 marriage act of Remo Chiappini × Irma Pirri (Lilia born Jul 1930). The marriage act names both sets of parents — the key to Remo and Irma\'s own parentage, converging with the Australian marriage transcript (reg. 27340/1952) from the other direction. Two independent sources converging on Remo and Irma\'s parents.',
    nextSteps: 'Await reply from Rosa De Falco. The 1930 act will name the parents of both spouses.',
  },
  {
    id: 'lead-trove-buatti-negative',
    title: 'Trove: Buatti Surname — Negative Search',
    category: 'Buatti/Chiappini',
    status: 'Completed',
    description: '"Buatti Chiappini" (no date/place) and bare "Buatti" return nothing across Trove\'s digitised NSW newspapers (Aug 2026) — the surname Buatti is effectively absent from the digitised text. Weak negative: Trove\'s default search is AND across all terms, and Hunter Valley papers (Maitland Daily Mercury, Newcastle Morning Herald) are patchily digitised for the early 1950s. Newspaper route closed; the stronger source was always NSW BDM (reg. 27340/1952, already obtained Jul 2026).',
    nextSteps: 'None — route closed. Wedding date/location already confirmed via NSW BDM and the Branxton parish extract.',
  }
];

export const initialOpenQuestions: OpenQuestion[] = [
  {
    id: 'q-buatti-parents',
    question: 'Who are the parents of Alfredo Buatti (Sr.)?',
    category: 'Buatti/Chiappini',
    status: 'Resolved',
    notes: 'RESOLVED 17 Jul 2026: Parents = Giovanni Buatti (b. 25 Jun 1852) + Emidia Bruni (b. 26 Nov 1857), per foglio famiglia N. 1527. Grandparents = Emidio Buatti + Antonia Lenzi (Rotella). Great-grandparents: Achille Bruni × Sperandia Sagretani (lettura incerta).'
  },
  {
    id: 'q-ida-galanti-parents',
    question: 'Which Ida Galanti (1893 vs 1904) married Alfredo Buatti?',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    notes: '1893 Ida confirmed as real person (19 Mar 1893, d/o Antonio Galanti + Virginia Rosati, landowning family from Lisciano) via foglio 5120 (18 Jul 2026). Marriage to Alfredo unconfirmed — right-hand columns not visible. 1904 Ida (f. 5545, d/o Ignazio Galanti + Clementina Curcozzi) also checked. BREAKTHROUGH (22 Jul 2026): Galanti Alessandro on WWI Morti allegati (an_ua8575, 6-Div 2) — fu Ignazio Galanti, mother Clementina Curcozzi. First hard evidence that Ignazio + Clementina were a real couple with children in Ascoli Piceno. Makes 1904 Ida candidate more credible (second confirmed child of same parents). Alessandro born ~1895 (13 Jul vs 8 Nov — document disagreement, trust official extract). Perugia file (4 Aug 2026) confirms "Galanti Ida" as Ezio\'s mother across four institutional sources but gives no birth date or paternity; a 1944 certificato di nascita deposited by Ezio with the University (enclosure 3, domanda prot. 1746) was NOT among the reproduced pages — follow-up emailed to Monica Fiore (5 Aug 2026). Tribunale AP route CLOSED (archive interdetto, 20 Jul). Live routes: Comune AP prot. 66127/2026 (Ezio birth act — chased with 1944 photo attestation), Comune AP prot. 0062771 (marriage cert), Comune SBT prot. 0054400/2026 (to be widened to stato di famiglia storico). Remaining Morti allegati divisions (5-Div 1, 5-Div 2, 6-Div 1) may contain more Galanti siblings.'
  },
  {
    id: 'q-ezio-birth',
    question: 'Where is Ezio Buatti\'s birth record (27 Apr 1923)?',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    notes: 'Ascoli Piceno civil registry digitised only to 1919 on Antenati. 100-year embargo lifted 2023. Comune AP request prot. 66127/2026 lodged 20 Jul 2026 — chase sent ~Aug 2026 citing the 1944 comune photograph attestation ("BUATTI EZIO di Alfredo e di Galanti Ida, nato e residente in questo Comune"). Tribunale AP route CLOSED (20 Jul, archive interdetto). Buondi letter (AS-AP prot. 1805-P, 21 Jul) confirms Antenati anagrafe storica covers only Ascoli Piceno city. Perugia file (4 Aug 2026) also held — or holds — a 1944 birth cert (enclosure 3 of Ezio\'s admission application): follow-up with Monica Fiore (5 Aug 2026).'
  },
  {
    id: 'q-bruna-birth',
    question: 'Where is Bruna Lilia Chiappini\'s birth record (3 Jul 1930) and who was her mother?',
    category: 'Buatti/Chiappini',
    status: 'Pending',
    notes: 'San Benedetto del Tronto is a separate comune. 1930 record covered by privacy embargo until 2030. Comune protocol 0054400/2026 (22 Jul 2026) — receipt confirmed. Buondi letter (AS-AP prot. 1805-P, 21 Jul 2026) confirms SBT is wholly undigitised on Antenati; the comune\'s anagrafe holds the stati di famiglia. UPDATE (Aug 2026): SBT anagrafe REFUSED the stato di famiglia storico — returned a checklist with nothing ticked; the form requires the requester to answer a motivation question (Italian privacy law) before proceeding. Original Alfredo × Ida marriage angle was likely a thread mix-up (Ascoli Piceno is the correct jurisdiction).'
  },
  {
    id: 'q-remo-wife',
    question: 'Is the TB/"San Giorgio" story about Irma Pirri or a different wife of Remo?',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    notes: 'Irma Pirri confirmed as Lilia\'s mother via Branxton Catholic Parish marriage extract (4 Oct 1952). NEW (Aug 2026): Irma was already dead by 4 Oct 1952 (NSW marriage cert 27340/1952) — death window 1930–1952; Remo recorded as living as of that date. The TB story (wife contracted an infection after childbirth, died about a month after being sent to "San Giorgio") may relate to Irma or to a different wife; the story involves a son, not Lilia. "San Giorgio" likely Porto San Giorgio, Fermo, Marche. Need dates.'
  },
  {
    id: 'q-irma-pirri-death',
    question: 'When and where did Irma Pirri die?',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    notes: 'Already dead by 4 Oct 1952 (recorded on NSW marriage cert 27340/1952, West Maitland & Singleton district). Window 1930–1952, probably San Benedetto del Tronto; she would have been at most about forty. Route: Curia di San Benedetto del Tronto (Sig.ra Veccia) — a burial record would sit in the parish registers already circulating. Act after September (thread warm, don\'t poke before then). Certificate copy checked Aug 2026: "Irma Pirri (deceased)"; no other detail.'
  },
  {
    id: 'q-bruna-servant',
    question: 'Why did Bruna travel as a "servant" on the 1952 manifest?',
    category: 'Buatti/Chiappini',
    status: 'Pending',
    notes: 'Worth asking family whether they were already married, engaged, or travelling independently. "Servant" may reflect her sponsorship category.'
  },
  {
    id: 'q-gregorio-death',
    question: 'What is Gregorio Emmi\'s exact date of death?',
    category: 'Emmi/Patanè',
    status: 'In Progress',
    notes: 'Funeral held 30 Nov 1979. Actual death likely a few days prior. Ask Angie if a death certificate or funeral notice survives.'
  },
  {
    id: 'q-sydney-move',
    question: 'When and why did the Emmi family relocate from Ingham to Sydney?',
    category: 'Emmi/Patanè',
    status: 'Pending',
    notes: 'Gregorio was buried at Rookwood, Sydney in 1979, indicating a move occurred between 1950 and 1979.'
  },
  {
    id: 'q-gregorio-birth-civil',
    question: 'How can we obtain Gregorio\'s civil birth record (27 Oct 1915)?',
    category: 'Emmi/Patanè',
    status: 'In Progress',
    notes: 'All FamilySearch/Antenati digital routes exhausted. Request emails sent 28 June 2026 to Comune di Linguaglossa and Archivio di Stato di Catania. Awaiting replies.'
  },
  {
    id: 'q-rosaria-baptism',
    question: 'How can we obtain Rosaria Patanè\'s baptismal record (23 May 1924)?',
    category: 'Emmi/Patanè',
    status: 'In Progress',
    notes: 'FamilySearch DGS 5429284 is restricted. Outreach emails sent 28 June 2026 to Diocesi di Acireale and parish. Awaiting replies.'
  },
  {
    id: 'q-patane-vecchio-marriage',
    question: 'When and where did Rosario Patanè & Venera Vecchio marry, and who were their parents?',
    category: 'Emmi/Patanè',
    status: 'Resolved',
    notes: 'RESOLVED 28 Jun 2026: Married 24 Apr 1911 at Parrocchia Maria SS.ma Immacolata, Fiumefreddo (Liber Matrimoniorum N.18). Parents: Rosario = Sebastiano Patanè & Rosaria D\'Agata; Venera = Vincenzo Vecchio & Rosaria Raiti (corrected from Raciti). Baptism certificate in processetti also confirmed Rosario born 9 Feb 1889 in Calatabiano. Giuseppe Patanè (married Sebastiana Gugliandolo 19 Feb 1911) shares the same parents — Rosario\'s brother.'
  },
  {
    id: 'q-venera-birth',
    question: 'What is Venera Buatti\'s exact date and place of birth?',
    category: 'Emmi/Patanè',
    status: 'Pending',
    notes: 'Living. Need to ask her or family directly.'
  },
  {
    id: 'q-naa-rosario-patane-1967',
    question: 'Does the NAA file for Rosario Patanè (b. 1895) reveal a connection to Rosaria Patanè\'s family?',
    category: 'Emmi/Patanè',
    status: 'In Progress',
    notes: 'NAA: A446, 1967/39646. Access application RK26/00009589 submitted 28 June 2026. Could be Rosaria\'s father, or Pietro Patanè (the Ingham sponsor), or another relative.'
  },
  {
    id: 'lead-second-pietro-patane-q30224',
    question: 'Is the second Pietro Patanè (Q30224, b. 29 Nov 1912, Halifax) related to our Pietro or to Rosario Patanè?',
    category: 'Emmi/Patanè',
    status: 'In Progress',
    notes: 'NAA POW record Q30224 documents a different Pietro Patanè: born 29 Nov 1912 in Milo (recorded as "Milan"), son of Filadelfo Patanè and Maria Lofara (deceased). Labourer at Halifax QLD. Also married to a Maria Patane (different woman, same name). Interned Cowra, released Feb 1943. Both from Milo, both arrived on ORAMA ~1930 — suggests a Patanè cluster from Milo. Parents\' names (Filadelfo + Maria Lofara) give us a second Milo Patanè family line to investigate.'
  },
  {
    id: 'q-sebastiano-rosaria-deaths',
    question: 'When and where did Sebastiano Patanè (b. ~1850) and Rosaria D\'Agata (b. ~1855) die?',
    category: 'Emmi/Patanè',
    status: 'In Progress',
    notes: 'PARTIALLY RESOLVED 20 Jul 2026: Rosaria D\'Agata found — Morti 1916, atto 11 (DGS 7851868), died 3 Mar 1916. Parents confirmed: Salvatore D\'Agata + Venera Maccarrone (Generation -2). Sebastiano NOT found on free film (DGS 7851868, Morti 1911–1928). Last alive 21 Nov 1928 (domiciliato per atto 60 — son Mariano\'s death act). Likely died 1929+, under comune embargo. Comune email sent (annotazione on birth act atto 15/1850 covers all scenarios).'
  },
  {
    id: 'q-vincenzo-vecchio-parents',
    question: 'Who are Vincenzo Vecchio\'s parents?',
    category: 'Emmi/Patanè',
    status: 'Resolved',
    notes: 'RESOLVED 20 Jul 2026: Parents = Sebastiano Vecchio (villica?) × Sebastiana Panebianco (villica?), per marriage act atto 8, Fiumefreddo Matrimoni 1886 (DGS 7841136). Rosaria Raiti\'s parents also confirmed in same act: Salvatore Raiti (bracciante) × Venera Previtera (villica?). Next: find their own birth acts (Nati 1861–1865, DGS 7853312) to push generation -2 further back.'
  }
];
