import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, Link2, Check, X, MessageSquare, Clock, Building2, User } from 'lucide-react';

interface ChronologyEntry {
  date: string;
  event_type: string;
  message_id: number;
  gmail_message_id: string;
  direction: string;
  subject: string;
  from: string;
  evidence: string;
  analysis_available: boolean;
}

interface Action {
  description: string;
  owner: string;
  status: string;
  evidence_msg: number;
  evidence: string;
}

interface ProposedLink {
  target: string;
  reason: string;
  evidence: string;
  status: string;
}

interface Enquiry {
  thread_db_id: number;
  gmail_thread_id: string;
  account_email: string;
  title: string;
  status: string;
  review_status: string;
  person_names: string[];
  people: { name: string; role: string; evidence_msg: number }[];
  institution: string | null;
  institution_raw?: string | null;
  institution_confidence?: string;
  institution_note?: string;
  institutions: string[];
  location: string | null;
  places: string[];
  protocol_refs: string[];
  record_refs: string[];
  chronology: ChronologyEntry[];
  actions: Action[];
  message_count: number;
  message_ids: number[];
  last_activity: string | null;
  linked_threads: ProposedLink[];
  notes: { text: string; at: string }[];
  created_at: string;
  updated_at: string;
}

interface ProposedEnquiry {
  enquiry_id: string;
  title: string;
  status: string;
  review_status: string;
  constituent_threads: string[];
  constituent_messages: number[];
  thread_count: number;
  message_count: number;
  person_names: string[];
  institutions: string[];
  places: string[];
  protocol_refs: string[];
  record_refs: string[];
  actions: Action[];
  outstanding_actions: Action[];
  historical_actions: Action[];
  last_activity: string;
  rationale: string;
  confidence: string;
}

interface ThreadsData {
  version: number;
  generated_at: string;
  thread_count: number;
  proposed_enquiry_count: number;
  single_thread_count: number;
  institution_normalization: { canonical_map_applied: boolean; note: string };
  person_normalization_proposals: { variant_a: string; variant_b: string; evidence: string; confidence: string; status: string }[];
  threads: Record<string, Enquiry>;
  proposed_enquiries: Record<string, ProposedEnquiry>;
  proposed_links: { source_thread: string; target_thread: string; reason: string; evidence: string; status: string }[];
}

const STATUS_OPTIONS = ['open', 'awaiting_response', 'partially_fulfilled', 'resolved', 'not_pursuing'];
const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  awaiting_response: 'Awaiting response',
  partially_fulfilled: 'Partially fulfilled',
  resolved: 'Resolved',
  not_pursuing: 'Not pursuing',
};
const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 border border-blue-200',
  awaiting_response: 'bg-amber-100 text-amber-800 border border-amber-200',
  partially_fulfilled: 'bg-purple-100 text-purple-800 border border-purple-200',
  resolved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  not_pursuing: 'bg-stone-100 text-stone-600 border border-stone-200',
};

const EVENT_COLORS: Record<string, string> = {
  request: 'bg-blue-500',
  receipt: 'bg-green-500',
  acknowledgement: 'bg-green-400',
  response: 'bg-indigo-500',
  follow_up: 'bg-amber-500',
  correspondence: 'bg-stone-400',
};

