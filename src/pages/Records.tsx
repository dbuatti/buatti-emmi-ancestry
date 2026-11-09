import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, Filter, SortAsc, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAllRecords } from '@/lib/record-loader';
import type { RecordEntry } from '@/lib/record-loader';
import { stepLabel, type WorkflowStep } from '@/types/record';

const STEP_COLORS: Record<string, string> = {
  filed: 'bg-stone-100 text-stone-600',
  transcribed: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  in_app: 'bg-blue-100 text-blue-700',
  on_familysearch: 'bg-purple-100 text-purple-700',
};

function extractDate(r: RecordEntry): string {
  const fm = r.frontMatter;
  if (fm.date && fm.date.trim() && fm.date !== '""' && fm.date !== "''") return fm.date;
  if (fm.year) return fm.year;
  // Try to extract year from record ID (e.g., 1870_Linguaglossa_...)
  const m = r.id.match(/^(\d{4})/);
  if (m) return m[1];
  return 'undated';
}

function extractPeople(r: RecordEntry): string[] {
  const fm = r.frontMatter;
  if (Array.isArray(fm.people) && fm.people.length > 0) return fm.people;
  // Try to extract from ID (e.g., 1870_Linguaglossa_birth_Emmi-Egidio_atto31 → Egidio Emmi)
  return [];
}

export default function Records() {
  const [records, setRecords] = useState<RecordEntry[] | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [personFilter, setPersonFilter] = useState<string>('all');
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  useEffect(() => {
    let alive = true;
    getAllRecords().then((rs) => { if (alive) setRecords(rs); });
    return () => { alive = false; };
  }, []);

  const types = useMemo(() => {
    if (!records) return [];
    const set = new Set(records.map((r) => r.frontMatter.type || 'Unknown'));
    return [...set].sort();
  }, [records]);

  const people = useMemo(() => {
    if (!records) return [];
    const set = new Set<string>();
    for (const r of records) {
      for (const p of extractPeople(r)) set.add(p);
    }
    return [...set].sort();
  }, [records]);

  const filtered = useMemo(() => {
    if (!records) return [];
    const result = records.filter((r) => {
      const type = r.frontMatter.type || 'Unknown';
      const step = r.step;
      const recPeople = extractPeople(r);
      if (typeFilter !== 'all' && type !== typeFilter) return false;
      if (stepFilter !== 'all' && step !== stepFilter) return false;
      if (personFilter !== 'all' && !recPeople.includes(personFilter)) return false;
      return true;
    });

    // Sort
    if (sortBy === 'date') {
      result.sort((a, b) => {
        const da = extractDate(a);
        const db = extractDate(b);
        return da.localeCompare(db);
      });
    } else if (sortBy === 'type') {
      result.sort((a, b) => (a.frontMatter.type || '').localeCompare(b.frontMatter.type || ''));
    } else if (sortBy === 'step') {
      result.sort((a, b) => a.stepNumber - b.stepNumber);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.id.localeCompare(b.id));
    }

    return result;
  }, [records, typeFilter, personFilter, stepFilter, sortBy]);

  // Group by type
  const grouped = useMemo(() => {
    const groups: Record<string, RecordEntry[]> = {};
    for (const r of filtered) {
      const type = r.frontMatter.type || 'Unknown';
      if (!groups[type]) groups[type] = [];
      groups[type].push(r);
    }
    return groups;
  }, [filtered]);

  if (records === null) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
        <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <p className="text-sm text-stone-500 font-sans">Loading records…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#800020]" />
            Records
          </h1>
          <p className="text-stone-600 font-sans max-w-3xl">
            Every transcription record filed in the research workspace. Filter by type, person, or workflow step.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select
            className="rounded border border-stone-300 bg-white px-3 py-2 text-sm font-sans"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            className="rounded border border-stone-300 bg-white px-3 py-2 text-sm font-sans"
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
          >
            <option value="all">All people</option>
            {people.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            className="rounded border border-stone-300 bg-white px-3 py-2 text-sm font-sans"
            value={stepFilter}
            onChange={(e) => setStepFilter(e.target.value)}
          >
            <option value="all">All steps</option>
            <option value="filed">Filed</option>
            <option value="transcribed">Transcribed</option>
            <option value="verified">Verified</option>
            <option value="in_app">In app</option>
            <option value="on_familysearch">On FamilySearch</option>
          </select>
          <select
            className="rounded border border-stone-300 bg-white px-3 py-2 text-sm font-sans"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort: Date</option>
            <option value="type">Sort: Type</option>
            <option value="step">Sort: Step</option>
            <option value="name">Sort: Name</option>
          </select>
          <span className="text-xs text-stone-500 font-sans">
            {filtered.length} of {records.length} records
          </span>
        </div>

        {/* Grouped by type */}
        {Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-stone-500 font-sans">No records match your filters.</p>
        ) : (
          Object.entries(grouped).map(([type, recs]) => (
            <div key={type} className="mb-8">
              <h2 className="text-lg font-bold text-stone-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#800020]" />
                {type} ({recs.length})
              </h2>
              <div className="space-y-2">
                {recs.map((r) => {
                  const date = extractDate(r);
                  const recPeople = extractPeople(r);
                  const fm = r.frontMatter;
                  const isVerified = fm.verified === true;
                  const isInApp = fm.in_app === true;
                  const isOnFs = fm.on_familysearch === true;
                  return (
                    <Link key={r.id} to={`/research/records/${r.id}`} className="block">
                      <Card className="border-stone-200 hover:border-[#800020] transition-colors">
                        <CardContent className="p-3 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-stone-800 text-sm truncate">{r.id}</div>
                            <div className="text-xs text-stone-500 font-sans mt-0.5">
                              {date}
                              {fm.place ? ` · ${fm.place}` : ''}
                              {fm.comune && fm.comune !== fm.place ? ` · ${fm.comune}` : ''}
                              {fm.atto ? ` · atto ${fm.atto}` : ''}
                              {recPeople.length > 0 ? ` · ${recPeople.join(', ')}` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isOnFs && (
                              <Badge className="text-[9px] bg-purple-100 text-purple-800">FS</Badge>
                            )}
                            {isInApp && (
                              <Badge className="text-[9px] bg-blue-100 text-blue-800">In app</Badge>
                            )}
                            <Badge className={`text-[9px] ${STEP_COLORS[r.step] || 'bg-stone-100 text-stone-600'}`}>
                              {stepLabel(r.step as WorkflowStep)}
                            </Badge>
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
