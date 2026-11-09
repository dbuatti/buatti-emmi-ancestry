import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Eye, Clock, AlertTriangle, FileText, Link2, ExternalLink } from 'lucide-react';
import { CorrespondenceMessage } from '@/pages/ResearchCentre';
import { MessageDetail } from '@/components/MessageDetail';
import { OpenRequestsSummary } from '@/components/OpenRequestsSummary';
import { FreeRouteBadge } from '@/components/FreeRouteBadge';

const SIGNAL_PLAIN: Record<string, string> = {
  person_overlap: 'same people appear in both',
  institution_exact: 'same institution',
  protocol_exact: 'protocol number matches',
  document_type_overlap: 'same document type',
  date_order_ok: 'dates fit in the right order',
  date_proximity: 'dates are close together',
  date_order_wrong: 'dates do NOT fit',
  document_type_mismatch: 'different document type',
  institution_mismatch: 'different institution',
};

function signalsToEnglish(signals: string[]): string {
  const plain = signals.map((s) => SIGNAL_PLAIN[s] || s);
  return plain.length ? plain.join(' · ') : '—';
}

interface ReqLink {
  request_id: string;
  source_thread: string;
  source_message_id: number;
  institution: string | null;
  person_names: string[];
  requested_items: { description: string; status: string }[];
  status: string;
  fulfilment: string;
  ambiguous: boolean;
  ambiguity_candidates: { thread_id: string; confidence: string; matched: string[]; contradictory: string[] }[];
  ambiguity_reviewed: boolean;
  ambiguity_decision: string | null;
  needs_review: boolean;
  review_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  linked_replies: { thread_id: string; message_id: number; confidence: string; human_confirmed: boolean; matched_signals: unknown; contradictory_signals: unknown; has_documents?: boolean }[];
  linked_events: { kind: string; message_id: number; thread_id: string; date: string; evidence: string }[];
  linked_attachments: number[];
  rejected_links: unknown[];
  human_notes: string | null;
}

interface RequestLinksData {
  version: number;
  requests: Record<string, ReqLink>;
}

const EVENT_LABELS: Record<string, string> = {
  request_sent: 'Request sent',
  pec_accepted: 'PEC accepted',
  pec_delivered: 'PEC delivered',
  protocol_registered: 'Protocol registered',
  substantive_response_received: 'Substantive response',
  document_supplied: 'Document supplied',
  fulfilment_confirmed: 'Fulfilment confirmed (human)',
};

