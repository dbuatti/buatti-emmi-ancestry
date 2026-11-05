import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  parseTranscriptionLines,
  parseDiscrepancies,
} from '@/lib/record-lines';
import { callApi } from './next-guide-api';

interface RecordCheckProps {
  recordId: string;
  frontMatter: any;
  body: string;
  onVerified: () => void;
}

interface LineState {
  checked: boolean;
  correctedValue: string | null; // null means no correction
  isWrong: boolean;
}

export function RecordCheck({
  recordId,
  body,
  onVerified,
}: RecordCheckProps) {
  const lines = parseTranscriptionLines(body);
  const discrepancies = parseDiscrepancies(body);
  const [lineStates, setLineStates] = useState<Map<string, LineState>>(
    new Map(lines.map((l) => [l.id, { checked: false, correctedValue: null, isWrong: false }]))
  );
  const [status, setStatus] = useState<string | null>(null);

  const allLinesResolved =
    lines.length > 0 &&
    Array.from(lineStates.values()).every((s) => s.checked || s.isWrong);

  const resolvedCount = Array.from(lineStates.values()).filter(
    (s) => s.checked || s.isWrong
  ).length;

  const handleToggleCheck = (id: string) => {
    setLineStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (!cur) return next;
      if (cur.isWrong) {
        next.set(id, { ...cur, isWrong: false, checked: false });
      } else {
        next.set(id, { ...cur, checked: !cur.checked });
      }
      return next;
    });
  };

  const handleMarkWrong = (id: string) => {
    setLineStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (!cur) return next;
      next.set(id, {
        ...cur,
        isWrong: !cur.isWrong,
        correctedValue: null,
        checked: false,
      });
      return next;
    });
  };

  const handleCorrectionChange = (id: string, value: string) => {
    setLineStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (!cur) return next;
      next.set(id, {
        ...cur,
        correctedValue: value.trim() ? value : null,
      });
      return next;
    });
  };

  const handleVerify = async () => {
    if (!allLinesResolved) return;
    setStatus('Verifying...');
    try {
      // Set verified=true via API
      await callApi(recordId, 'front-matter', 'verified=true');

      // For each corrected line, note the original reading + the correction
      for (const line of lines) {
        const st = lineStates.get(line.id);
        if (st?.correctedValue && st.correctedValue !== line.value) {
          await callApi(
            recordId,
            'discrepancies',
            `Line "${line.label}": AI read "${line.value}", corrected to "${st.correctedValue}".`
          );
        }
      }

      onVerified();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <Card className="border-[#800020] bg-[#FAF6F0]">
      <CardHeader className="bg-[#FAF6F0]/50 pb-2">
        <CardTitle className="text-sm font-bold text-[#800020] uppercase tracking-wider">
          Check mode — verify transcription against image
        </CardTitle>
        <p className="text-xs text-stone-600 mt-1">
          Tick each line that matches the image. Mark{' '}
          <span className="font-bold">Line is wrong</span> to correct a value.
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Existing discrepancies */}
        {discrepancies.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="bg-amber-50/50 pb-1">
              <CardTitle className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Existing discrepancies
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ul className="text-xs text-amber-700 list-disc list-inside space-y-1">
                {discrepancies.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Lines */}
        <div className="space-y-2">
          {lines.map((line) => {
            const st = lineStates.get(line.id);
            const isChecked = st?.checked || false;
            const isWrong = st?.isWrong || false;
            const corrected = st?.correctedValue;

            return (
              <div
                key={line.id}
                className={`bg-white p-3 rounded border ${
                  isWrong
                    ? 'border-amber-300'
                    : isChecked
                      ? 'border-emerald-300'
                      : 'border-stone-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleCheck(line.id)}
                    className="mt-1 w-4 h-4 shrink-0 accent-[#800020] rounded"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-sm text-stone-800 leading-snug break-words">
                      <span className="font-semibold text-stone-500 mr-1">
                        {line.label}:
                      </span>
                      <span className={isChecked ? '' : 'font-medium'}>
                        {line.value || '—'}
                      </span>
                      {line.uncertain && (
                        <span className="ml-1 text-[10px] text-amber-600 uppercase">
                          [?]
                        </span>
                      )}
                    </div>
                    {line.enValue !== undefined && (
                      <div className="text-xs text-stone-500 italic break-words">
                        {line.enValue}
                        <span className="ml-1 not-italic text-[9px] text-stone-400 uppercase">
                          (AI)
                        </span>
                      </div>
                    )}
                    {isWrong && (
                      <div className="pt-1 space-y-1">
                        <Input
                          value={corrected ?? ''}
                          onChange={(e) =>
                            handleCorrectionChange(line.id, e.target.value)
                          }
                          placeholder="Correct value as written in the image"
                          className="text-sm h-8 bg-white"
                        />
                        <p className="text-[10px] text-amber-700">
                          Saved as a discrepancy; original AI reading is kept.
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={isWrong ? 'default' : 'ghost'}
                    className={`h-7 px-2 text-[10px] shrink-0 ${
                      isWrong ? 'bg-amber-600 hover:bg-amber-700' : 'text-stone-500'
                    }`}
                    onClick={() => handleMarkWrong(line.id)}
                  >
                    {isWrong ? 'Undo' : 'Line is wrong'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {lines.length === 0 && (
          <p className="text-xs text-stone-500">
            No line items found. Transcriptions must be saved one line at a time
            (<span className="font-mono">- Label: text</span>), not as
            paragraphs.
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-200">
          <span className="text-[11px] text-stone-500">
            {lines.length} lines ·{' '}
            <span
              className={`font-bold ${
                allLinesResolved ? 'text-emerald-600' : 'text-stone-600'
              }`}
            >
              {resolvedCount} resolved
            </span>
          </span>
          <Button
            size="sm"
            variant="default"
            className="text-xs h-8 px-4"
            disabled={!allLinesResolved}
            onClick={handleVerify}
          >
            Verified
          </Button>
        </div>
        {status && <p className="text-[10px] text-stone-500">{status}</p>}
      </CardContent>
    </Card>
  );
}
