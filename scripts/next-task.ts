// Next-task logic for the family-tree guide mode.
// Used by both the app (via NextGuide.tsx) and by the assistant.
//
// record.md front matter is the SOURCE OF TRUTH for step status.
// lifeEvents in familyData.ts only links recordId — step is computed
// from record.md front matter and passed in as recordSteps.
//
// Events with status 'known_no_record' are NOT "create a record" tasks:
// the document already exists somewhere, so the card is "Get the document"
// (or "Chase <office>?" once a request has gone unanswered for REQUEST_CHASE_DAYS).
// Per-event state saved by the card lives in src/data/event-requests.json and is
// passed in as `overrides` — keyed `${personId}|${eventType}`.

export type WorkflowStep = 'filed' | 'transcribed' | 'verified' | 'in_app' | 'on_familysearch';

export type LifeEventType =
  | 'birth'
  | 'baptism'
  | 'marriage'
  | 'death'
  | 'burial'
  | 'migration_naturalisation';

export interface LifeEvent {
  type: LifeEventType;
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

/** What the Next card remembers about one event between visits. */
export interface EventOverride {
  /** ISO yyyy-mm-dd — the day the request was sent. Skipped for REQUEST_CHASE_DAYS. */
  requestedOn?: string;
  /** Who was asked (office / archive / registry), so the chase can name them. */
  requestedFrom?: string;
  /** ISO yyyy-mm-dd — the document is in hand, waiting to be filed. */
  receivedOn?: string;
  /** record.md created from a link found online (before familyData.ts is edited). */
  recordId?: string;
}

export type EventOverrides = Record<string, EventOverride>;

export type NextTaskType =
  | 'record_check'
  | 'record_app'
  | 'record_fs'
  | 'get_document'
  | 'chase_request'
  | 'process_inbox'
  | 'missing_event'
  | 'unsorted_file';

export interface NextTask {
  personId: string;
  personName: string;
  type: NextTaskType;
  recordId?: string;
  eventType?: LifeEventType;
  step?: WorkflowStep;
  stepNumber?: number;
  note?: string;
  /** The lifeEvent note — where the document already exists. */
  whereItIs?: string;
  /** Office/archive detected in the note: who to request from, who to chase. */
  office?: string;
  requestedOn?: string;
  receivedOn?: string;
  daysWaiting?: number;
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

/** How long a request is left alone before the card proposes chasing it. */
export const REQUEST_CHASE_DAYS = 30;

export const EVENT_LABELS: Record<LifeEventType, string> = {
  birth: 'birth',
  baptism: 'baptism',
  marriage: 'marriage',
  death: 'death',
  burial: 'burial',
  migration_naturalisation: 'migration / naturalisation',
};

export function eventKey(personId: string, eventType: LifeEventType): string {
  return `${personId}|${eventType}`;
}

/** Local-time ISO date (yyyy-mm-dd), so "today" matches the user's calendar. */
export function toIsoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole days between an ISO date and `now`. null if the date is unusable. */
export function daysSince(iso: string | undefined, now: Date = new Date()): number | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const then = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(then.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - then.getTime()) / 86400000);
}

// Longest prefixes first: "Archivio di Stato di" must win over "Archivio di Stato".
const OFFICE_PREFIXES = [
  'Archivio di Stato di',
  'Archivio di Stato',
  'Archivio Diocesano di',
  'Archivio Diocesano',
  'Archivio Segreto Vaticano',
  'National Archives of Australia',
  'Registry of Births, Deaths and Marriages',
  'Università degli Studi di',
  'Università di',
  'Comune di',
  'Parrocchia di',
  'Parrocchia del',
  'Parrocchia della',
  'Arcidiocesi di',
  'Diocesi di',
  'Curia di',
  "Consolato Generale d'Italia",
  "Consolato d'Italia",
  'Consolato di',
  'Tribunale di',
  'State Records',
  'State Archives',
];

/**
 * Pull the institution out of a lifeEvent note, e.g.
 * "… (source: estratto atto 202, Comune di Linguaglossa, issued 30/06/2026)."
 *   → "Comune di Linguaglossa"
 * Returns null when the note names no institution — never invents one.
 */
