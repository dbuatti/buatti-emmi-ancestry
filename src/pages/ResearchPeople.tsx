import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, ArrowRight, BookOpen, FileText, MessageSquare, Sparkles, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { initialPeople, initialResearchLeads, initialOpenQuestions } from '@/data/familyDataWrapper';
import { getAllTasksForPerson } from '../../scripts/next-task';
import eventRequests from '@/data/event-requests.json';
import fsChecks from '@/data/fs-checks.json';
import personSkips from '@/data/person-skips.json';
import { getAllRecords } from '@/lib/record-loader';
import type { RecordEntry } from '@/lib/record-loader';
import { FactQualificationPanel } from '@/components/FactQualificationPanel';
import { PersonTaskList } from '@/components/PersonTaskList';
import { calculateCompleteness } from '@/lib/research';

interface ThreadLink {
  thread_id: number;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

const ResearchPeople = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [lineFilter, setLineFilter] = useState<string>('all');
  const [genFilter, setGenFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [records, setRecords] = useState<Map<string, RecordEntry>>(new Map());
  const [threadLinks, setThreadLinks] = useState<ThreadLink[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getAllRecords().then((l) => setRecords(new Map(l.map((r) => [r.id, r]))));
    // Fetch thread_links to show correspondence connections per person
    fetch('/api/correspondence/threads?limit=1000')
      .then((r) => r.json())
      .then(() => {})
      .catch(() => {});
  }, []);

