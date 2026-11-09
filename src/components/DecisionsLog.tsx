import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DecisionEntry {
  ts: string;
  kind: string;
  subject: string;
  detail: string;
  by: string;
}

export function DecisionsLog() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<DecisionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState('');
  const [subject, setSubject] = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/decisions')
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!kind.trim()) { toast({ title: 'Kind required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, subject, detail, by: 'user' }),
      });
      if (!res.ok) throw new Error('save failed');
      setKind(''); setSubject(''); setDetail('');
      toast({ title: 'Decision logged' });
      load();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Log a decision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="kind (e.g. hold_override, skip, note)" value={kind} onChange={(e) => setKind(e.target.value)} className="text-xs" />
          <Input placeholder="subject (person/thread/record id)" value={subject} onChange={(e) => setSubject(e.target.value)} className="text-xs" />
          <Textarea placeholder="detail / reasoning" value={detail} onChange={(e) => setDetail(e.target.value)} className="text-xs h-20" />
          <Button size="sm" onClick={save} disabled={saving} className="bg-[#800020] hover:bg-[#600018]">
            <Plus className="w-3 h-3 mr-1" /> {saving ? 'Saving…' : 'Log decision'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-stone-600">Decision history ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-2">
              {loading && <p className="text-xs text-stone-500">Loading…</p>}
              {!loading && entries.length === 0 && <p className="text-xs text-stone-500">No decisions logged yet.</p>}
              {entries.map((e, i) => (
                <div key={i} className="border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px]">{e.kind}</Badge>
                    <span className="font-mono text-stone-400">{new Date(e.ts).toLocaleString()}</span>
                    <span className="text-stone-500">by {e.by}</span>
                  </div>
                  {e.subject && <div className="text-xs font-medium text-stone-800 mt-1">{e.subject}</div>}
                  {e.detail && <div className="text-xs text-stone-600 mt-0.5">{e.detail}</div>}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}