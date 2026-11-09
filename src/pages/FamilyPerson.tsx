import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { initialPeople } from '@/data/familyDataWrapper';
import type { Person } from '@/types';
import { Users, Calendar, MapPin, Briefcase, Home, Ship, Shield, GraduationCap, Ruler, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PersonRecordBrowser } from '@/components/PersonRecordBrowser';

const byId = (id: string) => initialPeople.find((p) => p.id === id);

const Row = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="flex gap-2 text-sm">
      <span className="text-stone-500 w-28 shrink-0">{label}</span>
      <span className="text-stone-800">{value}</span>
    </div>
  ) : null;

const FamilyPerson = () => {
  const { personId = '' } = useParams();
  const navigate = useNavigate();
  const person = initialPeople.find((p) => p.id === personId);

  const parents = (person?.parents ?? []).map(byId).filter(Boolean) as Person[];
  const spouses = (person?.spouses ?? []).map(byId).filter(Boolean) as Person[];
  const children = (person?.children ?? []).map(byId).filter(Boolean) as Person[];
  const siblings = (person?.siblings ?? []).map(byId).filter(Boolean) as Person[];

  const verifiedRecords = (person?.records ?? []).filter((r) => r.status === 'Found');
  const sources = person?.sources ?? [];

  if (!person) {
    return (
      <div className="p-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/family/people')}><ArrowLeft className="w-3 h-3 mr-1" /> Back</Button>
        <p className="mt-4 text-sm text-stone-600">No person with id "{personId}".</p>
      </div>
    );
  }

  const isLiving = person.isLiving;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate('/family/people')} className="font-sans">
        <ArrowLeft className="w-3 h-3 mr-1" /> People
      </Button>

      {/* Header */}
      <div className="rounded-xl bg-[#800020] text-white p-5 shadow">
        <div className="text-xs uppercase tracking-wider opacity-80">{person.line} family line</div>
        <h1 className="text-3xl font-serif mt-1">{person.name}</h1>
        <div className="text-sm opacity-90 mt-1">
          {person.birthDate || 'Birth date unknown'}{person.birthPlace ? ` — ${person.birthPlace}` : ''}
          {!isLiving && (person.deathDate ? `  ·  died ${person.deathDate}${person.deathPlace ? `, ${person.deathPlace}` : ''}` : '  ·  deceased')}
          {isLiving && '  ·  living'}
        </div>
        {person.burialPlace && (
          <div className="text-xs opacity-80 mt-2">Buried: {person.burialPlace}{person.burialDetails ? ` — ${person.burialDetails}` : ''}</div>
        )}
      </div>

      {/* Vital facts */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#800020] mb-3">Vital information</h2>
        <div className="space-y-1.5">
          <Row label="Born" value={person.birthDate ? `${person.birthDate}${person.birthPlace ? ', ' + person.birthPlace : ''}` : person.birthPlace} />
          <Row label="Died" value={!isLiving && person.deathDate ? `${person.deathDate}${person.deathPlace ? ', ' + person.deathPlace : ''}` : (isLiving ? 'Living' : null)} />
          <Row label="Buried" value={person.burialPlace ? `${person.burialPlace}${person.burialDetails ? ' — ' + person.burialDetails : ''}` : null} />
          <Row label="Gender" value={person.gender === 'M' ? 'Male' : person.gender === 'F' ? 'Female' : person.gender} />
        </div>
      </section>

      {/* Relationships */}
      {(parents.length || spouses.length || children.length || siblings.length) > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#800020] mb-3">Family</h2>
          <div className="space-y-3 text-sm">
            {parents.length > 0 && (
              <div>
                <div className="text-xs text-stone-500 mb-1">Parents</div>
                <div className="flex flex-wrap gap-2">
                  {parents.map((p) => (
                    <button key={p.id} onClick={() => navigate(`/family/people/${p.id}`)} className="rounded-full border border-stone-300 px-3 py-1 hover:bg-[#FAF6F0] hover:border-[#800020]">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {spouses.length > 0 && (
              <div>
                <div className="text-xs text-stone-500 mb-1">Spouse(s)</div>
                <div className="flex flex-wrap gap-2">
                  {spouses.map((p) => (
                    <button key={p.id} onClick={() => navigate(`/family/people/${p.id}`)} className="rounded-full border border-stone-300 px-3 py-1 hover:bg-[#FAF6F0] hover:border-[#800020]">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {children.length > 0 && (
              <div>
                <div className="text-xs text-stone-500 mb-1">Children</div>
                <div className="flex flex-wrap gap-2">
                  {children.map((p) => (
                    <button key={p.id} onClick={() => navigate(`/family/people/${p.id}`)} className="rounded-full border border-stone-300 px-3 py-1 hover:bg-[#FAF6F0] hover:border-[#800020]">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {siblings.length > 0 && (
              <div>
                <div className="text-xs text-stone-500 mb-1">Siblings</div>
                <div className="flex flex-wrap gap-2">
                  {siblings.map((p) => (
                    <button key={p.id} onClick={() => navigate(`/family/people/${p.id}`)} className="rounded-full border border-stone-300 px-3 py-1 hover:bg-[#FAF6F0] hover:border-[#800020]">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Life & work */}
      {(person.occupations?.length || person.residences?.length || person.education?.length || person.migration || person.military || person.physicalDescription) && (
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#800020] mb-3">Life & work</h2>
          <div className="space-y-3 text-sm">
            {person.occupations?.length ? (
              <div>
                <div className="text-xs text-stone-500 mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Occupations</div>
                <ul className="list-disc ml-5 text-stone-800">{person.occupations.map((o, i) => <li key={i}>{o}</li>)}</ul>
              </div>
            ) : null}
            {person.residences?.length ? (
              <div>
                <div className="text-xs text-stone-500 mb-1 flex items-center gap-1"><Home className="w-3 h-3" /> Residences</div>
                <ul className="list-disc ml-5 text-stone-800">{person.residences.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            ) : null}
            {person.education?.length ? (
              <div>
                <div className="text-xs text-stone-500 mb-1 flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Education</div>
                <ul className="list-disc ml-5 text-stone-800">{person.education.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            ) : null}
            {person.migration?.details && (
              <div>
                <div className="text-xs text-stone-500 mb-1 flex items-center gap-1"><Ship className="w-3 h-3" /> Migration</div>
                <p className="text-stone-800">{person.migration.details}</p>
                {person.migration.voyages?.length ? (
                  <ul className="mt-2 space-y-1 text-xs text-stone-700">
                    {person.migration.voyages.map((v, i) => (
                      <li key={i} className="border-l-2 border-stone-200 pl-2">
                        {v.ship && <span className="font-semibold">{v.ship}</span>}
                        {v.date && <span> — {v.date}</span>}
                        {v.departure && <span> (dep. {v.departure})</span>}
                        {v.arrival && <span> (arr. {v.arrival})</span>}
                        {v.details && <span className="block text-stone-500">{v.details}</span>}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {person.migration.settled && <p className="text-xs text-stone-600 mt-1">Settled: {person.migration.settled}</p>}
                {person.migration.sponsorship && <p className="text-xs text-stone-600">Sponsorship: {person.migration.sponsorship}</p>}
              </div>
            )}
            {person.military?.service && (
              <div>
                <div className="text-xs text-stone-500 mb-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Military service</div>
                <p className="text-stone-800">{person.military.service}</p>
                {person.military.captured && <p className="text-xs text-stone-600">Captured: {person.military.captured}</p>}
                {person.military.internment && <p className="text-xs text-stone-600">Internment: {person.military.internment}</p>}
                {person.military.repatriation && <p className="text-xs text-stone-600">Repatriation: {person.military.repatriation}</p>}
                {person.military.details && <p className="text-xs text-stone-600">{person.military.details}</p>}
              </div>
            )}
            {person.physicalDescription && (
              <div>
                <div className="text-xs text-stone-500 mb-1 flex items-center gap-1"><Ruler className="w-3 h-3" /> Physical description</div>
                <p className="text-stone-800 text-sm">
                  {[person.physicalDescription.height, person.physicalDescription.build, person.physicalDescription.hair, person.physicalDescription.eyes, person.physicalDescription.other]
                    .filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Verified records & sources */}
      {(verifiedRecords.length > 0 || sources.length > 0) && (
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#800020] mb-3">Records & sources</h2>
          {verifiedRecords.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-stone-500 mb-1">Verified records</div>
              <ul className="space-y-1.5">
                {verifiedRecords.map((r, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-semibold text-stone-800">{r.type}</span>
                    {r.notes && <span className="text-stone-600"> — {r.notes}</span>}
                    {r.link && (
                      <a href={r.link} target="_blank" rel="noreferrer" className="ml-2 text-[#800020] underline text-xs">View ↗</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sources.length > 0 && (
            <div>
              <div className="text-xs text-stone-500 mb-1">Sources</div>
              <ul className="space-y-1.5">
                {sources.map((s, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-semibold text-stone-800">{s.title}</span>
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
        </section>
      )}

      {/* Person record browser (swipe/click through records) */}
      {verifiedRecords.length > 0 && (
        <PersonRecordBrowser
          person={person}
          onOpenRecord={(rid) => navigate(`/research/records/${rid}`)}
        />
      )}

      {/* FamilySearch public link */}
      {person.familySearchId && (
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#800020] mb-3">FamilySearch</h2>
          <a href={`https://www.familysearch.org/tree/person/details/${person.familySearchId}`} target="_blank" rel="noreferrer" className="text-[#800020] underline">
            View {person.name} on FamilySearch ↗
          </a>
        </section>
      )}
    </div>
  );
};

export default FamilyPerson;
