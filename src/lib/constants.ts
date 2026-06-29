import type { FamilyLine } from '@/types';

export const BRAND_COLOR = '#800020';

export const LINE_COLORS: Record<FamilyLine, { primary: string; badge: string }> = {
  Buatti: {
    primary: 'bg-[#800020] text-white border-[#800020]',
    badge: 'bg-[#800020]/10 text-[#800020] border-[#800020]/20',
  },
  Chiappini: {
    primary: 'bg-amber-700 text-white border-amber-700',
    badge: 'bg-amber-700/10 text-amber-800 border-amber-700/20',
  },
  Emmi: {
    primary: 'bg-emerald-800 text-white border-emerald-800',
    badge: 'bg-emerald-800/10 text-emerald-800 border-emerald-800/20',
  },
  Patanè: {
    primary: 'bg-blue-900 text-white border-blue-900',
    badge: 'bg-blue-900/10 text-blue-900 border-blue-900/20',
  },
  Other: {
    primary: 'bg-stone-600 text-white border-stone-600',
    badge: 'bg-stone-600/10 text-stone-800 border-stone-600/20',
  },
};

export const LINE_NAMES: FamilyLine[] = ['Buatti', 'Chiappini', 'Emmi', 'Patanè', 'Other'];

export const STORAGE_KEYS = {
  PEOPLE: 'buatti_emmi_people',
  LEADS: 'buatti_emmi_leads',
  QUESTIONS: 'buatti_emmi_questions',
} as const;

export const GENERATIONS = [
  { value: '4', label: 'Gen 4 — Children' },
  { value: '3', label: 'Gen 3 — Parents' },
  { value: '2', label: 'Gen 2 — Grandparents' },
  { value: '1', label: 'Gen 1 — Great-Grandparents' },
  { value: '0', label: 'Gen 0 — Great-Great-Grandparents' },
] as const;

export const RESEARCH_STATUSES = [
  'Confirmed',
  'In Progress',
  'Outstanding',
  'Ruled Out',
] as const;

export const LEAD_STATUSES = [
  'To Investigate',
  'In Progress',
  'Ruled Out',
  'Completed',
] as const;

export const LEAD_CATEGORIES = [
  'Buatti/Chiappini',
  'Emmi/Patanè',
  'General',
] as const;

export const QUESTION_STATUSES = [
  'Pending',
  'In Progress',
  'Resolved',
] as const;

export const QUESTION_CATEGORIES = [
  'Buatti/Chiappini',
  'Emmi/Patanè',
] as const;

export const DEFAULT_NEW_PERSON = {
  name: '',
  generation: 2,
  line: 'Buatti' as const,
  gender: 'M' as const,
  birthDate: '',
  birthPlace: '',
  deathDate: '',
  deathPlace: '',
  burialPlace: '',
  burialDetails: '',
  spouses: [] as string[],
  parents: [] as string[],
  children: [] as string[],
  notes: [] as string[],
  occupations: [] as string[],
  residences: [] as string[],
  researchStatus: { status: 'Outstanding' as const, details: '' },
};

export const DEFAULT_NEW_LEAD = {
  title: '',
  category: 'General' as const,
  status: 'To Investigate' as const,
  description: '',
  nextSteps: '',
};

export const DEFAULT_NEW_QUESTION = {
  question: '',
  category: 'Buatti/Chiappini' as const,
  status: 'Pending' as const,
  notes: '',
};

export function getLineColor(line: string): string {
  return LINE_COLORS[line as FamilyLine]?.primary ?? LINE_COLORS.Other.primary;
}

export function getLineBadgeColor(line: string): string {
  return LINE_COLORS[line as FamilyLine]?.badge ?? LINE_COLORS.Other.badge;
}

