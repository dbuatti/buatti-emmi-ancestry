import type { WorkflowStep } from '@/types/record';

export interface WorkflowStepInfo {
  /** 1-5 */
  number: number;
  key: WorkflowStep;
  title: string;
  /** Who does the work. */
  actor: 'assistant' | 'you';
  /** One-line explanation of what this step means for one record. */
  blurb: (recordId: string) => string;
  /** Prompt to hand to OpenCode in chat, when this step is a chat job. */
  prompt?: (recordId: string) => string;
}

export const STEP_DETAILS: WorkflowStepInfo[] = [
  {
    number: 1,
    key: 'filed',
    title: 'File the document',
    actor: 'assistant',
    blurb: () => 'Copy the file into records-local/, record its hash, and create record.md.',
    prompt: (id) => `File record ${id} (step 1) — run "process inbox".`,
  },
  {
    number: 2,
    key: 'transcribed',
    title: 'Transcribe it',
    actor: 'assistant',
    blurb: () => 'Save the transcription line by line, Italian with the English underneath.',
    prompt: (id) => `Transcribe record ${id} (step 2).`,
  },
  {
    number: 3,
    key: 'verified',
    title: 'Verify against the image',
    actor: 'you',
    blurb: () => 'Check every line against the document, correct what is wrong, then press Verified.',
  },
  {
    number: 4,
    key: 'in_app',
    title: 'Link its facts in the app',
    actor: 'assistant',
    blurb: (id) =>
      `List every fact this record states and propose the changes to familyData.ts for ${id}. Nothing is applied until you say "apply".`,
    prompt: (id) =>
      `Review record ${id} for step 4 (in_app) — list every fact it states for every person, flag conflicts with existing data, and wait for me to say "apply".`,
  },
  {
    number: 5,
    key: 'on_familysearch',
    title: 'Attach it on FamilySearch',
    actor: 'you',
    blurb: (id) =>
      `Add ${id} as a source in FamilySearch, then set on_familysearch: true in record.md.`,
    prompt: (id) =>
      `Prepare the FamilySearch "Add Source" text for record ${id} (step 5).`,
  },
];

/**
 * The next step still to do, or null when all five are done.
 */
export function getNextStepInfo(fm: {
  filed: boolean;
  transcribed: boolean;
  verified: boolean;
  in_app: boolean;
  on_familysearch: boolean;
}): WorkflowStepInfo | null {
  const done: Record<WorkflowStep, boolean> = {
    filed: fm.filed,
    transcribed: fm.transcribed,
    verified: fm.verified,
    in_app: fm.in_app,
    on_familysearch: fm.on_familysearch,
  };
  return STEP_DETAILS.find((s) => !done[s.key]) ?? null;
}
