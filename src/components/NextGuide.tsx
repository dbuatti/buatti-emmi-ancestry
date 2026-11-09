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
} from 'lucide-react';
import { initialPeople } from '@/data/familyData';
import {
  getNextTask,
  getProgress,
  eventKey,
  toIsoDate,
  placeFromOffice,
  EVENT_LABELS,
  type RecordStepInfo,
  type EventOverrides,
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
  const [imageLinks, setImageLinks] = useState<Map<string, string>>(new Map());
  const [copied, setCopied] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [showReceivedPanel, setShowReceivedPanel] = useState(false);
  const [sentCheck, setSentCheck] = useState<{ found: boolean; sent_at?: string; recipient?: string } | null>(null);
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceHits, setSourceHits] = useState<Array<{ id: number; subject: string; from_name: string; from_email: string; snippet: string; received_at: string; attachment_count: number }>>([]);
  const [sourceLoading, setSourceLoading] = useState(false);

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
        for (const rec of records) {
          steps.set(rec.id, { step: rec.step, stepNumber: rec.stepNumber });
          bodies.set(rec.id, rec.body);
          if (rec.frontMatter.image_link) {
            imgLinks.set(rec.id, rec.frontMatter.image_link);
          }
        }
        setRecordBodies(bodies);
        setRecordSteps(steps);
        setImageLinks(imgLinks);
        setRecordsLoaded(true);
      } catch (e) {
        setRecordsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const task = getNextTask(people, recordSteps, overrides, new Date(), fsChecks as Record<string, { checkedOn?: string; openItems?: number; snoozedOn?: string }>, personSkips as Record<string, { skippedOn?: string }>);

  // Source-in-email lookup: when the task is "get the document", search imported
  // correspondence for the source text (estratto / certificate / act references) and
  // surface any message that contains it.
  useEffect(() => {
    if (task?.type !== 'get_document') return;
    const q = (task.whereItIs || task.office || task.eventType || '').trim();
    if (!q) { setSourceHits([]); setSourceQuery(''); return; }
    let cancelled = false;
    setSourceLoading(true);
    fetch(`/api/correspondence/source?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { setSourceHits((d?.hits as typeof sourceHits) ?? []); setSourceQuery(q); } })
      .catch(() => { if (!cancelled) setSourceHits([]); })
      .finally(() => { if (!cancelled) setSourceLoading(false); });
    return () => { cancelled = true; };
  }, [task?.type, task?.whereItIs, task?.office, task?.eventType]);

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

  if (task.type === 'fs_person_check') {
    return (
      <Card className="bg-white rounded-xl shadow-sm border-2 border-[#800020]/20">
        <div className="bg-[#FAF6F0] rounded-t-xl p-4 border-b border-[#800020]/20">
          <h2 className="text-xs font-bold text-[#800020] uppercase tracking-wider">Next task</h2>
          <a href={`/people/${task.personId}`} className="text-[10px] text-stone-500 mt-0.5 underline">{task.personName}</a>
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
      setStatus(`Saved: requested_on ${today}`);
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
    <div className="mt-4 rounded-lg bg-[#FAF6F0] border border-[#800020]/20 p-4">
      <div className="text-sm font-bold text-[#800020] mb-1">Where it is</div>
      <p className="text-sm text-stone-700 whitespace-pre-wrap">
        {task.whereItIs || `No note is recorded for this ${eventLabel} event in familyData.ts.`}
      </p>
      <label className="flex items-center gap-2 text-xs text-stone-600 mt-3">
        <span className="shrink-0">Office to request from:</span>
        <input
          className="flex-1 rounded border border-stone-300 bg-white px-2 py-1 text-sm text-stone-800"
          value={officeInput ?? task.office ?? ''}
          placeholder="e.g. Comune di Fiumefreddo di Sicilia"
          onChange={(e) => setOfficeInput(e.target.value)}
        />
      </label>
    </div>
  );

  /** Source-in-email panel: does imported correspondence contain the source text? */
  const sourcePanel = (
    <div className="mt-4 rounded-lg bg-[#FAF6F0] border border-[#800020]/20 p-4">
      <div className="text-sm font-bold text-[#800020] mb-1">Source in email</div>
      <p className="text-xs text-stone-500 mb-2">
        Searching imported Gmail correspondence for the source text (estratto / certificate / act references).
      </p>
      {sourceLoading ? (
        <div className="text-xs text-stone-600">Searching…</div>
      ) : sourceQuery && sourceHits.length > 0 ? (
        <ul className="space-y-2">
          {sourceHits.map((h) => (
            <li key={h.id} className="text-xs text-stone-700">
              <span className="font-semibold">{h.subject || '(no subject)'}</span>
              {h.from_name ? <span className="text-stone-500"> — from {h.from_name}</span> : null}
              {h.snippet ? <div className="text-stone-600 mt-0.5">{h.snippet}</div> : null}
              {!!h.attachment_count && <div className="text-stone-500 mt-0.5">{h.attachment_count} attachment(s).</div>}
            </li>
          ))}
        </ul>
      ) : sourceQuery && sourceHits.length === 0 ? (
        <div className="text-xs text-stone-700">
          No correspondence hits for “{sourceQuery}”. The source may be on FamilySearch, or not imported yet.
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

  const documentButtons = (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        size="sm"
        className="text-xs h-8 px-3 font-semibold bg-[#800020] text-white hover:bg-[#600018] shadow-sm"
        onClick={markRequested}
      >
        <Send className="w-3 h-3 mr-1" /> Requested (waiting for reply)
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-xs h-8 px-3"
        onClick={() => setShowLinkInput((v) => !v)}
      >
        <Link2 className="w-3 h-3 mr-1" /> Found online
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-xs h-8 px-3"
        onClick={markReceived}
      >
        <Inbox className="w-3 h-3 mr-1" /> Received
      </Button>
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
              href={`/people/${task.personId}`}
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

      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
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

          <div className="prose prose-sm text-stone-700 max-w-none">
            {headline}
          </div>

          {isChase && (
            <div className="text-xs text-stone-500">
              Requested {formatIso(task.requestedOn)} — {task.daysWaiting} days ago, no reply yet.
              {!task.office && ' No office was recorded when it was marked requested.'}
            </div>
          )}
        </div>

        {(isGetDocument || isChase) && whereItIsPanel}

        {isGetDocument && (
          <>
            {sourcePanel}
            {linkInputPanel}
            {showReceivedPanel && receivedPanel}
            {documentButtons}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 px-3"
                onClick={checkSentCorrespondence}
              >
                <Send className="w-3 h-3 mr-1" /> Check sent correspondence
              </Button>
            </div>
            <div className="mt-2 text-xs text-stone-500">
              "Requested" stores <span className="font-mono">requested_on: {toIsoDate()}</span> and
              hides this event for 30 days; then the card comes back as{' '}
              <span className="font-mono">Chase {(officeInput ?? task.office) || `<office>`}?</span>
            </div>
          </>
        )}

        {isChase && (
          <>
            {linkInputPanel}
            {showReceivedPanel && receivedPanel}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="text-xs h-8 px-3 font-semibold bg-[#800020] text-white hover:bg-[#600018] shadow-sm"
                onClick={markRequested}
              >
                <Send className="w-3 h-3 mr-1" /> Chased — wait another 30 days
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-8 px-3" onClick={markReceived}>
                <Inbox className="w-3 h-3 mr-1" /> Received
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 px-3"
                onClick={() => setShowLinkInput((v) => !v)}
              >
                <Link2 className="w-3 h-3 mr-1" /> Found online
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-8 px-3 text-stone-500 hover:bg-stone-50"
                onClick={clearOverride}
              >
                <FastForward className="w-3 h-3 mr-1" /> Not requesting it
              </Button>
            </div>
          </>
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
            <div className="text-sm font-bold text-[#800020] mb-2">{how.title}</div>
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
