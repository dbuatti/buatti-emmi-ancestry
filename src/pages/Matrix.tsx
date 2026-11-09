import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table2, Search } from 'lucide-react';
import { initialPeople } from '@/data/familyDataWrapper';
import { getAllRecords } from '@/lib/record-loader';
import {
  MATRIX_COLUMNS,
  buildRow,
  documentedCount,
  gapsList,
  type MatrixCell,
  type MatrixColumn,
} from '@/lib/matrix';

function CellGlyph({ cell }: { cell: MatrixCell }) {
  const base =
    'inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold font-sans';
  switch (cell.state) {
    case 'verified-doc':
      return (
        <span className={`${base} bg-emerald-500 text-white`} title={cell.note ?? cell.recordId}>
          ✓
        </span>
      );
    case 'filed-doc':
      return (
        <span className={`${base} bg-amber-400 text-white`} title={cell.note ?? cell.recordId}>
          ●
        </span>
      );
    case 'claimed':
      return (
        <span
          className={`${base} bg-blue-100 text-blue-700 border border-blue-300`}
          title={`Claimed found, no document filed. ${cell.note ?? ''}`}
        >
          ◆
        </span>
      );
    case 'requested':
      return (
        <span
          className={`${base} bg-purple-100 text-purple-700 border border-purple-300`}
          title={`Requested. ${cell.note ?? ''}`}
        >
          …
        </span>
      );
    case 'searching':
      return (
        <span
          className={`${base} bg-orange-50 text-orange-500 border border-dashed border-orange-400`}
          title={`Searching. ${cell.note ?? ''}`}
        >
          ~
        </span>
      );
    case 'notfound':
      return (
        <span className={`${base} text-red-300`} title={cell.note ?? 'Not found'}>
          ✕
        </span>
      );
    default:
      return <span className={`${base} text-stone-200`}>—</span>;
  }
}

const SHORT_COL: Record<MatrixColumn, string> = {
  Birth: 'Birth',
  Baptism: 'Bapt',
  Marriage: 'Marr',
  Death: 'Death',
  Burial: 'Burial',
  Population: 'Pop',
  Migration: 'Migr',
  Military: 'Mil',
  Education: 'Edu',
  Other: 'Other',
};

