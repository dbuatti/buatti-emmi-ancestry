import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, CheckCircle2, Clock, FileText, ExternalLink, Copy, Send, Inbox, Link2, FastForward, AlertTriangle, FileSearch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { initialPeople } from '@/data/familyData';
import {
  getAllTasksForPerson,
  toIsoDate,
  placeFromOffice,
  EVENT_LABELS,
  type NextTask,
} from '../../scripts/next-task';
import eventRequests from '@/data/event-requests.json';
import fsChecks from '@/data/fs-checks.json';
import personSkips from '@/data/person-skips.json';
import { getAllRecords } from '@/lib/record-loader';
import type { RecordStepInfo } from '../../scripts/next-task';

interface PersonTaskListProps {
  personId: string;
  onTaskClick?: (task: NextTask) => void;
}

const TASK_BADGES: Record<string, { label: string; color: string }> = {
  get_document: { label: 'Get the document', color: 'bg-amber-100 text-amber-700' },
  chase_request: { label: 'Chase', color: 'bg-orange-100 text-orange-700' },
  process_inbox: { label: 'Process inbox', color: 'bg-emerald-100 text-emerald-700' },
  missing_event: { label: 'Search', color: 'bg-stone-100 text-stone-600' },
  record_check: { label: 'Verify', color: 'bg-blue-100 text-blue-700' },
  record_app: { label: 'Link facts', color: 'bg-blue-100 text-blue-700' },
  record_fs: { label: 'FamilySearch', color: 'bg-purple-100 text-purple-700' },
  fs_person_check: { label: 'FS check', color: 'bg-purple-100 text-purple-700' },
};

export function PersonTaskList({ personId, onTaskClick }: PersonTaskListProps) {
  const navigate = useNavigate();
  const person = initialPeople.find((p) => p.id === personId);
  const [recordSteps, setRecordSteps] = useState<Map<string, RecordStepInfo>>(new Map());
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

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
      } catch {
        setRecordsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!person) {
    return <p className="text-xs text-stone-500">Person not found.</p>;
  }

  if (!recordsLoaded) {
    return <p className="text-xs text-stone-500">Loading tasks…</p>;
  }

  const tasks = getAllTasksForPerson(
    person,
    recordSteps,
    eventRequests as unknown as Parameters<typeof getAllTasksForPerson>[2],
    new Date(),
    fsChecks as unknown as Parameters<typeof getAllTasksForPerson>[4],
    personSkips as unknown as Parameters<typeof getAllTasksForPerson>[5]
  );

  if (tasks.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-emerald-800">All tasks complete</h3>
            <p className="text-xs text-emerald-600">No pending tasks for {person.name}.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
          <ListTodo className="w-5 h-5" />
          Tasks for {person.name} ({tasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {tasks.map((task, idx) => {
          const badge = TASK_BADGES[task.type] ?? { label: task.type, color: 'bg-stone-100 text-stone-600' };
          const isExpanded = expanded === `${personId}-${idx}`;
          return (
            <div
              key={`${task.type}-${task.eventType ?? task.recordId ?? idx}`}
              className="rounded border border-stone-200 bg-white p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] ${badge.color}`}>{badge.label}</Badge>
                    {task.recordId && (
                      <span className="text-[10px] text-stone-400 font-mono">{task.recordId}</span>
                    )}
                    {task.eventType && (
                      <span className="text-[10px] text-stone-500 capitalize">{task.eventType}</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-700 mt-1">{task.note}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2 shrink-0"
                  onClick={() => {
                    setExpanded(isExpanded ? null : `${personId}-${idx}`);
                    onTaskClick?.(task);
                  }}
                >
                  {isExpanded ? 'Collapse' : 'Details'}
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-stone-100 space-y-2">
                  {task.whereItIs && (
                    <div className="text-xs text-stone-600">
                      <span className="font-medium">Where it is:</span> {task.whereItIs}
                    </div>
                  )}
                  {task.office && (
                    <div className="text-xs text-stone-600">
                      <span className="font-medium">Office:</span> {task.office}
                    </div>
                  )}
                  {task.requestedOn && (
                    <div className="text-xs text-stone-600">
                      <span className="font-medium">Requested:</span> {task.requestedOn}
                      {task.daysWaiting ? ` (${task.daysWaiting} days ago)` : ''}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task.recordId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={() => navigate(`/research/records/${task.recordId}`)}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> Open record
                      </Button>
                    )}
                    {task.type === 'record_check' && task.recordId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2 border-[#800020] text-[#800020]"
                        onClick={() => navigate(`/records/${task.recordId}?mode=check`)}
                      >
                        <FileText className="w-3 h-3 mr-1" /> Check against image
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default PersonTaskList;
