import { useState } from 'react';
import { FileText, Scan, CheckCircle2, AlertTriangle, Loader2, Save, ClipboardPaste } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface OcrLine {
  id: string;
  number: number;
  text: string;
  label: string | null;
  value: string;
}

interface OcrQuality {
  lineCount: number;
  totalChars: number;
  avgLineLength: number;
  hasLabels: number;
  confidence: string;
}

interface TranscriptionPanelProps {
  recordId: string;
  onTranscribed?: (lines: { label: string; value: string }[]) => void;
}

export function TranscriptionPanel({ recordId, onTranscribed }: TranscriptionPanelProps) {
  const { toast } = useToast();
  const [ocrText, setOcrText] = useState<string>('');
  const [ocrLines, setOcrLines] = useState<OcrLine[]>([]);
  const [ocrQuality, setOcrQuality] = useState<OcrQuality | null>(null);
  const [ocrFile, setOcrFile] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [validateResult, setValidateResult] = useState<{
    fields?: { field: string; value: string; confidence: string; note?: string }[];
    summary?: { totalFields: number; goodFields: number; fairFields: number; lowFields: number; score: number; assessment: string };
  } | null>(null);
  const [validating, setValidating] = useState(false);

  const runOcr = async () => {
    setRunning(true);
    try {
      const res = await fetch(`/api/correspondence/ocr/${recordId}`, { method: 'POST' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'OCR failed');
      setOcrText(data.text || '');
      setOcrLines(data.lines || []);
      setOcrQuality(data.quality || null);
      setOcrFile(data.file || '');
      toast({ title: 'OCR complete', description: `${data.lines?.length ?? 0} lines extracted` });
    } catch (e: unknown) {
      toast({ title: 'OCR failed', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  const handleLineChange = (id: string, value: string) => {
    setOcrLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, value } : l))
    );
  };

  const handleLabelChange = (id: string, label: string) => {
    setOcrLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, label } : l))
    );
  };

  const saveTranscription = async () => {
    setSaving(true);
    try {
      // Build transcription text from lines
      const transcription = ocrLines
        .map((l) => (l.label ? `${l.label}: ${l.value}` : l.value))
        .join('\n');
      // Copy to clipboard for now (full save would need API endpoint)
      await navigator.clipboard.writeText(transcription);
      toast({ title: 'Transcription copied', description: 'Paste into record.md or use the check mode to verify.' });
      onTranscribed?.(ocrLines.map((l) => ({ label: l.label || '', value: l.value })));
    } catch (e: unknown) {
      toast({ title: 'Save failed', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const validatePasted = async () => {
    if (!pastedText.trim()) return;
    setValidating(true);
    try {
      const res = await fetch('/api/correspondence/ocr-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pastedText }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Validation failed');
      setValidateResult(data);
      toast({ title: 'Validation complete', description: `Score: ${data.summary?.score ?? 0}%` });
    } catch (e: unknown) {
      toast({ title: 'Validation failed', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
          <Scan className="w-5 h-5" />
          In-app Transcription (OCR)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* OCR section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">OCR Extraction</div>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={runOcr} disabled={running}>
              {running ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Scan className="w-3 h-3 mr-1" />}
              {running ? 'Running OCR…' : 'Run OCR on image'}
            </Button>
          </div>
          {ocrFile && (
            <p className="text-[10px] text-stone-400 font-sans">Source file: {ocrFile}</p>
          )}
          {ocrQuality && (
            <div className="flex flex-wrap gap-2 text-[10px] text-stone-500 font-sans">
              <span>Lines: {ocrQuality.lineCount}</span>
              <span>Chars: {ocrQuality.totalChars}</span>
              <span>Avg line: {ocrQuality.avgLineLength}</span>
              <span>Labels: {ocrQuality.hasLabels}</span>
              <Badge
                className={`text-[10px] ${
                  ocrQuality.confidence === 'good'
                    ? 'bg-emerald-100 text-emerald-800'
                    : ocrQuality.confidence === 'fair'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {ocrQuality.confidence}
              </Badge>
            </div>
          )}
          {ocrLines.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] text-stone-500 font-sans">
                Edit lines below, then save. Tick ✓ to confirm, or mark wrong to correct.
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1.5 border border-stone-200 rounded p-2 bg-white">
                {ocrLines.map((line) => (
                  <div key={line.id} className="flex items-start gap-2 text-xs">
                    <span className="text-stone-400 w-6 shrink-0 pt-1.5">{line.number}.</span>
                    <Input
                      className="text-xs h-7 w-24 shrink-0"
                      value={line.label || ''}
                      onChange={(e) => handleLabelChange(line.id, e.target.value)}
                      placeholder="Label"
                    />
                    <Input
                      className="text-xs h-7 flex-1"
                      value={line.value}
                      onChange={(e) => handleLineChange(line.id, e.target.value)}
                      placeholder="Value"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button size="sm" variant="outline" className="text-xs" onClick={saveTranscription} disabled={saving}>
                  {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                  {saving ? 'Saving…' : 'Copy transcription'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Text quality checker (paste-and-validate) */}
        <div className="space-y-2 border-t border-stone-200 pt-4">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
            <ClipboardPaste className="w-4 h-4" /> Text Quality Checker
          </div>
          <p className="text-[10px] text-stone-500 font-sans">
            Paste text selected from the image preview. The app will parse and score each field.
          </p>
          <Textarea
            className="text-xs min-h-[80px] bg-white"
            placeholder="Paste selected text here…"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="text-xs" onClick={validatePasted} disabled={validating || !pastedText.trim()}>
              {validating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              {validating ? 'Validating…' : 'Validate'}
            </Button>
          </div>
          {validateResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-xs ${
                    validateResult.summary?.assessment === 'good'
                      ? 'bg-emerald-100 text-emerald-800'
                      : validateResult.summary?.assessment === 'fair'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  Score: {validateResult.summary?.score ?? 0}% ({validateResult.summary?.assessment ?? 'unknown'})
                </Badge>
                <span className="text-[10px] text-stone-500 font-sans">
                  {validateResult.summary?.goodFields ?? 0} good · {validateResult.summary?.fairFields ?? 0} fair · {validateResult.summary?.lowFields ?? 0} low
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-stone-200 rounded p-2 bg-white">
                {validateResult.fields?.map((f, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Badge
                      className={`text-[9px] shrink-0 ${
                        f.confidence === 'good'
                          ? 'bg-emerald-100 text-emerald-800'
                          : f.confidence === 'fair'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {f.confidence}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-stone-700">{f.field}:</span>{' '}
                      <span className="text-stone-600">{f.value}</span>
                      {f.note && <span className="text-[10px] text-stone-400 ml-1">({f.note})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TranscriptionPanel;
