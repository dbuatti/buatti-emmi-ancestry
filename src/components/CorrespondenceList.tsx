import { useState, useEffect, useMemo } from 'react';
import { Search, Mail, ArrowUpDown, ShieldAlert, Paperclip } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { CorrespondenceMessage } from '@/pages/ResearchCentre';

export interface CorrespondenceListProps {
  relevance: 'definite' | 'possible' | 'all';
  onSelectThread: (threadId: string) => void;
  setIsDetailOpen: (open: boolean) => void;
}

const ACCOUNTS = ['daniele.buatti@gmail.com', 'info@danielebuatti.com'];
const MESSAGE_TYPES = ['personal', 'government', 'newsletter', 'marketing', 'automated_notification', 'uncertain'];
const ACTION_STATUSES = ['needs_review', 'needs_reply', 'no_action_needed', 'completed'];

interface ThreadGroup {
  key: string;
  threadId: string;
  account: string;
  accounts: string[];
  subject: string;
  latestDate: string;
  latestSender: string;
  latestDirection: 'in' | 'out';
  messageCount: number;
  attachmentCount: number;
  relevance: string;
  messageType: string;
  actionStatus: string;
  actionCounts: { needs_review: number; needs_reply: number };
  messages: CorrespondenceMessage[];
  snippet: string;
}

