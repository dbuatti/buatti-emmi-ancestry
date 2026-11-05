import type { RecordFrontMatter, WorkflowStep } from './record';

/**
 * Record loader: provides record step info from record.md front matter.
 *
 * record.md front matter is the SOURCE OF TRUTH for step status.
 * lifeEvents in familyData.ts only links recordId — step is computed here.
 *
 * Record steps are hardcoded here (synced from record.md front matter).
 * Update this map when a record's step changes.
 */

interface RecordEntry {
  id: string;
  frontMatter: RecordFrontMatter;
  body: string;
  step: WorkflowStep;
  stepNumber: number;
}

// Record steps from record.md front matter (source of truth).
// Update these when a record's step changes (e.g. verified:true → in_app:true).
const RECORD_STEPS: Record<string, { step: WorkflowStep; stepNumber: number }> = {
  '1870_Linguaglossa_birth_Emmi-Egidio_atto31': { step: 'filed', stepNumber: 1 },
  '1900_Linguaglossa_marriage_Emmi-Sgroi_atto59': { step: 'filed', stepNumber: 1 },
  '1915_Linguaglossa_birth_Emmi-Gregorio_atto202': { step: 'in_app', stepNumber: 4 },
  '1930_San-Benedetto_birth_Chiappini-Lilia_atto196': { step: 'filed', stepNumber: 1 },
  '1938-1952_Ascoli-Piceno_school-file_Buatti-Ezio': { step: 'filed', stepNumber: 1 },
  '1942_Ascoli-Piceno_diploma-register_Buatti-Ezio': { step: 'filed', stepNumber: 1 },
  '1944-1949_Perugia-University_student-file_Buatti-Ezio': { step: 'filed', stepNumber: 1 },
  '1952_Branxton-parish_marriage_Buatti-Chiappini': { step: 'filed', stepNumber: 1 },
  '1952_NSW_marriage_Buatti-Chiappini_reg27340': { step: 'filed', stepNumber: 1 },
  '1963_Ascoli-Piceno_marriage-transcription_Buatti-Chiappini_atto36': { step: 'filed', stepNumber: 1 },
  '1991_Maltignano_death_Buatti-Ezio_atto4': { step: 'filed', stepNumber: 1 },
  '1998_Maltignano_death_Chiappini-Lilia_atto6': { step: 'filed', stepNumber: 1 },
};

let recordsCache: Map<string, RecordEntry> | null = null;

function makeEntry(id: string, info: { step: WorkflowStep; stepNumber: number }): RecordEntry {
  return {
    id,
    frontMatter: {
      id,
      type: '',
      date: '',
      place: '',
      comune: '',
      register: '',
      year: '',
      atto: '',
      people: [],
      source_office: '',
      protocol: '',
      transcribed_by: '',
      filed: info.stepNumber >= 1,
      transcribed: info.stepNumber >= 2,
      verified: info.stepNumber >= 3,
      in_app: info.stepNumber >= 4,
      on_familysearch: info.stepNumber >= 5,
    },
    body: '',
    step: info.step,
    stepNumber: info.stepNumber,
  };
}

async function loadAllRecords(): Promise<Map<string, RecordEntry>> {
  if (recordsCache) return recordsCache;

  const cache = new Map<string, RecordEntry>();
  for (const [id, info] of Object.entries(RECORD_STEPS)) {
    cache.set(id, makeEntry(id, info));
  }

  recordsCache = cache;
  return cache;
}

export async function getRecordStep(recordId: string): Promise<{ step: WorkflowStep; stepNumber: number } | null> {
  const cache = await loadAllRecords();
  const entry = cache.get(recordId);
  if (!entry) return null;
  return { step: entry.step, stepNumber: entry.stepNumber };
}

export async function getRecordEntry(recordId: string): Promise<{ frontMatter: RecordFrontMatter; body: string; step: WorkflowStep; stepNumber: number } | null> {
  const cache = await loadAllRecords();
  const entry = cache.get(recordId);
  if (!entry) return null;
  return { frontMatter: entry.frontMatter, body: entry.body, step: entry.step, stepNumber: entry.stepNumber };
}

export async function getAllRecords(): Promise<RecordEntry[]> {
  const cache = await loadAllRecords();
  return Array.from(cache.values());
}

export function clearRecordCache(): void {
  recordsCache = null;
}
