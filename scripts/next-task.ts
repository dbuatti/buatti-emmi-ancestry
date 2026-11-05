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
//
// Person-skip state lives in src/data/person-skips.json and is passed in as
// `personSkips` — keyed by person id, with `skippedOn`.

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
  generation?: number;
  line?: string;
  gender?: 'M' | 'F';
  isLiving?: boolean;
  lifeEvents?: LifeEvent[];
  parents?: string[];
  children?: string[];
  spouses?: string[];
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

export type PersonSkips = Record<string, { skippedOn?: string }>;

export type NextTaskType =
  | 'record_check'
  | 'record_app'
  | 'record_fs'
  | 'get_document'
  | 'chase_request'
  | 'process_inbox'
  | 'missing_event'
  | 'unsorted_file'
  | 'fs_person_check';

export interface NextTask {
  personId: string;
  personName: string;
  /** Relationship to Daniele, e.g. "grandfather". */
  relationship?: string;
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

const ROOT_ID = 'daniele-buatti';

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

export function extractOffice(rawNote?: string): string | null {
  if (!rawNote) return null;
  const ref = rawNote.match(/Reference:\s*([^,;(]+?)\s*,/i);
  if (ref) {
    const place = ref[1].trim();
    const hasPrefix = OFFICE_PREFIXES.some((p) => place.toLowerCase().startsWith(p.toLowerCase()));
    return hasPrefix ? place : `Comune di ${place}`;
  }
  const note = rawNote.replace(/\(\s*source:[^)]*\)/gi, ' ');
  const lower = note.toLowerCase();
  let best: { index: number; text: string } | null = null;

  for (const prefix of OFFICE_PREFIXES) {
    const idx = lower.indexOf(prefix.toLowerCase());
    if (idx === -1) continue;
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

export function placeFromOffice(office?: string): string {
  if (!office) return '';
  const m = office.match(
    /^(?:Comune di|Parrocchia di|Parrocchia del|Parrocchia della|Arcidiocesi di|Diocesi di|Curia di|Tribunale di|Consolato di|Consolato Generale d'Italia|Consolato d'Italia|Archivio di Stato di|Archivio Diocesano di)\s*(.+)$/i
  );
  return m ? m[1].trim() : office.trim();
}

export type FsChecks = Record<string, { checkedOn?: string; openItems?: number; snoozedOn?: string }>;

/* ------------------------------------------------------------------ */
/* Graph helpers for ordering + relationship labels                    */
/* ------------------------------------------------------------------ */

interface GraphCtx {
  byId: Map<string, Person>;
  gens: Map<string, number>;
  ancestors: Set<string>;
}

function buildGraph(people: Person[]): GraphCtx {
  const byId = new Map(people.map((p) => [p.id, p]));
  const gens = new Map<string, number>();
  const root = byId.get(ROOT_ID);
  if (root) {
    const queue: { id: string; g: number }[] = [{ id: ROOT_ID, g: 0 }];
    gens.set(ROOT_ID, 0);
    while (queue.length) {
      const cur = queue.shift() as { id: string; g: number };
      const person = byId.get(cur.id);
      if (!person) continue;
      for (const pid of person.parents || []) {
        if (byId.has(pid) && !gens.has(pid)) {
          gens.set(pid, cur.g - 1);
          queue.push({ id: pid, g: cur.g - 1 });
        }
      }
      for (const cid of person.children || []) {
        if (byId.has(cid) && !gens.has(cid)) {
          gens.set(cid, cur.g + 1);
          queue.push({ id: cid, g: cur.g + 1 });
        }
      }
    }
    // spouses share a generation
    let changed = true;
    let guard = 0;
    while (changed && guard++ < 200) {
      changed = false;
      for (const p of people) {
        if (gens.has(p.id)) continue;
        for (const sid of p.spouses || []) {
          const g = gens.get(sid);
          if (g !== undefined) {
            gens.set(p.id, g);
            changed = true;
            break;
          }
        }
      }
    }
    const rootStored = typeof root.generation === 'number' ? root.generation : 0;
    for (const p of people) {
      if (!gens.has(p.id)) {
        gens.set(p.id, (typeof p.generation === 'number' ? p.generation : rootStored) - rootStored);
      }
    }
  }

  const ancestors = new Set<string>();
  if (byId.has(ROOT_ID)) {
    const seen = new Set<string>([ROOT_ID]);
    const q: string[] = [ROOT_ID];
    while (q.length) {
      const id = q.shift() as string;
      const person = byId.get(id);
      if (!person) continue;
      for (const pid of person.parents || []) {
        if (!byId.has(pid) || seen.has(pid)) continue;
        seen.add(pid);
        if (pid !== ROOT_ID) ancestors.add(pid);
        q.push(pid);
      }
    }
  }

  return { byId, gens, ancestors };
}

function ancestorTerm(gen: number, gender: 'M' | 'F'): string {
  const male = gender !== 'F';
  if (gen === -1) return male ? 'father' : 'mother';
  if (gen === -2) return male ? 'grandfather' : 'grandmother';
  if (gen === -3) return male ? 'great-grandfather' : 'great-grandmother';
  if (gen === -4) return male ? 'great-great-grandfather' : 'great-great-grandmother';
  if (gen < -4) {
    const n = Math.abs(gen) - 2;
    return `${n}× great-${male ? 'grandfather' : 'grandmother'}`;
  }
  if (gen === 0) return 'self';
  const n = gen;
  return `${n} generation${n === 1 ? '' : 's'} below Daniele`;
}

function relationshipLabel(person: Person, ctx: GraphCtx): string {
  if (person.id === ROOT_ID) return 'self';

  const gen = ctx.gens.get(person.id);
  const gender = person.gender || 'M';

  if (ctx.ancestors.has(person.id) && gen !== undefined) {
    return ancestorTerm(gen, gender);
  }

  // spouse of a direct ancestor
  const ancestorSpouse = (person.spouses || [])
    .map((id) => ctx.byId.get(id))
    .find((s) => !!s && ctx.ancestors.has(s.id));
  if (ancestorSpouse) {
    const sGen = ctx.gens.get(ancestorSpouse.id);
    const sTerm = sGen === undefined ? 'direct ancestor' : ancestorTerm(sGen, ancestorSpouse.gender || 'M');
    return `spouse of ${sTerm}`;
  }

  // child of a direct ancestor
  const ancestorParents = (person.parents || [])
    .map((id) => ctx.byId.get(id))
    .filter((x): x is Person => !!x && ctx.ancestors.has(x.id));
  if (ancestorParents.length) {
    return `${gender === 'M' ? 'son' : 'daughter'} of direct ancestor`;
  }

  if (gen === 0) {
    return `${gender === 'M' ? 'brother' : 'sister'} (same generation as Daniele)`;
  }

  return 'extended family';
}

/* ------------------------------------------------------------------ */
/* Queue ordering                                                     */
/* ------------------------------------------------------------------ */

const LINE_ORDER = ['Buatti', 'Chiappini', 'Emmi', 'Patanè', 'Other'];

function queueOrder(people: Person[], personSkips: PersonSkips): Person[] {
  return [...people].sort((a, b) => {
    const sa = !!personSkips?.[a.id]?.skippedOn;
    const sb = !!personSkips?.[b.id]?.skippedOn;
    if (sa !== sb) return sa ? 1 : -1;

    // Daniele always first
    if (a.id === ROOT_ID) return -1;
    if (b.id === ROOT_ID) return 1;

    const ga = typeof a.generation === 'number' ? a.generation : 0;
    const gb = typeof b.generation === 'number' ? b.generation : 0;
    if (gb !== ga) return gb - ga; // highest generation first

    const la = LINE_ORDER.indexOf(a.line || 'Other');
    const lb = LINE_ORDER.indexOf(b.line || 'Other');
    const laN = la < 0 ? 99 : la;
    const lbN = lb < 0 ? 99 : lb;
    if (laN !== lbN) return laN - lbN;

    return a.id.localeCompare(b.id);
  });
}

/* ------------------------------------------------------------------ */
/* Per-person work detection                                          */
/* ------------------------------------------------------------------ */

interface PersonWorkResult {
  task: NextTask | null;
  waiting: boolean;
}

function tryPerson(
  person: Person,
  recordSteps: Map<string, RecordStepInfo>,
  overrides: EventOverrides,
  now: Date,
  fsChecks: FsChecks,
  ctx: GraphCtx
): PersonWorkResult {
  const lifeEvents = person.lifeEvents ?? [];
  const ov = overrides ?? {};
  const base = { personId: person.id, personName: person.name, relationship: relationshipLabel(person, ctx) };
  const isLiving = !!person.isLiving;
  const maxStep = isLiving ? 4 : 5;

  // 1. Linked records: advance through workflow steps.
  for (const ev of lifeEvents) {
    const o = ov[eventKey(person.id, ev.type)];
    const recordId = ev.recordId ?? o?.recordId;
    if (!recordId) continue;
    if (ev.status !== 'linked' && !o?.recordId) continue;

    const stepInfo = recordSteps?.get(recordId);
    const completedStepNum = stepInfo?.stepNumber ?? 0;
    const nextStepNum = completedStepNum + 1;

    if (nextStepNum > maxStep) continue; // done for this record

    const nextStepName = STEP_NAMES[nextStepNum - 1];
    const note = (STEP_NOTES[nextStepNum] ?? '').replace('{recordId}', recordId);

    let type: NextTaskType;
    if (nextStepNum === 4) type = 'record_app';
    else if (nextStepNum === 5) type = 'record_fs';
    else type = 'record_check';

    return {
      task: {
        ...base,
        type,
        recordId,
        eventType: ev.type,
        step: nextStepName,
        stepNumber: nextStepNum,
        note,
      },
      waiting: false,
    };
  }

  // 1b. Every linked record is done → is the PERSON page up to date on FamilySearch?
  if (!isLiving) {
    const linked = lifeEvents
      .map((ev) => ev.recordId ?? ov[eventKey(person.id, ev.type)]?.recordId)
      .filter((id): id is string => !!id);
    const allDone =
      linked.length > 0 && linked.every((id) => (recordSteps?.get(id)?.stepNumber ?? 0) >= maxStep);
    const chk = fsChecks[person.id];
    const snoozeDays = chk?.snoozedOn ? daysSince(chk.snoozedOn, now) : null;
    const snoozed = snoozeDays !== null && snoozeDays < REQUEST_CHASE_DAYS;
    const done = !!chk?.checkedOn && (chk.openItems ?? 1) === 0;
    if (allDone && !done && !snoozed) {
      return {
        task: {
          ...base,
          type: 'fs_person_check',
          note: chk?.checkedOn
            ? `Last check ${chk.checkedOn}: ${chk.openItems} item(s) still to do on FamilySearch.`
            : `Update ${person.name}'s page on FamilySearch from the verified records.`,
        },
        waiting: false,
      };
    }
  }

  // 2. Missing events — no document is known to exist anywhere.
  const missingEvents = lifeEvents.filter((ev) => ev.status === 'missing');
  if (missingEvents.length > 0) {
    const ev = missingEvents[0];
    return {
      task: {
        ...base,
        type: 'missing_event',
        eventType: ev.type,
        note: `No record found for ${ev.type}. Search for sources.`,
      },
      waiting: false,
    };
  }

  // 3. Known but no record: classify each.
  let received: { ev: LifeEvent; o: EventOverride } | null = null;
  let chase: { ev: LifeEvent; o: EventOverride; days: number; office: string | null } | null = null;
  let fresh: { ev: LifeEvent; office: string | null } | null = null;
  let anyWaiting = false;

  for (const ev of lifeEvents) {
    if (ev.status !== 'known_no_record') continue;
    if (ev.recordId) continue;
    const o = ov[eventKey(person.id, ev.type)];
    if (o?.recordId) continue;

    if (o?.receivedOn) {
      if (!received) received = { ev, o };
      continue;
    }

    if (o?.requestedOn) {
      const days = daysSince(o.requestedOn, now);
      if (days === null || days < REQUEST_CHASE_DAYS) {
        anyWaiting = true;
        continue;
      }
      if (!chase) {
        chase = { ev, o, days, office: o.requestedFrom || extractOffice(ev.note) };
      }
      continue;
    }

    if (!fresh) fresh = { ev, office: extractOffice(ev.note) };
  }

  if (received) {
    const label = EVENT_LABELS[received.ev.type];
    return {
      task: {
        ...base,
        type: 'process_inbox',
        eventType: received.ev.type,
        note: `${label} received — save it to _inbox and run "process inbox".`,
        whereItIs: received.ev.note?.trim() ?? '',
        receivedOn: received.o.receivedOn,
      },
      waiting: false,
    };
  }

  if (chase) {
    const label = EVENT_LABELS[chase.ev.type];
    return {
      task: {
        ...base,
        type: 'chase_request',
        eventType: chase.ev.type,
        note: `Chase ${chase.office ?? `the ${label} record`}? Requested ${chase.o.requestedOn} — ${chase.days} days and no reply.`,
        whereItIs: chase.ev.note?.trim() ?? '',
        office: chase.office ?? undefined,
        requestedOn: chase.o.requestedOn,
        daysWaiting: chase.days,
      },
      waiting: false,
    };
  }

  if (fresh) {
    const label = EVENT_LABELS[fresh.ev.type];
    return {
      task: {
        ...base,
        type: 'get_document',
        eventType: fresh.ev.type,
        note: `Get the document: ${label}${fresh.office ? ` — request it from ${fresh.office}` : ''}.`,
        whereItIs: fresh.ev.note?.trim() ?? '',
        office: fresh.office ?? undefined,
      },
      waiting: false,
    };
  }

  if (anyWaiting) {
    return { task: null, waiting: true };
  }

  // 4. Unsorted files — last resort, only if nothing else.
  // (No per-person unsorted detection here; leave as no-op for queue.)
  return { task: null, waiting: false };
}

export function getNextTask(
  people: Person[],
  recordSteps?: Map<string, RecordStepInfo>,
  overrides?: EventOverrides,
  now: Date = new Date(),
  fsChecks: FsChecks = {},
  personSkips: PersonSkips = {}
): NextTask | null {
  const rs = recordSteps ?? new Map();
  const ov = overrides ?? {};
  const ctx = buildGraph(people);

  const ordered = queueOrder(people, personSkips);

  // First pass: actionable work.
  for (const person of ordered) {
    const res = tryPerson(person, rs, ov, now, fsChecks, ctx);
    if (res.task) return res.task;
  }

  // Second pass: if everyone is waiting, return the first waiting person's chase? 
  // Waiting people have no actionable task now; return null (nothing to do).
  // But to surface a waiting chase when due? Already handled: chase due returns actionable.
  return null;
}

export function getProgress(people: Person[], personId: string, recordSteps?: Map<string, RecordStepInfo>): string {
  const person = people.find((p) => p.id === personId);
  if (!person || !person.lifeEvents) return '0 of 0';

  const total = person.lifeEvents.length;
  const completed = person.lifeEvents.filter((ev) => {
    if (ev.status !== 'linked' || !ev.recordId) return false;
    const stepInfo = recordSteps?.get(ev.recordId);
    const maxStep = person.isLiving ? 4 : 5;
    return (stepInfo?.stepNumber ?? 0) >= maxStep;
  }).length;

  return `${completed} of ${total}`;
}