import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Check, Clock } from 'lucide-react';
import type { Person } from '@/types';
import { getAllRecords, type RecordEntry } from '@/lib/record-loader';
import { parseFsPage, comparePerson, OPEN_KINDS, type CheckItem, type CheckKind } from '@/lib/fs-person-check';
import fsChecks from '@/data/fs-checks.json';

const GROUPS: { kind: CheckKind; heading: string; style: string }[] = [
  { kind: 'add', heading: 'Add on FamilySearch', style: 'border-emerald-200 bg-emerald-50' },
  { kind: 'differs', heading: 'Different — check before changing', style: 'border-amber-200 bg-amber-50' },
  { kind: 'review', heading: 'Review', style: 'border-sky-200 bg-sky-50' },
  { kind: 'not_ready', heading: 'Not ready — get the document first', style: 'border-stone-200 bg-stone-50' },
  { kind: 'ok', heading: 'Already matches', style: 'border-stone-200 bg-white' },
];

const today = () => new Date().toISOString().slice(0, 10);

async function saveCheck(personId: string, patch: Record<string, unknown>) {
  const res = await fetch('/api/fs-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId, patch }),
  });
  if (!res.ok) throw new Error(`Save failed (${res.status})`);
}

export function FamilySearchCheck({ person, people }: { person: Person; people: Person[] }) {
  const [text, setText] = useState('');
  const [items, setItems] = useState<CheckItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [records, setRecords] = useState<Map<string, RecordEntry>>(new Map());

  useEffect(() => {
    getAllRecords().then((list) => setRecords(new Map(list.map((r) => [r.id, r]))));
  }, []);

  const last = (fsChecks as Record<string, { checkedOn?: string; openItems?: number; open?: string[] }>)[person.id];
  const fsId = person.familySearchId;
  const isLocal = import.meta.env.DEV;

  const copy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const run = async () => {
    setError(null);
    setSaved(null);
    const page = parseFsPage(text);
    if (!page.ok) {
      setItems(null);
      setError('Could not find the "Vitals" section. On FamilySearch open the person\'s Details tab, press Cmd + A then Cmd + C, and paste the whole page here.');
      return;
    }
    const result = comparePerson(person, people, records, page);
    setItems(result);
    const open = result.filter((i) => OPEN_KINDS.includes(i.kind));
    if (isLocal) {
      try {
        await saveCheck(person.id, { checkedOn: today(), openItems: open.length, open: open.map((i) => i.title), snoozedOn: null });
        setSaved(open.length === 0 ? 'Saved — FamilySearch is up to date for this person.' : `Saved — ${open.length} item(s) to do.`);
      } catch (e) {
        setError((e as Error).message);
      }
    }
  };

  const later = async () => {
    try {
      await saveCheck(person.id, { snoozedOn: today() });
      setSaved('OK — the Next card will ask again in 30 days.');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const grouped = useMemo(
    () => GROUPS.map((g) => ({ ...g, list: (items ?? []).filter((i) => i.kind === g.kind) })).filter((g) => g.list.length),
    [items]
  );

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {fsId ? (
          <a href={`https://www.familysearch.org/tree/person/details/${fsId}`} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" /> Open {person.name} on FamilySearch ({fsId})
            </Button>
          </a>
        ) : (
          <span className="text-xs text-amber-700">No FamilySearch ID stored for this person yet.</span>
        )}
        {last?.checkedOn && (
          <span className="text-xs text-stone-500">
            Last checked {last.checkedOn}: {last.openItems === 0 ? 'up to date' : `${last.openItems} to do`}
          </span>
        )}
      </div>

      <ol className="list-decimal ml-5 text-xs text-stone-600 space-y-0.5">
        <li>Open the person on FamilySearch (Details tab).</li>
        <li>Press <b>Cmd + A</b>, then <b>Cmd + C</b>.</li>
        <li>Paste below and click <b>Compare</b>. Fix the items on FamilySearch, then paste again to confirm.</li>
      </ol>

      <textarea
        className="w-full h-32 rounded border border-stone-300 p-2 text-xs font-mono"
        placeholder="Paste the FamilySearch Details page here"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <Button size="sm" className="text-xs bg-[#800020] text-white hover:bg-[#600018]" disabled={!text.trim()} onClick={run}>
          <Check className="w-3 h-3 mr-1" /> Compare
        </Button>
        {isLocal && (
          <Button size="sm" variant="outline" className="text-xs" onClick={later}>
            <Clock className="w-3 h-3 mr-1" /> Later (30 days)
          </Button>
        )}
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div>}
      {saved && <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">{saved}</div>}

      {grouped.map((g) => (
        <div key={g.kind} className={`rounded-lg border p-3 ${g.style}`}>
          <div className="text-xs font-bold uppercase tracking-wide text-stone-700 mb-2">{g.heading}</div>
          <ul className="space-y-3">
            {g.list.map((it, idx) => (
              <li key={idx}>
                <div className="font-semibold text-stone-800">{it.title}</div>
                {it.detail && <div className="text-xs text-stone-600 mt-0.5">{it.detail}</div>}
                {it.copy && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {it.copy.filter((c) => c.text).map((c) => {
                      const key = `${g.kind}-${idx}-${c.label}`;
                      return (
                        <Button key={key} size="sm" variant="outline" className="text-[11px] h-6 px-2 bg-white" onClick={() => copy(key, c.text)} title={c.text}>
                          <Copy className="w-3 h-3 mr-1" /> {copied === key ? 'Copied ✓' : c.label}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
