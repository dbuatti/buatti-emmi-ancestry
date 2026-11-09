import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Correction {
  id: string;
  timestamp: string;
  source: string;
  message_id: number | null;
  thread_id: string | null;
  field: string;
  stage: string;
  original: string;
  corrected: string;
  evidence: string;
  correction_type: string;
  scope: string;
  human_confirmed: boolean;
  rejected?: boolean;
  notes: string;
}

const TYPE_COLORS: Record<string, string> = {
  translation: 'bg-blue-100 text-blue-800',
  entity_extraction: 'bg-purple-100 text-purple-800',
  relationship: 'bg-pink-100 text-pink-800',
  chronology: 'bg-amber-100 text-amber-800',
  evidence: 'bg-orange-100 text-orange-800',
  action_detection: 'bg-red-100 text-red-800',
  drafting: 'bg-green-100 text-green-800',
  classification: 'bg-indigo-100 text-indigo-800',
  other: 'bg-stone-100 text-stone-800',
};

export function CorrectionsView() {
  const { toast } = useToast();
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/correspondence/corrections')
      .then(r => r.json())
      .then(d => {
        const list = Object.values(d.corrections || {}) as Correction[];
        setCorrections(list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')));
      })
      .catch(() => toast({ title: 'Error', description: 'Failed to load corrections', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [toast]);

  const confirmCorrection = async (corrId: string) => {
    setProcessing(corrId);
    try {
      const res = await fetch(`/api/corrections/${corrId}/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed');
      setCorrections(prev => prev.map(c => c.id === corrId ? { ...c, human_confirmed: true } : c));
      toast({ title: 'Confirmed', description: `Correction ${corrId} confirmed.` });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const rejectCorrection = async (corrId: string) => {
    setProcessing(corrId);
    try {
      const res = await fetch(`/api/corrections/${corrId}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed');
      setCorrections(prev => prev.map(c => c.id === corrId ? { ...c, human_confirmed: false, rejected: true } as any : c));
      toast({ title: 'Rejected', description: `Correction ${corrId} rejected.` });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]"></div></div>;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-serif font-bold">Corrections</h3>
        <p className="text-sm text-stone-500">{corrections.length} corrections recorded. Original AI output and human-corrected values shown.</p>
      </div>
      {corrections.length === 0 ? (
        <Card className="border-stone-200"><CardContent className="pt-6 text-center text-stone-500">No corrections recorded yet.</CardContent></Card>
      ) : (
        corrections.map((c) => (
          <Card key={c.id} className="border-stone-200">
            <CardContent className="pt-4 space-y-1 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={TYPE_COLORS[c.correction_type] || ''}>{c.correction_type}</Badge>
                <Badge variant="outline" className="text-[9px]">{c.scope}</Badge>
                <Badge variant="outline" className="text-[9px]">{c.source}</Badge>
                {c.human_confirmed ? <Badge className="bg-emerald-50 text-emerald-700 text-[9px]">confirmed</Badge> : <Badge className="bg-amber-50 text-amber-700 text-[9px]">proposed</Badge>}
              </div>
              <div className="text-stone-500">{c.timestamp?.slice(0, 19)} · {c.message_id ? `msg ${c.message_id}` : ''} {c.thread_id ? `thread ${c.thread_id.slice(0, 12)}` : ''}</div>
              <div><span className="font-semibold text-red-700">Original:</span> {c.original}</div>
              <div><span className="font-semibold text-emerald-700">Corrected:</span> {c.corrected}</div>
              {c.evidence && <div className="text-stone-500 italic">Evidence: "{c.evidence}"</div>}
              {c.notes && <div className="text-stone-400">{c.notes}</div>}
              {!c.human_confirmed && !(c as any).rejected && (
                <div className="flex gap-2 pt-2 border-t border-stone-200 mt-2">
                  <button
                    onClick={() => confirmCorrection(c.id)}
                    disabled={processing === c.id}
                    className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {processing === c.id ? '...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => rejectCorrection(c.id)}
                    disabled={processing === c.id}
                    className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing === c.id ? '...' : 'Reject'}
                  </button>
                </div>
              )}
              {(c as any).rejected && <div className="text-xs text-red-600 pt-1">Rejected</div>}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}