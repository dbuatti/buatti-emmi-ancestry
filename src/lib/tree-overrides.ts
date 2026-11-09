/**
 * Sidecar persistence for data the user adds/edits in the UI (Add Ancestor,
 * delete person, Add Lead, status updates, Add Question).
 *
 * familyData.ts stays the untouched source of truth: this sidecar stores only
 * *operations* (added entities, deleted ids, status overrides) which are merged
 * over the initial data at load — exactly like person-meta.json. The file is
 * written by POST /api/tree-overrides (local mode only); in the deployed build
 * the save call fails silently and behaviour degrades to the old in-memory UI.
 */
import type { Person, ResearchLead, OpenQuestion } from '@/types';
import overridesJson from '../../.local/tree-overrides.json';

export interface TreeOverrides {
  addedPeople: Person[];
  deletedPersonIds: string[];
  addedLeads: ResearchLead[];
  leadStatus: Record<string, string>;
  addedQuestions: OpenQuestion[];
  questionStatus: Record<string, string>;
}

export const treeOverrides = overridesJson as TreeOverrides;

/** People = base (familyData.ts) minus deleted ids, plus UI-added people appended (current behaviour). */
export function withPeopleOverrides(base: Person[]): Person[] {
  // An add with an id that already exists in familyData.ts counts as a
  // *revival* only (it re-shows the original person after a delete) — the UI
  // stub must never shadow the full genealogical record. Replace semantics
  // apply solely among UI-added entries (e.g. re-saving a new person).
  const allAdded = treeOverrides.addedPeople ?? [];
  const baseIds = new Set(base.map(p => p.id));
  const added = allAdded.filter(p => !baseIds.has(p.id));
  const addedIds = new Set(added.map(p => p.id));
  const deleted = new Set(
    (treeOverrides.deletedPersonIds ?? []).filter(id => !addedIds.has(id))
  );
  return [...base.filter(p => !deleted.has(p.id)), ...added];
}

/** Leads = UI-added leads first (they were prepended in the old UI), then base; status overrides applied last. */
export function withLeadOverrides(base: ResearchLead[]): ResearchLead[] {
  const added = treeOverrides.addedLeads ?? [];
  const status = treeOverrides.leadStatus ?? {};
  return [...added, ...base].map(l =>
    l.id in status ? { ...l, status: status[l.id] as ResearchLead['status'] } : l
  );
}

/** Questions = UI-added questions first (they were prepended in the old UI), then base; status overrides applied last. */
export function withQuestionOverrides(base: OpenQuestion[]): OpenQuestion[] {
  const added = treeOverrides.addedQuestions ?? [];
  const status = treeOverrides.questionStatus ?? {};
  return [...added, ...base].map(q =>
    q.id in status ? { ...q, status: status[q.id] as OpenQuestion['status'] } : q
  );
}

export type TreeOverrideOp =
  | { op: 'addPerson'; person: Person }
  | { op: 'deletePerson'; personId: string }
  | { op: 'addLead'; lead: ResearchLead }
  | { op: 'setLeadStatus'; leadId: string; status: ResearchLead['status'] }
  | { op: 'addQuestion'; question: OpenQuestion }
  | { op: 'setQuestionStatus'; questionId: string; status: OpenQuestion['status'] }
  | { op: 'reset' };

/** Fire-and-forget by design (see module doc): failures surface via the callback, never block the UI. */
export function saveTreeOverride(body: TreeOverrideOp, onError?: (message: string) => void): void {
  fetch('/api/tree-overrides', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(res => {
      // Only treat JSON responses as successful
      if (!res.ok) {
        onError?.(`Save failed: HTTP ${res.status}`);
        return;
      }
      
      if (!res.headers.get('content-type')?.includes('application/json')) {
        onError?.('Save endpoint returned unexpected content type');
        return;
      }
      
      return res.json();
    })
    .then(data => {
      if (data?.ok !== true) {
        onError?.('Save failed: invalid response format');
        return;
      }
      // Success - confirmed
      onError?.('Save successful');
    })
    .catch(err => {
      onError?.(err instanceof Error ? err.message : 'Could not save to the local sidecar — the change will be lost on refresh.');
    });
}
