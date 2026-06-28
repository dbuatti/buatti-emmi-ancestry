import React, { useState, useEffect } from 'react';
import { 
  initialPeople, 
  initialResearchLeads, 
  initialOpenQuestions, 
  Person, 
  ResearchLead, 
  OpenQuestion 
} from '../data/familyData';
import { 
  Search, 
  Filter, 
  Plus, 
  BookOpen, 
  GitFork, 
  HelpCircle, 
  Clock, 
  FileText, 
  MapPin, 
  Calendar, 
  User, 
  Users, 
  Shield, 
  Ship, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Info, 
  Check, 
  ChevronRight, 
  Download, 
  Upload,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Index = () => {
  const { toast } = useToast();
  
  // --- STATE ---
  const [people, setPeople] = useState<Person[]>(() => {
    const saved = localStorage.getItem('buatti_emmi_people');
    return saved ? JSON.parse(saved) : initialPeople;
  });

  const [leads, setLeads] = useState<ResearchLead[]>(() => {
    const saved = localStorage.getItem('buatti_emmi_leads');
    return saved ? JSON.parse(saved) : initialResearchLeads;
  });

  const [questions, setQuestions] = useState<OpenQuestion[]>(() => {
    const saved = localStorage.getItem('buatti_emmi_questions');
    return saved ? JSON.parse(saved) : initialOpenQuestions;
  });

  const [selectedPersonId, setSelectedPersonId] = useState<string>('ezio-buatti');
  const [searchQuery, setSearchQuery] = useState('');
  const [lineFilter, setLineFilter] = useState<string>('all');
  const [genFilter, setGenFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('tree');

  // Modals State
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);

  // Form States
  const [newPerson, setNewPerson] = useState<Partial<Person>>({
    name: '',
    generation: 2,
    line: 'Buatti',
    gender: 'M',
    birthDate: '',
    birthPlace: '',
    deathDate: '',
    deathPlace: '',
    burialPlace: '',
    burialDetails: '',
    spouses: [],
    parents: [],
    children: [],
    notes: [],
    occupations: [],
    residences: [],
    researchStatus: { status: 'Outstanding', details: '' }
  });

  const [newLead, setNewLead] = useState<Partial<ResearchLead>>({
    title: '',
    category: 'General',
    status: 'To Investigate',
    description: '',
    nextSteps: ''
  });

  const [newQuestion, setNewQuestion] = useState<Partial<OpenQuestion>>({
    question: '',
    category: 'Buatti/Chiappini',
    status: 'Pending',
    notes: ''
  });

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('buatti_emmi_people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('buatti_emmi_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('buatti_emmi_questions', JSON.stringify(questions));
  }, [questions]);

  const selectedPerson = people.find(p => p.id === selectedPersonId) || people[0];

  // --- HANDLERS ---
  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerson.name) return;

    const id = newPerson.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const personToAdd: Person = {
      id,
      name: newPerson.name,
      generation: Number(newPerson.generation) || 2,
      line: (newPerson.line as any) || 'Other',
      gender: (newPerson.gender as any) || 'M',
      birthDate: newPerson.birthDate || undefined,
      birthPlace: newPerson.birthPlace || undefined,
      deathDate: newPerson.deathDate || undefined,
      deathPlace: newPerson.deathPlace || undefined,
      burialPlace: newPerson.burialPlace || undefined,
      burialDetails: newPerson.burialDetails || undefined,
      spouses: newPerson.spouses || [],
      parents: newPerson.parents || [],
      children: newPerson.children || [],
      notes: newPerson.notes && newPerson.notes.length > 0 ? newPerson.notes : undefined,
      occupations: newPerson.occupations && newPerson.occupations.length > 0 ? newPerson.occupations : undefined,
      residences: newPerson.residences && newPerson.residences.length > 0 ? newPerson.residences : undefined,
      researchStatus: {
        status: newPerson.researchStatus?.status || 'Outstanding',
        details: newPerson.researchStatus?.details || ''
      }
    };

    setPeople([...people, personToAdd]);
    setIsAddPersonOpen(false);
    setSelectedPersonId(id);
    toast({
      title: "Ancestor Added",
      description: `${personToAdd.name} has been added to the family tree.`,
    });

    // Reset form
    setNewPerson({
      name: '',
      generation: 2,
      line: 'Buatti',
      gender: 'M',
      birthDate: '',
      birthPlace: '',
      deathDate: '',
      deathPlace: '',
      burialPlace: '',
      burialDetails: '',
      spouses: [],
      parents: [],
      children: [],
      notes: [],
      occupations: [],
      residences: [],
      researchStatus: { status: 'Outstanding', details: '' }
    });
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.title || !newLead.description) return;

    const leadToAdd: ResearchLead = {
      id: `lead-${Date.now()}`,
      title: newLead.title,
      category: (newLead.category as any) || 'General',
      status: (newLead.status as any) || 'To Investigate',
      description: newLead.description,
      nextSteps: newLead.nextSteps || undefined,
      whyRuledOut: newLead.status === 'Ruled Out' ? 'Investigated and ruled out.' : undefined
    };

    setLeads([leadToAdd, ...leads]);
    setIsAddLeadOpen(false);
    toast({
      title: "Research Lead Added",
      description: `"${leadToAdd.title}" has been added to the research log.`,
    });

    setNewLead({
      title: '',
      category: 'General',
      status: 'To Investigate',
      description: '',
      nextSteps: ''
    });
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.question) return;

    const questionToAdd: OpenQuestion = {
      id: `q-${Date.now()}`,
      question: newQuestion.question,
      category: (newQuestion.category as any) || 'Buatti/Chiappini',
      status: (newQuestion.status as any) || 'Pending',
      notes: newQuestion.notes || undefined
    };

    setQuestions([questionToAdd, ...questions]);
    setIsAddQuestionOpen(false);
    toast({
      title: "Open Question Added",
      description: "The question has been added to the checklist.",
    });

    setNewQuestion({
      question: '',
      category: 'Buatti/Chiappini',
      status: 'Pending',
      notes: ''
    });
  };

  const toggleQuestionStatus = (id: string) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        const nextStatus: Record<OpenQuestion['status'], OpenQuestion['status']> = {
          'Pending': 'In Progress',
          'In Progress': 'Resolved',
          'Resolved': 'Pending'
        };
        return { ...q, status: nextStatus[q.status] };
      }
      return q;
    }));
    toast({
      title: "Question Updated",
      description: "The question status has been updated.",
    });
  };

  const updateLeadStatus = (id: string, status: ResearchLead['status']) => {
    setLeads(leads.map(l => {
      if (l.id === id) {
        return { 
          ...l, 
          status,
          whyRuledOut: status === 'Ruled Out' ? (l.whyRuledOut || 'Investigated and ruled out.') : undefined
        };
      }
      return l;
    }));
    toast({
      title: "Lead Updated",
      description: `Lead status updated to ${status}.`,
    });
  };

  const deletePerson = (id: string) => {
    if (confirm("Are you sure you want to delete this person? This cannot be undone.")) {
      setPeople(people.filter(p => p.id !== id));
      if (selectedPersonId === id) {
        setSelectedPersonId(people[0]?.id || '');
      }
      toast({
        title: "Person Deleted",
        description: "The ancestor has been removed from the tree.",
        variant: "destructive"
      });
    }
  };

  const resetToDefault = () => {
    if (confirm("Are you sure you want to reset all data to the original compiled records? Any custom changes will be lost.")) {
      localStorage.removeItem('buatti_emmi_people');
      localStorage.removeItem('buatti_emmi_leads');
      localStorage.removeItem('buatti_emmi_questions');
      setPeople(initialPeople);
      setLeads(initialResearchLeads);
      setQuestions(initialOpenQuestions);
      setSelectedPersonId('ezio-buatti');
      toast({
        title: "Data Reset",
        description: "All records have been restored to the original compiled state.",
      });
    }
  };

  // --- FILTERED DATA ---
  const filteredPeople = people.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.birthPlace && p.birthPlace.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.occupations && p.occupations.some(o => o.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesLine = lineFilter === 'all' || p.line === lineFilter;
    const matchesGen = genFilter === 'all' || p.generation === Number(genFilter);

    return matchesSearch && matchesLine && matchesGen;
  });

  // --- TIMELINE EVENTS ---
  const timelineEvents = [
    { year: 'c. 1890', title: 'Rosario Patanè Born', desc: 'Born in Fiumefreddo di Sicilia area, Sicily. Worked as a day labourer (bracciante).', line: 'Patanè', icon: Calendar },
    { year: '1898', title: 'Ida Galanti Born', desc: 'Born in Ascoli Piceno area, Marche, Italy.', line: 'Buatti', icon: Calendar },
    { year: '1915', title: 'Gregorio Emmi Born & Baptized', desc: 'Born 27 October in Linguaglossa, Sicily. Baptized 5 December by Fr. Rochus La Rosa.', line: 'Emmi', icon: Calendar },
    { year: '1923', title: 'Ezio Buatti Born', desc: 'Born 27 April in Ascoli Piceno, Marche, Italy.', line: 'Buatti', icon: Calendar },
    { year: '1924', title: 'Rosaria Patanè Born', desc: 'Born 23 May in Fiumefreddo di Sicilia, Sicily. Trained as a tailor by her brother Sebastiano.', line: 'Patanè', icon: Calendar },
    { year: '1930', title: 'Bruna Lilia Chiappini Born', desc: 'Born 3 July in San Benedetto del Tronto, Marche, Italy.', line: 'Chiappini', icon: Calendar },
    { year: '1941', title: 'Gregorio Emmi Captured', desc: 'Captured at Asmara, Eritrea during the East African Campaign of WWII.', line: 'Emmi', icon: Shield },
    { year: '1943', title: 'Gregorio Arrives in Australia as POW', desc: 'Transported from Bombay to Sydney aboard SS Uruguay. Interned at Cowra POW Camp No. 12.', line: 'Emmi', icon: Shield },
    { year: '1944', title: 'Gregorio Hospitalized', desc: 'Hospitalized at Leongatha (malaria, May) and Tatura/Murchison (epistaxis, Dec).', line: 'Emmi', icon: Shield },
    { year: '1946', title: 'Gregorio Repatriated to Italy', desc: 'Repatriated aboard H.T. Chitral on 30 September.', line: 'Emmi', icon: Ship },
    { year: '1949', title: 'Concetta ("Connie") Emmi Born', desc: 'Born 25 April in Linguaglossa, Sicily.', line: 'Emmi', icon: Calendar },
    { year: '1950', title: 'Gregorio Migrates to Australia', desc: 'Arrives in Melbourne/Sydney aboard M/V Napoli. Settles in Ingham, QLD as a cane cutter.', line: 'Emmi', icon: Ship },
    { year: '1951', title: 'Rosaria & Connie Migrate', desc: 'Arrive in Brisbane aboard SS Surriento. Settle at Black Rock, Ingham.', line: 'Patanè', icon: Ship },
    { year: '1952', title: 'Ezio & Lilia Migrate', desc: 'Arrive in Sydney aboard Toscana. Lilia listed as "Servant".', line: 'Buatti', icon: Ship },
    { year: '1956', title: 'Alfred Buatti Born', desc: 'Born 8 November in Broadford, Victoria, Australia.', line: 'Buatti', icon: Calendar },
    { year: '1962', title: 'Buatti Family Moves to Italy', desc: 'Ezio, Lilia, Alfred, and John move back to Italy.', line: 'Buatti', icon: Ship },
    { year: '1964', title: 'Alfredo Buatti Sr. Dies', desc: 'Dies 5 September, buried at Cimitero di Borgo Solestà, Ascoli Piceno.', line: 'Buatti', icon: Clock },
    { year: '1970', title: 'Ida Galanti Dies', desc: 'Dies 26 January, buried in shared grave with Alfredo Sr. in Ascoli Piceno.', line: 'Buatti', icon: Clock },
    { year: '1975', title: 'Alfred Buatti Returns to Australia', desc: 'Returns to Australia after living in Italy for ~13 years.', line: 'Buatti', icon: Ship },
    { year: '1979', title: 'Gregorio Emmi Dies', desc: 'Dies late November, buried at Rookwood Catholic Cemetery, Sydney on 30 November.', line: 'Emmi', icon: Clock },
    { year: '1991', title: 'Ezio Buatti Dies', desc: 'Dies 16 October.', line: 'Buatti', icon: Clock },
    { year: '1994', title: 'Rosaria Patanè Dies', desc: 'Dies 30 March, buried at Cheltenham Memorial Cemetery, Victoria.', line: 'Patanè', icon: Clock },
    { year: '1998', title: 'Bruna Lilia Chiappini Dies', desc: 'Dies 23 May, buried at Springvale Botanical Cemetery, Victoria.', line: 'Chiappini', icon: Clock },
  ];

  // Helper to get line color
  const getLineColor = (line: string) => {
    switch (line) {
      case 'Buatti': return 'bg-[#800020] text-white border-[#800020]';
      case 'Chiappini': return 'bg-amber-700 text-white border-amber-700';
      case 'Emmi': return 'bg-emerald-800 text-white border-emerald-800';
      case 'Patanè': return 'bg-blue-900 text-white border-blue-900';
      default: return 'bg-stone-600 text-white border-stone-600';
    }
  };

  const getLineBadgeColor = (line: string) => {
    switch (line) {
      case 'Buatti': return 'bg-[#800020]/10 text-[#800020] border-[#800020]/20';
      case 'Chiappini': return 'bg-amber-700/10 text-amber-800 border-amber-700/20';
      case 'Emmi': return 'bg-emerald-800/10 text-emerald-800 border-emerald-800/20';
      case 'Patanè': return 'bg-blue-900/10 text-blue-900 border-blue-900/20';
      default: return 'bg-stone-600/10 text-stone-800 border-stone-600/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif selection:bg-[#800020]/20 selection:text-[#800020]">
      {/* --- TOP BAR / HERO --- */}
      <header className="relative border-b border-stone-200 bg-[#F4EFE6] py-8 px-4 md:px-8 shadow-sm overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#800020_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#800020] flex items-center justify-center text-amber-100 shadow-md border-2 border-amber-200/50">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#800020] font-serif">
                Buatti — Emmi Ancestry
              </h1>
              <p className="text-sm md:text-base text-stone-600 font-sans mt-1 max-w-2xl">
                Compiled from passports, civil & ecclesiastical records, National Archives of Australia, and family recollections. Merged & consolidated June 2026.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={resetToDefault}
              className="font-sans text-xs border-stone-300 hover:bg-stone-100 text-stone-700"
            >
              Reset to Original
            </Button>
            
            <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#800020] hover:bg-[#600018] text-white font-sans text-sm flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> Add Ancestor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-[#FAF6F0] border-stone-300 font-sans">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl text-[#800020]">Add New Ancestor</DialogTitle>
                  <DialogDescription>
                    Enter details to add a new family member to the local tree.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddPerson} className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-stone-700">Full Name *</label>
                      <Input 
                        required
                        placeholder="e.g. Alfredo Buatti" 
                        value={newPerson.name} 
                        onChange={e => setNewPerson({...newPerson, name: e.target.value})}
                        className="bg-white border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-700">Generation</label>
                      <Select 
                        value={String(newPerson.generation)} 
                        onValueChange={val => setNewPerson({...newPerson, generation: Number(val)})}
                      >
                        <SelectTrigger className="bg-white border-stone-300">
                          <SelectValue placeholder="Select generation" />
                        </SelectTrigger>
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
                      <Select 
                        value={newPerson.line} 
                        onValueChange={val => setNewPerson({...newPerson, line: val as any})}
                      >
                        <SelectTrigger className="bg-white border-stone-300">
                          <SelectValue placeholder="Select line" />
                        </SelectTrigger>
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
                      <Select 
                        value={newPerson.gender} 
                        onValueChange={val => setNewPerson({...newPerson, gender: val as any})}
                      >
                        <SelectTrigger className="bg-white border-stone-300">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-700">Research Status</label>
                      <Select 
                        value={newPerson.researchStatus?.status} 
                        onValueChange={val => setNewPerson({
                          ...newPerson, 
                          researchStatus: { ...newPerson.researchStatus, status: val as any }
                        })}
                      >
                        <SelectTrigger className="bg-white border-stone-300">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
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
                      <Input 
                        placeholder="e.g. 27 April 1923" 
                        value={newPerson.birthDate} 
                        onChange={e => setNewPerson({...newPerson, birthDate: e.target.value})}
                        className="bg-white border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-700">Birth Place</label>
                      <Input 
                        placeholder="e.g. Ascoli Piceno, Italy" 
                        value={newPerson.birthPlace} 
                        onChange={e => setNewPerson({...newPerson, birthPlace: e.target.value})}
                        className="bg-white border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-700">Death Date</label>
                      <Input 
                        placeholder="e.g. 16 October 1991" 
                        value={newPerson.deathDate} 
                        onChange={e => setNewPerson({...newPerson, deathDate: e.target.value})}
                        className="bg-white border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-700">Burial Place</label>
                      <Input 
                        placeholder="e.g. Rookwood Cemetery, Sydney" 
                        value={newPerson.burialPlace} 
                        onChange={e => setNewPerson({...newPerson, burialPlace: e.target.value})}
                        className="bg-white border-stone-300"
                      />
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
        </div>

        {/* Quick Stats Bar */}
        <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-stone-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center md:text-left">
          <div className="bg-[#FAF6F0]/80 p-3 rounded-lg border border-stone-200/40">
            <span className="block text-xs text-stone-500 font-sans uppercase tracking-wider">Total Records</span>
            <span className="text-xl font-bold text-[#800020]">{people.length} Individuals</span>
          </div>
          <div className="bg-[#FAF6F0]/80 p-3 rounded-lg border border-stone-200/40">
            <span className="block text-xs text-stone-500 font-sans uppercase tracking-wider">Generations</span>
            <span className="text-xl font-bold text-[#800020]">5 Generations</span>
          </div>
          <div className="bg-[#FAF6F0]/80 p-3 rounded-lg border border-stone-200/40">
            <span className="block text-xs text-stone-500 font-sans uppercase tracking-wider">Open Questions</span>
            <span className="text-xl font-bold text-amber-700">{questions.filter(q => q.status !== 'Resolved').length} Active</span>
          </div>
          <div className="bg-[#FAF6F0]/80 p-3 rounded-lg border border-stone-200/40">
            <span className="block text-xs text-stone-500 font-sans uppercase tracking-wider">Research Leads</span>
            <span className="text-xl font-bold text-emerald-800">{leads.filter(l => l.status === 'To Investigate' || l.status === 'In Progress').length} Open</span>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
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
            </TabsList>

            <div className="text-xs text-stone-500 font-sans italic flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#800020]" /> Click on any ancestor to view their full profile.
            </div>
          </div>

          {/* ========================================== */}
          {/* TAB: INTERACTIVE TREE                      */}
          {/* ========================================== */}
          <TabsContent value="tree" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Visual Tree Canvas */}
              <div className="lg:col-span-2 bg-[#F4EFE6] border border-stone-200 rounded-xl p-6 shadow-inner relative overflow-hidden min-h-[600px] flex flex-col justify-between">
                {/* Decorative watermark */}
                <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
                  <Users className="w-96 h-96 text-[#800020]" />
                </div>

                <div className="text-center mb-4 relative z-10">
                  <h3 className="text-lg font-bold text-[#800020] tracking-wide">Pedigree Chart</h3>
                  <p className="text-xs text-stone-500 font-sans">Interactive lineage showing the connection between the Buatti-Chiappini and Emmi-Patanè lines.</p>
                </div>

                {/* Tree Nodes Container */}
                <div className="space-y-8 relative z-10 my-auto">
                  
                  {/* GENERATION 1: Great-Grandparents */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400 font-bold">Generation 1 — Great-Grandparents</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {/* Buatti Line */}
                      <div className="space-y-2">
                        <div 
                          onClick={() => setSelectedPersonId('alfredo-buatti-sr')}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedPersonId === 'alfredo-buatti-sr' 
                              ? 'bg-[#800020] text-white border-[#800020] shadow-md' 
                              : 'bg-white border-stone-200 hover:border-[#800020]'
                          }`}
                        >
                          <p className="font-bold truncate">Alfredo Buatti Sr.</p>
                          <p className="text-[10px] opacity-80 font-sans">d. 1964 • Ascoli Piceno</p>
                        </div>
                        <div 
                          onClick={() => setSelectedPersonId('ida-galanti')}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedPersonId === 'ida-galanti' 
                              ? 'bg-[#800020] text-white border-[#800020] shadow-md' 
                              : 'bg-white border-stone-200 hover:border-[#800020]'
                          }`}
                        >
                          <p className="font-bold truncate">Ida Galanti</p>
                          <p className="text-[10px] opacity-80 font-sans">1898 – 1970</p>
                        </div>
                      </div>

                      {/* Chiappini Line */}
                      <div className="space-y-2">
                        <div 
                          onClick={() => setSelectedPersonId('remo-chiappini')}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedPersonId === 'remo-chiappini' 
                              ? 'bg-amber-700 text-white border-amber-700 shadow-md' 
                              : 'bg-white border-stone-200 hover:border-amber-700'
                          }`}
                        >
                          <p className="font-bold truncate">Remo Chiappini</p>
                          <p className="text-[10px] opacity-80 font-sans">Unknown • Marche</p>
                        </div>
                        <div 
                          onClick={() => setSelectedPersonId('remo-wife-unknown')}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedPersonId === 'remo-wife-unknown' 
                              ? 'bg-amber-700 text-white border-amber-700 shadow-md' 
                              : 'bg-white border-stone-200 hover:border-amber-700'
                          }`}
                        >
                          <p className="font-bold truncate">Wife (Unknown)</p>
                          <p className="text-[10px] opacity-80 font-sans">d. c. 1930s</p>
                        </div>
                      </div>

                      {/* Emmi Line */}
                      <div className="space-y-2">
                        <div 
                          onClick={() => setSelectedPersonId('egidio-emmi')}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedPersonId === 'egidio-emmi' 
                              ? 'bg-emerald-800 text-white border-emerald-800 shadow-md' 
                              : 'bg-white border-stone-200 hover:border-emerald-800'
                          }`}
                        >
                          <p className="font-bold truncate">Egidio Emmi</p>
                          <p className="text-[10px] opacity-80 font-sans">d. pre-1949 • Sicily</p>
                        </div>
                        <div 
                          onClick={() => setSelectedPersonId('concetta-sgroi')}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedPersonId === 'concetta-sgroi' 
                              ? 'bg-emerald-800 text-white border-emerald-800 shadow-md' 
                              : 'bg-white border-stone-200 hover:border-emerald-800'
                          }`}
                        >
                          <p className="font-bold truncate">Concetta Sgroi</p>
                          <p className="text-[10px] opacity-80 font-sans">Unknown • Sicily</p>
                        </div>
                      </div>

                      {/* Patanè Line */}
                      <div className="space-y-2">
                        <div 
                          onClick={() => setSelectedPersonId('rosario-patane-sr')}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedPersonId === 'rosario-patane-sr' 
                              ? 'bg-blue-900 text-white border-blue-900 shadow-md' 
                              : 'bg-white border-stone-200 hover:border-blue-900'
                          }`}
                        >
                          <p className="font-bold truncate">Rosario Patanè</p>
                          <p className="text-[10px] opacity-80 font-sans">c. 1890 • Sicily</p>
                        </div>
                        <div 
                          onClick={() => setSelectedPersonId('venera-vecchio')}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedPersonId === 'venera-vecchio' 
                              ? 'bg-blue-900 text-white border-blue-900 shadow-md' 
                              : 'bg-white border-stone-200 hover:border-blue-900'
                          }`}
                        >
                          <p className="font-bold truncate">Venera Vecchio</p>
                          <p className="text-[10px] opacity-80 font-sans">d. pre-1953 • Sicily</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connecting Lines Row 1 */}
                  <div className="hidden md:flex justify-around text-stone-300 h-4 pointer-events-none">
                    <div className="w-1/4 border-r-2 border-dashed border-stone-300 h-full"></div>
                    <div className="w-1/4 border-r-2 border-dashed border-stone-300 h-full"></div>
                    <div className="w-1/4 border-r-2 border-dashed border-stone-300 h-full"></div>
                    <div className="w-1/4 border-r-2 border-dashed border-stone-300 h-full"></div>
                  </div>

                  {/* GENERATION 2: Grandparents */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400 font-bold">Generation 2 — Grandparents</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      {/* Ezio Buatti */}
                      <div 
                        onClick={() => setSelectedPersonId('ezio-buatti')}
                        className={`col-span-1 p-3 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedPersonId === 'ezio-buatti' 
                            ? 'bg-[#800020] text-white border-[#800020] shadow-md' 
                            : 'bg-white border-stone-200 hover:border-[#800020]'
                        }`}
                      >
                        <p className="font-bold">Ezio Buatti</p>
                        <p className="text-[10px] opacity-80 font-sans">1923 – 1991</p>
                        <p className="text-[9px] font-sans italic mt-1">Ascoli Piceno → Sydney</p>
                      </div>

                      {/* Bruna Lilia Chiappini */}
                      <div 
                        onClick={() => setSelectedPersonId('bruna-lilia-chiappini')}
                        className={`col-span-1 p-3 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedPersonId === 'bruna-lilia-chiappini' 
                            ? 'bg-amber-700 text-white border-amber-700 shadow-md' 
                            : 'bg-white border-stone-200 hover:border-amber-700'
                        }`}
                      >
                        <p className="font-bold">Bruna Lilia Chiappini</p>
                        <p className="text-[10px] opacity-80 font-sans">1930 – 1998</p>
                        <p className="text-[9px] font-sans italic mt-1">San Benedetto → Victoria</p>
                      </div>

                      {/* Gregorio Emmi */}
                      <div 
                        onClick={() => setSelectedPersonId('gregorio-emmi')}
                        className={`col-span-1 p-3 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedPersonId === 'gregorio-emmi' 
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-md' 
                            : 'bg-white border-stone-200 hover:border-emerald-800'
                        }`}
                      >
                        <p className="font-bold">Gregorio Emmi</p>
                        <p className="text-[10px] opacity-80 font-sans">1915 – 1979</p>
                        <p className="text-[9px] font-sans italic mt-1">Linguaglossa → Ingham → Sydney</p>
                      </div>

                      {/* Rosaria Patanè */}
                      <div 
                        onClick={() => setSelectedPersonId('rosaria-patane')}
                        className={`col-span-1 p-3 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedPersonId === 'rosaria-patane' 
                            ? 'bg-blue-900 text-white border-blue-900 shadow-md' 
                            : 'bg-white border-stone-200 hover:border-blue-900'
                        }`}
                      >
                        <p className="font-bold">Rosaria Patanè</p>
                        <p className="text-[10px] opacity-80 font-sans">1924 – 1994</p>
                        <p className="text-[9px] font-sans italic mt-1">Fiumefreddo → Ingham → Victoria</p>
                      </div>
                    </div>
                  </div>

                  {/* Connecting Lines Row 2 */}
                  <div className="hidden md:flex justify-around text-stone-300 h-4 pointer-events-none">
                    <div className="w-1/2 border-r-2 border-dashed border-stone-300 h-full"></div>
                    <div className="w-1/2 border-r-2 border-dashed border-stone-300 h-full"></div>
                  </div>

                  {/* GENERATION 3: Parents */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400 font-bold">Generation 3 — Parents</span>
                    </div>
                    <div className="grid grid-cols-2 gap-8 text-center max-w-2xl mx-auto">
                      {/* Alfred Buatti */}
                      <div 
                        onClick={() => setSelectedPersonId('alfred-buatti')}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedPersonId === 'alfred-buatti' 
                            ? 'bg-[#800020] text-white border-[#800020] shadow-md' 
                            : 'bg-white border-stone-200 hover:border-[#800020]'
                        }`}
                      >
                        <p className="font-bold">Alfred (Alfredo) Buatti</p>
                        <p className="text-[10px] opacity-80 font-sans">b. 1956 • Broadford, VIC</p>
                        <p className="text-[9px] font-sans italic mt-1">Moved to Italy 1962, returned 1975</p>
                      </div>

                      {/* Venera Buatti */}
                      <div 
                        onClick={() => setSelectedPersonId('venera-buatti')}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedPersonId === 'venera-buatti' 
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-md' 
                            : 'bg-white border-stone-200 hover:border-emerald-800'
                        }`}
                      >
                        <p className="font-bold">Venera Buatti (née Emmi)</p>
                        <p className="text-[10px] opacity-80 font-sans">Living • Named after grandmother</p>
                        <p className="text-[9px] font-sans italic mt-1">Daughter of Gregorio & Rosaria</p>
                      </div>
                    </div>
                  </div>

                  {/* Connecting Lines Row 3 */}
                  <div className="hidden md:flex justify-center text-stone-300 h-4 pointer-events-none">
                    <div className="border-r-2 border-dashed border-stone-300 h-full"></div>
                  </div>

                  {/* GENERATION 4: Children */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400 font-bold">Generation 4 — Children</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center max-w-xl mx-auto">
                      {['daniele-buatti', 'roberto-buatti', 'stefano-buatti', 'marco-buatti'].map(id => {
                        const child = people.find(p => p.id === id);
                        if (!child) return null;
                        return (
                          <div 
                            key={id}
                            onClick={() => setSelectedPersonId(id)}
                            className={`p-2 rounded-lg border text-[11px] cursor-pointer transition-all duration-200 hover:scale-105 ${
                              selectedPersonId === id 
                                ? 'bg-[#800020] text-white border-[#800020] shadow-md' 
                                : 'bg-white border-stone-200 hover:border-[#800020]'
                            }`}
                          >
                            <p className="font-bold truncate">{child.name.split(' ')[0]}</p>
                            <p className="text-[9px] opacity-80 font-sans">Buatti</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                <div className="text-center mt-4 text-[10px] text-stone-500 font-sans border-t border-stone-200/60 pt-2">
                  Lines: <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#800020] mr-1"></span> Buatti 
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-700 ml-3 mr-1"></span> Chiappini 
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-800 ml-3 mr-1"></span> Emmi 
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-900 ml-3 mr-1"></span> Patanè
                </div>
              </div>

              {/* Sidebar: Selected Person Profile */}
              <div className="lg:col-span-1">
                <Card className="border-stone-300 bg-[#FAF6F0] shadow-md sticky top-6">
                  <CardHeader className="bg-[#F4EFE6] border-b border-stone-200 pb-4">
                    <div className="flex justify-between items-start">
                      <Badge className={getLineBadgeColor(selectedPerson.line)}>
                        {selectedPerson.line} Line
                      </Badge>
                      <Badge variant="outline" className="font-sans text-[10px]">
                        Gen {selectedPerson.generation}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-serif text-[#800020] mt-2 flex items-center gap-2">
                      {selectedPerson.name}
                      {selectedPerson.gender === 'M' ? '♂' : '♀'}
                    </CardTitle>
                    <CardDescription className="font-sans text-xs text-stone-600">
                      {selectedPerson.birthDate || 'Unknown'} – {selectedPerson.deathDate || (selectedPerson.isLiving ? 'Living' : 'Unknown')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="w-full bg-stone-100 rounded-none border-b border-stone-200 grid grid-cols-4 text-xs">
                        <TabsTrigger value="overview" className="rounded-none py-2">Overview</TabsTrigger>
                        <TabsTrigger value="bio" className="rounded-none py-2">Bio/Notes</TabsTrigger>
                        <TabsTrigger value="migration" className="rounded-none py-2">Migration</TabsTrigger>
                        <TabsTrigger value="research" className="rounded-none py-2">Research</TabsTrigger>
                      </TabsList>

                      <ScrollArea className="h-[400px] p-4">
                        {/* OVERVIEW TAB */}
                        <TabsContent value="overview" className="space-y-4 mt-0">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-[#800020] mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Birth</span>
                                <p>{selectedPerson.birthDate || 'Unknown / to be confirmed'}</p>
                                {selectedPerson.birthPlace && <p className="text-xs text-stone-600 italic">{selectedPerson.birthPlace}</p>}
                              </div>
                            </div>

                            {!selectedPerson.isLiving && (
                              <div className="flex items-start gap-2 pt-2 border-t border-stone-200/60">
                                <Clock className="w-4 h-4 text-[#800020] mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Death</span>
                                  <p>{selectedPerson.deathDate || 'Unknown / to be confirmed'}</p>
                                  {selectedPerson.deathPlace && <p className="text-xs text-stone-600 italic">{selectedPerson.deathPlace}</p>}
                                </div>
                              </div>
                            )}

                            {selectedPerson.burialPlace && (
                              <div className="flex items-start gap-2 pt-2 border-t border-stone-200/60">
                                <MapPin className="w-4 h-4 text-[#800020] mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Burial</span>
                                  <p className="font-semibold">{selectedPerson.burialPlace}</p>
                                  {selectedPerson.burialDetails && <p className="text-xs text-stone-600 mt-0.5">{selectedPerson.burialDetails}</p>}
                                  {selectedPerson.burialLink && (
                                    <a 
                                      href={selectedPerson.burialLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-xs text-[#800020] hover:underline flex items-center gap-1 mt-1 font-sans"
                                    >
                                      View Cemetery Record <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Family Connections */}
                            <div className="pt-4 border-t border-stone-200 space-y-2">
                              <h4 className="text-xs font-bold text-stone-500 font-sans uppercase tracking-wider">Family Connections</h4>
                              
                              {/* Spouses */}
                              <div>
                                <span className="text-xs text-stone-600 font-sans">Spouse:</span>
                                <div className="mt-1">
                                  {selectedPerson.spouses.length > 0 ? (
                                    selectedPerson.spouses.map(spouseId => {
                                      const spouse = people.find(p => p.id === spouseId);
                                      return spouse ? (
                                        <Button 
                                          key={spouseId} 
                                          variant="link" 
                                          onClick={() => setSelectedPersonId(spouseId)}
                                          className="p-0 h-auto text-sm text-[#800020] hover:underline font-serif font-bold"
                                        >
                                          {spouse.name}
                                        </Button>
                                      ) : <span key={spouseId} className="text-sm italic">Unknown Spouse</span>;
                                    })
                                  ) : <span className="text-sm italic text-stone-500">None recorded</span>}
                                </div>
                              </div>

                              {/* Parents */}
                              <div>
                                <span className="text-xs text-stone-600 font-sans">Parents:</span>
                                <div className="mt-1 flex flex-col gap-1">
                                  {selectedPerson.parents.length > 0 ? (
                                    selectedPerson.parents.map(parentId => {
                                      const parent = people.find(p => p.id === parentId);
                                      return parent ? (
                                        <Button 
                                          key={parentId} 
                                          variant="link" 
                                          onClick={() => setSelectedPersonId(parentId)}
                                          className="p-0 h-auto text-sm text-[#800020] hover:underline font-serif text-left justify-start"
                                        >
                                          • {parent.name}
                                        </Button>
                                      ) : null;
                                    })
                                  ) : <span className="text-sm italic text-stone-500">None recorded</span>}
                                </div>
                              </div>

                              {/* Children */}
                              <div>
                                <span className="text-xs text-stone-600 font-sans">Children:</span>
                                <div className="mt-1 flex flex-col gap-1">
                                  {selectedPerson.children.length > 0 ? (
                                    selectedPerson.children.map(childId => {
                                      const child = people.find(p => p.id === childId);
                                      return child ? (
                                        <Button 
                                          key={childId} 
                                          variant="link" 
                                          onClick={() => setSelectedPersonId(childId)}
                                          className="p-0 h-auto text-sm text-[#800020] hover:underline font-serif text-left justify-start"
                                        >
                                          • {child.name}
                                        </Button>
                                      ) : null;
                                    })
                                  ) : <span className="text-sm italic text-stone-500">None recorded</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        {/* BIO & NOTES TAB */}
                        <TabsContent value="bio" className="space-y-4 mt-0">
                          {selectedPerson.occupations && selectedPerson.occupations.length > 0 && (
                            <div>
                              <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Occupations</span>
                              <p className="text-sm">{selectedPerson.occupations.join(', ')}</p>
                            </div>
                          )}

                          {selectedPerson.residences && selectedPerson.residences.length > 0 && (
                            <div>
                              <span className="font-bold block text-xs text-stone-500 font-sans uppercase">Residences</span>
                              <p className="text-sm">{selectedPerson.residences.join(' • ')}</p>
                            </div>
                          )}

                          {selectedPerson.physicalDescription && (
                            <div className="bg-stone-100 p-3 rounded-lg border border-stone-200 text-xs space-y-1 font-sans">
                              <span className="font-bold block text-stone-500 uppercase tracking-wider text-[10px]">Physical Description</span>
                              {selectedPerson.physicalDescription.height && <p><strong>Height:</strong> {selectedPerson.physicalDescription.height}</p>}
                              {selectedPerson.physicalDescription.build && <p><strong>Build:</strong> {selectedPerson.physicalDescription.build}</p>}
                              {selectedPerson.physicalDescription.hair && <p><strong>Hair:</strong> {selectedPerson.physicalDescription.hair}</p>}
                              {selectedPerson.physicalDescription.eyes && <p><strong>Eyes:</strong> {selectedPerson.physicalDescription.eyes}</p>}
                              {selectedPerson.physicalDescription.other && <p><strong>Other:</strong> {selectedPerson.physicalDescription.other}</p>}
                            </div>
                          )}

                          <div>
                            <span className="font-bold block text-xs text-stone-500 font-sans uppercase mb-2">Historical Notes</span>
                            {selectedPerson.notes && selectedPerson.notes.length > 0 ? (
                              <ul className="space-y-2 text-sm list-disc pl-4 text-stone-800">
                                {selectedPerson.notes.map((note, idx) => (
                                  <li key={idx}>{note}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm italic text-stone-500">No historical notes recorded.</p>
                            )}
                          </div>
                        </TabsContent>

                        {/* MIGRATION & MILITARY TAB */}
                        <TabsContent value="migration" className="space-y-4 mt-0">
                          {selectedPerson.migration ? (
                            <div className="space-y-3">
                              <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/40">
                                <span className="font-bold block text-xs text-amber-800 font-sans uppercase flex items-center gap-1">
                                  <Ship className="w-3.5 h-3.5" /> Migration Details
                                </span>
                                <p className="text-sm mt-1 text-stone-800">{selectedPerson.migration.details}</p>
                                {selectedPerson.migration.sponsorship && (
                                  <p className="text-xs mt-2 text-stone-600">
                                    <strong>Sponsorship:</strong> {selectedPerson.migration.sponsorship}
                                  </p>
                                )}
                              </div>

                              {selectedPerson.migration.voyages && selectedPerson.migration.voyages.map((voyage, idx) => (
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

                          {selectedPerson.military && (
                            <div className="border-t border-stone-200 pt-4 space-y-3">
                              <span className="font-bold block text-xs text-stone-500 font-sans uppercase flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5 text-[#800020]" /> WWII Military Service
                              </span>
                              <div className="bg-stone-100 p-3 rounded-lg border border-stone-200 text-xs space-y-2 font-sans">
                                <p><strong>Service:</strong> {selectedPerson.military.service}</p>
                                <p><strong>Captured:</strong> {selectedPerson.military.captured}</p>
                                <p><strong>Internment:</strong> {selectedPerson.military.internment}</p>
                                <p><strong>Repatriation:</strong> {selectedPerson.military.repatriation}</p>
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        {/* RESEARCH STATUS TAB */}
                        <TabsContent value="research" className="space-y-4 mt-0">
                          <div>
                            <span className="font-bold block text-xs text-stone-500 font-sans uppercase mb-1">Research Status</span>
                            <Badge className={
                              selectedPerson.researchStatus.status === 'Confirmed' ? 'bg-emerald-800 text-white' :
                              selectedPerson.researchStatus.status === 'In Progress' ? 'bg-amber-700 text-white' :
                              selectedPerson.researchStatus.status === 'Ruled Out' ? 'bg-rose-800 text-white' :
                              'bg-stone-600 text-white'
                            }>
                              {selectedPerson.researchStatus.status}
                            </Badge>
                            {selectedPerson.researchStatus.details && (
                              <p className="text-sm mt-2 text-stone-700 italic">
                                "{selectedPerson.researchStatus.details}"
                              </p>
                            )}
                          </div>

                          {selectedPerson.researchStatus.nextSteps && selectedPerson.researchStatus.nextSteps.length > 0 && (
                            <div className="border-t border-stone-200 pt-3">
                              <span className="font-bold block text-xs text-stone-500 font-sans uppercase mb-2">Next Research Steps</span>
                              <ul className="space-y-1.5 text-xs font-sans text-stone-800">
                                {selectedPerson.researchStatus.nextSteps.map((step, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <ArrowRight className="w-3.5 h-3.5 text-[#800020] shrink-0 mt-0.5" />
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {selectedPerson.sources && selectedPerson.sources.length > 0 && (
                            <div className="border-t border-stone-200 pt-3">
                              <span className="font-bold block text-xs text-stone-500 font-sans uppercase mb-2">Sources & Records</span>
                              <div className="space-y-2">
                                {selectedPerson.sources.map((source, idx) => (
                                  <div key={idx} className="text-xs font-sans bg-white p-2 rounded border border-stone-200">
                                    <p className="font-bold text-stone-800">{source.title}</p>
                                    <p className="text-stone-500 text-[10px]">{source.type} {source.reference && `• Ref: ${source.reference}`}</p>
                                    {source.link && (
                                      <a 
                                        href={source.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-[#800020] hover:underline flex items-center gap-0.5 mt-1 text-[10px]"
                                      >
                                        Access Record <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>

                    {/* Delete Button for Custom Added People */}
                    {!initialPeople.some(p => p.id === selectedPerson.id) && (
                      <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => deletePerson(selectedPerson.id)}
                          className="font-sans text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Custom Record
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================================== */}
          {/* TAB: ANCESTORS DIRECTORY                   */}
          {/* ========================================== */}
          <TabsContent value="directory" className="space-y-6">
            {/* Search & Filter Controls */}
            <div className="bg-[#F4EFE6] border border-stone-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input 
                  placeholder="Search ancestors by name, birth place, occupation..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-stone-300 font-sans"
                />
              </div>

              <div>
                <Select value={lineFilter} onValueChange={setLineFilter}>
                  <SelectTrigger className="bg-white border-stone-300 font-sans">
                    <SelectValue placeholder="Filter by Line" />
                  </SelectTrigger>
                  <SelectContent className="font-sans">
                    <SelectItem value="all">All Family Lines</SelectItem>
                    <SelectItem value="Buatti">Buatti Line</SelectItem>
                    <SelectItem value="Chiappini">Chiappini Line</SelectItem>
                    <SelectItem value="Emmi">Emmi Line</SelectItem>
                    <SelectItem value="Patanè">Patanè Line</SelectItem>
                    <SelectItem value="Other">Other / Extended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={genFilter} onValueChange={setGenFilter}>
                  <SelectTrigger className="bg-white border-stone-300 font-sans">
                    <SelectValue placeholder="Filter by Generation" />
                  </SelectTrigger>
                  <SelectContent className="font-sans">
                    <SelectItem value="all">All Generations</SelectItem>
                    <SelectItem value="4">Gen 4 — Children</SelectItem>
                    <SelectItem value="3">Gen 3 — Parents</SelectItem>
                    <SelectItem value="2">Gen 2 — Grandparents</SelectItem>
                    <SelectItem value="1">Gen 1 — Great-Grandparents</SelectItem>
                    <SelectItem value="0">Gen 0 — Great-Great-Grandparents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ancestors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPeople.map(person => (
                <Card 
                  key={person.id} 
                  onClick={() => {
                    setSelectedPersonId(person.id);
                    setActiveTab('tree');
                  }}
                  className="border-stone-300 bg-[#FAF6F0] hover:border-[#800020] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge className={getLineBadgeColor(person.line)}>
                        {person.line} Line
                      </Badge>
                      <Badge variant="outline" className="font-sans text-[10px]">
                        Gen {person.generation}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-serif text-[#800020] mt-2 flex items-center gap-1.5">
                      {person.name}
                      <span className="text-xs text-stone-500 font-sans">
                        ({person.gender === 'M' ? 'Male' : 'Female'})
                      </span>
                    </CardTitle>
                    <CardDescription className="font-sans text-xs text-stone-600">
                      {person.birthDate || 'Unknown'} – {person.deathDate || (person.isLiving ? 'Living' : 'Unknown')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2 pt-0">
                    {person.birthPlace && (
                      <p className="text-xs text-stone-700">
                        <strong>Birthplace:</strong> {person.birthPlace}
                      </p>
                    )}
                    {person.occupations && person.occupations.length > 0 && (
                      <p className="text-xs text-stone-700">
                        <strong>Occupation:</strong> {person.occupations.join(', ')}
                      </p>
                    )}
                    {person.notes && person.notes.length > 0 && (
                      <p className="text-xs text-stone-600 line-clamp-2 italic">
                        "{person.notes[0]}"
                      </p>
                    )}
                  </CardContent>
                  <div className="p-3 bg-stone-100/60 border-t border-stone-200/60 flex justify-between items-center text-xs font-sans text-stone-500">
                    <span>Status: <strong>{person.researchStatus.status}</strong></span>
                    <span className="text-[#800020] hover:underline flex items-center gap-0.5">
                      View Profile <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Card>
              ))}

              {filteredPeople.length === 0 && (
                <div className="col-span-full text-center py-12 bg-[#F4EFE6] border border-stone-200 rounded-xl">
                  <Users className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  <p className="text-lg font-bold text-stone-700">No ancestors match your search.</p>
                  <p className="text-sm text-stone-500 font-sans mt-1">Try adjusting your filters or search query.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ========================================== */}
          {/* TAB: RESEARCH LOG & LEADS                  */}
          {/* ========================================== */}
          <TabsContent value="research" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left 2 Columns: Research Leads & Ruled Out Leads */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Active Research Leads */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-[#800020]">Active Research Leads</h3>
                      <p className="text-xs text-stone-500 font-sans">Hypotheses, connections, and avenues currently being investigated.</p>
                    </div>
                    <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-[#800020] hover:bg-[#600018] text-white font-sans text-xs flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Add Lead
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md bg-[#FAF6F0] border-stone-300 font-sans">
                        <DialogHeader>
                          <DialogTitle className="font-serif text-xl text-[#800020]">Add Research Lead</DialogTitle>
                          <DialogDescription>
                            Document a new lead, connection, or hypothesis to investigate.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddLead} className="space-y-4 mt-2">
                          <div>
                            <label className="text-xs font-semibold text-stone-700">Lead Title *</label>
                            <Input 
                              required
                              placeholder="e.g. Pietro Patanè Connection" 
                              value={newLead.title} 
                              onChange={e => setNewLead({...newLead, title: e.target.value})}
                              className="bg-white border-stone-300"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-stone-700">Category</label>
                              <Select 
                                value={newLead.category} 
                                onValueChange={val => setNewLead({...newLead, category: val as any})}
                              >
                                <SelectTrigger className="bg-white border-stone-300">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Buatti/Chiappini">Buatti/Chiappini</SelectItem>
                                  <SelectItem value="Emmi/Patanè">Emmi/Patanè</SelectItem>
                                  <SelectItem value="General">General</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-stone-700">Status</label>
                              <Select 
                                value={newLead.status} 
                                onValueChange={val => setNewLead({...newLead, status: val as any})}
                              >
                                <SelectTrigger className="bg-white border-stone-300">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="To Investigate">To Investigate</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Ruled Out">Ruled Out</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-stone-700">Description *</label>
                            <Textarea 
                              required
                              placeholder="Describe the lead, connection, or document..." 
                              value={newLead.description} 
                              onChange={e => setNewLead({...newLead, description: e.target.value})}
                              className="bg-white border-stone-300 h-24"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-stone-700">Next Steps</label>
                            <Input 
                              placeholder="What needs to be done next?" 
                              value={newLead.nextSteps} 
                              onChange={e => setNewLead({...newLead, nextSteps: e.target.value})}
                              className="bg-white border-stone-300"
                            />
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddLeadOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-[#800020] hover:bg-[#600018] text-white">Save Lead</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-4">
                    {leads.filter(l => l.status !== 'Ruled Out').map(lead => (
                      <Card key={lead.id} className="border-stone-300 bg-[#FAF6F0] shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <Badge className={
                              lead.status === 'Completed' ? 'bg-emerald-800 text-white' :
                              lead.status === 'In Progress' ? 'bg-amber-700 text-white' :
                              'bg-stone-600 text-white'
                            }>
                              {lead.status}
                            </Badge>
                            <span className="text-xs text-stone-500 font-sans">{lead.category}</span>
                          </div>
                          <CardTitle className="text-lg font-serif text-[#800020] mt-1">{lead.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                          <p className="text-stone-800">{lead.description}</p>
                          {lead.nextSteps && (
                            <div className="bg-stone-100 p-2.5 rounded border border-stone-200 text-xs font-sans">
                              <strong className="text-[#800020] block mb-0.5">Next Steps:</strong>
                              {lead.nextSteps}
                            </div>
                          )}
                          
                          {/* Quick Status Update Controls */}
                          <div className="flex justify-end gap-2 pt-2 border-t border-stone-200/60">
                            {lead.status !== 'Completed' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => updateLeadStatus(lead.id, 'Completed')}
                                className="font-sans text-[10px] h-7 px-2 text-emerald-800 hover:bg-emerald-50"
                              >
                                <Check className="w-3 h-3 mr-1" /> Mark Completed
                              </Button>
                            )}
                            {lead.status !== 'In Progress' && lead.status !== 'Completed' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => updateLeadStatus(lead.id, 'In Progress')}
                                className="font-sans text-[10px] h-7 px-2 text-amber-700 hover:bg-amber-50"
                              >
                                Start Investigating
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => updateLeadStatus(lead.id, 'Ruled Out')}
                              className="font-sans text-[10px] h-7 px-2 text-rose-800 hover:bg-rose-50"
                            >
                              Rule Out
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Ruled Out Leads (Genealogical Dead Ends) */}
                <div className="space-y-4 pt-4 border-t border-stone-200">
                  <div>
                    <h3 className="text-xl font-bold text-rose-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-800" /> Ruled Out Leads (Dead Ends)
                    </h3>
                    <p className="text-xs text-stone-500 font-sans">
                      Crucial records and candidates investigated and ruled out to prevent duplicate research. Do not revisit these.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {leads.filter(l => l.status === 'Ruled Out').map(lead => (
                      <Card key={lead.id} className="border-rose-200 bg-rose-50/30 shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <Badge className="bg-rose-800 text-white">RULED OUT</Badge>
                            <span className="text-xs text-stone-500 font-sans">{lead.category}</span>
                          </div>
                          <CardTitle className="text-base font-serif text-rose-900 mt-1">{lead.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <p className="text-stone-700"><strong>Proposed as:</strong> {lead.description}</p>
                          <div className="bg-rose-100/50 p-2 rounded border border-rose-200 text-rose-900">
                            <strong>Why Ruled Out:</strong> {lead.whyRuledOut}
                          </div>
                          {lead.sources && (
                            <p className="text-[10px] text-stone-500 font-sans">
                              <strong>Sources checked:</strong> {lead.sources.join(', ')}
                            </p>
                          )}
                          <div className="flex justify-end pt-1">
                            <Button 
                              size="sm" 
                              variant="link" 
                              onClick={() => updateLeadStatus(lead.id, 'To Investigate')}
                              className="font-sans text-[10px] h-auto p-0 text-stone-600 hover:text-stone-900"
                            >
                              Re-open Lead
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Open Questions Checklist */}
              <div className="space-y-6">
                <Card className="border-stone-300 bg-[#F4EFE6] shadow-md">
                  <CardHeader className="pb-3 border-b border-stone-200">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-serif text-[#800020] flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" /> Open Questions
                      </CardTitle>
                      <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="font-sans text-xs h-7 px-2 border-stone-400">
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md bg-[#FAF6F0] border-stone-300 font-sans">
                          <DialogHeader>
                            <DialogTitle className="font-serif text-xl text-[#800020]">Add Open Question</DialogTitle>
                            <DialogDescription>
                              Add a specific question or missing detail to the research checklist.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddQuestion} className="space-y-4 mt-2">
                            <div>
                              <label className="text-xs font-semibold text-stone-700">Question *</label>
                              <Input 
                                required
                                placeholder="e.g. What is Venera Buatti's exact birth date?" 
                                value={newQuestion.question} 
                                onChange={e => setNewQuestion({...newQuestion, question: e.target.value})}
                                className="bg-white border-stone-300"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-stone-700">Category</label>
                              <Select 
                                value={newQuestion.category} 
                                onValueChange={val => setNewQuestion({...newQuestion, category: val as any})}
                              >
                                <SelectTrigger className="bg-white border-stone-300">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Buatti/Chiappini">Buatti/Chiappini Line</SelectItem>
                                  <SelectItem value="Emmi/Patanè">Emmi/Patanè Line</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-stone-700">Notes / Context</label>
                              <Textarea 
                                placeholder="Add any context, clues, or next steps..." 
                                value={newQuestion.notes} 
                                onChange={e => setNewQuestion({...newQuestion, notes: e.target.value})}
                                className="bg-white border-stone-300 h-20"
                              />
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsAddQuestionOpen(false)}>Cancel</Button>
                              <Button type="submit" className="bg-[#800020] hover:bg-[#600018] text-white">Save Question</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <CardDescription className="font-sans text-xs text-stone-600">
                      Checklist of outstanding details and records still to confirm. Click to cycle status.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[550px]">
                      <div className="divide-y divide-stone-200">
                        {questions.map(q => (
                          <div 
                            key={q.id} 
                            className={`p-4 transition-colors duration-150 hover:bg-stone-100/50 ${
                              q.status === 'Resolved' ? 'bg-stone-100/40 opacity-60' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <Checkbox 
                                  checked={q.status === 'Resolved'} 
                                  onCheckedChange={() => toggleQuestionStatus(q.id)}
                                  className="border-stone-400 data-[state=checked]:bg-[#800020] data-[state=checked]:border-[#800020]"
                                />
                              </div>
                              <div className="space-y-1 flex-1">
                                <div className="flex justify-between items-center gap-2">
                                  <Badge variant="outline" className="font-sans text-[9px] py-0 px-1.5">
                                    {q.category}
                                  </Badge>
                                  <Badge className={`font-sans text-[9px] py-0 px-1.5 ${
                                    q.status === 'Resolved' ? 'bg-emerald-800 text-white' :
                                    q.status === 'In Progress' ? 'bg-amber-700 text-white' :
                                    'bg-stone-500 text-white'
                                  }`}>
                                    {q.status}
                                  </Badge>
                                </div>
                                <p className={`text-sm font-serif font-bold text-stone-800 ${
                                  q.status === 'Resolved' ? 'line-through text-stone-500' : ''
                                }`}>
                                  {q.question}
                                </p>
                                {q.notes && (
                                  <p className="text-xs text-stone-600 font-sans italic mt-1">
                                    "{q.notes}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* ========================================== */}
          {/* TAB: TIMELINE & MIGRATION                  */}
          {/* ========================================== */}
          <TabsContent value="timeline" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left 2 Columns: Vertical Timeline */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-[#800020]">Chronological Family Timeline</h3>
                  <p className="text-xs text-stone-500 font-sans">Key events, births, military service, and migration voyages across generations.</p>
                </div>

                <div className="relative border-l-2 border-stone-300 pl-6 ml-4 space-y-8 py-2">
                  {timelineEvents.map((event, idx) => {
                    const IconComponent = event.icon;
                    return (
                      <div key={idx} className="relative group">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#FAF6F0] shadow-sm ${getLineColor(event.line)}`}>
                          <IconComponent className="w-3 h-3" />
                        </div>

                        {/* Event Card */}
                        <div className="bg-[#FAF6F0] border border-stone-200 rounded-lg p-4 shadow-sm hover:border-[#800020] transition-all duration-150">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-sm font-bold text-[#800020] font-sans">{event.year}</span>
                            <Badge className={getLineBadgeColor(event.line)}>
                              {event.line} Line
                            </Badge>
                          </div>
                          <h4 className="text-base font-bold text-stone-800 mt-1">{event.title}</h4>
                          <p className="text-xs text-stone-600 font-sans mt-1">{event.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Migration Networks & Key Figures */}
              <div className="space-y-6">
                <Card className="border-stone-300 bg-[#F4EFE6] shadow-md">
                  <CardHeader className="pb-3 border-b border-stone-200">
                    <CardTitle className="text-lg font-serif text-[#800020] flex items-center gap-2">
                      <Ship className="w-5 h-5" /> Migration Networks
                    </CardTitle>
                    <CardDescription className="font-sans text-xs text-stone-600">
                      Key figures and sponsors in the family's Ingham, North Queensland sugar industry network.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4 text-sm">
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-stone-800">Pietro Patanè</h4>
                      <p className="text-xs text-stone-600 font-sans">
                        Cane farm owner at Black Rock, via Ingham, N.Q. Employed Gregorio Emmi and guaranteed accommodation for Rosaria and Concetta on arrival. Shared surname with Rosaria strongly suggests a family connection (possibly brother, cousin, or uncle).
                      </p>
                      <Badge variant="outline" className="font-sans text-[9px] text-blue-900 border-blue-900/20 bg-blue-50">
                        Key Sponsor
                      </Badge>
                    </div>

                    <Separator className="bg-stone-200" />

                    <div className="space-y-2">
                      <h4 className="font-bold text-stone-800">Piero Lalli</h4>
                      <p className="text-xs text-stone-600 font-sans">
                        Cane farmer at Blackrock, via Ingham, born Todi, Italy, 6 Feb 1895. Naturalised British subject (1927). First sponsor of Gregorio Emmi's migration application in 1949, listed as a "friend," not a relative. Lalli himself was interned in Australia during WWII (June 1940–Nov 1943).
                      </p>
                      <Badge variant="outline" className="font-sans text-[9px] text-stone-600 border-stone-300 bg-stone-50">
                        Community Contact
                      </Badge>
                    </div>

                    <Separator className="bg-stone-200" />

                    <div className="space-y-2">
                      <h4 className="font-bold text-stone-800">Leonardo Vecchio</h4>
                      <p className="text-xs text-stone-600 font-sans">
                        Worked Piero Lalli's cane farm on a share-profit basis (1949), and later co-signed Rosaria's accommodation guarantee with Pietro Patanè at Black Rock (1950). Appears twice in the family's Ingham circle; relationship not yet known (possible connection to Rosaria's mother Venera Vecchio).
                      </p>
                      <Badge variant="outline" className="font-sans text-[9px] text-emerald-800 border-emerald-800/20 bg-emerald-50">
                        Associate
                      </Badge>
                    </div>

                    <Separator className="bg-stone-200" />

                    <div className="space-y-2">
                      <h4 className="font-bold text-stone-800">Sydney Relocation</h4>
                      <p className="text-xs text-stone-600 font-sans">
                        Gregorio was buried at Rookwood Catholic Cemetery, Sydney, in 1979, indicating the family (or at least Gregorio) had moved from Ingham, North Queensland to the Sydney area at some point between 1950 and 1979.
                      </p>
                    </div>

                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

        </Tabs>
      </main>

      {/* --- FOOTER --- */}
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
    </div>
  );
};

export default Index;
