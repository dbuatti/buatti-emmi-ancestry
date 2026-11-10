import { useEffect, useMemo, useState } from 'react';
import { MailOpen } from 'lucide-react';
import { initialPeople } from '@/data/familyDataWrapper';
import { recordTerms } from '@/lib/email-terms';

interface MentionHit {
  id: number;
  subject: string;
  from_name: string;
  from_email: string;
  snippet: string;
  received_at: string;
  attachment_count: number;
  matchedTerms?: string[];
}

/**
 * "Mentioned in email" — the correspondence half of the unified record
 * workspace. Searches imported mail for the record's act number and linked
 * surnames (the same key-term machinery as the task card) so the document,
 * its transcription, its people, and its mail thread all live on one page.
 */
export function RecordMentions({
  recordId,
  atto,
  people,
}: {
  recordId: string;
  atto?: string;
  people: string[];
}) {
  const [hits, setHits] = useState<MentionHit[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const peopleKey = people.join('|');
  const surnames = useMemo(
    () =>
      people.map((pid) => {
        const person = initialPeople.find((p) => p.id === pid);
        const clean = (person?.name ?? '')
          .replace(/\([^)]*\)/g, ' ')
          .replace(/["“”']/g, ' ')
          .trim()
          .split(/\s+/)
          .map((t) => t.replace(/\.+$/, ''))
          .filter((t) => t.length > 2 && !/^(sr|jr|ii|iii|iv|senior|junior)$/i.test(t));
        return clean.length > 0 ? clean[clean.length - 1] : '';
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [peopleKey]
  );

  useEffect(() => {
    const q = recordTerms({ atto }, surnames);
    if (q.length === 0) {
      setHits([]);
      setTerms([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setTerms(q);
    (async () => {
      try {
        const results = await Promise.all(
          q.map((t) =>
            fetch(`/api/correspondence/source?q=${encodeURIComponent(t)}`)
              .then((r) => r.json())
              .then((d) => ({ term: t, hits: (d?.hits ?? []) as MentionHit[] }))
              .catch(() => ({ term: t, hits: [] as MentionHit[] }))
          )
        );
        if (cancelled) return;
        const merged = new Map<number, MentionHit>();
        for (const { term, hits: hs } of results) {
          for (const h of hs) {
            const cur = merged.get(h.id);
            if (cur) {
              if (!cur.matchedTerms!.includes(term)) cur.matchedTerms!.push(term);
            } else {
              merged.set(h.id, { ...h, matchedTerms: [term] });
            }
          }
        }
        setHits(
          [...merged.values()].sort(
            (a, b) => (b.matchedTerms?.length ?? 0) - (a.matchedTerms?.length ?? 0)
          ).slice(0, 6)
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recordId, atto, surnames]);

  return (
    <div className="space-y-2">
      {terms.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] text-stone-500 font-sans py-0.5">Searched:</span>
          {terms.map((t) => (
            <span
              key={t}
              className="rounded-full bg-stone-100 border border-stone-200 px-2 py-0.5 text-[10px] font-sans text-stone-600"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {loading ? (
        <p className="text-xs text-stone-500 font-sans">Searching imported mail…</p>
      ) : hits.length > 0 ? (
        <ul className="space-y-2">
          {hits.map((h) => (
            <li
              key={h.id}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700"
            >
              <span className="font-semibold">{h.subject || '(no subject)'}</span>
              {h.from_name ? <span className="text-stone-500"> — from {h.from_name}</span> : null}
              <span className="text-stone-400">
                {' '}
                · {h.received_at ? String(h.received_at).slice(0, 10) : ''}
              </span>
              {(h.matchedTerms ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(h.matchedTerms ?? []).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#800020]/10 text-[#800020] px-1.5 py-px text-[10px] font-sans font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {h.snippet ? <div className="text-stone-600 mt-1">{h.snippet}</div> : null}
              {!!h.attachment_count && (
                <div className="mt-1 inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold font-sans">
                  {h.attachment_count} attachment{h.attachment_count === 1 ? '' : 's'}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-stone-600 font-sans flex items-center gap-1.5">
          <MailOpen className="w-3.5 h-3.5 text-stone-400" />
          No mentions in imported mail for these terms.
        </p>
      )}
    </div>
  );
}
