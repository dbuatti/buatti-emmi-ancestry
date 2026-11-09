import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, ExternalLink, CheckCircle2, AlertTriangle, FileText, RefreshCw, Eye } from 'lucide-react';

interface PreparedDraft {
  filename: string;
  thread_id: string;
  draft_type: string;
  recipient: string | null;
  recipient_email: string | null;
  subject: string | null;
  readiness: string;
  warnings: string[];
  verification_readiness?: string;
  verification_findings?: string[];
  gmail_draft_id: string | null;
  gmail_draft_created_at: string | null;
  gmail_draft_status: string | null;
  gmail_body_changed?: boolean;
  sent_message_id?: number | null;
  sent_at?: string | null;
  match_confidence?: string | null;
  match_type?: string | null;
  has_gmail_draft: boolean;
  source_messages: number[];
  request_links: string[];
  suppression_reason?: string | null;
  lifecycle?: string;
  lifecycle_category?: string;
  is_actionable?: boolean;
  is_retired?: boolean;
  is_blocked?: boolean;
  is_suppressed?: boolean;
  suppressed?: boolean;
  status?: string;
  reply_required?: boolean | null;
  retirement_reason?: string | null;
  postal_address_supplied?: boolean;
  physical_certificate_outstanding?: boolean;
  generated_at: string;
  draft_text: string;
  correspondence_action: string;
  original_message_summary?: string;
  ancestors?: string[];
  record_refs?: string[];
  reply_reason?: string | null;
  draft_text_en?: string | null;
  subject_translation_en?: string | null;
  translation_status?: string;
  translation_error?: string | null;
  translation_model?: string | null;
  verification?: { findings?: string[]; readiness?: string };
}

