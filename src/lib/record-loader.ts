import { parseRecordMarkdown, getWorkflowStepNumber } from './records';
import type { RecordFrontMatter, WorkflowStep } from './record';

/**
 * Record loader: loads all record.md files via Vite import.meta.glob
 * and computes the workflow step from front matter.
 *
 * record.md front matter is the SOURCE OF TRUTH for step status.
 * lifeEvents in familyData.ts only links recordId — step is computed here.
 */

interface RecordEntry {
  id: string;
  frontMatter: RecordFrontMatter;
  body: string;
  step: WorkflowStep;
  stepNumber: number;
}

let recordsCache: Map<string, RecordEntry> | null = null;

/**
 * Load all record.md files from the records/ directory.
 * Only runs in dev/build time (import.meta.glob is a build-time feature).
 */
async function loadAllRecords(): Promise<Map<string, RecordEntry>> {
  if (recordsCache) return recordsCache;

  const modules = import.meta.glob<'/records/*.md', { default: string }>('/records/*.md', {
    eager: true,
    import: 'default',
  });

  const cache = new Map<string, RecordEntry>();

  for (const [path, mod] of Object.entries(modules)) {
    const raw = mod.default as string;
    const { frontMatter, body } = parseRecordMarkdown(raw);
    const { id } = frontMatter;
    if (!id) continue;

    const step = getWorkflowStepNumber(frontMatter);
    const stepName = ['filed', 'transcribed', 'verified', 'in_app', 'on_familysearch'][step - 1] as WorkflowStep;

    cache.set(id, {
      id,
      frontMatter,
      body,
      step: stepName,
      stepNumber: step,
    });
  }

  recordsCache = cache;
  return cache;
}

/**
 * Get the step for a record by its recordId.
 * Returns null if the record is not found.
 */
export async function getRecordStep(recordId: string): Promise<{ step: WorkflowStep; stepNumber: number } | null> {
  const cache = await loadAllRecords();
  const entry = cache.get(recordId);
  if (!entry) return null;
  return { step: entry.step, stepNumber: entry.stepNumber };
}

/**
 * Get the full record entry (front matter + body + step) by recordId.
 */
export async function getRecordEntry(recordId: string): Promise<{ frontMatter: RecordFrontMatter; body: string; step: WorkflowStep; stepNumber: number } | null> {
  const cache = await loadAllRecords();
  const entry = cache.get(recordId);
  if (!entry) return null;
  return { frontMatter: entry.frontMatter, body: entry.body, step: entry.step, stepNumber: entry.stepNumber };
}

/**
 * Get all records.
 */
export async function getAllRecords(): Promise<RecordEntry[]> {
  const cache = await loadAllRecords();
  return Array.from(cache.values());
}

/**
 * Clear the cache (for testing).
 */
export function clearRecordCache(): void {
  recordsCache = null;
}
