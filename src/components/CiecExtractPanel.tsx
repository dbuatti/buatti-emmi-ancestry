import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { crossCheck, parseCiecExtract, toRecordMarkdown, type CiecField } from '@/lib/ocr/ciec-extract';
import { initialPeople } from '@/data/familyDataWrapper';

/**
 * Structured reader for Italian comune "estratti" on the multilingual
 * Vienna-Convention forms (Formula A/B/C). Paste the OCR output, and —
 * if the PDF has selectable text — the copied text as a second reading.
 * Where the two agree, confidence goes up; where they disagree, both are
 * shown and nothing is resolved silently.
 */
export function CiecExtractPanel({ recordId, people }: { recordId?: string; people?: string[] } = {}) {
  const [ocr, setOcr] = useState('');
  const [second, setSecond] = useState('');
  const [manualTranslation, setManualTranslation] = useState('');
  const [formHint, setFormHint] = useState<'auto' | 'birth' | 'marriage' | 'death'>('auto');

  const result = useMemo(() => {
    if (!ocr.trim()) return null;
    const a = parseCiecExtract(ocr, formHint);
    if (!second.trim()) return a;
    return crossCheck(a, parseCiecExtract(second, formHint));
  }, [ocr, second, formHint]);

  // Person matching: find the person in the family tree whose name matches
  // the extracted surname + given names.
  const personMatch = useMemo(() => {
    if (!result?.isCiecForm) return null;
    const surnameField = result.fields.find((f) => f.key === 'surname');
    const givenField = result.fields.find((f) => f.key === 'givenNames');
    if (!surnameField || !givenField) return null;

    const surname = surnameField.value.toUpperCase().trim();
    const given = givenField.value.toUpperCase().trim();
    if (!surname || !given) return null;

    // Normalize: remove accents, extra spaces
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    const normSurname = normalize(surname);
    const normGiven = normalize(given);

    // Score each person by name similarity, with context awareness
    const scored = initialPeople.map((p) => {
      const pName = normalize(p.name.toUpperCase());
      const pParts = pName.split(' ');
      // Check if surname and given name appear in the person's name
      const surnameMatch = pParts.some((part) => part === normSurname || part.includes(normSurname) || normSurname.includes(part));
      const givenMatch = pParts.some((part) => part === normGiven || part.includes(normGiven) || normGiven.includes(part));
      let score = 0;
      if (surnameMatch) score += 50;
      if (givenMatch) score += 50;
      // Bonus for exact full name match
      if (pName === `${normSurname} ${normGiven}` || pName === `${normGiven} ${normSurname}`) score = 100;

      // Context bonus: if the extracted name appears in a "Padre" or "Madre" context
      // in the OCR text, prefer people who are already parents of the main person
      const bodyLower = ocr.toLowerCase();
      const isFatherContext = bodyLower.includes('padre') && bodyLower.includes(normSurname.toLowerCase()) && bodyLower.includes(normGiven.toLowerCase());
      const isMotherContext = bodyLower.includes('madre') && bodyLower.includes(normSurname.toLowerCase()) && bodyLower.includes(normGiven.toLowerCase());

      // If this person is already a known parent (from familyData), boost their score
      // by checking if any person in the tree has them as a parent
      const isKnownParent = initialPeople.some((other) =>
        other.parents?.includes(p.id) && other.name.toLowerCase().includes(normGiven.toLowerCase())
      );
      if (isKnownParent) score += 30;

      // Penalize "senior" or "older" variants when there's a non-senior match
      // (the senior is usually a grandparent, not a parent)
      if (p.name.toLowerCase().includes('senior') || p.name.toLowerCase().includes('older')) {
        score -= 15;
      }

      return { person: p, score, surnameMatch, givenMatch, isKnownParent };
    });

    const best = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score)[0];
    if (!best) return null;

    // Also check parents
    const fatherField = result.fields.find((f) => f.key === 'father');
    const motherField = result.fields.find((f) => f.key === 'mother');
    const parentMatches: string[] = [];
    if (fatherField && best.person.parents?.length) {
      const fatherName = fatherField.value.toUpperCase();
      for (const pid of best.person.parents) {
        const parent = initialPeople.find((p) => p.id === pid);
        if (parent && fatherName.includes(parent.name.split(' ').pop()?.toUpperCase() || '')) {
          parentMatches.push(parent.name);
        }
      }
    }

    return {
      person: best.person,
      score: best.score,
      surnameMatch: best.surnameMatch,
      givenMatch: best.givenMatch,
      isKnownParent: best.isKnownParent,
      parentMatches,
      fatherExtracted: fatherField?.value || null,
      motherExtracted: motherField?.value || null,
    };
  }, [result, ocr]);

  const rawMarkdown = result?.isCiecForm ? toRecordMarkdown(result) : '';
  const markdown = manualTranslation.trim()
    ? rawMarkdown.replace('[translation needed]', manualTranslation.trim())
    : rawMarkdown;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success('Transcription block copied — paste it into record.md');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = markdown;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast.success('Transcription block copied');
    }
  };

  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!recordId || !markdown) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/save-transcription/${recordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: markdown, setTranscribed: true }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Save failed');
      toast.success('Transcription saved to record.md — step 2 marked done');
      window.location.reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
      <div>
        <h2 className="text-sm font-bold text-stone-800">Comune extract reader (Formula A/B/C)</h2>
        <p className="text-xs text-stone-500">
          For modern multilingual certificates from a comune. Paste the OCR text. If you can select text in the PDF,
          paste that too — two readings catch mistakes like 31 vs 311.
        </p>
        <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
          <b>Multi-page PDFs:</b> If the PDF contains multiple records (e.g., birth on page 1, marriage on page 2),
          run the panel <b>once per record</b>. For the first record, paste the full OCR text and select "Birth".
          For the second record, paste just that page's text and select "Marriage". Each record gets its own transcription.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-stone-600 font-semibold">Form type:</label>
        <select
          className="text-xs rounded border border-stone-300 bg-white px-2 py-1 font-sans"
          value={formHint}
          onChange={(e) => setFormHint(e.target.value as 'auto' | 'birth' | 'marriage' | 'death')}
        >
          <option value="auto">Auto-detect</option>
          <option value="birth">Birth (Formula A)</option>
          <option value="marriage">Marriage (Formula B)</option>
          <option value="death">Death (Formula C)</option>
        </select>
        <span className="text-[10px] text-stone-400">
          Select the form type if auto-detect picks the wrong one. For multi-page PDFs, run once per page.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs text-stone-600 space-y-1">
          <span className="font-semibold">Reading 1 — OCR output</span>
          <Textarea value={ocr} onChange={(e) => setOcr(e.target.value)} rows={6} className="font-mono text-xs" />
        </label>
        <label className="text-xs text-stone-600 space-y-1">
          <span className="font-semibold">Reading 2 — text copied from the PDF (optional)</span>
          <Textarea value={second} onChange={(e) => setSecond(e.target.value)} rows={6} className="font-mono text-xs" />
        </label>
      </div>

      {result && !result.isCiecForm && (
        <p className="text-xs text-amber-700">
          This doesn't look like a multilingual comune extract (no "ATTO DI NASCITA/MATRIMONIO/MORTE" + "STATO CIVILE").
          Handwritten registers and parish books need a line-by-line transcription instead.
        </p>
      )}

      {result?.isCiecForm && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline">{result.form}</Badge>
            <Badge variant={result.score >= 85 ? 'secondary' : 'outline'}>Fields score {result.score}%</Badge>
            <span className="text-stone-500">{result.boilerplateLines} printed form lines ignored</span>
          </div>
          <table className="w-full text-xs">
            <tbody>
              {result.fields.map((f) => <FieldRow key={f.key} f={f} />)}
            </tbody>
          </table>
          {/* Person match — who is this document about? */}
          {personMatch && (
            <div className={`rounded border p-3 space-y-2 ${
              personMatch.score >= 80 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className={personMatch.score >= 80 ? 'text-emerald-800' : 'text-amber-800'}>
                  {personMatch.score >= 80 ? '✅ Likely person match' : '⚠ Possible person match'}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {personMatch.score}% confidence
                </Badge>
              </div>
              <div className="text-xs text-stone-700">
                <b>{personMatch.person.name}</b>
                <span className="text-stone-500 ml-1">
                  ({personMatch.person.id}, Gen {personMatch.person.generation}, {personMatch.person.line})
                </span>
              </div>
              <div className="text-[10px] text-stone-500 space-y-0.5">
                {personMatch.surnameMatch && personMatch.givenMatch && (
                  <div>✓ Surname and given name both match</div>
                )}
                {!personMatch.surnameMatch && (
                  <div>⚠ Surname "{result.fields.find((f) => f.key === 'surname')?.value}" doesn't clearly match</div>
                )}
                {!personMatch.givenMatch && (
                  <div>⚠ Given name "{result.fields.find((f) => f.key === 'givenNames')?.value}" doesn't clearly match</div>
                )}
                {personMatch.fatherExtracted && (
                  <div>
                    Father extracted: {personMatch.fatherExtracted}
                    {personMatch.parentMatches.length > 0 && (
                      <span className="text-emerald-700 ml-1">✓ matches {personMatch.parentMatches.join(', ')}</span>
                    )}
                  </div>
                )}
                {personMatch.motherExtracted && (
                  <div>Mother extracted: {personMatch.motherExtracted}</div>
                )}
                {personMatch.isKnownParent && (
                  <div className="text-emerald-700">✓ Already known as a parent in the family tree</div>
                )}
              </div>
              <div className="text-[10px] text-stone-400">
                {personMatch.score >= 80
                  ? 'High confidence — the extracted name matches a person in the family tree.'
                  : 'Low confidence — verify the name against the image before linking.'}
              </div>
              {recordId && !(people ?? []).includes(personMatch.person.id) ? (
                <div className="flex items-center gap-2 mt-1">
                  <button
                    className="text-[10px] text-[#800020] underline"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/update-record-people/${recordId}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ people: [personMatch.person.id] }),
                        });
                        const data = await res.json();
                        if (!data.ok) throw new Error(data.error || 'Failed to link person');
                        toast.success(`Linked ${personMatch.person.name} to this record`);
                        window.location.reload();
                      } catch (e: unknown) {
                        toast.error(e instanceof Error ? e.message : String(e));
                      }
                    }}
                  >
                    Link {personMatch.person.name} to this record
                  </button>
                  <span className="text-[10px] text-stone-400">
                    (links the person to this record's front matter)
                  </span>
                </div>
              ) : (
                <div className="text-[10px] text-emerald-700 mt-1">
                  ✓ {personMatch.person.name} is already linked to this record.
                </div>
              )}
            </div>
          )}
          {result.isCiecForm && !personMatch && (
            <div className="text-[10px] text-stone-500 italic">
              No matching person found in the family tree for the extracted name.
            </div>
          )}

          {result.fields.some((f) => f.key === 'annotations') && (
            <div className="space-y-1">
              <label className="text-xs text-stone-600 font-semibold">
                English translation of the annotation (optional — auto-filled if parseable):
              </label>
              <Textarea
                value={manualTranslation}
                onChange={(e) => setManualTranslation(e.target.value)}
                rows={2}
                className="text-xs"
                placeholder="e.g., Egidio Emmi married Concetta Sgroi on 04/11/1900 in the Comune of Linguaglossa. The act was transcribed in the marriage registers, year 1900, part/series [left blank], no. 59."
              />
              <p className="text-[10px] text-stone-400">
                If the auto-translation shows "[translation needed]", type the English version here. It will be used in the copied transcription.
              </p>
            </div>
          )}

          {result.problems.length > 0 && (
            <ul className="text-xs text-red-700 list-disc pl-5">
              {result.problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}
          {result.unexplainedLines.length > 0 && (
            <details className="text-xs text-stone-500">
              <summary>{result.unexplainedLines.length} lines not recognised (usually stamp/signature noise)</summary>
              <ul className="font-mono pl-4">{result.unexplainedLines.map((l, i) => <li key={i}>{l}</li>)}</ul>
            </details>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={copy}>Copy record.md transcription</Button>
            {recordId && (
              <Button size="sm" variant="default" className="bg-[#800020] text-white hover:bg-[#600018]" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save to record.md (ticks step 2 done)'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const TONE: Record<CiecField['confidence'], string> = {
  high: 'bg-green-50 text-green-800',
  medium: 'bg-amber-50 text-amber-800',
  low: 'bg-red-50 text-red-800',
};

function FieldRow({ f }: { f: CiecField }) {
  return (
    <tr className="border-t border-stone-100 align-top">
      <td className="py-1 pr-2 text-stone-500 whitespace-nowrap">{f.labelEn}</td>
      <td className="py-1 pr-2 font-mono text-stone-800 break-words">{f.value}</td>
      <td className="py-1">
        <span className={`rounded px-1.5 py-0.5 ${TONE[f.confidence]}`}>{f.confidence}</span>
        {f.note && <div className="text-stone-500 mt-0.5">{f.note}</div>}
      </td>
    </tr>
  );
}
