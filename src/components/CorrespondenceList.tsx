import { useState, useEffect, useMemo } from 'react';
import { Search, Mail, ArrowUpDown, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LinkifiedText } from '@/components/LinkifiedText';
import { useToast } from '@/hooks/use-toast';
import { CorrespondenceMessage } from '@/pages/ResearchCentre';

export interface CorrespondenceListProps {
  relevance: 'definite' | 'possible';
  onSelectMessage: (message: CorrespondenceMessage) => void;
  setIsDetailOpen: (open: boolean) => void;
}

const ACCOUNTS = ['daniele.buatti@gmail.com', 'info@danielebuatti.com'];

const MESSAGE_TYPES = ['personal', 'government', 'newsletter', 'marketing', 'automated_notification', 'uncertain'];

const ACTION_STATUSES = ['needs_review', 'needs_reply', 'no_action_needed', 'completed'];

export function CorrespondenceList({ relevance, onSelectMessage, setIsDetailOpen }: CorrespondenceListProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<CorrespondenceMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'subject' | 'account' | 'type' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/correspondence/genealogy/messages?relevance=${relevance}`);
        if (!response.ok) throw new Error('Failed to load messages');
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (err) {
        toast({
          title: 'Error',
          description: `Failed to load ${relevance} messages`,
          variant: 'destructive',
        });
      }
    };

    loadMessages();
  }, [relevance, toast]);

  const filteredMessages = useMemo(() => {
    const result = messages.filter(m => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        m.subject?.toLowerCase().includes(q) ||
        m.from_name?.toLowerCase().includes(q) ||
        m.from_email?.toLowerCase().includes(q) ||
        m.account_email.toLowerCase().includes(q) ||
        m.snippet?.toLowerCase().includes(q);

      const matchesAccount = accountFilter === 'all' || m.account_email === accountFilter;
      const matchesType = typeFilter === 'all' || m.message_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || m.action_status === statusFilter;

      let matchesDate = true;
      if (dateFilter !== 'all' && m.received_at) {
        const msgDate = new Date(m.received_at).toISOString().slice(0, 10);
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
      switch (sortBy) {
        case 'date':
          cmp = new Date(a.received_at || 0).getTime() - new Date(b.received_at || 0).getTime();
          break;
        case 'subject':
          cmp = (a.subject || '').localeCompare(b.subject || '');
          break;
        case 'account':
          cmp = a.account_email.localeCompare(b.account_email);
          break;
        case 'type':
          cmp = (a.message_type || '').localeCompare(b.message_type || '');
          break;
        case 'status':
          cmp = (a.action_status || '').localeCompare(b.action_status || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [messages, searchQuery, accountFilter, typeFilter, statusFilter, dateFilter, sortBy, sortDir]);

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
    if (!type) return <span className="text-xs text-stone-400">—</span>;
    const variants: Record<string, string> = {
      personal: 'bg-blue-100 text-blue-800 border border-blue-200',
      government: 'bg-purple-100 text-purple-800 border border-purple-200',
      newsletter: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      marketing: 'bg-rose-100 text-rose-800 border border-rose-200',
      automated_notification: 'bg-stone-100 text-stone-700 border border-stone-200',
      uncertain: 'bg-gray-100 text-gray-600 border border-gray-200',
    };
    return (
      <Badge variant="outline" className={`text-xs ${variants[type] || 'bg-stone-100 text-stone-600'}`}>
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const AccountBadge = ({ account }: { account: string }) => (
    <Badge variant="secondary" className="text-xs w-full">
      {account === 'daniele.buatti@gmail.com' ? 'Daniele' : 'INFO'}
      <span className="ml-1 text-[10px] opacity-60">{account.split('@')[1]}</span>
    </Badge>
  );

  const DirectionBadge = ({ direction }: { direction?: string }) => {
    if (direction === 'in') return <Badge variant="outline" className="text-xs">Inbound</Badge>;
    if (direction === 'out') return <Badge variant="outline" className="text-xs">Outbound</Badge>;
    return null;
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const RelevanceTag = ({ relevance }: { relevance?: string }) => {
    if (!relevance) return null;
    return (
      <Badge variant="secondary" className="text-xs flex items-center gap-1">
        <ShieldAlert className="w-3 h-3" />
        {relevance === 'definite' ? 'Definite' : 'Possible'}
      </Badge>
    );
  };

  const relevanceLabel = relevance === 'definite' ? 'Definite' : 'Possible';

  const handleSelect = (msg: CorrespondenceMessage) => {
    onSelectMessage(msg);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search subject, sender, account..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-80 max-w-none bg-white border-stone-300"
          />
        </div>

        <div className="flex gap-2">
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-32 bg-white border-stone-300">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {ACCOUNTS.map(a => (
                <SelectItem key={a} value={a}>{a.split('@')[0]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 bg-white border-stone-300">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {MESSAGE_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-white border-stone-300">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Action Statuses</SelectItem>
              {ACTION_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32 bg-white border-stone-300">
              <SelectValue placeholder="Any date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Date</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setSortBy('date')} className={sortBy === 'date' ? 'bg-[#800020] text-white' : 'bg-white border-stone-300'}>
            <ArrowUpDown className="w-3 h-3 mr-1" /> Date
            {sortBy === 'date' && (sortDir === 'desc' ? ' ▼' : ' ▲')}
          </Button>
          <Button size="sm" onClick={() => setSortBy('subject')} className={sortBy === 'subject' ? 'bg-[#800020] text-white' : 'bg-white border-stone-300'}>
            Subject
          </Button>
        </div>
      </div>

      {/* List */}
      {filteredMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-500 font-sans">
          <Mail className="w-12 h-12 opacity-30 mb-3" />
          <p>No {relevanceLabel} messages found.</p>
          <p className="text-xs mt-2 opacity-50">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-stone-200 rounded-lg bg-white">
          <Table>
            <TableHeader className="bg-[#F4EFE6]">
              <TableRow>
                <TableHead className="text-xs font-medium text-stone-600 text-left">Date</TableHead>
                <TableHead className="text-xs font-medium text-stone-600 text-left">Subject</TableHead>
                <TableHead className="text-xs font-medium text-stone-600 text-left">Sender</TableHead>
                <TableHead className="text-xs font-medium text-stone-600 text-left">Account</TableHead>
                <TableHead className="text-xs font-medium text-stone-600 text-left">Type</TableHead>
                <TableHead className="text-xs font-medium text-stone-600 text-left">Action</TableHead>
                <TableHead className="text-xs font-medium text-stone-600 text-left">Relevance</TableHead>
                <TableHead className="text-xs font-medium text-stone-600 text-left">Attachments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map(msg => (
                <TableRow key={msg.id} className="cursor-pointer" onClick={() => handleSelect(msg)}>
                  <TableCell className="text-xs text-stone-600">
                    {formatDate(msg.received_at)}
                  </TableCell>
                  <TableCell className="text-xs text-stone-800 truncate max-w-xs" title={msg.subject}>
                    <LinkifiedText text={msg.subject || '(no subject)'} />
                  </TableCell>
                  <TableCell className="text-xs text-stone-600 truncate max-w-xs" title={msg.from_name || msg.from_email}>
                    {msg.from_name || msg.from_email || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-stone-600">
                    <AccountBadge account={msg.account_email} />
                  </TableCell>
                  <TableCell className="text-xs text-stone-600">
                    <TypeBadge type={msg.message_type} />
                  </TableCell>
                  <TableCell className="text-xs text-stone-600">
                    <StatusBadge status={msg.action_status} />
                  </TableCell>
                  <TableCell className="text-xs text-stone-600">
                    <RelevanceTag relevance={msg.genealogy_relevance} />
                  </TableCell>
                  <TableCell className="text-xs text-center text-stone-600 font-mono">
                    {msg.attachment_count || 0}
                    {msg.attachment_count && msg.attachment_count > 0 ? ' 📎' : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-stone-500 font-sans">
        {filteredMessages.length} of {messages.length} message{messages.length === 1 ? '' : 's'} shown
        {searchQuery || accountFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' ? ' (filtered)' : ''}
      </p>
    </div>
  );
}
