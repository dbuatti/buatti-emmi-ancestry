import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User, CheckCircle2 } from 'lucide-react';

interface PersonRequest {
  person_id: string;
  open_count: number;
  hold: boolean;
  rule: string;
  actions: { description: string; subject: string; thread_status: string }[];
}

export function OpenRequestsSummary() {
  const [people, setPeople] = useState<PersonRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/correspondence/person-requests')
      .then((r) => r.json())
      .then((d) => setPeople(d.people || []))
      .catch(() => setPeople([]))
      .finally(() => setLoading(false));
  }, []);

  const holding = people.filter((p) => p.hold);
  const ok = people.filter((p) => !p.hold);

  if (loading) return null;

  return (
    <Card className="mb-4 border-stone-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
          <User className="w-4 h-4" />
          Open requests per person (Claude rule: hold new drafts when ≥2 open)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {holding.length > 0 && (
          <div>
            <div className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> HOLD — {holding.length} person(s) with 2+ open requests
            </div>
            {holding.map((p) => (
              <div key={p.person_id} className="rounded border border-red-200 bg-red-50 p-2 mb-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{p.person_id}</span>
                  <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">{p.open_count} open</Badge>
                </div>
                <div className="text-xs text-red-700 mt-1">{p.rule}</div>
                <ul className="mt-1 text-xs text-stone-600 list-disc list-inside">
                  {p.actions.slice(0, 4).map((a, i) => (
                    <li key={i} className="truncate" title={a.subject}>{a.subject || a.description}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {ok.length > 0 && (
          <div>
            <div className="text-xs font-bold text-green-700 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> OK — {ok.length} person(s) with {'<'}2 open requests
            </div>
            <div className="flex flex-wrap gap-1">
              {ok.map((p) => (
                <Badge key={p.person_id} variant="outline" className="text-xs">
                  {p.person_id} ({p.open_count})
                </Badge>
              ))}
            </div>
          </div>
        )}
        {people.length === 0 && (
          <p className="text-xs text-stone-500">No per-person request links yet.</p>
        )}
      </CardContent>
    </Card>
  );
}