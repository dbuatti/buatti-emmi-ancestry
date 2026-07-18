import { Users, BadgeCheck } from 'lucide-react';
import type { Person } from '@/types';

interface PedigreeChartProps {
  people: Person[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
}

const LINE_COLORS: Record<string, string> = {
  Buatti: 'border-[#800020] hover:border-[#800020]',
  Chiappini: 'border-amber-700 hover:border-amber-700',
  Emmi: 'border-emerald-800 hover:border-emerald-800',
  Patanè: 'border-blue-900 hover:border-blue-900',
};

const LINE_SELECTED: Record<string, string> = {
  Buatti: 'bg-[#800020] text-white border-[#800020] shadow-md',
  Chiappini: 'bg-amber-700 text-white border-amber-700 shadow-md',
  Emmi: 'bg-emerald-800 text-white border-emerald-800 shadow-md',
  Patanè: 'bg-blue-900 text-white border-blue-900 shadow-md',
};

function isProperlyIdentified(person: Person): boolean {
  const birth = person.birthDate || '';
  const hasKnownBirth = birth.length > 0 && !/^Unknown/i.test(birth) && !/to be confirmed/i.test(birth);
  const hasDeath = !!person.deathDate || !!person.isLiving;
  const hasFamily = person.parents.length > 0 || person.children.length > 0;
  return hasKnownBirth && hasDeath && hasFamily;
}

function genLabel(gen: number): string {
  const labels: Record<number, string> = {
    [-3]: 'Generation -3 — 5th Great-Grandparents',
    [-2]: 'Generation -2 — 4th Great-Grandparents',
    [-1]: 'Generation -1 — 3rd Great-Grandparents',
    [0]: 'Generation 0 — Great-Great-Grandparents',
    [1]: 'Generation 1 — Great-Grandparents',
    [2]: 'Generation 2 — Grandparents',
    [3]: 'Generation 3 — Parents',
    [4]: 'Generation 4 — Children',
  };
  return labels[gen] || `Generation ${gen}`;
}

function PersonCard({ person, selected, onSelect }: { person: Person; selected: boolean; onSelect: () => void }) {
  const line = person.line;
  const confirmed = isProperlyIdentified(person);
  const borderColor = LINE_COLORS[line] || 'border-stone-200';
  const selectedStyle = selected ? (LINE_SELECTED[line] || LINE_SELECTED.Buatti) : 'bg-white';

  return (
    <div
      onClick={onSelect}
      className={`relative p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${selectedStyle} ${borderColor}`}
    >
      {confirmed && (
        <div className="absolute -top-1.5 -right-1.5 z-10">
          <BadgeCheck className="w-4 h-4 text-emerald-600 bg-white rounded-full" />
        </div>
      )}
      <p className="font-bold truncate pr-1">{person.name}</p>
      <p className="text-[10px] font-sans opacity-80">
        {person.birthDate || 'Unknown'}{person.deathDate ? ` – ${person.deathDate}` : person.isLiving ? ' – Living' : ''}
      </p>
      {person.occupations && person.occupations.length > 0 && (
        <p className="text-[9px] font-sans italic opacity-60 truncate">{person.occupations[0]}</p>
      )}
    </div>
  );
}

function ConnectingLine() {
  return (
    <div className="hidden md:flex justify-center text-stone-300 h-4 pointer-events-none">
      <div className="w-px border-r-2 border-dashed border-stone-300 h-full" />
    </div>
  );
}

export function PedigreeChart({ people, selectedPersonId, onSelectPerson }: PedigreeChartProps) {
  const allLines: string[] = ['Buatti', 'Chiappini', 'Emmi', 'Patanè'];

  const directLineIds = new Set<string>();
  function traceAncestors(id: string) {
    if (directLineIds.has(id)) return;
    directLineIds.add(id);
    const p = people.find(p => p.id === id);
    if (p) p.parents.forEach(traceAncestors);
  }

  // Include all siblings of the root (same parents)
  const root = people.find(p => p.id === 'daniele-buatti');
  if (root) {
    people.filter(p =>
      p.parents.length === root.parents.length &&
      p.parents.every((pid, i) => root.parents[i] === pid)
    ).forEach(p => directLineIds.add(p.id));
  }

  traceAncestors('daniele-buatti');

  const filtered = people.filter(p => directLineIds.has(p.id));
  const gens = [...new Set(filtered.map(p => p.generation))].sort((a, b) => a - b);

  const byGenAndLine: Record<number, Record<string, Person[]>> = {};
  for (const p of filtered) {
    if (!byGenAndLine[p.generation]) byGenAndLine[p.generation] = {};
    if (!byGenAndLine[p.generation][p.line]) byGenAndLine[p.generation][p.line] = [];
    byGenAndLine[p.generation][p.line].push(p);
  }

  return (
    <div className="lg:col-span-2 bg-[#F4EFE6] border border-stone-200 rounded-xl p-6 shadow-inner relative overflow-hidden min-h-[600px] flex flex-col justify-between">
      <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
        <Users className="w-96 h-96 text-[#800020]" />
      </div>

      <div className="text-center mb-4 relative z-10">
        <h3 className="text-lg font-bold text-[#800020] tracking-wide">Pedigree Chart</h3>
        <p className="text-xs text-stone-500 font-sans">Interactive lineage — verified ancestors marked with <BadgeCheck className="w-3 h-3 inline text-emerald-600" /></p>
      </div>

      <div className="space-y-6 relative z-10 my-auto overflow-x-auto">
        {gens.map((gen, gi) => (
          <div key={gen} className="space-y-3">
            <div className="text-center">
              <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400 font-bold">{genLabel(gen)}</span>
            </div>
            <div className="flex justify-center gap-3 px-2">
              {allLines.map(line => {
                const cards = byGenAndLine[gen]?.[line];
                if (!cards || cards.length === 0) return null;
                return (
                  <div key={line} className="flex-1 max-w-[200px] min-w-[100px] space-y-2">
                    {cards.map(p => (
                      <PersonCard
                        key={p.id}
                        person={p}
                        selected={selectedPersonId === p.id}
                        onSelect={() => onSelectPerson(p.id)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
            {gi < gens.length - 1 && <ConnectingLine />}
          </div>
        ))}
      </div>

      <div className="text-center mt-4 text-[10px] text-stone-500 font-sans border-t border-stone-200/60 pt-2">
        Lines:{' '}
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#800020] mr-1" /> Buatti
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-700 ml-3 mr-1" /> Chiappini
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-800 ml-3 mr-1" /> Emmi
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-900 ml-3 mr-1" /> Patanè
        <span className="ml-3"><BadgeCheck className="w-3 h-3 inline text-emerald-600" /> Verified</span>
      </div>
    </div>
  );
}