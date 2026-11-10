import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { initialPeople } from '@/data/familyDataWrapper';
import { FileText } from 'lucide-react';

const FamilySources = () => {
  const navigate = useNavigate();
  const groups = useMemo(() => {
    return initialPeople
      .map((p) => ({
        person: p,
        records: (p.records ?? []).filter((r) => r.status === 'Found'),
        sources: p.sources ?? [],
      }))
      .filter((g) => g.records.length > 0 || g.sources.length > 0);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#800020] font-serif">Records & sources</h2>
        <p className="text-xs text-stone-500 font-sans">Verified records and sources for our family, grouped by person.</p>
      </div>
      {groups.length === 0 && <p className="text-sm text-stone-500">No verified records yet.</p>}
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.person.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <button onClick={() => navigate(`/family/people/${g.person.id}`)} className="text-base font-semibold text-[#800020] hover:underline">
              {g.person.name}
            </button>
            <div className="text-xs text-stone-500 mb-2">{g.person.birthDate || ''}{g.person.birthPlace ? `, ${g.person.birthPlace}` : ''}</div>
            {g.records.length > 0 && (
              <div className="mb-2">
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Records</div>
                <ul className="space-y-1">
                  {g.records.map((r, i) => (
                    <li key={i} className="text-sm text-stone-800 flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#800020] mt-0.5 shrink-0" />
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        <span className="font-semibold">{r.type}</span>
                        {r.notes && <span className="text-stone-600"> — {r.notes}</span>}
                        {r.link && (
                          <a href={r.link} target="_blank" rel="noreferrer" className="ml-2 text-[#800020] underline text-xs">View ↗</a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {g.sources.length > 0 && (
              <div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Sources</div>
                <ul className="space-y-1">
                  {g.sources.map((s, i) => (
                    <li key={i} className="text-sm text-stone-800">
                      <span className="font-semibold">{s.title}</span>
                      <span className="text-stone-500 text-xs"> ({s.type})</span>
                      {s.reference && <span className="text-stone-600"> — {s.reference}</span>}
                      {s.link && (
                        <a href={s.link} target="_blank" rel="noreferrer" className="ml-2 text-[#800020] underline text-xs">View ↗</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FamilySources;
