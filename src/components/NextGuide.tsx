import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, FastForward, ExternalLink, Copy } from 'lucide-react';
import { initialPeople } from '@/data/familyData';
import { getNextTask, getProgress, type RecordStepInfo } from '../../scripts/next-task';
import { callApi } from './next-guide-api';
import { getAllRecords, type WorkflowStep } from '@/lib/record-loader';

function stepToFrontMatterField(step: string): string {
  const map: Record<string, string> = {
    filed: 'filed',
    transcribed: 'transcribed',
    verified: 'verified',
    in_app: 'in_app',
    on_familysearch: 'on_familysearch',
  };
  return map[step] || step;
}

const STEP_COLORS: Record<string, string> = {
  filed: 'bg-stone-100 text-stone-600',
  transcribed: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  in_app: 'bg-blue-100 text-blue-700',
  on_familysearch: 'bg-purple-100 text-purple-700',
};

const STEP_LABELS: Record<string, string> = {
  filed: 'Filed',
  transcribed: 'Transcribed',
  verified: 'Verified',
  in_app: 'In App',
  on_familysearch: 'FamilySearch',
};

export function NextGuide() {
  const navigate = useNavigate();
  const people = initialPeople;
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string | null>(null);
  const [recordSteps, setRecordSteps] = useState<Map<string, RecordStepInfo>>(new Map());
  const [recordsLoaded, setRecordsLoaded] = useState(false);

  useEffect(() => {
    if (status && status.startsWith('Saved:')) {
      const t = setTimeout(() => window.location.reload(), 1500);
      return () => clearTimeout(t);
    }
  }, [status]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const records = await getAllRecords();
        if (cancelled) return;
        const steps = new Map<string, RecordStepInfo>();
        for (const rec of records) {
          steps.set(rec.id, { step: rec.step, stepNumber: rec.stepNumber });
        }
        setRecordSteps(steps);
        setRecordsLoaded(true);
      } catch (e) {
        setRecordsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!recordsLoaded) {
    return (
      <Card className="border-stone-200 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center mb-2">
            <div className="w-3 h-3 rounded-full bg-stone-400 animate-pulse" />
          </div>
          <p className="text-xs text-stone-500">Loading records…</p>
        </div>
      </Card>
    );
  }

  const task = getNextTask(people, recordSteps);

  if (!task) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-600">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-800">All tasks complete</h3>
            <p className="text-xs text-emerald-600">Gregorio Emmi — no pending tasks.</p>
          </div>
        </div>
      </Card>
    );
  }

  const progress = getProgress(people, task.personId, recordSteps);
  const recordId = task.recordId ?? '';
  const attoDisplay = recordId
    ? recordId.split('_').pop()?.replace(/([a-zA-Z])(\d+)/, '$1 $2') ?? ''
    : '';
  const isVerifyTask = task.type === 'record_check' && task.step === 'verified';
  const isInAppTask = task.step === 'in_app';
  const isFamilySearchTask = task.step === 'on_familysearch';
  const fmField = stepToFrontMatterField(task.step);
  const [currentStep, totalSteps] = progress.split(' of ').map(Number);

  return (
    <Card className="border-[#800020]/30 bg-white rounded-xl shadow-sm border-2 border-[#800020]/20">
      {/* Header */}
      <div className="bg-[#FAF6F0] rounded-t-xl p-4 border-b border-[#800020]/20 flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#800020] text-white shrink-0">
          <span className="text-xs font-bold">{currentStep}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-xs font-bold text-[#800020] uppercase tracking-wider leading-none">
            Next task
          </h2>
          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-0.5">
            <span>{task.personName}</span>
            <span className="w-px h-3 bg-stone-300 mx-0.5" />
            <span className="font-bold text-[#800020]">{progress}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Step badge + description */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${STEP_COLORS[task.step] ?? 'bg-stone-100 text-stone-600'} text-xs font-bold`}>
              {STEP_LABELS[task.step] ?? task.step}
            </Badge>
            {task.recordId && (
              <span className="text-[10px] text-stone-400 font-mono">{recordId}</span>
            )}
          </div>

          <div className="prose prose-sm text-stone-700 max-w-none">
            {isVerifyTask
              ? `Check ${task.personName}'s ${task.eventType ?? 'record'} record (${
                  attoDisplay ?? 'record'
                }) against the image`
              : isInAppTask
                ? `Apply ${recordId} to the people it names (OpenCode step)`
                : isFamilySearchTask
                  ? `Attach ${recordId} on FamilySearch`
                  : task.note}
          </div>
        </div>

        {/* In-app task: OpenCode instructions */}
        {isInAppTask && recordId && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
              Apply this record to familyData.ts
            </h4>
            <p className="text-xs text-amber-700 mb-2">
              Ask OpenCode to apply this record's facts to the people it names in{' '}
              <code className="bg-white px-1">src/data/familyData.ts</code>, then click{' '}
              <b>Done</b> below to set <code>in_app=true</code>.
            </p>
            <div className="bg-white border border-stone-200 rounded p-2 text-[10px] text-stone-600 font-mono break-all overflow-x-auto">
              OpenCode: Apply the facts in records/{recordId}/record.md (transcribed,
              verified) to the matching people in src/data/familyData.ts. Link each
              fact to recordId {recordId}. Add any new research leads as lifeEvents
              or research leads. Report back when done.
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-xs h-7 px-2"
              onClick={() => {
                const cmd = `Apply records/${recordId}/record.md facts to src/data/familyData.ts, link facts to recordId ${recordId}, add research leads, report when done.`;
                navigator.clipboard.writeText(cmd);
              }}
            >
              <Copy className="w-3 h-3 mr-1" /> Copy command
            </Button>
          </div>
        )}

        {/* FamilySearch task */}
        {isFamilySearchTask && recordId && (
          <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">
              FamilySearch
            </h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2"
                onClick={() => {
                  navigator.clipboard.writeText(recordId);
                }}
              >
                <Copy className="w-3 h-3 mr-1" /> Copy source title
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2"
                onClick={() => {
                  navigator.clipboard.writeText(`Transcription of ${recordId}`);
                }}
              >
                <Copy className="w-3 h-3 mr-1" /> Copy transcription
              </Button>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Link this record to the person on FamilySearch. When done, click{' '}
              <b>Done – added to FamilySearch</b>.
            </p>
          </div>
        )}

        {/* Status message */}
        {status && (
          <div className="mt-2 p-2 rounded bg-stone-50 text-[10px] text-stone-600 border border-stone-200">
            {status}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {isVerifyTask ? (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 px-3 border-[#800020] text-[#800020] font-semibold"
              onClick={() => {
                navigate(`/records/${recordId}?mode=check`);
              }}
            >
              <FastForward className="w-3 h-3 mr-1" /> Open check
            </Button>
          ) : isInAppTask || isFamilySearchTask ? (
            <Button
              size="sm"
              variant="default"
              className="text-xs h-8 px-4 font-semibold bg-[#800020] text-white hover:bg-[#600018] shadow-sm"
              disabled={!recordId}
              onClick={async () => {
                if (!recordId) return;
                setStatus('Saving...');
                try {
                  await callApi(recordId, 'front-matter', `${fmField}=true`);
                  setStatus(`Saved: ${fmField}=true`);
                } catch (e: any) {
                  setStatus(`Error: ${e.message}`);
                }
              }}
            >
              <Check className="w-3 h-3 mr-1" />
              {isFamilySearchTask ? 'Done – added to FamilySearch' : 'Done'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              className="text-xs h-8 px-4 font-semibold bg-[#800020] text-white hover:bg-[#600018] shadow-sm"
              disabled={!recordId}
              onClick={async () => {
                if (!recordId) return;
                setStatus('Saving...');
                try {
                  await callApi(recordId, 'front-matter', `${fmField}=true`);
                  setStatus(`Saved: ${fmField}=true`);
                } catch (e: any) {
                  setStatus(`Error: ${e.message}`);
                }
              }}
            >
              <Check className="w-3 h-3 mr-1" /> Done
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 px-3 text-stone-600 border-stone-300 hover:bg-stone-50"
            disabled={!recordId}
            onClick={async () => {
              if (!recordId) return;
              setStatus('Saving...');
              try {
                await callApi(
                  recordId,
                  'discrepancies',
                  'User flagged an issue via Next Guide "Something\'s wrong" button.'
                );
                setStatus('Saved: discrepancy added');
              } catch (e: any) {
                setStatus(`Error: ${e.message}`);
              }
            }}
          >
            <AlertTriangle className="w-3 h-3 mr-1" /> Something's wrong
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-8 px-3 text-stone-500 hover:bg-stone-50"
            disabled={!recordId}
            onClick={async () => {
              if (!recordId) return;
              setStatus('Saving...');
              try {
                await callApi(
                  recordId,
                  'discrepancies',
                  'Task skipped via Next Guide "Skip for now" button.'
                );
                setSkippedIds((prev) => new Set([...prev, task.eventType ?? '']));
                setStatus('Saved: skipped');
              } catch (e: any) {
                setStatus(`Error: ${e.message}`);
              }
            }}
          >
            <FastForward className="w-3 h-3 mr-1" /> Skip for now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
