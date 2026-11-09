import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Download, Clock, AlertTriangle, CheckCircle2, Loader2, SkipForward } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Action {
  key: string;
  kind: 'sweep' | 'hold' | 'download' | 'reply' | 'chase' | 'waiting' | 'done';
  title: string;
  detail: string;
  cta: string;
}

const SKIP_KEY = 'nextCorrAction.skip';

export function NextCorrespondenceAction() {
  const { toast } = useToast();
  const [action, setAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);
  const [skipped, setSkipped] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(SKIP_KEY) || '[]'); } catch { return []; }
  });

  const compute = async () => {
    setLoading(true);
    try {
      const [prRes, niRes, msgRes] = await Promise.all([
        fetch('/api/correspondence/person-requests').then((r) => r.json()).catch(() => ({ people: [] })),
        fetch('/api/correspondence/new-items').then((r) => r.json()).catch(() => ({ new_message_count: 0, items: [] })),
        fetch('/api/correspondence/genealogy/messages?relevance=definite').then((r) => r.json()).catch(() => ({ messages: [] })),
      ]);

      const holding: { person_id: string; open_count: number }[] = (prRes.people || []).filter((p: any) => p.hold);
      const newCount = niRes.new_message_count || (niRes.items || []).length || 0;

      // Attachments not downloaded
      const msgs = msgRes.messages || [];
      let undownloaded: { filename: string; id: number } | null = null;
      for (const m of msgs) {
        for (const a of m.attachments || []) {
          if (a.gmail_attachment_id && !a.downloaded && !a.unavailable) {
            undownloaded = { filename: a.filename || 'attachment', id: a.id };
            break;
          }
        }
        if (undownloaded) break;
      }

      // Threads needing a reply (inbound definite, no outbound in same thread)
      const threads = new Map();
      for (const m of msgs) {
        const t = m.gmail_thread_id;
        if (!threads.has(t)) threads.set(t, { hasIn: false, hasOut: false, subject: m.subject, institution: m.from_name });
        if (m.direction === 'in') threads.get(t).hasIn = true;
        if (m.direction === 'out') threads.get(t).hasOut = true;
      }
      let replyThread: { subject: string } | null = null;
      for (const t of threads.values()) {
        if (t.hasIn && !t.hasOut) { replyThread = t; break; }
      }

      // Stale chases: threads with inbound >=30 days ago and no outbound (Claude rule: 3-4 weeks before chasing).
      let stale: { subject: string; days: number } | null = null;
      // Near-chase: threads with inbound <30 days and no outbound — show as waiting.
      let nearChase: { subject: string; days: number; daysLeft: number } | null = null;
      const now = Date.now();
      for (const m of msgs) {
        if (m.direction !== 'in') continue;
        const last = m.received_at ? new Date(m.received_at).getTime() : 0;
        const days = Math.floor((now - last) / 86400000);
        const t = threads.get(m.gmail_thread_id);
        if (!t || t.hasOut) continue;
        if (days >= 30) {
          if (!stale) stale = { subject: m.subject || '(no subject)', days };
        } else {
          if (!nearChase) nearChase = { subject: m.subject || '(no subject)', days, daysLeft: 30 - days };
        }
      }

      // Priority order
      let next: Action | null = null;
      if (newCount > 0 && !skipped.includes('sweep')) {
        next = { key: 'sweep', kind: 'sweep', title: 'Sweep new correspondence', detail: `${newCount} new message(s) detected — review and classify them.`, cta: 'Review new items' };
      } else if (holding.length > 0 && !skipped.includes('hold')) {
        const h = holding[0];
        next = { key: 'hold', kind: 'hold', title: `Wait — ${h.person_id} has ${h.open_count} open requests`, detail: 'Claude rule: hold new drafts when 2+ open. Chase only after 30 days.', cta: 'View open requests' };
      } else if (undownloaded && !skipped.includes('download')) {
        next = { key: 'download', kind: 'download', title: `Download attachment: ${undownloaded.filename}`, detail: 'Read the attachment before replying (Claude rule).', cta: 'Download' };
      } else if (replyThread && !skipped.includes('reply')) {
        next = { key: 'reply', kind: 'reply', title: `Draft reply: ${replyThread.subject}`, detail: 'Inbound message with no reply yet.', cta: 'Draft reply' };
      } else if (stale && !skipped.includes('chase')) {
        next = { key: 'chase', kind: 'chase', title: `Chase: ${stale.subject}`, detail: `${stale.days} days with no reply (≥30-day gate passed).`, cta: 'Draft chase' };
      } else if (nearChase && !skipped.includes('waiting')) {
        next = { key: 'waiting', kind: 'waiting', title: `Waiting: ${nearChase.subject}`, detail: `Only ${nearChase.days} day(s) elapsed — chase allowed in ${nearChase.daysLeft} day(s) (3–4 week rule).`, cta: '' };
      } else {
        next = { key: 'done', kind: 'done', title: 'All caught up', detail: 'No pending correspondence actions right now.', cta: '' };
      }
      setAction(next);
    } catch (e) {
      setAction({ key: 'done', kind: 'done', title: 'Could not compute next action', detail: String(e), cta: '' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { compute(); }, []);

  const skip = () => {
    if (!action) return;
    const next = [...skipped, action.key];
    setSkipped(next);
    localStorage.setItem(SKIP_KEY, JSON.stringify(next));
    toast({ title: 'Skipped', description: `${action.title} moved to end of queue.` });
    compute();
  };

  const done = () => {
    if (!action) return;
    toast({ title: 'Done', description: action.title });
    // reset skip list on a completed cycle
    setSkipped([]);
    localStorage.removeItem(SKIP_KEY);
    compute();
  };

  if (loading) {
    return (
      <Card className="mb-4 border-stone-200">
        <CardContent className="p-4 flex items-center gap-2 text-stone-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Computing next correspondence action…
        </CardContent>
      </Card>
    );
  }

  if (!action) return null;

  const icon = action.kind === 'sweep' ? <Mail className="w-5 h-5 text-[#800020]" />
    : action.kind === 'hold' ? <AlertTriangle className="w-5 h-5 text-amber-600" />
    : action.kind === 'download' ? <Download className="w-5 h-5 text-blue-600" />
    : action.kind === 'chase' ? <Clock className="w-5 h-5 text-orange-600" />
    : action.kind === 'waiting' ? <Clock className="w-5 h-5 text-stone-400" />
    : action.kind === 'done' ? <CheckCircle2 className="w-5 h-5 text-green-600" />
    : <Mail className="w-5 h-5 text-[#800020]" />;

  return (
    <Card className="mb-4 border-2 border-[#800020]/30 bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {icon}
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-stone-500 font-sans mb-1">Next correspondence action</div>
              <div className="font-medium text-stone-900">{action.title}</div>
              <div className="text-xs text-stone-600 mt-1">{action.detail}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {action.kind !== 'done' && (
              <>
                <Button size="sm" variant="outline" onClick={skip}>
                  <SkipForward className="w-3 h-3 mr-1" /> Skip
                </Button>
                <Button size="sm" className="bg-[#800020] hover:bg-[#600018]" onClick={done}>
                  Done
                </Button>
              </>
            )}
            {action.kind === 'done' && (
              <Badge className="bg-green-100 text-green-800 border-green-300">All clear</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}