export function PreparedDraftsView() {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<PreparedDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PreparedDraft | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [translating, setTranslating] = useState<string | null>(null);
  const [filter, setFilter] = useState('actionable');

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/correspondence/drafts');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setDrafts(json.drafts || []);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load drafts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  // Auto-translate when opening a draft that has no cached translation
  useEffect(() => {
    if (selected && !selected.draft_text_en && selected.translation_status !== 'translating' && selected.translation_status !== 'failed') {
      translateDraft(selected);
    }
  }, [selected?.filename]);

  const translateDraft = async (draft: PreparedDraft) => {
    setTranslating(draft.filename);
    try {
      const res = await fetch(`/api/correspondence/drafts/${encodeURIComponent(draft.filename)}/translate`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Translation failed');
      }
      const json = await res.json();
      // Update selected draft with translation
      setSelected((prev) => prev ? { ...prev, draft_text_en: json.draft_text_en, subject_translation_en: json.subject_translation_en, translation_status: json.translation_status, translation_error: json.translation_error } : null);
      await fetchDrafts();
      toast({ title: 'Translated', description: 'English translation added' });
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setTranslating(null);
    }
  };

  const createGmailDraft = async (draft: PreparedDraft) => {
    setCreating(draft.filename);
    try {
      const res = await fetch(`/api/correspondence/drafts/${encodeURIComponent(draft.filename)}/create-gmail`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed');
      }
      const json = await res.json();
      toast({ title: 'Gmail draft created', description: `Draft ID: ${json.gmail_draft_id}` });
      await fetchDrafts();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setCreating(null);
    }
  };

  const cat = (d: PreparedDraft) => (d.lifecycle_category || d.lifecycle || '').toLowerCase();
  const isActionable = (d: PreparedDraft) => cat(d) === 'actionable' || d.is_actionable === true;
  const isNeedsReview = (d: PreparedDraft) => cat(d) === 'needs_review';
  const isBlocked = (d: PreparedDraft) => cat(d) === 'blocked' || d.is_blocked === true || d.is_suppressed === true || d.suppressed === true;
  const isSent = (d: PreparedDraft) => cat(d) === 'sent' || d.readiness === 'sent' || d.readiness === 'possible_sent_reply';
  const isRetired = (d: PreparedDraft) => cat(d) === 'retired' || d.is_retired === true;
  const filtered = drafts.filter((d) => {
    if (filter === 'all') return true;
    if (filter === 'actionable') return isActionable(d);
    if (filter === 'ready') return isActionable(d);
    if (filter === 'needs_review') return isNeedsReview(d);
    if (filter === 'blocked') return isBlocked(d);
    if (filter === 'gmail_created') return d.has_gmail_draft;
    if (filter === 'sent') return isSent(d);
    if (filter === 'retired') return isRetired(d);
    return true;
  });

  const readinessBadge = (r: string) => {
    if (r === 'ready_for_review' || r === 'ready') return <Badge className="bg-emerald-50 text-emerald-700 text-[9px]">Ready for review</Badge>;
    if (r === 'incomplete') return <Badge className="bg-amber-50 text-amber-700 text-[9px]">Incomplete</Badge>;
    if (r === 'blocked') return <Badge className="bg-red-50 text-red-700 text-[9px]">Blocked</Badge>;
    if (r === 'sent') return <Badge className="bg-blue-50 text-blue-700 text-[9px]">Sent</Badge>;
    if (r === 'possible_sent_reply') return <Badge className="bg-purple-50 text-purple-700 text-[9px]">Possible sent reply — confirm</Badge>;
    if (r === 'retired' || r === 'superseded') return <Badge className="bg-stone-100 text-stone-500 text-[9px]">Retired / superseded</Badge>;
    return <Badge className="text-[9px]">{r}</Badge>;
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#800020] font-serif">Prepared correspondence</h2>
          <p className="text-xs text-stone-500 font-sans">{drafts.length} total · {drafts.filter(isActionable).length} actionable · {drafts.filter(isNeedsReview).length} needs review · {drafts.filter(isBlocked).length} blocked · {drafts.filter(isSent).length} sent · {drafts.filter(isRetired).length} retired</p>
        </div>
        <Button size="sm" variant="ghost" onClick={fetchDrafts}><RefreshCw className="w-3 h-3" /></Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['actionable', 'needs_review', 'blocked', 'sent', 'retired', 'gmail_created', 'all'].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="text-xs h-7"
            onClick={() => setFilter(f)}>
            {f === 'actionable' ? 'Actionable' : f === 'needs_review' ? 'Needs review' : f === 'blocked' ? 'Blocked' : f === 'sent' ? 'Sent' : f === 'retired' ? 'Retired / historical' : f === 'gmail_created' ? 'In Gmail' : 'All'}
            {' '}({f === 'all' ? drafts.length : drafts.filter((d) => {
              if (f === 'actionable') return isActionable(d);
              if (f === 'needs_review') return isNeedsReview(d);
              if (f === 'blocked') return isBlocked(d);
              if (f === 'sent') return isSent(d);
              if (f === 'retired') return isRetired(d);
              if (f === 'gmail_created') return d.has_gmail_draft;
              return true;
            }).length})
          </Button>
        ))}
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {filtered.map((d) => (
            <Card key={d.filename} className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif text-stone-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-stone-400" />
                  {d.subject || d.filename}
                </CardTitle>
                <div className="text-xs text-stone-500 flex flex-wrap gap-3">
                  <span>{d.recipient || 'Unknown recipient'}</span>
                  {d.recipient_email && <span className="text-stone-400">{d.recipient_email}</span>}
                  <span>{d.correspondence_action}</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {readinessBadge(d.readiness)}
                  {d.has_gmail_draft && <Badge className="bg-blue-50 text-blue-700 text-[9px]">Gmail draft created</Badge>}
                  {d.gmail_body_changed && <Badge className="bg-red-50 text-red-700 text-[9px]">body changed since Gmail draft</Badge>}
                  {d.warnings.length > 0 && <Badge className="bg-amber-50 text-amber-700 text-[9px]">{d.warnings.length} warning(s)</Badge>}
                </div>
                <div className="text-stone-600">
                  <span className="font-semibold">To:</span> {d.recipient || 'Unknown recipient'}
                  {d.recipient_email && <span className="text-stone-400"> &lt;{d.recipient_email}&gt;</span>}
                </div>
                {d.ancestors && d.ancestors.length > 0 && (
                  <div className="text-stone-500 text-[10px]">
                    <span className="font-semibold">Ancestors:</span> {d.ancestors.join(', ')}
                  </div>
                )}
                {d.original_message_summary && (
                  <div className="text-stone-600 text-[10px]">
                    <span className="font-semibold">Original message:</span> {d.original_message_summary}
                  </div>
                )}
                <div className="text-stone-600 text-[10px]">
                  <span className="font-semibold">Proposed response:</span> {(d.draft_text || '').slice(0, 150)}{(d.draft_text || '').length > 150 ? '…' : ''}
                </div>
                {d.reply_reason && (
                  <div className="text-stone-500 text-[10px] italic">{d.reply_reason}</div>
                )}
                {d.warnings.length > 0 && (
                  <div className="text-amber-700 text-[10px]">
                    {d.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
                  </div>
                )}
                {d.suppression_reason && (
                  <div className="text-red-700 text-[10px] font-semibold">
                    ⛔ Suppressed: {d.suppression_reason}
                  </div>
                )}
                {d.retirement_reason && (
                  <div className="text-stone-500 text-[10px] italic">
                    Retired: {d.retirement_reason}
                  </div>
                )}
                {d.postal_address_supplied && (
                  <div className="text-blue-700 text-[10px]">
                    Postal address supplied (MSG 11326). Physical certificate may still be outstanding.
                  </div>
                )}
                <details className="text-[10px] text-stone-400">
                  <summary className="cursor-pointer">Technical details</summary>
                  <div className="mt-1 space-y-0.5">
                    <div>File: {d.filename}</div>
                    <div>Thread: {d.thread_id}</div>
                    <div>Source messages: {d.source_messages.join(', ') || '—'}</div>
                    <div>Requests: {d.request_links.join(', ') || '—'}</div>
                    <div>Record refs: {(d.record_refs || []).join(', ') || '—'}</div>
                    <div>Generated: {d.generated_at}</div>
                    {d.gmail_draft_id && <div>Gmail draft ID: {d.gmail_draft_id}</div>}
                  </div>
                </details>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="text-[10px] h-6" onClick={() => setSelected(d)}>
                    <Eye className="w-3 h-3 mr-1" /> Review
                  </Button>
                  {!d.has_gmail_draft && isActionable(d) && (
                    <Button size="sm" className="text-[10px] bg-[#800020] text-white hover:bg-[#600018] h-6"
                      disabled={creating === d.filename}
                      onClick={() => createGmailDraft(d)}>
                      <Mail className="w-3 h-3 mr-1" /> {creating === d.filename ? 'Creating…' : 'Create Gmail draft'}
                    </Button>
                  )}
                  {d.has_gmail_draft && d.gmail_draft_id && (
                    <a href={`https://mail.google.com/mail/#drafts/${d.gmail_draft_id}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-[#800020] hover:underline">
                      <ExternalLink className="w-3 h-3" /> Open in Gmail
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-[#FAF6F0]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#800020]">{selected?.subject || selected?.filename}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-xs">
              <div><span className="font-semibold">Recipient:</span> {selected.recipient} {selected.recipient_email && `<${selected.recipient_email}>`}</div>
              <div><span className="font-semibold">Action:</span> {selected.correspondence_action}</div>
              <div><span className="font-semibold">Readiness:</span> {selected.readiness}</div>
              {selected.original_message_summary && (
                <div className="rounded border border-stone-200 bg-stone-50 p-2">
                  <div className="font-semibold text-stone-700 mb-1">Original incoming correspondence:</div>
                  <div className="text-stone-600">{selected.original_message_summary}</div>
                  <div className="text-stone-400 text-[10px] mt-1">Source message IDs: {selected.source_messages.join(', ')}</div>
                </div>
              )}
              <div><span className="font-semibold">Requests:</span> {selected.request_links.join(', ') || '—'}</div>
              {selected.gmail_draft_id && (
                <div><span className="font-semibold">Gmail draft ID:</span> {selected.gmail_draft_id} (created {selected.gmail_draft_created_at})</div>
              )}
              {selected.sent_message_id && (
                <div className="rounded border border-blue-200 bg-blue-50 p-2">
                  <div className="font-semibold text-blue-800 mb-1">Sent reply detected</div>
                  <div className="text-blue-700">Sent message ID: {selected.sent_message_id} · Sent at: {selected.sent_at}</div>
                  <div className="text-blue-700">Match confidence: {selected.match_confidence} ({selected.match_type})</div>
                  <div className="text-stone-500 text-[10px] mt-1">The actual sent email is preserved as msg {selected.sent_message_id} in the correspondence thread.</div>
                </div>
              )}
              {selected.warnings.length > 0 && (
                <div className="rounded border border-amber-200 bg-amber-50 p-2">
                  <div className="font-semibold text-amber-800 mb-1">Warnings:</div>
                  <ul className="list-disc ml-4">{selected.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}
              {selected.verification?.findings && selected.verification.findings.length > 0 && (
                <div className="rounded border border-stone-200 bg-stone-50 p-2">
                  <div className="font-semibold text-stone-700 mb-1">Verification findings ({selected.verification.readiness}):</div>
                  <ul className="list-disc ml-4">{selected.verification.findings.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
              )}
              <div className="space-y-2">
                {selected.draft_text_en ? (
                  <>
                    <div className="rounded border border-stone-200 bg-white p-3">
                      <div className="font-semibold text-stone-700 mb-2">English translation:</div>
                      {selected.subject_translation_en && <div className="font-bold mb-2 text-stone-800">{selected.subject_translation_en}</div>}
                      <div className="whitespace-pre-wrap font-sans text-stone-700">{selected.draft_text_en}</div>
                    </div>
                    <div className="rounded border border-stone-200 bg-stone-50 p-3">
                      <div className="font-semibold text-stone-700 mb-2">Original (Italian):</div>
                      {selected.subject && <div className="font-bold mb-2 text-stone-800">{selected.subject}</div>}
                      <div className="whitespace-pre-wrap font-sans text-stone-600">{selected.draft_text}</div>
                    </div>
                  </>
                ) : translating === selected.filename ? (
                  <div className="rounded border border-stone-200 bg-stone-50 p-3 text-stone-500 italic">Translating…</div>
                ) : (
                  <div className="rounded border border-stone-200 bg-white p-3">
                    <div className="font-semibold text-stone-700 mb-2">Email body (original — Italian):</div>
                    {selected.subject && <div className="font-bold mb-2 text-stone-800">{selected.subject}</div>}
                    <div className="whitespace-pre-wrap font-sans">{selected.draft_text}</div>
                  </div>
                )}
                <div className="flex gap-2">
                  {!selected.draft_text_en && (
                    <Button size="sm" variant="outline" className="text-[10px] h-6" disabled={translating === selected.filename}
                      onClick={() => translateDraft(selected)}>
                      {translating === selected.filename ? 'Translating…' : 'Translate to English'}
                    </Button>
                  )}
                  {selected.draft_text_en && (
                    <span className="text-[10px] text-stone-400">Translated via {selected.translation_model || 'Ollama'}</span>
                  )}
                  {selected.translation_status === 'failed' && (
                    <span className="text-[10px] text-red-600">Translation failed: {selected.translation_error}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
