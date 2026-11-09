import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssistantSummaryResponse, ThreadSummary, FilterStatus, FilterAccount } from '@/types/assistant';
import { PillFilter } from '@/components/PillFilter';

interface AssistantDashboardProps {
  summary: AssistantSummaryResponse | null;
  filterStatus: FilterStatus;
  setFilterStatus: (v: FilterStatus) => void;
  filterAccount: FilterAccount;
  setFilterAccount: (v: FilterAccount) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSelectThread?: (thread: ThreadSummary) => void;
}

const ASSISTANT_STATUSES: Record<string, { label: string; color: string }> = {
  reply_required: { label: 'Reply Required', color: 'text-stone-orange-600' },
  action_required: { label: 'Action Required', color: 'text-stone-orange-600' },
  awaiting_response: { label: 'Awaiting Response', color: 'text-stone-orange-600' },
  follow_up_due: { label: 'Follow-Up Due', color: 'text-stone-red-600' },
  no_action_needed: { label: 'No Action Needed', color: 'text-emerald-600' },
  resolved: { label: 'Resolved', color: 'text-emerald-600' },
  documents_received: { label: 'Documents Received', color: 'text-emerald-600' },
};

export const AssistantDashboard = ({
  summary,
  filterStatus,
  setFilterStatus,
  filterAccount,
  setFilterAccount,
  searchQuery,
  setSearchQuery,
  onSelectThread,
}: AssistantDashboardProps) => {
  // Pill filter state (multi-select).
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>([]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, key: string) =>
    setter(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  // Derive pill options with counts from all pending threads (before other filters).
  const allPending = summary?.pending_actions || [];
  const institutionPills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of allPending) {
      const inst = (t.institution || '').trim();
      if (!inst) continue;
      counts.set(inst, (counts.get(inst) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([label, count]) => ({ key: label, label, count }));
  }, [allPending]);

  const peoplePills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of allPending) {
      for (const p of t.people || []) {
        const name = p.trim();
        if (!name) continue;
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([label, count]) => ({ key: label, label, count }));
  }, [allPending]);

  const classificationPills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of allPending) {
      const cls = (t.classification || '').toLowerCase();
      if (!cls) continue;
      counts.set(cls, (counts.get(cls) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, label: ASSISTANT_STATUSES[key]?.label || key, count }));
  }, [allPending]);

  const threads = useMemo(() => {
    return (summary?.pending_actions || []).filter(t => {
      if (filterStatus === 'pending') {
        const allowed = ['reply_required', 'action_required', 'awaiting_response', 'follow_up_due'];
        if (!allowed.includes((t.classification || '').toLowerCase())) return false;
      }
      if (filterStatus === 'chase' && ((t.days_waiting ?? 0) > 30)) return false;
      if (filterStatus === 'no-action' && (t.classification || '').toLowerCase() !== 'no_action_needed') return false;
      if (filterAccount === 'daniele' && t.account_email !== 'daniele.buatti@gmail.com') return false;
      if (filterAccount === 'info' && t.account_email !== 'info@danielebuatti.com') return false;
      if (selectedInstitutions.length > 0 && !selectedInstitutions.includes((t.institution || '').trim())) return false;
      if (selectedPeople.length > 0 && !(t.people || []).some(p => selectedPeople.includes(p.trim()))) return false;
      if (selectedClassifications.length > 0 && !selectedClassifications.includes((t.classification || '').toLowerCase())) return false;
      if (searchQuery && !(
        (t.institution || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.people?.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) || false) ||
        (t.protocol_refs?.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) || false) ||
        (t.latest_inbound_snippet?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
      )) return false;
      return true;
    });
  }, [summary, filterStatus, filterAccount, searchQuery, selectedInstitutions, selectedPeople, selectedClassifications]);

  const statusColor = (cls: string) => {
    const s = ASSISTANT_STATUSES[cls.toLowerCase()];
    return s?.color || 'text-stone-600';
  };

  const statusLabel = (cls: string) => {
    const s = ASSISTANT_STATUSES[cls.toLowerCase()];
    return s?.label || cls || '-';
  };

  const filteredChases = useMemo(() => {
    return (summary?.chase_due || []).filter(t => {
      if (filterAccount === 'daniele' && t.account_email !== 'daniele.buatti@gmail.com') return false;
      if (filterAccount === 'info' && t.account_email !== 'info@danielebuatti.com') return false;
      return true;
    });
  }, [summary, filterAccount]);

  const filteredNoActions = useMemo(() => {
    return (summary?.no_action_needed || []).filter(t => {
      if (filterAccount === 'daniele' && t.account_email !== 'daniele.buatti@gmail.com') return false;
      if (filterAccount === 'info' && t.account_email !== 'info@danielebuatti.com') return false;
      return true;
    });
  }, [summary, filterAccount]);

  if (!summary) return <div className="p-8 text-stone-400">Loading summary data…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="p-3 border-b border-stone-200"><CardTitle className="text-sm">Total Messages</CardTitle></CardHeader><CardContent>
          <p className="text-3xl font-serif font-bold text-[#800020]">{summary.db_stats?.total_messages?.toLocaleString() || 0}</p>
          <p className="text-stone-500 text-sm">Across both accounts</p>
        </CardContent></Card>
        <Card><CardHeader className="p-3 border-b border-stone-200"><CardTitle className="text-sm">Definite Leads</CardTitle></CardHeader><CardContent>
          <p className="text-3xl font-serif font-bold text-emerald-600">{summary.db_stats?.definite || 0}</p>
          <p className="text-stone-500 text-sm">genealogy_relevance=definite</p>
        </CardContent></Card>
        <Card><CardHeader className="p-3 border-b border-stone-200"><CardTitle className="text-sm">Possible Leads</CardTitle></CardHeader><CardContent>
          <p className="text-3xl font-serif font-bold text-orange-600">{summary.db_stats?.possible || 0}</p>
          <p className="text-stone-500 text-sm">genealogy_relevance=possible</p>
        </CardContent></Card>
        <Card><CardHeader className="p-3 border-b border-stone-200"><CardTitle className="text-sm">Unreviewed</CardTitle></CardHeader><CardContent>
          <p className="text-3xl font-serif font-bold text-stone-300">{summary.db_stats?.unreviewed || 0}</p>
          <p className="text-stone-500 text-sm">no genealogy relevance</p>
        </CardContent></Card>
      </div>

      <Card className="border-stone-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-stone-700">Filter threads</div>
            {(selectedInstitutions.length > 0 || selectedPeople.length > 0 || selectedClassifications.length > 0) && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSelectedInstitutions([]); setSelectedPeople([]); setSelectedClassifications([]); }}>
                Clear all
              </Button>
            )}
          </div>
          <PillFilter title="Institution" pills={institutionPills} selected={selectedInstitutions} onToggle={k => toggle(setSelectedInstitutions, k)} onClear={() => setSelectedInstitutions([])} />
          <PillFilter title="People" pills={peoplePills} selected={selectedPeople} onToggle={k => toggle(setSelectedPeople, k)} onClear={() => setSelectedPeople([])} />
          <PillFilter title="Status" pills={classificationPills} selected={selectedClassifications} onToggle={k => toggle(setSelectedClassifications, k)} onClear={() => setSelectedClassifications([])} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 p-4 border border-stone-200 rounded-lg bg-white">
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as FilterStatus)}>
          <SelectTrigger className="bg-white border-stone-300 w-auto min-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="chase">Chase</SelectItem>
            <SelectItem value="no-action">No Action</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAccount} onValueChange={v => setFilterAccount(v as FilterAccount)}>
          <SelectTrigger className="bg-white border-stone-300 w-auto min-w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="daniele">daniele.buatti@gmail.com</SelectItem>
            <SelectItem value="info">info@danielebuatti.com</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Search institution, people, protocol refs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-white border-stone-300" />
      </div>

      <Card>
        <CardHeader className="p-4"><CardTitle className="text-lg">Threads Needing Attention ({threads.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200">
                <tr><th className="text-left p-3 font-semibold text-stone-700">Thread</th><th className="text-left p-3 font-semibold text-stone-700">Account</th><th className="text-left p-3 font-semibold text-stone-700">Institution</th><th className="text-left p-3 font-semibold text-stone-700">People</th><th className="text-left p-3 font-semibold text-stone-700">Status</th><th className="text-left p-3 font-semibold text-stone-700">Days</th><th className="text-left p-3 font-semibold text-stone-700">Snippet</th></tr>
              </thead>
              <tbody>
                {threads.map(t => (
                  <tr key={t.thread_id} className="border-b border-stone-100 hover:bg-[#F4EFE6] cursor-pointer" onClick={() => onSelectThread?.(t)}>
                    <td className="p-3 font-serif">{t.thread_id}</td>
                    <td className="p-3 font-serif">{t.account_email}</td>
                    <td className="p-3 font-serif">{t.institution || '-'}</td>
                    <td className="p-3 font-serif">{t.people?.join(', ') || '-'}</td>
                    <td className={`p-3 font-serif font-semibold ${statusColor(t.classification)}`}>{statusLabel(t.classification)}</td>
                    <td className={`p-3 font-serif ${(t.days_waiting ?? 0) > 30 ? 'text-red-600' : 'text-stone-500'}`}>{t.days_waiting ?? '-'}</td>
                    <td className="p-3 font-serif text-xs line-clamp-2">{t.latest_inbound_snippet || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredChases.length > 0 && (
        <Card><CardHeader className="p-4"><CardTitle className="text-lg text-red-600">Chase Due (&gt;30 days)</CardTitle></CardHeader><CardContent>
          <ul className="space-y-2">{filteredChases.map(t => (<li key={t.thread_id} className="p-2 border-l-2 border-red-200 bg-red-50 rounded">
            <p className="font-serif">{t.institution}</p>
            <p className="text-sm text-stone-500">{t.people?.join(', ')}</p>
          </li>))}</ul>
        </CardContent></Card>
      )}

      {filteredNoActions.length > 0 && (
        <Card><CardHeader className="p-4"><CardTitle className="text-lg text-emerald-600">No Action Needed</CardTitle></CardHeader><CardContent>
          <ul className="space-y-2">{filteredNoActions.map(t => (<li key={t.thread_id} className="p-2 border-l-2 border-emerald-200 bg-emerald-50 rounded">
            <p className="font-serif">{t.institution}</p>
            <p className="text-sm text-stone-500">{t.people?.join(', ')}</p>
          </li>))}</ul>
        </CardContent></Card>
      )}
    </div>
  );
};

export default AssistantDashboard;
