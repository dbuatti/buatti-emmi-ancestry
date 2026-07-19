import { useMemo } from 'react';
import { Users, BadgeCheck } from 'lucide-react';
import type { Person } from '@/types';
import { collectAncestorIds, isIdentified, cleanDate } from '@/lib/tree';
import { LINE_BORDER_LEFT, LINE_BG } from '@/lib/constants';

interface PedigreeChartProps {
  people: Person[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
}

const LINE_BORDER_HOVER: Record<string, string> = {
  Buatti: 'border-[#800020] hover:border-[#800020]',
  Chiappini: 'border-amber-700 hover:border-amber-700',
  Emmi: 'border-emerald-800 hover:border-emerald-800',
  Patanè: 'border-blue-900 hover:border-blue-900',
  Other: 'border-stone-600 hover:border-stone-600',
};

const LINE_SELECTED_BG: Record<string, string> = {
  Buatti: 'bg-[#800020] text-white border-[#800020] shadow-md',
  Chiappini: 'bg-amber-700 text-white border-amber-700 shadow-md',
  Emmi: 'bg-emerald-800 text-white border-emerald-800 shadow-md',
  Patanè: 'bg-blue-900 text-white border-blue-900 shadow-md',
  Other: 'bg-stone-600 text-white border-stone-600 shadow-md',
};

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
  const confirmed = isIdentified(person);
  const borderColor = LINE_BORDER_HOVER[line] || 'border-stone-200 hover:border-stone-200';
  const selectedStyle = selected ? (LINE_SELECTED_BG[line] || LINE_SELECTED_BG.Other) : 'bg-white';
  const lineStripe = LINE_BORDER_LEFT[line] || 'border-l-stone-300';
  const birthClean = cleanDate(person.birthDate);
  const deathClean = cleanDate(person.deathDate);
  const found = person.records?.filter(r => r.status === 'Found').length ?? 0;
  const total = person.records?.length ?? 0;

  return (
    <div
      onClick={onSelect}
      className={`relative p-2 pl-2.5 rounded-r-lg border border-l-4 text-xs cursor-pointer transition-all duration-200 hover:scale-[1.03] ${lineStripe} ${selectedStyle} ${borderColor}`}
    >
      {confirmed && (
        <div className="absolute -top-1.5 -right-1.5 z-10">
          <BadgeCheck className="w-4 h-4 text-emerald-600 bg-white rounded-full" />
        </div>
      )}
      <p className="font-bold truncate pr-1">{person.name}</p>
      <p className="text-[10px] font-sans opacity-80">
        {birthClean || 'Unknown'}{deathClean ? ` – ${deathClean}` : person.isLiving ? ' – Living' : ''}
      </p>
      {person.occupations && person.occupations.length > 0 && (
        <p className="text-[9px] font-sans italic opacity-60 truncate">{person.occupations[0]}</p>
      )}
      {total > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <div className="flex-1 h-1 rounded-full bg-stone-200 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-600/60" style={{ width: `${Math.round(found / total * 100)}%` }} />
          </div>
          <span className="text-[8px] font-sans text-stone-400">{found}/{total}</span>
        </div>
      )}
    </div>
  );
}

export function PedigreeChart({ people, selectedPersonId, onSelectPerson }: PedigreeChartProps) {
  const allLines: string[] = ['Buatti', 'Chiappini', 'Emmi', 'Patanè'];

  // Always show the full tree from Daniele — selectedPersonId only highlights
  const directLineIds = useMemo(
    () => collectAncestorIds(people, 'daniele-buatti'),
    [people]
  );

  const filtered = people.filter(p => directLineIds.has(p.id));
  const gens = [...new Set(filtered.map(p => p.generation))].sort((a, b) => a - b);

  const byGenAndLine: Record<number, Record<string, Person[]>> = {};
  for (const p of filtered) {
    if (!byGenAndLine[p.generation]) byGenAndLine[p.generation] = {};
    if (!byGenAndLine[p.generation][p.line]) byGenAndLine[p.generation][p.line] = [];
    byGenAndLine[p.generation][p.line].push(p);
  }

  return (
    <div className="lg:col-span-2 bg-[#F4EFE6] border border-stone-200 rounded-xl p-6 shadow-inner relative overflow-y-auto min-h-[400px] max-h-[70vh]">
      <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
        <Users className="w-96 h-96 text-[#800020]" />
      </div>

      <div className="text-center mb-4 relative z-10">
        <h3 className="text-lg font-bold text-[#800020] tracking-wide">Pedigree Chart</h3>
        <p className="text-xs text-stone-500 font-sans">Interactive lineage — verified ancestors marked with <BadgeCheck className="w-3 h-3 inline text-emerald-600" /></p>
      </div>

      <div className="space-y-6 relative z-10">
        {gens.map((gen, gi) => {
          const activeLines = allLines.filter(line => (byGenAndLine[gen]?.[line]?.length ?? 0) > 0);
          return (
          <div key={gen} className="space-y-2">
            <div className="text-center">
              <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400 font-bold">{genLabel(gen)}</span>
            </div>
            <div className="grid grid-cols-4 gap-4 px-1">
              {allLines.map((line, li) => {
                const cards = byGenAndLine[gen]?.[line] ?? [];
                const hasCards = cards.length > 0;
                const lineDot = LINE_BG[line];
                return (
                  <div key={line} className={`flex flex-col gap-1.5 ${li > 0 ? 'border-l-2 border-stone-200 pl-4' : 'pr-1'} ${!hasCards ? 'opacity-30' : ''}`}>
                    <div className="flex items-center gap-1">
                      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${lineDot ?? 'bg-stone-400'}`} />
                      <span className="text-[9px] font-sans uppercase tracking-wider text-stone-400 font-semibold">{line}</span>
                    </div>
                    <div className="space-y-1.5">
                      {cards.map(p => (
                        <PersonCard
                          key={p.id}
                          person={p}
                          selected={selectedPersonId === p.id}
                          onSelect={() => onSelectPerson(p.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {gi < gens.length - 1 && (
              <div className="grid grid-cols-4 gap-4 px-1 mt-1.5">
                {allLines.map((line, li) => {
                  const hasInNextGen = gens.includes(gen + 1) && (byGenAndLine[gen + 1]?.[line]?.length ?? 0) > 0;
                  return (
                  <div key={line} className={`flex justify-center ${li > 0 ? 'border-l-2 border-transparent pl-4' : ''}`}>
                    <div className={`w-px h-3 border-r-2 border-dashed ${hasInNextGen ? 'border-stone-400' : 'border-stone-200'}`} />
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })}
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