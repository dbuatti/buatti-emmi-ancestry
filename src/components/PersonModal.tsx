import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plus, MapPin, ExternalLink, Ship, Shield, Users, GraduationCap, Ruler, FileText, Home, Check, Search, Minus } from 'lucide-react';
import { getLineBadgeColor, LINE_BG } from '@/lib/constants';
import { calculateCompleteness, getScoreLabel, getScoreBadgeColor } from '@/lib/research';
import { getWorkflowStepNumber } from '@/lib/records';
import { calculateAge } from '@/lib/tree';
import { LinkifiedText } from '@/components/LinkifiedText';
import { getAllRecords } from '@/lib/record-loader';
import { FamilySearchCheck } from '@/components/FamilySearchCheck';
import type { Person } from '@/types';

interface PersonModalProps {
  person: Person | null;
  people: Person[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPerson: (id: string) => void;
}

function Section({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 pt-2 first:pt-0 border-t first:border-t-0 border-stone-200/60">
      <Icon className="w-4 h-4 text-[#800020] mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="font-bold block text-xs text-stone-500 font-sans uppercase tracking-wider mb-0.5">{label}</span>
        {children}
      </div>
    </div>
  );
}

function ModalLifeEvents({ person }: { person: Person }) {
  const navigate = useNavigate();
  const [recordSteps, setRecordSteps] = useState<Map<string, { step: string; stepNumber: number }>>(new Map());
  const [recordsLoaded, setRecordsLoaded] = useState(false);

  // Load record steps from record.md front matter (source of truth)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const records = await getAllRecords();
        if (cancelled) return;
        const steps = new Map<string, { step: string; stepNumber: number }>();
        for (const rec of records) {
          steps.set(rec.id, { step: rec.step, stepNumber: rec.stepNumber });
        }
        setRecordSteps(steps);
        setRecordsLoaded(true);
      } catch (e) {
        setRecordsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!recordsLoaded || !person.lifeEvents || person.lifeEvents.length === 0) {
    return null;
  }

  const eventLabels: Record<string, { label: string; icon: React.ElementType }> = {
    birth: { label: 'Birth', icon: Calendar },
    baptism: { label: 'Baptism', icon: Plus },
    marriage: { label: 'Marriage', icon: Users },
    death: { label: 'Death', icon: Clock },
    burial: { label: 'Burial', icon: MapPin },
    migration_naturalisation: { label: 'Migration / Naturalisation', icon: Ship },
  };