export function RequestReview() {
  const { toast } = useToast();
  const [data, setData] = useState<RequestLinksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [openMsg, setOpenMsg] = useState<CorrespondenceMessage | null>(null);

  const openThreadMessage = async (threadId: string) => {
    try {
      const res = await fetch(`/api/correspondence/threads/${encodeURIComponent(threadId)}/messages`);
      if (!res.ok) throw new Error('load failed');
      const json = await res.json();
      const rows = (json.messages || []) as CorrespondenceMessage[];
      const inbound = rows.filter((m: Partial<CorrespondenceMessage>) => m.direction === 'in');
      const pick = inbound[inbound.length - 1] || rows[rows.length - 1];
      if (!pick) throw new Error('no messages');
      setOpenMsg({ ...pick, subject: pick.subject || 'Email in this thread' } as CorrespondenceMessage);
      setMessageOpen(true);
    } catch {
      toast({ title: 'Error', description: 'Could not load that email thread', variant: 'destructive' });
    }
  };

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/correspondence/request-links');
      if (!res.ok) throw new Error('Failed to load request links');
      const json = await res.json();
      setData(json.request_links || { version: 1, requests: {} });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load request links', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const requests = data ? Object.values(data.requests) : [];
  const ambiguous = requests.filter((r) => r.ambiguous && !r.ambiguity_reviewed);
  const needsReview = requests.filter((r) => r.needs_review);
  const reviewed = requests.filter((r) => r.reviewed_at);

  const callApi = async (url: string, body?: unknown) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Request failed');
    }
    return res.json();
  };

  const handleConfirmLink = async (rid: string, tid: string, mid: number) => {
    setBusy(rid);
    try {
      await callApi(`/api/correspondence/request-links/${rid}/confirm-link`, { thread_id: tid, message_id: mid });
      toast({ title: 'Link approved', description: `${rid} ← ${tid}` });
      await fetchLinks();
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const handleRejectLink = async (rid: string, tid: string, mid: number) => {
    setBusy(rid);
    try {
      await callApi(`/api/correspondence/request-links/${rid}/reject-link`, { thread_id: tid, message_id: mid });
      toast({ title: 'Link rejected', description: `${rid} ✗ ${tid}` });
      await fetchLinks();
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const handleMarkReviewed = async (rid: string) => {
    setBusy(rid);
    try {
      await callApi(`/api/correspondence/request-links/${rid}/mark-reviewed`, { reason: 'reviewed in UI' });
      toast({ title: 'Marked reviewed', description: rid });
      await fetchLinks();
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const handleConfirmFulfilled = async (rid: string) => {
    setBusy(rid);
    try {
      await callApi(`/api/correspondence/request-links/${rid}/confirm-fulfilled`);
      toast({ title: 'Fulfilment confirmed', description: rid });
      await fetchLinks();
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const handleReviewAmbiguity = async (rid: string, decision: string) => {
    setBusy(rid);
    try {
      await callApi(`/api/correspondence/request-links/${rid}/review-ambiguity`, { decision });
      toast({ title: 'Ambiguity reviewed', description: `${rid}: ${decision}` });
      await fetchLinks();
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const selectedReq = selected ? data?.requests[selected] : null;

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]" /></div>;

  return (
    <div className="space-y-4">
      <OpenRequestsSummary />
      <div>
        <h2 className="text-2xl font-bold text-[#800020] font-serif">Request review</h2>
        <p className="text-xs text-stone-500 font-sans">
          {requests.length} requests · {ambiguous.length} ambiguous (unreviewed) · {needsReview.length} need review · {reviewed.length} reviewed
        </p>
      </div>

      <Card className="border-stone-200 bg-[#FAF6F0]">
        <CardContent className="p-4 text-xs text-stone-600 font-sans space-y-2">
          <div className="text-sm font-medium text-stone-800">What this page is for</div>
          <p>
            This is the app's <span className="font-semibold">filing cabinet, not a to-do list</span>. It keeps the paper
            trail for each record request you've lodged (D13, D14, marriage searches…): "these emails are this request
            being sent, and this reply answering it."
          </p>
          <p>
            Approving or Rejecting a candidate below only <span className="font-semibold">files the email into that
            archive</span> — it sends nothing, changes nothing in the family tree, and no deadlines live here.
          </p>
          <p className="text-stone-500">
            Your actual work happens on the <span className="font-semibold">Next card</span> and under&nbsp;
            <span className="font-semibold">Prepared drafts</span>. It's fine to skip this page entirely; OpenCode can
            also do this tidy-up for you in the background.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="ambiguous" className="space-y-4">
        <TabsList className="bg-[#F4EFE6] border border-stone-200">
          <TabsTrigger value="ambiguous" className="font-sans data-[state=active]:bg-[#800020] data-[state=active]:text-white">
            Ambiguous ({ambiguous.length})
          </TabsTrigger>
          <TabsTrigger value="needs-review" className="font-sans data-[state=active]:bg-[#800020] data-[state=active]:text-white">
            Needs review ({needsReview.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="font-sans data-[state=active]:bg-[#800020] data-[state=active]:text-white">
            All ({requests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ambiguous" className="space-y-3">
          {ambiguous.length === 0 && <p className="text-sm text-stone-500">No unreviewed ambiguous requests.</p>}
          {ambiguous.map((r) => (
            <Card key={r.request_id} className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif text-stone-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  {r.request_id} — {r.institution || '(no institution)'}
                </CardTitle>
                <div className="text-xs text-stone-500">
                  {r.person_names.join(', ')} · {r.requested_items.map((i) => i.description).join('; ').slice(0, 120)}
                </div>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-2">
                <div className="text-stone-600">
                  <span className="font-semibold">Candidates:</span>{' '}
                  <span className="text-[10px] text-stone-400 italic">guessed emails for this request — Approval only files one into the paper trail (nothing is sent)</span>
                </div>
                {r.ambiguity_candidates.map((c, i) => (
                  <div key={i} className="rounded border border-stone-200 bg-stone-50 p-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] break-all">{c.thread_id}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge className="text-[9px]">{c.confidence === 'high' ? 'strong match' : 'possible match'}</Badge>
                        <Button size="sm" variant="outline" className="text-[10px] h-6 px-2"
                          onClick={() => openThreadMessage(c.thread_id)}>
                          <ExternalLink className="w-3 h-3 mr-1" /> View
                        </Button>
                      </div>
                    </div>
                    <div className="text-[10px] text-stone-500">
                      Why it might belong here: <span className="text-stone-600">{signalsToEnglish(c.matched) || '—'}</span>
                      {c.contradictory.length > 0 && (
                        <span className="text-amber-700"> · warning: {signalsToEnglish(c.contradictory)}</span>
                      )}
                      {c.contradictory.length === 0 && <span className="text-stone-400"> · nothing contradicts it</span>}
                    </div>
                    <div className="text-[10px] text-stone-400 italic pt-0.5">
                      Approve = file this email into this request's paper trail (nothing is sent). Reject = it doesn't belong to this request.
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="text-[10px] bg-emerald-600 text-white hover:bg-emerald-700 h-6"
                        disabled={busy === r.request_id}
                        onClick={() => handleConfirmLink(r.request_id, c.thread_id, c.thread_id === r.source_thread ? r.source_message_id : 0)}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-[10px] h-6"
                        disabled={busy === r.request_id}
                        onClick={() => handleRejectLink(r.request_id, c.thread_id, 0)}>
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="text-[10px] text-stone-400 italic pt-1">
                  Events: {r.linked_events.map((e) => `${e.kind}(${e.message_id})`).join(', ') || '—'}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="needs-review" className="space-y-3">
          {needsReview.length === 0 && <p className="text-sm text-stone-500">Nothing needs review.</p>}
          {needsReview.map((r) => (
            <Card key={r.request_id} className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif text-stone-800 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-600" />
                  {r.request_id} — {r.institution || '(no institution)'}
                </CardTitle>
                <div className="text-xs text-stone-500">{r.review_reason || 'needs review'}</div>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-2">
                <div><span className="font-semibold">Status:</span> {r.status} · <span className="font-semibold">Fulfilment:</span> {r.fulfilment}</div>
                <div><span className="font-semibold">Items:</span> {r.requested_items.map((i) => `${i.description} [${i.status}]`).join('; ')}</div>
                {r.linked_attachments.length > 0 && (
                  <div>
                    <span className="font-semibold">Attachments:</span> {r.linked_attachments.join(', ')} (see Attachment gate)
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="text-[10px] bg-[#800020] text-white hover:bg-[#600018] h-6"
                    onClick={() => handleMarkReviewed(r.request_id)}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Mark reviewed
                  </Button>
                  {r.fulfilment !== 'fulfilled' && r.linked_attachments.length > 0 && (
                    <Button size="sm" variant="outline" className="text-[10px] h-6"
                      onClick={() => handleConfirmFulfilled(r.request_id)}>
                      Confirm fulfilment (after inspection)
                    </Button>
                  )}
                </div>
                {r.reviewed_at && (
                  <div className="text-[10px] text-stone-400">Reviewed {r.reviewed_at} by {r.reviewed_by}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          <ScrollArea className="h-[600px]">
            {requests.map((r) => (
              <Card key={r.request_id} className="border-stone-200 mb-2">
                <CardContent className="p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.request_id}</span>
                    <div className="flex gap-1">
                      <Badge className="text-[9px]">{r.status}</Badge>
                      {r.needs_review && <Badge className="text-[9px] bg-amber-100 text-amber-800">needs review</Badge>}
                      {r.ambiguous && <Badge className="text-[9px] bg-purple-100 text-purple-800">ambiguous</Badge>}
                    </div>
                  </div>
                  <div className="text-stone-500 mt-1 flex items-center gap-2 flex-wrap">
                    {r.institution || '—'} · {r.person_names.join(', ')}
                    <FreeRouteBadge institution={r.institution} />
                  </div>
                  <div className="text-stone-400 mt-1 text-[10px]">
                    {r.linked_events.map((e) => EVENT_LABELS[e.kind] || e.kind).join(' → ') || '—'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {openMsg && (
        <MessageDetail message={openMsg} open={messageOpen} onOpenChange={setMessageOpen} />
      )}
    </div>
  );
}
