import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Crosshair, Copy, ExternalLink, AlertTriangle, CalendarRange, MapPin, FileText, Mail } from 'lucide-react';
import { initialPeople } from '@/data/familyDataWrapper';
import { getAllRecords, type RecordEntry } from '@/lib/record-loader';
import { useEffect } from 'react';
import {
  gatherFacts,
  deriveWindows,
  rankPlaces,
  findSnippets,
  attoRefs,
  ageClue,
  triSurname,
  buildSearchPack,
  extractYears,
  type TriTarget,
} from '@/lib/triangulate';

const TARGETS: { key: TriTarget; label: string; hint: string }[] = [
  { key: 'birth', label: 'Birth', hint: 'birth act / estratto di nascita' },
  { key: 'marriage', label: 'Marriage', hint: 'marriage act / estratto di matrimonio' },
  { key: 'death', label: 'Death', hint: 'death act / estratto di morte' },
];

export default function Triangulate() {
  const [params] = useSearchParams();
  const [personId, setPersonId] = useState<string>(params.get('person') ?? 'irma-pirri');
  const [filter, setFilter] = useState('');
  const initialTarget = params.get('target');
  const [target, setTarget] = useState<TriTarget>(
    initialTarget === 'birth' || initialTarget === 'marriage' || initialTarget === 'death'
      ? initialTarget
      : 'death'
  );
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    getAllRecords().then(setRecords).catch(() => {});
  }, []);

  const matches = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return [];
    return initialPeople.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [filter]);

  const person = useMemo(
    () => initialPeople.find((p) => p.id === personId),
    [personId]
  );

  const tri = useMemo(() => {
    if (!person) return null;
    const facts = gatherFacts(person, initialPeople);
    const windows = deriveWindows(person, initialPeople);
    const places = rankPlaces(person, initialPeople);
    const recLikes = records.map((r) => ({
      id: r.id,
      type: String(r.frontMatter.type || 'Record'),
      body: r.body,
      people: ((r.frontMatter.people ?? []) as string[]),
    }));
    const snippets = findSnippets(recLikes, person.name, 12);
    // Age clues: record year from front matter, fallback to years in the line
    const clues: { min: number; max: number; explanation: string; recordId: string }[] = [];
    for (const sn of snippets) {
      const rec = records.find((r) => r.id === sn.recordId);
      const fm = rec?.frontMatter as { year?: string; date?: string } | undefined;
      const recYear = (fm?.year ? Number(fm.year) : undefined) ?? extractYears(fm?.date ?? '')[0];
      const clue = ageClue(sn.line, recYear);
      if (clue) {
        if (windows.birthMin === undefined || clue.max >= windows.birthMin) {
          clues.push({ ...clue, recordId: sn.recordId });
        }
      }
    }
    const refs = attoRefs([
      ...snippets.map((s) => s.line),
      ...(person.records ?? []).map((r) => r.notes || ''),
      ...(person.notes ?? []),
    ]);
    const pack = buildSearchPack(person, initialPeople, target, windows, places, refs);
    return { facts, windows, places, snippets, clues, refs, pack };
  }, [person, records, target]);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  // Conflict detection: same fact label, different values
  const conflicts = useMemo(() => {
    if (!tri) return new Set<string>();
    const byLabel = new Map<string, Set<string>>();
    for (const f of tri.facts) {
      if (!byLabel.has(f.label)) byLabel.set(f.label, new Set());
      byLabel.get(f.label)!.add(f.value);
    }
    return new Set([...byLabel.entries()].filter(([, v]) => v.size > 1).map(([k]) => k));
  }, [tri]);

  const timeline = useMemo(() => {
    if (!tri || !person) return null;
    const pts: { year: number; label: string; kind: 'birth' | 'death' | 'child' | 'self' }[] = [];
    const w = tri.windows;
    const push = (y: number | undefined, label: string, kind: 'birth' | 'death' | 'child' | 'self') => {
      if (y !== undefined) pts.push({ year: y, label, kind });
    };
    push(w.birthMin === w.birthMax ? w.birthMin : undefined, 'Birth', 'self');
    push(w.deathMin === w.deathMax ? w.deathMin : undefined, 'Death', 'self');
    for (const ch of person.children ?? []) {
      const c = initialPeople.find((p) => p.id === ch);
      const y = c?.birthDate ? extractYears(c.birthDate)[0] : undefined;
      push(y, `Child: ${c?.name ?? ch}`, 'child');
    }
    if (pts.length === 0) {
      if (w.birthMin !== undefined || w.deathMax !== undefined) {
        return { spanMin: w.birthMin ?? (w.deathMax ?? 1900) - 30, spanMax: w.deathMax ?? (w.birthMin ?? 1900) + 30, pts, range: w };
      }
      return null;
    }
    const years = pts.map((p) => p.year);
    if (w.birthMin !== undefined) years.push(w.birthMin);
    if (w.birthMax !== undefined) years.push(w.birthMax);
    if (w.deathMin !== undefined) years.push(w.deathMin);
    if (w.deathMax !== undefined) years.push(w.deathMax);
    const spanMin = Math.min(...years) - 3;
    const spanMax = Math.max(...years, new Date().getFullYear()) + 3;
    return { spanMin, spanMax, pts, range: w };
  }, [tri, person]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-3">
            <Crosshair className="w-8 h-8 text-[#800020]" />
            Triangulator
          </h1>
          <p className="text-stone-600 font-sans max-w-3xl">
            Everything the archive knows about one person, turned into search constraints:
            date windows, places, name evidence, and a ready-to-send request draft.
          </p>
        </div>

        {/* Controls */}
        <Card className="border-stone-200 mb-6">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 md:items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 font-sans block mb-1">
                Person
              </label>
              <div className="text-sm font-bold text-[#800020] mb-1">
                {person?.name ?? 'Select a person below'}
              </div>
              <Input
                className="bg-white border-stone-300 min-h-[40px]"
                placeholder="Type a name to switch person…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              {matches.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {matches.map((m) => (
                    <button
                      key={m.id}
                      className={`rounded-full border px-3 py-1.5 text-xs font-sans min-h-[36px] ${
                        m.id === personId
                          ? 'border-[#800020] bg-[#800020] text-white'
                          : 'border-stone-300 bg-white text-stone-700 hover:border-[#800020]'
                      }`}
                      onClick={() => {
                        setPersonId(m.id);
                        setFilter('');
                      }}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 font-sans block mb-1">
                Looking for
              </label>
              <div className="flex gap-2">
                {TARGETS.map((t) => (
                  <Button
                    key={t.key}
                    size="sm"
                    variant={target === t.key ? 'default' : 'outline'}
                    className={`min-h-[40px] px-4 ${target === t.key ? 'bg-[#800020] text-white hover:bg-[#600018]' : ''}`}
                    onClick={() => setTarget(t.key)}
                    title={t.hint}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {!person || !tri ? (
          <p className="text-sm text-stone-500 font-sans">Select a person to triangulate.</p>
        ) : (
          <div className="space-y-6">
            {/* 1. Facts */}
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#800020]">
                  What you know about {person.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="divide-y divide-stone-100">
                  {tri.facts.map((f, i) => (
                    <div key={i} className="py-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <div className="sm:w-40 shrink-0 text-[11px] font-bold uppercase tracking-wide text-stone-500 font-sans flex items-center gap-1">
                        {f.label}
                        {conflicts.has(f.label) && (
                          <span title="Sources disagree on this fact — both readings kept">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-sm text-stone-800 break-words">{f.value}</div>
                      <div className="sm:w-48 shrink-0 text-[11px] text-stone-400 font-sans">
                        {f.recordId ? (
                          <Link className="text-[#800020] underline" to={`/research/records/${f.recordId}`}>
                            {f.source}
                          </Link>
                        ) : f.personId ? (
                          <Link className="text-[#800020] underline" to={`/research/people/${f.personId}`}>
                            {f.source}
                          </Link>
                        ) : (
                          f.source
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 2. Timeline */}
            {timeline && (
              <Card className="border-stone-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#800020] flex items-center gap-2">
                    <CalendarRange className="w-4 h-4" /> Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="relative h-16 bg-white border border-stone-200 rounded-lg overflow-hidden">
                    {/* window bars */}
                    {timeline.range.birthMin !== undefined && (
                      <div
                        className="absolute top-3 h-3 rounded-full bg-emerald-200 border border-emerald-400"
                        style={{
                          left: `${((timeline.range.birthMin - timeline.spanMin) / (timeline.spanMax - timeline.spanMin)) * 100}%`,
                          width: `${Math.max(
                            (((timeline.range.birthMax ?? timeline.range.birthMin) - timeline.range.birthMin) /
                              (timeline.spanMax - timeline.spanMin)) *
                              100,
                            1.5
                          )}%`,
                        }}
                        title={`Birth window ${timeline.range.birthMin}–${timeline.range.birthMax ?? timeline.range.birthMin}`}
                      />
                    )}
                    {timeline.range.deathMin !== undefined && (
                      <div
                        className="absolute top-8 h-3 rounded-full bg-[#800020]/20 border border-[#800020]/50"
                        style={{
                          left: `${((timeline.range.deathMin - timeline.spanMin) / (timeline.spanMax - timeline.spanMin)) * 100}%`,
                          width: `${Math.max(
                            (((timeline.range.deathMax ?? timeline.range.deathMin) - timeline.range.deathMin) /
                              (timeline.spanMax - timeline.spanMin)) *
                              100,
                            1.5
                          )}%`,
                        }}
                        title={`Death window ${timeline.range.deathMin}–${timeline.range.deathMax ?? timeline.range.deathMin}`}
                      />
                    )}
                    {timeline.pts.map((p, i) => (
                      <div
                        key={i}
                        className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow ${
                          p.kind === 'child' ? 'bg-amber-500' : 'bg-[#800020]'
                        }`}
                        style={{
                          left: `calc(${((p.year - timeline.spanMin) / (timeline.spanMax - timeline.spanMin)) * 100}% - 5px)`,
                        }}
                        title={`${p.label} (${p.year})`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-400 font-sans mt-1">
                    <span>{timeline.spanMin}</span>
                    <span className="flex gap-3">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block" /> birth window
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#800020]/30 inline-block" /> death window
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> child born
                      </span>
                    </span>
                    <span>{timeline.spanMax}</span>
                  </div>
                  {tri.windows.explanations.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {tri.windows.explanations.map((e, i) => (
                        <li key={i} className="text-xs text-stone-600 font-sans">
                          · {e}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 3. Constraints */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-stone-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#800020] flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Where to look
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {tri.places.length === 0 && (
                    <p className="text-xs text-stone-500 font-sans">No places known — check the facts above first.</p>
                  )}
                  {tri.places.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {i === 0 ? '★ first' : `#${i + 1}`}
                      </Badge>
                      <div>
                        <div className="font-semibold text-stone-800">{p.place}</div>
                        <div className="text-[11px] text-stone-500 font-sans">{p.via.join(' · ')}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-stone-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#800020] flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Name evidence
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <div className="text-sm">
                    <span className="text-[11px] uppercase tracking-wide text-stone-500 font-sans font-bold block">Surname on record</span>
                    <span className="font-bold text-stone-900">{triSurname(person.name)}</span>
                    <span className="text-[11px] text-stone-500 font-sans block">
                      Italian civil records keep the maiden name — search Pirri, not the married name.
                    </span>
                  </div>
                  {tri.clues.length > 0 && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wide text-stone-500 font-sans font-bold block mb-1">
                        Age clues → birth estimates
                      </span>
                      {tri.clues.map((c, i) => (
                        <div key={i} className="text-xs text-stone-700 font-sans">
                          b. ~{c.min}–{c.max} — {c.explanation}{' '}
                          <Link className="text-[#800020] underline" to={`/research/records/${c.recordId}`}>
                            open record
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                  {tri.refs.length > 0 && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wide text-stone-500 font-sans font-bold block mb-1">
                        Act references found
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {tri.refs.map((r) => (
                          <Badge key={r} variant="outline" className="text-xs font-mono">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 4. Snippets */}
            {tri.snippets.length > 0 && (
              <Card className="border-stone-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#800020]">
                    Every line your records say about this name ({tri.snippets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1.5">
                  {tri.snippets.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs font-sans">
                      <span className="text-stone-400 shrink-0 w-4">{i + 1}.</span>
                      <span className="flex-1 text-stone-700 break-words">{s.line}</span>
                      <Link
                        className="text-[#800020] underline shrink-0 inline-flex items-center gap-0.5"
                        to={`/research/records/${s.recordId}`}
                      >
                        <ExternalLink className="w-3 h-3" /> {s.recordType}
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 5. Search pack */}
            <Card className="border-[#800020]/30 border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#800020] flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Search pack — {TARGETS.find((t) => t.key === target)?.label} record
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <p className="text-xs text-stone-600 font-sans">
                  Request from: <span className="font-bold text-stone-800">{tri.pack.office}</span>
                  {tri.places.length > 1 && (
                    <span className="text-stone-500">
                      {' '}
                      (alternatives: {tri.places.slice(1, 3).map((p) => p.place).join('; ')})
                    </span>
                  )}
                </p>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500 font-sans">
                      Draft (Italian)
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs min-h-[36px]"
                      onClick={() => copy('it', tri.pack.italian)}
                    >
                      <Copy className="w-3 h-3 mr-1" /> {copied === 'it' ? 'Copied ✓' : 'Copy'}
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs font-sans bg-white border border-stone-200 rounded-lg p-3 text-stone-800">
                    {tri.pack.italian}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500 font-sans">
                      Summary (English)
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs min-h-[36px]"
                      onClick={() => copy('en', tri.pack.english)}
                    >
                      <Copy className="w-3 h-3 mr-1" /> {copied === 'en' ? 'Copied ✓' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-xs font-sans text-stone-700">{tri.pack.english}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