  return (
    <div className="space-y-2 pt-2 border-t border-stone-200">
      <h4 className="text-xs font-bold text-stone-500 font-sans uppercase tracking-wider mb-2">Life Events</h4>
      <div className="space-y-1.5">
        {person.lifeEvents.map((ev) => {
          const info = eventLabels[ev.type];
          const stepInfo = ev.recordId ? recordSteps.get(ev.recordId) : undefined;
          const stepNum = stepInfo ? `Step ${stepInfo.stepNumber} of 5` : '—';
          const stepNumNum = stepInfo?.stepNumber ?? 0;
          const isLinked = ev.status === 'linked' && ev.recordId;
          const notVerified = isLinked && stepNumNum < 3;

          return (
            <div key={ev.type} className="flex items-start gap-2 bg-white p-2 rounded border border-stone-200 text-xs">
              <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                ev.status === 'linked' ? 'bg-emerald-500' : ev.status === 'known_no_record' ? 'bg-amber-400' : 'bg-stone-300'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  {isLinked ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 text-sm font-bold text-stone-800 text-emerald-800 underline underline-offset-4 hover:underline"
                      onClick={() => navigate(`/records/${ev.recordId}`)}
                    >
                      {info?.label || ev.type}
                    </Button>
                  ) : (
                    <span className={`font-bold text-stone-800 ${ev.status === 'linked' ? 'text-emerald-800' : 'text-stone-600'}`}>
                      {info?.label || ev.type}
                    </span>
                  )}
                  {ev.status === 'linked' && stepInfo && (
                    <span className="text-[10px] font-sans bg-emerald-100 text-emerald-800 rounded px-1.5 py-0.5 font-bold">
                      {stepNum}
                    </span>
                  )}
                  {ev.status === 'known_no_record' && (
                    <span className="text-[10px] font-sans bg-amber-100 text-amber-800 rounded px-1.5 py-0.5 font-bold">
                      Known, no record
                    </span>
                  )}
                  {ev.status === 'missing' && (
                    <span className="text-[10px] font-sans bg-stone-100 text-stone-500 rounded px-1.5 py-0.5 font-bold">
                      Missing
                    </span>
                  )}
                  {notVerified && ev.recordId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px] border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:text-emerald-900 ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/records/${ev.recordId}?mode=check`);
                      }}
                    >
                      Check
                    </Button>
                  )}
                </div>
                {ev.note && (
                  <p className="text-stone-600 text-[11px] leading-tight">{ev.note}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModalOverview({ person, people, onSelectPerson }: { person: Person; people: Person[]; onSelectPerson: (id: string) => void }) {
  return (
    <div className="space-y-3 text-sm">
      {person.birthDate && (
        <Section icon={Calendar} label="Birth">
          <p>{person.birthDate}</p>
          {person.birthPlace && <p className="text-xs text-stone-600 italic">{person.birthPlace}</p>}
        </Section>
      )}
      {!person.isLiving && person.deathDate && (
        <Section icon={Clock} label="Death">
          <p>{person.deathDate}</p>
          {person.deathPlace && <p className="text-xs text-stone-600 italic">{person.deathPlace}</p>}
        </Section>
      )}
      {person.burialPlace && (
        <Section icon={MapPin} label="Burial">
          <p className="font-semibold">{person.burialPlace}</p>
          {person.burialDetails && <p className="text-xs text-stone-600 mt-0.5">{person.burialDetails}</p>}
          {person.burialLink && (
            <a href={person.burialLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#800020] hover:underline flex items-center gap-1 mt-1 font-sans">
              View Record <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </Section>
      )}
      {person.occupations && person.occupations.length > 0 && (
        <Section icon={Users} label="Occupation">
          {person.occupations.map((o, i) => <p key={i}>{o}</p>)}
        </Section>
      )}
      {person.education && person.education.length > 0 && (
        <Section icon={GraduationCap} label="Education">
          {person.education.map((e, i) => <p key={i} className="text-sm">{e}</p>)}
        </Section>
      )}
      {person.physicalDescription && (
        <Section icon={Ruler} label="Physical Description">
          {person.physicalDescription.height && <p className="text-sm">Height: {person.physicalDescription.height}</p>}
          {person.physicalDescription.build && <p className="text-sm">Build: {person.physicalDescription.build}</p>}
          {person.physicalDescription.hair && <p className="text-sm">Hair: {person.physicalDescription.hair}</p>}
          {person.physicalDescription.eyes && <p className="text-sm">Eyes: {person.physicalDescription.eyes}</p>}
          {person.physicalDescription.other && <p className="text-sm text-stone-600">{person.physicalDescription.other}</p>}
        </Section>
      )}
      {person.military && (
        <Section icon={Shield} label="Military Service">
          {person.military.service && <p className="text-sm">{person.military.service}</p>}
          {person.military.captured && <p className="text-xs text-stone-600 mt-0.5">Captured: {person.military.captured}</p>}
          {person.military.internment && <p className="text-xs text-stone-600">{person.military.internment}</p>}
          {person.military.repatriation && <p className="text-xs text-stone-600">Repatriated: {person.military.repatriation}</p>}
          {person.military.details && <p className="text-xs text-stone-600 mt-0.5">{person.military.details}</p>}
        </Section>
      )}
      {person.italianAddress && (
        <Section icon={Home} label="Italian Address">
          <p className="text-sm">{person.italianAddress}</p>
        </Section>
      )}
      {person.passport && (
        <Section icon={FileText} label="Passport">
          <p className="text-sm">No. {person.passport.number}</p>
          <p className="text-xs text-stone-600">Issued: {person.passport.issued} by {person.passport.issuedBy}</p>
        </Section>
      )}
      {person.alienRegistration && (
        <Section icon={FileText} label="Alien Registration">
          <p className="text-sm">No. {person.alienRegistration}</p>
        </Section>
      )}
      <div className="pt-2 border-t border-stone-200">
        <h4 className="text-xs font-bold text-stone-500 font-sans uppercase tracking-wider mb-2">Family</h4>
        <div className="space-y-1.5">
          {person.spouses.length > 0 && (
            <div>
              <span className="text-xs text-stone-600 font-sans font-semibold">Spouse:</span>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {person.spouses.map(sid => {
                  const s = people.find(p => p.id === sid);
                  return s ? (
                    <Button key={sid} variant="link" onClick={() => onSelectPerson(sid)} className="p-0 h-auto text-sm text-[#800020] hover:underline font-serif font-bold">
                      {s.name}
                    </Button>
                  ) : null;
                })}
              </div>
            </div>
          )}
          {person.parents.length > 0 && (
            <div>
              <span className="text-xs text-stone-600 font-sans font-semibold">Parents:</span>
              <div className="mt-0.5 flex flex-col">
                {person.parents.map(pid => {
                  const p = people.find(x => x.id === pid);
                  return p ? (
                    <Button key={pid} variant="link" onClick={() => onSelectPerson(pid)} className="p-0 h-auto text-sm text-[#800020] hover:underline font-serif text-left justify-start">
                      {p.name}
                    </Button>
                  ) : null;
                })}
              </div>
            </div>
          )}
          {person.children.length > 0 && (
            <div>
              <span className="text-xs text-stone-600 font-sans font-semibold">Children:</span>
              <div className="mt-0.5 flex flex-col">
                {person.children.map(cid => {
                  const c = people.find(x => x.id === cid);
                  return c ? (
                    <Button key={cid} variant="link" onClick={() => onSelectPerson(cid)} className="p-0 h-auto text-sm text-[#800020] hover:underline font-serif text-left justify-start">
                      {c.name}
                    </Button>
                  ) : null;
                })}
              </div>
            </div>
          )}
          {person.siblings && person.siblings.length > 0 && (
            <div>
              <span className="text-xs text-stone-600 font-sans font-semibold">Siblings:</span>
              <div className="mt-0.5 flex flex-col">
                {person.siblings.map((s, i) => (
                  <span key={i} className="text-sm text-stone-600">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <ModalLifeEvents person={person} />
    </div>
  );
}

function ModalBio({ person }: { person: Person }) {
  if (!person.notes || person.notes.length === 0) {
    return <p className="text-sm text-stone-500 italic">No notes recorded.</p>;
  }
  return (
    <ul className="space-y-2">
      {person.notes.map((note, i) => (
        <li key={i} className="text-sm text-stone-700 leading-relaxed">
          <LinkifiedText text={note} />
        </li>
      ))}
    </ul>
  );
}

function ModalMigration({ person }: { person: Person }) {
  if (!person.migration) {
    return <p className="text-sm text-stone-500 italic">No migration data recorded.</p>;
  }
  return (
    <div className="space-y-3">
      {person.migration.details && <p className="text-sm text-stone-700">{person.migration.details}</p>}
      {person.migration.sponsorship && (
        <p className="text-xs text-stone-600 font-sans"><span className="font-bold">Sponsor:</span> {person.migration.sponsorship}</p>
      )}
      {person.migration.settled && (
        <p className="text-xs text-stone-600 font-sans"><span className="font-bold">Settled:</span> {person.migration.settled}</p>
      )}
      {person.migration.voyages && person.migration.voyages.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-stone-200">
          <h4 className="text-xs font-bold text-stone-500 font-sans uppercase">Voyages</h4>
          {person.migration.voyages.map((v, i) => (
            <div key={i} className="flex items-start gap-2 bg-white p-2 rounded border border-stone-200">
              <Ship className="w-4 h-4 text-[#800020] mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">{v.ship || 'Unknown ship'}</p>
                {v.date && <p className="text-stone-500">{v.date}</p>}
                {v.departure && <p className="text-stone-500">Departure: {v.departure}</p>}
                {v.arrival && <p className="text-stone-500">Arrival: {v.arrival}</p>}
                {v.details && <p className="text-stone-600 mt-0.5">{v.details}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModalRecords({ person }: { person: Person }) {
  if (!person.records || person.records.length === 0) {
    return <p className="text-sm text-stone-500 italic">No records documented.</p>;
  }
  return (
    <div className="space-y-2">
      {person.records.map((r, i) => (
        <div key={i} className="flex items-start gap-2 bg-white p-2 rounded border border-stone-200 text-xs">
          <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${r.status === 'Found' ? 'bg-emerald-500' : r.status === 'Searching' ? 'bg-amber-400' : 'bg-stone-300'}`} />
          <div>
            <p className="font-bold text-stone-800">{r.type}</p>
            <span className={`inline-block text-[10px] font-sans font-bold px-1.5 py-0.5 rounded ${r.status === 'Found' ? 'bg-emerald-100 text-emerald-800' : r.status === 'Searching' ? 'bg-amber-100 text-amber-800' : r.status === 'Requested' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-500'}`}>
              {r.status}
            </span>
            {r.notes && (
              <p className="text-stone-600 mt-0.5">
                <LinkifiedText text={r.notes} />
              </p>
            )}
            {r.link && (
              <a
                href={r.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#800020] hover:underline inline-flex items-center gap-1 mt-1 font-sans text-[11px] font-bold"
              >
                Open record <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PersonModal({ person, people, open, onOpenChange, onSelectPerson }: PersonModalProps) {
  if (!person) return null;

  const c = calculateCompleteness(person);
  const age = calculateAge(person.birthDate, person.deathDate, person.isLiving);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] p-0 gap-0 flex flex-col bg-[#FAF6F0]">
        <div className={`${LINE_BG[person.line] ?? LINE_BG.Other} p-5 text-white`}>
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-white/20 text-white border-0 text-[10px] font-sans">
              {person.line} Line · Gen {person.generation}
            </Badge>
            <Badge className={`${getScoreBadgeColor(c.score)} font-sans text-[10px] gap-1 border-0`}>
              <span>{c.score}%</span>
              <span className="opacity-80">({getScoreLabel(c.score)})</span>
            </Badge>
          </div>
          <DialogTitle className="text-xl font-serif flex items-center gap-2">
            {person.name}
            <span>{person.gender === 'M' ? '♂' : '♀'}</span>
            {age && (
              <span className="text-[10px] font-sans bg-white/20 rounded-full px-2 py-0.5 font-bold" title={age.estimated ? `Estimated ~${age.age} years` : `${age.age} years`}>
                {age.estimated ? '~' : ''}{age.age}y
              </span>
            )}
          </DialogTitle>
          <p className="text-sm opacity-80 mt-0.5">
            {person.birthDate || 'Unknown'}{person.deathDate ? ` – ${person.deathDate}` : person.isLiving ? ' – Living' : ''}
          </p>
          {person.occupations && person.occupations.length > 0 && (
            <p className="text-xs opacity-70 mt-1 italic">{person.occupations.join(', ')}</p>
          )}
        </div>

        <Tabs defaultValue="overview" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="w-full bg-stone-100 rounded-none border-b border-stone-200 grid grid-cols-5 text-xs shrink-0">
            <TabsTrigger value="overview" className="rounded-none py-2.5">Overview</TabsTrigger>
            <TabsTrigger value="bio" className="rounded-none py-2.5">Notes</TabsTrigger>
            <TabsTrigger value="migration" className="rounded-none py-2.5">Migration</TabsTrigger>
            <TabsTrigger value="records" className="rounded-none py-2.5">Records</TabsTrigger>
            <TabsTrigger value="familysearch" className="rounded-none py-2.5">FamilySearch</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="flex-1 overflow-y-auto mt-0 p-4">
            <ModalOverview person={person} people={people} onSelectPerson={onSelectPerson} />
          </TabsContent>
          <TabsContent value="bio" className="flex-1 overflow-y-auto mt-0 p-4">
            <ModalBio person={person} />
          </TabsContent>
          <TabsContent value="migration" className="flex-1 overflow-y-auto mt-0 p-4">
            <ModalMigration person={person} />
          </TabsContent>
          <TabsContent value="records" className="flex-1 overflow-y-auto mt-0 p-4">
            <ModalRecords person={person} />
          </TabsContent>
          <TabsContent value="familysearch" className="flex-1 overflow-y-auto mt-0 p-4">
            <FamilySearchCheck person={person} people={people} />
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-2 px-4 py-2 border-t border-stone-200 text-[10px] text-stone-500 font-sans bg-stone-50">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Found
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-2" /> Searching
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 ml-2" /> Requested
          <span className="inline-block w-2 h-2 rounded-full bg-stone-300 ml-2" /> Not Found
        </div>
      </DialogContent>
    </Dialog>
  );
}