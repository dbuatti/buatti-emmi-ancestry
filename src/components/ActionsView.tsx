import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Clock, Mail, AlertTriangle, CheckCircle2, HelpCircle, ArrowRight, Copy, RefreshCw, Save, FileText, ChevronDown, ChevronRight } from 'lucide-react';

interface DraftData {
  thread_id: string;
  draft_text: string;
  language: string;
  generated_at: string;
  model: string;
  context_summary: string;
  review_status: string;
  edited_text: string | null;
  reviewed_at: string | null;
  reply_reason?: string;
  warnings?: string[];
  readiness?: "ready_for_review" | "incomplete" | "blocked";
  verification_results?: ReadonlyArray<{
    id: string;
    status: "pass" | "fail" | "warn" | "not_applicable";
    findings?: ReadonlyArray<string>;
  }>;
  provenance?: {
    source_messages?: number[];
    analysis_files?: string[];
    verified_facts_used?: string[];
    ai_suggestions_used?: string[];
    unverified_content_flagged?: string[];
    source_thread?: string;
    drafting_inputs?: {
      intended_recipient?: { institution: string | null; office: string | null; email: string | null; established_by?: string | null };
      latest_inbound_message_id?: number | null;
      required_actions?: ReadonlyArray<{ id: string; description: string; evidence: string }>;
      verified_contact_details?: Record<string, unknown>;
      excluded_identities?: ReadonlyArray<Record<string, unknown>>;
      prohibited_recipient_markers?: ReadonlyArray<string>;
      recipient_email_checks?: ReadonlyArray<string>;
      postal_address_rule?: string;
    };
    research_findings?: {
    accessed_at: string;
    source_url: string;
    verified_contact: { email: string; source: string; confidence: string; verified_at: string };
    general_contact: { email: string; pec: string; phone: string; source: string };
    procedures: string[];
    requirements: string[];
    notes: string;
  };
  suggested_new_correspondence?: {
      recommended_institution: string;
      recommended_email: string | null;
      reason: string;
      evidence: { msg_id: number; quote: string }[];
      context_summary: string;
      uncertainty_note: string;
      verified_facts: string[];
      unverified: string[];
    };
  };
}

interface ActionItem {
  thread_id: string;
  db_thread_id: number;
  account_email: string;
  subject: string;
  institution: string | null;
  institution_confidence?: string;
  last_activity: string;
  message_count: number;
  message_ids: number[];
  classification: 'reply_required' | 'action_required' | 'awaiting_response' | 'follow_up_due' | 'documents_received' | 'resolved' | 'uncertain';
  confidence: 'confirmed' | 'inferred';
  reasoning: string;
  evidence: { msg_id: number; quote: string }[];
  actions_requested: string[];
  thread_state?: string | null;
  unresolved_research_questions?: string[];
  outstanding_questions: string[];
  promised: string[];
  document_receipt?: string;
  fulfilment?: string;
  attachment_gate?: {
    document_count?: number;
    documents_received?: boolean;
    readable_documents?: { attachment_id: number; filename: string; status: string; text_path?: string | null }[];
    unreadable_documents?: { attachment_id: number; filename: string; status: string; confidence?: number | null }[];
    ungated_message_ids?: number[];
    blocks_no_action?: boolean;
    fulfilment?: string;
  };
  request_links?: { request_id: string; status: string; fulfilment: string; ambiguous: boolean; needs_review?: boolean }[];
  research_findings?: {
    accessed_at: string;
    source_url: string;
    verified_contact: { email: string; source: string; confidence: string; verified_at: string };
    general_contact: { email: string; pec: string; phone: string; source: string };
    procedures: string[];
    requirements: string[];
    notes: string;
  };
  suggested_new_correspondence?: {
    recommended_institution: string;
    recommended_email: string | null;
    reason: string;
    evidence: { msg_id: number; quote: string }[];
    context_summary: string;
    uncertainty_note: string;
    verified_facts: string[];
    unverified: string[];
  };
}

interface ActionsData {
  version: number;
  generated_at: string;
  total_threads: number;
  counts: Record<string, number>;
  confidence_counts: Record<string, number>;
  actions: Record<string, ActionItem>;
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  reply_required: 'Reply required',
  action_required: 'Action required',
  awaiting_response: 'Awaiting response',
  follow_up_due: 'Follow-up due',
  documents_received: 'Documents received',
  resolved: 'Resolved',
  uncertain: 'Uncertain',
};
const CLASSIFICATION_COLORS: Record<string, string> = {
  reply_required: 'bg-red-100 text-red-800 border border-red-200',
  action_required: 'bg-orange-100 text-orange-800 border border-orange-200',
  awaiting_response: 'bg-blue-100 text-blue-800 border border-blue-200',
  follow_up_due: 'bg-amber-100 text-amber-800 border border-amber-200',
  documents_received: 'bg-teal-100 text-teal-800 border border-teal-200',
  resolved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  uncertain: 'bg-purple-100 text-purple-800 border border-purple-200',
};
const CLASSIFICATION_ICONS: Record<string, ReactNode> = {
  reply_required: <Mail className="w-4 h-4 text-red-600" />,
  action_required: <AlertTriangle className="w-4 h-4 text-orange-600" />,
  awaiting_response: <Clock className="w-4 h-4 text-blue-600" />,
  follow_up_due: <Clock className="w-4 h-4 text-amber-600" />,
  documents_received: <FileText className="w-4 h-4 text-teal-600" />,
  resolved: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  uncertain: <HelpCircle className="w-4 h-4 text-purple-600" />,
};

