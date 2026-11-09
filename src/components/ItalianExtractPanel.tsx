import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { parseItalianExtract, toItalianMarkdown, type ItalianField } from '@/lib/ocr/italian-extract';

const TONE: Record<ItalianField['confidence'], string> = {
  high: 'bg-green-50 text-green-800',
  medium: 'bg-amber-50 text-amber-800',
  low: 'bg-red-50 text-red-800',
};

export function ItalianExtractPanel({ recordId }: { recordId?: string } = {}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const result = useMemo(() => {
    if (!text.trim()) return null;
    return parseItalianExtract(text);
  }, [text]);

  const markdown = result?.isItalianExtract ? toItalianMarkdown(result) : '';

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
        <h2 className="text-sm font-bold text-stone-800">Italian extract reader (standard estratto)</h2>
        <p className="text-xs text-stone-500">
          For standard Italian extracts (estratto di atto di nascita/morte/matrimonio). Paste the OCR text or the
          text copied from the PDF. Handles "Il giorno X del mese Y dell'anno Z" dates, annotations, issue dates, etc.
        </p>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="font-mono text-xs"
        placeholder="Paste OCR text or PDF text here…"
      />

      {result && !result.isItalianExtract && (
        <p className="text-xs text-amber-700">
          This doesn't look like a standard Italian estratto. Try the "Comune extract reader" above for multilingual forms.
        </p>
      )}

      {result?.isItalianExtract && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline">{result.form}</Badge>
            <Badge variant={result.score >= 70 ? 'secondary' : 'outline'}>Fields score {result.score}%</Badge>
            <span className="text-stone-500">{result.fields.length} fields extracted</span>
          </div>
          <table className="w-full text-xs">
            <tbody>
              {result.fields.map((f) => (
                <tr key={f.key} className="border-t border-stone-100 align-top">
                  <td className="py-1 pr-2 text-stone-500 whitespace-nowrap">{f.labelEn}</td>
                  <td className="py-1 pr-2 font-mono text-stone-800 break-words">{f.value}</td>
                  <td className="py-1">
                    <span className={`rounded px-1.5 py-0.5 ${TONE[f.confidence]}`}>{f.confidence}</span>
                    {f.note && <div className="text-stone-500 mt-0.5">{f.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.problems.length > 0 && (
            <ul className="text-xs text-red-700 list-disc pl-5">
              {result.problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={copy}>Copy transcription</Button>
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

export default ItalianExtractPanel;