export default function Matrix() {
  const [docs, setDocs] = useState<
    { id: string; type: string; people: string[]; verified: boolean }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lineFilter, setLineFilter] = useState('all');
  const [genFilter, setGenFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'cov-desc' | 'cov-asc'>('cov-asc');
  const [gapsOnly, setGapsOnly] = useState(true);
  const [showAllGaps, setShowAllGaps] = useState(false);

  useEffect(() => {
    getAllRecords()
      .then((all) =>
        setDocs(
          all.map((r) => ({
            id: r.id,
            type: String(r.frontMatter.type || ''),
            people: ((r.frontMatter.people ?? []) as string[]),
            verified: r.frontMatter.verified === true,
          }))
        )
      )
      .catch(() => {});
  }, []);

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const out: {
      id: string;
      name: string;
      line: string;
      generation: number;
      cells: Record<MatrixColumn, MatrixCell>;
      documented: number;
      hasGap: boolean;
    }[] = [];
    for (const p of initialPeople) {
      if (lineFilter !== 'all' && p.line !== lineFilter) continue;
      if (genFilter !== 'all' && p.generation !== Number(genFilter)) continue;
      if (q && !p.name.toLowerCase().includes(q)) continue;
      const cells = buildRow(p, docs);
      const hasGap = MATRIX_COLUMNS.some((c) =>
        ['claimed', 'requested', 'searching'].includes(cells[c].state)
      );
      if (gapsOnly && !hasGap) continue;
      out.push({
        id: p.id,
        name: p.name,
        line: p.line,
        generation: p.generation,
        cells,
        documented: documentedCount(cells),
        hasGap,
      });
    }
    if (sortBy === 'name') out.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'cov-desc') out.sort((a, b) => b.documented - a.documented || a.name.localeCompare(b.name));
    else out.sort((a, b) => a.documented - b.documented || a.name.localeCompare(b.name));
    return out;
  }, [docs, searchQuery, lineFilter, genFilter, sortBy, gapsOnly]);

  const stats = useMemo(() => {
    let verified = 0,
      filed = 0,
      claimed = 0;
    const perCol = new Map<MatrixColumn, { docs: number; claimed: number; open: number }>();
    for (const c of MATRIX_COLUMNS) perCol.set(c, { docs: 0, claimed: 0, open: 0 });
    for (const p of initialPeople) {
      const cells = buildRow(p, docs);
      for (const c of MATRIX_COLUMNS) {
        const st = cells[c].state;
        const agg = perCol.get(c)!;
        if (st === 'verified-doc') {
          verified++;
          agg.docs++;
        } else if (st === 'filed-doc') {
          filed++;
          agg.docs++;
        } else if (st === 'claimed') {
          claimed++;
          agg.claimed++;
        } else if (st === 'requested' || st === 'searching') {
          agg.open++;
        }
      }
    }
    return { verified, filed, claimed, perCol };
  }, [docs]);

  const gaps = useMemo(() => gapsList(initialPeople), []);
  const shownGaps = showAllGaps ? gaps : gaps.slice(0, 30);

  const generations = useMemo(
    () => [...new Set(initialPeople.map((p) => p.generation))].sort((a, b) => a - b),
    []
  );

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-3">
            <Table2 className="w-8 h-8 text-[#800020]" />
            Records matrix
          </h1>
          <p className="text-stone-600 font-sans max-w-3xl">
            Every person × every record type. A tick means a{' '}
            <span className="font-semibold text-emerald-700">verified document in the app</span> — not
            just a claim in the notes.{' '}
            <span className="font-semibold text-blue-700">{stats.claimed} cells</span> say Found
            with no document behind them yet.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 text-xs font-sans text-stone-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white px-2.5 py-1 font-bold">
            ✓ {stats.verified} verified docs
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-white px-2.5 py-1 font-bold">
            ● {stats.filed} filed, unverified
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 border border-blue-300 px-2.5 py-1 font-bold">
            ◆ {stats.claimed} claimed, no doc
          </span>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              className="pl-9 bg-white border-stone-300 min-h-[40px]"
              placeholder="Search name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500 font-sans">
            Line
            <select
              className="rounded border border-stone-300 bg-white px-3 py-2 text-sm font-sans font-normal min-h-[40px]"
              value={lineFilter}
              onChange={(e) => setLineFilter(e.target.value)}
            >
              <option value="all">All lines</option>
              <option value="Buatti">Buatti</option>
              <option value="Chiappini">Chiappini</option>
              <option value="Emmi">Emmi</option>
              <option value="Patanè">Patanè</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500 font-sans">
            Generation
            <select
              className="rounded border border-stone-300 bg-white px-3 py-2 text-sm font-sans font-normal min-h-[40px]"
              value={genFilter}
              onChange={(e) => setGenFilter(e.target.value)}
            >
              <option value="all">All generations</option>
              {generations.map((g) => (
                <option key={g} value={g}>
                  Gen {g}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500 font-sans">
            Sort
            <select
              className="rounded border border-stone-300 bg-white px-3 py-2 text-sm font-sans font-normal min-h-[40px]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="cov-asc">Least documented</option>
              <option value="cov-desc">Most documented</option>
              <option value="name">Name</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-sans text-stone-700 min-h-[40px] cursor-pointer">
            <input
              type="checkbox"
              checked={gapsOnly}
              onChange={(e) => setGapsOnly(e.target.checked)}
              className="w-4 h-4"
            />
            Gaps only
          </label>
          <span className="text-xs text-stone-500 font-sans pb-2">
            {rows.length} of {initialPeople.length} people
          </span>
        </div>

        {/* Grid */}
        <Card className="border-stone-200 mb-8">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs font-sans border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b-2 border-stone-300">
                  <th className="text-left py-2 pl-4 pr-3 text-stone-600 font-bold whitespace-nowrap sticky left-0 bg-white z-10">
                    Name
                  </th>
                  {MATRIX_COLUMNS.map((c) => (
                    <th
                      key={c}
                      className="text-center py-2 px-1 text-stone-500 font-medium text-[9px] uppercase tracking-wider"
                      title={c}
                    >
                      {SHORT_COL[c]}
                    </th>
                  ))}
                  <th
                    className="text-center py-2 px-2 text-stone-500 font-medium text-[9px] uppercase tracking-wider"
                    title="Columns with a filed document, out of 10"
                  >
                    Docs
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="py-1.5 pl-4 pr-3 whitespace-nowrap sticky left-0 bg-white z-10 max-w-[220px]">
                      <Link
                        to={`/research/people/${r.id}`}
                        className="font-medium text-stone-800 hover:text-[#800020] hover:underline block truncate"
                        title={`${r.name} — Gen ${r.generation} · ${r.line}`}
                      >
                        {r.name}
                      </Link>
                    </td>
                    {MATRIX_COLUMNS.map((c) => {
                      const cell = r.cells[c];
                      const inner = <CellGlyph cell={cell} />;
                      return (
                        <td key={c} className="text-center py-1.5 px-1">
                          {cell.recordId ? (
                            <Link to={`/research/records/${cell.recordId}`}>{inner}</Link>
                          ) : cell.state === 'claimed' ||
                            cell.state === 'requested' ||
                            cell.state === 'searching' ? (
                            <Link to={`/research/people/${r.id}`}>{inner}</Link>
                          ) : (
                            inner
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center py-1.5 px-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${(r.documented / MATRIX_COLUMNS.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-stone-500 tabular-nums">
                          {r.documented}/{MATRIX_COLUMNS.length}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={MATRIX_COLUMNS.length + 2} className="py-8 text-center text-sm text-stone-500 font-sans">
                      No people match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Gaps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-stone-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#800020]">
                Coverage by type
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {MATRIX_COLUMNS.map((c) => {
                const agg = stats.perCol.get(c)!;
                const total = agg.docs + agg.claimed + agg.open || 1;
                return (
                  <div key={c} className="flex items-center gap-2 text-xs font-sans">
                    <span className="w-20 shrink-0 text-stone-600">{c}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden flex bg-stone-100">
                      <div className="bg-emerald-500 h-full" style={{ width: `${(agg.docs / total) * 100}%` }} title={`${agg.docs} documented`} />
                      <div className="bg-blue-300 h-full" style={{ width: `${(agg.claimed / total) * 100}%` }} title={`${agg.claimed} claimed`} />
                      <div className="bg-purple-300 h-full" style={{ width: `${(agg.open / total) * 100}%` }} title={`${agg.open} requested/searching`} />
                    </div>
                    <span className="w-24 shrink-0 text-right text-[10px] text-stone-500 tabular-nums">
                      {agg.docs} doc · {agg.claimed} claim · {agg.open} open
                    </span>
                  </div>
                );
              })}
              <p className="text-[10px] text-stone-400 font-sans pt-1">
                Green = document in the app · blue = claimed without document · purple = requested/searching
              </p>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#800020]">
                Chase list ({gaps.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {shownGaps.length === 0 ? (
                <p className="text-xs text-stone-500 font-sans">Nothing requested or being searched.</p>
              ) : (
                <ul className="space-y-1.5 max-h-[320px] overflow-y-auto">
                  {shownGaps.map((g, i) => (
                    <li key={`${g.personId}-${g.col}-${i}`} className="flex items-start gap-2 text-xs font-sans">
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          g.status === 'Requested'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-orange-50 text-orange-600 border-orange-200'
                        }`}
                      >
                        {g.status}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/research/people/${g.personId}`}
                          className="font-semibold text-stone-800 hover:text-[#800020] hover:underline"
                        >
                          {g.personName ?? g.personId}
                        </Link>
                        <span className="text-stone-500"> · {g.col}</span>
                        {g.note && (
                          <div className="text-stone-500 truncate" title={g.note}>
                            {g.note.length > 110 ? g.note.slice(0, 110) + '…' : g.note}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {gaps.length > 30 && (
                <button
                  className="mt-2 text-xs font-sans text-[#800020] underline min-h-[36px]"
                  onClick={() => setShowAllGaps((v) => !v)}
                >
                  {showAllGaps ? 'Show fewer' : `Show all ${gaps.length}`}
                </button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
