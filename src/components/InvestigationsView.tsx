import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Investigation {
  id: string;
  created_at: string;
  created_by: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  thread_id: string | null;
  lead_id: string | null;
  title: string;
  objective: string;
  findings: { text: string; source?: string; confidence?: string }[];
  sources: { url: string; title: string; accessed_at: string }[];
  recommended_action: string | null;
  draft_id: string | null;
  activity_log: { ts: string; by: string; action: string; detail: string }[];
  human_decision: string | null;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border border-red-200',
};

export function InvestigationsView() {
  const { toast } = useToast();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Investigation | null>(null);
  const [creating, setCreating] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newThreadId, setNewThreadId] = useState('');

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/correspondence/investigations');
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      setInvestigations((Object.values(d.investigations || {}) as Investigation[]).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')));
    } catch {
      toast({ title: 'Error', description: 'Failed to load investigations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvestigations(); }, []);

  const createInvestigation = async () => {
    if (!newTitle.trim()) { toast({ title: 'Error', description: 'Title required', variant: 'destructive' }); return; }
    try {
      const res = await fetch('/api/correspondence/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, objective: newObjective, thread_id: newThreadId || null, created_by: 'app_ui' }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Failed');
      toast({ title: 'Created', description: `Investigation ${d.investigation_id} created. OpenCode can now process it.` });
      setCreating(false);
      setNewTitle(''); setNewObjective(''); setNewThreadId('');
      await fetchInvestigations();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  const approveInvestigation = async (inv: Investigation) => {
    try {
      const res = await fetch(`/api/investigations/${inv.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', human_decision: 'approved', source: 'app_ui', activity: 'approved', activity_detail: 'Human approved the investigation and its recommendations.' }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Failed');
      toast({ title: 'Approved', description: `${inv.id} marked as completed.` });
      await fetchInvestigations();
      if (selected?.id === inv.id) setSelected({ ...inv, status: 'completed', human_decision: 'approved' });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  const processInvestigation = async (inv: Investigation) => {
    setProcessing(inv.id);
    try {
      const res = await fetch(`/api/investigations/${inv.id}/process`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Failed to launch OpenCode');
      toast({ title: 'OpenCode launched', description: `Processing ${inv.id} (PID: ${d.pid}). OpenCode will read the investigation and write results back.` });
      // Poll for completion
      const poll = setInterval(async () => {
        const r = await fetch('/api/correspondence/investigations');
        if (!r.ok) return;
        const data = await r.json();
        const updated = data.investigations?.[inv.id];
        if (updated && (updated.status === 'completed' || updated.status === 'rejected' || updated.findings?.length > 0)) {
          clearInterval(poll);
          setProcessing(null);
          await fetchInvestigations();
          if (selected?.id === inv.id) setSelected(updated);
          toast({ title: 'OpenCode finished', description: `${inv.id}: ${updated.status} — ${updated.findings?.length || 0} findings` });
        }
      }, 5000);
      // Stop polling after 5 minutes
      setTimeout(() => { clearInterval(poll); setProcessing(null); }, 300000);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
      setProcessing(null);
    }
  };

  const rejectInvestigation = async (inv: Investigation) => {
    try {
      const res = await fetch(`/api/investigations/${inv.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', human_decision: 'rejected', source: 'app_ui', activity: 'rejected', activity_detail: 'Human rejected the investigation.' }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Failed');
      toast({ title: 'Rejected', description: `${inv.id} rejected.` });
      await fetchInvestigations();
      if (selected?.id === inv.id) setSelected({ ...inv, status: 'rejected', human_decision: 'rejected' });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-serif font-bold">Research Assistant</h3>
          <p className="text-sm text-stone-500">Investigations: {investigations.length} total · {investigations.filter(i => i.status === 'pending').length} pending · {investigations.filter(i => i.status === 'in_progress').length} in progress · {investigations.filter(i => i.status === 'completed').length} completed</p>
        </div>
        <Button size="sm" onClick={() => setCreating(!creating)}>{creating ? 'Cancel' : 'New Investigation'}</Button>
      </div>

      {creating && (
        <Card className="border-stone-200">
          <CardContent className="pt-4 space-y-3">
            <Input placeholder="Title (e.g., Chiappini-Pirri: Irma Pirri death record)" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="text-sm" />
            <Textarea placeholder="Objective (what to investigate)" value={newObjective} onChange={e => setNewObjective(e.target.value)} className="text-sm min-h-[60px]" />
            <Input placeholder="Thread ID (optional, e.g., 1a1a9ab9b9303081)" value={newThreadId} onChange={e => setNewThreadId(e.target.value)} className="text-sm" />
            <Button size="sm" className="bg-[#800020] text-white" onClick={createInvestigation}>Create Investigation</Button>
            <p className="text-[10px] text-stone-400">After creation, OpenCode can process it. Or run: python scripts/run-pipeline.py</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-1 space-y-2">
          {investigations.length === 0 ? (
            <Card className="border-stone-200"><CardContent className="pt-6 text-center text-stone-500">No investigations yet. Create one to get started.</CardContent></Card>
          ) : (
            investigations.map((inv) => (
              <Card key={inv.id} className={`border-stone-200 cursor-pointer ${selected?.id === inv.id ? 'ring-2 ring-[#800020]' : ''}`} onClick={() => setSelected(inv)}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={STATUS_COLORS[inv.status] || ''}>{inv.status}</Badge>
                    <span className="text-[10px] text-stone-400">{inv.id}</span>
                  </div>
                  <div className="font-medium text-sm truncate">{inv.title}</div>
                  <div className="text-xs text-stone-500 truncate">{inv.objective}</div>
                  {inv.thread_id && <div className="text-[10px] text-stone-400 mt-1">Thread: {inv.thread_id.slice(0, 12)}…</div>}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-serif">{selected.title}</CardTitle>
                  <Badge className={STATUS_COLORS[selected.status] || ''}>{selected.status}</Badge>
                </div>
                <p className="text-xs text-stone-500">{selected.objective}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {selected.thread_id && <div><span className="font-semibold">Thread:</span> {selected.thread_id}</div>}
                {selected.findings?.length > 0 && (
                  <div>
                    <div className="font-bold text-stone-600 mb-1">Findings</div>
                    {selected.findings.map((f, i) => (
                      <div key={i} className="mb-1 p-2 bg-stone-50 rounded">
                        <div>{f.text}</div>
                        {f.source && <div className="text-stone-400 text-[10px]">Source: {f.source} · Confidence: {f.confidence || 'unknown'}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {selected.sources?.length > 0 && (
                  <div>
                    <div className="font-bold text-stone-600 mb-1">Sources</div>
                    {selected.sources.map((s, i) => (
                      <div key={i} className="text-stone-500">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{s.title || s.url}</a>
                        <span className="text-[10px] ml-1">({s.accessed_at?.slice(0, 10)})</span>
                      </div>
                    ))}
                  </div>
                )}
                {selected.recommended_action && (
                  <div className="rounded border border-blue-200 bg-blue-50 p-2">
                    <span className="font-semibold text-blue-800">Recommended next step:</span> {selected.recommended_action}
                  </div>
                )}
                {selected.draft_id && (
                  <div className="rounded border border-purple-200 bg-purple-50 p-2">
                    <span className="font-semibold text-purple-800">Draft:</span> {selected.draft_id}
                    <span className="text-[10px] text-stone-400 ml-2">(view in Actions & Replies)</span>
                  </div>
                )}
                {selected.activity_log?.length > 0 && (
                  <div>
                    <div className="font-bold text-stone-600 mb-1">Activity log</div>
                    <div className="space-y-1 max-h-48 overflow-auto">
                      {selected.activity_log.map((a, i) => (
                        <div key={i} className="text-[10px] text-stone-500">
                          <span className="font-mono">{a.ts?.slice(0, 19)}</span> · <span className="font-semibold">{a.by}</span> · {a.action}: {a.detail}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(selected.status === 'pending' || selected.status === 'in_progress') && (
                  <div className="flex gap-2 pt-2 border-t border-stone-200">
                    <Button size="sm" className="text-xs bg-[#800020] text-white" onClick={() => processInvestigation(selected)} disabled={processing === selected.id}>
                      {processing === selected.id ? 'Processing…' : 'Process with OpenCode'}
                    </Button>
                    {selected.status === 'in_progress' && selected.human_decision === null && (
                      <>
                        <Button size="sm" className="text-xs bg-emerald-600 text-white" onClick={() => approveInvestigation(selected)}>Approve</Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => rejectInvestigation(selected)}>Reject</Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-stone-200"><CardContent className="pt-6 text-center text-stone-500">Select an investigation to view details.</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}