export function EnquiriesView() {
  const { toast } = useToast();
  const [data, setData] = useState<ThreadsData | null>(null);
  const [reviews, setReviews] = useState<Record<string, Record<string, unknown>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'threads' | 'enquiries'>('threads');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [titleEdit, setTitleEdit] = useState<Record<string, string>>({});
  const [noteText, setNoteText] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const [tRes, rRes] = await Promise.all([
          fetch('/api/correspondence/threads'),
          fetch('/api/correspondence/thread-reviews'),
        ]);
        if (!tRes.ok) throw new Error('Failed to load thread intelligence');
        const tData = await tRes.json();
        setData(tData);
        if (rRes.ok) {
          const rData = await rRes.json();
          setReviews(rData.reviews || {});
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveReview = async (threadId: string, payload: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/correspondence/thread-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId, ...payload }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json();
      if (data?.ok) {
        const r = await fetch('/api/correspondence/thread-reviews');
        if (r.ok) {
          const rd = await r.json();
          setReviews(rd.reviews || {});
        }
        toast({ title: 'Saved', description: 'Review decision persisted.' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save review', variant: 'destructive' });
    }
  };

  const effectiveStatus = (e: Enquiry) => (reviews[e.gmail_thread_id]?.status as string) || e.status;
  const effectiveTitle = (e: Enquiry) => (reviews[e.gmail_thread_id]?.title as string) || e.title;

  const filtered = useMemo(() => {
    if (!data) return [];
    const effStatus = (e: Enquiry) => (reviews[e.gmail_thread_id]?.status as string) || e.status;
    return Object.values(data.threads || {}).filter((e) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'awaiting') return effStatus(e) === 'awaiting_response' || effStatus(e) === 'open';
      if (statusFilter === 'outstanding') return (e.actions || []).some((a) => a.status === 'open');
      if (statusFilter === 'received') return (e.chronology || []).some((c) => c.event_type === 'receipt' || c.event_type === 'response');
      if (statusFilter === 'review') return !reviews[e.gmail_thread_id]?.reviewed_at;
      if (statusFilter === 'resolved') return effStatus(e) === 'resolved';
      return true;
    }).sort((a, b) => (b.last_activity || '').localeCompare(a.last_activity || ''));
  }, [data, reviews, statusFilter]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]"></div></div>;
  }
  if (error) {
    return <Card className="border-red-200 bg-red-50"><CardContent className="pt-6"><p className="text-red-600">Error: {error}</p></CardContent></Card>;
  }
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#800020] font-serif">Enquiries & Correspondence</h2>
          <p className="text-xs text-stone-500 font-sans">
            {data.thread_count} correspondence threads · {data.proposed_enquiry_count} proposed multi-thread enquiries · {(data.proposed_links || []).length} proposed cross-thread links
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-stone-300 bg-white/70 p-1">
            <button type="button" onClick={() => setViewMode('threads')} className={`px-3 py-1 rounded-md text-xs font-sans font-medium ${viewMode === 'threads' ? 'bg-[#800020] text-white' : 'text-stone-700 hover:bg-stone-100'}`}>Threads ({data.thread_count})</button>
            <button type="button" onClick={() => setViewMode('enquiries')} className={`px-3 py-1 rounded-md text-xs font-sans font-medium ${viewMode === 'enquiries' ? 'bg-[#800020] text-white' : 'text-stone-700 hover:bg-stone-100'}`}>Proposed enquiries ({data.proposed_enquiry_count})</button>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 font-sans text-xs"><SelectValue placeholder="Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All enquiries</SelectItem>
              <SelectItem value="awaiting">Awaiting response</SelectItem>
              <SelectItem value="outstanding">Outstanding actions</SelectItem>
              <SelectItem value="received">Documents received</SelectItem>
              <SelectItem value="review">Ready for review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === 'threads' && (
        <div className="space-y-3">
          {filtered.map((e) => {
            const st = effectiveStatus(e);
            const title = effectiveTitle(e);
            const isOpen = expanded[e.gmail_thread_id];
            const outstandingActions = (e.actions || []).filter((a) => a.status === 'open').length;
            const proposedLinks = (e.linked_threads || []).filter((l) => l.status === 'proposed');
            return (
              <Card key={e.gmail_thread_id} className="border-stone-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" className="flex-1 text-left" onClick={() => setExpanded((prev) => ({ ...prev, [e.gmail_thread_id]: !prev[e.gmail_thread_id] }))}>
                      <CardTitle className="text-base font-serif text-stone-800 flex items-center gap-2">
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {title}
                      </CardTitle>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={STATUS_COLORS[st] || 'bg-stone-100'}>{STATUS_LABELS[st] || st}</Badge>
                      <span className="text-[10px] text-stone-400">{e.message_count} msg{e.message_count === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-stone-500 mt-1">
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{e.institution || 'Unknown institution'}{e.institution_confidence === 'low' && <span className="text-amber-600 text-[9px]">(uncertain)</span>}</span>
                    {e.person_names?.length ? <span className="flex items-center gap-1"><User className="w-3 h-3" />{e.person_names.join(', ')}</span> : null}
                    {e.last_activity && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(e.last_activity).toLocaleDateString('en-GB')}</span>}
                    {outstandingActions > 0 && <span className="text-amber-700 font-semibold">{outstandingActions} open action{outstandingActions === 1 ? '' : 's'}</span>}
                    {proposedLinks.length > 0 && <span className="text-blue-700 font-semibold">{proposedLinks.length} proposed link{proposedLinks.length === 1 ? '' : 's'}</span>}
                  </div>
                </CardHeader>
                {isOpen && (
                  <CardContent className="p-4 space-y-4 border-t border-stone-200">
                    <div className="flex flex-wrap gap-3 items-center">
                      <Select value={st} onValueChange={(v) => saveReview(e.gmail_thread_id, { status: v })}>
                        <SelectTrigger className="w-44 text-xs font-sans"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 flex-1 min-w-[16rem]">
                        <Input className="text-xs" placeholder="Edit title…" value={titleEdit[e.gmail_thread_id] ?? title} onChange={(ev) => setTitleEdit((prev) => ({ ...prev, [e.gmail_thread_id]: ev.target.value }))} />
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => saveReview(e.gmail_thread_id, { title: titleEdit[e.gmail_thread_id] ?? title })}>Save title</Button>
                      </div>
                    </div>
                    {(e.protocol_refs?.length || e.record_refs?.length) ? (
                      <div className="text-xs text-stone-600 space-y-1">
                        {e.protocol_refs?.length ? <div><span className="font-semibold">Protocol refs:</span> {e.protocol_refs.join(', ')}</div> : null}
                        {e.record_refs?.length ? <div><span className="font-semibold">Record refs:</span> {e.record_refs.join(', ')}</div> : null}
                        {e.places?.length ? <div><span className="font-semibold">Places:</span> {e.places.join(', ')}</div> : null}
                      </div>
                    ) : null}
                    <div>
                      <div className="text-xs font-bold text-[#800020] uppercase tracking-wider mb-2">Chronology ({e.chronology?.length || 0})</div>
                      <div className="relative border-l-2 border-stone-300 pl-4 ml-2 space-y-3">
                        {(e.chronology || []).map((c, i) => (
                          <div key={i} className="relative">
                            <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full ${EVENT_COLORS[c.event_type] || 'bg-stone-400'}`} />
                            <div className="text-[10px] text-stone-500">{c.date ? new Date(c.date).toLocaleString('en-GB') : '—'} · {c.direction} · {c.event_type}</div>
                            <div className="text-xs text-stone-800 font-medium">{c.subject}</div>
                            <div className="text-[10px] text-stone-500">From: {c.from} · Message ID: {c.message_id}</div>
                            {c.evidence && <div className="text-[10px] text-stone-600 italic mt-0.5 break-words">"{c.evidence.slice(0, 200)}{c.evidence.length > 200 ? '…' : ''}"</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                    {e.actions?.length ? (
                      <div>
                        <div className="text-xs font-bold text-[#800020] uppercase tracking-wider mb-2">Actions & outstanding ({e.actions.length})</div>
                        <ul className="space-y-1">
                          {e.actions.map((a, i) => (
                            <li key={i} className="text-xs text-stone-700 flex items-start gap-2">
                              <Badge className={
                                a.status === 'outstanding' ? 'bg-amber-100 text-amber-800 text-[9px]' :
                                a.status === 'completed' ? 'bg-emerald-100 text-emerald-800 text-[9px]' :
                                a.status === 'uncertain' ? 'bg-purple-100 text-purple-800 text-[9px]' :
                                'bg-stone-100 text-stone-600 text-[9px]'
                              }>{a.status}</Badge>
                              <span>{a.description}</span>
                              <span className="text-stone-400 text-[10px]">(msg {a.evidence_msg})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {proposedLinks.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Proposed cross-thread links (require confirmation)</div>
                        <div className="space-y-2">
                          {proposedLinks.map((l, i) => (
                            <div key={i} className="rounded border border-blue-200 bg-blue-50 p-2 text-xs">
                              <div className="font-semibold text-blue-800">{l.reason}</div>
                              <div className="text-stone-600">Evidence: {l.evidence}</div>
                              <div className="text-stone-500 text-[10px]">Target thread: {l.target}</div>
                              <div className="flex gap-2 mt-1">
                                <Button size="sm" className="text-[10px] h-6 px-2 bg-emerald-700 text-white" onClick={() => saveReview(e.gmail_thread_id, { link_target: l.target, link_decision: 'confirmed' })}>
                                  <Check className="w-3 h-3 mr-1" /> Confirm link
                                </Button>
                                <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 text-red-700" onClick={() => saveReview(e.gmail_thread_id, { link_target: l.target, link_decision: 'rejected' })}>
                                  <X className="w-3 h-3 mr-1" /> Reject link
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Private research notes</div>
                      {((reviews[e.gmail_thread_id]?.notes as unknown[]) || []).map((n: unknown, i: number) => {
                        const note = n as { text?: string; at?: string };
                        return (
                          <div key={i} className="text-xs text-stone-600 border-l-2 border-stone-200 pl-2 mb-1">
                            <span className="text-stone-400 text-[10px]">{note.at}</span> {note.text}
                          </div>
                        );
                      })}
                      <div className="flex gap-2 mt-1">
                        <Input className="text-xs" placeholder="Add a note…" value={noteText[e.gmail_thread_id] || ''} onChange={(ev) => setNoteText((prev) => ({ ...prev, [e.gmail_thread_id]: ev.target.value }))} />
                        <Button size="sm" variant="outline" className="text-xs" disabled={!(noteText[e.gmail_thread_id] || '').trim()} onClick={() => { saveReview(e.gmail_thread_id, { note: (noteText[e.gmail_thread_id] || '').trim() }); setNoteText((prev) => ({ ...prev, [e.gmail_thread_id]: '' })); }}>Add note</Button>
                      </div>
                    </div>
                    <div className="text-[10px] text-stone-400">
                      Source messages: {e.message_ids.join(', ')} · Gmail thread: {e.gmail_thread_id} · Account: {e.account_email}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-sm text-stone-500 text-center py-8">No threads match this filter.</div>
          )}
        </div>
      )}

      {viewMode === 'enquiries' && (
        <div className="space-y-3">
          {Object.values(data?.proposed_enquiries || {}).map((e) => (
            <Card key={e.enquiry_id} className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-serif text-stone-800 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-700" />
                  {e.title}
                </CardTitle>
                <div className="flex flex-wrap gap-3 text-xs text-stone-500 mt-1">
                  <span className="text-blue-700 font-semibold">{e.thread_count} linked threads · {e.message_count} messages</span>
                  {e.institutions?.length ? <span>{e.institutions.join(', ')}</span> : null}
                  {e.person_names?.length ? <span>{e.person_names.join(', ')}</span> : null}
                  {e.last_activity && <span>{new Date(e.last_activity).toLocaleDateString('en-GB')}</span>}
                  <Badge className="bg-blue-100 text-blue-800 text-[9px]">proposed · {e.confidence} confidence</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs text-stone-700">
                <div className="text-stone-500 italic">{e.rationale}</div>
                <div><span className="font-semibold">Constituent threads:</span> {e.constituent_threads.join(', ')}</div>
                {e.protocol_refs?.length ? <div><span className="font-semibold">Protocol refs:</span> {e.protocol_refs.join(', ')}</div> : null}
                {e.outstanding_actions?.length ? (
                  <div>
                    <span className="font-semibold text-amber-700">Outstanding actions ({e.outstanding_actions.length}):</span>
                    <ul className="list-disc ml-4 mt-1">
                      {e.outstanding_actions.map((a, i) => <li key={i}>{a.description}</li>)}
                    </ul>
                  </div>
                ) : null}
                {e.historical_actions?.length ? (
                  <div>
                    <span className="font-semibold text-stone-500">Historical actions ({e.historical_actions.length}):</span>
                    <ul className="list-disc ml-4 mt-1 text-stone-500">
                      {e.historical_actions.map((a, i) => <li key={i}>{a.description}</li>)}
                    </ul>
                  </div>
                ) : null}
                <div className="text-[10px] text-stone-400">
                  Proposed — requires human confirmation. Constituent threads and messages are preserved regardless of decision.
                </div>
              </CardContent>
            </Card>
          ))}
          {Object.keys(data?.proposed_enquiries || {}).length === 0 && (
            <div className="text-sm text-stone-500 text-center py-8">No proposed multi-thread enquiries.</div>
          )}
        </div>
      )}
    </div>
  );
}