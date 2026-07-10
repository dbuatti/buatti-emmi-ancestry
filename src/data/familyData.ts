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
    deathDate: '9 May 1964',
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
      { type: 'Death Record', status: 'Found', notes: '9 May 1964 — confirmed via Comune cemetery search (database shows 9/5/1964, Italian format)' },
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
    birthDate: '1898 (unsourced — calculated?)',
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
    ],
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
    ],
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
      'Parents: fu Antonino Emmi + Rosaria (surname unresolved — Nasti in marriage act, Raiti in banns; same clerk Concetto Scarlata wrote both within 2 months, neither is inherently more authoritative). Given name also uncertain — reads "Rocaria/Rosaria" in both acts.',
      'Egidio\'s ~1870 birth act (a different clerk, writing decades earlier when the mother was present to give information) will settle the surname.',
      'Married Concetta Sgroi on 4 Nov 1900 in Linguaglossa (atto № 59). Officer: Concetto Scarlata. Witnesses: Cassaniti Vincenzo (40, contadino) and Arlotta Giuseppe (23). Both spouses illiterate.',
      'Banns (pubblicazioni) issued 8 Sep 1900, act n. 59 (same number as marriage act — coincidental). Published Sundays 9 and 16 Sep 1900. ~7-week gap between banns and wedding — slightly unusual, banns stayed valid. The marriage act\'s reference to "last month" (October) was likely loose boilerplate or a misreading of "settembre scorso"; the banns record is authoritative for September.',
      'Banns recorded a different surname for the mother (Raiti vs Nasti), a different father for the bride (Salvatore vs Gregorio), and a different age (20 vs 23). For the bride\'s details, the marriage ceremony is more authoritative (based on documents she submitted). For the groom\'s mother\'s surname, both acts are the same clerk in the same year — unresolved. Egidio\'s birth act will settle it.',
      'Banns witnesses: De Francesco Francesco (~44, guardia) and Cesareo Giacomo (40, possibly mugnaio/miller). Different from wedding witnesses — normal, banns witnesses were often officials-of-convenience.',
      'Had at least one older son (that son\'s family now in Venezuela — per Connie Emmi 28 Jun 2026).',
      'NOT the same person as Egidio Emmi (b. ~1855, son of Antonino + Rosa Vecchio) who married Angela Raiti on 16 Dec 1895 — same father, different mother, likely half-brothers or cousins.',
    ],
    spouses: ['concetta-sgroi'],
    parents: ['antonino-emmi', 'rosaria-nasti'],
    children: ['gregorio-emmi', 'emmi-older-brother-venezuela'],
    records: [
      { type: 'Birth Record', status: 'Found — Not Yet Read', notes: '~1870, Linguaglossa. Cited as issued in banns processetti — definitely exists in Nati registers (DGS 7841071). Allegati volume for 1900 not filmed (1894–1910 gap).' },
      { type: 'Marriage Record', status: 'Found', notes: 'Marriage act atto № 59, 4 Nov 1900, Linguaglossa. Officer: Concetto Scarlata. Witnesses: Cassaniti Vincenzo (40), Arlotta Giuseppe (23). Both illiterate. Banns also atto № 59 (8 Sep 1900) — coincidental same number. CORRECTS earlier banns which had wrong mother (Raiti), father (Salvatore), age (20), and bride occupation (contadina vs industriosa).' },
      { type: 'Death Record', status: 'Found', notes: 'Pre-1943 per POW report — confirmed "fu Egidio" on 1949 certificate' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Marriage act found (4 Nov 1900, atto № 59). Parents: Antonino Emmi + Rosaria Nasti (given name uncertain). Age ~30 (born ~1870). Farmer. Illiterate. Banns (8 Sep 1900, atto № 59) contained errors — actual marriage record supersedes.',
      nextSteps: [
        'Find Egidio\'s birth record (~1870) in Linguaglossa Nati registers (DGS 7841071).',
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
      }
    ]
  },
  {
    id: 'concetta-sgroi',
    name: 'Concetta Sgroi',
    generation: 1,
    line: 'Emmi',
    gender: 'F',
    birthDate: '~1880 (age 20 at marriage on 8 Sep 1900)',
    birthPlace: 'Linguaglossa, Province of Catania, Sicily, Italy',
    occupation: 'Industriosa (home-based textile/domestic work)',
    deathDate: 'Deceased prior to 1967',
    spouses: ['egidio-emmi'],
    parents: ['gregorio-sgroi', 'santa-cali'],
    children: ['gregorio-emmi', 'emmi-older-brother-venezuela'],
    notes: [
      'Maiden name confirmed via Gregorio\'s 1943 Report on Prisoners of War; an earlier guess of "Sofia Concetta" is superseded.',
      'Parents confirmed via Marriage act atto № 59 (4 Nov 1900) and banns (8 Sep 1900): Gregorio Sgroi + Santa Calì. Age 23 at marriage → born ~1877.',
      'Occupation: "industriosa" (home-based textile/domestic work, per banns), NOT "contadina" as previously recorded. Her mother Santa Calì was also industriosa.',
      'The earlier banns (pubblicazioni, 8 Sep 1900, same officer Scarlata) recorded father as Salvatore Sgroi and age as 20 — both errors corrected by the marriage ceremony (4 Nov 1900). Banns witnesses: De Francesco Francesco (~44, guardia) and Cesareo Giacomo (40, possibly mugnaio).',
      'Gregorio\'s own daughter Concetta was very likely named after this grandmother.',
      'Had at least one older son (that son\'s family migrated to Venezuela — per Connie Emmi 28 Jun 2026).',
      'Egidio and Concetta are both illiterate per the 1900 marriage record and banns — neither signed.'
    ],
    records: [
      { type: 'Birth Record', status: 'Found — Not Yet Read', notes: '~1877, Linguaglossa. Cited as issued in banns processetti — definitely exists in Nati registers (DGS 7841071). Allegati volume for 1900 not filmed (1894–1910 gap).' },
      { type: 'Marriage Record', status: 'Found', notes: 'Marriage act atto № 59, 4 Nov 1900, Linguaglossa. Officer: Concetto Scarlata. CORRECTS earlier banns (8 Sep 1900). Bride age 23, father Gregorio Sgroi.' },
      { type: 'Death Record', status: 'Not Found', notes: 'Pre-1967 per later church records. Exact date unknown.' },
      { type: 'Surname Confirmation', status: 'Found', notes: '"Sgroi" confirmed via Gregorio\'s 1943 POW record and 1900 marriage record' }
    ],
    researchStatus: {
      status: 'Confirmed',
      details: 'Parents confirmed: Gregorio Sgroi + Santa Calì. Age 23 at marriage (born ~1877). Occupation: industriosa. Banns had wrong father (Salvatore) and age (20) — marriage act corrects.',
      nextSteps: [
        'Find Concetta\'s birth record (~1877) in Linguaglossa civil records (DGS 7841071).',
        'Look into Sgroi family network in Linguaglossa.'
      ]
    },
    sources: [
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
    birthPlace: 'Calatabiano, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown / to be confirmed',
    occupations: ['Castaldo (farm manager)', 'Bracciante (day labourer)'],
    residences: ['Contrada Trappitelli, Calatabiano', 'Sezione Castello, Fiumefreddo di Sicilia'],
    spouses: ['venera-vecchio'],
    parents: ['sebastiano-patane-sr', 'rosaria-dagata'],
    children: ['rosaria-patane', 'sebastiano-patane'],
    notes: [
      'Civil birth record found (28 Jun 2026): Antenati, Calatabiano Nati 1889, atto n. 28. Born 8 Feb 1889 at 4:15 AM in Contrada Trappitelli, Calatabiano. Declared 10 Feb 1889.',
      'DATE DISCREPANCY: Civil record says 8 Feb (4:15 AM); baptism extract says 9 Feb ("born yesterday" on 10 Feb). Civil record is the legal document, so 8 Feb 1889 is the official date.',
      'Father at birth: Sebastiano Patanè (39, castaldo/farm manager). Mother: Rosaria D\'Agata (his legitimate wife).',
      'Witnesses at registration: Sebastiano Intelisano (60, bracciante) & Giuseppe Intelisano (30, bracciante). Both illiterate.',
      'Margin note on civil birth act: "Joined in marriage with Venera Vecchio by act of 27 April 1911. Registered in Fiumefreddo." — suggests civil marriage was 27 Apr 1911 (vs church marriage 24 Apr 1911).',
      'Age 34 in May 1924, per Rosaria\'s birth record.',
      'Baptism certificate (10 Feb 1889, Calatabiano) found in marriage processetti packet. Baptized by Sac. Salvatore Catalano, godfather Giuseppe Caruso.',
      'RULED OUT (28 June 2026): A 1923 marriage banns for a Rosario Patanè (son of Michele Patanè & Caterina Mangano) marrying Grazia Coco was investigated and confirmed to be a different person.',
      'NAA file A446, 1967/39646 (Item ID 7775953) requested — access application RK26/00009589 submitted 28 Jun 2026.',
      'Giuseppe Patanè (married Sebastiana Cogliandolo 20 Feb 1911, Liber Matrimoniorum N.11/12) shares same parents (Sebastiano & Rosaria D\'Agata) — likely Rosario\'s brother.',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '8 Feb 1889, Calatabiano — atto n. 28, Antenati. Born at 4:15 AM in Contrada Trappitelli. Father: Sebastiano Patanè (39, castaldo). Mother: Rosaria D\'Agata.' },
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
    birthDate: 'c. 1888',
    birthPlace: 'Calatabiano, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    spouses: ['sebastiana-guglielmino'],
    parents: ['sebastiano-patane-sr', 'rosaria-dagata'],
    children: [],
    notes: [
      'Brother of Rosario Patanè.',
      '23 years old, bracciante, residing in Fiumefreddo in 1911.',
      'Married Sebastiana Guglielmino on 5 Feb 1911 at Fiumefreddo (civil banns filed same day).',
      'Birth record not yet located — likely Calatabiano civil records.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'c. 1888, likely Calatabiano — search Calatabiano civil records' },
      { type: 'Marriage Record', status: 'Found', notes: '5 Feb 1911, Fiumefreddo (civil banns). Bride: Sebastiana Guglielmino (21, daughter of late Michele Guglielmino & Caterina Strangano).' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Marriage confirmed via Fiumefreddo civil marriage banns. Birth record outstanding.',
      nextSteps: ['Search Calatabiano civil records for birth ~1888.']
    }
  },
  {
    id: 'venera-patane-sibling',
    name: 'Venera Patanè',
    generation: 1,
    line: 'Patanè',
    gender: 'F',
    birthDate: 'c. 1888',
    birthPlace: 'Calatabiano, Province of Catania, Sicily, Italy',
    deathDate: 'Unknown',
    occupations: ['Casalinga (homemaker)'],
    residences: ['Fiumefreddo di Sicilia'],
    spouses: ['orazio-pagano-sibling'],
    parents: ['sebastiano-patane-sr', 'rosaria-dagata'],
    children: [],
    notes: [
      'Sister of Rosario Patanè.',
      '23 years old at time of marriage publications (Sep 1911) — born ~1888.',
      'Marriage banns filed 8 Sep 1911, Fiumefreddo civil registry. Marriage celebrated 17 Sep 1911 in Calatabiano.',
      'Groom: Orazio Pagano (25, bracciante, son of Santo Pagano & Rosaria Pennisi).',
      'Mother recorded as "Ignazia D\'Agata" on the civil banns (variation of Rosaria D\'Agata).',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'c. 1888, likely Calatabiano — search Calatabiano civil records' },
      { type: 'Marriage Record', status: 'Found', notes: '8 Sep 1911 (banns filed) / 17 Sep 1911 (celebrated), Fiumefreddo/Calatabiano. Groom: Orazio Pagano (25, son of Santo Pagano & Rosaria Pennisi).' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Marriage confirmed via Fiumefreddo civil marriage banns. Birth record outstanding.',
      nextSteps: ['Search Calatabiano civil records for birth ~1888.']
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

  // --- POSSIBLE SIBLING: Salvatore Patanè (unconfirmed relationship) ---
  {
    id: 'salvatore-patane-possible-sibling',
    name: 'Salvatore Patanè',
    generation: 1,
    line: 'Patanè',
    gender: 'M',
    birthDate: 'c. 1877',
    birthPlace: 'Likely Calatabiano area',
    deathDate: 'Unknown',
    spouses: ['maria-sgarlato'],
    parents: [],
    children: ['rosaria-patane-salvatore-daughter'],
    notes: [
      'Possible older brother of Rosario Patanè — SAME SURNAME, same town (Fiumefreddo), same occupation (bracciante).',
      'Age 34 in Feb 1911 = born ~1877, making him ~12 years older than Rosario (b. 1889). Plausible but UNCONFIRMED — no document directly names his parents.',
      'If confirmed as son of Sebastiano & Rosaria D\'Agata, he would be the eldest known Patanè sibling.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'c. 1877 — search Calatabiano records' },
      { type: 'Birth of Daughter (Rosaria)', status: 'Found', notes: '10 Feb 1911, Fiumefreddo — daughter Rosaria born to Salvatore Patanè (34, bracciante) & Maria Sgarlato. Contrada Panormitana No. 2.' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Exists in Fiumefreddo 1911 civil births. Relationship to Rosario Patanè is circumstantial — same surname, town, occupation. Needs parent confirmation.',
      nextSteps: [
        'Search Calatabiano births ~1877 for Salvatore Patanè di Sebastiano.',
        'Search for marriage of Salvatore Patanè & Maria Sgarlato to find parents named.',
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
      'Wife of Salvatore Patanè (possible brother of Rosario).',
      'Villica (farmworker) residing in Contrada Panormitana, Fiumefreddo in 1911.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found' },
      { type: 'Marriage Record', status: 'Not Found', notes: 'Not yet located' },
    ],
    researchStatus: {
      status: 'Outstanding',
      details: 'Name confirmed via daughter\'s birth record. All other details unknown.'
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
      'Daughter of Salvatore Patanè & Maria Sgarlato — NOT the same Rosaria who married Gregorio Emmi.',
      'Registered 13 Feb 1911, born 10 Feb 1911 at 10:15 PM, Contrada Panormitana No. 2.',
      'Baptised 21 Feb 1912 at the local parish.',
      'If Salvatore is Rosario\'s brother, this Rosaria is the cousin of Rosaria Patanè Emmi (b. 1924).',
    ],
    records: [
      { type: 'Birth Record', status: 'Found', notes: '10 Feb 1911, Fiumefreddo — civil birth act' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' },
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'Birth record confirmed. Relationship to main Patanè line depends on whether Salvatore is Rosario\'s brother.',
      nextSteps: ['Search for Salvatore\'s parents to confirm the relationship.']
    }
  },

  // --- GENERATION 0: Great-Great-Grandparents (Emmi Line) ---
  {
    id: 'antonino-emmi',
    name: 'Antonino Emmi',
    generation: 0,
    line: 'Emmi',
    gender: 'M',
    birthDate: 'Unknown',
    deathDate: 'Deceased prior to 8 Sep 1900',
    spouses: ['rosaria-nasti'],
    parents: [],
    children: ['egidio-emmi'],
    notes: [
      'Father of Egidio Emmi, confirmed via Marriage Proclamation Records (atto № 59, 8 Sep 1900, Linguaglossa).',
      'Recorded as "fu Antonino" (the late Antonino) at the time of Egidio\'s marriage.',
      'Possibly the same Antonino Emmi who appears in earlier Linguaglossa records.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found yet' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ],
    researchStatus: {
      status: 'Outstanding',
      details: 'Name confirmed as father of Egidio Emmi.',
      nextSteps: [
        'Search Linguaglossa birth/death records for Antonino Emmi.'
      ]
    }
  },
  {
    id: 'rosaria-nasti',
    name: 'Rosaria (surname unresolved — Nasti or Raiti)',
    generation: 0,
    line: 'Emmi',
    gender: 'F',
    birthDate: 'Unknown',
    deathDate: 'Living at time of Egidio\'s marriage (1900)',
    spouses: ['antonino-emmi'],
    parents: [],
    children: ['egidio-emmi'],
    notes: [
      'Mother of Egidio Emmi. Her surname is disputed: the marriage act (atto № 59, 4 Nov 1900) records "Nasti", the banns (atto № 59, 8 Sep 1900) record "Raiti". Both by the same officer, Concetto Scarlata, within two months — neither is inherently more authoritative.',
      'Given name also uncertain — reads "Rocaria/Rosaria" in both acts.',
      'Egidio\'s birth act (~1870, a different clerk who would have recorded the mother\'s name from her own statement) will resolve the surname.',
      'Living at the time of Egidio\'s marriage (not listed as "fu").',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found yet' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ],
    researchStatus: {
      status: 'Confirmed — Surname Disputed',
      details: 'Existence confirmed as mother of Egidio Emmi. Surname is Nasti (marriage act) vs Raiti (banns) — conflicting, same clerk. Resolution requires Egidio\'s birth act.'
    }
  },
  {
    id: 'gregorio-sgroi',
    name: 'Gregorio Sgroi',
    generation: 0,
    line: 'Emmi',
    gender: 'M',
    birthDate: '~1840 (age 60 at Concetta\'s banns, 8 Sep 1900)',
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
    ],
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
    ],
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
    birthDate: 'Unknown',
    deathDate: 'Unknown',
    spouses: ['rosaria-dagata'],
    parents: [],
    children: ['rosario-patane-sr', 'giuseppe-patane-sibling', 'venera-patane-sibling'],
    notes: [
      'Father of Rosario Patanè, confirmed via 1911 parish marriage certificate.',
      'Also father of Giuseppe Patanè (married Sebastiana Cogliandolo, 20 Feb 1911, Liber Matrimoniorum N.11/12 — also recorded as "Sebastiana Guglielmino" on civil banns) and Venera Patanè (married Orazio Pagano, 17 Sep 1911) — both confirmed via Fiumefreddo records.',
      'From Calatabiano area; resided in Fiumefreddo by 1911.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found yet' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ],
    researchStatus: {
      status: 'Outstanding',
      details: 'Name confirmed as father of Rosario Patanè. All other details unknown.',
      nextSteps: [
        'Search Calatabiano records for his birth and marriage.'
      ]
    }
  },
  {
    id: 'rosaria-dagata',
    name: 'Rosaria D\'Agata',
    generation: 0,
    line: 'Patanè',
    gender: 'F',
    birthDate: 'Unknown',
    deathDate: 'Unknown',
    spouses: ['sebastiano-patane-sr'],
    parents: [],
    children: ['rosario-patane-sr', 'giuseppe-patane-sibling', 'venera-patane-sibling'],
    notes: [
      'Mother of Rosario Patanè, Giuseppe Patanè, and Venera Patanè, confirmed via 1911 Fiumefreddo civil marriage banns.',
    ],
    records: [
      { type: 'Birth Record', status: 'Not Found', notes: 'No records found yet' },
      { type: 'Death Record', status: 'Not Found', notes: 'No records found' }
    ],
    researchStatus: {
      status: 'Outstanding',
      details: 'Name confirmed as mother of Rosario Patanè.'
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
    italianAddress: 'Via Mercantini N° 62, Ascoli Piceno',
    passport: {
      number: '3925755 P',
      issued: '19 June 1952',
      issuedBy: 'Ascoli Piceno, Italy'
    },
    alienRegistration: '290718',
    records: [
      { type: 'Birth Record', status: 'Searching', notes: '27 Apr 1923 — embargo lifted 2023, digital gap in Ascoli Piceno records' },
      { type: 'Death Record', status: 'Found', notes: '16 Oct 1991 — confirmed by family' },
      { type: 'Immigration File (NAA)', status: 'Found', notes: 'B78, ITALIAN/BUATTI EZIO — digitised copy received 9 Jul 2026 (Item 5746087). Full file: arrival form RA, marriage notification, passport photo.' },
      { type: 'Alien Registration', status: 'Found', notes: 'No. 290718, issued Sydney 27 Sep 1952. Re-issued 23 Jan 1957 (entered register 22 Feb 1957).' },
      { type: 'Passenger List', status: 'Found', notes: 'Toscana, 27 Sep 1952 — NAA K269. Also Fremantle customs stamp 15 Sep 1952.' },
      { type: 'Marriage Record', status: 'Found', notes: 'Lilia Chiappini, 4 Oct 1952 at St Anthony\'s Catholic Church, Greta, NSW — cert C810020. Branxton Parish extract (10 Jul 2026) confirms parents Remo Chiappini + Irma Pirri, witnesses Emidio Pica + Domenico Michetti, celebrant Rev Z Lewandowski.' },
      { type: 'Bankruptcy Record', status: 'Found', notes: 'Café & milk bar proprietor, Broadford VIC. Bankrupt Oct 1957 (Trove, Commonwealth Gazette)' }
    ],
    researchStatus: {
      status: 'In Progress',
      details: 'NAA B78 file digitised and received 9 Jul 2026 — full arrival form, marriage notification, passport photo. Birth record (27 Apr 1923) still outstanding from Ascoli Piceno. Marriage confirmed: 4 Oct 1952 at St Anthony\'s, Greta. 1963 Neptunia departure documented.',
      nextSteps: [
        'Contact Comune di Ascoli Piceno for 1923 birth record — now have precise address (Via Mercantini 62) and passport details for request.',
        'Order marriage certificate C810020 from NSW Registry of Births Deaths & Marriages.',
        'Search for Lilia\'s B78 file under Chiappini or Buatti (registration 290730) via RecordSearch — may contain her own photo.',
        'Find Neptunia outbound passenger list for 13 Sep 1963 to confirm who travelled.',
        'Ask family about the 1963 Italy trip — was it a visit to Alfredo Sr & Ida, or an attempted permanent return?'
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
      'Travelled on Toscana K269 line 178 — directly below line 177: CHIAPPIN Gino (b. 1927, labourer, reg 290502). Confirmed by NAA 10 Jul 2026 (A2571, barcode 203679026). NoK field blank on his ID card. He worked as transient fruit-picker in Mildura then Bonalgo NSW. No naturalisation found. 3-year age gap consistent with being her brother.',
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
        'Request actual marriage act from Comune di Fiumefreddo (1948 part 2 series A n. 34).',
        'Request naturalisation certificate (EM(2)28650) from NAA.',
        'Follow up by phone if no reply (Liuzzo Francesca: 095 7777216).',
        'Order marriage act from Comune di Fiumefreddo (1948 part 2 series A n. 34).',
        'Order naturalisation certificate EM(2)28650 from NAA.',
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
