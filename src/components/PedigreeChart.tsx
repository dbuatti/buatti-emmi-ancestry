import { Users } from 'lucide-react';
import type { Person } from '@/types';
import { getLineColor } from '@/lib/constants';

interface PedigreeChartProps {
  people: Person[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
}

function PersonNode({ person, isSelected, lineColor, onClick }: {
  person: Person;
  isSelected: boolean;
  lineColor: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
        isSelected ? lineColor : 'bg-white border-stone-200'
      }`}
    >
      <p className="font-bold truncate">{person.name}</p>
      <p className={`text-[10px] font-sans ${isSelected ? 'opacity-80' : 'opacity-80'}`}>
        {person.birthDate || 'Unknown'} – {person.deathDate || (person.isLiving ? 'Living' : 'Unknown')}
      </p>
    </div>
  );
}

function GenerationLabel({ label }: { label: string }) {
  return (
    <div className="text-center">
      <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400 font-bold">{label}</span>
    </div>
  );
}

function ConnectingLine({ count }: { count: number }) {
  return (
    <div className="hidden md:flex justify-around text-stone-300 h-4 pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${count === 1 ? 'w-full' : `w-1/${count}`} border-r-2 border-dashed border-stone-300 h-full`} />
      ))}
    </div>
  );
}

export function PedigreeChart({ people, selectedPersonId, onSelectPerson }: PedigreeChartProps) {
  const lineColorMap: Record<string, string> = {
    Buatti: 'bg-[#800020] text-white border-[#800020] shadow-md',
    Chiappini: 'bg-amber-700 text-white border-amber-700 shadow-md',
    Emmi: 'bg-emerald-800 text-white border-emerald-800 shadow-md',
    Patanè: 'bg-blue-900 text-white border-blue-900 shadow-md',
  };

  function getSelectedStyle(id: string, line: string): string {
    return selectedPersonId === id ? (lineColorMap[line] || lineColorMap.Buatti) : '';
  }

  return (
    <div className="lg:col-span-2 bg-[#F4EFE6] border border-stone-200 rounded-xl p-6 shadow-inner relative overflow-hidden min-h-[600px] flex flex-col justify-between">
      <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
        <Users className="w-96 h-96 text-[#800020]" />
      </div>

      <div className="text-center mb-4 relative z-10">
        <h3 className="text-lg font-bold text-[#800020] tracking-wide">Pedigree Chart</h3>
        <p className="text-xs text-stone-500 font-sans">Interactive lineage showing the connection between the Buatti-Chiappini and Emmi-Patanè lines.</p>
      </div>

      <div className="space-y-8 relative z-10 my-auto">
        {/* Generation 1 */}
        <div className="space-y-4">
          <GenerationLabel label="Generation 1 — Great-Grandparents" />
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="space-y-2">
              <div onClick={() => onSelectPerson('alfredo-buatti-sr')}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${getSelectedStyle('alfredo-buatti-sr', 'Buatti') || 'bg-white border-stone-200 hover:border-[#800020]'}`}>
                <p className="font-bold truncate">Alfredo Buatti Sr.</p>
                <p className="text-[10px] opacity-80 font-sans">d. 1964 • Ascoli Piceno</p>
              </div>
              <div onClick={() => onSelectPerson('ida-galanti')}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${getSelectedStyle('ida-galanti', 'Buatti') || 'bg-white border-stone-200 hover:border-[#800020]'}`}>
                <p className="font-bold truncate">Ida Galanti</p>
                <p className="text-[10px] opacity-80 font-sans">1898 – 1970</p>
              </div>
            </div>
            <div className="space-y-2">
              <div onClick={() => onSelectPerson('remo-chiappini')}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${getSelectedStyle('remo-chiappini', 'Chiappini') || 'bg-white border-stone-200 hover:border-amber-700'}`}>
                <p className="font-bold truncate">Remo Chiappini</p>
                <p className="text-[10px] opacity-80 font-sans">Unknown • Marche</p>
              </div>
              <div onClick={() => onSelectPerson('remo-wife-unknown')}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${getSelectedStyle('remo-wife-unknown', 'Chiappini') || 'bg-white border-stone-200 hover:border-amber-700'}`}>
                <p className="font-bold truncate">Wife (Unknown)</p>
                <p className="text-[10px] opacity-80 font-sans">d. c. 1930s</p>
              </div>
            </div>
            <div className="space-y-2">
              <div onClick={() => onSelectPerson('egidio-emmi')}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${getSelectedStyle('egidio-emmi', 'Emmi') || 'bg-white border-stone-200 hover:border-emerald-800'}`}>
                <p className="font-bold truncate">Egidio Emmi</p>
                <p className="text-[10px] opacity-80 font-sans">d. pre-1949 • Sicily</p>
              </div>
              <div onClick={() => onSelectPerson('concetta-sgroi')}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${getSelectedStyle('concetta-sgroi', 'Emmi') || 'bg-white border-stone-200 hover:border-emerald-800'}`}>
                <p className="font-bold truncate">Concetta Sgroi</p>
                <p className="text-[10px] opacity-80 font-sans">Unknown • Sicily</p>
              </div>
            </div>
            <div className="space-y-2">
              <div onClick={() => onSelectPerson('rosario-patane-sr')}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${getSelectedStyle('rosario-patane-sr', 'Patanè') || 'bg-white border-stone-200 hover:border-blue-900'}`}>
                <p className="font-bold truncate">Rosario Patanè</p>
                <p className="text-[10px] opacity-80 font-sans">9 Feb 1889 • Calatabiano</p>
              </div>
              <div onClick={() => onSelectPerson('venera-vecchio')}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${getSelectedStyle('venera-vecchio', 'Patanè') || 'bg-white border-stone-200 hover:border-blue-900'}`}>
                <p className="font-bold truncate">Venera Vecchio</p>
                <p className="text-[10px] opacity-80 font-sans">d. pre-1953 • Sicily</p>
              </div>
            </div>
          </div>
        </div>

        <ConnectingLine count={4} />

        {/* Generation 2 */}
        <div className="space-y-4">
          <GenerationLabel label="Generation 2 — Grandparents" />
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { id: 'ezio-buatti', name: 'Ezio Buatti', dates: '1923 – 1991', subtitle: 'Ascoli Piceno → Sydney', color: 'Buatti' },
              { id: 'bruna-lilia-chiappini', name: 'Bruna Lilia Chiappini', dates: '1930 – 1998', subtitle: 'San Benedetto → Victoria', color: 'Chiappini' },
              { id: 'gregorio-emmi', name: 'Gregorio Emmi', dates: '1915 – 1979', subtitle: 'Linguaglossa → Ingham → Sydney', color: 'Emmi' },
              { id: 'rosaria-patane', name: 'Rosaria Patanè', dates: '1924 – 1994', subtitle: 'Fiumefreddo → Ingham → Victoria', color: 'Patanè' },
            ].map(p => (
              <div key={p.id} onClick={() => onSelectPerson(p.id)}
                className={`col-span-1 p-3 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${getSelectedStyle(p.id, p.color) || 'bg-white border-stone-200'}`}
                style={{ borderColor: selectedPersonId === p.id ? undefined : undefined }}>
                <p className="font-bold">{p.name}</p>
                <p className="text-[10px] opacity-80 font-sans">{p.dates}</p>
                <p className="text-[9px] font-sans italic mt-1">{p.subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        <ConnectingLine count={2} />

        {/* Generation 3 */}
        <div className="space-y-4">
          <GenerationLabel label="Generation 3 — Parents" />
          <div className="grid grid-cols-2 gap-8 text-center max-w-2xl mx-auto">
            <div onClick={() => onSelectPerson('alfred-buatti')}
              className={`p-3 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${getSelectedStyle('alfred-buatti', 'Buatti') || 'bg-white border-stone-200 hover:border-[#800020]'}`}>
              <p className="font-bold">Alfred (Alfredo) Buatti</p>
              <p className="text-[10px] opacity-80 font-sans">b. 1956 • Broadford, VIC</p>
              <p className="text-[9px] font-sans italic mt-1">Moved to Italy 1962, returned 1975</p>
            </div>
            <div onClick={() => onSelectPerson('venera-buatti')}
              className={`p-3 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${getSelectedStyle('venera-buatti', 'Emmi') || 'bg-white border-stone-200 hover:border-emerald-800'}`}>
              <p className="font-bold">Venera Buatti (née Emmi)</p>
              <p className="text-[10px] opacity-80 font-sans">Living • Named after grandmother</p>
              <p className="text-[9px] font-sans italic mt-1">Daughter of Gregorio & Rosaria</p>
            </div>
          </div>
        </div>

        <ConnectingLine count={1} />

        {/* Generation 4 */}
        <div className="space-y-4">
          <GenerationLabel label="Generation 4 — Children" />
          <div className="grid grid-cols-4 gap-2 text-center max-w-xl mx-auto">
            {['daniele-buatti', 'roberto-buatti', 'stefano-buatti', 'marco-buatti'].map(id => {
              const child = people.find(p => p.id === id);
              if (!child) return null;
              return (
                <div key={id} onClick={() => onSelectPerson(id)}
                  className={`p-2 rounded-lg border text-[11px] cursor-pointer transition-all duration-200 hover:scale-105 ${getSelectedStyle(id, 'Buatti') || 'bg-white border-stone-200 hover:border-[#800020]'}`}>
                  <p className="font-bold truncate">{child.name.split(' ')[0]}</p>
                  <p className="text-[9px] opacity-80 font-sans">Buatti</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center mt-4 text-[10px] text-stone-500 font-sans border-t border-stone-200/60 pt-2">
        Lines:{' '}
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#800020] mr-1" /> Buatti
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-700 ml-3 mr-1" /> Chiappini
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-800 ml-3 mr-1" /> Emmi
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-900 ml-3 mr-1" /> Patanè
      </div>
    </div>
  );
}
