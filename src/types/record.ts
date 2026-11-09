export interface RecordLink {
  label: string;
  url: string;
}

export interface RecordFrontMatter {
  id: string;
  type: string;
  date: string;
  place: string;
  comune: string;
  register: string;
  year: string;
  atto: string;
  people: string[];
  mentioned: string[];
  source_office: string;
  protocol: string;
  transcribed_by: string;
  translated_by: string;
  filed: boolean;
  transcribed: boolean;
  verified: boolean;
  in_app: boolean;
  on_familysearch: boolean;
  image_link?: string;
  links?: RecordLink[];
  pages?: number[];
}

export interface RecordData {
  frontMatter: RecordFrontMatter;
  body: string;
}

export interface LifeEvent {
  type: 'birth' | 'baptism' | 'marriage' | 'death' | 'burial' | 'migration_naturalisation';
  recordId?: string;
  step?: 1 | 2 | 3 | 4 | 5;
  status: 'linked' | 'known_no_record' | 'missing';
  note?: string;
}

export type WorkflowStep = 'filed' | 'transcribed' | 'verified' | 'in_app' | 'on_familysearch';

export function stepLabel(step: WorkflowStep): string {
  const labels: Record<WorkflowStep, string> = {
    filed: 'Filed',
    transcribed: 'Transcribed',
    verified: 'Verified',
    in_app: 'In App',
    on_familysearch: 'FamilySearch',
  };
  return labels[step];
}

export const WORKFLOW_STEPS: WorkflowStep[] = ['filed', 'transcribed', 'verified', 'in_app', 'on_familysearch'];