  // Fetch thread_links separately
  useEffect(() => {
    fetch('/api/correspondence/thread-links')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.links)) setThreadLinks(d.links);
      })
      .catch(() => {});
  }, []);

  const recordSteps = useMemo(() => {
    const steps = new Map<string, { step: string; stepNumber: number }>();
    for (const [id, rec] of records) {
      steps.set(id, { step: rec.step, stepNumber: rec.stepNumber });
    }
    return steps;
  }, [records]);

  const taskCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (records.size === 0) return counts;
    for (const p of initialPeople) {
      const tasks = getAllTasksForPerson(
        p,
        recordSteps as unknown as Parameters<typeof getAllTasksForPerson>[1],
        eventRequests as unknown as Parameters<typeof getAllTasksForPerson>[2],
        new Date(),
        fsChecks as unknown as Parameters<typeof getAllTasksForPerson>[4],
        personSkips as unknown as Parameters<typeof getAllTasksForPerson>[5]
      );
      counts.set(p.id, tasks.length);
    }
    return counts;
  }, [records, recordSteps]);

  const verifiedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of initialPeople) {
      const vc = [...records.values()].filter(
        (r) => (r.frontMatter.people ?? []).includes(p.id) && r.frontMatter.verified
      ).length;
      counts.set(p.id, vc);
    }
    return counts;
  }, [records]);

  const filteredPeople = useMemo(() => {
    const filtered = initialPeople.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.birthPlace && p.birthPlace.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.occupations && p.occupations.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesLine = lineFilter === 'all' || p.line === lineFilter;
      const matchesGen = genFilter === 'all' || p.generation === Number(genFilter);
      return matchesSearch && matchesLine && matchesGen;
    });
    if (sortBy === 'completeness') {
      filtered.sort((a, b) => {
        const ta = taskCounts.get(a.id) ?? 0;
        const tb = taskCounts.get(b.id) ?? 0;
        const va = verifiedCounts.get(a.id) ?? 0;
        const vb = verifiedCounts.get(b.id) ?? 0;
        return calculateCompleteness(b, initialOpenQuestions, tb, vb).score - calculateCompleteness(a, initialOpenQuestions, ta, va).score;
      });
    } else if (sortBy === 'records') {
      filtered.sort((a, b) => (b.records?.length ?? 0) - (a.records?.length ?? 0));
    } else if (sortBy === 'tasks') {
      // sort by task count (computed below) — approximate by record count + leads
      filtered.sort((a, b) => (b.records?.length ?? 0) - (a.records?.length ?? 0));
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  }, [searchQuery, lineFilter, genFilter, sortBy, taskCounts, verifiedCounts]);

  function personLeads(personId: string) {
    return initialResearchLeads.filter((l) => l.description?.toLowerCase().includes(personId.toLowerCase().replace(/-/g, ' ')) || false);
  }

  function personQuestions(personId: string) {
    return initialOpenQuestions.filter((q) => q.question?.toLowerCase().includes(personId.toLowerCase().replace(/-/g, ' ')) || false);
  }

  function personThreadCount(personId: string) {
    return threadLinks.filter((t) => t.entity_type === 'person' && t.entity_id === personId).length;
  }

  function personRecords(person: (typeof initialPeople)[0]) {
    return (person.records ?? []).length;
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#800020]" />
            Research People
          </h1>
          <p className="text-stone-600 font-sans max-w-3xl">
            Systems-analyst view of every person in the tree: research completeness, linked records,
            open leads, open questions, and connected correspondence threads.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              className="pl-9 bg-white border-stone-300"
              placeholder="Search name, place, occupation…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="rounded border border-stone-300 bg-white px-3 py-2 text-sm font-sans"
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
          <select
            className="rounded border border-stone-300 bg-white px-3 py-2 text-sm font-sans"
            value={genFilter}
            onChange={(e) => setGenFilter(e.target.value)}
          >
            <option value="all">All generations</option>
            {[...new Set(initialPeople.map((p) => p.generation))].sort().map((g) => (
              <option key={g} value={g}>
                Gen {g}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-stone-300 bg-white px-3 py-2 text-sm font-sans"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort: Name</option>
            <option value="completeness">Sort: Completion %</option>
            <option value="records">Sort: Records</option>
          </select>
          <span className="text-xs text-stone-500 font-sans">
            {filteredPeople.length} of {initialPeople.length} people
          </span>
        </div>

        {/* People list */}
        <div className="space-y-3">
          {filteredPeople.map((person) => {
            const personVerifiedCount = verifiedCounts.get(person.id) ?? 0;
            const comp = calculateCompleteness(person, initialOpenQuestions, taskCounts.get(person.id) ?? 0, personVerifiedCount);
            const leads = personLeads(person.id);
            const qs = personQuestions(person.id);
            const tc = personThreadCount(person.id);
            const recCount = personRecords(person);
            const isExpanded = expanded === person.id;

            return (
              <Card key={person.id} className="border-stone-200 cursor-pointer hover:border-[#800020] transition-colors" onClick={() => navigate(`/research/people/${person.id}`)}>
                <CardHeader className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg font-serif">{person.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        Gen {person.generation} · {person.line}
                      </Badge>
                      {person.researchStatus?.status && (
                        <Badge
                          className={`text-xs ${
                            person.researchStatus.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : person.researchStatus.status === 'In Progress'
                              ? 'bg-amber-100 text-amber-800'
                              : person.researchStatus.status === 'Ruled Out'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {person.researchStatus.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-stone-500 font-sans">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> {recCount} records
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> {leads.length} leads
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {qs.length} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {tc} threads
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {comp.score}%
                      </span>
                    </div>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {person.birthDate && `b. ${person.birthDate}`}
                    {person.birthPlace && ` · ${person.birthPlace}`}
                    {person.deathDate && ` · d. ${person.deathDate}`}
                    {person.deathPlace && ` · ${person.deathPlace}`}
                  </CardDescription>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-4 pt-0 border-t border-stone-100">
                    {/* Records with vetting status */}
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-stone-700 font-sans mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#800020]" /> Records
                        <span className="text-[10px] font-normal text-stone-400">
                          ({[...records.values()].filter((r) => (r.frontMatter.people ?? []).includes(person.id) && r.frontMatter.verified).length}/{person.records?.length ?? 0} vetted)
                        </span>
                      </h3>
                      {person.records && person.records.length > 0 ? (
                        <div className="space-y-1.5">
                          {person.records.map((rec, i) => {
                            const linkedRecord = [...records.values()].find(
                              (r) => (r.frontMatter.people ?? []).includes(person.id) && r.frontMatter.type === rec.type
                            );
                            const isVerified = linkedRecord?.frontMatter.verified ?? false;
                            return (
                              <div key={i} className="flex items-center justify-between gap-2 rounded border border-stone-200 p-2 text-xs">
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-stone-700">{rec.type}</span>
                                  <span className="text-stone-500 ml-1">— {rec.status}</span>
                                  {isVerified && (
                                    <Badge className="text-[9px] bg-emerald-100 text-emerald-800 ml-1">Vetted ✓</Badge>
                                  )}
                                </div>
                                {linkedRecord && !isVerified && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[10px] h-6 px-2 border-[#800020] text-[#800020]"
                                    onClick={() => navigate(`/records/${linkedRecord.id}?mode=check`)}
                                  >
                                    Vet
                                  </Button>
                                )}
                                {linkedRecord && isVerified && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[10px] h-6 px-2 text-stone-500"
                                    onClick={() => navigate(`/records/${linkedRecord.id}`)}
                                  >
                                    View
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500">No records filed.</p>
                      )}
                    </div>

                    {/* Life events */}
                    {person.lifeEvents && person.lifeEvents.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-stone-700 font-sans mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#800020]" /> Life events
                        </h3>
                        <ul className="space-y-1">
                          {person.lifeEvents.map((ev, i) => (
                            <li key={i} className="text-xs font-sans text-stone-600 flex items-center gap-2">
                              <span className="capitalize font-medium">{ev.type}:</span>
                              <span>{ev.status}</span>
                              {ev.recordId && (
                                <button
                                  className="text-[#800020] underline"
                                  onClick={() => navigate(`/research/records/${ev.recordId}`)}
                                >
                                  {ev.recordId}
                                </button>
                              )}
                              {ev.note && <span className="text-stone-400">— {ev.note}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Research status */}
                    {person.researchStatus?.details && (
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-stone-700 font-sans mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#800020]" /> Research status
                        </h3>
                        <p className="text-xs font-sans text-stone-600">{person.researchStatus.details}</p>
                        {person.researchStatus.nextSteps && person.researchStatus.nextSteps.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {person.researchStatus.nextSteps.map((ns, i) => (
                              <li key={i} className="text-xs font-sans text-stone-500">→ {ns}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Cross-reference suggestions (self-doubting) */}
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-stone-700 font-sans mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600" /> Cross-reference suggestions
                      </h3>
                      <div className="space-y-1">
                        {!person.familySearchId && (
                          <p className="text-xs font-sans text-amber-700">
                            ⚠ No FamilySearch ID — consider running through FamilySearch for additional perspective.
                          </p>
                        )}
                        {person.records?.some((r) => r.status === 'Searching') && (
                          <p className="text-xs font-sans text-amber-700">
                            ⚠ Records still searching — try BDM indexes (NSW/VIC/SA) for additional perspective.
                          </p>
                        )}
                        {person.records?.some((r) => r.status === 'Not Found') && (
                          <p className="text-xs font-sans text-amber-700">
                            ⚠ Records marked Not Found — consider Antenati (Italian civil archives) or parish records.
                          </p>
                        )}
                        {person.familySearchId && !person.records?.some((r) => r.status === 'Found') && (
                          <p className="text-xs font-sans text-stone-500">
                            FamilySearch ID present ({person.familySearchId}) — cross-check hints against record.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Fact qualification */}
                    <FactQualificationPanel
                      person={person}
                      records={records}
                      onNavigateToRecord={(rid) => navigate(`/research/records/${rid}`)}
                    />

                    {/* All tasks for this person */}
                    <PersonTaskList personId={person.id} />

                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/family/people/${person.id}`)}>
                        Open person record
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/research/records`)}>
                        Browse all records
                      </Button>
                    </div>
                  </CardContent>
                )}

                <CardContent className="p-4 pt-0">
                  <button
                    className="text-xs text-[#800020] font-sans underline"
                    onClick={() => setExpanded(isExpanded ? null : person.id)}
                  >
                    {isExpanded ? 'Collapse' : 'Expand details'}
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default ResearchPeople;
