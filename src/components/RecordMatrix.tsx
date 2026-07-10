import { Check, X, Minus, Search } from 'lucide-react';
import type { Person } from '@/types';

const RECORD_TYPES = [
  'Birth (Civil)',
  'Baptismal Record',
  'Marriage Record',
  'Death Record',
  'Burial Record',
  'Immigration File',
  'Passport',
  'Passenger List',
] as const;

const PEOPLE_IDS = [
  'alfredo-buatti-sr', 'ida-galanti',
  'egidio-emmi', 'concetta-sgroi',
  'rosario-patane-sr', 'venera-vecchio',
  'ezio-buatti', 'bruna-lilia-chiappini',
  'gregorio-emmi', 'rosaria-patane',
  'alfred-buatti', 'venera-buatti',
  'antonino-emmi', 'rosaria-nasti',
  'gregorio-sgroi', 'santa-cali',
  'sebastiano-patane-sr', 'rosaria-dagata',
  'vincenzo-vecchio', 'rosaria-raciti',
  'remo-chiappini', 'irma-pirri',
];

function StatusIcon({ status, record }: { status: string; record: string }) {
  if (status === 'Found') return <Check className="w-3.5 h-3.5 text-emerald-600" />;
  if (status === 'Searching') return <Search className="w-3.5 h-3.5 text-amber-500" />;
  return <X className="w-3.5 h-3.5 text-red-400" />;
}

export function RecordMatrix({ people }: { people: Person[] }) {
  const peopleMap = new Map(people.map(p => [p.id, p]));

  return (
    <div className="bg-[#F4EFE6] border border-stone-200 rounded-xl p-6 shadow-inner overflow-x-auto">
      <div className="flex items-center gap-3 mb-4">
        <Search className="w-5 h-5 text-[#800020]" />
        <div>
          <h2 className="text-lg font-bold text-[#800020]">Record Matrix</h2>
          <p className="text-xs text-stone-500 font-sans">
            <Check className="inline w-3 h-3 text-emerald-600" /> Found &nbsp;
            <Search className="inline w-3 h-3 text-amber-500" /> Searching &nbsp;
            <X className="inline w-3 h-3 text-red-400" /> Not Found
          </p>
        </div>
      </div>

      <table className="w-full text-xs font-sans border-collapse">
        <thead>
          <tr className="border-b-2 border-stone-300">
            <th className="text-left py-2 pr-3 text-stone-600 font-bold whitespace-nowrap sticky left-0 bg-[#F4EFE6] z-10">Name</th>
            <th className="text-left py-2 pr-3 text-stone-600 font-bold whitespace-nowrap">Line</th>
            <th className="text-left py-2 pr-3 text-stone-600 font-bold whitespace-nowrap">Gen</th>
            {RECORD_TYPES.map(r => (
              <th key={r} className="text-center py-2 px-1 text-stone-500 font-medium text-[9px] uppercase tracking-wider min-w-[40px]">{r}</th>
            ))}
            <th className="text-center py-2 px-1 text-stone-500 font-medium text-[9px] uppercase tracking-wider min-w-[40px]">Other</th>
          </tr>
        </thead>
        <tbody>
          {PEOPLE_IDS.map(id => {
            const person = peopleMap.get(id);
            if (!person) return null;

            const genColor = person.generation === 0 ? 'text-stone-400' :
              person.generation === 1 ? 'text-stone-600' :
              person.generation === 2 ? 'text-stone-800 font-bold' :
              'text-stone-900 font-bold';

            const lineBadge = person.line === 'Emmi' ? 'bg-emerald-100 text-emerald-800' :
              person.line === 'Patanè' ? 'bg-blue-100 text-blue-800' :
              person.line === 'Buatti' ? 'bg-rose-100 text-rose-800' :
              person.line === 'Chiappini' ? 'bg-amber-100 text-amber-800' :
              'bg-stone-100 text-stone-600';

            const foundCount = person.records?.filter(r => r.status === 'Found').length ?? 0;
            const totalCount = person.records?.length ?? 0;

            return (
              <tr key={id} className="border-b border-stone-200 hover:bg-stone-100/50 transition-colors">
                <td className="py-1.5 pr-3 whitespace-nowrap sticky left-0 bg-[#F4EFE6] z-10">
                  <span className="font-medium text-stone-800">{person.name}</span>
                </td>
                <td className="py-1.5 pr-3">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${lineBadge}`}>{person.line}</span>
                </td>
                <td className={`py-1.5 pr-3 ${genColor}`}>G{person.generation}</td>
                {RECORD_TYPES.map(rt => {
                  const record = person.records?.find(r => r.type.startsWith(rt.split(' (')[0]) || r.type === rt);
                  return (
                    <td key={rt} className="text-center py-1.5 px-1">
                      {record ? (
                        <span title={record.notes}>
                          <StatusIcon status={record.status} record={rt} />
                        </span>
                      ) : (
                        <Minus className="w-3 h-3 text-stone-300 mx-auto" />
                      )}
                    </td>
                  );
                })}
                <td className="text-center py-1.5 px-1">
                  <span className={`text-[9px] font-bold ${foundCount === totalCount ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {foundCount}/{totalCount}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
