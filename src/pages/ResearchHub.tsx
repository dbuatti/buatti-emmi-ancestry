import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { initialPeople } from '@/data/familyDataWrapper';
import { getAllRecords, type RecordEntry } from '@/lib/record-loader';
import { buildClueReport } from '@/lib/clues';
import eventRequests from '@/data/event-requests.json';
import { RESEARCH_NAV } from '@/lib/research-nav';

const DESCRIPTIONS: Record<string, string> = {
  '/research/tasks': 'The single next thing to do, then the one after that.',
  '/research/centre': 'Mail sent and received, requests waiting on a reply, drafts and chases.',
  '/research/people': 'Every person with their records, open questions and completeness.',
  '/research/records': 'Each filed document and where it is in the five steps.',
  '/research/clues': 'Contradictions to fix, acts cited but not filed, and where the next find is likeliest.',
  '/research/matrix': 'Every person × every record type: documented, claimed or missing.',
  '/research/triangulate': 'Everything known about one person, turned into a search window and a request draft.',
  '/research/documents': 'Where images are stored, attachment health, and how the inbox works.',
  '/research/assistant': 'Suggestions, drafts and thread analysis across the mail archive.',
  '/research/goals': 'Auto-generated next steps for each ancestor.',
};

interface Requests { [key: string]: { requestedOn?: string; requestedFrom?: string; receivedOn?: string } }

const DAY = 86_400_000;

function Stat({ to, value, label, hint, tone = 'text-stone-900' }: { to: string; value: string | number; label: string; hint: string; tone?: string }) {
  return (
    <Link to={to} className="block rounded-lg border border-stone-200 bg-white p-4 hover:border-[#800020] transition-colors">
      <span className={`block text-3xl font-bold font-serif ${tone}`}>{value}</span>
      <span className="block text-sm font-sans font-medium text-stone-800 mt-1">{label}</span>
      <span className="block text-xs font-sans text-stone-500 mt-0.5">{hint}</span>
    </Link>
  );
}

export default function ResearchHub() {
  const [records, setRecords] = useState<RecordEntry[] | null>(null);
  useEffect(() => {
    let live = true;
    getAllRecords().then((r) => { if (live) setRecords(r); });
    return () => { live = false; };
  }, []);

  const stats = useMemo(() => {
    const recs = records ?? [];
    const toCheck = recs.filter((r) => r.frontMatter.transcribed && !r.frontMatter.verified).length;
    const toTranscribe = recs.filter((r) => r.frontMatter.filed && !r.frontMatter.transcribed).length;
    const verified = recs.filter((r) => r.frontMatter.verified).length;

    const reqs = Object.values(eventRequests as Requests).filter((r) => r.requestedOn && !r.receivedOn);
    const now = Date.now();
    const overdue = reqs.filter((r) => {
      const t = Date.parse(r.requestedOn!);
      return !Number.isNaN(t) && now - t > 30 * DAY;
    }).length;

    const report = records
      ? buildClueReport(
          initialPeople, 'daniele-buatti',
          recs.map((r) => ({ id: r.id, atto: r.frontMatter.atto, year: r.frontMatter.year, type: r.frontMatter.type, comune: r.frontMatter.comune, people: r.frontMatter.people })),
          recs.map((r) => ({ recordId: r.id, label: r.id, text: r.body })),
        )
      : null;
    const toFix = report ? report.checks.filter((c) => c.severity !== 'info').length : null;

    return { total: recs.length, toCheck, toTranscribe, verified, waiting: reqs.length, overdue, toFix, cited: report?.cited.length ?? null };
  }, [records]);

  const loading = records === null;
  const sections = RESEARCH_NAV.filter((n) => n.to !== '/research');

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Research</h1>
          <p className="text-stone-600 font-sans">
            {initialPeople.length} people in the tree · {loading ? '…' : stats.total} documents filed.
          </p>
        </div>

        <section aria-label="Where things stand" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat
            to="/research/records"
            value={loading ? '–' : stats.toCheck + stats.toTranscribe}
            label="Records to work on"
            hint={loading ? 'Reading records…' : `${stats.toTranscribe} to transcribe · ${stats.toCheck} to check · ${stats.verified} verified`}
            tone={stats.toCheck + stats.toTranscribe > 0 ? 'text-[#800020]' : 'text-emerald-700'}
          />
          <Stat
            to="/research/tasks"
            value={stats.waiting}
            label="Requests awaiting a reply"
            hint={stats.overdue > 0 ? `${stats.overdue} waiting over 30 days — time to chase` : 'None overdue'}
            tone={stats.overdue > 0 ? 'text-amber-700' : 'text-stone-900'}
          />
          <Stat
            to="/research/clues"
            value={stats.toFix ?? '–'}
            label="Contradictions in the tree"
            hint="Links and dates that can't all be true"
            tone={stats.toFix ? 'text-amber-700' : 'text-emerald-700'}
          />
          <Stat
            to="/research/clues"
            value={stats.cited ?? '–'}
            label="Known acts not yet filed"
            hint="Mentioned by number in your notes"
          />
        </section>

        <h2 className="text-xs font-sans font-semibold tracking-wider uppercase text-stone-500 mb-3">Workspaces</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.to}
                to={s.to}
                className="group flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-4 hover:border-[#800020] transition-colors"
              >
                <Icon className="w-5 h-5 text-[#800020] mt-0.5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-stone-900">{s.label}</span>
                  <span className="block text-sm text-stone-600 font-sans mt-0.5">{DESCRIPTIONS[s.to]}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#800020] mt-1 shrink-0 transition-colors" />
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