function VerificationPanel({
  readiness,
  results,
  recipient,
  toast,
}: {
  readiness?: string;
  results?: ReadonlyArray<{ id: string; status: "pass" | "fail" | "warn" | "not_applicable"; findings?: ReadonlyArray<string> }>;
  recipient?: { institution: string | null; office: string | null; email: string | null };
  toast: (props: { title: string; description?: string; variant?: "destructive" }) => void;
}) {
  if (!results || results.length === 0) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 animate-pulse">
        ⚠ No verification report. This draft has not passed the drafting verification gate and must not be sent.
      </div>
    );
  }
  const statusMap: Record<string, { label: string; cls: string; badge: string }> = {
    pass: { label: "✅ pass", cls: "text-green-700", badge: "bg-green-50 border-green-200" },
    fail: { label: "❌ fail", cls: "text-red-700", badge: "bg-red-50 border-red-200" },
    warn: { label: "⚠️ warn", cls: "text-amber-700", badge: "bg-amber-50 border-amber-200" },
    not_applicable: { label: "ⓘ n/a", cls: "text-stone-400", badge: "bg-stone-50 border-stone-200" },
  };
  const readinessMap: Record<string, { label: string; cls: string; border: string }> = {
    ready_for_review: { label: "✅ ready for review", cls: "text-green-700 font-semibold", border: "border-green-500 bg-green-50" },
    incomplete: { label: "⚠️ incomplete", cls: "text-amber-700 font-semibold", border: "border-amber-500 bg-amber-50" },
    blocked: { label: "❌ blocked", cls: "text-red-700 font-semibold", border: "border-red-500 bg-red-50 animate-pulse" },
  };
  const r = readinessMap[readiness || ""] || { label: readiness || "unknown", cls: "text-stone-600", border: "border-stone-300 bg-stone-50" };

  const counts = results.reduce<Record<string, number>>(
    (acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; },
    {} as Record<string, number>
  );
  const totalFindings = results.reduce((acc, c) => acc + (c.findings || []).length, 0);

  return (
    <div className={`rounded p-3 text-xs space-y-2 ${r.border}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px]">Verification gate (10 checks)</span>
        <span className={`ml-2 ${r.cls} font-semibold`}>{r.label}</span>
      </div>
      {totalFindings > 0 && (
        <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">{totalFindings} finding{totalFindings === 1 ? '' : 's'}</div>
      )}
      {results.map((c) => {
        const s = statusMap[c.status] || { label: c.status, cls: "text-stone-600", badge: "bg-stone-50 border-stone-200" };
        return (
          <div key={c.id} className="flex items-start gap-2">
            <span className={`w-20 flex-shrink-0 ${s.cls} font-semibold`}>{s.label}</span>
            <span className={`w-20 ${s.badge} border rounded px-1.5 py-0.5 flex-shrink-0`}>{c.id}</span>
            <div className="flex-1">
              {(c.findings || []).map((f, i) => (
                <div key={i} className="ml-0 text-stone-600 break-words leading-tight">• {f}</div>
              ))}
              {c.findings?.length === 0 && <div className="ml-0 text-stone-400 text-[11px] italic">No findings</div>}
            </div>
          </div>
        );
      })}
      <div className="text-[10px] text-stone-400 italic">
        {recipient?.institution ? `Intended recipient: ${recipient.institution}` : "No intended recipient recorded"}
        {recipient?.office ? ` — ${recipient.office}` : ""}
        {recipient?.email ? ` — ${recipient.email}` : " — no verified email"}
      </div>
      <Button size="sm" className="ml-2 text-xs font-mono opacity-70 hover:opacity-100 transition-opacity" onClick={async () => {
        if (!results || results.length === 0) return;
        const json = JSON.stringify(results.map(rc => ({ id: rc.id, status: rc.status, findings: rc.findings })));
        await navigator.clipboard.writeText(json);
        toast({ title: 'Copied', description: 'Findings copied to clipboard.' });
      }}>
        <Copy className="w-3 h-3 mr-1" /> Copy
      </Button>
    </div>
  );
}


export function ActionsView() {
  const { toast } = useToast();
  const [data, setData] = useState<ActionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  // Expanded thread detail state
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Record<string, any[]>>({});
  const [threadAnalyses, setThreadAnalyses] = useState<Record<string, Record<number, any>>>({});
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);

  // Draft modal state
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftThreadId, setDraftThreadId] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftCopied, setDraftCopied] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  // New correspondence draft state
  const [newDraftOpen, setNewDraftOpen] = useState(false);
  const [newDraftThreadId, setNewDraftThreadId] = useState<string | null>(null);
  const [newDraftLoading, setNewDraftLoading] = useState(false);
  const [newDraftData, setNewDraftData] = useState<DraftData | null>(null);
  const [newDraftText, setNewDraftText] = useState('');
  const [newDraftCopied, setNewDraftCopied] = useState(false);

  const openDraft = async (threadId: string, force = false) => {
    setDraftThreadId(threadId);
    setDraftOpen(true);
    setDraftLoading(true);
    setConfirmOverwrite(false);
    try {
      const res = await fetch(`/api/correspondence/draft-reply/${encodeURIComponent(threadId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to generate draft');
      if (data.confirm_overwrite) {
        setConfirmOverwrite(true);
        setDraftData(data.draft as DraftData);
        setDraftText((data.draft as DraftData).edited_text || (data.draft as DraftData).draft_text || '');
      } else {
        setDraftData(data.draft as DraftData);
        setDraftText((data.draft as DraftData).edited_text || (data.draft as DraftData).draft_text || '');
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to generate draft', variant: 'destructive' });
      setDraftOpen(false);
    } finally {
      setDraftLoading(false);
    }
  };

  const openNewDraft = async (threadId: string) => {
    setNewDraftThreadId(threadId);
    setNewDraftOpen(true);
    setNewDraftLoading(true);
    try {
      const res = await fetch(`/api/correspondence/draft-new/${encodeURIComponent(threadId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to generate draft');
      setNewDraftData(data.draft as DraftData);
      setNewDraftText((data.draft as DraftData).edited_text || (data.draft as DraftData).draft_text || '');
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to generate draft', variant: 'destructive' });
      setNewDraftOpen(false);
    } finally {
      setNewDraftLoading(false);
    }
  };

  const saveDraftEdit = async () => {
    if (!draftThreadId) return;
    const originalText = draftData?.draft_text || '';
    const wasEdited = draftText !== originalText;
    try {
      const res = await fetch(`/api/correspondence/draft-reply/${encodeURIComponent(draftThreadId)}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edited_text: draftText }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to save');
      setDraftData(data.draft as DraftData);
      toast({ title: 'Draft saved', description: 'Your edits have been saved.' });

      // Capture correction if text was meaningfully changed
      if (wasEdited && originalText && draftText) {
        fetch('/api/corrections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            thread_id: draftThreadId,
            field: 'draft_text',
            original: originalText,
            corrected: draftText,
            correction_type: 'drafting',
            stage: 'drafting',
            scope: 'case_specific',
            source: 'app_ui',
            source_detail: 'ActionsView draft edit',
            human_confirmed: true,
            notes: 'Human edited AI-generated draft',
          }),
        }).catch(() => {});
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to save', variant: 'destructive' });
    }
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draftText);
      setDraftCopied(true);
      setTimeout(() => setDraftCopied(false), 2000);
      toast({ title: 'Copied', description: 'Draft copied to clipboard. Paste into your email client.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Select the text and copy manually.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/correspondence/actions');
        if (!res.ok) throw new Error('Failed to load actions');
        const d = await res.json();
        setData(d);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchThreadMessages = async (threadId: string) => {
    if (threadMessages[threadId]) return; // already loaded
    setLoadingMessages(threadId);
    try {
      const res = await fetch(`/api/correspondence/threads/${encodeURIComponent(threadId)}/messages`);
      if (!res.ok) throw new Error('Failed to load messages');
      const d = await res.json();
      setThreadMessages(prev => ({ ...prev, [threadId]: d.messages || [] }));
      // Fetch analysis for each message
      const analyses: Record<number, any> = {};
      for (const m of (d.messages || [])) {
        try {
          const ar = await fetch(`/api/correspondence/analysis/${m.id}`);
          if (ar.ok) {
            const ad = await ar.json();
            analyses[m.id] = ad;
          }
        } catch {}
      }
      setThreadAnalyses(prev => ({ ...prev, [threadId]: analyses }));
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load thread messages', variant: 'destructive' });
    } finally {
      setLoadingMessages(null);
    }
  };

  const toggleExpand = (threadId: string) => {
    if (expandedThread === threadId) {
      setExpandedThread(null);
    } else {
      setExpandedThread(threadId);
      fetchThreadMessages(threadId);
    }
  };

  const changeClassification = async (threadId: string, newClassification: string, currentClassification: string) => {
    if (newClassification === currentClassification) return;
    // Capture correction
    fetch('/api/corrections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread_id: threadId,
        field: 'classification',
        original: currentClassification,
        corrected: newClassification,
        correction_type: 'classification',
        stage: 'action_detection',
        scope: 'case_specific',
        source: 'app_ui',
        source_detail: 'ActionsView classification change',
        human_confirmed: true,
        notes: `Classification changed from ${currentClassification} to ${newClassification}`,
      }),
    }).catch(() => {});
    // Update local state
    if (data) {
      const updated = { ...data };
      if (updated.actions[threadId]) {
        updated.actions[threadId] = { ...updated.actions[threadId], classification: newClassification as any };
      }
      setData(updated);
    }
    toast({ title: 'Classification updated', description: `${currentClassification} → ${newClassification}` });
  };

  const needsReview = (a: ActionItem) => {
    if (a.classification === 'documents_received') return true;
    if (a.attachment_gate?.blocks_no_action) return true;
    return (a.request_links || []).some((rl) => rl.needs_review || rl.ambiguous);
  };

  const items = useMemo(() => {
    if (!data) return [];
    return Object.values(data.actions).filter((a) => {
      if (filter === 'all') return true;
      if (filter === 'needs_review') return needsReview(a);
      if (filter === 'awaiting_institution') return a.classification === 'awaiting_response' || a.classification === 'follow_up_due';
      if (filter === 'needs_reply') return a.classification === 'reply_required' || a.classification === 'action_required';
      return a.classification === filter;
    }).sort((a, b) => (b.last_activity || '').localeCompare(a.last_activity || ''));
  }, [data, filter]);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]"></div></div>;
  if (error) return <Card className="border-red-200 bg-red-50"><CardContent className="pt-6"><p className="text-red-600">Error: {error}</p></CardContent></Card>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#800020] font-serif">Actions & Replies</h2>
          <p className="text-xs text-stone-500 font-sans">
            {data.total_threads} correspondence threads classified · {data.counts['reply_required'] || 0} reply required · {data.counts['action_required'] || 0} action required · {data.counts['awaiting_response'] || 0} awaiting response · {data.counts['follow_up_due'] || 0} follow-up due · {data.counts['documents_received'] || 0} documents received · {data.counts['resolved'] || 0} resolved · {data.counts['uncertain'] || 0} uncertain
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48 font-sans text-xs"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({data.total_threads})</SelectItem>
            <SelectItem value="needs_reply">Needs my reply ({Object.values(data.actions).filter((a) => a.classification === 'reply_required' || a.classification === 'action_required').length})</SelectItem>
            <SelectItem value="needs_review">Needs my review ({Object.values(data.actions).filter(needsReview).length})</SelectItem>
            <SelectItem value="awaiting_institution">Awaiting institution ({Object.values(data.actions).filter((a) => a.classification === 'awaiting_response' || a.classification === 'follow_up_due').length})</SelectItem>
            <SelectItem value="reply_required">Reply required ({data.counts['reply_required'] || 0})</SelectItem>
            <SelectItem value="action_required">Action required ({data.counts['action_required'] || 0})</SelectItem>
            <SelectItem value="awaiting_response">Awaiting response ({data.counts['awaiting_response'] || 0})</SelectItem>
            <SelectItem value="follow_up_due">Follow-up due ({data.counts['follow_up_due'] || 0})</SelectItem>
            <SelectItem value="documents_received">Documents received ({data.counts['documents_received'] || 0})</SelectItem>
            <SelectItem value="resolved">Resolved ({data.counts['resolved'] || 0})</SelectItem>
            <SelectItem value="uncertain">Uncertain ({data.counts['uncertain'] || 0})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.thread_id} className="border-stone-200">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => toggleExpand(a.thread_id)} className="text-stone-400 hover:text-stone-700 mr-1 mt-0.5" title={expandedThread === a.thread_id ? 'Collapse' : 'Expand'}>
                  {expandedThread === a.thread_id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-serif text-stone-800 flex items-center gap-2">
                    {CLASSIFICATION_ICONS[a.classification]}
                    {a.subject}
                  </CardTitle>
                  <div className="flex flex-wrap gap-3 text-xs text-stone-500 mt-1">
                    {a.institution && <span>{a.institution}{a.institution_confidence === 'low' ? ' (uncertain)' : ''}</span>}
                    {a.last_activity && <span>{new Date(a.last_activity).toLocaleDateString('en-GB')}</span>}
                    <span>{a.message_count} msg{a.message_count === 1 ? '' : 's'}</span>
                    <select
                      value={a.classification}
                      onChange={(e) => changeClassification(a.thread_id, e.target.value, a.classification)}
                      className="text-[10px] border border-stone-300 rounded px-1 py-0.5 bg-white font-sans"
                      title="Change classification"
                    >
                      <option value="reply_required">Reply required</option>
                      <option value="action_required">Action required</option>
                      <option value="awaiting_response">Awaiting response</option>
                      <option value="follow_up_due">Follow-up due</option>
                      <option value="documents_received">Documents received</option>
                      <option value="resolved">Resolved</option>
                      <option value="uncertain">Uncertain</option>
                    </select>
                    <Badge className={a.confidence === 'confirmed' ? 'bg-emerald-50 text-emerald-700 text-[9px]' : 'bg-stone-100 text-stone-500 text-[9px]'}>{a.confidence}</Badge>
                    {a.thread_state && a.thread_state !== a.classification && (
                      <Badge className="bg-stone-100 text-stone-600 text-[9px] border border-stone-300">
                        {a.thread_state === 'declined' ? 'Declined by institution' :
                         a.thread_state === 'supplied' ? 'Document supplied — inspection outstanding' :
                         a.thread_state === 'redirected' ? 'Referred to another institution' :
                         a.thread_state === 'acknowledged' ? 'Acknowledged' :
                         a.thread_state === 'awaiting_response' ? 'Waiting for institution' :
                         a.thread_state}
                      </Badge>
                    )}
                    {needsReview(a) && <Badge className="bg-amber-100 text-amber-800 text-[9px]">needs review</Badge>}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs text-stone-700">
              <div className="text-stone-800">{a.reasoning}</div>
              {a.evidence?.length ? (
                <div className="text-[10px] text-stone-500 italic break-words">
                  Evidence: "{a.evidence[0].quote?.slice(0, 200)}{a.evidence[0].quote?.length > 200 ? '…' : ''}"
                  <span className="not-italic text-stone-400"> (msg {a.evidence[0].msg_id})</span>
                </div>
              ) : null}
              {a.outstanding_questions?.length ? (
                <div>
                  <span className="font-semibold text-amber-700">Outstanding:</span>
                  <ul className="list-disc ml-4 mt-0.5">
                    {a.outstanding_questions.slice(0, 3).map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
              ) : null}
              {a.unresolved_research_questions?.length ? (
                <div>
                  <span className="font-semibold text-stone-500">Unresolved research questions:</span>
                  <ul className="list-disc ml-4 mt-0.5 text-stone-500">
                    {a.unresolved_research_questions.slice(0, 3).map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
              ) : null}
              {a.actions_requested?.length ? (
                <div>
                  <span className="font-semibold">Actions requested:</span>
                  <ul className="list-disc ml-4 mt-0.5">
                    {a.actions_requested.slice(0, 3).map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
              ) : null}
              <div className="text-[10px] text-stone-400">
                Messages: {a.message_ids.join(', ')} · Account: {a.account_email}
              </div>
              {a.classification === 'reply_required' && a.thread_state !== 'declined' && a.thread_state !== 'supplied' && a.thread_state !== 'sent' && (
                <div className="pt-2 border-t border-stone-200">
                  <Button size="sm" className="text-xs bg-[#800020] text-white hover:bg-[#600018]" onClick={() => openDraft(a.thread_id)}>
                    <Mail className="w-3 h-3 mr-1" /> Draft reply
                  </Button>
                </div>
              )}
            </CardContent>
            {expandedThread === a.thread_id && (
              <div className="border-t border-stone-200 bg-stone-50/50 p-4 space-y-4">
                {loadingMessages === a.thread_id ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#800020]"></div>
                    <span className="ml-2 text-xs text-stone-500">Loading messages…</span>
                  </div>
                ) : (
                  <>
                    {/* Conversation summary */}
                    <div className="rounded border border-blue-200 bg-blue-50 p-3 text-xs space-y-1">
                      <div className="font-bold text-blue-800 uppercase tracking-wider text-[10px]">Conversation summary</div>
                      <div><span className="font-semibold">Institution:</span> {a.institution || 'Unknown'}{a.institution_confidence === 'low' ? ' (uncertain)' : ''}</div>
                      <div><span className="font-semibold">Classification:</span> {CLASSIFICATION_LABELS[a.classification]} ({a.confidence})</div>
                      {a.thread_state && <div><span className="font-semibold">Thread state:</span> {a.thread_state === 'declined' ? 'Declined by institution' : a.thread_state === 'supplied' ? 'Document supplied — inspection outstanding' : a.thread_state === 'redirected' ? 'Referred to another institution' : a.thread_state === 'acknowledged' ? 'Acknowledged' : a.thread_state === 'awaiting_response' ? 'Waiting for institution' : a.thread_state}</div>}
                      <div><span className="font-semibold">What they're asking:</span> {a.reasoning}</div>
                      {a.unresolved_research_questions?.length ? (
                        <div><span className="font-semibold">Unresolved research questions:</span> {a.unresolved_research_questions.join('; ')}</div>
                      ) : null}
                      {a.actions_requested?.length ? (
                        <div><span className="font-semibold">Actions requested:</span> {a.actions_requested.join('; ')}</div>
                      ) : null}
                      <div><span className="font-semibold">Suggested next step:</span> {a.thread_state === 'declined' ? 'No reply required to this institution. Research objective remains open.' : a.thread_state === 'supplied' ? 'Inspect the supplied document before treating the research objective as answered.' : a.thread_state === 'redirected' ? 'Review the referral and determine whether the alternative institution is appropriate before contacting it.' : a.thread_state === 'awaiting_response' ? 'No action currently required. Waiting for a response.' : a.classification === 'reply_required' ? 'Prepare a reply (use Draft reply below).' : a.classification === 'action_required' ? 'Take the required action (provide info, documents, or payment).' : a.classification === 'awaiting_response' ? 'Waiting for institution to respond. No action needed now.' : a.classification === 'follow_up_due' ? 'Send a follow-up — the stated timeframe has passed.' : a.classification === 'documents_received' ? 'Documents arrived. Read them, then confirm what they establish and whether the request is fulfilled.' : a.classification === 'resolved' ? 'Verify and mark complete.' : 'Needs manual review.'}</div>
                    </div>

                    {/* Attachment gate: what actually arrived, and whether it could be read */}
                    {a.attachment_gate && (a.attachment_gate.documents_received || (a.attachment_gate.ungated_message_ids?.length ?? 0) > 0) && (
                      <div className="rounded border border-teal-200 bg-teal-50 p-3 text-xs space-y-1">
                        <div className="font-bold text-teal-800 uppercase tracking-wider text-[10px]">Documents received</div>
                        {(a.attachment_gate.readable_documents || []).map((d) => (
                          <div key={d.attachment_id}>
                            <span className="font-semibold">{d.filename}</span>{' '}
                            <span className="text-stone-500">({d.status})</span>
                            {d.text_path && <span className="text-stone-400"> · extracted text: {d.text_path}</span>}
                          </div>
                        ))}
                        {(a.attachment_gate.unreadable_documents || []).map((d) => (
                          <div key={d.attachment_id} className="text-amber-800">
                            <span className="font-semibold">{d.filename}</span> — {d.status}
                            {typeof d.confidence === 'number' ? ` (OCR confidence ${d.confidence})` : ''} · needs visual review
                          </div>
                        ))}
                        {(a.attachment_gate.ungated_message_ids?.length ?? 0) > 0 && (
                          <div className="text-stone-700">
                            Attachment(s) on message {a.attachment_gate.ungated_message_ids?.join(', ')} have not been read yet — run the attachment gate.
                          </div>
                        )}
                        <div className="text-[10px] text-stone-500 italic">
                          Receipt ≠ fulfilment: the documents are here, whether they answer the research request is unverified until you review them.
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Original correspondence ({(threadMessages[a.thread_id] || []).length} messages)</div>
                      {(threadMessages[a.thread_id] || []).map((m: any) => {
                        const analysis = threadAnalyses[a.thread_id]?.[m.id];
                        const isIn = m.direction === 'in';
                        return (
                          <div key={m.id} className={`rounded border p-3 text-xs ${isIn ? 'border-blue-200 bg-blue-50/50' : 'border-stone-200 bg-white'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={isIn ? 'bg-blue-100 text-blue-800 text-[9px]' : 'bg-stone-100 text-stone-700 text-[9px]'}>
                                {isIn ? 'IN (received)' : 'OUT (sent)'}
                              </Badge>
                              <span className="text-stone-500">{m.received_at || m.sent_at || ''}</span>
                              <span className="text-stone-400">· msg {m.id}</span>
                            </div>
                            <div className="text-stone-600 mb-1">
                              <span className="font-semibold">From:</span> {m.from_name || m.from_email || '—'} · <span className="font-semibold">To:</span> {m.to_json ? JSON.parse(m.to_json).map((t: any) => t.name || t.email).join(', ') : '—'}
                            </div>
                            <div className="text-stone-600 mb-1"><span className="font-semibold">Subject:</span> {m.subject || '—'}</div>
                            <div className="text-stone-600 mb-1"><span className="font-semibold">Account:</span> {m.account_email}</div>
                            <div className="mt-2">
                              <div className="font-semibold text-stone-700 mb-0.5">Original (Italian):</div>
                              <div className="whitespace-pre-wrap break-words max-h-48 overflow-auto bg-white/50 p-2 rounded border border-stone-100">
                                {m.body_text || '—'}
                              </div>
                            </div>
                            {analysis?.translation_en && analysis.translation_en !== m.body_text && (
                              <div className="mt-2">
                                <div className="font-semibold text-stone-700 mb-0.5">English translation (AI):</div>
                                <div className="whitespace-pre-wrap break-words max-h-48 overflow-auto bg-white/50 p-2 rounded border border-stone-100 text-stone-600 italic">
                                  {analysis.translation_en}
                                </div>
                              </div>
                            )}
                            {analysis?.purpose_summary && (
                              <div className="mt-2 text-[10px] text-stone-500">
                                <span className="font-semibold">AI summary:</span> {analysis.purpose_summary}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Research findings */}
                    {a.research_findings && (
                      <div className="rounded border border-teal-200 bg-teal-50 p-3 text-xs space-y-1">
                        <div className="font-bold text-teal-800 uppercase tracking-wider text-[10px]">Research findings (verified)</div>
                        <div><span className="font-semibold">Source:</span> <a href={a.research_findings.source_url} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">{a.research_findings.source_url}</a></div>
                        <div><span className="font-semibold">Verified contact:</span> {a.research_findings.verified_contact.email} ({a.research_findings.verified_contact.confidence})</div>
                        <div><span className="font-semibold">General contact:</span> {a.research_findings.general_contact.email} · PEC: {a.research_findings.general_contact.pec} · Tel: {a.research_findings.general_contact.phone}</div>
                        {a.research_findings.procedures?.length ? (
                          <div><span className="font-semibold">Procedures:</span><ul className="list-disc ml-4 mt-0.5">{a.research_findings.procedures.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul></div>
                        ) : null}
                        {a.research_findings.requirements?.length ? (
                          <div><span className="font-semibold">Requirements:</span><ul className="list-disc ml-4 mt-0.5">{a.research_findings.requirements.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul></div>
                        ) : null}
                        {a.research_findings.notes && <div className="text-stone-500 italic">{a.research_findings.notes}</div>}
                      </div>
                    )}

                    {/* Suggested new correspondence */}
                    {a.suggested_new_correspondence && (
                      <div className="rounded border border-purple-200 bg-purple-50 p-3 text-xs space-y-2">
                        <div className="font-bold text-purple-800 uppercase tracking-wider text-[10px]">Suggested new correspondence</div>
                        <div><span className="font-semibold">Recommended institution:</span> {a.suggested_new_correspondence.recommended_institution}</div>
                        {a.suggested_new_correspondence.recommended_email ? (
                          <div><span className="font-semibold">Email:</span> {a.suggested_new_correspondence.recommended_email}</div>
                        ) : (
                          <div className="text-amber-700"><span className="font-semibold">Email:</span> Not available from verified sources — look up before sending.</div>
                        )}
                        <div><span className="font-semibold">Reason:</span> {a.suggested_new_correspondence.reason}</div>
                        {a.suggested_new_correspondence.evidence?.length ? (
                          <div className="text-stone-600 italic">
                            Evidence: "{a.suggested_new_correspondence.evidence[0].quote}"
                            <span className="not-italic text-stone-400"> (msg {a.suggested_new_correspondence.evidence[0].msg_id})</span>
                          </div>
                        ) : null}
                        <div><span className="font-semibold">Context:</span> {a.suggested_new_correspondence.context_summary}</div>
                        {a.suggested_new_correspondence.verified_facts?.length ? (
                          <div>
                            <span className="font-semibold text-emerald-700">Verified facts:</span>
                            <ul className="list-disc ml-4 mt-0.5">
                              {a.suggested_new_correspondence.verified_facts.map((f: string, i: number) => <li key={i}>{f}</li>)}
                            </ul>
                          </div>
                        ) : null}
                        {a.suggested_new_correspondence.unverified?.length ? (
                          <div>
                            <span className="font-semibold text-amber-700">Uncertain / unverified:</span>
                            <ul className="list-disc ml-4 mt-0.5">
                              {a.suggested_new_correspondence.unverified.map((f: string, i: number) => <li key={i}>{f}</li>)}
                            </ul>
                          </div>
                        ) : null}
                        {a.suggested_new_correspondence.uncertainty_note && (
                          <div className="text-amber-700 font-semibold">{a.suggested_new_correspondence.uncertainty_note}</div>
                        )}
                        <div className="pt-2 border-t border-purple-200">
                          <Button size="sm" className="text-xs bg-purple-700 text-white hover:bg-purple-800" onClick={() => openNewDraft(a.thread_id)}>
                            <Mail className="w-3 h-3 mr-1" /> Draft new email to {a.suggested_new_correspondence.recommended_institution}
                          </Button>
                          <span className="text-[10px] text-stone-400 ml-2">Generates an editable draft. Nothing is sent automatically.</span>
                        </div>
                      </div>
                    )}

                    {/* Draft reply button */}
                    {a.classification === 'reply_required' && (
                      <div className="pt-2 border-t border-stone-200">
                        <Button size="sm" className="text-xs bg-[#800020] text-white hover:bg-[#600018]" onClick={() => openDraft(a.thread_id)}>
                          <Mail className="w-3 h-3 mr-1" /> Draft reply (Italian)
                        </Button>
                        <span className="text-[10px] text-stone-400 ml-2">Opens editable draft modal. Nothing is sent automatically.</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </Card>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-stone-500 text-center py-8">No items match this filter.</div>
        )}
      </div>

      {/* Draft reply modal */}
      <Dialog open={draftOpen} onOpenChange={(o) => { if (!o) setDraftOpen(false); }}>
        <DialogContent className="max-w-3xl bg-[#FAF6F0] border-stone-300 font-sans max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="border-b border-stone-200 pb-3 shrink-0">
            <DialogTitle className="font-serif text-xl text-[#800020] flex items-center gap-2">
              <Mail className="w-5 h-5" /> Draft reply
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              {draftThreadId ? `Thread: ${draftThreadId}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-1">
            {draftLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]"></div>
                <span className="ml-3 text-sm text-stone-600">Generating draft…</span>
              </div>
            ) : draftData ? (
              <>
                {confirmOverwrite && (
                  <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 flex items-center justify-between">
                    <span>An edited draft exists. Regenerate will overwrite your edits.</span>
                    <Button size="sm" className="text-xs" onClick={() => openDraft(draftThreadId!, true)}>Overwrite</Button>
                  </div>
                )}
                {draftData.warnings?.length ? (
                  <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                    {draftData.warnings.map((w: string, i: number) => <div key={i}>⚠ {w}</div>)}
                  </div>
                ) : null}
                {draftData.reply_reason && (
                  <div className="rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800">
                    <span className="font-semibold">Why a reply is needed:</span> {draftData.reply_reason}
                  </div>
                )}
                {/* Verification gate */}
                <VerificationPanel
                  readiness={draftData.readiness}
                  results={draftData.verification_results}
                  recipient={draftData.provenance?.drafting_inputs?.intended_recipient}
                  toast={toast}
                />
                <div>
                  <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Draft ({draftData.language || 'unknown'}) — editable</div>
                  <Textarea
                    className="font-sans text-sm min-h-[200px]"
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="text-xs bg-[#800020] text-white" onClick={copyDraft}>
                    <Copy className="w-3 h-3 mr-1" /> {draftCopied ? 'Copied!' : 'Copy to clipboard'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={saveDraftEdit}>
                    <Save className="w-3 h-3 mr-1" /> Save edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => openDraft(draftThreadId!, true)}>
                    <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                  </Button>
                </div>
                {/* Provenance */}
                <div className="rounded border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600 space-y-1">
                  <div className="font-bold text-stone-500 uppercase tracking-wider text-[10px]">Provenance</div>
                  <div>Source messages: {(draftData.provenance?.source_messages || []).join(', ')}</div>
                  <div>Analysis files: {(draftData.provenance?.analysis_files || []).join(', ')}</div>
                  {draftData.provenance?.verified_facts_used?.length ? (
                    <div>Verified facts used: {draftData.provenance.verified_facts_used.join('; ')}</div>
                  ) : null}
                  {draftData.provenance?.ai_suggestions_used?.length ? (
                    <div>AI suggestions used: {draftData.provenance.ai_suggestions_used.join('; ')}</div>
                  ) : null}
                  {draftData.provenance?.unverified_content_flagged?.length ? (
                    <div className="text-amber-700">Unverified content: {draftData.provenance.unverified_content_flagged.join('; ')}</div>
                  ) : null}
                  <div className="text-[10px] text-stone-400 italic mt-1">AI-generated draft. Review before sending. Nothing is sent automatically.</div>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* New correspondence draft modal */}
      <Dialog open={newDraftOpen} onOpenChange={(o) => { if (!o) setNewDraftOpen(false); }}>
        <DialogContent className="max-w-3xl bg-[#FAF6F0] border-stone-300 font-sans max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="border-b border-stone-200 pb-3 shrink-0">
            <DialogTitle className="font-serif text-xl text-purple-800 flex items-center gap-2">
              <Mail className="w-5 h-5" /> Suggested new correspondence
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              {newDraftThreadId ? `New email draft — not a reply to an existing thread` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-1">
            {newDraftLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
                <span className="ml-3 text-sm text-stone-600">Generating draft…</span>
              </div>
            ) : newDraftData ? (
              <>
                {newDraftData.warnings?.length ? (
                  <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                    {newDraftData.warnings.map((w: string, i: number) => <div key={i}>⚠ {w}</div>)}
                  </div>
                ) : null}
                {newDraftData.reply_reason && (
                  <div className="rounded border border-purple-200 bg-purple-50 p-2 text-xs text-purple-800">
                    <span className="font-semibold">Why this email is suggested:</span> {newDraftData.reply_reason}
                  </div>
                )}
                {/* Verification gate */}
                <VerificationPanel
                  readiness={newDraftData.readiness}
                  results={newDraftData.verification_results}
                  recipient={newDraftData.provenance?.drafting_inputs?.intended_recipient}
                  toast={toast}
                />
                {newDraftData.provenance?.suggested_new_correspondence?.recommended_email === null && (
                  <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
                    ⚠ Recipient email address is NOT available from verified sources. Look up the Comune's civil registry email before sending.
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Draft ({newDraftData.language || 'unknown'}) — editable</div>
                  <Textarea
                    className="font-sans text-sm min-h-[200px]"
                    value={newDraftText}
                    onChange={(e) => setNewDraftText(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="text-xs bg-purple-700 text-white" onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(newDraftText);
                      setNewDraftCopied(true);
                      setTimeout(() => setNewDraftCopied(false), 2000);
                      toast({ title: 'Copied', description: 'Draft copied to clipboard.' });
                    } catch {
                      toast({ title: 'Copy failed', description: 'Select text and copy manually.', variant: 'destructive' });
                    }
                  }}>
                    <Copy className="w-3 h-3 mr-1" /> {newDraftCopied ? 'Copied!' : 'Copy to clipboard'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={async () => {
                    if (!newDraftThreadId) return;
                    try {
                      const res = await fetch(`/api/correspondence/draft-new/${encodeURIComponent(newDraftThreadId)}/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ edited_text: newDraftText }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to save');
                      setNewDraftData(data.draft as DraftData);
                      toast({ title: 'Draft saved', description: 'Your edits have been saved.' });
                    } catch (e) {
                      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to save', variant: 'destructive' });
                    }
                  }}>
                    <Save className="w-3 h-3 mr-1" /> Save edit
                  </Button>
                </div>
                {/* Provenance */}
                <div className="rounded border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600 space-y-1">
                  <div className="font-bold text-stone-500 uppercase tracking-wider text-[10px]">Provenance</div>
                  <div>Source thread: {newDraftData.provenance?.source_thread}</div>
                  <div>Source messages: {(newDraftData.provenance?.source_messages || []).join(', ')}</div>
                  {newDraftData.provenance?.verified_facts_used?.length ? (
                    <div>Verified facts used: {newDraftData.provenance.verified_facts_used.join('; ')}</div>
                  ) : null}
                  {newDraftData.provenance?.unverified_content_flagged?.length ? (
                    <div className="text-amber-700">Unverified content: {newDraftData.provenance.unverified_content_flagged.join('; ')}</div>
                  ) : null}
                  <div className="text-[10px] text-stone-400 italic mt-1">AI-generated draft for new correspondence. Review before sending. Nothing is sent automatically.</div>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}