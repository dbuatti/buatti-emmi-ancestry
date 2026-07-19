import { useState } from 'react';
import { Users, BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Person } from '@/types';
import { isIdentified, cleanDate } from '@/lib/tree';

interface TreeEgoProps {
  people: Person[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
}

const LINE_COLORS: Record<string, string> = {
  Buatti: 'border-l-[#800020]',
  Chiappini: 'border-l-amber-700',
  Emmi: 'border-l-emerald-800',
  Patanè: 'border-l-blue-900',
};

const LINE_BG: Record<string, string> = {
  Buatti: 'bg-[#800020]',
  Chiappini: 'bg-amber-700',
  Emmi: 'bg-emerald-800',
  Patanè: 'bg-blue-900',
};

function PersonMiniCard({ person, onClick }: { person: Person; onClick: () => void }) {
  const stripe = LINE_COLORS[person.line] || 'border-l-stone-300';
  const dot = LINE_BG[person.line] || 'bg-stone-400';
  const confirmed = isIdentified(person);

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-lg border border-l-4 border-stone-200 ${stripe} p-2.5 text-xs cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200 min-w-[140px] max-w-[180px]`}
    >
      {confirmed && (
        <div className="absolute -top-1.5 -right-1.5 z-10">
          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 bg-white rounded-full" />
        </div>
      )}
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
        <span className="font-bold truncate">{person.name.split(/\(|\[/)[0].trim()}</span>
      </div>
      <p className="text-[10px] text-stone-500 font-sans">
        {cleanDate(person.birthDate) || 'Unknown'}{person.deathDate ? ` – ${cleanDate(person.deathDate)}` : person.isLiving ? ' – Living' : ''}
      </p>
    </div>
  );
}

export function TreeEgo({ people, selectedPersonId, onSelectPerson }: TreeEgoProps) {
  const root = people.find(p => p.id === selectedPersonId);
  if (!root) return <div className="text-center py-10 text-stone-500">Select a person to view their tree.</div>;

  // Walk ancestors up to 4 generations
  const ancestors: Person[][] = [];
  let currentGen = [root];
  for (let g = 0; g < 4; g++) {
    const nextGen: Person[] = [];
    for (const p of currentGen) {
      for (const pid of p.parents) {
        const parent = people.find(x => x.id === pid);
        if (parent) nextGen.push(parent);
      }
    }
    if (nextGen.length === 0) break;
    ancestors.push(nextGen);
    currentGen = nextGen;
  }

  // Walk descendants down to 3 generations
  const descendants: Person[][] = [];
  currentGen = [root];
  for (let g = 0; g < 3; g++) {
    const nextGen: Person[] = [];
    for (const p of currentGen) {
      for (const cid of p.children) {
        const child = people.find(x => x.id === cid);
        if (child) nextGen.push(child);
      }
    }
    if (nextGen.length === 0) break;
    descendants.push(nextGen);
    currentGen = nextGen;
  }

  // Siblings
  const siblings = people.filter(p =>
    p.id !== root.id &&
    root.parents.length > 0 &&
    p.parents.some(pid => root.parents.includes(pid))
  );

  // Spouses
  const spouses = root.spouses.map(sid => people.find(p => p.id === sid)).filter(Boolean) as Person[];

  const lineDot = LINE_BG[root.line] || 'bg-stone-400';

  return (
    <div className="bg-[#F4EFE6] border border-stone-200 rounded-xl p-6 shadow-inner min-h-[500px] overflow-y-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-[#800020] tracking-wide">Ego Tree</h3>
        <p className="text-xs text-stone-500 font-sans">Person-centric view: ancestors above, descendants below.</p>
      </div>

      <div className="flex flex-col items-center gap-6 py-4">
        {/* Ancestors */}
        {ancestors.map((gen, gi) => (
          <div key={`a-${gi}`} className="flex flex-wrap justify-center gap-3">
            {gen.map(p => (
              <PersonMiniCard key={p.id} person={p} onClick={() => onSelectPerson(p.id)} />
            ))}
          </div>
        ))}

        {/* Connector line */}
        {ancestors.length > 0 && (
          <div className="w-px h-6 border-l-2 border-dashed border-stone-400" />
        )}

        {/* Siblings row */}
        {siblings.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {siblings.map(p => (
              <PersonMiniCard key={p.id} person={p} onClick={() => onSelectPerson(p.id)} />
            ))}
          </div>
        )}
        {siblings.length > 0 && (
          <div className="w-px h-4 border-l-2 border-dashed border-stone-300" />
        )}

        {/* Root person */}
        <div className="scale-110 relative">
          <div className={`absolute -top-1 -left-1 right-0 bottom-0 rounded-lg border-2 ${LINE_COLORS[root.line].replace('border-l-', 'border-')} opacity-30`} />
          <PersonMiniCard person={root} onClick={() => {}} />
        </div>

        {/* Spouse row */}
        {spouses.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-xs text-stone-400 font-sans">
              <div className="w-12 h-px bg-stone-300" />
              <span>married</span>
              <div className="w-12 h-px bg-stone-300" />
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {spouses.map(p => (
                <PersonMiniCard key={p.id} person={p} onClick={() => onSelectPerson(p.id)} />
              ))}
            </div>
          </>
        )}

        {/* Connector line */}
        {descendants.length > 0 && (
          <div className="w-px h-6 border-l-2 border-dashed border-stone-400" />
        )}

        {/* Descendants */}
        {descendants.map((gen, gi) => (
          <div key={`d-${gi}`} className="flex flex-wrap justify-center gap-3">
            {gen.map(p => (
              <PersonMiniCard key={p.id} person={p} onClick={() => onSelectPerson(p.id)} />
            ))}
          </div>
        ))}

        {/* No relatives */}
        {ancestors.length === 0 && descendants.length === 0 && siblings.length === 0 && spouses.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-sm text-stone-500 font-sans">No known relatives connected to this person.</p>
          </div>
        )}
      </div>
    </div>
  );
}