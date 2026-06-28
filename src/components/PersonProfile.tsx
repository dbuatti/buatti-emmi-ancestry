import { Calendar, Clock, MapPin, ExternalLink, Ship, Shield, ArrowRight, Trash2, Users, CheckCircle2, Circle, Search as SearchIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getLineBadgeColor } from '@/lib/constants';
import { calculateCompleteness, getScoreColor, getScoreLabel, getScoreBadgeColor } from '@/lib/research';
import type { Person } from '@/types';

interface PersonProfileProps {
  people: Person[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
  onDelete: (id: string) => void;
  initialPeople: Person[];
}

function ProfileTabOverview({ person, people, onSelectPerson }: { person: Person; people: Person[]; onSelectPerson: (id: string) => void }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-2">
        <Calendar className="w-4 h-4 text-[#800020] mt-0.5 shrink-0" />
        <div>
          <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Birth</span>
          <p>{person.birthDate || 'Unknown / to be confirmed'}</p>
          {person.birthPlace && <p className="text-xs text-stone-600 italic">{person.birthPlace}</p>}
        </div>
      </div>
      {!person.isLiving && (
        <div className="flex items-start gap-2 pt-2 border-t border-stone-200/60">
          <Clock className="w-4 h-4 text-[#800020] mt-0.5 shrink-0" />
          <div>
            <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Death</span>
            <p>{person.deathDate || 'Unknown / to be confirmed'}</p>
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
                View Cemetery Record <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
      <div className="pt-4 border-t border-stone-200 space-y-2">
        <h4 className="text-xs font-bold text-stone-500 font-sans uppercase tracking-wider">Family Connections</h4>
        <div>
          <span className="text-xs text-stone-600 font-sans">Spouse:</span>
          <div className="mt-1">
            {person.spouses.length > 0 ? (
              person.spouses.map(spouseId => {
                const spouse = people.find(p => p.id === spouseId);
                return spouse ? (
                  <Button key={spouseId} variant="link" onClick={() => onSelectPerson(spouseId)}
                    className="p-0 h-auto text-sm text-[#800020] hover:underline font-serif font-bold">
                    {spouse.name}
                  </Button>
                ) : <span key={spouseId} className="text-sm italic">Unknown Spouse</span>;
              })
            ) : <span className="text-sm italic text-stone-500">None recorded</span>}
          </div>
        </div>
        <div>
          <span className="text-xs text-stone-600 font-sans">Parents:</span>
          <div className="mt-1 flex flex-col gap-1">
            {person.parents.length > 0 ? (
              person.parents.map(parentId => {
                const parent = people.find(p => p.id === parentId);
                return parent ? (
                  <Button key={parentId} variant="link" onClick={() => onSelectPerson(parentId)}
                    className="p-0 h-auto text-sm text-[#800020] hover:underline font-serif text-left justify-start">
                    • {parent.name}
                  </Button>
                ) : null;
              })
            ) : <span className="text-sm italic text-stone-500">None recorded</span>}
          </div>
        </div>
        <div>
          <span className="text-xs text-stone-600 font-sans">Children:</span>
          <div className="mt-1 flex flex-col gap-1">
            {person.children.length > 0 ? (
              person.children.map(childId => {
                const child = people.find(p => p.id === childId);
                return child ? (
                  <Button key={childId} variant="link" onClick={() => onSelectPerson(childId)}
                    className="p-0 h-auto text-sm text-[#800020] hover:underline font-serif text-left justify-start">
                    • {child.name}
                  </Button>
                ) : null;
              })
            ) : <span className="text-sm italic text-stone-500">None recorded</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTabBio({ person }: { person: Person }) {
  return (
    <div className="space-y-4">
      {person.occupations && person.occupations.length > 0 && (
        <div>
          <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Occupations</span>
          <p className="text-sm">{person.occupations.join(', ')}</p>
        </div>
      )}
      {person.residences && person.residences.length > 0 && (
        <div>
          <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Residences</span>
          <p className="text-sm">{person.residences.join(' • ')}</p>
        </div>
      )}
      {person.physicalDescription && (
        <div className="bg-stone-100 p-3 rounded-lg border border-stone-200 text-xs space-y-1 font-sans">
          <span className="font-bold block text-stone-500 uppercase tracking-wider text-[10px]">Physical Description</span>
          {person.physicalDescription.height && <p><strong>Height:</strong> {person.physicalDescription.height}</p>}
          {person.physicalDescription.build && <p><strong>Build:</strong> {person.physicalDescription.build}</p>}
          {person.physicalDescription.hair && <p><strong>Hair:</strong> {person.physicalDescription.hair}</p>}
          {person.physicalDescription.eyes && <p><strong>Eyes:</strong> {person.physicalDescription.eyes}</p>}
          {person.physicalDescription.other && <p><strong>Other:</strong> {person.physicalDescription.other}</p>}
        </div>
      )}
      <div>
        <span className="font-bold block text-xs text-stone-500 font-sans uppercase mb-2">Historical Notes</span>
        {person.notes && person.notes.length > 0 ? (
          <ul className="space-y-2 text-sm list-disc pl-4 text-stone-800">
            {person.notes.map((note, idx) => <li key={idx}>{note}</li>)}
          </ul>
        ) : (
          <p className="text-sm italic text-stone-500">No historical notes recorded.</p>
        )}
      </div>
    </div>
  );
}

function ProfileTabMigration({ person }: { person: Person }) {
  return (
    <div className="space-y-4">
      {person.migration ? (
        <div className="space-y-3">
          <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/40">
            <span className="font-bold block text-xs text-amber-800 font-sans uppercase flex items-center gap-1">
              <Ship className="w-3.5 h-3.5" /> Migration Details
            </span>
            <p className="text-sm mt-1 text-stone-800">{person.migration.details}</p>
            {person.migration.sponsorship && (
              <p className="text-xs mt-2 text-stone-600">
                <strong>Sponsorship:</strong> {person.migration.sponsorship}
              </p>
            )}
          </div>
          {person.migration.voyages?.map((voyage, idx) => (
            <div key={idx} className="border border-stone-200 p-3 rounded-lg bg-white text-xs space-y-1 font-sans">
              <p className="font-bold text-stone-800 text-sm">Voyage: {voyage.ship}</p>
              <p><strong>Departure:</strong> {voyage.departure} • <strong>Arrival:</strong> {voyage.arrival}</p>
              <p><strong>Date:</strong> {voyage.date}</p>
              {voyage.details && <p className="text-stone-600 italic mt-1">{voyage.details}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-stone-500">No migration records on file.</p>
      )}
      {person.military && (
        <div className="border-t border-stone-200 pt-4 space-y-3">
          <span className="font-bold block text-xs text-stone-500 font-sans uppercase flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-[#800020]" /> WWII Military Service
          </span>
          <div className="bg-stone-100 p-3 rounded-lg border border-stone-200 text-xs space-y-2 font-sans">
            <p><strong>Service:</strong> {person.military.service}</p>
            <p><strong>Captured:</strong> {person.military.captured}</p>
            <p><strong>Internment:</strong> {person.military.internment}</p>
            <p><strong>Repatriation:</strong> {person.military.repatriation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTabRecords({ person }: { person: Person }) {
  const c = calculateCompleteness(person);

  return (
    <div className="space-y-4">
      <div className="bg-white p-3 rounded-lg border border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-xs text-stone-500 font-sans uppercase">Record Inventory</span>
          <span className={`text-xs font-bold font-sans px-2 py-0.5 rounded-full border ${getScoreColor(c.score)}`}>
            {c.score}% complete
          </span>
        </div>
        {person.records && person.records.length > 0 ? (
          <div className="space-y-1.5">
            {person.records.map((record, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs font-sans py-1.5 border-b border-stone-100 last:border-0">
                {record.status === 'Found' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : record.status === 'Searching' ? (
                  <SearchIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-stone-800">{record.type}</span>
                    <Badge className={
                      record.status === 'Found' ? 'bg-emerald-700 text-white text-[9px]' :
                      record.status === 'Searching' ? 'bg-amber-600 text-white text-[9px]' :
                      'bg-stone-500 text-white text-[9px]'
                    }>{record.status}</Badge>
                  </div>
                  {record.notes && <p className="text-stone-500 text-[10px] mt-0.5 leading-tight">{record.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-stone-500">No records inventory set up for this person.</p>
        )}
      </div>

      <div className="border-t border-stone-200 pt-3">
        <span className="font-bold block text-xs text-stone-500 font-sans uppercase mb-1">Research Status</span>
        <Badge className={
          person.researchStatus.status === 'Confirmed' ? 'bg-emerald-800 text-white' :
          person.researchStatus.status === 'In Progress' ? 'bg-amber-700 text-white' :
          person.researchStatus.status === 'Ruled Out' ? 'bg-rose-800 text-white' :
          'bg-stone-600 text-white'
        }>
          {person.researchStatus.status}
        </Badge>
        {person.researchStatus.details && (
          <p className="text-sm mt-2 text-stone-700 italic">"{person.researchStatus.details}"</p>
        )}
      </div>
      {person.researchStatus.nextSteps && person.researchStatus.nextSteps.length > 0 && (
        <div className="border-t border-stone-200 pt-3">
          <span className="font-bold block text-xs text-stone-500 font-sans uppercase mb-2">Next Research Steps</span>
          <ul className="space-y-1.5 text-xs font-sans text-stone-800">
            {person.researchStatus.nextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-[#800020] shrink-0 mt-0.5" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {person.sources && person.sources.length > 0 && (
        <div className="border-t border-stone-200 pt-3">
          <span className="font-bold block text-xs text-stone-500 font-sans uppercase mb-2">Sources & Records</span>
          <div className="space-y-2">
            {person.sources.map((source, idx) => (
              <div key={idx} className="text-xs font-sans bg-white p-2 rounded border border-stone-200">
                <p className="font-bold text-stone-800">{source.title}</p>
                <p className="text-stone-500 text-[10px]">{source.type} {source.reference && `• Ref: ${source.reference}`}</p>
                {source.link && (
                  <a href={source.link} target="_blank" rel="noopener noreferrer"
                    className="text-[#800020] hover:underline flex items-center gap-0.5 mt-1 text-[10px]">
                    Access Record <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PersonProfile({ people, selectedPersonId, onSelectPerson, onDelete, initialPeople }: PersonProfileProps) {
  const person = people.find(p => p.id === selectedPersonId) || people[0];
  if (!person) return null;

  return (
    <Card className="border-stone-300 bg-[#FAF6F0] shadow-md sticky top-6">
      <CardHeader className="bg-[#F4EFE6] border-b border-stone-200 pb-4">
        <div className="flex justify-between items-start">
          <Badge className={getLineBadgeColor(person.line)}>
            {person.line} Line
          </Badge>
          <div className="flex gap-1.5">
            {(() => {
              const c = calculateCompleteness(person);
              return (
                <Badge className={getScoreBadgeColor(c.score) + ' font-sans text-[10px] gap-1'}>
                  <span>{c.score}%</span>
                  <span className="opacity-80">({getScoreLabel(c.score)})</span>
                </Badge>
              );
            })()}
            <Badge variant="outline" className="font-sans text-[10px]">
              Gen {person.generation}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-2xl font-serif text-[#800020] mt-2 flex items-center gap-2">
          {person.name}
          {person.gender === 'M' ? '♂' : '♀'}
        </CardTitle>
        <CardDescription className="font-sans text-xs text-stone-600">
          {person.birthDate || 'Unknown'} – {person.deathDate || (person.isLiving ? 'Living' : 'Unknown')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full bg-stone-100 rounded-none border-b border-stone-200 grid grid-cols-4 text-xs">
            <TabsTrigger value="overview" className="rounded-none py-2">Overview</TabsTrigger>
            <TabsTrigger value="bio" className="rounded-none py-2">Bio/Notes</TabsTrigger>
            <TabsTrigger value="migration" className="rounded-none py-2">Migration</TabsTrigger>
            <TabsTrigger value="records" className="rounded-none py-2">Records</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[400px] p-4">
            <TabsContent value="overview" className="space-y-4 mt-0">
              <ProfileTabOverview person={person} people={people} onSelectPerson={onSelectPerson} />
            </TabsContent>
            <TabsContent value="bio" className="space-y-4 mt-0">
              <ProfileTabBio person={person} />
            </TabsContent>
            <TabsContent value="migration" className="space-y-4 mt-0">
              <ProfileTabMigration person={person} />
            </TabsContent>
            <TabsContent value="records" className="space-y-4 mt-0">
              <ProfileTabRecords person={person} />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {!initialPeople.some(p => p.id === person.id) && (
          <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end">
            <Button variant="destructive" size="sm" onClick={() => onDelete(person.id)}
              className="font-sans text-xs flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete Custom Record
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
