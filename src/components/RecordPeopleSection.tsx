import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { initialPeople } from '@/data/familyDataWrapper';
import { suggestPerson } from '@/lib/person-suggest';

/**
 * People linked to a record, split by role:
 * - subjects (`people`): the record is ABOUT them — drives counts,
 *   vetting, find-it blocks and the FamilySearch source steps.
 * - mentioned (`mentioned`): merely NAMED in it (parents on a death act,
 *   witnesses, officers). Discoverable, but doesn't inflate their records.
 *
 * Suggestion buttons add as *mentioned* (they're text matches by
 * construction); the manual dropdown links as *subject*. The ⇄ button
 * flips a person between the two without unlinking.
 */
export function RecordPeopleSection({
  recordId,
  people,
  mentioned,
  body,
  setStatus,
}: {
  recordId: string;
  people: string[];
  mentioned: string[];
  body: string;
  setStatus: (s: string | null) => void;
}) {
  const dismissKey = `record-people-dismissed-${recordId}`;
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(dismissKey) ?? '[]') as string[];
    } catch {
      return [];
    }
  });
  const dismissSuggestion = (pid: string) => {
    const next = [...dismissed, pid];
    setDismissed(next);
    try {
      localStorage.setItem(dismissKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };
  const save = async (nextPeople: string[], nextMentioned: string[], msg: string) => {
    setStatus(msg + '…');
    try {
      const res = await fetch(`/api/update-record-people/${recordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: nextPeople, mentioned: nextMentioned }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to save');
      setStatus(msg);
      window.location.reload();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const unlink = (pid: string, from: 'people' | 'mentioned') =>
    from === 'people'
      ? save(
          people.filter((p) => p !== pid),
          mentioned,
          `Unlinked ${initialPeople.find((p) => p.id === pid)?.name || pid} from this record`
        )
      : save(
          people,
          mentioned.filter((p) => p !== pid),
          `Unmentioned ${initialPeople.find((p) => p.id === pid)?.name || pid}`
        );

  const flip = (pid: string, from: 'people' | 'mentioned') =>
    from === 'people'
      ? save(
          people.filter((p) => p !== pid),
          [...mentioned, pid],
          'Moved to mentioned'
        )
      : save(
          [...people, pid],
          mentioned.filter((p) => p !== pid),
          'Moved to subjects'
        );

  const transMatch = body.match(/## Transcription[\s\S]*?(?=## |$)/);
  const transText = transMatch ? transMatch[0] : '';
  const suggestions = initialPeople
    .filter(
      (p) =>
        !people.includes(p.id) &&
        !mentioned.includes(p.id) &&
        !dismissed.includes(p.id) &&
        suggestPerson(p.name, transText)
    )
    .slice(0, 8);

  const pill = (pid: string, role: 'people' | 'mentioned') => {
    const person = initialPeople.find((p) => p.id === pid);
    const isSubject = role === 'people';
    return (
      <span
        key={pid}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
          isSubject
            ? 'bg-[#F4EFE6] border-[#800020]/20'
            : 'bg-stone-100 border-stone-300 border-dashed'
        }`}
      >
        {person?.name || pid}
        <button
          className="text-stone-400 hover:text-[#800020] transition-colors ml-0.5 text-[11px]"
          onClick={() => flip(pid, role)}
          title={
            isSubject
              ? 'Mark as mentioned — the record names them but is not about them'
              : 'Mark as subject — the record is about them'
          }
          aria-label={`Flip role of ${person?.name || pid}`}
        >
          ⇄
        </button>
        <button
          className="text-stone-400 hover:text-red-600 transition-colors ml-0.5"
          onClick={() => unlink(pid, role)}
          title={`Remove ${person?.name || pid} from this record`}
          aria-label={`Unlink ${person?.name || pid}`}
        >
          ✕
        </button>
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-stone-500 font-bold mb-1">
          About this record
        </div>
        {people.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">{people.map((pid) => pill(pid, 'people'))}</div>
        ) : (
          <p className="text-xs text-stone-600">Nobody linked yet — use the dropdown below for the subject.</p>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide text-stone-500 font-bold mb-1">
          Mentioned in it
        </div>
        {mentioned.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">{mentioned.map((pid) => pill(pid, 'mentioned'))}</div>
        ) : (
          <p className="text-[10px] text-stone-500">Nobody marked as mentioned.</p>
        )}
      </div>

      {suggestions.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-stone-500 font-bold mb-1">
            Suggested from the transcription
          </div>
          <div className="text-[10px] text-stone-500 mb-1.5">
            Full name appears in the text — adds as <em>mentioned</em>. Check the image first.
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                  onClick={() =>
                    save(people, [...mentioned, p.id], `Marked ${p.name} as mentioned`)
                  }
                >
                  Mention {p.name}
                </Button>
                <button
                  className="text-[11px] text-stone-400 hover:text-stone-600 underline"
                  onClick={() => dismissSuggestion(p.id)}
                  title={`Hide this suggestion (you can still link ${p.name} via the dropdowns below)`}
                >
                  hide
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wide text-stone-500 font-bold mb-1">
            Link subject
          </div>
          <select
            className="text-xs rounded border border-stone-300 bg-white px-2 py-1.5 font-sans w-full min-h-[36px]"
            defaultValue=""
            onChange={(e) => {
              const pid = e.target.value;
              if (!pid) return;
              const person = initialPeople.find((pp) => pp.id === pid);
              save([...people, pid], mentioned, `Linked ${person?.name || pid} as subject`);
            }}
          >
            <option value="">+ Link someone this record is about…</option>
            {initialPeople
              .filter((p) => !people.includes(p.id) && !mentioned.includes(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
          </select>
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wide text-stone-500 font-bold mb-1">
            Mark as mentioned
          </div>
          <select
            className="text-xs rounded border border-stone-300 bg-white px-2 py-1.5 font-sans w-full min-h-[36px]"
            defaultValue=""
            onChange={(e) => {
              const pid = e.target.value;
              if (!pid) return;
              const person = initialPeople.find((pp) => pp.id === pid);
              save(people, [...mentioned, pid], `Marked ${person?.name || pid} as mentioned`);
            }}
          >
            <option value="">+ Mark someone named in it…</option>
            {initialPeople
              .filter((p) => !people.includes(p.id) && !mentioned.includes(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
}
