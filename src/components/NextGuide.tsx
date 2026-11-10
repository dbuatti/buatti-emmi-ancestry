import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Check,
  AlertTriangle,
  FastForward,
  ExternalLink,
  Copy,
  FileSearch,
  Send,
  Inbox,
  Link2,
  MailCheck,
  Crosshair,
  MapPin,
  ChevronDown,
  Hourglass,
} from 'lucide-react';
import { initialPeople } from '@/data/familyData';
import {
  getNextTask,
  getWaitingTasks,
  getProgress,
  eventKey,
  toIsoDate,
  placeFromOffice,
  EVENT_LABELS,
  type RecordStepInfo,
  type EventOverrides,
  type LifeEventType,
} from '../../scripts/next-task';
import eventRequests from '@/data/event-requests.json';
import fsChecks from '@/data/fs-checks.json';
import personSkips from '@/data/person-skips.json';
import {
  callApi,
  callApiOpenInFinder,
  callApiEventOverride,
  callApiCreateRecord,
  callApiOpenInbox,
  callApiPersonSkip,
} from './next-guide-api';
import { getAllRecords, parseFamilySearchSection, type FamilySearchFields } from '@/lib/record-loader';
import { extractKeyTerms, flattenTerms } from '@/lib/email-terms';

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

/** Tasks that are not a workflow step of a record. */
const TASK_BADGES: Record<string, { label: string; color: string }> = {
  get_document: { label: 'Get the document', color: 'bg-amber-100 text-amber-700' },
  chase_request: { label: 'Chase', color: 'bg-orange-100 text-orange-700' },
  process_inbox: { label: 'Process inbox', color: 'bg-emerald-100 text-emerald-700' },
  missing_event: { label: 'Search', color: 'bg-stone-100 text-stone-600' },
  unsorted_file: { label: 'Unsorted files', color: 'bg-stone-100 text-stone-600' },
};

