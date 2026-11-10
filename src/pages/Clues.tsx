import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, AlertTriangle, FileSearch, UserRoundSearch, Baby, Search, Copy, EyeOff, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { initialPeople } from '@/data/familyDataWrapper';
import { getAllRecords } from '@/lib/record-loader';
import { buildClueReport, type Clue, type ClueReport, type FiledAct, type TextSource } from '@/lib/clues';

type TabKey = keyof ClueReport;

const TABS: { key: TabKey; label: string; icon: typeof Lightbulb; blurb: string; empty: string }[] = [
  {
    key: 'checks', label: 'To fix', icon: AlertTriangle,
    blurb: 'Places where the tree contradicts itself. Each one is either a typo or a sign that two people of the same name have been mixed up.',
    empty: 'No contradictions in the tree.',
  },
  {
    key: 'cited', label: 'Known acts, not filed', icon: FileSearch,
    blurb: 'Acts your notes and transcriptions mention by number and year, but that were never filed as a record. Each is a document known to exist.',
    empty: 'Every act mentioned by number is on file.',
  },
  {
    key: 'walls', label: 'Unknown parents', icon: UserRoundSearch,
    blurb: 'Direct ancestors with a parent missing, nearest generation first — and which document would normally name them.',
    empty: 'Every direct ancestor has both parents linked.',
  },
  {
    key: 'gaps', label: 'Sibling gaps', icon: Baby,
    blurb: 'Couples with six or more years between known children. A gap that long usually hides a child who died young or was never looked for.',
    empty: 'No long gaps between known siblings.',
  },
];

const SEVERITY: Record<Clue['severity'], { dot: string; label: string }> = {
  error: { dot: 'bg-red-500', label: 'Impossible as recorded' },
  warning: { dot: 'bg-amber-500', label: 'Needs a look' },
  info: { dot: 'bg-sky-500', label: 'Lead' },
};

const HIDDEN_KEY = 'clues.hidden.v1';

