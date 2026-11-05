import type { RecordFrontMatter, WorkflowStep } from '@/types/record';
import { parseRecordMarkdown, getWorkflowStep, getWorkflowStepNumber } from './records';

/**
 * Record loader. record.md front matter is the ONLY source of a record's status.
 * Every records/<id>/record.md is read at build/dev time via import.meta.glob,
 * so nothing here is ever edited by hand. When a record.md changes (e.g. via the
 * local update endpoint), Vite reloads it automatically.
 */

export type { WorkflowStep };

export interface RecordEntry {
  id: string;
  frontMatter: RecordFrontMatter;
  body: string;
  step: WorkflowStep;
  stepNumber: number;
}

const rawFiles = import.meta.glob('/records/*/record.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function buildEntries(): Map<string, RecordEntry> {
  const map = new Map<string, RecordEntry>();
  for (const [filePath, raw] of Object.entries(rawFiles)) {
    const id = filePath.split('/').slice(-2, -1)[0];
    const { frontMatter, body } = parseRecordMarkdown(raw);
    map.set(id, {
      id,
      frontMatter: { ...frontMatter, id: frontMatter.id || id },
      body,
      step: getWorkflowStep(frontMatter),
      stepNumber: getWorkflowStepNumber(frontMatter),
    });
  }
  return map;
}

const records = buildEntries();

export async function getRecordStep(recordId: string): Promise<{ step: WorkflowStep; stepNumber: number } | null> {
  const e = records.get(recordId);
  return e ? { step: e.step, stepNumber: e.stepNumber } : null;
}

export async function getRecordEntry(recordId: string): Promise<RecordEntry | null> {
  return records.get(recordId) ?? null;
}

export async function getAllRecords(): Promise<RecordEntry[]> {
  return Array.from(records.values());
}

export function clearRecordCache(): void {
  /* kept for compatibility; records are reloaded by Vite when files change */
}

/** Parse the "## FamilySearch" section of a record body into numbered fields. */
export interface FamilySearchFields {
  eventDate: string;
  sourceTitle: string;
  sourceType: string;
  citation: string;
  notes: string;
  reason: string;
  vitalTags: string;
  sourceBox: string;
}

export function parseFamilySearchSection(body: string): FamilySearchFields | null {
  const start = body.indexOf('## FamilySearch');
  if (start === -1) return null;
  const rest = body.slice(start + '## FamilySearch'.length);
  const end = rest.search(/\n## /);
  const section = end === -1 ? rest : rest.slice(0, end);
  const fields: Record<string, string> = {};
  const parts = section.split(/\n### /).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
    const num = heading.match(/^(\d)/)?.[1] ?? '';
    fields[num] = (nl === -1 ? '' : part.slice(nl + 1)).trim();
  }
  return {
    eventDate: fields['1'] ?? '',
    sourceTitle: fields['2'] ?? '',
    sourceType: fields['3'] ?? '',
    citation: fields['4'] ?? '',
    notes: fields['5'] ?? '',
    reason: fields['6'] ?? '',
    vitalTags: fields['7'] ?? '',
    sourceBox: fields['8'] ?? '',
  };
}
