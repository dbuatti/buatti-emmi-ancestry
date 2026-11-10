/**
 * Mail ledger — "what has been sent, what has come back, and who owes whom".
 *
 * Groups messages by the other party (an office's domain, or a private
 * address) and says, for each: how many went out, how many real replies
 * came in, the last date in each direction, and whose move it is.
 *
 * The important part is what does NOT count as a reply:
 *   - PEC receipts (ACCETTAZIONE / CONSEGNA / "posta-certificata@…"): the
 *     post office confirming delivery, not the comune answering.
 *   - Auto-replies ("Risposta automatica", noreply@, protocol robots that
 *     only acknowledge receipt).
 * Counting those as answers would make every chased request look answered.
 *
 * Pure functions, no DOM, no DB.
 */

export interface LedgerMessage {
  id: number;
  thread: string;
  direction: 'in' | 'out';
  fromEmail: string;
  fromName?: string;
  /** Recipient addresses (parsed from to_json) */
  to: string[];
  subject: string;
  /** ISO date-time (sent_at for out, received_at for in) */
  at: string;
}

export type MessageKind = 'sent' | 'reply' | 'receipt' | 'auto';

export interface LedgerRow {
  key: string;
  /** Best display name: office domain or the sender's name */
  name: string;
  addresses: string[];
  sent: number;
  replies: number;
  receipts: number;
  autoReplies: number;
  threads: number;
  lastSentAt: string | null;
  lastReplyAt: string | null;
  lastSubject: string;
  lastThread: string;
  /**
   * waiting  — you wrote last, no real reply since
   * answered — they replied after your last message
   * incoming — they wrote, you have never written to them
   */
  state: 'waiting' | 'answered' | 'incoming';
  /** Whole days since your last message, when state is 'waiting' */
  daysWaiting: number | null;
}

const FREE_MAIL = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.it', 'outlook.com', 'outlook.it', 'live.com', 'live.it',
  'yahoo.com', 'yahoo.it', 'libero.it', 'virgilio.it', 'tiscali.it', 'alice.it', 'icloud.com', 'me.com',
  'bigpond.com', 'optusnet.com.au', 'pec.it', 'legalmail.it', 'postecert.it',
]);