function loadHidden(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default function Clues() {
  const [tab, setTab] = useState<TabKey>('checks');
  const [query, setQuery] = useState('');
  const [hidden, setHidden] = useState<string[]>(loadHidden);
  const [showHidden, setShowHidden] = useState(false);
  const [recordData, setRecordData] = useState<{ filed: FiledAct[]; sources: TextSource[] } | null>(null);

  useEffect(() => {
    let live = true;
    getAllRecords().then((recs) => {
      if (!live) return;
      setRecordData({
        filed: recs.map((r) => ({
          id: r.id, atto: r.frontMatter.atto, year: r.frontMatter.year, type: r.frontMatter.type,
          comune: r.frontMatter.comune, people: r.frontMatter.people,
        })),
        sources: recs.map((r) => ({ recordId: r.id, label: `the record ${r.id}`, text: r.body })),
      });
    });
    return () => { live = false; };
  }, []);

  const report = useMemo(
    () => recordData ? buildClueReport(initialPeople, 'daniele-buatti', recordData.filed, recordData.sources) : null,
    [recordData],
  );

  const nameOf = useMemo(() => {
    const m = new Map(initialPeople.map((p) => [p.id, p.name]));
    return (id: string) => m.get(id) ?? id;
  }, []);

  const persistHidden = (next: string[]) => {
    setHidden(next);
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(next)); } catch { /* private mode: keep in memory only */ }
  };

  const visible = (list: Clue[]) => list.filter((c) => showHidden || !hidden.includes(c.key));
  const q = query.trim().toLowerCase();
  const current = report
    ? visible(report[tab]).filter((c) =>
        !q || `${c.title} ${c.detail} ${c.snippet ?? ''} ${c.personIds.map(nameOf).join(' ')}`.toLowerCase().includes(q))
    : [];
  const meta = TABS.find((t) => t.key === tab)!;
  const hiddenHere = report ? report[tab].filter((c) => hidden.includes(c.key)).length : 0;

  const copyList = async () => {
    const text = current.map((c) => `• ${c.title}${c.personIds.length ? ` (${c.personIds.map(nameOf).join(', ')})` : ''}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${current.length} item${current.length === 1 ? '' : 's'} copied`);
    } catch {
      toast.error('Could not copy — select the text manually.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-3">
            <Lightbulb className="w-7 h-7 text-[#800020]" /> Clues
          </h1>
          <p className="text-stone-600 font-sans max-w-3xl">
            What the tree and the filed records already imply but nobody has acted on yet. Worked out from your own
            data each time the page opens — nothing here is changed for you, and nothing is sent anywhere.
          </p>
        </div>

        <div role="tablist" aria-label="Clue types" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {TABS.map((t) => {
            const count = report ? visible(report[t.key]).length : null;
            const active = t.key === tab;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={`text-left rounded-lg border p-3 transition-colors font-sans ${
                  active ? 'border-[#800020] bg-white shadow-sm' : 'border-stone-200 bg-white/60 hover:border-stone-400'
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs text-stone-600">
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#800020]' : ''}`} /> {t.label}
                </span>
                <span className={`block text-2xl font-bold font-serif mt-1 ${active ? 'text-[#800020]' : 'text-stone-800'}`}>
                  {count ?? '–'}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-sm text-stone-600 font-sans mb-4 max-w-3xl">{meta.blurb}</p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, place, year…"
              aria-label="Filter clues"
              className="pl-9 bg-white font-sans"
            />
          </div>
          <Button variant="outline" size="sm" className="font-sans" onClick={copyList} disabled={current.length === 0}>
            <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy list
          </Button>
          {hiddenHere > 0 && (
            <Button variant="ghost" size="sm" className="font-sans text-stone-600" onClick={() => setShowHidden((v) => !v)}>
              {showHidden ? 'Hide' : 'Show'} {hiddenHere} dismissed
            </Button>
          )}
        </div>

        {!report && <p className="text-sm text-stone-500 font-sans">Reading records…</p>}
        {report && current.length === 0 && (
          <div className="rounded-lg border border-dashed border-stone-300 bg-white/60 p-8 text-center text-stone-500 font-sans">
            {q ? 'Nothing matches that filter.' : meta.empty}
          </div>
        )}

        <ul className="space-y-3">
          {current.map((c) => {
            const isHidden = hidden.includes(c.key);
            return (
              <li key={c.key} className={`rounded-lg border border-stone-200 bg-white p-4 ${isHidden ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-2 w-2.5 h-2.5 rounded-full shrink-0 ${SEVERITY[c.severity].dot}`}
                    title={SEVERITY[c.severity].label}
                    aria-label={SEVERITY[c.severity].label}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-stone-900 leading-snug">{c.title}</h2>
                    <p className="text-sm text-stone-600 font-sans mt-1">{c.detail}</p>
                    {c.snippet && (
                      <blockquote className="mt-2 border-l-2 border-stone-300 pl-3 text-xs text-stone-500 font-sans italic break-words">
                        …{c.snippet}…
                      </blockquote>
                    )}
                    <p className="text-sm text-stone-800 font-sans mt-2">
                      <span className="font-semibold text-[#800020]">Next: </span>{c.action}
                    </p>
                    {c.personIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {c.personIds.map((id) => (
                          <Link
                            key={id}
                            to={`/research/people/${id}`}
                            className="text-xs font-sans rounded-full border border-stone-300 px-2.5 py-0.5 text-stone-700 hover:border-[#800020] hover:text-[#800020]"
                          >
                            {nameOf(id)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-stone-400 hover:text-stone-700 font-sans text-xs"
                    title={isHidden ? 'Bring back' : 'Dismiss — checked, nothing to do'}
                    onClick={() => persistHidden(isHidden ? hidden.filter((k) => k !== c.key) : [...hidden, c.key])}
                  >
                    {isHidden ? <RotateCcw className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span className="sr-only">{isHidden ? 'Bring back' : 'Dismiss'}</span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-stone-400 font-sans mt-8 max-w-3xl">
          How dates are read: “c. 1850” counts as 1848–1852, “before 1889” as an upper limit only, and anything without
          a year is left alone. A contradiction is only shown when it holds under every possible reading. Dismissed
          clues are remembered in this browser only.
        </p>
      </main>
    </div>
  );
}
