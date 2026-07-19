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
      'Aunt Ida Buatti (b. 20 Mar 1886) — potential source of confusion with his wife Ida Galanti in future records.',
      'Siblings: Attilio (1885), Ida (1886), Adolfo (1887), Sperandia (1889), Antonio (1894), Elisa (1899). Two infant deaths: Elisa (1883–1884) and Arturo (1892).',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '18 Mar 1888 — foglio famiglia N. 1527 + cartellino individuale (Archivio di Stato di Ascoli Piceno, 17 Jul 2026). Links: foglio https://antenati.cultura.gov.it/ark:/12657/an_ua8378/oLplvkL cartellino https://antenati.cultura.gov.it/ark:/12657/an_ua8562/5gKpOz5' },
      { type: 'Marriage Record', status: 'Searching', notes: 'To Ida Galanti — likely ~1920–1922. Requested from Comune di Ascoli Piceno (prot. 0062771).' },
      { type: 'Death Record', status: 'Found', notes: '9 May 1964 — confirmed via Comune cemetery search (database shows 9/5/1964, Italian format)' },
      { type: 'Burial Record', status: 'Found', notes: 'Cimitero di Borgo Solestà, Settore L, Blocco L074O' }
    ,
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'In Progress',
      details: 'Birth confirmed 18 Mar 1888 via foglio famiglia N. 1527 (Alessandra Buondi, 17 Jul 2026). Parents: Giovanni Buatti + Emidia Bruni. Grandparents: Emidio Buatti + Antonia Lenzi. Marriage to Ida Galanti and her parentage still outstanding.',
      nextSteps: [
        'Search Antenati anagrafe series for Alfredo and Ida\'s marriage record.',
        'Ida Galanti\'s birth year (1898) still unsourced — marriage cert from Comune will settle it.',
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
      details: '1893 Ida confirmed as real person (foglio 5120): born 19 Mar 1893 to Antonio Galanti + Virginia Rosati, landowning family from Lisciano. Right-hand columns visible but BLANK — no marriage annotation. Register closed ~1901 (last entries: Ersilia b. 1901, Annibale departed for Folignano 1901). At Ezio\'s birth (1923) she\'d be 30 — sensible. 1904 Ida (f. 5545, d/o Ignazio Galanti the barber + Clementina Curcozzi) also documented — both candidates still alive. Two emails sent 18 Jul 2026: (1) Comune AP — Ezio\'s copia integrale di nascita; (2) Tribunale AP — marriage act + allegati. Tiebreaker now depends on correspondence.',
      nextSteps: [
        'Await Comune AP reply for Ezio\'s birth act (sent 18 Jul 2026 to protocollo@comune.ap.it). Ida\'s age at his birth settles 1893 vs 1904.',
        'Await Tribunale AP reply for marriage act + allegati (sent 18 Jul 2026 to cancelleria.civile.tribunale.ascolipiceno@giustizia.it).',
        'Await marriage cert reply from Comune (protocol 0062771 — Sergio De Angelis).',
        'Check FamilySearch Catalog for Ascoli Piceno Matrimoni 1919–1923 and Nati 1923.'
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
      'Children: Elisa (1883–1884), Attilio (1885), Ida (1886), Adolfo (1887), Alfredo (1888), Sperandia (1889), Arturo (1892), Antonio (1894), Elisa (1899).',
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
    birthDate: '28 November 1857',
    birthPlace: 'Ascoli Piceno, S. Vittore parish',
    deathDate: 'Unknown',
    spouses: ['giovanni-buatti'],
    parents: ['antonio-bruni', 'sperandia-pasqualini'],
    children: ['alfredo-buatti-sr'],
    notes: [
      'CONFIRMED 17 Jul 2026 via foglio famiglia N. 1527 (Archivio di Stato di Ascoli Piceno, Alessandra Buondi).',
      'Wife of Giovanni Buatti. Daughter of Antonio Bruni and Sperandia Pasqualini.',
      'Mother of Alfredo Buatti (b. 18 Mar 1888) and his eight siblings.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '28 Nov 1857, Ascoli Piceno (S. Vittore parish) — per foglio famiglia N. 1527' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ,
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'Confirmed',
      details: 'Identified via foglio famiglia N. 1527 (17 Jul 2026). Daughter of Antonio Bruni + Sperandia Pasqualini.',
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
      'IMPORTANT: Marriage to Alfredo Buatti unconfirmed. 1904 Ida candidate (d/o Ignazio Galanti + Clementina Curcozzi, foglio 5545, Registro 59) also checked — both candidates unconfirmed. Two emails in flight: Ezio\'s birth act (Comune AP) + marriage act/allegati (Tribunale AP).',
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
    id: 'antonio-bruni',
    name: 'Antonio Bruni',
    generation: -2,
    line: 'Buatti',
    gender: 'M',
    birthDate: 'Unknown',
    birthPlace: 'Likely Ascoli Piceno area',
    deathDate: 'Unknown',
    spouses: ['sperandia-pasqualini'],
    parents: [],
    children: ['emidia-bruni'],
    notes: [
      'CONFIRMED via foglio famiglia N. 1527 (17 Jul 2026): father of Emidia Bruni.',
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
      details: 'Father of Emidia Bruni. All details unknown.',
    }
  },
  {
    id: 'sperandia-pasqualini',
    name: 'Sperandia Pasqualini',
    generation: -2,
    line: 'Buatti',
    gender: 'F',
    birthDate: 'Unknown',
    birthPlace: 'Unknown',
    deathDate: 'Unknown',
    spouses: ['antonio-bruni'],
    parents: [],
    children: ['emidia-bruni'],
    notes: [
      'CONFIRMED via foglio famiglia N. 1527 (17 Jul 2026): mother of Emidia Bruni, wife of Antonio Bruni.',
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
      details: 'Mother of Emidia Bruni. All details unknown.',
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
      'Details (which son, exact location/town of "San Giorgio," and dates) still need confirming, as this was relayed informally.'
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found — entirely unknown' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'To Irma Pirri — likely San Benedetto del Tronto or Ascoli Piceno' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ,
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'In Progress',
      details: 'Name confirmed as father of Lilia via Branxton marriage extract 10 Jul 2026. Wife now named (Irma Pirri). Remo\'s own details still unknown.',
      nextSteps: [
        'Search for Remo Chiappini records in San Benedetto del Tronto or Ascoli Piceno.',
        'Confirm the "San Giorgio" story and locate the town (possibly Porto San Giorgio in Fermo, Marche).',
        'Search for birth/marriage records of Remo Chiappini + Irma Pirri.'
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
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Name now known — search Ascoli Piceno area' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'To Remo Chiappini — likely San Benedetto del Tronto or Ascoli Piceno' },
      { type: 'Death Record', status: 'Not Found', notes: 'Unknown date — possibly connected to TB story' }
    ,
      { type: 'Baptism Record', status: 'Not Found', notes: 'Not yet located' },
      { type: 'Population Register', status: 'Not Found', notes: 'Not yet searched' }],
    researchStatus: {
      status: 'Confirmed — Name Only',
      details: 'Name confirmed as Lilia Chiappini\'s mother via Branxton marriage extract 10 Jul 2026. All other details unknown.',
      nextSteps: [
        'Search for birth/marriage records of Irma Pirri in Ascoli Piceno or San Benedetto del Tronto.',
        'Ask papa about Irma Pirri and whether the TB story relates to her.'
      ]
    }
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
        'Request allegati of marriage atto 59/1900 from Tribunale di Catania — contains certified copy of Egidio\'s birth act without needing to guess the year, plus Concetta\'s birth act in same folder.',
        'Search remaining Nati years: 1867 (first), 1872, 1866, and pre-1866 Borbonic series.',
        'Hunt the household: scan every Emmi birth for siblings of Antonino + Rosaria Nasti.',
        'Check Santa Maria delle Grazie baptism registers on FamilySearch.',
        'Send corrected follow-up to Comune di Linguaglossa: mother Nasti (not Raiti), marriage 4 Nov 1900 atto 59, father fu Antonino, clarify atto 141 is not ours.',
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
        'Concetta\'s birth act copy is also in the Egidio–Sgroi allegati folder (atto 59/1900) — request from ASCt alongside Egidio\'s.',
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
      'Civil birth record found (28 Jun 2026): Antenati, Calatabiano Nati 1889, atto n. 28. Born 8 Feb 1889 at 4:15 AM in Contrada Trifilippi, Calatabiano (originally read as "Trappitelli" — corrected to Trifilippi per comparison with Venera 1885 and Giuseppe 1887 acts, which use the same contrada). Declared 10 Feb 1889.',
      'DATE DISCREPANCY: Civil record says 8 Feb (4:15 AM); baptism extract says 9 Feb ("born yesterday" on 10 Feb). Civil record is the legal document, so 8 Feb 1889 is the official date.',
      'Father at birth: Sebastiano Patanè (39, castaldo/farm manager). Mother: Rosaria D\'Agata (his legitimate wife).',
      'Witnesses at registration: Sebastiano Intelisano (60, bracciante) & Giuseppe Intelisano (30, bracciante). Both illiterate.',
      'Margin note on civil birth act: "Joined in marriage with Venera Vecchio by act of 27 April 1911. Registered in Fiumefreddo." — suggests civil marriage was 27 Apr 1911 (vs church marriage 24 Apr 1911).',
      'Age 34 in May 1924, per Rosaria\'s birth record.',
      'Baptism certificate (10 Feb 1889, Calatabiano) found in marriage processetti packet. Baptized by Sac. Salvatore Catalano, godfather Giuseppe Caruso.',
      'RULED OUT (28 June 2026): A 1923 marriage banns for a Rosario Patanè (son of Michele Patanè & Caterina Mangano) marrying Grazia Coco was investigated and confirmed to be a different person.',
      'RULED OUT: Calatabiano Nati 1884 atto 103 — Rosario Patanè (son of Giuseppe Patanè, bracciante × Francesca Prestipino) — a different Rosario Patanè born in the same town five years earlier. Flag for collision risk in later records.',
      'NAA file A446, 1967/39646 (Item ID 7775953) requested — access application RK26/00009589 submitted 28 Jun 2026.',
      'Giuseppe Patanè (born 4 Feb 1887, atto 31 Calatabiano) shares same parents (Sebastiano & Rosaria D\'Agata) — confirmed as Rosario\'s brother via civil birth act.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '8 Feb 1889, Calatabiano — atto n. 28, Antenati. Born at 4:15 AM in Contrada Trifilippi (originally read as Trappitelli — corrected per cross-comparison with Venera 1885 and Giuseppe 1887). Father: Sebastiano Patanè (39, castaldo). Mother: Rosaria D\'Agata.' },
      { type: 'Baptismal Record', status: 'Found', notes: '9/10 Feb 1889, Calatabiano. Baptized by Sac. Salvatore Catalano at Chiesa dell\'Amministrazione della Beata Vergine e S. Giorgio Martire. Godfather: Giuseppe Caruso.' },
      { type: 'Marriage Record (Church)', status: 'Found', notes: '24 Apr 1911, Fiumefreddo. Banns 2, 9, 16 Apr 1911. Witnesses: Ascenzio Giuliano & Rosario Pagano. Celebrated by Fr. Eutichio Scarcella at Chiesa del S. Rosario.' },
      { type: 'Marriage Record (Civil)', status: 'Found', notes: '27 Apr 1911, Fiumefreddo — noted in margin of Calatabiano birth act n. 28' },
      { type: 'Death Record', status: 'Not Found', notes: 'Unknown — possibly pre-1950 if he did not migrate to Australia' },
      { type: 'NAA File (A446 1967/39646)', status: 'Searching', notes: 'Requested 28 Jun 2026 — due 2 Nov 2026' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Both civil birth act (8 Feb 1889, Calatabiano n. 28) and baptism extract (9/10 Feb 1889) found and cross-referenced. Parents, marriage, and children all confirmed from primary sources.',
      nextSteps: [
        'Investigate connection to Pietro Patanè (cane farm owner in Ingham) — both from Patanè lines in Milo/Calatabiano area.',
        'Search for Rosario\'s death record.',
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
    deathDate: 'Deceased by 1953',
    occupations: ['Casalinga (housewife)', 'Tailor (sartora)'],
    residences: ['Sezione Castello, Fiumefreddo di Sicilia'],
    spouses: ['rosario-patane-sr'],
    parents: ['vincenzo-vecchio', 'rosaria-raciti'],
    children: ['rosaria-patane', 'sebastiano-patane'],
    notes: [
      'Surname confirmed via Rosaria\'s civil birth record (1924).',
      'Recalled in family memory as a tailor (sartora).',
      'Recorded as "fu Venera" (the late Venera) on a 1953 Comune di Fiumefreddo photo-identity certificate.',
      'Note the recurrence of the name "Venera" in this family line, later given to her granddaughter Venera Buatti.',
      'Marriage record found (24 Apr 1911, Fiumefreddo, Liber Matrimoniorum N.18). Parents confirmed: Vincenzo Vecchio & Rosaria Raciti.',
      'RULED OUT (28 June 2026): A 1923 marriage banns for a Venera Vecchio (daughter of Carmelo Vecchio & Rosaria Ragonesi) marrying Giuseppe Di Blasi was investigated and confirmed to be a different person.',
      'Surname confirmed as Raciti (NOT Rapisardi) via Liber Matrimoniorum entry N.18 (fol. 240), viewed 29 Jun 2026. "Rapisardi" was a scribal error on the marriage certificate.',
      'BREAKTHROUGH (28 Jun 2026): Baptism register entry found — Fiumefreddo Battesimi 1762-1904, folio 240, entry n. 8. Image 007490026_01391.jpg.',
      'Exact birth date: 8 January 1888. Baptized same day. Full name recorded as "Veneranda Vecchio" (Veneranda, not Venera).',
      'Baptized by Rev. Nicola Sgarlata (with permission of the Economus Pastor).',
      'Godparents: Alfio Musumeci Casalino & Maria Raciti (daughter of Giuseppe) — confirms connection to the Raciti family through the godmother.',
      'Midwife: Concetta Marano delivered her.',
      'Margin note in baptism register: "Matrim. fuit de [---] cum Rosario Patanè die 24 Aprilis 1911" — cross-referencing to the marriage record already found.',
      'Liber Matrimoniorum N.18 (29 Jun 2026): confirms Venera = daughter of Vincentii et Rosariae Raciti. "Rapisardi" was a scribal error on the marriage certificate.',
      'Nickname: "Ni Ni Na" (Nenina?) per family memory (Connie Emmi, 28 Jun 2026).'
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: '8 Jan 1888, Fiumefreddo — civil equivalent not yet searched' },
      { type: 'Baptism Record', status: 'Found', notes: '8 Jan 1888, Fiumefreddo. Baptized same day by Rev. Nicola Sgarlata. Godparents: Alfio Musumeci Casalino & Maria Raciti. Midwife: Concetta Marano. Full name: Veneranda. Entry n. 8, folio 240.' },
      { type: 'Marriage Record', status: 'Found', notes: '24 Apr 1911, Fiumefreddo (church). Parents named: Vincenzo Vecchio & Rosaria Raciti.' },
      { type: 'Death Record', status: 'Found', notes: 'Pre-1953 — recorded as "fu Venera" on 1953 photo-identity cert' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Baptism found 28 Jun 2026 (Fiumefreddo Battesimi 1762-1904, fol. 240 n. 8). Exact birth date: 8 Jan 1888. Full name: Veneranda Vecchio. Mother\'s surname: Raciti. Death pre-1953.',
      nextSteps: [
        'Search Fiumefreddo civil births 1888 for the civil birth act.',
        'Investigate connection to Leonardo Vecchio (co-signer of Rosaria\'s accommodation guarantee in Ingham) — same surname, possibly relative.',
        'Explore the Raciti family lead via godmother Maria Raciti (daughter of Giuseppe).'
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
        title: 'Parish Marriage Certificate (28 Mar 1911)',
        type: 'Ecclesiastical Record',
        reference: 'Parrocchia Maria SS.ma Immacolata, Fiumefreddo di Sicilia'
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
      'Civil birth act found: Calatabiano Nati 1887, atto n. 31. Born 4 February 1887 at 7:20 AM in Contrada Trifilippi, Calatabiano. Declared 6 February 1887 by father Sebastiano Patanè (37, bracciante). Mother: Rosaria D\'Agata, his legitimate wife living with him. Witnesses: Leonardo Fazio (72, possidente) and Giuseppe Napoli (30, bracciante). All illiterate. Officer: Francesco Raineri Vecchio, assessor delegate.',
      'Margin note: married Sebastiana Gugliandalo di fu Michele, act of 19 February 1911, registered in Fiumefreddo, N. 8 — resolves the date tangle between parish marriage (20 Feb 1911) and civil banns (5 Feb 1911). Bride\'s surname appears as "Gugliandalo" — a third variant alongside Guglielmino and Cogliandolo.',
      '23 years old, bracciante, residing in Fiumefreddo in 1911 — age consistent with February 1887 birth to within days.',
      'First direct documentary sighting of Rosaria D\'Agata as a living named mother in a civil act.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '4 Feb 1887, Calatabiano — atto n. 31, Nati 1887. Born Contrada Trifilippi. Father: Sebastiano Patanè (37, bracciante). Mother: Rosaria D\'Agata. Officer: Francesco Raineri Vecchio. Margin: married Sebastiana Gugliandalo 19 Feb 1911, Fiumefreddo n. 8.' },
      { type: 'Marriage Record', status: 'Found', notes: '5 Feb 1911 (civil banns) / 19 Feb 1911 (civil marriage, atto n. 8 Fiumefreddo) / 20 Feb 1911 (parish). Bride: Sebastiana Guglielmino/Gugliandalo/Cogliandolo (21, daughter of late Michele Guglielmino & Caterina Strangano).' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Civil birth act found (atto 31/1887, Calatabiano). Parents confirmed: Sebastiano Patanè (37, bracciante) + Rosaria D\'Agata. Marriage margin note confirms civil marriage 19 Feb 1911, Fiumefreddo n. 8.',
      nextSteps: ['Fetch Fiumefreddo Matrimoni 1911 atto n. 8 for secondary parent confirmation and bride\'s family details.']
    }
  },
  {
    id: 'venera-patane-sibling',
    name: 'Venera Patanè',
    generation: 1,
    line: 'Patanè',
    gender: 'F',
    birthDate: '22 October 1885',
    birthPlace: 'Contrada Trifilippi, Calatabiano, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    occupations: ['Casalinga (homemaker)'],
    residences: ['Fiumefreddo di Sicilia'],
    spouses: ['orazio-pagano-sibling'],
    parents: ['sebastiano-patane-sr', 'rosaria-dagata'],
    children: [],
    notes: [
      'Sister of Rosario Patanè.',
      'Civil birth act found: Calatabiano Nati 1885, atto n. 160. Born 22 October 1885 at 4:20 PM, Contrada Trifilippi, Calatabiano. Declared 24 October 1885 at 9:15 AM before Filippo Dottor Leo (assessore delegato) by father Sebastiano Patanè (35, castaldo). Mother: Rosaria D\'Agata, his lawful wife living with him. Witnesses: Leonardo Fazio (70, possidente) and Salvatore Scalora (70, agricoltore). All illiterate. No marriage margin note visible on this copy (may be on the comune copy only).',
      '"Anni 23" at 1911 banns was wrong by ~3 years — confirms banns ages are unreliable.',
      'Marriage banns filed 8 Sep 1911, Fiumefreddo civil registry. Marriage celebrated 17 Sep 1911 in Calatabiano.',
      'Groom: Orazio Pagano (25, bracciante, son of Santo Pagano & Rosaria Pennisi).',
      'Mother recorded as "Ignazia D\'Agata" on the civil banns (variation of Rosaria D\'Agata).',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '22 Oct 1885, Calatabiano — atto n. 160, Nati 1885. Contrada Trifilippi. Father: Sebastiano Patanè (35, castaldo). Mother: Rosaria D\'Agata. Officer: Filippo Dottor Leo. Witnesses: Leonardo Fazio (70), Salvatore Scalora (70).' },
      { type: 'Marriage Record', status: 'Found', notes: '8 Sep 1911 (banns filed) / 17 Sep 1911 (celebrated), Fiumefreddo/Calatabiano. Groom: Orazio Pagano (25, son of Santo Pagano & Rosaria Pennisi).' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Civil birth act found (atto 160/1885, Calatabiano). Parents confirmed: Sebastiano Patanè (35, castaldo) + Rosaria D\'Agata. Born Contrada Trifilippi same as brother Giuseppe (1887). Father castaldo by 1885 (earlier than previously known).',
      nextSteps: [
        'Scan Calatabiano Nati 1880-1883 indexes for Patanè — any child of Sebastiano there pushes the marriage window earlier.',
        'If 1880-83 clean, search Calatabiano Matrimoni + pubblicazioni 1878-1885 (start 1883-85 highest probability).',
        'If marriage not in Calatabiano, pivot to Fiumefreddo Matrimoni 1878-1885.'
      ]
    }
  },
  {
    id: 'sebastiana-guglielmino',
    name: 'Sebastiana Guglielmino',
    generation: 1,
    line: 'Patanè',
    gender: 'F',
    birthDate: 'c. 1890',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['giuseppe-patane-sibling'],
    parents: [],
    children: [],
    notes: [
      'Wife of Giuseppe Patanè (brother of Rosario).',
      '21 years old, casalinga, residing in Fiumefreddo in 1911.',
      'Daughter of late Michele Guglielmino & Caterina Strangano.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'c. 1890, likely Fiumefreddo' },
      { type: 'Marriage Record', status: 'Found', notes: '5 Feb 1911, Fiumefreddo (civil banns) — married Giuseppe Patanè.' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Marriage confirmed via Fiumefreddo civil marriage banns.',
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
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['venera-patane-sibling'],
    parents: [],
    children: [],
    notes: [
      'Husband of Venera Patanè (sister of Rosario).',
      '25 years old, bracciante, residing in Fiumefreddo in 1911.',
      'Son of Santo Pagano & Rosaria C...',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'c. 1886, likely Fiumefreddo' },
      { type: 'Marriage Record', status: 'Found', notes: '17 Sep 1911, Fiumefreddo (civil banns) — married Venera Patanè, ceremony in Calatabiano.' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Marriage confirmed via Fiumefreddo civil marriage banns.',
      nextSteps: ['Search Fiumefreddo records for his birth.']
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
    birthDate: '~1849–1850 (age 26 at marriage Apr 1876, age 35 at Venera\'s birth 1885)',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['rosaria-dagata'],
    parents: ['mariano-patane', 'leonarda-buonaventura'],
    children: ['rosario-patane-sr', 'giuseppe-patane-sibling', 'venera-patane-sibling'],
    notes: [
      'MARRIAGE FOUND: Fiumefreddo Matrimoni 1876, atto 5 (3 May 1876). Pubblicazioni atto 4 (13 Apr 1876). Before Sindaco Carmelo Fichera. Both spouses born in and resident in Fiumefreddo. Age 26, bracciante. Banns published 16 and 23 Apr 1876. Birth extracts issued by the comune 21 Apr 1876 and deposited in the allegati (atto 5 bundle). Witnesses: Mariano Lo Scavo (26) and Domenico Torrisi (39), braccianti. All illiterate.',
      'Parents named in marriage act: fu Mariano Patanè (deceased before Apr 1876) and Leonarda Buonaventura (industriosa, living in Fiumefreddo).',
      'Father of Rosario Patanè, Giuseppe Patanè, and Venera Patanè — all confirmed.',
      'Age stack: 26 (Apr 1876) → 35/37/39 (Oct 1885/Feb 1887/Feb 1889) — perfectly consistent, born ~1849-50.',
      'Occupation: bracciante at marriage (1876), then castaldo (farm manager) by 1885 Calatabiano posting — a career progression.',
      'Born and married in Fiumefreddo. The Calatabiano years (1884–~1893) were a temporary posting as castaldo at Contrada Trifilippi. The family\'s 1911 return to Fiumefreddo was a return, not a migration.',
      'Giuseppe\'s Calatabiano 1887 act briefly recorded him as bracciante (likely clerk simplification); all other acts read castaldo.',
      'Sibling confirmed: Giuseppa Patanè married Alfio Vecchio in Fiumefreddo 1880 — Patanè-Vecchio connection runs two generations deep before Rosario × Venera (1911).',
      '9-year gap (1876–1885) almost certainly contains children born in Fiumefreddo. Predicted names: Mariano, Leonarda, Salvatore.',
      'Exclusion log — Calatabiano Nati 1880-1884 all excluded (nine entries across seven households, none connected). Calatabiano Matrimoni 1870-1885 all excluded.',
    ],
    records: [
      { type: 'Marriage Record', status: 'Found', notes: '3 May 1876, Fiumefreddo — atto 5 (Matrimoni). Pubblicazioni atto 4 (13 Apr 1876). Sindaco: Carmelo Fichera. Groom: Sebastiano Patanè (26, bracciante, born Fiumefreddo). Bride: Rosaria D\'Agata (21, industriosa, born Fiumefreddo). Parents: fu Mariano Patanè + Leonarda Buonaventura (groom); Salvatore D\'Agata + Venera Maccarrone (bride).' },
      { type: 'Birth Record', status: 'Not Found', notes: '~1849–1850, Fiumefreddo — copy in allegati atto 5/1876 bundle' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Marriage found 3 May 1876, Fiumefreddo atto 5. Born in Fiumefreddo, son of Mariano Patanè (fu) + Leonarda Buonaventura. All prior ages confirmed. Calatabiano was a temporary castaldo posting. Fiumefreddo Nati 1877-1884 likely holds children from the 9-year gap.',
      nextSteps: [
        'Pull the allegati for Fiumefreddo Matrimoni 1876 atto 5 — contains birth extracts of both spouses (issued 21 Apr 1876), giving exact dates, act numbers, and possibly grandparents.',
        'Search Fiumefreddo Nati 1877-1884 for Patanè children of Sebastiano × Rosaria (gap years).',
        'Search Fiumefreddo Morti for Mariano Patanè (died before Apr 1876) — names his parents (Generation -2).',
        'Search Fiumefreddo Morti for Salvatore D\'Agata (b. ~1817) and Venera Maccarrone — each names their parents.',
      ]
    }
  },
  {
    id: 'rosaria-dagata',
    name: 'Rosaria D\'Agata',
    generation: 0,
    line: 'Patanè',
    gender: 'F',
    birthDate: '~1855 (age 21 at marriage Apr 1876)',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['sebastiano-patane-sr'],
    parents: ['salvatore-dagata', 'venera-maccarrone'],
    children: ['rosario-patane-sr', 'giuseppe-patane-sibling', 'venera-patane-sibling'],
    notes: [
      'Mother of Rosario Patanè, Giuseppe Patanè, and Venera Patanè.',
      'Marriage to Sebastiano Patanè: 3 May 1876, Fiumefreddo atto 5. Age 21, industriosa (home-based textile work), born in Fiumefreddo, resident there.',
      'Parents named in marriage act: Salvatore D\'Agata (59, bracciante, living) and Venera Maccarrone (industriosa, living), both resident Fiumefreddo.',
      'First civil documentary sighting: Giuseppe\'s birth (atto 31/1887, Calatabiano) names her as "Rosaria D\'Agata, sua legittima sposa convivente."',
      'Naming convention: firstborn daughter Venera (1885) named for maternal grandmother Venera Maccarrone.',
      'All three children born at Contrada Trifilippi, Calatabiano during the family\'s temporary posting there (~1884–1893).',
      'Also recorded as "Ignazia D\'Agata" on Venera\'s 1911 marriage banns (scribal variation).',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: '~1855, Fiumefreddo — copy in allegati atto 5/1876 bundle' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Parents and marriage confirmed via Fiumefreddo Matrimoni atto 5, 3 May 1876. Daughter of Salvatore D\'Agata (bracciante, b. ~1817) + Venera Maccarrone (industriosa). Born in Fiumefreddo. First documentary sighting: marriage act.'
    }
  },
  // --- GENERATION -1: Great-Great-Great-Grandparents (Patanè Line — newly opened) ---
  {
    id: 'mariano-patane',
    name: 'Mariano Patanè',
    generation: -1,
    line: 'Patanè',
    gender: 'M',
    birthDate: 'Unknown — possibly ~1810-1820',
    birthPlace: 'Likely Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Before April 1876 (recorded as "fu" at son\'s marriage)',
    spouses: ['leonarda-buonaventura'],
    parents: [],
    children: ['sebastiano-patane-sr', 'giuseppa-patane-sibling'],
    notes: [
      'CONFIRMED as father of Sebastiano Patanè via Fiumefreddo Matrimoni atto 5, 3 May 1876. Recorded as "fu Mariano" (the late Mariano) — died before Apr 1876.',
      'Also father of Giuseppa Patanè (married Alfio Vecchio in Fiumefreddo, Dec 1880) — confirmed via 1880 banns.',
      'Occupation unknown — likely bracciante (son Sebastiano was bracciante then castaldo).',
      'Death act (pre-1876, Fiumefreddo Morti) would name his parents — Generation -2 target.',
      'Not the same as Mariano Patanè (falegname, b. ~1845, × Carmela) of the Calatabiano carpenter cluster — those are a different household.',
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
    birthDate: 'Unknown',
    birthPlace: 'Likely Fiumefreddo di Sicilia or nearby',
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
    birthDate: '~1817 (age 59 at daughter\'s marriage Apr 1876)',
    birthPlace: 'Fiumefreddo di Sicilia, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['venera-maccarrone'],
    parents: [],
    children: ['rosaria-dagata'],
    notes: [
      'CONFIRMED as father of Rosaria D\'Agata via Fiumefreddo Matrimoni atto 5, 3 May 1876. Age 59 at wedding → born ~1817. Occupation: bracciante (day labourer). Resident in Fiumefreddo.',
      'Wife: Venera Maccarrone (industriosa, living 1876).',
      'Death act would name his parents — Generation -2 target for the D\'Agata line.',
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
    birthDate: 'Unknown',
    birthPlace: 'Likely Fiumefreddo di Sicilia area',
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
    deathDate: 'Unknown',
    spouses: ['alfio-vecchio-sibling'],
    parents: ['mariano-patane', 'leonarda-buonaventura'],
    children: [],
    siblings: ['sebastiano-patane-sr'],
    notes: [
      'CONFIRMED sister of Sebastiano Patanè — same parents: fu Mariano Patanè and Leonarda Bonaventura.',
      'Originally identified in Fiumefreddo Pubblicazioni Dec 1880: marriage banns of Alfio Vecchio (24, bracciante, born Fiumefreddo, son of Sebastiano Vecchio and Sebastiana Panebianco) × Giuseppa Patanè (daughter of fu Mariano and Leonarda Bonaventura).',
      'Links the Patanè and Vecchio families two generations before Rosario Patanè married Venera Vecchio in 1911.',
      'Husband Alfio Vecchio (b. ~1856) is NOT the same as Don Alfio Vecchio (b. ~1843, Riposto, civile) who married Teresa Pianella in 1877 — different birth year, birthplace, class, and parents entirely.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Not yet located — search Fiumefreddo Nati' },
      { type: 'Marriage Record', status: 'Found', notes: 'Dec 1880, Fiumefreddo — pubblicazioni. Groom: Alfio Vecchio (24, bracciante, son of Sebastiano Vecchio + Sebastiana Panebianco).' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Confirmed as sister of Sebastiano Patanè via Fiumefreddo pubblicazioni Dec 1880. Patanè-Vecchio connection now traced two generations deep.',
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
    birthDate: 'Unknown',
    deathDate: 'Unknown',
    spouses: ['rosaria-raciti'],
    parents: [],
    children: ['venera-vecchio'],
    notes: [
      'Father of Venera Vecchio, confirmed via 1911 parish marriage certificate.',
      'From Fiumefreddo di Sicilia.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found yet' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ],
    researchStatus: {
      status: 'Outstanding',
      details: 'Name confirmed as father of Venera Vecchio.'
    }
  },
  {
    id: 'rosaria-raciti',
    name: 'Rosaria Raciti',
    generation: 0,
    line: 'Patanè',
    gender: 'F',
    birthDate: 'Unknown',
    deathDate: 'Unknown',
    spouses: ['vincenzo-vecchio'],
    parents: [],
    children: ['venera-vecchio'],
    notes: [
      'Mother of Venera Vecchio, confirmed via 1888 baptism register and Liber Matrimoniorum N.18 (24 Apr 1911).',
      'Surname definitively Raciti — "Rapisardi" on marriage certificate was a scribal error. Baptism godmother was Maria Raciti (daughter of Giuseppe), likely a relative.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found yet' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ],
    researchStatus: {
      status: 'Outstanding',
      details: 'Name confirmed as mother of Venera Vecchio. Slight variation (Brancati) in one source.'
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
          details: 'Departed Melbourne with sons Alfred (6) and John. Lilia stayed in Australia. Intended as a 6-month visit to see ailing father Alfredo Sr. (colon cancer). "Noted for Return" stamp. After Alfredo died 9 May 1964, Ezio stayed because he would not uproot Ida. Stayed 12 years; returned 1975.'
        }
      ]
    },
    italianAddress: 'Via Mercantini N° 62, Ascoli Piceno (later); Via B[arro?] 11, Ascoli Piceno (pre-1942, from matricolare)',
    passport: {
      number: '3925755 P',
      issued: '19 June 1952',
      issuedBy: 'Ascoli Piceno, Italy'
    },
    alienRegistration: '290718',
    education: [
      'Diploma di Perito Agrario, R. Ist. Tecn. "Celso Ulpiani", Ascoli Piceno, July 1942',
      'Certificato di cultura generale, Liceo Scientifico di Ascoli Piceno (c. 1944 — for university entry qualification)',
      'Laurea in Scienze Agrarie, Università di Perugia, 26 November 1949'
    ],
    military: {
      service: 'Italian Army',
      details: 'Conscript class 1923, Distretto Militare di Ascoli Piceno. Recalled by RSI (Salò) Nov 1943, depennato (struck off) 17 Jan 1944. Called up 1950 for officer cadet school (Rieti, Fanteria), discharged "deficiente attitudine militare" after infirmary stay. Final discharge 9 Jan 1951.'
    },
    notes: [
      'Ruolo matricolare n. 20102 received from Archivio di Stato di Ascoli Piceno (Alessandra Buondi) 13 Jul 2026 — waived €4 fee, sent directly. Confirms: full name, parentage (Alfredo + Ida Galanti), DOB 27 Apr 1923, height 1.78m. Education: perito agrario diploma July 1942 (Celso Ulpiani), laurea in Scienze Agrarie 26 Nov 1949 (Perugia). RSI recall Nov 1943, depennato Jan 1944. Officer cadet at Rieti 1950, discharged for deficient military aptitude after infirmary stay. Final congedo illimitato 9 Jan 1951.'
    ],
    records: [
      { type: 'Birth Record', status: 'Searching', notes: '27 Apr 1923 — embargo lifted 2023, digital gap in Ascoli Piceno records' },
      { type: 'Death Record', status: 'Found', notes: '16 Oct 1991 — confirmed by family' },
      { type: 'Immigration File (NAA)', status: 'Found', notes: 'B78, ITALIAN/BUATTI EZIO — digitised copy received 9 Jul 2026 (Item 5746087). Full file: arrival form RA, marriage notification, passport photo.' },
      { type: 'Alien Registration', status: 'Found', notes: 'No. 290718, issued Sydney 27 Sep 1952. Re-issued 23 Jan 1957 (entered register 22 Feb 1957).' },
      { type: 'Passenger List', status: 'Found', notes: 'Toscana, 27 Sep 1952 — NAA K269. Also Fremantle customs stamp 15 Sep 1952.' },
      { type: 'Marriage Record', status: 'Found', notes: 'Lilia Chiappini, 4 Oct 1952 at St Anthony\'s Catholic Church, Greta, NSW — cert C810020. Branxton Parish extract (10 Jul 2026) confirms parents Remo Chiappini + Irma Pirri, witnesses Emidio Pica + Domenico Michetti, celebrant Rev Z Lewandowski.' },
      { type: 'Bankruptcy Record', status: 'Found', notes: 'No. 248 of 1957. Café & milk bar proprietor, Broadford VIC. Petition & sequestration order 2 Oct 1957. Listed as "unemployed" at time. Public examination 2 Sep 1958 (Trove, Commonwealth Gazette 17 Oct 1957 & 28 Aug 1958).' },
      { type: 'Military Record (Ruolo Matricolare)', status: 'Found', notes: 'Foglio matricolare n. 20102, Distretto di Ascoli Piceno. Received from Archivio di Stato di Ascoli Piceno (Alessandra Buondi) 13 Jul 2026. Confirms education, RSI recall/depennato, officer cadet at Rieti, discharge 1951.' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'NAA B78 file digitised and received 9 Jul 2026. Ruolo matricolare received 13 Jul 2026 (Alessandra Buondi). Perugia fascicolo studente found 15 Jul 2026 (Monica Fiore) — thesis title, exam marks, graduation score, authenticated photo awaiting digital delivery. Education confirmed: perito agrario (1942), Liceo Scientifico culture cert (c. 1944), laurea Scienze Agrarie Perugia (1949). RSI recall/depennato WWII.',
      nextSteps: [
        'Perugia found file (Monica Fiore, 15 Jul). Forms + docs returned. Awaiting digital scans — will include thesis title, exam marks, graduation score, authenticated photo.',
        'Alessandra replied: fee waived, Archivio does not hold school records.',
        'Send USP and Ulpiani emails (drafts ready in research notes).',
        'Contact Comune di Ascoli Piceno for 1923 birth record — now have passport details and matricolare confirmation.',
        'Order marriage certificate C810020 from NSW Registry of Births Deaths & Marriages.',
        '[DONE] Trove: Broadford café & milk bar proprietor, bankruptcy Oct 1957, public exam Sep 1958.',
        'RecordSearch BUATTI sweep — search for Lilia\'s naturalisation file V653748, Ezio\'s bankruptcy file 248/1957.',
        'Find Neptunia outbound passenger list for 13 Sep 1963 to confirm who travelled.',
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
      'Branxton Catholic Parish marriage register extract (10 Jul 2026) confirms: married Ezio Buatti 4 Oct 1952 at St Anthony\'s Catholic Church, Greta, by Rev Z Lewandowski. Witnesses: Emidio Pica and Domenico Michetti (both Greta Camp). Parents listed: Remo Chiappini and Irma Pirri, both of Ascoli Piceno, Italy.',
    ],
    records: [
      { type: 'Birth Record', status: 'Searching', notes: '3 Jul 1930 — embargo until 2030, contact Comune di San Benedetto del Tronto' },
      { type: 'Death Record', status: 'Found', notes: '23 May 1998 — burial confirmed' },
      { type: 'Burial Record', status: 'Found', notes: 'Springvale Botanical Cemetery, Spotted Gums, Row AS, Grave 68' },
      { type: 'Alien Registration', status: 'Found', notes: 'No. 290730 — issued same batch as Ezio (290718), Sydney 27 Sep 1952. Per Ezio\'s marriage notification (Form RA 6).' },
      { type: 'Naturalisation Record', status: 'Found', notes: 'Commonwealth Gazette notice, 18 Nov 1965 — lists address 303 Punt Rd, Richmond. Cert EF10155554, file V653748 (Victorian registry). Confirmed by NAA.' },
      { type: 'Passenger List', status: 'Found', notes: 'Toscana, 27 Sep 1952 — listed as "CHIAPPINI, Lilia"' },
      { type: 'Marriage Record', status: 'Found', notes: 'Ezio Buatti, 4 Oct 1952 at St Anthony\'s Catholic Church, Greta, NSW — cert C810020. Branxton Parish extract confirms parents Remo Chiappini + Irma Pirri, witnesses Emidio Pica + Domenico Michetti, celebrant Rev Z Lewandowski.' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'NAA B78 file received for Ezio — marriage to Lilia confirmed 4 Oct 1952 St Anthony\'s Greta. Lilia travelled same ship (Toscana), registered same batch (no. 290730). Naturalisation confirmed: 18 Nov 1965, cert EF10155554, file V653748 (Victorian registry). Branxton parish extract (10 Jul 2026) names parents: Remo Chiappini + Irma Pirri. Witnesses: Emidio Pica, Domenico Michetti. Celebrant: Rev Z Lewandowski. Toscana passenger list reveals Gino Chiappini (line 177) — same surname, same destination, likely relative. Birth record still outstanding (privacy embargo until 2030).',
      nextSteps: [
        'Search NAA RecordSearch for Gino Chiappini — B78 alien registration, naturalisation file, passenger lists.',
        'Ask papa and Aunt Angie about Gino Chiappini — brother/cousin of Lilia? Also ask about Irma Pirri.',
        'Await NAA naturalisation case file V653748 (due 20 Aug 2026) — may contain birth details and parentage.',
        'Search Ryerson Index and Trove for Gino Chiappini death/funeral notices.',
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
        reference: 'Ezio Buatti + Lilia Chiappini, 4 Oct 1952, St Anthony\'s Greta. Celebrant Rev Z Lewandowski. Witnesses: Emidio Pica, Domenico Michetti. Parents: Remo Chiappini + Irma Pirri. Issued 10 Jul 2026.'
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
  }
];

export const initialOpenQuestions: OpenQuestion[] = [
  {
    id: 'q-buatti-parents',
    question: 'Who are the parents of Alfredo Buatti (Sr.)?',
    category: 'Buatti/Chiappini',
    status: 'Resolved',
    notes: 'RESOLVED 17 Jul 2026: Parents = Giovanni Buatti (b. 25 Jun 1852) + Emidia Bruni (b. 28 Nov 1857), per foglio famiglia N. 1527. Grandparents = Emidio Buatti + Antonia Lenzi (Rotella).'
  },
  {
    id: 'q-ida-galanti-parents',
    question: 'Which Ida Galanti (1893 vs 1904) married Alfredo Buatti?',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    notes: '1893 Ida confirmed as real person (19 Mar 1893, d/o Antonio Galanti + Virginia Rosati, landowning family from Lisciano) via foglio 5120 (18 Jul 2026). Marriage to Alfredo unconfirmed — right-hand columns not visible. 1904 Ida (f. 5545, d/o Ignazio Galanti) still unchecked. Antenati dead end for 1919-1923 records. New strategy: (1) Comune birth act request for Ezio (copia integrale gives Ida\'s age), (2) FamilySearch catalog for Ascoli Piceno Matrimoni 1919-1923.'
  },
  {
    id: 'q-ezio-birth',
    question: 'Where is Ezio Buatti\'s birth record (27 Apr 1923)?',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    notes: 'Ascoli Piceno civil registry digitised only to 1919 on Antenati. 100-year embargo lifted 2023. Strategy shift: request copia integrale directly from Comune (single specific act, not research — no fee). Ezio\'s birth record will name mother Ida Galanti with her age — settles 1893 vs 1904 in one document.'
  },
  {
    id: 'q-bruna-birth',
    question: 'Where is Bruna Lilia Chiappini\'s birth record (3 Jul 1930) and who was her mother?',
    category: 'Buatti/Chiappini',
    status: 'Pending',
    notes: 'San Benedetto del Tronto is a separate comune. 1930 record covered by privacy embargo until 2030. Next step: contact Comune di San Benedetto del Tronto directly.'
  },
  {
    id: 'q-remo-wife',
    question: 'Is the TB/"San Giorgio" story about Irma Pirri or a different wife of Remo?',
    category: 'Buatti/Chiappini',
    status: 'Pending',
    notes: 'Irma Pirri confirmed as Lilia\'s mother via Branxton Catholic Parish marriage extract (4 Oct 1952). Remo+s wife was Irma, but the TB story may relate to her or to a different marriage. "San Giorgio" likely Porto San Giorgio, Fermo, Marche. Need dates.'
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
    notes: 'RESOLVED 28 Jun 2026: Married 24 Apr 1911 at Parrocchia Maria SS.ma Immacolata, Fiumefreddo (Liber Matrimoniorum N.18). Parents: Rosario = Sebastiano Patanè & Rosaria D\'Agata; Venera = Vincenzo Vecchio & Rosaria Raciti. Baptism certificate in processetti also confirmed Rosario born 9 Feb 1889 in Calatabiano. Giuseppe Patanè (married Sebastiana Cogliandolo 20 Feb 1911) shares the same parents — likely Rosario\'s brother.'
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
  }
];
