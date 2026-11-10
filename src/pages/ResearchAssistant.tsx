import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AssistantSummaryResponse, ThreadSummary, Suggestion } from '@/types/assistant';
import { AssistantDashboard } from '@/components/AssistantDashboard';
import { ThreadSummaryCard } from '@/components/ThreadSummaryCard';
import { ThreadLifecycle } from '@/components/ThreadLifecycle';
import { DraftGeneratorPanel } from '@/components/DraftGeneratorPanel';

const ResearchAssistant = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AssistantSummaryResponse>({} as AssistantSummaryResponse);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadSummary | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'chase' | 'no-action'>('all');
  const [filterAccount, setFilterAccount] = useState<'all' | 'daniele' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const detailRef = useRef<HTMLDivElement>(null);

  // Scroll to the thread detail when a thread/suggestion is selected.
  useEffect(() => {
    if ((selectedThread || selectedSuggestion) && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedThread, selectedSuggestion]);

  useEffect(() => {
    fetch('/api/assistant/summary')
      .then(r => r.json())
      .then(setSummary)
      .catch(() => toast({ title: "Error", description: "Failed to load summary data", variant: "destructive" }));
    fetch('/api/assistant/suggestions')
      .then(r => r.json())
      .then(data => {
        if (data?.suggestions) setSuggestions(data.suggestions);
      })
      .catch(() => {});
  }, [toast]);

  const handleSelectThread = (thread: ThreadSummary) => {
    setSelectedThread(thread);
    setSelectedSuggestion(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <nav className="border-b border-stone-200 px-4 py-3 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-serif font-bold text-[#800020]">Research Assistant</h1>
          <Select onValueChange={(v) => setFilterAccount(v as 'all' | 'daniele' | 'info')}>
            <SelectTrigger className="bg-white border-stone-300">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daniele">daniele.buatti@gmail.com</SelectItem>
              <SelectItem value="info">info@danielebuatti.com</SelectItem>
              <SelectItem value="all">All accounts</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => setFilterStatus(v as 'all' | 'pending' | 'chase' | 'no-action')}>
            <SelectTrigger className="bg-white border-stone-300">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="chase">Chase (greater than 30 days)</SelectItem>
              <SelectItem value="no-action">No action needed</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search institution, people, protocol refs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-white border-stone-300"
          />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {suggestions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-serif font-bold text-[#800020] mb-4">Automatic Suggestions</h2>
            <div className="space-y-3">
              {suggestions.map(s => (
                <Card key={s.rule_id + s.thread_id} className="border-stone-200 hover:border-[#800020]/30 cursor-pointer" onClick={() => setSelectedSuggestion(s)}>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium">Rule: {s.rule_id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${s.confidence >= 80 ? 'bg-green-100 text-green-700' : s.confidence >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {s.confidence}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-serif">{s.institution}</p>
                    <p className="text-sm text-stone-500">
                      {s.people?.join(', ') || s.account_email} · {s.classification} ({s.days_waiting ?? '-'} day{s.days_waiting !== 1 && s.days_waiting !== 0 ? 's' : ''})
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <AssistantDashboard
          summary={summary}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterAccount={filterAccount}
          setFilterAccount={setFilterAccount}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectThread={setSelectedThread}
        />

        {selectedSuggestion ? (
          <div ref={detailRef} className="mt-6 space-y-6">
            <Button onClick={() => { setSelectedSuggestion(null); setSelectedThread(null); }} size="sm" variant="ghost">
              ← Back
            </Button>
            <ThreadSummaryCard thread={selectedSuggestion} />
            <ThreadLifecycle thread={selectedSuggestion} />
            <DraftGeneratorPanel
              threadId={selectedSuggestion.thread_id}
              gmailThreadId={selectedSuggestion.gmail_thread_id}
              accountEmail={selectedSuggestion.account_email}
              composeAvailable={selectedSuggestion.compose_available}
              institution={selectedSuggestion.institution}
              people={selectedSuggestion.people}
              protocolRefs={selectedSuggestion.protocol_refs}
              purpose={selectedSuggestion.purpose}
              latestSnippet={selectedSuggestion.latest_inbound_snippet}
              classification={selectedSuggestion.classification}
              prefillTemplate={selectedSuggestion.draft_template}
            />
          </div>
        ) : selectedThread ? (
          <div ref={detailRef} className="mt-6 space-y-6">
            <Button onClick={() => { setSelectedThread(null); setSelectedSuggestion(null); }} size="sm" variant="ghost">
              ← Back
            </Button>
            <ThreadSummaryCard thread={selectedThread} />
            <ThreadLifecycle thread={selectedThread} />
            <DraftGeneratorPanel
              threadId={selectedThread.thread_id}
              gmailThreadId={selectedThread.gmail_thread_id}
              accountEmail={selectedThread.account_email}
              composeAvailable={selectedThread.compose_available}
              institution={selectedThread.institution}
              people={selectedThread.people}
              protocolRefs={selectedThread.protocol_refs}
              purpose={selectedThread.purpose}
              latestSnippet={selectedThread.latest_inbound_snippet}
              classification={selectedThread.classification}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default ResearchAssistant;
