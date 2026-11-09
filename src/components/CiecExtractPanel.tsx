import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { crossCheck, parseCiecExtract, toRecordMarkdown, type CiecField } from '@/lib/ocr/ciec-extract';

/**
 * Structured reader for Italian comune "estratti" on the multilingual
 * Vienna-Convention forms (Formula A/B/C). Paste the OCR output, and —
 * if the PDF has selectable text — the copied text as a second reading.
 * Where the two agree, confidence goes up; where they disagree, both are
 * shown and nothing is resolved silently.
 */
export function CiecExtractPanel() {
  const [ocr, setOcr] = useState('');
  const [second, setSecond] = useState('');

  const result = useMemo(() => {
    if (!ocr.trim()) return null;
    const a = parseCiecExtract(ocr);
    if (!second.trim()) return a;
    return crossCheck(a, parseCiecExtract(second));
  }, [ocr, second]);

  const markdown = result?.isCiecForm ? toRecordMarkdown(result) : '';

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

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
      <div>
        <h2 className="text-sm font-bold text-stone-800">Comune extract reader (Formula A/B/C)</h2>
        <p className="text-xs text-stone-500">
          For modern multilingual certificates from a comune. Paste the OCR text. If you can select text in the PDF,
          paste that too — two readings catch mistakes like 31 vs 311.
        </p>
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
          <Button size="sm" onClick={copy}>Copy record.md transcription</Button>
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
