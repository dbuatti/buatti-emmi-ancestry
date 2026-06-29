import { useState, useEffect, useMemo } from 'react';
import { initialPeople, initialResearchLeads, initialOpenQuestions, Person, ResearchLead, OpenQuestion } from '../data/familyData';
import { BookOpen, GitFork, Users, Clock, Info, Heart, Plus, ScrollText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { calculateCompleteness } from '@/lib/research';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { AppHeader } from '@/components/AppHeader';
import { PedigreeChart } from '@/components/PedigreeChart';
import { PersonProfile } from '@/components/PersonProfile';
import { AncestorsDirectory } from '@/components/AncestorsDirectory';
import { ResearchLog } from '@/components/ResearchLog';
import { TimelineTab } from '@/components/TimelineTab';
import { EvidenceWiki } from '@/components/EvidenceWiki';
import { STORAGE_KEYS, DEFAULT_NEW_PERSON } from '@/lib/constants';

const Index = () => {
  const { toast } = useToast();

  const [people, setPeople] = useState<Person[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PEOPLE);
    return saved ? JSON.parse(saved) : initialPeople;
  });

  const [leads, setLeads] = useState<ResearchLead[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEADS);
    return saved ? JSON.parse(saved) : initialResearchLeads;
  });

  const [questions, setQuestions] = useState<OpenQuestion[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    return saved ? JSON.parse(saved) : initialOpenQuestions;
  });

  const [selectedPersonId, setSelectedPersonId] = useState<string>('ezio-buatti');
  const [searchQuery, setSearchQuery] = useState('');
  const [lineFilter, setLineFilter] = useState<string>('all');
  const [genFilter, setGenFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [activeTab, setActiveTab] = useState('tree');

  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPerson, setNewPerson] = useState<Partial<Person>>({ ...DEFAULT_NEW_PERSON });

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people)); }, [people]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions)); }, [questions]);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerson.name) return;

    const id = newPerson.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const personToAdd: Person = {
      id,
      name: newPerson.name,
      generation: Number(newPerson.generation) || 2,
      line: (newPerson.line as Person['line']) || 'Other',
      gender: (newPerson.gender as Person['gender']) || 'M',
      birthDate: newPerson.birthDate || undefined,
      birthPlace: newPerson.birthPlace || undefined,
      deathDate: newPerson.deathDate || undefined,
      deathPlace: newPerson.deathPlace || undefined,
      burialPlace: newPerson.burialPlace || undefined,
      burialDetails: newPerson.burialDetails || undefined,
      spouses: newPerson.spouses || [],
      parents: newPerson.parents || [],
      children: newPerson.children || [],
      notes: newPerson.notes?.length ? newPerson.notes : undefined,
      occupations: newPerson.occupations?.length ? newPerson.occupations : undefined,
      residences: newPerson.residences?.length ? newPerson.residences : undefined,
      researchStatus: {
        status: newPerson.researchStatus?.status || 'Outstanding',
        details: newPerson.researchStatus?.details || ''
      }
    };

    setPeople([...people, personToAdd]);
    setIsAddPersonOpen(false);
    setSelectedPersonId(id);
    toast({ title: "Ancestor Added", description: `${personToAdd.name} has been added to the family tree.` });
    setNewPerson({ ...DEFAULT_NEW_PERSON });
  };

  const deletePerson = (id: string) => {
    if (confirm("Are you sure you want to delete this person? This cannot be undone.")) {
      setPeople(people.filter(p => p.id !== id));
      if (selectedPersonId === id) setSelectedPersonId(people[0]?.id || '');
      toast({ title: "Person Deleted", description: "The ancestor has been removed from the tree.", variant: "destructive" });
    }
  };

  const resetToDefault = () => {
    if (confirm("Are you sure you want to reset all data to the original compiled records? Any custom changes will be lost.")) {
      [STORAGE_KEYS.PEOPLE, STORAGE_KEYS.LEADS, STORAGE_KEYS.QUESTIONS].forEach(k => localStorage.removeItem(k));
      setPeople(initialPeople);
      setLeads(initialResearchLeads);
      setQuestions(initialOpenQuestions);
      setSelectedPersonId('ezio-buatti');
      toast({ title: "Data Reset", description: "All records have been restored to the original compiled state." });
    }
  };

  const filteredPeople = useMemo(() => {
    const filtered = people.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.birthPlace && p.birthPlace.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.occupations && p.occupations.some(o => o.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesLine = lineFilter === 'all' || p.line === lineFilter;
      const matchesGen = genFilter === 'all' || p.generation === Number(genFilter);
      return matchesSearch && matchesLine && matchesGen;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        return calculateCompleteness(a).score - calculateCompleteness(b).score;
      }
      if (sortBy === 'completeness') {
        return calculateCompleteness(b).score - calculateCompleteness(a).score;
      }
      return a.name.localeCompare(b.name);
    });
  }, [people, searchQuery, lineFilter, genFilter, sortBy]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif selection:bg-[#800020]/20 selection:text-[#800020]">
      <AppHeader
        people={people}
        leads={leads}
        questions={questions}
        onReset={resetToDefault}
        onAddPerson={() => setIsAddPersonOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* NEXT TASK BANNER */}
        <div className="mb-6 bg-emerald-900 text-emerald-50 border border-emerald-700 rounded-xl p-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-800 rounded-lg p-2 mt-0.5">
              <BookOpen className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold tracking-wide uppercase">Next Research Task</p>
              <p className="text-base mt-1">
                Find <strong>Egidio Emmi</strong>'s birth record (son of Antonino Emmi + Rosaria Raiti) in{' '}
                <strong>Linguaglossa Nati 1868–1872</strong>
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <a href="https://antenati.cultura.gov.it/ark:/12657/an_ua81363/?lang=en" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                  1868 ↗
                </a>
                <a href="https://antenati.cultura.gov.it/ark:/12657/an_ua81364/LoY2Axj?lang=en" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                  1869 ↗
                </a>
                <a href="https://antenati.cultura.gov.it/ark:/12657/an_ua81365/5xepaMV?lang=en" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                  1870 ↗
                </a>
                <a href="https://antenati.cultura.gov.it/ark:/12657/an_ua81366/LpAx9rk?lang=en" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                  1871 ↗
                </a>
                <a href="https://antenati.cultura.gov.it/ark:/12657/an_ua81367/LpAx9bk?lang=en" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                  1872 ↗
                </a>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-2">
            <TabsList className="bg-[#F4EFE6] border border-stone-200 p-1">
              <TabsTrigger value="tree" className="font-sans data-[state=active]:bg-[#800020] data-[state=active]:text-white flex items-center gap-2">
                <GitFork className="w-4 h-4" /> Interactive Tree
              </TabsTrigger>
              <TabsTrigger value="directory" className="font-sans data-[state=active]:bg-[#800020] data-[state=active]:text-white flex items-center gap-2">
                <Users className="w-4 h-4" /> Ancestors Directory
              </TabsTrigger>
              <TabsTrigger value="research" className="font-sans data-[state=active]:bg-[#800020] data-[state=active]:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Research Log & Leads
              </TabsTrigger>
              <TabsTrigger value="timeline" className="font-sans data-[state=active]:bg-[#800020] data-[state=active]:text-white flex items-center gap-2">
                <Clock className="w-4 h-4" /> Migration & Timeline
              </TabsTrigger>
              <TabsTrigger value="evidence" className="font-sans data-[state=active]:bg-[#800020] data-[state=active]:text-white flex items-center gap-2">
                <ScrollText className="w-4 h-4" /> Evidence Wiki
              </TabsTrigger>
            </TabsList>
            <div className="text-xs text-stone-500 font-sans italic flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#800020]" /> Click on any ancestor to view their full profile.
            </div>
          </div>

          <TabsContent value="tree" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <PedigreeChart
                people={people}
                selectedPersonId={selectedPersonId}
                onSelectPerson={setSelectedPersonId}
              />
              <div className="lg:col-span-1">
                <PersonProfile
                  people={people}
                  selectedPersonId={selectedPersonId}
                  onSelectPerson={setSelectedPersonId}
                  onDelete={deletePerson}
                  initialPeople={initialPeople}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="directory" className="space-y-6">
            <AncestorsDirectory
              filteredPeople={filteredPeople}
              searchQuery={searchQuery}
              lineFilter={lineFilter}
              genFilter={genFilter}
              sortBy={sortBy}
              onSearchChange={setSearchQuery}
              onLineFilterChange={setLineFilter}
              onGenFilterChange={setGenFilter}
              onSortChange={setSortBy}
              onSelectPerson={setSelectedPersonId}
              onNavigateToTree={() => setActiveTab('tree')}
            />
          </TabsContent>

          <TabsContent value="research" className="space-y-8">
            <ResearchLog
              leads={leads}
              questions={questions}
              setLeads={setLeads}
              setQuestions={setQuestions}
            />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <TimelineTab />
          </TabsContent>
          <TabsContent value="evidence" className="space-y-6">
            <EvidenceWiki />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-stone-200 bg-[#F4EFE6] py-8 px-4 text-center text-xs text-stone-500 font-sans mt-12">
        <div className="max-w-7xl mx-auto space-y-3">
          <p className="font-serif text-sm text-[#800020] font-bold">Buatti — Emmi Ancestry Project</p>
          <p>Compiled from family documents, passports, identity cards, Italian civil and ecclesiastical records, and National Archives of Australia.</p>
          <p className="flex items-center justify-center gap-1 text-[10px] text-stone-400">
            Made with <Heart className="w-3 h-3 text-rose-600 fill-rose-600" /> for the Buatti & Emmi Families • Merged June 2026
          </p>
        </div>
      </footer>
      <MadeWithDyad />

      <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
        <DialogContent className="max-w-lg bg-[#FAF6F0] border-stone-300 font-sans">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#800020]">Add New Ancestor</DialogTitle>
            <DialogDescription>Enter details to add a new family member to the local tree.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPerson} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-stone-700">Full Name *</label>
                <Input required placeholder="e.g. Alfredo Buatti" value={newPerson.name}
                  onChange={e => setNewPerson({ ...newPerson, name: e.target.value })}
                  className="bg-white border-stone-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700">Generation</label>
                <Select value={String(newPerson.generation)} onValueChange={val => setNewPerson({ ...newPerson, generation: Number(val) })}>
                  <SelectTrigger className="bg-white border-stone-300"><SelectValue placeholder="Select generation" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">Gen 4 — Children</SelectItem>
                    <SelectItem value="3">Gen 3 — Parents</SelectItem>
                    <SelectItem value="2">Gen 2 — Grandparents</SelectItem>
                    <SelectItem value="1">Gen 1 — Great-Grandparents</SelectItem>
                    <SelectItem value="0">Gen 0 — Great-Great-Grandparents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700">Family Line</label>
                <Select value={newPerson.line} onValueChange={val => setNewPerson({ ...newPerson, line: val as Person['line'] })}>
                  <SelectTrigger className="bg-white border-stone-300"><SelectValue placeholder="Select line" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buatti">Buatti Line</SelectItem>
                    <SelectItem value="Chiappini">Chiappini Line</SelectItem>
                    <SelectItem value="Emmi">Emmi Line</SelectItem>
                    <SelectItem value="Patanè">Patanè Line</SelectItem>
                    <SelectItem value="Other">Other / Extended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700">Gender</label>
                <Select value={newPerson.gender} onValueChange={val => setNewPerson({ ...newPerson, gender: val as Person['gender'] })}>
                  <SelectTrigger className="bg-white border-stone-300"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700">Research Status</label>
                <Select value={newPerson.researchStatus?.status} onValueChange={val => setNewPerson({ ...newPerson, researchStatus: { ...newPerson.researchStatus, status: val as Person['researchStatus']['status'] } })}>
                  <SelectTrigger className="bg-white border-stone-300"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Outstanding">Outstanding</SelectItem>
                    <SelectItem value="Ruled Out">Ruled Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700">Birth Date</label>
                <Input placeholder="e.g. 27 April 1923" value={newPerson.birthDate}
                  onChange={e => setNewPerson({ ...newPerson, birthDate: e.target.value })}
                  className="bg-white border-stone-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700">Birth Place</label>
                <Input placeholder="e.g. Ascoli Piceno, Italy" value={newPerson.birthPlace}
                  onChange={e => setNewPerson({ ...newPerson, birthPlace: e.target.value })}
                  className="bg-white border-stone-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700">Death Date</label>
                <Input placeholder="e.g. 16 October 1991" value={newPerson.deathDate}
                  onChange={e => setNewPerson({ ...newPerson, deathDate: e.target.value })}
                  className="bg-white border-stone-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700">Burial Place</label>
                <Input placeholder="e.g. Rookwood Cemetery, Sydney" value={newPerson.burialPlace}
                  onChange={e => setNewPerson({ ...newPerson, burialPlace: e.target.value })}
                  className="bg-white border-stone-300" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddPersonOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#800020] hover:bg-[#600018] text-white">Save Ancestor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
