import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Clock, Mail, RefreshCw, Eye, MessageSquare } from 'lucide-react';

interface NewItem {
  thread_id: string;
  db_thread_id: number;
  account_email: string;
  subject: string;
  institution: string | null;
  classification: string;
  confidence: string;
  is_new_thread: boolean;
  new_message_count: number;
  new_relevant_count: number;
  new_irrelevant_count: number;
  new_message_ids: number[];
  recommended_action: string;
  evidence: { msg_id: number; quote: string }[];
  reviewed: boolean;
}

interface NewItemsData {
  detected_at: string | null;
  watermark_before: number;
  new_message_count: number;
  new_thread_count: number;
  genealogy_relevant_count: number;
  irrelevant_count: number;
  items: NewItem[];
  message?: string;
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  reply_required: 'bg-red-100 text-red-800 border-red-200',
  action_required: 'bg-orange-100 text-orange-800 border-orange-200',
  awaiting_response: 'bg-blue-100 text-blue-800 border-blue-200',
  follow_up_due: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  uncertain: 'bg-gray-100 text-gray-800 border-gray-200',
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  reply_required: 'Reply Required',
  action_required: 'Action Required',
  awaiting_response: 'Awaiting Response',
  follow_up_due: 'Follow-up Due',
  resolved: 'Resolved',
  uncertain: 'Uncertain',
};

export function NewItemsView() {
  const { toast } = useToast();
  const [data, setData] = useState<NewItemsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<{ isRunning: boolean; lastRun: string | null } | null>(null);

  const fetchNewItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/correspondence/new-items');
      if (!res.ok) throw new Error('Failed to fetch new items');
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load new items', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const runDetection = async () => {
    setDetecting(true);
    try {
      const res = await fetch('/api/correspondence/detect-new', { method: 'POST' });
      if (!res.ok) throw new Error('Detection failed');
      const json = await res.json();
      toast({ title: 'Detection complete', description: `${json.new_messages || 0} new messages, ${json.items || 0} items surfaced` });
      await fetchNewItems();
    } catch (err) {
      toast({ title: 'Error', description: 'Detection failed', variant: 'destructive' });
    } finally {
      setDetecting(false);
    }
  };

  const markReviewed = async () => {
    try {
      const res = await fetch('/api/correspondence/mark-reviewed', { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      toast({ title: 'Reviewed', description: 'All items marked as reviewed' });
      await fetchNewItems();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to mark reviewed', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchNewItems();
    fetch('/api/correspondence/pipeline-status').then(r => r.json()).then(setPipelineStatus).catch(() => {});
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]"></div></div>;
  }

  const items = data?.items || [];
  const needsAttention = items.filter(i => !i.reviewed && (i.classification === 'reply_required' || i.classification === 'action_required' || i.classification === 'follow_up_due'));
  const awaiting = items.filter(i => !i.reviewed && i.classification === 'awaiting_response');
  const resolved = items.filter(i => !i.reviewed && i.classification === 'resolved');
  const informational = items.filter(i => !i.reviewed && i.classification === 'uncertain');

  return (
    <div className="space-y-4">
      {/* Processing status */}
      {pipelineStatus && (
        <div className="text-xs text-stone-500 flex items-center gap-2 mb-2">
          <span className={`w-2 h-2 rounded-full ${pipelineStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`}></span>
          {pipelineStatus.isRunning ? 'Pipeline running...' : (pipelineStatus.lastRun ? `Last run: ${pipelineStatus.lastRun.slice(0, 19)}` : 'No pipeline runs yet')}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-serif font-bold">New &amp; Needs Attention</h3>
          <p className="text-sm text-stone-500">
            {data?.detected_at ? `Last detection: ${new Date(data.detected_at).toLocaleString()}` : 'No detection run yet'}
            {data?.new_message_count ? ` · ${data.new_message_count} new messages (${data.genealogy_relevant_count || 0} genealogy-relevant)` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={runDetection} disabled={detecting}>
            <RefreshCw className={`w-3 h-3 mr-1 ${detecting ? 'animate-spin' : ''}`} /> Detect New
          </Button>
          {items.length > 0 && (
            <Button size="sm" variant="outline" onClick={markReviewed}>
              <CheckCircle2 className="w-3 h-3 mr-1" /> Mark All Reviewed
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="border-stone-200">
          <CardContent className="pt-6 text-center text-stone-500">
            <Mail className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p>No new items. Run "Detect New" after importing new emails.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Needs attention */}
          {needsAttention.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Needs My Attention ({needsAttention.length})</h4>
              {needsAttention.map((item, i) => (
                <Card key={i} className="border-2 border-red-200 bg-red-50/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={CLASSIFICATION_COLORS[item.classification] || ''}>
                            {CLASSIFICATION_LABELS[item.classification] || item.classification}
                          </Badge>
                          {item.is_new_thread && <Badge variant="outline" className="text-xs">New thread</Badge>}
                          {item.institution && <span className="text-xs text-stone-500">{item.institution}</span>}
                        </div>
                        <div className="font-medium text-sm truncate">{item.subject}</div>
                        <div className="text-xs text-stone-600 mt-1">{item.recommended_action}</div>
                        {item.evidence?.length > 0 && (
                          <div className="text-xs text-stone-500 mt-1 italic">
                            Evidence: {item.evidence[0].quote?.slice(0, 120)}...
                          </div>
                        )}
                        <div className="text-xs text-stone-400 mt-1">
                          {item.new_message_count} new message(s) · {item.new_relevant_count} genealogy-relevant
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Awaiting responses */}
          {awaiting.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Awaiting Responses ({awaiting.length})</h4>
              {awaiting.map((item, i) => (
                <Card key={i} className="border-stone-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={CLASSIFICATION_COLORS.awaiting_response}>Awaiting Response</Badge>
                      {item.institution && <span className="text-xs text-stone-500">{item.institution}</span>}
                    </div>
                    <div className="font-medium text-sm truncate">{item.subject}</div>
                    <div className="text-xs text-stone-600 mt-1">{item.recommended_action}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Resolved */}
          {resolved.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Recently Resolved ({resolved.length})</h4>
              {resolved.map((item, i) => (
                <Card key={i} className="border-green-200 bg-green-50/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={CLASSIFICATION_COLORS.resolved}>Resolved</Badge>
                      {item.institution && <span className="text-xs text-stone-500">{item.institution}</span>}
                    </div>
                    <div className="font-medium text-sm truncate">{item.subject}</div>
                    <div className="text-xs text-stone-600 mt-1">{item.recommended_action}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Uncertain / informational */}
          {informational.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Needs Review ({informational.length})</h4>
              {informational.map((item, i) => (
                <Card key={i} className="border-stone-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={CLASSIFICATION_COLORS.uncertain}>Uncertain</Badge>
                      {item.institution && <span className="text-xs text-stone-500">{item.institution}</span>}
                    </div>
                    <div className="font-medium text-sm truncate">{item.subject}</div>
                    <div className="text-xs text-stone-600 mt-1">{item.recommended_action}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}