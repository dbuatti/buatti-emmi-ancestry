import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, AlertTriangle, FastForward, ExternalLink, Copy } from 'lucide-react';
import { initialPeople } from '@/data/familyData';
import { getNextTask, getProgress, type RecordStepInfo } from '../../scripts/next-task';
import { callApi, callApiOpenInFinder } from './next-guide-api';
import { getAllRecords, type WorkflowStep } from '@/lib/record-loader';

// Parse record data
interface FamilySearchData {
  eventDate: string;
  sourceTitle: string;
  sourceType: string;
  citation: string;
  notes: {
    english: string;
    italian: string;
  };
  reason: string;
  vitalTags: string[];
  addToSourceBox: string;
}

function parseFamilySearchData(recordId: string): FamilySearchData | null {
  try {
    const fs = require('fs');
    const path = require('path');
    const recordPath = path.join(__dirname, '../../records', recordId, 'record.md');
    const content = fs.readFileSync(recordPath, 'utf8');

    // Extract FamilySearch section
    const fsMatch = content.match(/## FamilySearch\n\n((?:###.*?\n)+)/);
    if (!fsMatch) return null;

    const fsContent = fsMatch[1];

    // Parse sections
    const sections: Record<string, string> = {};
    let currentSection = '';
    
    const lines = fsContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('### ')) {
        currentSection = line.replace('### ', '').toLowerCase().replace(/\s+/g, '_');
      } else if (currentSection && line.trim() && !line.startsWith('###')) {
        sections[currentSection] = (sections[currentSection] || '') + line + '\n';
      }
    }

    return {
      eventDate: sections['event_date']?.trim() || '',
      sourceTitle: sections['source_title']?.trim() || '',
      sourceType: sections['source_type']?.trim() || '',
      citation: sections['citation']?.trim() || '',
      notes: {
        english: (sections['notes_english']?.trim() || ''),
        italian: (sections['notes_italian']?.trim() || '')
      },
      reason: sections['reason_to_attach_source']?.trim() || '',
      vitalTags: sections['vital_tags']?.trim().split('\n').map(line => line.trim()) || [],
      addToSourceBox: sections['add_source_to_my_source_box']?.trim() || ''
    };
  } catch (error) {
    return null;
  }
}

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
  const [fsIdInput, setFsIdInput] = useState<string>('');
  const [familySearchData, setFamilySearchData] = useState<FamilySearchData | null>(null);

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
          
          // Parse FamilySearch data for this record
          const fsData = parseFamilySearchData(rec.id);
          if (fsData && !familySearchData) {
            setFamilySearchData(fsData);
          }
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

  const currentPerson = people.find((p) => p.id === task.personId);
  const existingFsId = currentPerson?.familySearchId;

  return (
    <Card className="border-[#800020]/30 bg-white rounded-xl shadow-sm border-2 border-[#800020]/20">
      {/* Header */}
      <div className="bg-[#FAF6F0] rounded-t-xl p-4 border-b border-[#800020]/20 flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#800020] text-white shrink-0">
          <span className="text-xs font-bold">{task.stepNumber}</span>
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
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${STEP_COLORS[task.step] ?? 'bg-stone-100 text-stone-600'} text-xs font-bold`}>
              {STEP_LABELS[task.step] ?? task.step}
            </Badge>
            {task.recordId && (
              <span className="text-[10px] text-stone-400 font-mono">{task.recordId}</span>
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

        {isFamilySearchTask && familySearchData && (
          <div className="mt-4 rounded-lg bg-purple-50 border border-purple-200 p-4">
            <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider mb-3">
              FamilySearch Add Source Form
            </h3>

            {/* Event Date */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-stone-700 w-32">1. Event Date</div>
                <div className="text-xs text-stone-600 flex-1 font-mono bg-white p-2 rounded border border-stone-200">
                  {familySearchData.eventDate}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                  onClick={() => navigator.clipboard.writeText(familySearchData.eventDate)}
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
              </div>
            </div>

            {/* Source Title */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-stone-700 w-32">2. Source Title</div>
                <div className="text-xs text-stone-600 flex-1 font-mono bg-white p-2 rounded border border-stone-200 break-all">
                  {familySearchData.sourceTitle}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                  onClick={() => navigator.clipboard.writeText(familySearchData.sourceTitle)}
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
              </div>
            </div>

            {/* Source Type */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-stone-700 w-32">3. Source Type</div>
                <div className="text-xs text-stone-600 flex-1">
                  {familySearchData.sourceType.includes('Add a Memory') ? (
                    <span className="inline-flex items-center gap-1">
                      Add a Memory → Upload Memory
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-6 px-1 ml-2"
                        onClick={() => navigator.clipboard.writeText('Add a Memory → Upload Memory')}
                      >
                        <Copy className="w-2 h-2 mr-1" /> Copy
                      </Button>
                    </span>
                  ) : (
                    <span className="text-stone-500">Web Page URL (not available)</span>
                  )}
                </div>
                {familySearchData.sourceType.includes('Add a Memory') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2"
                    onClick={() => {
                      navigator.clipboard.writeText('Add a Memory → Upload Memory');
                      callApiOpenInFinder(recordId);
                    }}
                  >
                    Show in Finder
                  </Button>
                )}
              </div>
            </div>

            {/* Open Source PDF in Finder / Copy file path */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-stone-700 w-32">3b. Open Source PDF</div>
                <div className="text-xs text-stone-600 flex-1">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2"
                      onClick={() => callApiOpenInFinder(recordId)}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> Show in Finder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2"
                      onClick={() => {
                        const filePath = `/Users/danielebuatti/Downloads/FAMILY TREE/${recordId}/${recordId}.pdf`;
                        navigator.clipboard.writeText(filePath);
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy file path
                    </Button>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">
                    Access the record's PDF file in Finder or copy its path
                  </div>
                </div>
              </div>
            </div>

            {/* Citation */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-stone-700 w-32">4. Citation</div>
                <div className="text-xs text-stone-600 flex-1 font-mono bg-white p-2 rounded border border-stone-200 break-all">
                  {familySearchData.citation}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                  onClick={() => navigator.clipboard.writeText(familySearchData.citation)}
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-stone-700 w-32">5. Notes</div>
                <div className="text-xs text-stone-600 flex-1 space-y-2">
                  <div>
                    <div className="font-semibold text-stone-700 text-[10px] mb-1">English</div>
                    <div className="font-mono bg-white p-2 rounded border border-stone-200 text-[10px] break-all">
                      {familySearchData.notes.english}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-stone-700 text-[10px] mb-1">Italian</div>
                    <div className="font-mono bg-white p-2 rounded border border-stone-200 text-[10px] break-all">
                      {familySearchData.notes.italian}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2"
                    onClick={() => navigator.clipboard.writeText(familySearchData.notes.english)}
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy English
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2"
                    onClick={() => navigator.clipboard.writeText(familySearchData.notes.italian)}
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy Italian
                  </Button>
                </div>
              </div>
            </div>

            {/* Reason to Attach Source */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-stone-700 w-32">6. Reason to Attach Source</div>
                <div className="text-xs text-stone-600 flex-1 font-mono bg-white p-2 rounded border border-stone-200 break-all">
                  {familySearchData.reason}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                  onClick={() => navigator.clipboard.writeText(familySearchData.reason)}
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
              </div>
            </div>

            {/* Vital Tags */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-stone-700 w-32">7. Vital Tags</div>
                <div className="text-xs text-stone-600 flex-1">
                  <div className="flex flex-wrap gap-1">
                    {familySearchData.vitalTags.map((tag, index) => (
                      tag && (
                        <span key={index} className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded text-[10px] font-mono">
                          {tag.trim()}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Add to Source Box */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-stone-700 w-32">8. Add Source to My Source Box</div>
                <div className="text-xs text-stone-600 flex-1">
                  {familySearchData.addToSourceBox.includes('Yes') ? (
                    <span className="text-emerald-700 font-semibold">Yes</span>
                  ) : (
                    <span className="text-stone-500">No</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {status && (
          <div className="mt-2 p-2 rounded bg-stone-50 text-[10px] text-stone-600 border border-stone-200">
            {status}
          </div>
        )}

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