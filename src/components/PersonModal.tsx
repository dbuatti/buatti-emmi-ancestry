import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ExternalLink, Ship, Shield, Users } from 'lucide-react';
import { getLineBadgeColor } from '@/lib/constants';
import { calculateCompleteness, getScoreLabel, getScoreBadgeColor } from '@/lib/research';
import type { Person } from '@/types';

interface PersonModalProps {
  person: Person | null;
  people: Person[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPerson: (id: string) => void;
}

function ModalOverview({ person, people, onSelectPerson }: { person: Person; people: Person[]; onSelectPerson: (id: string) => void }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-start gap-2">
        <Calendar className="w-4 h-4 text-[#800020] mt-0.5 shrink-0" />
        <div>
          <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Birth</span>
          <p>{person.birthDate || 'Unknown'}</p>
          {person.birthPlace && <p className="text-xs text-stone-600 italic">{person.birthPlace}</p>}
        </div>
      </div>
      {!person.isLiving && (
        <div className="flex items-start gap-2 pt-2 border-t border-stone-200/60">
          <Clock className="w-4 h-4 text-[#800020] mt-0.5 shrink-0" />
          <div>
            <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Death</span>
            <p>{person.deathDate || 'Unknown'}</p>
            {person.deathPlace && <p className="text-xs text-stone-600 italic">{person.deathPlace}</p>}
          </div>
        </div>
      )}
      {person.burialPlace && (
        <div className="flex items-start gap-2 pt-2 border-t border-stone-200/60">
          <MapPin className="w-4 h-4 text-[#800020] mt-0.5 shrink-0" />
          <div>
            <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Burial</span>
            <p className="font-semibold">{person.burialPlace}</p>
            {person.burialDetails && <p className="text-xs text-stone-600 mt-0.5">{person.burialDetails}</p>}
            {person.burialLink && (
              <a href={person.burialLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#800020] hover:underline flex items-center gap-1 mt-1 font-sans">
                View Record <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
      {person.occupations && person.occupations.length > 0 && (
        <div className="flex items-start gap-2 pt-2 border-t border-stone-200/60">
          <Users className="w-4 h-4 text-[#800020] mt-0.5 shrink-0" />
          <div>
            <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Occupation</span>
            {person.occupations.map((o, i) => <p key={i} className="text-sm">{o}</p>)}
          </div>
        </div>
      )}
      <div className="pt-3 border-t border-stone-200 space-y-2">
        <h4 className="text-xs font-bold text-stone-500 font-sans uppercase tracking-wider">Family</h4>
        {person.spouses.length > 0 && (
          <div>
            <span className="text-xs text-stone-600 font-sans">Spouse:</span>
            <div className="mt-1">
              {person.spouses.map(sid => {
                const s = people.find(p => p.id === sid);
                return s ? (
                  <Button key={sid} variant="link" onClick={() => { onSelectPerson(sid); }} className="p-0 h-auto text-sm text-[#800020] hover:underline font-serif font-bold">
                    {s.name}
                  </Button>
                ) : null;
              })}
            </div>
          </div>
        )}
        {person.parents.length > 0 && (
          <div>
            <span className="text-xs text-stone-600 font-sans">Parents:</span>
            <div className="mt-1 flex flex-col">
              {person.parents.map(pid => {
                const p = people.find(x => x.id === pid);
                return p ? (
                  <Button key={pid} variant="link" onClick={() => { onSelectPerson(pid); }} className="p-0 h-auto text-sm text-[#800020] hover:underline font-serif text-left justify-start">
                    {p.name}
                  </Button>
                ) : null;
              })}
            </div>
          </div>
        )}
        {person.children.length > 0 && (
          <div>
            <span className="text-xs text-stone-600 font-sans">Children:</span>
            <div className="mt-1 flex flex-col">
              {person.children.map(cid => {
                const c = people.find(x => x.id === cid);
                return c ? (
                  <Button key={cid} variant="link" onClick={() => { onSelectPerson(cid); }} className="p-0 h-auto text-sm text-[#800020] hover:underline font-serif text-left justify-start">
                    {c.name}
                  </Button>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
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
        <li key={i} className="text-sm text-stone-700 leading-relaxed">{note}</li>
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

function ModalMilitary({ person }: { person: Person }) {
  if (!person.military) return null;
  return (
    <div className="flex items-start gap-2 pt-2 border-t border-stone-200/60">
      <Shield className="w-4 h-4 text-[#800020] mt-0.5 shrink-0" />
      <div>
        <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Military</span>
        {person.military.service && <p className="text-sm">{person.military.service}</p>}
        {person.military.captured && <p className="text-xs text-stone-600">Captured: {person.military.captured}</p>}
        {person.military.internment && <p className="text-xs text-stone-600">{person.military.internment}</p>}
        {person.military.repatriation && <p className="text-xs text-stone-600">Repatriated: {person.military.repatriation}</p>}
        {person.military.details && <p className="text-xs text-stone-600 mt-0.5">{person.military.details}</p>}
      </div>
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
            {r.notes && <p className="text-stone-600 mt-0.5">{r.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PersonModal({ person, people, open, onOpenChange, onSelectPerson }: PersonModalProps) {
  if (!person) return null;

  const lineColors: Record<string, string> = {
    Buatti: 'bg-[#800020]',
    Chiappini: 'bg-amber-700',
    Emmi: 'bg-emerald-800',
    Patanè: 'bg-blue-900',
  };

  const c = calculateCompleteness(person);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 bg-[#FAF6F0]">
        <div className={`${lineColors[person.line] || 'bg-stone-800'} p-5 text-white`}>
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
          </DialogTitle>
          <p className="text-sm opacity-80 mt-0.5">
            {person.birthDate || 'Unknown'}{person.deathDate ? ` – ${person.deathDate}` : person.isLiving ? ' – Living' : ''}
          </p>
          {person.occupations && person.occupations.length > 0 && (
            <p className="text-xs opacity-70 mt-1 italic">{person.occupations.join(', ')}</p>
          )}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full bg-stone-100 rounded-none border-b border-stone-200 grid grid-cols-4 text-xs sticky top-0 z-10">
            <TabsTrigger value="overview" className="rounded-none py-2.5">Overview</TabsTrigger>
            <TabsTrigger value="bio" className="rounded-none py-2.5">Notes</TabsTrigger>
            <TabsTrigger value="migration" className="rounded-none py-2.5">Migration</TabsTrigger>
            <TabsTrigger value="records" className="rounded-none py-2.5">Records</TabsTrigger>
          </TabsList>
          <ScrollArea className="max-h-[55vh] p-4">
            <TabsContent value="overview" className="mt-0">
              <ModalOverview person={person} people={people} onSelectPerson={onSelectPerson} />
              <ModalMilitary person={person} />
            </TabsContent>
            <TabsContent value="bio" className="mt-0">
              <ModalBio person={person} />
            </TabsContent>
            <TabsContent value="migration" className="mt-0">
              <ModalMigration person={person} />
            </TabsContent>
            <TabsContent value="records" className="mt-0">
              <ModalRecords person={person} />
            </TabsContent>
          </ScrollArea>
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