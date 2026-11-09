export interface ThreadSummary {
  thread_id: string;
  gmail_thread_id: string;
  account_email: string;
  compose_available: boolean;
  institution: string;
  people: string[];
  protocol_refs: string[];
  classification: string;
  days_waiting: number | null;
  latest_inbound_snippet: string;
  status?: string;
  has_unanswered_inbound?: number;
}

export type ChaseEntry = ThreadSummary;

export interface Suggestion {
  thread_id: string;
  gmail_thread_id: string;
  account_email: string;
  compose_available: boolean;
  institution: string;
  people: string[];
  classification: string;
  days_waiting: number | null;
  protocol_refs: string[];
  latest_inbound_snippet: string;
  rule_id: string;
  confidence: number;
  auto_action: string;
  draft_template?: string | null;
  human_review: boolean;
}

export interface AssistantSummaryResponse {
  pending_actions: ThreadSummary[];
  chase_due: ThreadSummary[];
  no_action_needed: ThreadSummary[];
  model_available: boolean;
  db_stats: {
    total_messages: number;
    by_account: Record<string, number>;
    definite: number;
    possible: number;
    unreviewed: number;
  };
}

export type FilterStatus = 'all' | 'pending' | 'chase' | 'no-action';
export type FilterAccount = 'all' | 'daniele' | 'info';

export type SubjectType = 'ThreadRow' | 'ResearchAssistantSummary';
