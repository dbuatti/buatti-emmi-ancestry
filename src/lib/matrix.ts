/**
 * Records matrix core: canonical record-type columns + per-cell state.
 *
 * The data has 35 distinct type strings; the matrix normalises them into
 * 10 columns. A cell's state distinguishes a *verified document in the app*
 * from a mere "Found" claim in familyData — that gap (81 of 93 Found cells
 * with no document, measured 10/11/2026) is the point of the page.
 *
 * Pure functions (no React) — unit-checked with node.
 */

export const MATRIX_COLUMNS = [
  'Birth',
  'Baptism',
  'Marriage',
  'Death',
  'Burial',
  'Population',
  'Migration',
  'Military',
  'Education',
  'Other',
] as const;

export type MatrixColumn =
  | 'Birth'
  | 'Baptism'
  | 'Marriage'
  | 'Death'
  | 'Burial'
  | 'Population'
  | 'Migration'
  | 'Military'
  | 'Education'
  | 'Other';

export type MatrixCellState =
  | 'verified-doc' // document filed AND verified
  | 'filed-doc' // document filed, not yet verified
  | 'claimed' // familyData says Found, no document in the app
  | 'requested' // requested, waiting
  | 'searching' // actively searching
  | 'notfound' // Not Found / Ruled Out
  | 'none'; // no entry at all

export interface MatrixCell {
  state: MatrixCellState;
  /** Record file id when a document backs the cell. */
  recordId?: string;
  /** Hover text: record notes or entry notes. */
  note?: string;
}

/** Normalise a familyData record type (or record id slug when type is empty). */
export function canonicalType(rawType: string, recordId = ''): MatrixColumn {
  const t = (rawType || '').toLowerCase();
  if (/bapt/.test(t)) return 'Baptism';
  if (/marri|matrim|banns|allegati/.test(t)) return 'Marriage';
  if (/death|morte|wwi/.test(t)) return 'Death';
  if (/burial|cimit|sepolt/.test(t)) return 'Burial';
  if (/birth|nascita/.test(t)) return 'Birth';
  if (/population|popolaz/.test(t)) return 'Population';
  if (/passenger|immigration|alien|naturalis|arrival|voyage/.test(t)) return 'Migration';
  if (/military|matricol|pow|prison|war/.test(t)) return 'Military';
  if (/school|student|university|diploma|degree|perugia|ulpiani/.test(t)) return 'Education';
  // Fall back to the record id slug for untyped files.
  const id = recordId.toLowerCase();
  if (/marri|matrim|banns/.test(id)) return 'Marriage';
  if (/birth|nascita/.test(id)) return 'Birth';
  if (/death|mort/.test(id)) return 'Death';
  if (/school|diploma|student|univers|perugia|ulpiani/.test(id)) return 'Education';
  if (/passenger|toscana|neptunia|migrat|natura/.test(id)) return 'Migration';
  return 'Other';
}

interface PersonLike {
  id: string;
  records?: { type: string; status: string; notes?: string }[];
}

interface FiledDoc {
  id: string;
  type: string;
  people: string[];
  verified: boolean;
}

const STATE_RANK: Record<MatrixCellState, number> = {
  'verified-doc': 6,
  'filed-doc': 5,
  claimed: 4,
  requested: 3,
  searching: 2,
  notfound: 1,
  none: 0,
};

function entryState(status: string): MatrixCellState {
  if (status === 'Found') return 'claimed';
  if (status === 'Requested') return 'requested';
  if (status === 'Searching') return 'searching';
  return 'notfound'; // Not Found, Ruled Out, anything else
}

/**
 * One person's row: best state per column.
 * Filed documents outrank claims; claims outrank in-flight statuses.
 */
export function buildRow(
  person: PersonLike,
  filedDocs: FiledDoc[]
): Record<MatrixColumn, MatrixCell> {
  const cells = {} as Record<MatrixColumn, MatrixCell>;
  for (const c of MATRIX_COLUMNS) cells[c] = { state: 'none' };

  const put = (col: MatrixColumn, cell: MatrixCell) => {
    if (STATE_RANK[cell.state] > STATE_RANK[cells[col].state]) cells[col] = cell;
  };

  for (const doc of filedDocs) {
    if (!doc.people.includes(person.id)) continue;
    const col = canonicalType(doc.type, doc.id);
    put(col, {
      state: doc.verified ? 'verified-doc' : 'filed-doc',
      recordId: doc.id,
      note: doc.id,
    });
  }

  for (const r of person.records ?? []) {
    const col = canonicalType(r.type);
    const st = entryState(r.status);
    if (st === 'none') continue;
    const cur = cells[col];
    // Never downgrade a documented cell with a mere claim.
    if (cur.state === 'verified-doc' || cur.state === 'filed-doc') continue;
    put(col, { state: st, note: r.notes });
  }
  return cells;
}

/** Documented columns (verified or filed) out of 10. */
export function documentedCount(row: Record<MatrixColumn, MatrixCell>): number {
  return MATRIX_COLUMNS.filter(
    (c) => row[c].state === 'verified-doc' || row[c].state === 'filed-doc'
  ).length;
}

export interface GapItem {
  personId: string;
  status: 'Requested' | 'Searching';
  col: MatrixColumn;
  note?: string;
}

/** Actionable queue: every Requested/Searching entry, requested first. */
export function gapsList(
  people: PersonLike[]
): (GapItem & { personName?: string })[] {
  const out: (GapItem & { personName?: string })[] = [];
  for (const p of people) {
    const name = (p as { name?: string }).name;
    for (const r of p.records ?? []) {
      if (r.status !== 'Requested' && r.status !== 'Searching') continue;
      out.push({
        personId: p.id,
        personName: name,
        status: r.status,
        col: canonicalType(r.type),
        note: r.notes,
      });
    }
  }
  return out.sort((a, b) =>
    a.status === b.status
      ? (a.personName ?? '').localeCompare(b.personName ?? '')
      : a.status === 'Requested'
        ? -1
        : 1
  );
}
