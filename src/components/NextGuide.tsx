import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, AlertTriangle, FastForward } from 'lucide-react';
import { initialPeople } from '@/data/familyData';
import { getNextTask, getProgress } from '../../scripts/next-task';
import { callApi } from './next-guide-api';

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
  const isVerifyTask = task.type === 'record_check' && task.step === 'verified';
  const attoDisplay = recordId
    ? recordId.split('_').pop()?.replace(/([a-zA-Z])(\d+)/, '$1 $2') ?? ''
    : '';

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
          <div className="flex items-start gap-2">
            <div className="w-1 h-4 bg-[#800020] rounded-full shrink-0 mt-0.5" />
            <div className="text-sm text-stone-700 leading-relaxed">
              {isVerifyTask
                ? `Check ${task.personName}'s ${task.eventType ?? 'record'} record (${
                    attoDisplay ?? 'record'
                  }) against the image`
                : task.note}
              {task.recordId && (
                <span className="ml-1 text-[10px] text-stone-400 font-mono">({task.recordId})</span>
              )}
            </div>
          </div>
          {status && (
            <p className="text-[10px] text-stone-500">{status}</p>
          )}
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
            ) : (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs h-8 px-3"
                  disabled={!recordId}
                  onClick={async () => {
                    if (!recordId) return;
                    setStatus('Saving...');
                    try {
                      await callApi(recordId, 'front-matter', 'in_app=true');
                      setStatus('Saved: in_app=true');
                    } catch (e: any) {
                      setStatus(`Error: ${e.message}`);
                    }
                  }}
                >
                  <Check className="w-3 h-3 mr-1" /> Done
                </Button>
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
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
