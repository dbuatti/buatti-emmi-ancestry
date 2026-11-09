import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThreadSummary } from '@/types/assistant';

interface ThreadSummaryCardProps {
  thread: ThreadSummary;
}

export const ThreadSummaryCard = ({ thread }: ThreadSummaryCardProps) => {
  const statusColors: Record<string, string> = {
    reply_required: 'bg-stone-orange-100 text-stone-orange-700 border-stone-orange-200',
    action_required: 'bg-stone-orange-100 text-stone-orange-700 border-stone-orange-200',
    awaiting_response: 'bg-stone-orange-100 text-stone-orange-700 border-stone-orange-200',
    follow_up_due: 'bg-red-100 text-red-700 border-red-200',
    no_action_needed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    documents_received: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const statusClass = statusColors[(thread.classification || '').toLowerCase()] || 'bg-stone-100 text-stone-700 border-stone-200';

  const composeStatus = thread.compose_available ? (
    <span className="text-emerald-600 text-xs font-medium">✓ Gmail compose available</span>
  ) : (
    <span className="text-stone-400 text-xs font-medium">✗ Gmail compose unavailable (copy-paste mode)</span>
  );

  return (
    <Card className="border-stone-200">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Thread {thread.thread_id}</CardTitle>
            {thread.institution && (
              <p className="text-sm text-stone-600 mt-1">Institution: {thread.institution}</p>
            )}
          </div>
          <Badge className={statusClass} variant="outline">
            {(thread.classification || 'unknown').toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wide">Account</p>
            <p className="font-serif">{thread.account_email}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wide">Days Waiting</p>
            <p className="font-serif">{thread.days_waiting ?? 'unknown'}</p>
          </div>
        </div>

        {thread.people && thread.people.length > 0 && (
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">People</p>
            <div className="flex flex-wrap gap-2">
              {thread.people.map((p, i) => (
                <span key={i} className="px-2 py-1 bg-stone-100 rounded text-sm">{p}</span>
              ))}
            </div>
          </div>
        )}

        {thread.protocol_refs && thread.protocol_refs.length > 0 && (
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">Protocol References</p>
            <div className="flex flex-wrap gap-2">
              {thread.protocol_refs.map((p, i) => (
                <span key={i} className="px-2 py-1 bg-stone-50 border border-stone-200 rounded text-sm font-mono">{p}</span>
              ))}
            </div>
          </div>
        )}

        {thread.purpose && (
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">Purpose of this correspondence</p>
            <p className="text-sm text-stone-700">{thread.purpose}</p>
          </div>
        )}

        {thread.latest_inbound_snippet && (
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">Latest Inbound Snippet</p>
            <p className="text-sm text-stone-700">{thread.latest_inbound_snippet}</p>
          </div>
        )}

        <div className="pt-2 border-t border-stone-200">
          {composeStatus}
        </div>
      </CardContent>
    </Card>
  );
};
