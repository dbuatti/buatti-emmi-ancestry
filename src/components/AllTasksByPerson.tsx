import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, CheckCircle2, ChevronDown, ChevronRight, User, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { initialPeople } from '@/data/familyData';
import {
  getAllTasksForPerson,
  type NextTask,
} from '../../scripts/next-task';
import eventRequests from '@/data/event-requests.json';
import fsChecks from '@/data/fs-checks.json';
import personSkips from '@/data/person-skips.json';
import { getAllRecords } from '@/lib/record-loader';
import type { RecordStepInfo } from '../../scripts/next-task';

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

export function AllTasksByPerson() {
  const navigate = useNavigate();
  const [recordSteps, setRecordSteps] = useState<Map<string, RecordStepInfo>>(new Map());
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const peopleWithTasks = useMemo(() => {
    if (!recordsLoaded) return [];
    const result: { person: typeof initialPeople[0]; tasks: NextTask[] }[] = [];
    for (const person of initialPeople) {
      const tasks = getAllTasksForPerson(
        person,
        recordSteps,
        eventRequests as unknown as Parameters<typeof getAllTasksForPerson>[2],
        new Date(),
        fsChecks as unknown as Parameters<typeof getAllTasksForPerson>[4],
        personSkips as unknown as Parameters<typeof getAllTasksForPerson>[5]
      );
      if (tasks.length > 0) {
        result.push({ person, tasks });
      }
    }
    // Sort by task count (most tasks first), then by name
    result.sort((a, b) => b.tasks.length - a.tasks.length || a.person.name.localeCompare(b.person.name));
    return result;
  }, [recordsLoaded, recordSteps]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return peopleWithTasks;
    const q = searchQuery.toLowerCase();
    return peopleWithTasks.filter(
      (p) =>
        p.person.name.toLowerCase().includes(q) ||
        p.tasks.some((t) => t.note.toLowerCase().includes(q) || (t.eventType ?? '').toLowerCase().includes(q))
    );
  }, [peopleWithTasks, searchQuery]);

  const totalTasks = peopleWithTasks.reduce((sum, p) => sum + p.tasks.length, 0);

  if (!recordsLoaded) {
    return <p className="text-xs text-stone-500">Loading tasks…</p>;
  }

  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
          <ListTodo className="w-5 h-5" />
          All tasks by person ({totalTasks} tasks across {peopleWithTasks.length} people)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <input
          type="text"
          placeholder="Filter by person or task…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm font-sans"
        />
        {filtered.length === 0 && (
          <p className="text-xs text-stone-500">No tasks match your filter.</p>
        )}
        {filtered.map(({ person, tasks }) => {
          const isExpanded = expandedPerson === person.id;
          return (
            <div key={person.id} className="rounded border border-stone-200 bg-white">
              <button
                className="w-full flex items-center justify-between p-3 text-left hover:bg-stone-50 transition-colors"
                onClick={() => setExpandedPerson(isExpanded ? null : person.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
                  <User className="w-4 h-4 text-[#800020]" />
                  <span className="font-medium text-stone-800 text-sm">{person.name}</span>
                  <span className="text-xs text-stone-500 capitalize">{tasks[0]?.relationship === 'self' ? 'You' : tasks[0]?.relationship}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </Badge>
              </button>

              {isExpanded && (
                <div className="border-t border-stone-100 p-3 space-y-2">
                  {tasks.map((task, idx) => {
                    const badge = TASK_BADGES[task.type] ?? { label: task.type, color: 'bg-stone-100 text-stone-600' };
                    return (
                      <div
                        key={`${task.type}-${task.eventType ?? task.recordId ?? idx}`}
                        className="rounded border border-stone-100 bg-[#FAF6F0] p-2.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[10px] ${badge.color}`}>{badge.label}</Badge>
                            {task.recordId && (
                              <span className="text-[10px] text-stone-400 font-mono">{task.recordId}</span>
                            )}
                            {task.eventType && (
                              <span className="text-[10px] text-stone-500 capitalize">{task.eventType}</span>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            {task.recordId && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] h-6 px-2"
                                onClick={() => navigate(`/research/records/${task.recordId}`)}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" /> Record
                              </Button>
                            )}
                            {task.type === 'record_check' && task.recordId && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] h-6 px-2 border-[#800020] text-[#800020]"
                                onClick={() => navigate(`/records/${task.recordId}?mode=check`)}
                              >
                                Check image
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-stone-700">{task.note}</p>
                        {task.whereItIs && (
                          <p className="text-[10px] text-stone-500">{task.whereItIs}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default AllTasksByPerson;
