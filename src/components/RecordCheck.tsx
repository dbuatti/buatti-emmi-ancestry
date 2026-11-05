import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseRecordMarkdown } from '@/lib/records';
import {
  parseTranscriptionLines,
  parseDiscrepancies,
  TranscriptionLine,
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
  frontMatter,
  body,
  onVerified,
}: RecordCheckProps) {
  const lines = parseTranscriptionLines(body);
  const discrepancies = parseDiscrepancies(body);
  const [lineStates, setLineStates] = useState<Map<string, LineState>>(
    new Map(lines.map((l) => [l.id, { checked: false, correctedValue: null, isWrong: false }]))
  );
  const [showCorrection, setShowCorrection] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string | null>(null);

  const allLinesResolved =
    lines.length > 0 &&
    Array.from(lineStates.values()).every(
      (s) => s.checked || s.isWrong
    );

  const handleToggleCheck = (id: string) => {
    setLineStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (!cur) return next;
      if (cur.isWrong) {
        // Un-check wrong
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
      next.set(id, { ...cur, isWrong: !cur.isWrong, checked: false });
      return next;
    });
  };

  const handleCorrectionChange = (id: string, value: string) => {
    setLineStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (!cur) return next;
      next.set(id, { ...cur, correctedValue: value || null });
      return next;
    });
  };

  const handleVerify = async () => {
    if (!allLinesResolved) return;
    setStatus('Verifying...');
    try {
      // Set verified=true via API
      await callApi(recordId, 'front-matter', 'verified=true');

      // For each corrected line, add discrepancy noting original + corrected
      for (const line of lines) {
        const st = lineStates.get(line.id);
        if (st?.correctedValue) {
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
      <CardHeader className="bg-[#FAF6F0]/50 pb-1">
        <CardTitle className="text-xs font-bold text-[#800020] uppercase tracking-wider">
          Check mode — verify transcription against image
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <p className="text-xs text-stone-600">
          Tick each line that matches the image. Mark <span className="font-bold">Line is wrong</span> to correct a value.
        </p>

        {/* Discrepancies */}
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
            const isCorrecting = showCorrection.has(line.id);
            return (
              <div
                key={line.id}
                className="flex items-start gap-2 bg-white p-2 rounded border border-stone-200"
              >
                <div className="mt-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={isChecked || isWrong}
                    onChange={() => handleToggleCheck(line.id)}
                    className="w-4 h-4 text-[#800020] border-stone-300 rounded"
                  />
                </div>
                <div className="flex-1 min-w-0 text-xs text-stone-700 leading-relaxed">
                  <span className="font-bold text-stone-500">{line.label}:</span>{' '}
                  <span
                    className={`break-words ${
                      line.uncertain ? 'bg-amber-100 text-amber-800 underline decoration-amber-400' : ''
                    }`}
                  >
                    {line.value}
                  </span>
                  {line.uncertain && (
                    <span className="ml-1 text-[10px] text-amber-600">[?]</span>
                  )}
                  {line.enLabel && line.enValue && (
                    <div className="mt-0.5">
                      <span className="font-bold text-[10px] text-stone-400">
                        {line.enLabel}:
                      </span>{' '}
                      <span className="text-[10px] text-stone-500 italic">
                        {line.enValue}
                      </span>
                      <span className="ml-1 text-[9px] text-stone-300 uppercase">(AI)</span>
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => {
                      setShowCorrection((prev) =>
                        prev.has(line.id)
                          ? new Set([...prev].filter((x) => x !== line.id))
                          : new Set([...prev, line.id])
                      );
                    }}
                  >
                    {isCorrecting ? 'Cancel' : 'Line is wrong'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Correction inputs */}
        {Array.from(showCorrection).map((id) => {
          const line = lines.find((l) => l.id === id);
          if (!line) return null;
          const st = lineStates.get(id);
          return (
            <div key={id} className="flex items-start gap-2 bg-white p-2 rounded border border-amber-200">
              <div className="mt-1 shrink-0">
                <input
                  type="checkbox"
                  checked={st?.isWrong || false}
                  onChange={() => handleMarkWrong(id)}
                  className="w-4 h-4 text-amber-600 border-stone-300 rounded"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Input
                  value={st?.correctedValue ?? line.value}
                  onChange={(e) => handleCorrectionChange(id, e.target.value)}
                  placeholder="Corrected value"
                  className="text-xs"
                />
                <p className="text-[10px] text-amber-600 mt-1">
                  Original was: {line.value}
                </p>
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-2 border-t border-stone-200">
          <span className="text-[10px] text-stone-500">
            {lines.length} lines ·{' '}
            <span className={`font-bold ${allLinesResolved ? 'text-emerald-600' : 'text-stone-600'}`}>
              {Array.from(lineStates.values()).filter(
                (s) => s.checked || s.isWrong
              ).length} resolved
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