export function CorrespondenceList({ relevance, onSelectThread, setIsDetailOpen }: CorrespondenceListProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<CorrespondenceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'subject' | 'count'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/correspondence/genealogy/messages?relevance=${relevance}`);
        if (!response.ok) throw new Error('Failed to load messages');
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        toast({ title: 'Error', description: `Failed to load ${relevance} messages`, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [relevance, toast]);

  // Group messages into conversations by (account, gmail_thread_id). Never merge by subject.
  const threads = useMemo<ThreadGroup[]>(() => {
    const groups = new Map<string, CorrespondenceMessage[]>();
    for (const m of messages) {
      const key = `${m.account_email}||${m.gmail_thread_id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }

    const result: ThreadGroup[] = [];
    for (const [key, msgs] of groups) {
      const sorted = [...msgs].sort((a, b) =>
        new Date(a.received_at || a.sent_at || 0).getTime() - new Date(b.received_at || b.sent_at || 0).getTime()
      );
      const latest = sorted[sorted.length - 1];
      const earliest = sorted[0];
      const accounts = Array.from(new Set(msgs.map((m) => m.account_email)));
      const actionCounts = { needs_review: 0, needs_reply: 0 };
      for (const m of msgs) {
        if (m.action_status === 'needs_review') actionCounts.needs_review++;
        if (m.action_status === 'needs_reply') actionCounts.needs_reply++;
      }
      // Highest relevance present
      const rels = msgs.map((m) => m.genealogy_relevance).filter(Boolean) as string[];
      const relevanceVal = rels.includes('definite') ? 'definite' : rels.includes('possible') ? 'possible' : (rels[0] || 'unreviewed');

      result.push({
        key,
        threadId: msgs[0].gmail_thread_id,
        account: msgs[0].account_email,
        accounts,
        subject: earliest.subject || latest.subject || '(no subject)',
        latestDate: latest.received_at || latest.sent_at || '',
        latestSender: latest.from_name || latest.from_email || '—',
        latestDirection: latest.direction,
        messageCount: msgs.length,
        attachmentCount: msgs.reduce((s, m) => s + (m.attachment_count || 0), 0),
        relevance: relevanceVal,
        messageType: latest.message_type || msgs[0].message_type || '',
        actionStatus: latest.action_status || '',
        actionCounts,
        messages: sorted,
        snippet: latest.snippet || '',
      });
    }
    return result;
  }, [messages]);

  const filteredThreads = useMemo(() => {
    const result = threads.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        t.subject.toLowerCase().includes(q) ||
        t.latestSender.toLowerCase().includes(q) ||
        t.account.toLowerCase().includes(q) ||
        t.snippet.toLowerCase().includes(q) ||
        t.messages.some((m) => (m.body_text || '').toLowerCase().includes(q) || (m.snippet || '').toLowerCase().includes(q));

      const matchesAccount = accountFilter === 'all' || t.accounts.includes(accountFilter);
      const matchesType = typeFilter === 'all' || t.messageType === typeFilter || t.messages.some((m) => m.message_type === typeFilter);
      const matchesStatus = statusFilter === 'all' || t.actionStatus === statusFilter || t.messages.some((m) => m.action_status === statusFilter);

      let matchesDate = true;
      if (dateFilter !== 'all' && t.latestDate) {
        const msgDate = new Date(t.latestDate).toISOString().slice(0, 10);
        const today = new Date().toISOString().slice(0, 10);
        if (dateFilter === 'today') matchesDate = msgDate === today;
        else if (dateFilter === 'week') {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          matchesDate = msgDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          matchesDate = msgDate >= monthAgo;
        } else if (dateFilter === 'year') {
          const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          matchesDate = msgDate >= yearAgo;
        }
      }

      return matchesSearch && matchesAccount && matchesType && matchesStatus && matchesDate;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.latestDate || 0).getTime() - new Date(b.latestDate || 0).getTime();
      else if (sortBy === 'subject') cmp = a.subject.localeCompare(b.subject);
      else if (sortBy === 'count') cmp = a.messageCount - b.messageCount;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [threads, searchQuery, accountFilter, typeFilter, statusFilter, dateFilter, sortBy, sortDir]);

  const StatusBadge = ({ status }: { status?: string }) => {
    if (!status) return <span className="text-xs text-stone-400">—</span>;
    const variants: Record<string, string> = {
      needs_review: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      needs_reply: 'bg-orange-100 text-orange-800 border border-orange-200',
      no_action_needed: 'bg-green-100 text-green-800 border border-green-200',
      completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    };
    return (
      <Badge variant="outline" className={`text-xs ${variants[status] || 'bg-stone-100 text-stone-600'}`}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const TypeBadge = ({ type }: { type?: string }) => {
    if (!type) return null;
    const variants: Record<string, string> = {
      personal: 'bg-blue-100 text-blue-800 border border-blue-200',
      government: 'bg-purple-100 text-purple-800 border border-purple-200',
      newsletter: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      marketing: 'bg-rose-100 text-rose-800 border border-rose-200',
      automated_notification: 'bg-stone-100 text-stone-700 border border-stone-200',
      uncertain: 'bg-gray-100 text-gray-600 border border-gray-200',
    };
    return (
      <Badge variant="outline" className={`text-[10px] ${variants[type] || 'bg-stone-100 text-stone-600'}`}>
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleSelect = (t: ThreadGroup) => {
    onSelectThread(t.threadId);
    setIsDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-red-600 font-sans">
        <p>Error loading correspondence: {error}</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col gap-3 border-b border-stone-200 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-stone-400" />
              <Input
                placeholder="Search subject, sender, account, message text…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-xl bg-white border-stone-300"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="w-36 bg-white border-stone-300"><SelectValue placeholder="All accounts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {ACCOUNTS.map((a) => <SelectItem key={a} value={a}>{a.split('@')[0]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36 bg-white border-stone-300"><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {MESSAGE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white border-stone-300"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Action Statuses</SelectItem>
                  {ACTION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32 bg-white border-stone-300"><SelectValue placeholder="Any date" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Date</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                  <SelectItem value="year">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-stone-500">Sort:</span>
            <Button size="sm" onClick={() => setSortBy('date')} className={sortBy === 'date' ? 'bg-[#800020] text-white hover:bg-[#6b001a]' : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'}>
              <ArrowUpDown className="w-3 h-3 mr-1" /> Latest date {sortBy === 'date' && (sortDir === 'desc' ? '▼' : '▲')}
            </Button>
            <Button size="sm" onClick={() => setSortBy('subject')} className={sortBy === 'subject' ? 'bg-[#800020] text-white hover:bg-[#6b001a]' : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'}>
              Subject
            </Button>
            <Button size="sm" onClick={() => setSortBy('count')} className={sortBy === 'count' ? 'bg-[#800020] text-white hover:bg-[#6b001a]' : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'}>
              Messages
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))} className="text-xs">
              {sortDir === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </div>

        {/* List */}
        {filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-500 font-sans">
            <Mail className="w-12 h-12 opacity-30 mb-3" />
            <p>No conversations found.</p>
            <p className="text-xs mt-2 opacity-50">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="border border-stone-200 rounded-lg bg-white overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-[#F4EFE6]">
                <tr>
                  <th className="text-left text-xs font-medium text-stone-600 px-3 py-2 w-[110px]">Latest</th>
                  <th className="text-left text-xs font-medium text-stone-600 px-3 py-2">Subject</th>
                  <th className="text-left text-xs font-medium text-stone-600 px-3 py-2 w-[160px]">Latest sender</th>
                  <th className="text-left text-xs font-medium text-stone-600 px-3 py-2 w-[90px]">Account</th>
                  <th className="text-center text-xs font-medium text-stone-600 px-3 py-2 w-[60px]">Msgs</th>
                  <th className="text-center text-xs font-medium text-stone-600 px-3 py-2 w-[60px]">📎</th>
                  <th className="text-left text-xs font-medium text-stone-600 px-3 py-2 w-[150px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredThreads.map((t) => (
                  <tr
                    key={t.key}
                    className="cursor-pointer hover:bg-stone-50 border-t border-stone-100"
                    onClick={() => handleSelect(t)}
                  >
                    <td className="px-3 py-2 text-xs text-stone-600 align-top">{formatDate(t.latestDate)}</td>
                    <td className="px-3 py-2 align-top">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate font-medium text-stone-800" title={t.subject}>
                            {t.subject}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md whitespace-pre-wrap break-words">
                          {t.subject}
                        </TooltipContent>
                      </Tooltip>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <TypeBadge type={t.messageType} />
                        {t.relevance && (
                          <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            {t.relevance === 'definite' ? 'Definite' : t.relevance === 'possible' ? 'Possible' : 'Unreviewed'}
                          </Badge>
                        )}
                        {t.actionCounts.needs_review > 0 && (
                          <Badge variant="outline" className="text-[10px] bg-yellow-50 text-yellow-800 border-yellow-200">
                            {t.actionCounts.needs_review} need review
                          </Badge>
                        )}
                        {t.actionCounts.needs_reply > 0 && (
                          <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-800 border-orange-200">
                            {t.actionCounts.needs_reply} need reply
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-stone-600 align-top">
                      <div className="truncate" title={t.latestSender}>{t.latestSender}</div>
                      <div className="text-[10px] text-stone-400">{t.latestDirection === 'in' ? 'inbound' : 'outbound'}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-stone-600 align-top">
                      {t.accounts.map((a) => (a === 'daniele.buatti@gmail.com' ? 'Daniele' : 'INFO')).join(', ')}
                    </td>
                    <td className="px-3 py-2 text-xs text-stone-600 text-center align-top font-mono">{t.messageCount}</td>
                    <td className="px-3 py-2 text-xs text-stone-600 text-center align-top">
                      {t.attachmentCount > 0 ? `${t.attachmentCount} 📎` : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-stone-600 align-top">
                      <StatusBadge status={t.actionStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-stone-500 font-sans">
          {filteredThreads.length} of {threads.length} conversation{threads.length === 1 ? '' : 's'} shown
          {searchQuery || accountFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' ? ' (filtered)' : ''}
          {' · '}{messages.length} underlying message{messages.length === 1 ? '' : 's'}
        </p>
      </div>
    </TooltipProvider>
  );
}