export function extractOffice(note?: string): string | null {
  if (!note) return null;
  const lower = note.toLowerCase();
  let best: { index: number; text: string } | null = null;

  for (const prefix of OFFICE_PREFIXES) {
    const idx = lower.indexOf(prefix.toLowerCase());
    if (idx === -1) continue;
    // Cut at the first clause break: ", ; ( newline — –" or a spaced hyphen.
    const cut = note.slice(idx).split(/[,;(\n—–]|\s-\s/)[0];
    let text = cut.replace(/\s+/g, ' ').trim();
    if (text.length > 60) {
      text = text.slice(0, 60).replace(/\s+\S*$/, '');
    }
    if (text.length < prefix.length) continue;
    if (!best || idx < best.index) best = { index: idx, text };
  }

  return best ? best.text : null;
}

/**
 * "Comune di Linguaglossa" → "Linguaglossa", for naming a record created from
 * a link ("1948_Linguaglossa_marriage_Emmi-Gregorio"). Non-office strings pass through.
 */
export function placeFromOffice(office?: string): string {
  if (!office) return '';
  const m = office.match(
    /^(?:Comune di|Parrocchia di|Parrocchia del|Parrocchia della|Arcidiocesi di|Diocesi di|Curia di|Tribunale di|Consolato di|Consolato Generale d'Italia|Consolato d'Italia|Archivio di Stato di|Archivio Diocesano di)\s*(.+)$/i
  );
  return m ? m[1].trim() : office.trim();
}

export function getNextTask(
  people: Person[],
  recordSteps?: Map<string, RecordStepInfo>,
  overrides?: EventOverrides,
  now: Date = new Date()
): NextTask | null {
  const person = people.find((p) => p.id === PILOT_PERSON_ID);
  if (!person) return null;

  const lifeEvents = person.lifeEvents ?? [];
  const ov = overrides ?? {};
  const base = { personId: person.id, personName: person.name };

  // 1. Linked records: advance through workflow steps.
  //    A record created from a link found online (override.recordId) counts as
  //    linked already, so the card moves on before familyData.ts is edited.
  for (const ev of lifeEvents) {
    const o = ov[eventKey(person.id, ev.type)];
    const recordId = ev.recordId ?? o?.recordId;
    if (!recordId) continue;
    if (ev.status !== 'linked' && !o?.recordId) continue;

    // Step comes from record.md front matter: highest COMPLETED step.
    // The NEXT task is stepNum + 1.
    const stepInfo = recordSteps?.get(recordId);
    const completedStepNum = stepInfo?.stepNumber ?? 0;
    const nextStepNum = completedStepNum + 1;

    if (nextStepNum > 5) continue; // All steps done for this record

    const nextStepName = STEP_NAMES[nextStepNum - 1];
    const note = STEP_NOTES[nextStepNum]?.replace('{recordId}', recordId) ?? '';

    if (nextStepNum === 1) {
      return {
        ...base,
        type: 'record_check',
        recordId,
        eventType: ev.type,
        step: nextStepName,
        stepNumber: nextStepNum,
        note,
      };
    }
    if (nextStepNum === 2) {
      return {
        ...base,
        type: 'record_check',
        recordId,
        eventType: ev.type,
        step: nextStepName,
        stepNumber: nextStepNum,
        note,
      };
    }
    if (nextStepNum === 3) {
      return {
        ...base,
        type: 'record_check',
        recordId,
        eventType: ev.type,
        step: nextStepName,
        stepNumber: nextStepNum,
        note,
      };
    }
    if (nextStepNum === 4) {
      return {
        ...base,
        type: 'record_app',
        recordId,
        eventType: ev.type,
        step: nextStepName,
        stepNumber: nextStepNum,
        note,
      };
    }
    if (nextStepNum === 5) {
      return {
        ...base,
        type: 'record_fs',
        recordId,
        eventType: ev.type,
        step: nextStepName,
        stepNumber: nextStepNum,
        note,
      };
    }
  }

  // 2. Missing events — no document is known to exist anywhere.
  const missingEvents = lifeEvents.filter((ev) => ev.status === 'missing');
  if (missingEvents.length > 0) {
    const ev = missingEvents[0];
    return {
      ...base,
      type: 'missing_event',
      eventType: ev.type,
      note: `No record found for ${ev.type}. Search for sources.`,
    };
  }

  // 3. Known but no record: the document exists somewhere.
  //    classify each one — waiting, chaseable, in hand, or not yet asked for.
  let received: { ev: LifeEvent; o: EventOverride } | null = null;
  let chase: { ev: LifeEvent; o: EventOverride; days: number; office: string | null } | null = null;
  let fresh: { ev: LifeEvent; office: string | null } | null = null;

  for (const ev of lifeEvents) {
    if (ev.status !== 'known_no_record') continue;
    if (ev.recordId) continue; // already has a record
    const o = ov[eventKey(person.id, ev.type)];
    if (o?.recordId) continue; // record created from a link

    if (o?.receivedOn) {
      if (!received) received = { ev, o };
      continue;
    }

    if (o?.requestedOn) {
      const days = daysSince(o.requestedOn, now);
      // Unreadable date counts as "just asked" — never chase on bad data.
      if (days === null || days < REQUEST_CHASE_DAYS) continue;
      if (!chase) {
        chase = { ev, o, days, office: o.requestedFrom || extractOffice(ev.note) };
      }
      continue;
    }

    if (!fresh) fresh = { ev, office: extractOffice(ev.note) };
  }

  // Finish what is already in hand before starting something new.
  if (received) {
    const label = EVENT_LABELS[received.ev.type];
    return {
      ...base,
      type: 'process_inbox',
      eventType: received.ev.type,
      note: `${label} received — save it to _inbox and run "process inbox".`,
      whereItIs: received.ev.note?.trim() ?? '',
      receivedOn: received.o.receivedOn,
    };
  }

  if (chase) {
    const label = EVENT_LABELS[chase.ev.type];
    return {
      ...base,
      type: 'chase_request',
      eventType: chase.ev.type,
      note: `Chase ${chase.office ?? `the ${label} record`}? Requested ${chase.o.requestedOn} — ${chase.days} days and no reply.`,
      whereItIs: chase.ev.note?.trim() ?? '',
      office: chase.office ?? undefined,
      requestedOn: chase.o.requestedOn,
      daysWaiting: chase.days,
    };
  }

  if (fresh) {
    const label = EVENT_LABELS[fresh.ev.type];
    return {
      ...base,
      type: 'get_document',
      eventType: fresh.ev.type,
      note: `Get the document: ${label}${fresh.office ? ` — request it from ${fresh.office}` : ''}.`,
      whereItIs: fresh.ev.note?.trim() ?? '',
      office: fresh.office ?? undefined,
    };
  }

  // 4. Unsorted files
  return {
    ...base,
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
