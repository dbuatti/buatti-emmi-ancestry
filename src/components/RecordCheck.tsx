import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  parseTranscriptionLines,
  parseDiscrepancies,
} from '@/lib/record-lines';
import { callApi } from './next-guide-api';
import { Check, AlertTriangle, CheckCircle2, Circle, RotateCcw } from 'lucide-react';

interface RecordCheckProps {
  recordId: string;
  frontMatter: Record<string, unknown>;
  body: string;
  onVerified: () => void;
}

interface LineState {
  checked: boolean;
  correctedValue: string | null;
  isWrong: boolean;
}

type SavedState = {
  lines: [string, LineState][];
  verifiedAt?: string;
};

export function RecordCheck({
  recordId,
  frontMatter,
  body,
  onVerified,
}: RecordCheckProps) {
  const lines = parseTranscriptionLines(body);
  const discrepancies = parseDiscrepancies(body);
  const storageKey = `record-check-${recordId}`;

  const blankStates = useCallback(
    (): Map<string, LineState> =>
      new Map(lines.map((l) => [l.id, { checked: false, correctedValue: null, isWrong: false }])),
    [lines]
  );

  const loadSaved = useCallback((): SavedState => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as SavedState;
        if (Array.isArray(parsed?.lines)) return parsed;
      }
    } catch {
      /* ignore parse errors */
    }
    return { lines: [] };
  }, [storageKey]);

  const [savedState, setSavedState] = useState<SavedState>(loadSaved);
  const [lineStates, setLineStates] = useState<Map<string, LineState>>(() => {
    const saved = loadSaved();
    const merged = blankStates();
    for (const [id, st] of saved.lines) {
      if (merged.has(id)) merged.set(id, st);
    }
    return merged;
  });
  const [status, setStatus] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isVerified = frontMatter.verified === true;
  const wasVerifiedLocally = Boolean(savedState.verifiedAt);

  // Persist line states to localStorage so corrections survive page reloads.
  // NOTE: we deliberately do NOT clear this on verify — the resolved state
  // must remain visible (and the record must not look "un-resolved" again).
  useEffect(() => {
    try {
      const next: SavedState = {
        lines: [...lineStates.entries()],
        verifiedAt: savedState.verifiedAt,
      };
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSavedState(next);
    } catch {
      /* ignore quota errors */
    }
  }, [lineStates, savedState.verifiedAt, storageKey]);

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
        next.set(id, { ...cur, isWrong: false, checked: false, correctedValue: null });
        setEditingId(null);
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
      const nowWrong = !cur.isWrong;
      next.set(id, {
        ...cur,
        isWrong: nowWrong,
        correctedValue: nowWrong ? (cur.correctedValue ?? '') : null,
        checked: false,
      });
      if (nowWrong) setEditingId(id);
      else setEditingId(null);
      return next;
    });
  };

  const handleCorrectionChange = (id: string, value: string) => {
    setLineStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (!cur) return next;
      next.set(id, { ...cur, correctedValue: value });
      return next;
    });
  };

  // Split a combined "date + place" field into two separate lines
  const handleSplit = (id: string) => {
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    const value = lineStates.get(id)?.correctedValue ?? line.value;
    const dateMatch = value.match(/^(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\s+(.+)$/);
    if (!dateMatch) {
      setStatus('Cannot split — no date + place pattern found in this value');
      return;
    }
    const [, datePart, placePart] = dateMatch;
    setLineStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (!cur) return next;
      next.set(id, { ...cur, correctedValue: datePart, isWrong: true, checked: false });
      return next;
    });
    setStatus(`Split into: "${datePart}" and "${placePart}" — add the place as a separate note or correction`);
  };

  const handleConfirmCorrection = (id: string) => {
    const st = lineStates.get(id);
    if (!st?.correctedValue?.trim()) return;
    setLineStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (!cur) return next;
      next.set(id, { ...cur, isWrong: true, correctedValue: cur.correctedValue?.trim() || null });
      return next;
    });
    setEditingId(null);
  };

  const handleVerify = async () => {
    if (!allLinesResolved) return;
    setStatus('Verifying...');
    try {
      await callApi(recordId, 'front-matter', 'verified=true');

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

      // Mark locally as verified but KEEP the resolved line states.
      setSavedState((prev) => ({ ...prev, verifiedAt: new Date().toISOString() }));
      setStatus('✅ Verified. The record is now marked as checked.');
      onVerified();
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleRecheck = async () => {
    setLineStates(blankStates());
    setSavedState({ lines: [] });
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setEditingId(null);
    setStatus('Cleared. Check each line again.');
    try {
      await callApi(recordId, 'front-matter', 'verified=false');
      onVerified();
    } catch (e: unknown) {
      setStatus(`Error clearing verified flag: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const getLineStatus = (id: string): 'unresolved' | 'checked' | 'corrected' | 'correcting' => {
    const st = lineStates.get(id);
    if (!st) return 'unresolved';
    if (st.checked) return 'checked';
    if (st.isWrong && st.correctedValue) return 'corrected';
    if (st.isWrong) return 'correcting';
    return 'unresolved';
  };

  const showVerifiedBanner = isVerified || wasVerifiedLocally;

  return (
    <Card className="border-[#800020] bg-[#FAF6F0]">
      <CardHeader className="bg-[#FAF6F0]/50 pb-2">
        <CardTitle className="text-sm font-bold text-[#800020] uppercase tracking-wider">
          Check mode — verify transcription against image
        </CardTitle>
        <p className="text-xs text-stone-600 mt-1">
          For each line: <b>✓ Correct</b> if it matches the image, or <b>✏ Wrong</b> if it's wrong.
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Verified banner */}
        {showVerifiedBanner && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-emerald-800">
                  ✅ This record is verified
                </div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  {resolvedCount} of {lines.length} lines checked
                  {savedState.verifiedAt
                    ? ` · verified ${new Date(savedState.verifiedAt).toLocaleString()}`
                    : ''}
                  . Your corrections are saved in this browser.
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-[10px] h-7 px-2 shrink-0 border-emerald-400 text-emerald-800 hover:bg-emerald-100"
              onClick={handleRecheck}
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Re-check
            </Button>
          </div>
        )}

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
            const lineStatus = getLineStatus(line.id);
            const isChecked = st?.checked || false;
            const isWrong = st?.isWrong || false;
            const corrected = st?.correctedValue;
            const isEditing = editingId === line.id;
            const isResolved = lineStatus === 'checked' || lineStatus === 'corrected';

            const borderColor =
              lineStatus === 'checked' ? 'border-emerald-400 bg-emerald-50/50' :
              lineStatus === 'corrected' ? 'border-blue-300 bg-blue-50/50' :
              lineStatus === 'correcting' ? 'border-amber-300 bg-amber-50/50' :
              'border-stone-200 bg-white';

            return (
              <div
                key={line.id}
                className={`p-3 rounded border transition-colors ${borderColor}`}
              >
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <div className="mt-1 shrink-0">
                    {lineStatus === 'checked' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : lineStatus === 'corrected' ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    ) : lineStatus === 'correcting' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-300" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-sm text-stone-800 leading-snug break-words">
                      <span className="font-semibold text-stone-500 mr-1">
                        {line.label}:
                      </span>
                      <span className={isChecked ? 'text-emerald-700' : isWrong ? 'text-amber-700 line-through' : ''}>
                        {line.value || '—'}
                      </span>
                    </div>
                    {line.enValue !== undefined && (
                      <div className="text-xs text-stone-500 italic break-words">
                        {line.enValue}
                        <span className="ml-1 not-italic text-[9px] text-stone-400 uppercase">
                          (AI)
                        </span>
                      </div>
                    )}

                    {/* Correction input — shown when marking wrong */}
                    {isWrong && (
                      <div className="pt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={corrected ?? ''}
                            onChange={(e) => handleCorrectionChange(line.id, e.target.value)}
                            placeholder="Type the correct value as written in the image"
                            className="text-sm h-8 bg-white flex-1"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700"
                            disabled={!corrected?.trim()}
                            onClick={() => handleConfirmCorrection(line.id)}
                          >
                            <Check className="w-3 h-3 mr-1" /> Confirm
                          </Button>
                        </div>
                        <p className="text-[10px] text-blue-700">
                          Type the correct reading, then click Confirm. The original AI reading is kept as a discrepancy.
                        </p>
                      </div>
                    )}

                    {/* Resolved chip */}
                    {isResolved && (
                      <div
                        className={`text-xs font-medium flex items-center gap-1 ${
                          lineStatus === 'checked' ? 'text-emerald-700' : 'text-blue-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {lineStatus === 'checked'
                          ? '✓ Confirmed — matches the image'
                          : `✓ Corrected to: "${corrected}"`}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {isResolved ? (
                      <>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 h-8 rounded-md text-xs font-semibold ${
                            lineStatus === 'checked'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <Check className="w-3 h-3" /> {lineStatus === 'checked' ? 'Confirmed' : 'Corrected'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] text-stone-500"
                          onClick={() => handleToggleCheck(line.id)}
                          title="Undo and check this line again"
                        >
                          Undo
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleToggleCheck(line.id)}
                        >
                          <Circle className="w-3 h-3 mr-1" /> ✓ Correct
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] text-stone-500"
                          onClick={() => handleMarkWrong(line.id)}
                        >
                          ✏ Wrong
                        </Button>
                      </>
                    )}
                    {/* Split button — shown when value has date + place pattern */}
                    {!isWrong && !isResolved && /\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\s+[A-Za-z]/.test(line.value) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[10px] text-blue-600"
                        onClick={() => handleSplit(line.id)}
                        title="Split into separate date and place fields"
                      >
                        ✂ Split
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {lines.length === 0 && (
          <p className="text-xs text-stone-500">
            No line items found. Transcriptions must be saved one line at a time
            (<span className="font-mono">- Label: text</span>), not as paragraphs.
          </p>
        )}

        {/* Progress + Verify */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-500">
              {lines.length} lines ·{' '}
              <span
                className={`font-bold ${allLinesResolved ? 'text-emerald-600' : 'text-stone-600'}`}
              >
                {resolvedCount} resolved
              </span>
              {allLinesResolved && ' ✓'}
            </span>
            {!allLinesResolved && (
              <span className="text-[10px] text-amber-600">
                ({lines.length - resolvedCount} remaining)
              </span>
            )}
          </div>
          {!showVerifiedBanner && (
            <Button
              size="sm"
              variant="default"
              className={`text-xs h-8 px-4 ${allLinesResolved ? 'bg-[#800020] text-white' : 'bg-stone-300 text-stone-500 cursor-not-allowed'}`}
              disabled={!allLinesResolved}
              onClick={handleVerify}
            >
              {allLinesResolved ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Verified — mark record as checked</>
              ) : (
                'Resolve all lines first'
              )}
            </Button>
          )}
        </div>
        {status && <p className="text-[10px] text-stone-500">{status}</p>}
      </CardContent>
    </Card>
  );
}