const RECEIPT_SUBJECT = /^\s*(accettazione|consegna|avviso di (non |mancata )?(accettazione|consegna)|ricevuta di (avvenuta )?consegna|presa in carico|posta certificata:\s*(accettazione|consegna))\b/i;
const RECEIPT_SENDER = /^(posta-certificata|postacert|mailer-daemon|postmaster)@/i;
const AUTO_SUBJECT = /\b(risposta automatica|automatic reply|auto(-|\s)?reply|autoreply|out of office|fuori sede|fuori ufficio|accus[eé] de r[eé]ception|ricevuta di protocollazione|conferma di ricezione|notifica di protocollo|we('| ha)ve received your (enquiry|request|message))\b/i;
const AUTO_SENDER = /^(no-?reply|noreply|do-?not-?reply|donotreply|notifications?|automated)[^@]*@/i;

export function classifyMessage(m: Pick<LedgerMessage, 'direction' | 'fromEmail' | 'subject'>): MessageKind {
  if (m.direction === 'out') return 'sent';
  const from = (m.fromEmail || '').toLowerCase();
  const subject = m.subject || '';
  if (RECEIPT_SUBJECT.test(subject) || RECEIPT_SENDER.test(from)) return 'receipt';
  if (AUTO_SUBJECT.test(subject) || AUTO_SENDER.test(from)) return 'auto';
  return 'reply';
}

/** Offices are grouped by domain; private addresses stay separate. */
export function partyKey(email: string): string {
  const e = (email || '').trim().toLowerCase();
  const domain = e.split('@')[1] || '';
  if (!domain) return e;
  return FREE_MAIL.has(domain) ? e : domain;
}

/** "PEC:" / "POSTA CERTIFICATA:" / "Re:" / "R:" / "I:" / "Fwd:" prefixes off a subject. */
export function cleanSubject(s: string): string {
  let out = (s || '').trim();
  for (let i = 0; i < 6; i++) {
    const next = out.replace(/^\s*(re|r|rif|i|fw|fwd|inoltra|posta certificata|pec|anomalia messaggio)\s*:\s*/i, '');
    if (next === out) break;
    out = next;
  }
  return out;
}

export function buildLedger(messages: LedgerMessage[], myAddresses: string[], now: Date = new Date()): LedgerRow[] {
  const mine = new Set(myAddresses.map((a) => a.toLowerCase()));
  const sorted = [...messages].sort((a, b) => a.at.localeCompare(b.at));

  // A receipt or auto-reply names the robot, not the office. Attribute it to
  // whoever that thread's real conversation is with.
  const threadParty = new Map<string, string>();
  for (const m of sorted) {
    if (threadParty.has(m.thread)) continue;
    const kind = classifyMessage(m);
    if (kind === 'sent') {
      const to = m.to.map((t) => t.toLowerCase()).find((t) => t && !mine.has(t));
      if (to) threadParty.set(m.thread, to);
    } else if (kind === 'reply' && !mine.has(m.fromEmail.toLowerCase())) {
      threadParty.set(m.thread, m.fromEmail.toLowerCase());
    }
  }

  interface Acc extends LedgerRow { threadSet: Set<string>; addressSet: Set<string> }
  const rows = new Map<string, Acc>();
  const get = (email: string): Acc => {
    const key = partyKey(email);
    let r = rows.get(key);
    if (!r) {
      r = {
        key, name: key, addresses: [], sent: 0, replies: 0, receipts: 0, autoReplies: 0, threads: 0,
        lastSentAt: null, lastReplyAt: null, lastSubject: '', lastThread: '', state: 'incoming', daysWaiting: null,
        threadSet: new Set(), addressSet: new Set(),
      };
      rows.set(key, r);
    }
    return r;
  };

  for (const m of sorted) {
    const kind = classifyMessage(m);
    let party: string | undefined;
    if (kind === 'sent') party = m.to.map((t) => t.toLowerCase()).find((t) => t && !mine.has(t)) ?? threadParty.get(m.thread);
    else if (kind === 'reply') party = m.fromEmail.toLowerCase();
    else party = threadParty.get(m.thread); // receipts/autos follow the thread; orphans are dropped
    if (!party || mine.has(party)) continue;

    const r = get(party);
    r.threadSet.add(m.thread);
    r.addressSet.add(party);
    if (kind === 'sent') { r.sent++; r.lastSentAt = m.at; }
    else if (kind === 'reply') {
      r.replies++; r.lastReplyAt = m.at;
      // A private address is shown by the sender's name; an office by its domain
      if (m.fromName && r.key.includes('@')) r.name = m.fromName;
    } else if (kind === 'receipt') r.receipts++;
    else r.autoReplies++;
    if (kind === 'sent' || kind === 'reply') { r.lastSubject = cleanSubject(m.subject); r.lastThread = m.thread; }
  }

  const DAY = 86_400_000;
  const out: LedgerRow[] = [];
  for (const r of rows.values()) {
    if (r.sent === 0 && r.replies === 0) continue; // only robots: nothing to show
    r.threads = r.threadSet.size;
    r.addresses = [...r.addressSet].sort();
    if (r.sent === 0) r.state = 'incoming';
    else if (r.lastReplyAt && r.lastReplyAt > (r.lastSentAt ?? '')) r.state = 'answered';
    else {
      r.state = 'waiting';
      const t = Date.parse(r.lastSentAt ?? '');
      r.daysWaiting = Number.isNaN(t) ? null : Math.max(0, Math.floor((now.getTime() - t) / DAY));
    }
    const { threadSet: _t, addressSet: _a, ...row } = r;
    void _t; void _a;
    out.push(row);
  }
  // Longest wait first, then answered (newest reply first), then incoming-only
  const rank = { waiting: 0, answered: 1, incoming: 2 } as const;
  return out.sort((a, b) =>
    rank[a.state] - rank[b.state]
    || (a.state === 'waiting' ? (b.daysWaiting ?? 0) - (a.daysWaiting ?? 0) : 0)
    || (b.lastReplyAt ?? b.lastSentAt ?? '').localeCompare(a.lastReplyAt ?? a.lastSentAt ?? ''));
}

export interface LedgerTotals { sent: number; replies: number; receipts: number; autoReplies: number; waiting: number; overdue: number }

export function ledgerTotals(rows: LedgerRow[], overdueDays = 30): LedgerTotals {
  return rows.reduce<LedgerTotals>((t, r) => ({
    sent: t.sent + r.sent,
    replies: t.replies + r.replies,
    receipts: t.receipts + r.receipts,
    autoReplies: t.autoReplies + r.autoReplies,
    waiting: t.waiting + (r.state === 'waiting' ? 1 : 0),
    overdue: t.overdue + (r.state === 'waiting' && (r.daysWaiting ?? 0) > overdueDays ? 1 : 0),
  }), { sent: 0, replies: 0, receipts: 0, autoReplies: 0, waiting: 0, overdue: 0 });
}
