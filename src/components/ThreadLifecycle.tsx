import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle, ArrowUpRight, XCircle } from 'lucide-react';
import { ThreadSummary } from '@/types/assistant';

interface ThreadLifecycleProps {
  thread: ThreadSummary;
}

export const ThreadLifecycle = ({ thread }: ThreadLifecycleProps) => {
  const cls = (thread.classification || '').toLowerCase();
  const days = thread.days_waiting ?? 0;

  const isChase = days > 30;
  const isResolved = ['resolved', 'documents_received', 'no_action_needed'].includes(cls);
  const isAwaiting = ['awaiting_response', 'follow_up_due'].includes(cls);
  const isActionRequired = ['reply_required', 'action_required'].includes(cls);

  let status: {
    label: string;
    color: string;
    icon: React.ReactNode;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };

  if (isResolved) {
    status = {
      label: 'Resolved',
      color: 'text-emerald-600 border-emerald-200 bg-emerald-50',
      icon: <CheckCircle className="w-3 h-3" />,
      variant: 'outline',
    };
  } else if (isChase) {
    status = {
      label: `Chase Due (${days}d)`,
      color: 'text-red-600 border-red-200 bg-red-50',
      icon: <AlertCircle className="w-3 h-3" />,
      variant: 'destructive',
    };
  } else if (isActionRequired) {
    status = {
      label: 'Action Required',
      color: 'text-orange-600 border-orange-200 bg-orange-50',
      icon: <ArrowUpRight className="w-3 h-3" />,
      variant: 'default',
    };
  } else if (isAwaiting) {
    status = {
      label: 'Awaiting Response',
      color: 'text-orange-600 border-orange-200 bg-orange-50',
      icon: <Clock className="w-3 h-3" />,
      variant: 'secondary',
    };
  } else {
    status = {
      label: thread.classification || 'Unknown',
      color: 'text-stone-600 border-stone-200 bg-stone-50',
      icon: <XCircle className="w-3 h-3" />,
      variant: 'outline',
    };
  }

  return (
    <div className="space-y-2">
      <Badge className={`${status.color} ${status.variant === 'destructive' ? '' : ''}`} variant={status.variant}>
        <span className="flex items-center gap-1">
          {status.icon}
          {status.label}
        </span>
      </Badge>

      {isChase && (
        <div className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-2.5 h-2.5" />
          This thread has been waiting {days} days. Consider sending a follow-up.
        </div>
      )}

      {days > 0 && !isChase && (
        <div className="text-xs text-stone-500 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          Last activity: {days} day{days !== 1 ? 's' : ''} ago
        </div>
      )}

      {thread.compose_available && (
        <div className="text-xs text-emerald-600 flex items-center gap-1">
          <CheckCircle className="w-2.5 h-2.5" />
          Gmail compose available — can send drafts directly
        </div>
      )}

      {!thread.compose_available && (
        <div className="text-xs text-stone-400 flex items-center gap-1">
          <XCircle className="w-2.5 h-2.5" />
          Gmail compose unavailable — copy-paste mode only
        </div>
      )}
    </div>
  );
};