export const TIMELINE_EVENTS = [
  { year: '1889', title: 'Rosario Patanè Born', desc: 'Born 8 February at 4:15 AM in Calatabiano, Sicily (civil atto n. 28). Baptized 10 February. Worked as a day labourer (bracciante).', line: 'Patanè' as const, icon: 'Calendar' as const },
  { year: '1898', title: 'Ida Galanti Born', desc: 'Born in Ascoli Piceno area, Marche, Italy.', line: 'Buatti' as const, icon: 'Calendar' as const },
  { year: '1915', title: 'Gregorio Emmi Born & Baptized', desc: 'Born 27 October in Linguaglossa, Sicily. Baptized 5 December by Fr. Rochus La Rosa.', line: 'Emmi' as const, icon: 'Calendar' as const },
  { year: '1923', title: 'Ezio Buatti Born', desc: 'Born 27 April in Ascoli Piceno, Marche, Italy.', line: 'Buatti' as const, icon: 'Calendar' as const },
  { year: '1924', title: 'Rosaria Patanè Born', desc: 'Born 23 May in Fiumefreddo di Sicilia, Sicily. Trained as a tailor by her brother Sebastiano.', line: 'Patanè' as const, icon: 'Calendar' as const },
  { year: '1930', title: 'Bruna Lilia Chiappini Born', desc: 'Born 3 July in San Benedetto del Tronto, Marche, Italy.', line: 'Chiappini' as const, icon: 'Calendar' as const },
  { year: '1941', title: 'Gregorio Emmi Captured', desc: 'Captured at Asmara, Eritrea during the East African Campaign of WWII.', line: 'Emmi' as const, icon: 'Shield' as const },
  { year: '1943', title: 'Gregorio Arrives in Australia as POW', desc: 'Transported from Bombay to Sydney aboard SS Uruguay. Interned at Cowra POW Camp No. 12.', line: 'Emmi' as const, icon: 'Shield' as const },
  { year: '1944', title: 'Gregorio Hospitalized', desc: 'Hospitalized at Leongatha (malaria, May) and Tatura/Murchison (epistaxis, Dec).', line: 'Emmi' as const, icon: 'Shield' as const },
  { year: '1946', title: 'Gregorio Repatriated to Italy', desc: 'Repatriated aboard H.T. Chitral on 30 September.', line: 'Emmi' as const, icon: 'Ship' as const },
  { year: '1949', title: 'Concetta ("Connie") Emmi Born', desc: 'Born 25 April in Linguaglossa, Sicily.', line: 'Emmi' as const, icon: 'Calendar' as const },
  { year: '1950', title: 'Gregorio Migrates to Australia', desc: 'Arrives in Melbourne/Sydney aboard M/V Napoli. Settles in Ingham, QLD as a cane cutter.', line: 'Emmi' as const, icon: 'Ship' as const },
  { year: '1951', title: 'Rosaria & Connie Migrate', desc: 'Arrive in Brisbane aboard SS Surriento. Settle at Black Rock, Ingham.', line: 'Patanè' as const, icon: 'Ship' as const },
  { year: '1952', title: 'Ezio & Lilia Migrate', desc: 'Arrive in Sydney aboard Toscana. Lilia listed as "Servant".', line: 'Buatti' as const, icon: 'Ship' as const },
  { year: '1956', title: 'Alfred Buatti Born', desc: 'Born 8 November in Broadford, Victoria, Australia.', line: 'Buatti' as const, icon: 'Calendar' as const },
  { year: '1962', title: 'Buatti Family Moves to Italy', desc: 'Ezio, Lilia, Alfred, and John move back to Italy.', line: 'Buatti' as const, icon: 'Ship' as const },
  { year: '1964', title: 'Alfredo Buatti Sr. Dies', desc: 'Dies 5 September, buried at Cimitero di Borgo Solestà, Ascoli Piceno.', line: 'Buatti' as const, icon: 'Clock' as const },
  { year: '1970', title: 'Ida Galanti Dies', desc: 'Dies 26 January, buried in shared grave with Alfredo Sr. in Ascoli Piceno.', line: 'Buatti' as const, icon: 'Clock' as const },
  { year: '1975', title: 'Alfred Buatti Returns to Australia', desc: 'Returns to Australia after living in Italy for ~13 years.', line: 'Buatti' as const, icon: 'Ship' as const },
  { year: '1979', title: 'Gregorio Emmi Dies', desc: 'Dies late November, buried at Rookwood Catholic Cemetery, Sydney on 30 November.', line: 'Emmi' as const, icon: 'Clock' as const },
  { year: '1991', title: 'Ezio Buatti Dies', desc: 'Dies 16 October.', line: 'Buatti' as const, icon: 'Clock' as const },
  { year: '1994', title: 'Rosaria Patanè Dies', desc: 'Dies 30 March, buried at Cheltenham Memorial Cemetery, Victoria.', line: 'Patanè' as const, icon: 'Clock' as const },
  { year: '1998', title: 'Bruna Lilia Chiappini Dies', desc: 'Dies 23 May, buried at Springvale Botanical Cemetery, Victoria.', line: 'Chiappini' as const, icon: 'Clock' as const },
];
