import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sprout, Copy, UserPlus, Link2, AlertTriangle } from 'lucide-react';
import { initialPeople } from '@/data/familyDataWrapper';
import type { Person } from '@/types';
import { parseTranscriptionLines } from '@/lib/record-lines';
import { buildHints, linkInstruction, type TreeHint } from '@/lib/tree-hints';
import { saveTreeOverride } from '@/lib/tree-overrides';

/**
 * Step-4 proposals: what the transcription implies for the tree.
 * Nothing is applied silently — new pages are created in-app (sidecar),
 * links/facts go through a copied instruction for OpenCode in chat.
 */
export function TreeHintsPanel({
  recordId,
  subjects,
  body,
  transcribed,
  setStatus,
}: {
  recordId: string;
  subjects: string[];
  body: string;
  transcribed: boolean;
  setStatus: (s: string | null) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);
  const storageKey = `tree-hints-dismissed-${recordId}`;
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as string[];
    } catch {
      return [];
    }
  });

  const lines = parseTranscriptionLines(body).map((l) => ({ label: l.label, value: l.value }));
  const allHints = buildHints(recordId, subjects, lines, initialPeople);
  const hints = allHints.filter((h) => !dismissed.includes(h.key));
  const dismissedCount = allHints.length - hints.length;

  const dismiss = (key: string) => {
    const next = [...dismissed, key];
    setDismissed(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setStatus('Copy failed');
    }
  };

  const createPerson = (h: TreeHint) => {
    const subject = initialPeople.find((p) => p.id === h.subjectId);
    const stub: Person = {
      id: h.suggestedId,
      name: h.name,
      generation: (subject?.generation ?? 1) + (h.role === 'spouse' ? 0 : -1),
      line: subject?.line ?? 'Other',
      gender: h.suggestedGender,
      birthDate: undefined,
      birthPlace: undefined,
      deathDate: undefined,
      deathPlace: undefined,
      spouses: [],
      parents: [],
      children: [],
      notes: [`Proposed from record ${h.recordId} (“${h.lineLabel}: ${h.lineValue}”) — verify before linking.`],
      records: [],
      researchStatus: { status: 'Outstanding', details: '' },
    };
    setCreating(h.key);
    saveTreeOverride({ op: 'addPerson', person: stub }, (msg) => {
      if (msg === 'Save successful') {
        // Chain the follow-up: page exists after reload, linking goes via chat.
        const followUp = linkInstruction(h, h.suggestedId);
        copy(h.key, followUp).then(() => {
          setStatus(`Page created for ${h.name} — link instruction copied, paste it to OpenCode.`);
          setTimeout(() => window.location.reload(), 1500);
        });
      } else {
        setStatus(msg);
      }
      setCreating(null);
    });
  };

  const visible = showDismissed ? allHints : hints;
  if (!transcribed || subjects.length === 0) return null;
  if (allHints.length === 0) {
    return (
      <p className="text-[11px] font-sans text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
        ✓ Everyone named in this record is already connected — nothing to propose.
      </p>
    );
  }

  const roleWord = (h: TreeHint) => (h.role === 'father' ? 'father' : h.role === 'mother' ? 'mother' : 'spouse');

  return (
    <Card className="border-emerald-300 bg-emerald-50/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
          <Sprout className="w-4 h-4" /> Tree hints ({hints.length})
        </CardTitle>
        <p className="text-[11px] text-emerald-800 font-sans">
          What this record implies for the tree. Nothing is applied without your say-so.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {visible.map((h) => (
          <div key={h.key} className="rounded-lg border border-emerald-200 bg-white p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm text-stone-800">
                {h.kind === 'new-person' ? (
                  <>
                    New person: <span className="font-bold">{h.name}</span>{' '}
                    <span className="text-stone-500">({roleWord(h)} of {h.subjectName})</span>
                  </>
                ) : (
                  <>
                    Link <span className="font-bold">{h.options.length === 1 ? (initialPeople.find((p) => p.id === h.options[0])?.name ?? h.name) : h.name}</span>{' '}
                    <span className="text-stone-500">as {roleWord(h)} of {h.subjectName}</span>
                  </>
                )}
              </div>
              <button
                className="text-[10px] font-sans text-stone-400 underline hover:text-stone-600 shrink-0"
                onClick={() => dismiss(h.key)}
              >
                dismiss
              </button>
            </div>
            <p className="text-[11px] text-stone-600 font-sans">
              From “{h.lineLabel}: {h.lineValue.length > 120 ? h.lineValue.slice(0, 120) + '…' : h.lineValue}”
              {h.surnameInferred ? ' (surname inferred — check it)' : ''} — {h.reason}
            </p>
            {h.conflictsWith && (
              <p className="text-[11px] font-sans text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Differs from the linked{' '}
                {roleWord(h)} ({initialPeople.find((p) => p.id === h.conflictsWith)?.name ?? h.conflictsWith}).
              </p>
            )}
            {h.kind === 'new-person' && h.options.length > 0 && (
              <p className="text-[11px] font-sans text-stone-600">
                Possible match already on file:{' '}
                {h.options.map((id) => initialPeople.find((p) => p.id === id)?.name ?? id).join(', ')} — create
                only if none of these is the right person.
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-0.5">
              {h.kind === 'new-person' && (
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs min-h-[36px] bg-emerald-700 text-white hover:bg-emerald-800"
                  disabled={creating === h.key}
                  onClick={() => createPerson(h)}
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  {creating === h.key ? 'Creating…' : `Create ${h.name}'s page`}
                </Button>
              )}
              {(h.kind !== 'new-person' || h.options.length > 0) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs min-h-[36px]"
                  onClick={() => copy(h.key, linkInstruction(h))}
                >
                  <Copy className="w-3 h-3 mr-1" /> {copied === h.key ? 'Copied ✓' : 'Copy apply instruction'}
                </Button>
              )}
              {h.kind === 'new-person' && h.options.length === 0 && (
                <span className="text-[10px] font-sans text-stone-400 self-center inline-flex items-center gap-1">
                  <Link2 className="w-3 h-3" /> linking follows via the copied instruction after creating
                </span>
              )}
            </div>
          </div>
        ))}
        {dismissedCount > 0 && (
          <button
            className="text-[11px] font-sans text-stone-400 underline"
            onClick={() => setShowDismissed((v) => !v)}
          >
            {showDismissed ? 'Hide dismissed' : `Show ${dismissedCount} dismissed`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
