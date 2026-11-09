import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { detectRecords, matchRecords, type DetectedRecord } from '@/lib/ocr/detect-records';
import { getAllRecords } from '@/lib/record-loader';
import type { RecordEntry } from '@/lib/record-loader';

interface SplitDocumentPanelProps {
  recordId: string;
  onSplit?: (result: unknown) => void;
}

export function SplitDocumentPanel({ recordId, onSplit }: SplitDocumentPanelProps) {
  const [ocrText, setOcrText] = useState('');
  const [running, setRunning] = useState(false);
  const [detected, setDetected] = useState<DetectedRecord[] | null>(null);
  const [existingRecords, setExistingRecords] = useState<{ id: string; type: string; year: string; atto: string; comune: string; people: string[] }[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({}); // pageRange → targetRecordId or 'new'
  type DetailFields = { type: string; people: string; year: string; place: string; atto: string };
  const [newRecordDetails, setNewRecordDetails] = useState<Record<string, DetailFields>>({});
  const [splitting, setSplitting] = useState(false);

  // Load existing records for matching
  useEffect(() => {
    getAllRecords().then((recs) => {
      setExistingRecords(recs.map((r) => ({
        id: r.id,
        type: r.frontMatter.type || 'Unknown',
        year: r.frontMatter.year || '',
        atto: r.frontMatter.atto || '',
        comune: r.frontMatter.comune || r.frontMatter.place || '',
        people: r.frontMatter.people || [],
      })));
    }).catch(() => {});
  }, []);

  const runOcr = async () => {
    setRunning(true);
    try {
      const res = await fetch(`/api/correspondence/ocr/${recordId}`, { method: 'POST' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'OCR failed');
      setOcrText(data.text || '');
      toast.success('OCR complete', { description: `${data.quality?.pageCount ?? 1} page(s) extracted` });
    } catch (e: unknown) {
      toast.error('OCR failed', { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setRunning(false);
    }
  };

  const detect = () => {
    if (!ocrText.trim()) return;
    const records = detectRecords(ocrText);
    setDetected(records);
    // Auto-assign: match each detected record to existing records
    const matches = matchRecords(records, existingRecords);
    const newAssignments: Record<string, string> = {};
    for (const m of matches) {
      const key = m.detected.pages.join(',');
      newAssignments[key] = m.suggestedRecordId || 'new';
    }
    setAssignments(newAssignments);
  };

  const split = async () => {
    if (!detected || detected.length === 0) return;
    setSplitting(true);
    try {
      const assignmentsArray = detected.map((d) => {
        const key = d.pages.join(',');
        const target = assignments[key] || 'new';
        const isNew = target === 'new';
        const details = (newRecordDetails[key] || {}) as DetailFields;
        return {
          pages: d.pages,
          targetRecordId: isNew ? null : target,
          newRecord: isNew ? {
            type: details.type || (d.form === 'birth' ? 'birth' : d.form === 'marriage' ? 'marriage' : d.form === 'death' ? 'death' : 'birth'),
            people: details.people ? details.people.split(',').map((s) => s.trim()).filter(Boolean) : d.people,
            year: details.year || d.year || 'undated',
            place: details.place || d.comune || '',
            atto: details.atto || d.atto || '',
          } : undefined,
        };
      });
      const res = await fetch('/api/split-into-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceRecordId: recordId, assignments: assignmentsArray }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Split failed');
      toast.success('Split complete', { description: data.message || 'PDF split into separate records' });
      window.location.reload();
    } catch (e: unknown) {
      toast.error('Split failed', { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setSplitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
      <div>
        <h2 className="text-sm font-bold text-stone-800">Split document into records</h2>
        <p className="text-xs text-stone-500">
          If this PDF contains multiple records (e.g., birth on pages 1-2, marriage on pages 3-4),
          paste the OCR text below. The app will detect each record, suggest which existing record
          it belongs to, and split the PDF into separate files — one per record.
        </p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="text-xs" onClick={runOcr} disabled={running}>
          {running ? 'Running OCR…' : 'Run OCR on document'}
        </Button>
        <Button size="sm" variant="default" className="text-xs bg-[#800020] text-white" onClick={detect} disabled={!ocrText.trim()}>
          Detect records
        </Button>
      </div>

      <Textarea
        value={ocrText}
        onChange={(e) => setOcrText(e.target.value)}
        rows={6}
        className="font-mono text-xs"
        placeholder="Paste OCR text here, or click 'Run OCR on document'..."
      />

      {detected && detected.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-stone-700">
            Detected {detected.length} record(s):
          </div>
          {detected.map((d, i) => {
            const key = d.pages.join(',');
            const match = matchRecords(detected, existingRecords).find((m) => m.detected === d);
            const isNew = (assignments[key] || 'new') === 'new';
            return (
              <div key={i} className="rounded border border-stone-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-800 text-sm capitalize">{d.form} Record</span>
                    <span className="text-xs text-stone-500 ml-2">{d.pageLabel}</span>
                  </div>
                  <Badge variant={d.confidence === 'high' ? 'secondary' : 'outline'} className="text-xs">
                    {d.confidence}
                  </Badge>
                </div>
                <div className="text-xs text-stone-600 space-y-0.5">
                  {d.atto && <div>Atto: {d.atto}</div>}
                  {d.year && <div>Year: {d.year}</div>}
                  {d.comune && <div>Comune: {d.comune}</div>}
                  {d.names.length > 0 && <div>Names: {d.names.join(', ')}</div>}
                </div>
                {match && match.suggestedRecordId && (
                  <div className="text-[10px] text-emerald-700">
                    ✓ Suggested: {match.suggestedRecordId} (score: {match.score})
                    {match.reasons.length > 0 && <span className="text-stone-400 ml-1">— {match.reasons.join(', ')}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-stone-600">Target:</label>
                  <select
                    className="text-xs rounded border border-stone-300 bg-white px-2 py-1 font-sans flex-1"
                    value={assignments[key] || 'new'}
                    onChange={(e) => setAssignments((prev) => ({ ...prev, [key]: e.target.value }))}
                  >
                    <option value="new">+ Create new record</option>
                    {existingRecords.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id}
                      </option>
                    ))}
                  </select>
                </div>
                {isNew && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="text-xs rounded border border-stone-300 bg-white px-2 py-1"
                      placeholder="Type (birth/marriage/death)"
                      value={(newRecordDetails[key] as DetailFields | undefined)?.type ?? d.form}
                      onChange={(e) => setNewRecordDetails((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), type: e.target.value } as DetailFields }))}
                    />
                    <input
                      className="text-xs rounded border border-stone-300 bg-white px-2 py-1"
                      placeholder="People (comma-separated ids)"
                      value={newRecordDetails[key]?.people || d.people.join(', ')}
                      onChange={(e) => setNewRecordDetails((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), people: e.target.value } as DetailFields }))}
                    />
                    <input
                      className="text-xs rounded border border-stone-300 bg-white px-2 py-1"
                      placeholder="Year"
                      value={newRecordDetails[key]?.year || d.year || ''}
                      onChange={(e) => setNewRecordDetails((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), year: e.target.value } as DetailFields }))}
                    />
                    <input
                      className="text-xs rounded border border-stone-300 bg-white px-2 py-1"
                      placeholder="Place/Comune"
                      value={newRecordDetails[key]?.place || d.comune || ''}
                      onChange={(e) => setNewRecordDetails((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), place: e.target.value } as DetailFields }))}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <Button
            size="sm"
            variant="default"
            className="text-xs bg-[#800020] text-white hover:bg-[#600018]"
            onClick={split}
            disabled={splitting}
          >
            {splitting ? 'Splitting…' : 'Split document into records'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default SplitDocumentPanel;