/** DD/MM/YYYY, the format the rest of the data uses. */
function formatIso(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function NextGuide() {
  const navigate = useNavigate();
  const people = initialPeople;
  const overrides = eventRequests as EventOverrides;
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string | null>(null);
  const [officeInput, setOfficeInput] = useState<string | null>(null);
  const [recordSteps, setRecordSteps] = useState<Map<string, RecordStepInfo>>(new Map());
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [fsIdInput, setFsIdInput] = useState<string>('');
  const [recordBodies, setRecordBodies] = useState<Map<string, string>>(new Map());
  const [recordEntries, setRecordEntries] = useState<Map<string, { id: string; frontMatter: Record<string, unknown> }>>(new Map());
  const [imageLinks, setImageLinks] = useState<Map<string, string>>(new Map());
  const [copied, setCopied] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [showReceivedPanel, setShowReceivedPanel] = useState(false);
  const [sentCheck, setSentCheck] = useState<{ found: boolean; sent_at?: string; recipient?: string } | null>(null);
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceHits, setSourceHits] = useState<Array<{ id: number; subject: string; from_name: string; from_email: string; snippet: string; received_at: string; attachment_count: number; matchedTerms?: string[] }>>([]);
  const [searchedTerms, setSearchedTerms] = useState<string[]>([]);
  const [sentAuto, setSentAuto] = useState<{ found: boolean; sent_at?: string; recipient?: string; subject?: string } | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

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
        const bodies = new Map<string, string>();
        const imgLinks = new Map<string, string>();
        const entries = new Map<string, { id: string; frontMatter: Record<string, unknown> }>();
        for (const rec of records) {
          steps.set(rec.id, { step: rec.step, stepNumber: rec.stepNumber });
          bodies.set(rec.id, rec.body);
          entries.set(rec.id, { id: rec.id, frontMatter: rec.frontMatter as unknown as Record<string, unknown> });
          if (rec.frontMatter.image_link) {
            imgLinks.set(rec.id, rec.frontMatter.image_link);
          }
        }
        setRecordBodies(bodies);
        setRecordSteps(steps);
        setImageLinks(imgLinks);
        setRecordEntries(entries);
        setRecordsLoaded(true);
      } catch (e) {
        setRecordsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const task = getNextTask(people, recordSteps, overrides, new Date(), fsChecks as Record<string, { checkedOn?: string; openItems?: number; snoozedOn?: string }>, personSkips as Record<string, { skippedOn?: string }>);

  // Source-in-email lookup: break the task into key terms (act numbers, years,
  // surnames, office tokens) and search each one. A single verbatim-sentence
  // search can never match; key terms can.
  useEffect(() => {
    if (task?.type !== 'get_document' && task?.type !== 'chase_request') return;
    const terms = flattenTerms(
      extractKeyTerms([task?.whereItIs, task?.note, task?.office], task?.personName ?? '')
    );
    if (terms.length === 0) { setSourceHits([]); setSourceQuery(''); setSearchedTerms([]); return; }
    let cancelled = false;
    setSourceLoading(true);
    setSearchedTerms(terms);
    (async () => {
      try {
        const results = await Promise.all(
          terms.map((t) =>
            fetch(`/api/correspondence/source?q=${encodeURIComponent(t)}`)
              .then((r) => r.json())
              .then((d) => ({ term: t, hits: (d?.hits ?? []) as Array<{ id: number; subject: string; from_name: string; from_email: string; snippet: string; received_at: string; attachment_count: number }> }))
              .catch(() => ({ term: t, hits: [] as Array<{ id: number; subject: string; from_name: string; from_email: string; snippet: string; received_at: string; attachment_count: number }> }))
          )
        );
        if (cancelled) return;
        const merged = new Map<number, { id: number; subject: string; from_name: string; from_email: string; snippet: string; received_at: string; attachment_count: number; matchedTerms: string[] }>();
        for (const { term, hits } of results) {
          for (const h of hits) {
            const cur = merged.get(h.id);
            if (cur) {
              if (!cur.matchedTerms.includes(term)) cur.matchedTerms.push(term);
            } else {
              merged.set(h.id, { ...h, matchedTerms: [term] });
            }
          }
        }
        const sorted = [...merged.values()].sort(
          (a, b) => b.matchedTerms.length - a.matchedTerms.length
        );
        setSourceHits(sorted);
        setSourceQuery(terms.join(' · '));
      } finally {
        if (!cancelled) setSourceLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [task?.type, task?.whereItIs, task?.note, task?.office, task?.personName]);

  // Auto sent-check (display only): has anything been emailed about this
  // person + event? Runs on mount; the "Check sent mail" button re-checks
  // AND logs the result.
  useEffect(() => {
    if (task?.type !== 'get_document' && task?.type !== 'chase_request') return;
    if (!task?.personId) return;
    let cancelled = false;
    const person = initialPeople.find((pp) => pp.id === task.personId);
    const surname = (person?.name ?? task.personName ?? '').replace(/\([^)]*\)/g, ' ').trim().split(/\s+/).filter((t) => t.length > 2).pop() ?? '';
    fetch(
      `/api/correspondence/sent-request?personId=${encodeURIComponent(task.personId)}&eventType=${encodeURIComponent(task.eventType ?? 'birth')}&surname=${encodeURIComponent(surname)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.found) setSentAuto({ found: true, sent_at: d.sent_at, recipient: d.recipient, subject: d.subject });
        else setSentAuto({ found: false });
      })
      .catch(() => { if (!cancelled) setSentAuto(null); });
    return () => { cancelled = true; };
  }, [task?.type, task?.personId, task?.eventType, task?.personName]);

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

  if (!task) {
    const waiting = getWaitingTasks(initialPeople, eventRequests as EventOverrides, new Date());
    const markWaitingReceived = async (personId: string, eventType: LifeEventType) => {
      setStatus('Saving…');
      try {
        await callApiEventOverride(eventKey(personId, eventType), {
          requestedOn: null,
          receivedOn: toIsoDate(),
        });
        window.location.reload();
      } catch (e) {
        setStatus(`Error: ${(e as Error).message}`);
      }
    };
    if (waiting.length === 0) {
      return (
        <Card className="border-emerald-200 bg-emerald-50 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-600">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-800">All tasks complete</h3>
              <p className="text-xs text-emerald-600">No pending tasks.</p>
            </div>
          </div>
        </Card>
      );
    }
    return (
      <Card className="border-stone-200 bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-stone-100">
          <h2 className="text-xs font-bold text-[#800020] uppercase tracking-wider leading-none flex items-center gap-2">
            <Hourglass className="w-4 h-4" /> Waiting room
          </h2>
          <p className="text-xs text-stone-500 font-sans mt-1">
            Nothing to chase — {waiting.length} request{waiting.length === 1 ? '' : 's'} waiting for replies.
            They return on their own when due. If one arrives, log it here.
          </p>
        </div>
        <div className="p-4 space-y-2">
          {waiting.map((w) => (
            <div
              key={`${w.personId}|${w.eventType}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 px-3 py-2"
            >
              <div className="min-w-0">
                <a
                  href={`/research/people/${w.personId}`}
                  className="block text-sm font-bold text-[#800020] leading-tight hover:underline truncate"
                >
                  {w.personName}
                </a>
                <div className="text-[11px] text-stone-500 font-sans truncate">
                  {w.eventType} · {w.office ?? 'office unknown'} · requested {w.requestedOn ?? '—'}
                  {typeof w.daysWaiting === 'number' ? ` (${w.daysWaiting}d)` : ''}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 px-3 shrink-0"
                onClick={() => markWaitingReceived(w.personId, w.eventType)}
              >
                <Inbox className="w-3 h-3 mr-1" /> Received
              </Button>
            </div>
          ))}
        </div>
        {status && <div className="px-4 pb-3 text-[11px] text-stone-500 font-sans">{status}</div>}
      </Card>
    );
  }

  if (task.type === 'fs_person_check') {
    return (
      <Card className="bg-white rounded-xl shadow-sm border-2 border-[#800020]/20">
        <div className="bg-[#FAF6F0] rounded-t-xl p-4 border-b border-[#800020]/20">
          <h2 className="text-xs font-bold text-[#800020] uppercase tracking-wider">Next task</h2>
          <a href={`/research/people/${task.personId}`} className="text-[10px] text-stone-500 mt-0.5 underline">{task.personName}</a>
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-semibold text-stone-800">
            Update {task.personName}'s page on FamilySearch
          </div>
          <p className="text-sm text-stone-600">{task.note}</p>
          <ol className="list-decimal ml-5 text-sm text-stone-700 space-y-1">
            <li>Click <b>Open FamilySearch check</b>.</li>
            <li>Open the person on FamilySearch, press Cmd + A, Cmd + C, and paste the page in.</li>
            <li>Add or fix each item it lists (each has Copy buttons), then paste again until nothing is left.</li>
          </ol>
          <Button
            size="sm"
            className="text-xs bg-[#800020] text-white hover:bg-[#600018]"
            onClick={() => navigate(`/familysearch/${task.personId}`)}
          >
            Open FamilySearch check
          </Button>
        </CardContent>
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
  const isGetDocument = task.type === 'get_document';
  const isChase = task.type === 'chase_request';
  const isProcessInbox = task.type === 'process_inbox';
  const fmField = stepToFrontMatterField(task.step);
  const stepNum = task.stepNumber;
  const eventLabel = task.eventType ? EVENT_LABELS[task.eventType] : 'record';
  const overrideKey = task.eventType ? eventKey(task.personId, task.eventType) : '';
  const HOW: Record<number, { title: string; steps: string[]; command?: string }> = {
    1: {
      title: `File ${task.personName}'s ${task.eventType ?? 'document'}`,
      steps: [
        'Save the image or PDF into Downloads › FAMILY TREE › _inbox',
        'In OpenCode (coding model) type the command below',
      ],
      command: 'process inbox',
    },
    2: {
      title: `Transcribe ${task.personName}'s ${task.eventType ?? 'record'}`,
      steps: [
        'In OpenCode, switch to the VL model',
        'Click "Open record" below, then screenshot just the entry: Cmd + Shift + Ctrl + 4',
        'Paste it into OpenCode (Cmd + V) and type the command below',
        'Switch back to the coding model and type: continue',
      ],
      command: 'transcribe next',
    },
    4: {
      title: `Add this record's facts to the people it names`,
      steps: [
        'In OpenCode (coding model) type the command below',
        'Read the proposed changes, then reply: apply',
      ],
      command: `run step 4 for ${recordId}`,
    },
  };
  const how = HOW[stepNum];
  const fs: FamilySearchFields | null = recordId ? parseFamilySearchSection(recordBodies.get(recordId) ?? '') : null;
  const copy = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };
  const copyFilePath = async () => {
    try {
      const res = await fetch(`/api/record-files/${recordId}`);
      const files = await res.json();
      const f = Array.isArray(files) ? files[0] : (files.files ?? [])[0];
      if (f?.absPath) copy('path', f.absPath);
      else setStatus('Error: no file found for this record');
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  };

  const currentPerson = people.find((p) => p.id === task.personId);
  const existingFsId = currentPerson?.familySearchId;

  /** "Requested (waiting for reply)" — remembers the date + office, then skips. */
  const markRequested = async () => {
    if (!overrideKey) return;
    const today = toIsoDate();
    setStatus('Saving...');
    try {
      await callApiEventOverride(overrideKey, {
        requestedOn: today,
        requestedFrom: (officeInput ?? task.office ?? '').trim(),
        receivedOn: null,
      });
      setStatus(`Saved: Marked as requested — this card comes back as a chase in 30 days if nothing arrives.`);
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  };

  /** "Received" — stops the chase clock and shows the inbox instructions. */
  const markReceived = async () => {
    if (!overrideKey) return;
    const today = toIsoDate();
    setStatus('Saving...');
    try {
      await callApiEventOverride(overrideKey, {
        requestedOn: null,
        receivedOn: today,
      });
      setShowReceivedPanel(true);
      setStatus(`Received ${formatIso(today)} — save it to _inbox and run "process inbox".`);
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  };

  /** 4E: auto-detect sent correspondence — has Daniele already sent this request? */
  const checkSentCorrespondence = async () => {
    if (!overrideKey) return;
    setStatus('Checking sent correspondence…');
    try {
      const res = await fetch(`/api/correspondence/sent-request?personId=${encodeURIComponent(task.personId)}&eventType=${encodeURIComponent(task.eventType ?? 'birth')}`);
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || `API error: ${res.status}`);
      if (data.found) {
        const sentIso = String(data.sent_at || '').slice(0, 10);
        await callApiEventOverride(overrideKey, {
          requestedOn: sentIso || toIsoDate(),
          requestedFrom: data.recipient || (task.office ?? ''),
          receivedOn: null,
        });
        setSentCheck({ found: true, sent_at: data.sent_at, recipient: data.recipient });
        setStatus(`Detected sent correspondence — logged as requested ${sentIso || 'today'}.`);
        window.location.reload();
      } else {
        setSentCheck({ found: false });
        setStatus('No sent correspondence detected for this request yet.');
      }
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  };

  /** "Found online" — creates the record.md, then hands over to step 1. */
  const createFromLink = async () => {
    const url = linkInput.trim();
    if (!url || !overrideKey) return;
    setStatus('Creating record…');
    try {
      const { id } = await callApiCreateRecord({
        personName: task.personName,
        eventType: task.eventType ?? 'birth',
        note: task.whereItIs,
        place: placeFromOffice(task.office),
        url,
      });
      await callApiEventOverride(overrideKey, {
        recordId: id,
        requestedOn: null,
        receivedOn: null,
      });
      setStatus(`Saved: created ${id}`);
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  };

  /** Forget everything we know about this event — back to "Get the document". */
  const clearOverride = async () => {
    if (!overrideKey) return;
    setStatus('Saving...');
    try {
      await callApiEventOverride(overrideKey, null);
      setStatus('Saved: cleared');
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  };

  const openInbox = async () => {
    try {
      await callApiOpenInbox();
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  };

  const skipPerson = async () => {
    if (!task) return;
    const today = toIsoDate();
    setStatus('Saving...');
    try {
      await callApiPersonSkip(task.personId, today);
      setStatus(`Saved: skipped ${task.personName} (${today})`);
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  };

  /** Shared panel: "Where it is", straight from the lifeEvent note. */
  const whereItIsPanel = (
    <div className="pt-1">
      <p className="text-sm text-stone-700 whitespace-pre-wrap">
        {task.whereItIs || `No note is recorded for this ${eventLabel} event in familyData.ts.`}
      </p>
      <label className="flex items-center gap-2 text-xs text-stone-600 mt-3">
        <span className="shrink-0 font-semibold">Office:</span>
        <input
          className="flex-1 rounded border border-stone-300 bg-white px-2 py-1 text-sm text-stone-800"
          value={officeInput ?? task.office ?? ''}
          placeholder="e.g. Comune di Fiumefreddo di Sicilia"
          onChange={(e) => setOfficeInput(e.target.value)}
        />
      </label>
    </div>
  );

  /** Source-in-email panel: key-term hits across imported mail. */
  const sourcePanel = (
    <div className="pt-1 space-y-2">
      {searchedTerms.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] text-stone-500 font-sans py-0.5">Searched:</span>
          {searchedTerms.map((t) => (
            <span key={t} className="rounded-full bg-stone-100 border border-stone-200 px-2 py-0.5 text-[10px] font-sans text-stone-600">
              {t}
            </span>
          ))}
        </div>
      )}
      {/* Sent-mail evidence (auto-checked) */}
      {sentAuto?.found ? (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
          <span className="font-bold">Emailed about this:</span>{' '}
          {sentAuto.sent_at ? `${String(sentAuto.sent_at).slice(0, 10)}` : 'sent'}
          {sentAuto.recipient ? ` → ${sentAuto.recipient}` : ''}
          {sentAuto.subject ? <div className="mt-0.5 text-emerald-700">“{sentAuto.subject}”</div> : null}
        </div>
      ) : sentAuto && !sentAuto.found ? (
        <div className="rounded-lg bg-stone-50 border border-stone-200 px-3 py-2 text-xs text-stone-600">
          No sent email found for this person + event. If you emailed about it, it may not be imported yet.
        </div>
      ) : null}
      {sourceLoading ? (
        <div className="text-xs text-stone-600">Searching imported mail…</div>
      ) : sourceQuery && sourceHits.length > 0 ? (
        <ul className="space-y-2">
          {sourceHits.map((h) => (
            <li key={h.id} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700">
              <span className="font-semibold">{h.subject || '(no subject)'}</span>
              {h.from_name ? <span className="text-stone-500"> — from {h.from_name}</span> : null}
              <span className="text-stone-400"> · {h.received_at ? String(h.received_at).slice(0, 10) : ''}</span>
              {(h.matchedTerms ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(h.matchedTerms ?? []).map((t) => (
                    <span key={t} className="rounded-full bg-[#800020]/10 text-[#800020] px-1.5 py-px text-[10px] font-sans font-semibold">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {h.snippet ? <div className="text-stone-600 mt-1">{h.snippet}</div> : null}
              {!!h.attachment_count && (
                <div className="mt-1 inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold font-sans">
                  {h.attachment_count} attachment{h.attachment_count === 1 ? '' : 's'} — check for the record here
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : sourceQuery && sourceHits.length === 0 ? (
        <div className="text-xs text-stone-700">
          No hits across imported mail for these terms. Either nothing has arrived, or the email isn't imported yet.
        </div>
      ) : null}
    </div>
  );

  const receivedPanel = (
    <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-2">
      <div className="text-sm font-bold text-emerald-800">Document received — file it</div>
      <ol className="list-decimal ml-5 space-y-1 text-sm text-stone-700">
        <li>Save the file into Downloads › FAMILY TREE › _inbox</li>
        <li>In OpenCode (coding model), type the command below</li>
      </ol>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <code className="text-sm bg-white border border-stone-300 rounded px-2 py-1">process inbox</code>
        <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => copy('inbox-cmd', 'process inbox')}>
          <Copy className="w-3 h-3 mr-1" /> {copied === 'inbox-cmd' ? 'Copied ✓' : 'Copy command'}
        </Button>
        <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={openInbox}>
          <ExternalLink className="w-3 h-3 mr-1" /> Open _inbox
        </Button>
      </div>
      <p className="text-xs text-stone-500">
        "process inbox" files the document, creates its record.md and ticks it off this card.
      </p>
    </div>
  );

  const linkInputPanel = showLinkInput && (
    <div className="mt-3 rounded-lg bg-white border border-stone-300 p-3">
      <label className="text-xs font-semibold text-stone-700">Link to the document</label>
      <Input
        value={linkInput}
        onChange={(e) => setLinkInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') createFromLink();
        }}
        placeholder="https://www.familysearch.org/ark:/61903/…"
        className="mt-1 text-xs"
        autoFocus
      />
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          className="text-xs h-8 px-3 bg-[#800020] text-white hover:bg-[#600018]"
          disabled={!linkInput.trim()}
          onClick={createFromLink}
        >
          <Check className="w-3 h-3 mr-1" /> Create record.md
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-8 px-3 text-stone-500"
          onClick={() => setShowLinkInput(false)}
        >
          Cancel
        </Button>
      </div>
      <p className="text-[10px] text-stone-500 mt-2">
        Writes records/&lt;id&gt;/record.md with the link in <code>image_link</code> and moves this card to step 1 (filed).
      </p>
    </div>
  );

  const headline = isVerifyTask
    ? `Check ${task.personName}'s ${task.eventType ?? 'record'} record (${attoDisplay ?? 'record'}) against the image`
    : isInAppTask
      ? `Apply ${recordId} to the people it names (OpenCode step)`
      : isFamilySearchTask
        ? `Attach ${recordId} on FamilySearch`
        : isGetDocument
          ? task.note
          : isChase
            ? `Chase ${task.office ?? `the ${eventLabel} record`}?`
            : isProcessInbox
              ? 'File the document you received'
              : task.note;

  const badge = TASK_BADGES[task.type];

  return (
    <Card className="border-[#800020]/30 bg-white rounded-xl shadow-sm border-2 border-[#800020]/20">
      {/* Header */}
      <div className="bg-[#FAF6F0] rounded-t-xl p-4 border-b border-[#800020]/20 flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#800020] text-white shrink-0">
          {stepNum ? (
            <span className="text-xs font-bold">{stepNum}</span>
          ) : (
            <FileSearch className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-xs font-bold text-[#800020] uppercase tracking-wider leading-none">
            Next task
          </h2>
          <div className="mt-1">
            <div className="text-[11px] uppercase tracking-wide text-stone-500">Working on</div>
            <a
              href={`/research/people/${task.personId}`}
              className="block text-2xl font-serif font-bold text-[#800020] leading-tight hover:underline"
              title="Open this person's page"
            >
              {task.personName}
            </a>
            <div className="flex items-center gap-2 text-sm text-stone-600 mt-0.5">
              {task.relationship && <span className="capitalize">{task.relationship === 'self' ? 'You' : task.relationship}</span>}
              {task.relationship && <span className="w-px h-3 bg-stone-300" />}
              <span className="font-bold text-[#800020]">{progress} done</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Task badge + status summary */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`${
                badge?.color ?? STEP_COLORS[task.step] ?? 'bg-stone-100 text-stone-600'
              } text-xs font-bold`}
            >
              {badge?.label ?? STEP_LABELS[task.step] ?? task.step}
            </Badge>
            {task.recordId && (
              <span className="text-[10px] text-stone-400 font-mono">{task.recordId}</span>
            )}
          </div>

          {(isGetDocument || isChase) && task.requestedOn ? (
            <div className="rounded-lg bg-stone-50 border border-stone-200 px-3 py-2.5 flex items-start gap-2.5">
              <MailCheck className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <div className="text-sm text-stone-700 leading-snug">
                <span className="font-semibold">{eventLabel} requested</span>
                {task.office && (
                  <> from <span className="font-medium text-stone-900">{task.office}</span></>
                )}{' '}
                on {formatIso(task.requestedOn)}
                {typeof task.daysWaiting === 'number' && (
                  <span className={`ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    task.daysWaiting >= 30 ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {task.daysWaiting}d waiting{task.daysWaiting >= 30 ? ' — chase due' : ''}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="prose prose-sm text-stone-700 max-w-none">
              {headline}
            </div>
          )}
        </div>

        {/* Actions — one primary, rest secondary */}
        {(isGetDocument || isChase) && (
          <div className="space-y-2">
            {/* Filed-but-unlinked record: the document is already here, don't request it again. */}
            {(() => {
              const matches = [...recordEntries.values()].filter((r) => {
                const people = (r.frontMatter.people ?? []) as string[];
                if (!people.includes(task.personId)) return false;
                const t = String(r.frontMatter.type || '').toLowerCase();
                switch (task.eventType) {
                  case 'birth':
                    return t.includes('birth') || t.includes('nascita');
                  case 'baptism':
                    return t.includes('bapt') || t.includes('battesimo') || t.includes('christening');
                  case 'marriage':
                    return t.includes('marri') || t.includes('matrimonio');
                  case 'death':
                    return t.includes('death') || t.includes('morte');
                  case 'burial':
                    return t.includes('buri') || t.includes('sepol');
                  case 'migration_naturalisation':
                    return (
                      t.includes('migrat') ||
                      t.includes('naturalis') ||
                      t.includes('citizenship') ||
                      t.includes('cittadinanza') ||
                      t.includes('alien') ||
                      t.includes('immigrat') ||
                      t.includes('passenger') ||
                      t.includes('pow')
                    );
                  default:
                    return false;
                }
              });
              if (matches.length === 0) return null;
              return (
                <div className="rounded-lg bg-emerald-50 border-2 border-emerald-500 px-3 py-2.5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <Check className="w-4 h-4 shrink-0" /> Record is here — verify it, don't request it
                  </div>
                  {matches.map((m) => {
                    const verified = m.frontMatter.verified === true;
                    return (
                      <div key={m.id} className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-emerald-900 font-sans">
                          {String(m.frontMatter.type || 'Record')} ·{' '}
                          {String(m.frontMatter.date || m.frontMatter.year || '')}
                        </span>
                        <Button
                          size="sm"
                          className="text-xs h-8 px-3 bg-emerald-700 text-white hover:bg-emerald-800 font-semibold"
                          onClick={() =>
                            navigate(
                              verified
                                ? `/research/records/${m.id}`
                                : `/research/records/${m.id}?mode=check`
                            )
                          }
                        >
                          {verified ? 'Open record' : 'Verify record'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {task.requestedOn ? (
              <>
                <Button
                  size="sm"
                  className="w-full sm:w-auto text-sm h-9 px-4 font-semibold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm"
                  onClick={markReceived}
                >
                  <Inbox className="w-4 h-4 mr-1.5" /> Document received
                </Button>
                <div className="text-[11px] text-stone-500 font-sans">Nothing arrived yet?</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs min-h-[40px] px-4 border-[#800020]/40 text-[#800020] font-semibold"
                    onClick={markRequested}
                    title={
                      typeof task.daysWaiting === 'number' && task.daysWaiting >= 30
                        ? 'Logs a chase today — the card returns in 30 days'
                        : 'Hides this card for 30 days, then it returns as a chase'
                    }
                  >
                    <Send className="w-3 h-3 mr-1" />
                    {typeof task.daysWaiting === 'number' && task.daysWaiting >= 30
                      ? 'Chase — wait another 30 days'
                      : 'Snooze 30 days'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-8 px-3" onClick={() => setShowLinkInput((v) => !v)}>
                    <Link2 className="w-3 h-3 mr-1" /> Found online
                  </Button>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                  <button
                    className="text-[11px] font-sans text-stone-500 underline hover:text-[#800020] min-h-[32px]"
                    onClick={checkSentCorrespondence}
                  >
                    Check sent mail
                  </button>
                  <button
                    className="text-[11px] font-sans text-stone-500 underline hover:text-[#800020] min-h-[32px]"
                    onClick={() =>
                      navigate(
                        `/research/triangulate?person=${encodeURIComponent(task.personId)}&target=${encodeURIComponent(
                          task.eventType === 'birth' || task.eventType === 'marriage' || task.eventType === 'death'
                            ? task.eventType
                            : 'death'
                        )}`
                      )
                    }
                  >
                    Triangulate
                  </button>
                  <button
                    className="text-[11px] font-sans text-stone-400 underline hover:text-red-600 min-h-[32px]"
                    onClick={clearOverride}
                  >
                    Not requesting it
                  </button>
                </div>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  className="w-full sm:w-auto text-sm h-9 px-4 font-semibold bg-[#800020] text-white hover:bg-[#600018] shadow-sm"
                  onClick={markRequested}
                >
                  <Send className="w-4 h-4 mr-1.5" /> Mark as requested
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-8 px-3" onClick={() => setShowLinkInput((v) => !v)}>
                    <Link2 className="w-3 h-3 mr-1" /> Found online
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-8 px-3" onClick={markReceived}>
                    <Inbox className="w-3 h-3 mr-1" /> Already received
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Link input panel — shown when "Found online" clicked */}
        {(isGetDocument || isChase) && linkInputPanel}

        {/* Received panel */}
        {showReceivedPanel && receivedPanel}

        {/* Where to find it: filed records for this person + records mentioning the event */}
        {(isGetDocument || isChase) &&
          (() => {
            const filedForPerson = [...recordEntries.values()].filter((r) =>
              ((r.frontMatter.people ?? []) as string[]).includes(task.personId)
            );
            const terms = extractKeyTerms([task.whereItIs, task.note], task.personName ?? '');
            const surname = (terms.names[0] ?? '').toLowerCase();
            const filedIds = new Set(filedForPerson.map((r) => r.id));
            const mentionedIn = [...recordBodies.entries()]
              .filter(
                ([id, body]) =>
                  !filedIds.has(id) &&
                  surname.length > 2 &&
                  body.toLowerCase().includes(surname) &&
                  (terms.years.length === 0 || terms.years.some((y) => body.includes(y)))
              )
              .slice(0, 5)
              .map(([id]) => recordEntries.get(id))
              .filter((r): r is NonNullable<typeof r> => Boolean(r));
            return (
              <div>
                <details className="group rounded-lg border border-[#800020]/30 bg-[#FAF6F0] overflow-hidden" open>
                  <summary className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-stone-700 cursor-pointer hover:bg-stone-50 list-none">
                    <FileSearch className="w-3.5 h-3.5 text-[#800020]" />
                    Where to find it
                    {filedForPerson.length > 0 && (
                      <span className="ml-1 rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold">
                        {filedForPerson.length}
                      </span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 ml-auto text-stone-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-3 pb-3 pt-1 space-y-2">
                    {task.recordId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 px-3 border-[#800020] text-[#800020]"
                        onClick={() => navigate(`/research/records/${task.recordId}`)}
                      >
                        Open the record
                      </Button>
                    )}
                    {filedForPerson.length > 0 ? (
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-stone-500 font-bold mb-1">
                          {task.personName}’s filed records
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {filedForPerson.map((r) => (
                            <button
                              key={r.id}
                              className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-sans text-stone-700 hover:border-[#800020] hover:text-[#800020]"
                              onClick={() => navigate(`/research/records/${r.id}`)}
                            >
                              {String(r.frontMatter.type || 'Record')} · {String(r.frontMatter.date || r.frontMatter.year || '')}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-600">
                        Nothing filed for {task.personName} yet — that’s why this card exists.
                      </p>
                    )}
                    {mentionedIn.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-stone-500 font-bold mb-1">
                          Mentioned in other records
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {mentionedIn.map((r) => (
                            <button
                              key={r.id}
                              className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-sans text-amber-800 hover:border-[#800020]"
                              onClick={() => navigate(`/research/records/${r.id}`)}
                              title="This record's transcription mentions this person and year — the reference may live here"
                            >
                              {String(r.frontMatter.type || 'Record')} · {String(r.frontMatter.date || r.frontMatter.year || '')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <a
                      className="inline-block text-[11px] font-sans text-[#800020] underline"
                      href={`/research/people/${task.personId}`}
                    >
                      Open {task.personName}’s person page
                    </a>
                  </div>
                </details>
              </div>
            );
          })()}

        {/* Details — collapsed by default */}
        {(isGetDocument || isChase) && (
          <div className="space-y-2 pt-1">
            <details className="group rounded-lg border border-stone-200 bg-white overflow-hidden">
              <summary className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-stone-700 cursor-pointer hover:bg-stone-50 list-none">
                <MapPin className="w-3.5 h-3.5 text-[#800020]" />
                Where to request it
                <ChevronDown className="w-3.5 h-3.5 ml-auto text-stone-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-3 pb-3">{whereItIsPanel}</div>
            </details>
            {isGetDocument && (
              <details className="group rounded-lg border border-stone-200 bg-white overflow-hidden">
                <summary className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-stone-700 cursor-pointer hover:bg-stone-50 list-none">
                  <MailCheck className="w-3.5 h-3.5 text-[#800020]" />
                  Check imported email
                  {sourceHits.length > 0 && (
                    <span className="ml-1 rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold">
                      {sourceHits.length}
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 ml-auto text-stone-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-3 pb-3">{sourcePanel}</div>
              </details>
            )}
          </div>
        )}

        {isProcessInbox && (
          <>
            <div className="mt-1 text-xs text-stone-500">
              Marked received {formatIso(task.receivedOn)} — nothing to chase, it just needs filing.
            </div>
            {receivedPanel}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-8 px-3 text-stone-500 hover:bg-stone-50"
                onClick={clearOverride}
              >
                <FastForward className="w-3 h-3 mr-1" /> Not in the inbox — clear this
              </Button>
            </div>
          </>
        )}

        {how && (
          <div className="mt-4 rounded-lg bg-[#FAF6F0] border border-[#800020]/20 p-4">
            <button
              className="text-sm font-bold text-[#800020] mb-2 flex items-center gap-1"
              onClick={() => setShowHowTo(!showHowTo)}
            >
              {showHowTo ? '▾' : '▸'} {how.title}
            </button>
            {showHowTo && (
              <>
            <ol className="list-decimal ml-5 space-y-1 text-sm text-stone-700">
              {how.steps.map((st) => <li key={st}>{st}</li>)}
            </ol>
            {how.command && (
              <div className="mt-3 flex items-center gap-2">
                <code className="text-sm bg-white border border-stone-300 rounded px-2 py-1">{how.command}</code>
                <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => copy('cmd', how.command!)}>
                  <Copy className="w-3 h-3 mr-1" /> {copied === 'cmd' ? 'Copied ✓' : 'Copy command'}
                </Button>
              </div>
            )}
            <div className="mt-2 text-xs text-stone-500">This step ticks itself when OpenCode finishes it. Reload this page afterwards.</div>
              </>
            )}
          </div>
        )}

        {isFamilySearchTask && !fs && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            This record has no "## FamilySearch" section yet. Ask OpenCode to prepare it.
          </div>
        )}

        {isFamilySearchTask && fs && (
          <div className="mt-4 rounded-lg bg-purple-50 border border-purple-200 p-4 space-y-3">
            <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider">
              FamilySearch → Add Source (same order as the form)
            </h3>
            {existingFsId && (
              <a
                href={`https://www.familysearch.org/tree/person/details/${existingFsId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-purple-700 underline"
              >
                <ExternalLink className="w-3 h-3 mr-1" /> Open {task.personName} on FamilySearch
              </a>
            )}
            {[
              ['Event Date', fs.eventDate],
              ['Source Title', fs.sourceTitle],
            ].map(([label, text]) => (
              <FsRow key={label} label={label} text={text} copied={copied === label} onCopy={() => copy(label, text)} />
            ))}
            <div className="grid grid-cols-[9rem_1fr] gap-2 items-start">
              <div className="text-xs font-semibold text-stone-700 pt-1">Source Type</div>
              <div className="text-xs text-stone-700 space-y-2">
                {imageLinks.get(recordId) ? (
                  <>
                    <div>
                      <b>Web Page URL:</b>{' '}
                      <span className="text-stone-500 font-mono break-all">
                        {imageLinks.get(recordId)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={() => navigator.clipboard.writeText(imageLinks.get(recordId) || '')}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={() => callApiOpenInFinder(recordId).catch((e) => setStatus(`Error: ${(e as Error).message}`))}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> Show in Finder
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>Choose <b>Add a Memory → Upload Memory</b>, then drag the file in from Finder.</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={() => callApiOpenInFinder(recordId).catch((e) => setStatus(`Error: ${(e as Error).message}`))}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> Show in Finder
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={copyFilePath}
                      >
                        <Copy className="w-3 h-3 mr-1" /> {copied === 'path' ? 'Copied ✓' : 'Copy file path'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
            {[
              ['Citation', fs.citation],
              ['Notes', fs.notes],
              ['Reason to Attach', fs.reason],
            ].map(([label, text]) => (
              <FsRow key={label} label={label} text={text} copied={copied === label} onCopy={() => copy(label, text)} />
            ))}
            <div className="grid grid-cols-[9rem_1fr] gap-2 items-start">
              <div className="text-xs font-semibold text-stone-700 pt-1">Vital Tags</div>
              <div className="text-xs text-stone-700 whitespace-pre-wrap">Tick: {fs.vitalTags}</div>
            </div>
            <div className="grid grid-cols-[9rem_1fr] gap-2 items-start">
              <div className="text-xs font-semibold text-stone-700 pt-1">My Source Box</div>
              <div className="text-xs text-stone-700">{fs.sourceBox}</div>
            </div>
          </div>
        )}

        {status && (
          <div className="mt-2 p-2 rounded bg-stone-50 text-[10px] text-stone-600 border border-stone-200">
            {status}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-8 px-3 text-stone-500 hover:bg-stone-50"
            onClick={skipPerson}
          >
            <FastForward className="w-3 h-3 mr-1" /> Skip this person
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {recordId && stepNum >= 2 && (
            <Button size="sm" variant="outline" className="text-xs h-8 px-3" onClick={() => navigate(`/records/${recordId}`)}>
              <ExternalLink className="w-3 h-3 mr-1" /> Open record
            </Button>
          )}
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
          ) : !isFamilySearchTask ? null : (
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
                } catch (e) {
                  setStatus(`Error: ${(e as Error).message}`);
                }
              }}
            >
              <Check className="w-3 h-3 mr-1" /> {isFamilySearchTask ? 'Done – added to FamilySearch' : 'Done'}
            </Button>
          )}
          {recordId && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 px-3 text-stone-600 border-stone-300 hover:bg-stone-50"
                onClick={async () => {
                  setStatus('Saving...');
                  try {
                    await callApi(
                      recordId,
                      'discrepancies',
                      'User flagged an issue via Next Guide "Something\'s wrong" button.'
                    );
                    setStatus('Saved: discrepancy added');
                  } catch (e) {
                    setStatus(`Error: ${(e as Error).message}`);
                  }
                }}
              >
                <AlertTriangle className="w-3 h-3 mr-1" /> Something's wrong
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-8 px-3 text-stone-500 hover:bg-stone-50"
                onClick={async () => {
                  setStatus('Saving...');
                  try {
                    await callApi(
                      recordId,
                      'discrepancies',
                      'Task skipped via Next Guide "Skip for now" button.'
                    );
                    setSkippedIds((prev) => new Set([...prev, task.eventType ?? '']));
                    setStatus('Saved: skipped');
                  } catch (e) {
                    setStatus(`Error: ${(e as Error).message}`);
                  }
                }}
              >
                <FastForward className="w-3 h-3 mr-1" /> Skip for now
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FsRow({ label, text, copied, onCopy }: { label: string; text: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="grid grid-cols-[9rem_1fr_auto] gap-2 items-start">
      <div className="text-xs font-semibold text-stone-700 pt-1">{label}</div>
      <div className="text-xs text-stone-700 bg-white p-2 rounded border border-stone-200 whitespace-pre-wrap">{text || '—'}</div>
      <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={onCopy} disabled={!text}>
        <Copy className="w-3 h-3 mr-1" /> {copied ? 'Copied ✓' : 'Copy'}
      </Button>
    </div>
  );
}
