import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, AlertTriangle, FastForward, ExternalLink, Copy } from 'lucide-react';
import { initialPeople } from '@/data/familyData';
import { getNextTask, getProgress } from '../../scripts/next-task';
import { callApi } from './next-guide-api';

/**
 * Map a WorkflowStep to its front-matter boolean field name.
 */
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

export function NextGuide() {
  const navigate = useNavigate();
  const people = initialPeople;
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string | null>(null);

  const task = getNextTask(people);

  if (!task) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader className="bg-emerald-50/50">
          <CardTitle className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <Check className="w-3 h-3" /> All tasks complete
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <p className="text-xs text-emerald-700">No pending tasks for Gregorio Emmi.</p>
        </CardContent>
      </Card>
    );
  }

  const progress = getProgress(people, task.personId);
  const recordId = task.recordId ?? '';
  const attoDisplay = recordId
    ? recordId.split('_').pop()?.replace(/([a-zA-Z])(\d+)/, '$1 $2') ?? ''
    : '';
  const isVerifyTask = task.type === 'record_check' && task.step === 'verified';
  const isInAppTask = task.step === 'in_app';
  const isFamilySearchTask = task.step === 'on_familysearch';
  const fmField = stepToFrontMatterField(task.step);

  // Auto-advance: if status shows a save just completed, reload to get next task
  useEffect(() => {
    if (status && status.startsWith('Saved:')) {
      // Small delay so user can read the status, then reload
      const t = setTimeout(() => window.location.reload(), 1500);
      return () => clearTimeout(t);
    }
  }, [status]);

  return (
    <Card className="border-[#800020] bg-[#FAF6F0]">
      <CardHeader className="bg-[#FAF6F0]/50 pb-1">
        <CardTitle className="text-xs font-bold text-[#800020] uppercase tracking-wider flex items-center gap-1 mb-1">
          Next task
        </CardTitle>
        <div className="flex items-center gap-2 text-[10px] text-stone-500">
          <span>{task.personName}</span>
          <span>/</span>
          <span className="font-bold text-[#800020]">{progress}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Task description */}
          <div className="flex items-start gap-2">
            <div className="w-1 h-4 bg-[#800020] rounded-full shrink-0 mt-0.5" />
            <div className="text-sm text-stone-700 leading-relaxed">
              {isVerifyTask
                ? `Check ${task.personName}'s ${task.eventType ?? 'record'} record (${
                    attoDisplay ?? 'record'
                  }) against the image`
                : isInAppTask
                  ? `Apply ${recordId} to the people it names (OpenCode step)`
                  : isFamilySearchTask
                    ? `Attach ${recordId} on FamilySearch`
                    : task.note}
              {task.recordId && (
                <span className="ml-1 text-[10px] text-stone-400 font-mono">({task.recordId})</span>
              )}
            </div>
          </div>

          {/* In-app task: OpenCode instructions */}
          {isInAppTask && recordId && (
            <Card className="border-amber-200 bg-amber-50/50 mt-2">
              <CardHeader className="bg-amber-50/50 pb-1">
                <CardTitle className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Apply this record to familyData.ts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <p className="text-xs text-amber-700">
                  Ask OpenCode to apply this record's facts to the people it names
                  in <code className="bg-white px-1">src/data/familyData.ts</code>,
                  then click <b>Done</b> below to set <code>in_app=true</code>.
                </p>
                <div className="bg-white border border-stone-200 rounded p-2 text-[10px] text-stone-600 font-mono break-all">
                  OpenCode: Apply the facts in
                  {`records/${recordId}/record.md`} (transcribed, verified) to the
                  matching people in <code>src/data/familyData.ts</code>. Link each
                  fact to recordId <code>{recordId}</code>. Add any new research
                  leads as <code>lifeEvents</code> or research leads. Report back
                  when done.
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2"
                    onClick={() => {
                      const cmd = `Apply records/${recordId}/record.md facts to src/data/familyData.ts, link facts to recordId ${recordId}, add research leads, report when done.`;
                      navigator.clipboard.writeText(cmd);
                    }}
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy command
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FamilySearch task */}
          {isFamilySearchTask && recordId && (
            <Card className="border-blue-200 bg-blue-50/50 mt-2">
              <CardHeader className="bg-blue-50/50 pb-1">
                <CardTitle className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                  FamilySearch
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
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
                      navigator.clipboard.writeText(
                        `Transcription of ${recordId}`
                      );
                    }}
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy transcription
                  </Button>
                </div>
                <p className="text-xs text-blue-700">
                  Link this record to the person on FamilySearch. When done, click
                  <b>Done – added to FamilySearch</b>.
                </p>
              </CardContent>
            </Card>
          )}

          {status && (
            <p className="text-[10px] text-stone-500">{status}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {isVerifyTask ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 px-3 border-[#800020] text-[#800020]"
                onClick={() => {
                  navigate(`/records/${recordId}?mode=check`);
                }}
              >
                <FastForward className="w-3 h-3 mr-1" /> Open check
              </Button>
            ) : isInAppTask ? (
              <Button
                size="sm"
                variant="default"
                className="text-xs h-8 px-3 border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:text-emerald-900"
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
            ) : isFamilySearchTask ? (
              <Button
                size="sm"
                variant="default"
                className="text-xs h-8 px-3 border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:text-emerald-900"
                disabled={!recordId}
                onClick={async () => {
                  if (!recordId) return;
                  setStatus('Saving...');
                  try {
                    await callApi(recordId, 'front-matter', `${fmField}=true`);
                    setStatus('Saved: on_familysearch=true');
                  } catch (e: any) {
                    setStatus(`Error: ${e.message}`);
                  }
                }}
              >
                <Check className="w-3 h-3 mr-1" /> Done – added to FamilySearch
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                className="text-xs h-8 px-3"
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
              className="text-xs h-8 px-3 text-stone-600 border-stone-300"
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
              className="text-xs h-8 px-3"
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
                  setSkippedIds((prev) =>
                    new Set([...prev, task.eventType ?? ''])
                  );
                  setStatus('Saved: skipped');
                } catch (e: any) {
                  setStatus(`Error: ${e.message}`);
                }
              }}
            >
              <FastForward className="w-3 h-3 mr-1" /> Skip for now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
