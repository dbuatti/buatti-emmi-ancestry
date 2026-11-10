import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, Inbox, Search, RefreshCw, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { buildLedger, ledgerTotals, type LedgerMessage, type LedgerRow } from '@/lib/mail-ledger';

type Scope = 'genealogy' | 'all';
type Filter = 'all' | 'waiting' | 'answered' | 'incoming';

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

function StateBadge({ row }: { row: LedgerRow }) {
  if (row.state === 'waiting') {
    const days = row.daysWaiting ?? 0;
    const tone = days > 30 ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-stone-100 text-stone-700 border-stone-300';
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-sans whitespace-nowrap ${tone}`}>
        <Clock className="w-3 h-3" /> Waiting {days} day{days === 1 ? '' : 's'}
      </span>
    );
  }
  if (row.state === 'answered') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[11px] font-sans whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3" /> They replied
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 text-sky-800 px-2 py-0.5 text-[11px] font-sans whitespace-nowrap">
      <Inbox className="w-3 h-3" /> Wrote to you
    </span>
  );
}

/**
 * "Sent & received": one line per office or person — how many messages went
 * each way, when, and whose move it is. PEC delivery receipts and automatic
 * acknowledgements are counted separately and never treated as an answer.
 */
export function MailLedger() {
  const [scope, setScope] = useState<Scope>('genealogy');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<{ messages: LedgerMessage[]; accounts: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const load = (s: Scope) => {
    setLoading(true);
    setError(null);
    fetch(`/api/correspondence/ledger-messages?scope=${s}`)
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setData({ messages: j.messages, accounts: j.accounts });
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(scope); }, [scope]);

  const rows = useMemo(() => (data ? buildLedger(data.messages, data.accounts) : []), [data]);
  const totals = useMemo(() => ledgerTotals(rows), [rows]);
  const q = query.trim().toLowerCase();
  const shown = rows.filter((r) =>
    (filter === 'all' || r.state === filter)
    && (!q || `${r.name} ${r.addresses.join(' ')} ${r.lastSubject}`.toLowerCase().includes(q)));

  const copyWaiting = async () => {
    const list = rows.filter((r) => r.state === 'waiting')
      .map((r) => `• ${r.name} — sent ${fmtDate(r.lastSentAt)} (${r.daysWaiting} days) — ${r.lastSubject}`).join('\n');
    try { await navigator.clipboard.writeText(list); toast.success('Waiting list copied'); }
    catch { toast.error('Could not copy'); }
  };

  const chips: { key: Filter; label: string; n: number }[] = [
    { key: 'all', label: 'Everyone', n: rows.length },
    { key: 'waiting', label: 'Waiting on them', n: totals.waiting },
    { key: 'answered', label: 'They replied', n: rows.filter((r) => r.state === 'answered').length },
    { key: 'incoming', label: 'Wrote to you', n: rows.filter((r) => r.state === 'incoming').length },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-500 font-sans max-w-3xl">
        One line per office or person. Delivery receipts (PEC “Accettazione” / “Consegna”) and automatic
        acknowledgements are counted on their own and never treated as an answer, so “Waiting” means no
        human has replied since your last message. Unsent drafts are not included.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: ArrowUpRight, n: totals.sent, label: 'Sent by you' },
          { icon: ArrowDownLeft, n: totals.replies, label: 'Real replies received' },
          { icon: Clock, n: totals.waiting, label: 'Waiting on a reply', sub: totals.overdue ? `${totals.overdue} over 30 days` : 'none over 30 days', warn: totals.overdue > 0 },
          { icon: Inbox, n: totals.receipts + totals.autoReplies, label: 'Receipts & auto-replies', sub: 'not counted as answers' },
        ].map((t) => (
          <div key={t.label} className="rounded-lg border border-stone-200 bg-white p-3">
            <span className="flex items-center gap-1.5 text-xs text-stone-600 font-sans"><t.icon className="w-3.5 h-3.5" /> {t.label}</span>
            <span className={`block text-2xl font-bold font-serif mt-1 ${t.warn ? 'text-amber-700' : 'text-stone-900'}`}>{data ? t.n : '–'}</span>
            {t.sub && <span className="block text-[11px] text-stone-500 font-sans">{t.sub}</span>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              aria-pressed={filter === c.key}
              className={`rounded-full border px-3 py-1 text-xs font-sans transition-colors ${
                filter === c.key ? 'bg-[#800020] border-[#800020] text-white' : 'bg-white border-stone-300 text-stone-700 hover:border-stone-500'
              }`}
            >
              {c.label} <span className="opacity-70">{c.n}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[10rem]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find an office, address or subject…" aria-label="Filter ledger" className="pl-9 bg-white font-sans h-9" />
        </div>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as Scope)}
          aria-label="Which mail to include"
          className="rounded-md border border-stone-300 bg-white px-2 h-9 text-xs font-sans"
        >
          <option value="genealogy">Family-research mail only</option>
          <option value="all">All imported mail</option>
        </select>
        <Button variant="outline" size="sm" className="font-sans h-9" onClick={copyWaiting} disabled={totals.waiting === 0}>
          <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy waiting list
        </Button>
        <Button variant="ghost" size="sm" className="font-sans h-9" onClick={() => load(scope)} disabled={loading} aria-label="Reload">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 font-sans">
          Couldn’t read the mail archive: {error}. This view needs the local app (pnpm dev) with the Gmail sync run at least once.
        </div>
      )}
      {!error && data && shown.length === 0 && (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white/60 p-8 text-center text-stone-500 font-sans text-sm">
          {rows.length === 0
            ? (scope === 'genealogy'
              ? 'No family-research mail found yet. Run a Gmail scan, or switch to “All imported mail”.'
              : 'No mail imported yet. Run a Gmail scan first.')
            : 'Nobody matches that filter.'}
        </div>
      )}

      {shown.length > 0 && (
        <ul className="rounded-lg border border-stone-200 bg-white divide-y divide-stone-100">
          {shown.map((r) => {
            const isOpen = open === r.key;
            return (
              <li key={r.key}>
                <button
                  onClick={() => setOpen(isOpen ? null : r.key)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-3 hover:bg-stone-50 grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_7rem_7rem_auto] gap-x-4 gap-y-1 items-center"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-stone-900 truncate">{r.name}</span>
                    <span className="block text-xs text-stone-500 font-sans truncate">{r.lastSubject || '(no subject)'}</span>
                  </span>
                  <span className="hidden md:block text-xs font-sans text-stone-600" title="Messages you sent · date of the last one">
                    <ArrowUpRight className="w-3 h-3 inline -mt-0.5 text-stone-400" /> {r.sent} · {fmtDate(r.lastSentAt)}
                  </span>
                  <span className="hidden md:block text-xs font-sans text-stone-600" title="Real replies received · date of the last one">
                    <ArrowDownLeft className="w-3 h-3 inline -mt-0.5 text-stone-400" /> {r.replies} · {fmtDate(r.lastReplyAt)}
                  </span>
                  <StateBadge row={r} />
                </button>
                {isOpen && (
                  <dl className="px-3 pb-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs font-sans text-stone-600">
                    <dt className="text-stone-400">Addresses</dt><dd className="[overflow-wrap:anywhere]">{r.addresses.join(', ')}</dd>
                    <dt className="text-stone-400">You sent</dt><dd>{r.sent === 0 ? 'Nothing yet' : `${r.sent} — last on ${fmtDate(r.lastSentAt)}`}</dd>
                    <dt className="text-stone-400">They replied</dt><dd>{r.replies === 0 ? 'No reply yet' : `${r.replies} — last on ${fmtDate(r.lastReplyAt)}`}</dd>
                    <dt className="text-stone-400">Receipts / auto</dt><dd>{r.receipts} delivery receipt{r.receipts === 1 ? '' : 's'}, {r.autoReplies} automatic acknowledgement{r.autoReplies === 1 ? '' : 's'}</dd>
                    <dt className="text-stone-400">Conversations</dt><dd>{r.threads}</dd>
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
