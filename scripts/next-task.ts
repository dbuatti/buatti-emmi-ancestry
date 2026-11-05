// Next-task logic for the family-tree guide mode.
// Used by both the app (via NextGuide.tsx) and by the assistant.
//
// record.md front matter is the SOURCE OF TRUTH for step status.
// lifeEvents in familyData.ts only links recordId — step is computed
// from record.md front matter and passed in as recordSteps.

export type WorkflowStep = 'filed' | 'transcribed' | 'verified' | 'in_app' | 'on_familysearch';

export interface LifeEvent {
  type: 'birth' | 'baptism' | 'marriage' | 'death' | 'burial' | 'migration_naturalisation';
  recordId?: string;
  status: 'linked' | 'known_no_record' | 'missing';
  note?: string;
}

export interface Person {
  id: string;
  name: string;
  lifeEvents?: LifeEvent[];
}

export interface RecordStepInfo {
  step: WorkflowStep;
  stepNumber: number;
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

const STEP_NAMES: WorkflowStep[] = ['filed', 'transcribed', 'verified', 'in_app', 'on_familysearch'];

const STEP_NOTES: Record<number, string> = {
  1: 'Record {recordId} filed. Confirm contents match the document.',
  2: 'Record {recordId} transcribed. Review against the document image.',
  3: 'Record {recordId} awaits your verification.',
  4: 'Link {recordId} to person facts in the app.',
  5: 'Attach {recordId} on FamilySearch.',
};

export function getNextTask(people: Person[], recordSteps?: Map<string, RecordStepInfo>): NextTask | null {
  const person = people.find((p) => p.id === PILOT_PERSON_ID);
  if (!person) return null;

  const lifeEvents = person.lifeEvents ?? [];

  // 1. Linked records: advance through workflow steps
  const linkedEvents = lifeEvents.filter((ev) => ev.status === 'linked' && ev.recordId);
  for (const ev of linkedEvents) {
    if (!ev.recordId) continue;

    // Step comes from record.md front matter: highest COMPLETED step.
    // The NEXT task is stepNum + 1.
    const stepInfo = recordSteps?.get(ev.recordId);
    const completedStepNum = stepInfo?.stepNumber ?? 0;
    const nextStepNum = completedStepNum + 1;

    if (nextStepNum > 5) continue; // All steps done for this record

    const nextStepName = STEP_NAMES[nextStepNum - 1];
    const note = STEP_NOTES[nextStepNum]?.replace('{recordId}', ev.recordId) ?? '';

    if (nextStepNum === 1) {
      return {
        personId: person.id,
        personName: person.name,
        type: 'record_check',
        recordId: ev.recordId,
        eventType: ev.type,
        step: nextStepName,
        stepNumber: nextStepNum,
        note,
      };
    }
    if (nextStepNum === 2) {
      return {
        personId: person.id,
        personName: person.name,
        type: 'record_check',
        recordId: ev.recordId,
        eventType: ev.type,
        step: nextStepName,
        stepNumber: nextStepNum,
        note,
      };
    }
    if (nextStepNum === 3) {
      return {
        personId: person.id,
        personName: person.name,
        type: 'record_check',
        recordId: ev.recordId,
        eventType: ev.type,
        step: nextStepName,
        stepNumber: nextStepNum,
        note,
      };
    }
    if (nextStepNum === 4) {
      return {
        personId: person.id,
        personName: person.name,
        type: 'record_app',
        recordId: ev.recordId,
        eventType: ev.type,
        step: nextStepName,
        stepNumber: nextStepNum,
        note,
      };
    }
    if (nextStepNum === 5) {
      return {
        personId: person.id,
        personName: person.name,
        type: 'record_fs',
        recordId: ev.recordId,
        eventType: ev.type,
        step: nextStepName,
        stepNumber: nextStepNum,
        note,
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

export function getProgress(people: Person[], personId: string, recordSteps?: Map<string, RecordStepInfo>): string {
  const person = people.find((p) => p.id === personId);
  if (!person || !person.lifeEvents) return '0 of 0';

  const total = person.lifeEvents.length;
  const completed = person.lifeEvents.filter((ev) => {
    if (ev.status !== 'linked' || !ev.recordId) return false;
    const stepInfo = recordSteps?.get(ev.recordId);
    return (stepInfo?.stepNumber ?? 0) >= 5;
  }).length;

  return `${completed} of ${total}`;
}
