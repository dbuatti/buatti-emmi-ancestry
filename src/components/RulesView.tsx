import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Rule {
  id: string;
  type: string;
  stage: string;
  mechanism: string;
  pattern: string;
  correction: string;
  rationale: string;
  evidence: string;
  source_corrections: string[];
  status: string;
  proposed_at: string;
  approved_at: string | null;
  applied_count: number;
}

const STATUS_COLORS: Record<string, string> = {
  proposed: 'bg-amber-100 text-amber-800 border border-amber-200',
  active: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border border-red-200',
};

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

export function RulesView() {
  const { toast } = useToast();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposing, setProposing] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/correspondence/rules');
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      setRules((Object.values(d.rules || {}) as Rule[]).sort((a, b) => (a.proposed_at || '').localeCompare(b.proposed_at || '')));
    } catch {
      toast({ title: 'Error', description: 'Failed to load rules', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRules(); }, []);

  const proposeRules = async () => {
    setProposing(true);
    try {
      const res = await fetch('/api/rules/propose', { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      toast({ title: 'Rules proposed', description: `${d.count} new rules proposed for review.` });
      await fetchRules();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setProposing(false);
    }
  };

  const approveRule = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/rules/${ruleId}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Failed');
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, status: 'active', approved_at: new Date().toISOString() } : r));
      toast({ title: 'Approved', description: `Rule ${ruleId} is now active.` });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  const rejectRule = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/rules/${ruleId}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || 'Failed');
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, status: 'rejected' } : r));
      toast({ title: 'Rejected', description: `Rule ${ruleId} rejected.` });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-serif font-bold">Rules</h3>
          <p className="text-sm text-stone-500">{rules.length} rules · {rules.filter(r => r.status === 'proposed').length} proposed · {rules.filter(r => r.status === 'active').length} active</p>
        </div>
        <Button size="sm" variant="outline" onClick={proposeRules} disabled={proposing}>
          {proposing ? 'Proposing…' : 'Propose rules from corrections'}
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card className="border-stone-200"><CardContent className="pt-6 text-center text-stone-500">No rules yet. Register corrections, then click "Propose rules".</CardContent></Card>
      ) : (
        rules.map((rule) => (
          <Card key={rule.id} className="border-stone-200">
            <CardContent className="pt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Badge className={TYPE_COLORS[rule.type] || ''}>{rule.type}</Badge>
                <Badge className={STATUS_COLORS[rule.status] || ''}>{rule.status}</Badge>
                <span className="text-stone-400 text-[10px]">{rule.id} · {rule.stage} · {rule.mechanism}</span>
              </div>
              <div><span className="font-semibold text-red-700">Pattern:</span> {rule.pattern}</div>
              <div><span className="font-semibold text-emerald-700">Correction:</span> {rule.correction}</div>
              {rule.rationale && <div><span className="font-semibold">Rationale:</span> {rule.rationale}</div>}
              {rule.evidence && <div className="text-stone-500 italic">Evidence: "{rule.evidence}"</div>}
              <div className="text-stone-400 text-[10px]">Source corrections: {rule.source_corrections?.join(', ')} · Applied: {rule.applied_count} times</div>
              {rule.status === 'proposed' && (
                <div className="flex gap-2 pt-2 border-t border-stone-200">
                  <Button size="sm" className="text-xs bg-emerald-600 text-white" onClick={() => approveRule(rule.id)}>Approve</Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => rejectRule(rule.id)}>Reject</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}