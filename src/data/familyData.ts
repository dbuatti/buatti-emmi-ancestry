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
    birthDate: 'Unknown / to be confirmed',
    birthPlace: 'Likely Ascoli Piceno area, late 1800s/early 1900s',
    deathDate: '5 September 1964',
    burialPlace: 'Cimitero di Borgo Solestà (Cimitero 01), Ascoli Piceno',
    burialDetails: 'Settore L (loculi), Blocco L074O, Lotto 074 (ossari), Posto 8, Fila 1. Confirmed via the Comune di Ascoli Piceno\'s online cemetery search.',
    burialLink: 'https://www1.comune.ascolipiceno.it/cimitero/cimiteroweb/forms/DefuntoRicerca.asp',
    spouses: ['ida-galanti'],
    parents: [],
    children: ['ezio-buatti'],
    notes: [
      'Parents of Ezio Buatti.',
      'Marriage or birth record may predate the 1919 digitisation cutoff and could be searchable on Antenati.'
    ],
    records: [
      { type: 'Birth Record', status: 'Searching', notes: 'Likely pre-1919 Ascoli Piceno — after digital cutoff, searching Antenati' },
      { type: 'Marriage Record', status: 'Searching', notes: 'Pre-1919, same digital cutoff issue as birth' },
      { type: 'Death Record', status: 'Found', notes: '5 Sep 1964 — confirmed via Comune cemetery search' },
      { type: 'Burial Record', status: 'Found', notes: 'Cimitero di Borgo Solestà, Settore L, Blocco L074O' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Burial confirmed via online cemetery search. Birth and marriage records outstanding.',
      nextSteps: [
        'Search Antenati for birth/marriage records pre-1919 in Ascoli Piceno.',
        'Check cemetery search tool for other Buatti-line relatives.'
      ]
    },
    sources: [
      {
        title: 'Comune di Ascoli Piceno Cemetery Search',
        type: 'Online Database',
        link: 'https://www1.comune.ascolipiceno.it/cimitero/cimiteroweb/forms/DefuntoRicerca.asp'
      }
    ]
  },
  {
    id: 'ida-galanti',
    name: 'Ida Galanti',
    generation: 1,
    line: 'Buatti',
    gender: 'F',
    birthDate: '1898',
    deathDate: '26 January 1970',
    burialPlace: 'Cimitero di Borgo Solestà (Cimitero 01), Ascoli Piceno',
    burialDetails: 'Settore L (loculi), Blocco L074O, Lotto 074 (ossari), Posto 8, Fila 1 (same plot as her husband Alfredo Buatti Sr.). Confirmed via the Comune di Ascoli Piceno\'s online cemetery search.',
    burialLink: 'https://www1.comune.ascolipiceno.it/cimitero/cimiteroweb/forms/DefuntoRicerca.asp',
    spouses: ['alfredo-buatti-sr'],
    parents: [],
    children: ['ezio-buatti'],
    records: [
      { type: 'Birth Record', status: 'Searching', notes: '1898 known, record not yet located in Ascoli Piceno' },
      { type: 'Marriage Record', status: 'Searching', notes: 'Pre-1919 with Alfredo Buatti Sr.' },
      { type: 'Death Record', status: 'Found', notes: '26 Jan 1970 — confirmed via cemetery search' },
      { type: 'Burial Record', status: 'Found', notes: 'Cimitero di Borgo Solestà, same plot as Alfredo' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Burial and death date confirmed. Birth year 1898 known.',
      nextSteps: [
        'Search Antenati for 1898 birth record in Ascoli Piceno area.'
      ]
    },
    sources: [
      {
        title: 'Comune di Ascoli Piceno Cemetery Search',
        type: 'Online Database',
        link: 'https://www1.comune.ascolipiceno.it/cimitero/cimiteroweb/forms/DefuntoRicerca.asp'
      }
    ]
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
    spouses: ['remo-wife-unknown'],
    parents: [],
    children: ['bruna-lilia-chiappini'],
    siblings: ['At least one son'],
    notes: [
      'Family account (relayed by Alfred Buatti, originally from an aunt): Remo\'s wife survived childbirth — contrary to an earlier family assumption that she had died giving birth — but contracted an infection (tuberculosis).',
      'Remo was reportedly sent away to a port town referred to as "San Giorgio" to keep him away from their son, and his wife died about a month later.',
      'Details (which son, exact location/town of "San Giorgio," and dates) still need confirming, as this was relayed informally.'
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found — entirely unknown' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'Needs primary source verification' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ],
    researchStatus: {
      status: 'Outstanding',
      details: 'Information based entirely on informal family accounts. Needs primary source verification.',
      nextSteps: [
        'Identify Remo\'s wife\'s name.',
        'Confirm the "San Giorgio" story and locate the town (possibly Porto San Giorgio in Fermo, Marche).',
        'Search for birth/marriage records in San Benedetto del Tronto or Porto San Giorgio.'
      ]
    }
  },
  {
    id: 'remo-wife-unknown',
    name: 'Remo Chiappini\'s Wife (Name Unknown)',
    generation: 1,
    line: 'Chiappini',
    gender: 'F',
    birthDate: 'Unknown / to be confirmed',
    deathDate: 'c. 1930s (about a month after childbirth)',
    spouses: ['remo-chiappini'],
    parents: [],
    children: ['bruna-lilia-chiappini'],
    notes: [
      'Survived childbirth but contracted tuberculosis and died about a month later.',
      'Her death led to Remo being sent away to "San Giorgio" to protect their son from infection.'
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Name and dates completely unknown' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'Husband Remo\'s name known but no marriage record found' },
      { type: 'Death Record', status: 'Not Found', notes: 'c. 1930s, location unknown' }
    ],
    researchStatus: {
      status: 'Outstanding',
      details: 'Name and dates completely unknown.',
      nextSteps: [
        'Obtain Bruna Lilia Chiappini\'s birth record (1930) to find her mother\'s maiden name.'
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
    birthDate: 'Unknown / to be confirmed',
    deathDate: 'Deceased prior to 1949',
    notes: [
      'Recorded as "DEC" on Gregorio\'s 1943 POW report, and as "fu Egidio" (the late Egidio) on the 1949 Comune di Linguaglossa certificate.',
      'Parents of Gregorio Emmi.'
    ],
    spouses: ['concetta-sgroi'],
    parents: [],
    children: ['gregorio-emmi'],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found — unknown birth details' },
      { type: 'Marriage Record', status: 'Searching', notes: 'To Concetta Sgroi — likely Linguaglossa parish register' },
      { type: 'Death Record', status: 'Found', notes: 'Pre-1943 per POW report — confirmed "fu Egidio" on 1949 certificate' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Death timeframe confirmed (pre-1943/1949). Birth details outstanding.',
      nextSteps: [
        'Search for marriage record with Concetta Sgroi in Linguaglossa to find birth years and parents.',
        'Investigate wider Sgroi/Emmi family network in Linguaglossa.'
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
      }
    ]
  },
  {
    id: 'concetta-sgroi',
    name: 'Concetta Sgroi',
    generation: 1,
    line: 'Emmi',
    gender: 'F',
    birthDate: 'Unknown / to be confirmed',
    deathDate: 'Unknown / to be confirmed',
    spouses: ['egidio-emmi'],
    parents: [],
    children: ['gregorio-emmi'],
    notes: [
      'Maiden name confirmed via Gregorio\'s 1943 Report on Prisoners of War; an earlier guess of "Sofia Concetta" is superseded.',
      'Gregorio\'s own daughter Concetta was very likely named after this grandmother.'
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found' },
      { type: 'Marriage Record', status: 'Searching', notes: 'To Egidio Emmi — likely Linguaglossa parish register' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
      { type: 'Surname Confirmation', status: 'Found', notes: '"Sgroi" confirmed via Gregorio\'s 1943 POW record' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Maiden name Sgroi confirmed via official POW records.',
      nextSteps: [
        'Search for marriage record with Egidio Emmi in Linguaglossa.',
        'Look into Sgroi family network in Linguaglossa (e.g., Alfio Emmi & Carmela Sgroi line).'
      ]
    },
    sources: [
      {
        title: 'Gregorio Emmi 1943 POW Report',
        type: 'Military Record',
        reference: 'NAA: MP1103/2, 55491 (records "Mother\'s Pre-marriage Name: Sgroi Concetta")'
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
    birthDate: 'c. 1890',
    birthPlace: 'Milo, Province of Catania, Sicily, Italy (likely — Rosario NOT found in Fiumefreddo births 1889-1891)',
    deathDate: 'Unknown / to be confirmed',
    occupations: ['Bracciante (day labourer)'],
    residences: ['Sezione Castello, Fiumefreddo di Sicilia'],
    spouses: ['venera-vecchio'],
    parents: [],
    children: ['rosaria-patane', 'sebastiano-patane'],
    notes: [
      'Age 34 in May 1924, per Rosaria\'s birth record.',
      'Parents of Rosaria Patanè.',
      'RULED OUT (28 June 2026): A 1923 marriage banns for a Rosario Patanè (son of Michele Patanè & Caterina Mangano) marrying Grazia Coco was investigated and confirmed to be a different person. Rosario\'s parents remain unidentified.',
      'NAA file A446, 1967/39646 (Item ID 7775953) requested — access application RK26/00009589 submitted 28 Jun 2026.',
      'NOT IN FIUMEFREDDO BIRTHS (1889-1891 indexes checked, no match). Likely born in Milo.',
      'Milo church records (DGS 7490063) confirmed Patanè family in Milo: Rosaria Patanè (b. 24 Nov 1875) daughter of Gaetano Patanè & Maria Garozzo, godfather Rosario Patanè (son of late Rosario) from Macchia. Our Rosario likely a younger relative of this godfather Rosario.',
      'Browsing Milo baptism register (~1529/3000 pages) — search ongoing.'
    ],
    records: [
      { type: 'Birth Record', status: 'Searching', notes: 'c. 1890 estimated from daughter\'s birth record — not yet located' },
      { type: 'Marriage Record', status: 'Searching', notes: 'To Venera Vecchio — pre-1924, Fiumefreddo. No marriage record found yet' },
      { type: 'Death Record', status: 'Not Found', notes: 'Unknown — possibly pre-1950 if he did not migrate to Australia' },
      { type: 'NAA File (A446 1967/39646)', status: 'Searching', notes: 'Requested 28 Jun 2026 — due 2 Nov 2026' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Birth year (~1890) and occupation confirmed via daughter\'s birth record. Birth place now believed to be Milo (not Fiumefreddo — checked 1889-1891 indexes, no match). Milo church records (DGS 7490063) confirm Patanè family presence. Parents and marriage record unknown.',
      nextSteps: [
        'Continue browsing Milo baptism register DGS 7490063 for Rosario baptism ~1888-1892.',
        'Check for alphabetical index at start/end of volume for faster lookup.',
        'Search for marriage record with Venera Vecchio — possibly in Milo, or Fiumefreddo parish records.',
        'Investigate connection to Pietro Patanè (cane farm owner in Ingham) — same town Milo.'
      ]
    },
    sources: [
      {
        title: 'Rosaria Patanè Civil Birth Record',
        type: 'Civil Registry',
        reference: 'Numero 71, Fiumefreddo di Sicilia, 1924'
      }
    ]
  },
  {
    id: 'venera-vecchio',
    name: 'Venera Vecchio',
    generation: 1,
    line: 'Patanè',
    gender: 'F',
    birthDate: 'Unknown / to be confirmed',
    deathDate: 'Deceased by 1953',
    occupations: ['Casalinga (housewife)', 'Tailor (sartora)'],
    residences: ['Sezione Castello, Fiumefreddo di Sicilia'],
    spouses: ['rosario-patane-sr'],
    parents: [],
    children: ['rosaria-patane', 'sebastiano-patane'],
    notes: [
      'Surname confirmed via Rosaria\'s civil birth record (1924).',
      'Recalled in family memory as a tailor (sartora).',
      'Recorded as "fu Venera" (the late Venera) on a 1953 Comune di Fiumefreddo photo-identity certificate.',
      'Note the recurrence of the name "Venera" in this family line, later given to her granddaughter Venera Buatti.',
      'RULED OUT (28 June 2026): A 1923 marriage banns for a Venera Vecchio (daughter of Carmelo Vecchio & Rosaria Ragonesi) marrying Giuseppe Di Blasi was investigated and confirmed to be a different person. Venera\'s parents remain unidentified.'
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'Completely unknown — no records found' },
      { type: 'Marriage Record', status: 'Searching', notes: 'To Rosario Patanè — pre-1924, likely Fiumefreddo' },
      { type: 'Death Record', status: 'Found', notes: 'Pre-1953 — recorded as "fu Venera" on 1953 photo-identity cert' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Surname and death timeframe (pre-1953) confirmed. Parents and marriage record unknown.',
      nextSteps: [
        'Search for marriage record with Rosario Patanè in Fiumefreddo di Sicilia.',
        'Investigate connection to Leonardo Vecchio (co-signer of Rosaria\'s accommodation guarantee in Ingham).'
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
      }
    ]
  },
  {
    id: 'sebastiano-patane',
    name: 'Sebastiano Patanè',
    generation: 1,
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
      'NAA file A446, 1967/39646 (Item ID 7775953) includes a Sebastiano Patanè b. 18 Feb 1936 — could be this person or another Sebastiano. Access application submitted.'
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found in Fiumefreddo' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
      { type: 'NAA File (A446 1967/39646)', status: 'Searching', notes: 'Requested 28 Jun 2026 — due 2 Nov 2026. Includes a Sebastiano Patanè b. 18 Feb 1936' }
    ],
    researchStatus: {
      status: 'Outstanding',
      details: 'Relationship and occupation confirmed. Birth/death dates unknown.',
      nextSteps: [
        'Search for birth record in Fiumefreddo di Sicilia.'
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
    migration: {
      details: 'Arrived in Sydney per Toscana on 27 September 1952, embarked Trieste. Departed the Commonwealth on 13 September 1963 (consistent with the known family move to Italy with sons Alfred and John, c. 1962–63).',
      voyages: [
        {
          ship: 'Toscana',
          departure: 'Trieste',
          arrival: 'Sydney (via Fremantle)',
          date: '27 September 1952',
          details: 'Travelled alone under this listing, destination listed as "Comm. Th Migr. Office Sydney" (no private sponsor address).'
        }
      ]
    },
    records: [
      { type: 'Birth Record', status: 'Searching', notes: '27 Apr 1923 — embargo lifted 2023, digital gap in Ascoli Piceno records' },
      { type: 'Death Record', status: 'Found', notes: '16 Oct 1991 — confirmed by family' },
      { type: 'Immigration File (NAA)', status: 'Found', notes: 'B78, ITALIAN/BUATTI EZIO — copy ordered 27 Jun 2026 (Order 2458870)' },
      { type: 'Passenger List', status: 'Found', notes: 'Toscana, 27 Sep 1952 — NAA K269' },
      { type: 'Marriage Record', status: 'Searching', notes: 'Unclear if married before or after 1952 migration' },
      { type: 'Bankruptcy Record', status: 'Found', notes: 'Café & milk bar proprietor, Broadford VIC. Bankrupt Oct 1957 (Trove, Commonwealth Gazette)' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Birth record not yet located (privacy embargo lifted in 2023). Migration confirmed via NAA files. Full digital copy of NAA file ordered on 27 June 2026.',
      nextSteps: [
        'Contact Comune di Ascoli Piceno or Archivio di Stato di Ascoli Piceno directly for 1923 birth record.',
        'Await NAA file processing (Order No. 2458870, Item ID 5746087, ordered 27 June 2026).',
        'Confirm whether Ezio and Lilia were married before migrating in 1952.'
      ]
    },
    sources: [
      {
        title: 'NAA: B78, ITALIAN/BUATTI EZIO (Melbourne)',
        type: 'Immigration File',
        reference: 'Item ID 5746087 (Order No. 2458870)'
      },
      {
        title: 'Toscana Passenger List',
        type: 'Passenger Manifest',
        reference: 'NAA: K269, 15 Sept 1952'
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
    parents: ['remo-chiappini', 'remo-wife-unknown'],
    children: ['alfred-buatti', 'john-buatti-extended'],
    migration: {
      details: 'Travelled as "CHIAPPINI, Lilia", occupation "Servant", on the same voyage as Ezio (Toscana, 15 Sept 1952). Known within the family as "Nonna Lilia" (went by her middle name).',
      voyages: [
        {
          ship: 'Toscana',
          departure: 'Trieste',
          arrival: 'Sydney (via Fremantle)',
          date: '27 September 1952',
          details: 'Listed as "Servant", destination "Comm.th Migr. Off. Sydney". Fremantle passenger list includes her in-transit to Sydney.'
        }
      ]
    },
    residences: ['303 Punt Road, Richmond, Victoria (1965)'],
    records: [
      { type: 'Birth Record', status: 'Searching', notes: '3 Jul 1930 — embargo until 2030, contact Comune di San Benedetto del Tronto' },
      { type: 'Death Record', status: 'Found', notes: '23 May 1998 — burial confirmed' },
      { type: 'Burial Record', status: 'Found', notes: 'Springvale Botanical Cemetery, Spotted Gums, Row AS, Grave 68' },
      { type: 'Naturalisation Record', status: 'Found', notes: 'Commonwealth Gazette notice, 18 Nov 1965 — lists address 303 Punt Rd, Richmond' },
      { type: 'Passenger List', status: 'Found', notes: 'Toscana, 27 Sep 1952 — listed as "CHIAPPINI, Lilia"' },
      { type: 'Marriage Record', status: 'Searching', notes: 'Unclear if married to Ezio before 1952 voyage' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Birth record not yet located (under privacy embargo until 2030). Residence confirmed at 303 Punt Rd, Richmond (1965). Burial and migration confirmed.',
      nextSteps: [
        'Contact Comune di San Benedetto del Tronto directly for 1930 birth record.',
        'Ask family why she travelled as "servant" rather than wife/fiancée (sponsorship category vs. marital status).'
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
    birthDate: '27 October 1915',
    birthPlace: 'Linguaglossa, Province of Catania, Sicily, Italy',
    deathDate: 'c. late November 1979',
    burialPlace: 'Rookwood Catholic Cemetery, Sydney, NSW',
    burialDetails: 'Lawn (5), plot 1070. Funeral conducted by T. J. Andrews Funeral Services Pty. Ltd., Newtown; officiating clergyman Rev. John Shanahan on 30 November 1979.',
    spouses: ['rosaria-patane'],
    parents: ['egidio-emmi', 'concetta-sgroi'],
    children: ['venera-buatti', 'angie-mcwilliams-extended', 'connie-emmi-extended', 'john-emmi-extended', 'greg-emmi-extended', 'ross-emmi-extended'],
    residences: ['Via Roma 333, Linguaglossa', 'Black Rock, via Ingham, Queensland', 'Sydney, NSW'],
    occupations: ['Bracciante (farm labourer) in Italy', 'Cane cutter in Australia'],
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
      { type: 'Birth (Civil)', status: 'Searching', notes: '27 Oct 1915 — all FS digital routes exhausted, emails sent to Comune di Linguaglossa & Archivio di Stato di Catania 28 Jun 2026' },
      { type: 'Baptismal Record', status: 'Found', notes: 'Parish register Linguaglossa, DGS 5455112 — baptised 5 Dec 1915, entry N.251, folio 80' },
      { type: 'Death Record', status: 'Searching', notes: 'c. late Nov 1979 — funeral 30 Nov 1979, exact date unknown' },
      { type: 'Burial Record', status: 'Found', notes: 'Rookwood Catholic Cemetery, Lawn (5) plot 1070' },
      { type: 'POW Record', status: 'Found', notes: 'NAA MP1103/1 & MP1103/2 — captured Asmara 1941, Cowra POW Camp, repatriated 1946' },
      { type: 'Immigration File (NAA)', status: 'Found', notes: 'J25, 1949/13301 — Piero Lalli sponsorship application' },
      { type: 'Passenger List', status: 'Found', notes: 'M/V Napoli, Mar 1950; SS Uruguay, Oct 1943 (POW transport); H.T. Chitral, Sep 1946 (repatriation)' },
      { type: 'Alien Registration', status: 'Found', notes: 'No. 139899, 13 Mar 1950' },
      { type: 'Identity Document', status: 'Found', notes: 'Carta d\'identità No. 17.771.300, Comune di Linguaglossa' },
      { type: 'Police Record', status: 'Found', notes: 'Townsville District Police Report, 15 Sep 1950 — "good character and repute"' },
      { type: 'Medical Record', status: 'Found', notes: 'Malaria (May 1944) & epistaxis (Dec 1944) during POW internment' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Baptismal record found and confirmed. Civil birth record outstanding (FamilySearch digital routes exhausted). Request emails sent to Comune di Linguaglossa and Archivio di Stato di Catania on 28 June 2026.',
      nextSteps: [
        'Await reply from Comune di Linguaglossa (anagrafe@comune.linguaglossa.ct.it) regarding birth extract request.',
        'Await reply from Archivio di Stato di Catania (as-ct@cultura.gov.it) regarding Film 2278858 lookup.',
        'Follow up by phone if no reply (Liuzzo Francesca: 095 7777216).',
        'Confirm exact date of death (funeral was 30 Nov 1979).',
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
      { type: 'Birth (Civil)', status: 'Found', notes: 'Numero 71, Fiumefreddo di Sicilia 1924 — FS DGS 7851867. Born 23 May 1924 (not 25th)' },
      { type: 'Baptismal Record', status: 'Searching', notes: 'FS DGS 5429284 restricted — emails sent to Diocesi di Acireale & parish 28 Jun 2026' },
      { type: 'Death Record', status: 'Found', notes: '30 Mar 1994 — burial confirmed' },
      { type: 'Burial Record', status: 'Found', notes: 'Cheltenham Memorial Cemetery, Plot 27*377*N' },
      { type: 'Marriage Record', status: 'Searching', notes: 'To Gregorio Emmi — pre-1950, date/location unknown' },
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
    birthDate: '8 November 1956',
    birthPlace: 'Broadford, Victoria, Australia',
    spouses: ['venera-buatti'],
    parents: ['ezio-buatti', 'bruna-lilia-chiappini'],
    children: ['daniele-buatti', 'roberto-buatti', 'stefano-buatti', 'marco-buatti'],
    notes: [
      'Moved to Italy with brother John c. 1962–63; returned to Australia in 1975.',
      'Provided various correspondence and recollections that formed the basis of this research.'
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
      { type: 'Birth Record', status: 'Pending', notes: 'Born 1952 — ask for exact date and place' }
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
    birthDate: '22 Jul 1911 (or 1 Oct 1911 — conflicting sources)',
    birthPlace: 'Milo, Province of Catania, Sicily, Italy',
    deathDate: '6 February 1994',
    deathPlace: 'Ingham, Queensland, Australia',
    burialPlace: 'New Ingham Cemetery, Ingham, Queensland',
    burialDetails: 'Roman Catholic Sect: 31, Plot: 12. Cause of death: chronic renal failure.',
    spouses: ['maria-ragonesi-patane'],
    parents: [],
    children: ['filadelfo-patane', 'sam-patane'],
    occupations: ['Cane cutter', 'Cane farmer'],
    residences: ['Milo, Catania, Sicily', 'Black Rock, via Ingham, Queensland'],
    notes: [
      'Arrived Brisbane per ORAMA, 24 November 1930. Recorded birthplace "Melo" on some records.',
      'Interned at Loveday Camp (South Australia) during WWII as an enemy alien. Alien registration no. Q8299. Released 12 December 1943.',
      'Owned the cane farm at Black Rock, via Ingham, North Queensland.',
      'Sponsored Gregorio Emmi\'s migration (1949-50) and employed him as a cane cutter.',
      'Guaranteed accommodation for Rosaria Patanè Emmi and daughter Concetta (1950).',
      'Likely a close relative of Rosario Patanè (Rosaria\'s father) — same surname, same region (Milo is ~15km from Fiumefreddo). Exact relationship unconfirmed.',
      'Naturalised 26 September 1938 (A714, 4/1530).'
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '22 Jul 1911, Milo CT — confirmed via NAA D4028 index card' },
      { type: 'Death Record', status: 'Found', notes: '6 Feb 1994, Ingham QLD — chronic renal failure, New Ingham Cemetery' },
      { type: 'Burial Record', status: 'Found', notes: 'New Ingham Cemetery, RC Sect: 31, Plot: 12' },
      { type: 'Naturalisation Record', status: 'Found', notes: 'A714 4/1530 — naturalised 26 Sep 1938, Ingham QLD' },
      { type: 'Passenger List', status: 'Found', notes: 'Arrived Brisbane per ORAMA, 24 Nov 1930' },
      { type: 'POW/Internment Record', status: 'Found', notes: 'MP1103/1 Q8299 — interned Loveday Camp WWII. Released 12 Dec 1943' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Key sponsor and employer of the Emmi family in Australia. Relationship to Rosario Patanè still unconfirmed.'
    }
  },
  {
    id: 'maria-ragonesi-patane',
    name: 'Maria Ragonesi',
    generation: 2,
    line: 'Patanè',
    gender: 'F',
    birthDate: 'Unknown',
    deathDate: '1980',
    spouses: ['pietro-patane'],
    parents: [],
    children: ['filadelfo-patane', 'sam-patane'],
    notes: ['Wife of Pietro Patanè. Married before 1939 (Pietro listed as married on 1939 alien registration).'],
    researchStatus: {
      status: 'In Progress',
      details: 'Death year known (1980). Birth details and maiden name origin unknown.'
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
    notes: ['Son of Pietro Patanè and Maria Ragonesi.'],
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
    notes: ['Son of Pietro Patanè and Maria Ragonesi. His son Jordan Christopher Patanè (1987-1987) predeceased him.'],
    researchStatus: { status: 'Confirmed' }
  }
];

export const initialResearchLeads: ResearchLead[] = [
  {
    id: 'lead-pietro-patane',
    title: 'Pietro Patanè Connection',
    category: 'Emmi/Patanè',
    status: 'In Progress',
    description: 'Pietro Patanè (22 Jul 1911 – 6 Feb 1994), born Milo CT, arrived Brisbane per ORAMA 24 Nov 1930. Interned Loveday Camp WWII. Owned Black Rock cane farm, sponsored Gregorio & Rosaria Emmi. Naturalised 26 Sep 1938 (A714 4/1530). Shared surname and nearby hometown (Milo, 15km from Fiumefreddo) strongly suggests a family connection to Rosario Patanè — possibly brother or cousin. Exact relationship still unknown.',
    nextSteps: 'His naturalisation record (A714 4/1530) should contain his parents\' names. Request or view online to confirm relationship to Rosario Patanè.',
    sources: ['NAA: D4028 PATANE PIETRO (Item 9208586)', 'NAA: A714 4/1530 (Item 31518779)', 'Find a Grave: New Ingham Cemetery']
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
    question: 'Who are the parents of Alfredo Buatti (Sr.) and Ida Galanti?',
    category: 'Buatti/Chiappini',
    status: 'Pending',
    notes: 'Their marriage or birth records likely predate the 1919 digitisation cutoff and could be searchable on Antenati.'
  },
  {
    id: 'q-ezio-birth',
    question: 'Where is Ezio Buatti\'s birth record (27 Apr 1923)?',
    category: 'Buatti/Chiappini',
    status: 'In Progress',
    notes: 'Ascoli Piceno civil registry is digitised only up to 1919. 100-year privacy embargo lifted in 2023. Next step: contact Comune di Ascoli Piceno or Archivio di Stato directly. Full NAA file ordered 27 June 2026 may also contain clues.'
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
    question: 'What was Remo Chiappini\'s wife\'s name, and is the TB/"San Giorgio" story accurate?',
    category: 'Buatti/Chiappini',
    status: 'Pending',
    notes: 'Need to confirm which son was being protected, the exact town of "San Giorgio" (likely Porto San Giorgio), and dates.'
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
    status: 'Pending',
    notes: 'Two candidate leads (Carmelo Vecchio; Michele Patanè & Caterina Mangano) were ruled out on 28 June 2026. Their actual marriage record remains unidentified.'
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
  }
];
