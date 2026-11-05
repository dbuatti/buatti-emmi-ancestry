// Next-task logic for the family-tree guide mode.
// Used by both the app (via NextGuide.tsx) and by the assistant.

export type WorkflowStep = 'filed' | 'transcribed' | 'verified' | 'in_app' | 'on_familysearch';

export interface LifeEvent {
  type: 'birth' | 'baptism' | 'marriage' | 'death' | 'burial' | 'migration_naturalisation';
  recordId?: string;
  step?: 1 | 2 | 3 | 4 | 5;
  status: 'linked' | 'known_no_record' | 'missing';
  note?: string;
}

export interface Person {
  id: string;
  name: string;
  lifeEvents?: LifeEvent[];
}

export interface NextTask {
  personId: string;
  personName: string;
  type: 'record_check' | 'record_app' | 'record_fs' | 'missing_event' | 'unsorted_file';
  recordId?: string;
  eventType?: LifeEvent['type'];
  step?: WorkflowStep;
  stepNumber?: number;
  note?: string;
}

const PILOT_PERSON_ID = 'gregorio-emmi';

export function getNextTask(people: Person[]): NextTask | null {
  const person = people.find((p) => p.id === PILOT_PERSON_ID);
  if (!person) return null;

  const lifeEvents = person.lifeEvents ?? [];

  // 1. Linked records: advance through workflow steps
  const linkedEvents = lifeEvents.filter((ev) => ev.status === 'linked' && ev.recordId);
  for (const ev of linkedEvents) {
    if (!ev.recordId) continue;
    const stepNum = ev.step ?? 1;

    if (stepNum === 1) {
      return {
        personId: person.id,
        personName: person.name,
        type: 'record_check',
        recordId: ev.recordId,
        step: 'filed',
        stepNumber: 1,
        note: `Record ${ev.recordId} filed. Confirm contents match the document.`,
      };
    }
    if (stepNum === 2) {
      return {
        personId: person.id,
        personName: person.name,
        type: 'record_check',
        recordId: ev.recordId,
        step: 'transcribed',
        stepNumber: 2,
        note: `Record ${ev.recordId} transcribed. Review against the document image.`,
      };
    }
    if (stepNum === 3) {
      return {
        personId: person.id,
        personName: person.name,
        type: 'record_check',
        recordId: ev.recordId,
        step: 'verified',
        stepNumber: 3,
        note: `Record ${ev.recordId} awaits your verification.`,
      };
    }
    if (stepNum === 4) {
      return {
        personId: person.id,
        personName: person.name,
        type: 'record_app',
        recordId: ev.recordId,
        step: 'in_app',
        stepNumber: 4,
        note: `Link ${ev.recordId} to person facts in the app.`,
      };
    }
    if (stepNum === 5) {
      return {
        personId: person.id,
        personName: person.name,
        type: 'record_fs',
        recordId: ev.recordId,
        step: 'on_familysearch',
        stepNumber: 5,
        note: `Attach ${ev.recordId} on FamilySearch.`,
      };
    }
  }

  // 2. Missing events
  const missingEvents = lifeEvents.filter((ev) => ev.status === 'missing');
  if (missingEvents.length > 0) {
    const ev = missingEvents[0];
    return {
      personId: person.id,
      personName: person.name,
      type: 'missing_event',
      eventType: ev.type,
      note: `No record found for ${ev.type}. Search for sources.`,
    };
  }

  // 3. Known but no record
  const knownNoRecord = lifeEvents.filter((ev) => ev.status === 'known_no_record');
  if (knownNoRecord.length > 0) {
    const ev = knownNoRecord[0];
    return {
      personId: person.id,
      personName: person.name,
      type: 'missing_event',
      eventType: ev.type,
      note: `${ev.type} known (${ev.note}) but no record.md exists. Create one.`,
    };
  }

  // 4. Unsorted files
  return {
    personId: person.id,
    personName: person.name,
    type: 'unsorted_file',
    note: 'Review unsorted files for Gregorio Emmi.',
  };
}

export function getProgress(people: Person[], personId: string): string {
  const person = people.find((p) => p.id === personId);
  if (!person || !person.lifeEvents) return '0 of 0';

  const total = person.lifeEvents.length;
  const completed = person.lifeEvents.filter(
    (ev) => ev.status === 'linked' && (ev.step ?? 0) >= 5
  ).length;

  return `${completed} of ${total}`;
}
