import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RecordBody } from '@/components/RecordBody';
import { RecordViewer } from '@/components/RecordViewer';
import { RecordCheck } from '@/components/RecordCheck';
import { RecordNextStep } from '@/components/RecordNextStep';
import { TranscriptionPanel } from '@/components/TranscriptionPanel';
import { RecordPeopleSection } from '@/components/RecordPeopleSection';
import { TreeHintsPanel } from '@/components/TreeHintsPanel';
import { CiecExtractPanel } from '@/components/CiecExtractPanel';
import { ItalianExtractPanel } from '@/components/ItalianExtractPanel';
import { SplitDocumentPanel } from '@/components/SplitDocumentPanel';
import { parseRecordMarkdown, getWorkflowStepNumber } from '@/lib/records';
import type { RecordFrontMatter, RecordLink } from '@/types/record';
import { callApi, callApiOpenInFinder, callApiUpdateLinks } from '@/components/next-guide-api';
import { initialPeople } from '@/data/familyDataWrapper';
import { getMeta } from '@/lib/person-meta';

/**
 * Every records/<id>/record.md is loaded at build/dev time via import.meta.glob
 */
const rawRecordFiles = import.meta.glob('/records/*/record.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const RECORDS: Record<string, string> = {};
for (const [filePath, raw] of Object.entries(rawRecordFiles)) {
  RECORDS[filePath.split('/').slice(-2, -1)[0]] = raw;
}

const STEP_NAMES = ['Filed', 'Transcribed', 'Verified', 'In app', 'On FamilySearch'];

function StepProgress({ stepNum, verified, onFs }: { stepNum: number; verified: boolean; onFs: boolean }) {
  return (
    <div className="flex items-center gap-1 mb-4">
      {STEP_NAMES.map((name, i) => {
        const n = i + 1;
        const done = n < stepNum || (n === stepNum && n <= 2) || (n === 3 && verified) || (n === 5 && onFs);
        const current = n === stepNum;
        return (
          <div key={name} className="flex items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                done
                  ? 'bg-emerald-500 text-white'
                  : current
                  ? 'bg-[#800020] text-white ring-2 ring-[#800020]/30'
                  : 'bg-stone-200 text-stone-500'
              }`}
            >
              {done ? '✓' : n}
            </div>
            {i < STEP_NAMES.length - 1 && (
              <div className={`w-4 h-0.5 ${done ? 'bg-emerald-400' : 'bg-stone-200'}`} />
            )}
          </div>
        );
      })}
      <span className="ml-2 text-xs text-stone-500 font-sans">
        {stepNum >= 5 && verified && onFs ? 'All done!' : `Step ${stepNum} of 5`}
      </span>
    </div>
  );
}

function FamilySearchPanel({ recordId, frontMatter, body, setStatus }: {
  recordId: string;
  frontMatter: RecordFrontMatter;
  body: string;
  setStatus: (s: string | null) => void;
}) {
  const [files, setFiles] = useState<{ name: string; ext: string }[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const people: string[] = (frontMatter.people as string[]) ?? [];
  const mentioned: string[] = (frontMatter.mentioned as string[]) ?? [];

  useEffect(() => {
    fetch(`/api/record-files/${recordId}`)
      .then((r) => r.json())
      .then((data) => setFiles(data?.files ?? []))
      .catch(() => {});
  }, [recordId]);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setStatus('Copy failed');
    }
  };

  const pdfFile = files.find((f) => /\.pdf$/i.test(f.name))?.name ?? `${recordId}.pdf`;
  const eventDate = [frontMatter.date, frontMatter.place].filter(Boolean).join(' — ') || '(fill from transcription)';
  const parteSerie = [frontMatter.parte ? `parte ${frontMatter.parte}` : '', frontMatter.serie ? `serie ${frontMatter.serie}` : ''].filter(Boolean).join(', ');
  const sourceTitle = `Record — ${frontMatter.comune || ''} ${frontMatter.year || ''}${frontMatter.atto ? `, atto ${frontMatter.atto}` : ''}${parteSerie ? ` (${parteSerie})` : ''}`;
  const citation = `${frontMatter.comune || ''} ${frontMatter.type || 'record'}${frontMatter.atto ? ` n. ${frontMatter.atto}` : ''}${parteSerie ? `, ${parteSerie}` : ''}${frontMatter.year ? ` (${frontMatter.year})` : ''}${frontMatter.source_office ? `, ${frontMatter.source_office}` : ''}.`;

  const markDone = async () => {
    setMarking(true);
    try {
      const res = await fetch(`/api/update-record/${recordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'front-matter', content: 'on_familysearch=true' }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed');
      setStatus('Marked as on FamilySearch');
      window.location.reload();
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-600">Follow these steps to add this record as a source on FamilySearch.</p>
      <div>
        <div className="text-xs font-bold text-stone-700 mb-1">Step 1 — Find the person on FamilySearch</div>
        {people.length === 0 ? (
          <p className="text-xs text-amber-700">No people linked to this record yet. Link someone above first.</p>
        ) : (
          <div className="space-y-1.5">
            {people.map((pid) => {
              const person = initialPeople.find((p) => p.id === pid);
              const fsId = getMeta(pid)?.familySearchId;
              return (
                <div key={pid} className="flex items-center gap-2 text-xs">
                  <span className="text-stone-700">{person?.name || pid}</span>
                  {fsId ? (
                    <a
                      className="text-purple-700 underline"
                      href={`https://www.familysearch.org/tree/person/details/${fsId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open on FamilySearch ({fsId})
                    </a>
                  ) : (
                    <a className="text-[#800020] underline" href={`/research/people/${pid}`}>
                      Open person page — add FamilySearch ID
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {mentioned.length > 0 && (
        <div className="text-[11px] font-sans text-stone-500">
          Also named in this act:{' '}
          {mentioned.map((pid, i) => {
            const mp = initialPeople.find((pp) => pp.id === pid);
            return (
              <span key={pid}>
                {i > 0 && ', '}
                <a className="text-[#800020] underline" href={`/research/people/${pid}`}>
                  {mp?.name || pid}
                </a>
              </span>
            );
          })}
          {' '}— attach the source to them, not this record.
        </div>
      )}
      <div>
        <div className="text-xs font-bold text-stone-700 mb-1">Step 2 — Upload the image</div>
        <p className="text-xs text-stone-600 mb-2">On FamilySearch: person page, Memories, Add a Memory, Upload Memory. Drag the file in from Finder.</p>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-2"
            onClick={async () => {
              try {
                await callApiOpenInFinder(recordId);
                setStatus('Opened in Finder');
              } catch (e) {
                setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
              }
            }}
          >
            Show in Finder
          </Button>
          <a
            className="inline-flex items-center rounded border border-stone-300 px-2 h-7 text-xs text-stone-700 hover:bg-stone-50"
            href={`/records-local/${recordId}/${encodeURIComponent(pdfFile)}?download=1`}
          >
            Download PDF
          </a>
        </div>
      </div>
      <div>
        <div className="text-xs font-bold text-stone-700 mb-1">Step 3 — Fill the "Add Source" form</div>
        <div className="space-y-1.5">
          {[
            ['Event Date', eventDate],
            ['Source Title', sourceTitle],
            ['Citation', citation],
          ].map(([label, text]) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <span className="w-24 shrink-0 font-semibold text-stone-600">{label}:</span>
              <code className="flex-1 bg-white border border-stone-200 rounded px-2 py-1 truncate">{text}</code>
              <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => copy(label, text)}>
                {copied === label ? 'Copied \u2713' : 'Copy'}
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-bold text-stone-700 mb-1">Step 4 — Mark as done</div>
        {frontMatter.on_familysearch ? (
          <p className="text-xs text-emerald-700 font-semibold">\u2705 This record is marked as on FamilySearch.</p>
        ) : (
          <Button
            size="sm"
            variant="default"
            className="text-xs bg-purple-700 text-white hover:bg-purple-800"
            disabled={marking}
            onClick={markDone}
          >
            {marking ? 'Saving…' : 'Done — added to FamilySearch'}
          </Button>
        )}
      </div>
    </div>
  );
}

function CollapsibleSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#F4EFE6] text-left hover:bg-stone-100 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">{title}</span>
        <span className="text-stone-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

export default function RecordPage() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const [status, setStatus] = useState<string | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState<string>('');
  const [newLinkLabel, setNewLinkLabel] = useState<string>('');

  const rawMd = RECORDS[recordId ?? ''];
  const parsed = rawMd ? parseRecordMarkdown(rawMd) : null;
  const record = parsed
    ? {
        ...parsed,
        frontMatter: { ...parsed.frontMatter, id: parsed.frontMatter.id || recordId || '' },
      }
    : null;

  if (!record) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-lg font-bold text-stone-800">Record not found</h1>
        <p className="text-stone-500 mt-2">The record "{recordId}" was not found.</p>
      </div>
    );
  }

  const { frontMatter, body } = record;
  const stepNum = getWorkflowStepNumber(frontMatter);
  const isCheckMode = mode === 'check';
  const isDev = import.meta.env.DEV;

  const handleAddLink = async () => {
    if (!newLinkUrl.trim() || !recordId) return;
    setStatus('Saving...');
    try {
      const updatedLinks = [...(frontMatter.links ?? []), {
        label: newLinkLabel.trim() || newLinkUrl,
        url: newLinkUrl.trim(),
      }];
      await callApiUpdateLinks(recordId, updatedLinks);
      setStatus('Link added');
      setNewLinkUrl('');
      setNewLinkLabel('');
      window.location.reload();
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleRemoveLink = async (index: number) => {
    if (!recordId) return;
    const target = frontMatter.links?.[index];
    if (!target) return;
    const ok = window.confirm(`Delete this link?\n\n${target.label}\n${target.url}`);
    if (!ok) return;
    setStatus('Deleting link...');
    try {
      const updatedLinks = (frontMatter.links ?? []).filter((_, i) => i !== index);
      await callApiUpdateLinks(recordId, updatedLinks);
      setStatus('Link deleted');
      window.location.reload();
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleSetImageLink = async (url: string) => {
    if (!recordId) return;
    setStatus('Saving...');
    try {
      await fetch(`/api/update-record/${recordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'front-matter', content: `image_link=${url}` }),
      });
      setStatus('Image link saved');
      window.location.reload();
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const isFamilySearchOrAntenati = (url: string) =>
    url.includes('familysearch.org') || url.includes('antenati');

  if (isCheckMode) {
    return (
      <div className="w-full max-w-[1800px] mx-auto px-3 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = `/research/records/${recordId}`;
            }}
          >
            ← Back to transcription
          </Button>
          <h1 className="text-lg font-bold text-stone-800">
            {frontMatter.type || 'Untitled record'} — Check
          </h1>
          <Badge variant="outline">
            Step {stepNum} of 5
          </Badge>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
          <div className="xl:col-span-3 h-[calc(100vh-8rem)]">
            <RecordViewer recordId={frontMatter.id} sticky={true} />
          </div>
          <div className="xl:col-span-2 h-[calc(100vh-8rem)] overflow-y-auto pr-1 space-y-3">
            <RecordCheck
              recordId={frontMatter.id}
              frontMatter={frontMatter}
              body={body}
              onVerified={() => {
                window.location.reload();
              }}
            />
            {/* People in this record — subjects + mentioned */}
          {recordId && (
            <CollapsibleSection title="People in this record" defaultOpen={true}>
              <RecordPeopleSection
                recordId={recordId}
                people={frontMatter.people ?? []}
                mentioned={frontMatter.mentioned ?? []}
                body={body}
                setStatus={setStatus}
              />
            </CollapsibleSection>
          )}
          {/* Links list (check mode) */}
          {frontMatter.links && frontMatter.links.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Links
              </div>
              <div className="space-y-1">
                {frontMatter.links.map((link, i) => (
                  <div
                    key={`${link.url}-${i}`}
                    className="flex items-center gap-2 rounded border border-stone-200 bg-white px-2 py-1.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-stone-700 truncate">
                        {link.label || link.url || 'Untitled link'}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono truncate">
                        {link.url}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-6 px-2 text-stone-600 border-stone-300 hover:bg-stone-50 shrink-0"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      Open \u2197
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-6 px-2 text-stone-400 border-stone-300 hover:bg-stone-50 shrink-0"
                      onClick={() => navigator.clipboard.writeText(link.url)}
                    >
                      Copy
                    </Button>
                    {isDev && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-6 px-2 text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                        title="Delete this link"
                        onClick={() => handleRemoveLink(i)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col lg:flex-row lg:gap-6 lg:items-start">
        <div className="lg:w-[42%] lg:shrink-0 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="h-full">
            <RecordViewer recordId={frontMatter.id} />
          </div>
        </div>
        <div className="lg:flex-1 lg:min-w-0 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-lg font-bold text-stone-800">{frontMatter.type || 'Untitled record'}</h1>
            <div className="flex gap-2 items-center">
              <StepProgress stepNum={stepNum} verified={!!frontMatter.verified} onFs={!!frontMatter.on_familysearch} />
              {frontMatter.verified && (
                <Badge variant="secondary">Verified</Badge>
              )}
              {frontMatter.on_familysearch && (
                <Badge variant="secondary">FamilySearch</Badge>
              )}
            </div>
          </div>

          <RecordNextStep
            recordId={frontMatter.id}
            frontMatter={frontMatter}
            isDev={isDev}
            onCheckAgainstImage={() => {
              navigate(`/research/records/${recordId}?mode=check`);
            }}
          />

          {/* 1. Record details */}
          <CollapsibleSection title="Record details" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-stone-600">
              <div><span className="font-bold">ID:</span> {frontMatter.id}</div>
              <div><span className="font-bold">Comune:</span> {frontMatter.comune || '\u2014'}</div>
              <div><span className="font-bold">Year:</span> {frontMatter.year || '\u2014'}</div>
              <div><span className="font-bold">Atto:</span> {frontMatter.atto || '\u2014'}</div>
              <div><span className="font-bold">Parte:</span> {frontMatter.parte || '—'}</div>
              <div><span className="font-bold">Serie:</span> {frontMatter.serie || '—'}</div>
              <div><span className="font-bold">Date:</span> {frontMatter.date || '\u2014'}</div>
              <div><span className="font-bold">Place:</span> {frontMatter.place || '\u2014'}</div>
              <div><span className="font-bold">Source:</span> {frontMatter.source_office || '\u2014'}</div>
              <div><span className="font-bold">Protocol:</span> {frontMatter.protocol || 'n/a'}</div>
              <div><span className="font-bold">Pages:</span> {Array.isArray(frontMatter.pages) ? frontMatter.pages.join(', ') : (frontMatter.pages ?? 'all shown')}</div>
              <div><span className="font-bold">People:</span> {(frontMatter.people ?? []).join(', ') || '\u2014'}</div>
            </div>
            {isDev && frontMatter.image_link && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2 text-stone-600 border-stone-300 hover:bg-stone-50"
                onClick={() => {
                  window.open(frontMatter.image_link, '_blank');
                }}
              >
                <span className="mr-1">\u2197</span> View original
              </Button>
            )}
          </CollapsibleSection>

          {/* 2. Transcription */}
          <CollapsibleSection title="Transcription" defaultOpen={true}>
            <Card>
              <CardContent className="pt-4">
                <RecordBody record={frontMatter} body={body} />
              </CardContent>
            </Card>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const m = body.match(/## Transcription[\s\S]*?(?=## |$)/);
                  navigator.clipboard.writeText(m ? m[0] : body);
                  setStatus('Transcription copied');
                }}
              >
                Copy transcription
              </Button>
              {!frontMatter.verified && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:text-emerald-900"
                  onClick={() => {
                    navigate(`/research/records/${recordId}?mode=check`);
                  }}
                >
                  Verify against image
                </Button>
              )}
              {isDev && recordId && frontMatter.transcribed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={async () => {
                    const ok = window.confirm('Clear the transcription and reset to "pending"? This cannot be undone.');
                    if (!ok) return;
                    setStatus('Clearing transcription...');
                    try {
                      await fetch(`/api/save-transcription/${recordId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transcription: '# Italian transcription\n\nTranscription pending.\n\n# English translation\n\nTranslation pending.\n\n# Uncertain readings\n\nN/A - image not yet transcribed.', setTranscribed: false }),
                      });
                      setStatus('Transcription cleared');
                      window.location.reload();
                    } catch (e) {
                      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
                    }
                  }}
                >
                  Clear transcription
                </Button>
              )}
            </div>
          </CollapsibleSection>

          {/* 3. People in this record — subjects + mentioned */}
          {recordId && (
            <CollapsibleSection title="People in this record" defaultOpen={true}>
              <RecordPeopleSection
                recordId={recordId}
                people={frontMatter.people ?? []}
                mentioned={frontMatter.mentioned ?? []}
                body={body}
                setStatus={setStatus}
              />
            </CollapsibleSection>
          )}

          {isDev && recordId && (
            <TreeHintsPanel
              recordId={recordId}
              subjects={(frontMatter.people ?? []) as string[]}
              body={body}
              transcribed={!!frontMatter.transcribed}
              setStatus={setStatus}
            />
          )}

          {/* 4. FamilySearch — Add as Source */}
          <CollapsibleSection title="FamilySearch — Add as Source" defaultOpen={!!frontMatter.verified && !frontMatter.on_familysearch}>
            <FamilySearchPanel recordId={frontMatter.id} frontMatter={frontMatter} body={body} setStatus={setStatus} />
          </CollapsibleSection>

          {/* 5. Tools (collapsed) */}
          <CollapsibleSection title="Tools" defaultOpen={false}>
            <div className="space-y-4">
              {isDev && (
                <CollapsibleSection title="Comune extract reader (OCR)" defaultOpen={!frontMatter.transcribed}>
                  <CiecExtractPanel recordId={recordId} people={frontMatter.people} />
                </CollapsibleSection>
              )}
              {isDev && (
                <CollapsibleSection title="Italian extract reader (standard estratto)" defaultOpen={false}>
                  <ItalianExtractPanel recordId={recordId} />
                </CollapsibleSection>
              )}
              {isDev && recordId && (
                <TranscriptionPanel recordId={frontMatter.id} />
              )}
              {isDev && recordId && (
                <SplitDocumentPanel recordId={recordId} />
              )}
            </div>
          </CollapsibleSection>

          {/* Links list */}
          {frontMatter.links && frontMatter.links.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Links
              </div>
              <div className="space-y-1">
                {frontMatter.links.map((link, i) => (
                  <div
                    key={`${link.url}-${i}`}
                    className="flex items-center gap-2 rounded border border-stone-200 bg-white px-2 py-1.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-stone-700 truncate">
                        {link.label || link.url || 'Untitled link'}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono truncate">
                        {link.url}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-6 px-2 text-stone-600 border-stone-300 hover:bg-stone-50 shrink-0"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      Open \u2197
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-6 px-2 text-stone-400 border-stone-300 hover:bg-stone-50 shrink-0"
                      onClick={() => navigator.clipboard.writeText(link.url)}
                    >
                      Copy
                    </Button>
                    {isDev && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-6 px-2 text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                        title="Delete this link"
                        onClick={() => handleRemoveLink(i)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add link form (local mode only) */}
          {isDev && recordId && (
            <div className="mt-4 rounded-lg bg-stone-50 border border-stone-200 p-3">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Add link
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste URL"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="flex-1 text-xs"
                />
                <Input
                  placeholder="Label (optional)"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  className="w-48 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                  disabled={!newLinkUrl.trim()}
                  onClick={handleAddLink}
                >
                  Add
                </Button>
              </div>
              {frontMatter.image_link === '' && isFamilySearchOrAntenati(newLinkUrl) && newLinkUrl.trim() && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2 mt-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                  onClick={() => handleSetImageLink(newLinkUrl.trim())}
                >
                  Save as image_link (main source)
                </Button>
              )}
            </div>
          )}

          {status && (
            <div className="mt-2 p-2 rounded bg-stone-50 text-[10px] text-stone-600 border border-stone-200">
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
