import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Play, Eye, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SweepSummary {
  generated_at: string;
  dry_run: boolean;
  scope: { since: string; limit: number };
  stages: Record<string, string>;
  proposed_actions: { thread_id: string; subject: string; classification: string; institution: string | null; request_ids: string[]; ambiguous: boolean; needs_review: boolean; attachment_gate: string | null; draft_path: string | null; reasoning: string }[];
  review_items: { request_id: string; status: string; needs_review: boolean; ambiguous: boolean; review_reason: string | null; institution: string | null; person_names: string[]; linked_attachments: number[] }[];
  drafts_prepared: { thread_id: string; path: string | null; status: string }[];
  no_action_threads: { thread_id: string; classification: string }[];
  classifications: Record<string, number>;
  requests: Record<string, number>;
}

export function SweepView() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<SweepSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sweep/summary');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setSummary(json.summary);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load sweep summary', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const runSweep = async (dryRun: boolean) => {
    setRunning(true);
    try {
      const res = await fetch('/api/sweep/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: dryRun, limit: 10, skip_drafts: false, max_drafts: 3 }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Sweep failed');
      }
      const json = await res.json();
      setSummary(json.summary);
      toast({ title: dryRun ? 'Dry-run complete' : 'Sweep complete', description: `${json.summary?.proposed_actions?.length || 0} proposed actions` });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#800020] font-serif">Email Sweep</h2>
          <p className="text-xs text-stone-500 font-sans">
            {summary ? `Last run: ${new Date(summary.generated_at).toLocaleString()} · ${summary.dry_run ? 'dry-run' : 'live'} · scope since ${summary.scope?.since?.slice(0, 10)}` : 'No sweep run yet'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => runSweep(true)} disabled={running}>
            <Eye className="w-3 h-3 mr-1" /> Dry run
          </Button>
          <Button size="sm" className="bg-[#800020] text-white hover:bg-[#600018]" onClick={() => runSweep(false)} disabled={running}>
            <Play className="w-3 h-3 mr-1" /> {running ? 'Running…' : 'Run sweep'}
          </Button>
          <Button size="sm" variant="ghost" onClick={fetchSummary} disabled={loading}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-stone-200"><CardContent className="p-3"><div className="text-2xl font-bold">{summary.proposed_actions.length}</div><div className="text-xs text-stone-500">Proposed actions</div></CardContent></Card>
            <Card className="border-stone-200"><CardContent className="p-3"><div className="text-2xl font-bold">{summary.review_items.length}</div><div className="text-xs text-stone-500">Needs review</div></CardContent></Card>
            <Card className="border-stone-200"><CardContent className="p-3"><div className="text-2xl font-bold">{summary.drafts_prepared.length}</div><div className="text-xs text-stone-500">Drafts prepared</div></CardContent></Card>
            <Card className="border-stone-200"><CardContent className="p-3"><div className="text-2xl font-bold">{summary.no_action_threads.length}</div><div className="text-xs text-stone-500">No action</div></CardContent></Card>
          </div>

          <Card className="border-stone-200">
            <CardHeader><CardTitle className="text-sm font-medium text-stone-600">Stages</CardTitle></CardHeader>
            <CardContent className="p-4 text-xs">
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.stages).map(([k, v]) => (
                  <Badge key={k} className={v === 'ok' ? 'bg-emerald-50 text-emerald-700 text-[9px]' : 'bg-amber-50 text-amber-700 text-[9px]'}>{k}: {v}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader><CardTitle className="text-sm font-medium text-stone-600">Proposed actions ({summary.proposed_actions.length})</CardTitle></CardHeader>
            <CardContent className="p-4 text-xs space-y-2">
              <ScrollArea className="h-[400px]">
                {summary.proposed_actions.map((a) => (
                  <div key={a.thread_id} className="border-b border-stone-100 py-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-stone-800 line-clamp-1">{a.subject}</span>
                      <div className="flex gap-1 shrink-0">
                        <Badge className="text-[9px]">{a.classification}</Badge>
                        {a.needs_review && <Badge className="text-[9px] bg-amber-100 text-amber-800">needs review</Badge>}
                        {a.ambiguous && <Badge className="text-[9px] bg-purple-100 text-purple-800">ambiguous</Badge>}
                      </div>
                    </div>
                    <div className="text-stone-500 text-[10px]">{a.institution} · {a.thread_id}</div>
                    {a.draft_path && <div className="text-teal-700 text-[10px]">Draft: {a.draft_path}</div>}
                    <div className="text-stone-600 text-[10px] line-clamp-2">{a.reasoning}</div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {summary.review_items.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/40">
              <CardHeader><CardTitle className="text-sm font-medium text-amber-800">Needs my review ({summary.review_items.length})</CardTitle></CardHeader>
              <CardContent className="p-4 text-xs space-y-1">
                {summary.review_items.map((r) => (
                  <div key={r.request_id} className="flex items-center justify-between py-1 border-b border-amber-100">
                    <span className="font-medium">{r.request_id}</span>
                    <span className="text-stone-500 text-[10px]">{r.institution} · {r.review_reason || r.status}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
