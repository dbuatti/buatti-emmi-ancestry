import { useState, useMemo } from 'react';
import { initialPeople } from '../data/familyData';
import { generateGoals, type ResearchGoal } from '@/lib/researchGoals';
import { BookOpen, ArrowLeft, Search, CheckCircle2, Clock, XCircle } from 'lucide-react';

const LINE_COLORS: Record<string, string> = {
  Buatti: 'text-rose-800 border-rose-300 bg-rose-50',
  Chiappini: 'text-amber-800 border-amber-300 bg-amber-50',
  Emmi: 'text-emerald-800 border-emerald-300 bg-emerald-50',
  'Patanè': 'text-blue-800 border-blue-300 bg-blue-50',
  Other: 'text-stone-600 border-stone-300 bg-stone-50',
};

const statusIcon = (status: ResearchGoal['status']) => {
  switch (status) {
    case 'Found': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />;
    case 'Searching': return <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />;
    case 'Not Found': return <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />;
    default: return <Search className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />;
  }
};

const generationalLabel = (gen: number): string => {
  if (gen < 0) return `G-neg ${gen}`;
  return `Gen ${gen}`;
};

export default function ResearchGoals() {
  const [lineFilter, setLineFilter] = useState<string>('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const allGoals = useMemo(() => {
    const result: { person: typeof initialPeople[0]; goals: ResearchGoal[] }[] = [];
    for (const person of initialPeople) {
      if (person.isLiving) continue;
      const goals = generateGoals(person);
      if (goals.length > 0) {
        result.push({ person, goals });
      }
    }
    return result;
  }, []);

  const filtered = useMemo(() => {
    if (lineFilter === 'all') return allGoals;
    return allGoals.filter(g => g.person.line === lineFilter);
  }, [allGoals, lineFilter]);

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <header className="border-b border-stone-200 bg-[#F4EFE6] py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <a href="/" className="text-stone-500 hover:text-[#800020] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <BookOpen className="w-6 h-6 text-[#800020]" />
            <h1 className="text-2xl md:text-3xl font-bold text-[#800020]">Research Goals</h1>
          </div>
          <p className="text-stone-600 text-sm font-sans max-w-3xl">
            Auto-generated next steps for each ancestor. Items with <CheckCircle2 className="inline w-3.5 h-3.5 text-emerald-600" /> are already found.
            Items with <Clock className="inline w-3.5 h-3.5 text-amber-500" /> are in progress.
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {['all', 'Buatti', 'Chiappini', 'Emmi', 'Patanè'].map(line => (
              <button
                key={line}
                onClick={() => setLineFilter(line)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-colors ${
                  lineFilter === line
                    ? 'bg-[#800020] text-white border-[#800020]'
                    : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
                }`}
              >
                {line === 'all' ? 'All Lines' : line}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map(({ person, goals }) => {
            const isCollapsed = collapsed.has(person.id);
            const foundCount = goals.filter(g => g.status === 'Found').length;
            const activeCount = goals.filter(g => g.status !== 'Found').length;

            return (
              <div
                key={person.id}
                className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 border-b border-stone-100 cursor-pointer"
                  onClick={() => toggleCollapse(person.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${LINE_COLORS[person.line] || LINE_COLORS.Other}`}>
                      {person.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-stone-800 truncate">{person.name}</h3>
                      <div className="flex gap-2 text-xs text-stone-500 font-sans">
                        <span className={LINE_COLORS[person.line]?.split(' ')[0]}>
                          {person.line}
                        </span>
                        <span>{generationalLabel(person.generation)}</span>
                        {person.birthDate && (
                          <span className="truncate">{person.birthDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-sans text-stone-400">
                      {foundCount}/{goals.length} done
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-sans font-medium ${
                      activeCount === 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {activeCount} active
                    </span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="p-4 space-y-1.5">
                    {goals.length === 0 ? (
                      <p className="text-sm text-stone-400 italic font-sans">No research goals generated.</p>
                    ) : (
                      goals.map(goal => (
                        <div
                          key={goal.id}
                          className={`flex items-start gap-2.5 py-1.5 px-2 rounded-lg text-sm ${
                            goal.status === 'Found'
                              ? 'bg-emerald-50/50 text-stone-400'
                              : goal.status === 'Searching'
                              ? 'bg-amber-50/50 text-stone-700'
                              : goal.status === 'Not Found'
                              ? 'bg-stone-100/50 text-stone-400'
                              : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          {statusIcon(goal.status)}
                          <div className={`min-w-0 flex-1 ${goal.status === 'Found' || goal.status === 'Not Found' ? 'line-through decoration-stone-300' : ''}`}>
                            <p className="font-sans text-sm leading-snug">{goal.description}</p>
                            <p className="text-xs text-stone-400 font-mono mt-0.5 truncate">{goal.where}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-sans">No people match this filter.</p>
          </div>
        )}
      </main>

      <footer className="border-t border-stone-200 bg-[#F4EFE6] py-6 px-4 text-center text-xs text-stone-400 font-sans">
        Buatti — Emmi Ancestry &middot; Research Goals &middot; Auto-generated from family tree data
      </footer>
    </div>
  );
}
