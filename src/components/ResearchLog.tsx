import { useState } from 'react';
import { Plus, HelpCircle, Check, AlertTriangle, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { ResearchLead, OpenQuestion } from '@/types';
import {
  DEFAULT_NEW_LEAD, DEFAULT_NEW_QUESTION,
  LEAD_CATEGORIES, LEAD_STATUSES, QUESTION_CATEGORIES, QUESTION_STATUSES,
} from '@/lib/constants';

interface ResearchLogProps {
  leads: ResearchLead[];
  questions: OpenQuestion[];
  setLeads: React.Dispatch<React.SetStateAction<ResearchLead[]>>;
  setQuestions: React.Dispatch<React.SetStateAction<OpenQuestion[]>>;
}

function AddLeadDialog({ leads, setLeads }: {
  leads: ResearchLead[];
  setLeads: React.Dispatch<React.SetStateAction<ResearchLead[]>>;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_NEW_LEAD });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) return;

    const lead: ResearchLead = {
      id: `lead-${Date.now()}`,
      title: form.title,
      category: form.category,
      status: form.status,
      description: form.description,
      nextSteps: form.nextSteps || undefined,
      whyRuledOut: form.status === 'Ruled Out' ? 'Investigated and ruled out.' : undefined,
    };

    setLeads([lead, ...leads]);
    setOpen(false);
    toast({ title: "Research Lead Added", description: `"${lead.title}" has been added to the research log.` });
    setForm({ ...DEFAULT_NEW_LEAD });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[#800020] hover:bg-[#600018] text-white font-sans text-xs flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-[#FAF6F0] border-stone-300 font-sans">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-[#800020]">Add Research Lead</DialogTitle>
          <DialogDescription>Document a new lead, connection, or hypothesis to investigate.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-semibold text-stone-700">Lead Title *</label>
            <Input required placeholder="e.g. Pietro Patanè Connection"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="bg-white border-stone-300" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700">Category</label>
              <Select value={form.category} onValueChange={val => setForm({ ...form, category: val as ResearchLead['category'] })}>
                <SelectTrigger className="bg-white border-stone-300">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700">Status</label>
              <Select value={form.status} onValueChange={val => setForm({ ...form, status: val as ResearchLead['status'] })}>
                <SelectTrigger className="bg-white border-stone-300">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Description *</label>
            <Textarea required placeholder="Describe the lead, connection, or document..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="bg-white border-stone-300 h-24" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Next Steps</label>
            <Input placeholder="What needs to be done next?"
              value={form.nextSteps} onChange={e => setForm({ ...form, nextSteps: e.target.value })}
              className="bg-white border-stone-300" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-[#800020] hover:bg-[#600018] text-white">Save Lead</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddQuestionDialog({ questions, setQuestions }: {
  questions: OpenQuestion[];
  setQuestions: React.Dispatch<React.SetStateAction<OpenQuestion[]>>;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_NEW_QUESTION });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question) return;

    const question: OpenQuestion = {
      id: `q-${Date.now()}`,
      question: form.question,
      category: form.category,
      status: form.status,
      notes: form.notes || undefined,
    };

    setQuestions([question, ...questions]);
    setOpen(false);
    toast({ title: "Open Question Added", description: "The question has been added to the checklist." });
    setForm({ ...DEFAULT_NEW_QUESTION });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="font-sans text-xs h-7 px-2 border-stone-400">
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-[#FAF6F0] border-stone-300 font-sans">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-[#800020]">Add Open Question</DialogTitle>
          <DialogDescription>Add a specific question or missing detail to the research checklist.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-semibold text-stone-700">Question *</label>
            <Input required placeholder="e.g. What is Venera Buatti's exact birth date?"
              value={form.question} onChange={e => setForm({ ...form, question: e.target.value })}
              className="bg-white border-stone-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Category</label>
            <Select value={form.category} onValueChange={val => setForm({ ...form, category: val as OpenQuestion['category'] })}>
              <SelectTrigger className="bg-white border-stone-300">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat} Line</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Notes / Context</label>
            <Textarea placeholder="Add any context, clues, or next steps..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="bg-white border-stone-300 h-20" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-[#800020] hover:bg-[#600018] text-white">Save Question</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LeadCard({ lead, onUpdateStatus }: { lead: ResearchLead; onUpdateStatus: (id: string, status: ResearchLead['status']) => void }) {
  return (
    <Card className="border-stone-300 bg-[#FAF6F0] shadow-sm">
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
        <div className="flex justify-end gap-2 pt-2 border-t border-stone-200/60">
          {lead.status !== 'Completed' && (
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus(lead.id, 'Completed')}
              className="font-sans text-[10px] h-7 px-2 text-emerald-800 hover:bg-emerald-50">
              <Check className="w-3 h-3 mr-1" /> Mark Completed
            </Button>
          )}
          {lead.status !== 'In Progress' && lead.status !== 'Completed' && (
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus(lead.id, 'In Progress')}
              className="font-sans text-[10px] h-7 px-2 text-amber-700 hover:bg-amber-50">
              Start Investigating
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onUpdateStatus(lead.id, 'Ruled Out')}
            className="font-sans text-[10px] h-7 px-2 text-rose-800 hover:bg-rose-50">
            Rule Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RuledOutLeadCard({ lead, onReopen }: { lead: ResearchLead; onReopen: (id: string) => void }) {
  return (
    <Card className="border-rose-200 bg-rose-50/30 shadow-sm">
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
          <Button size="sm" variant="link" onClick={() => onReopen(lead.id)}
            className="font-sans text-[10px] h-auto p-0 text-stone-600 hover:text-stone-900">
            Re-open Lead
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ResearchLog({ leads, questions, setLeads, setQuestions }: ResearchLogProps) {
  const { toast } = useToast();

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
    toast({ title: "Lead Updated", description: `Lead status updated to ${status}.` });
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
    toast({ title: "Question Updated", description: "The question status has been updated." });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-[#800020]">Active Research Leads</h3>
              <p className="text-xs text-stone-500 font-sans">Hypotheses, connections, and avenues currently being investigated.</p>
            </div>
            <AddLeadDialog leads={leads} setLeads={setLeads} />
          </div>
          <div className="space-y-4">
            {leads.filter(l => l.status !== 'Ruled Out').map(lead => (
              <LeadCard key={lead.id} lead={lead} onUpdateStatus={updateLeadStatus} />
            ))}
          </div>
        </div>

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
              <RuledOutLeadCard key={lead.id} lead={lead} onReopen={(id) => updateLeadStatus(id, 'To Investigate')} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-stone-300 bg-[#F4EFE6] shadow-md">
          <CardHeader className="pb-3 border-b border-stone-200">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-serif text-[#800020] flex items-center gap-2">
                <HelpCircle className="w-5 h-5" /> Open Questions
              </CardTitle>
              <AddQuestionDialog questions={questions} setQuestions={setQuestions} />
            </div>
            <CardDescription className="font-sans text-xs text-stone-600">
              Checklist of outstanding details and records still to confirm. Click to cycle status.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[550px]">
              <div className="divide-y divide-stone-200">
                {questions.map(q => (
                  <div key={q.id}
                    className={`p-4 transition-colors duration-150 hover:bg-stone-100/50 ${q.status === 'Resolved' ? 'bg-stone-100/40 opacity-60' : ''}`}>
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
                          <Badge variant="outline" className="font-sans text-[9px] py-0 px-1.5">{q.category}</Badge>
                          <Badge className={`font-sans text-[9px] py-0 px-1.5 ${
                            q.status === 'Resolved' ? 'bg-emerald-800 text-white' :
                            q.status === 'In Progress' ? 'bg-amber-700 text-white' :
                            'bg-stone-500 text-white'
                          }`}>{q.status}</Badge>
                        </div>
                        <p className={`text-sm font-serif font-bold text-stone-800 ${q.status === 'Resolved' ? 'line-through text-stone-500' : ''}`}>
                          {q.question}
                        </p>
                        {q.notes && <p className="text-xs text-stone-600 font-sans italic mt-1">"{q.notes}"</p>}
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
  );
}
