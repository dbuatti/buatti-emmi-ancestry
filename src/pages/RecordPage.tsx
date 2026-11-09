import { useParams, useSearchParams } from 'react-router-dom';
import { CiecExtractPanel } from '@/components/CiecExtractPanel';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RecordBody } from '@/components/RecordBody';
import { RecordViewer } from '@/components/RecordViewer';
import { RecordCheck } from '@/components/RecordCheck';
import { RecordNextStep } from '@/components/RecordNextStep';
import { TranscriptionPanel } from '@/components/TranscriptionPanel';
import { parseRecordMarkdown, getWorkflowStepNumber } from '@/lib/records';
import type { RecordFrontMatter, RecordLink } from '@/types/record';
import { callApiOpenInFinder, callApiUpdateLinks } from '@/components/next-guide-api';

/**
 * Every records/<id>/record.md is loaded at build/dev time via import.meta.glob
 * (same mechanism as src/lib/record-loader.ts) so no record dead-ends with
 * "Record not found". A record.md change (via the local update endpoint) is
 * reloaded by Vite automatically.
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

export default function RecordPage() {
  const { recordId } = useParams();
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
              window.location.href = `/records/${recordId}`;
            }}
          >
            ← Back to transcription
          </Button>
          <h1 className="text-lg font-bold text-stone-800">
            {frontMatter.type || 'Untitled record'} — Check
          </h1>
          <Badge variant="outline">
            {stepNum} of 5 steps done
          </Badge>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
          <div className="xl:col-span-3 h-[calc(100vh-8rem)]">
            <RecordViewer recordId={frontMatter.id} sticky={true} />
          </div>
          <div className="xl:col-span-2 h-[calc(100vh-8rem)] overflow-y-auto pr-1">
            <RecordCheck
              recordId={frontMatter.id}
              frontMatter={frontMatter}
              body={body}
              onVerified={() => {
                window.location.href = `/records/${recordId}`;
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col lg:flex-row lg:gap-6">
        <div className="lg:w-1/3">
          <RecordViewer recordId={frontMatter.id} />
        </div>
        <div className="lg:w-2/3 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-stone-800">{frontMatter.type || 'Untitled record'}</h1>
            <div className="flex gap-2">
              <Badge variant="outline">
                {stepNum} of 5 steps done
              </Badge>
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
              window.location.href = `/records/${recordId}?mode=check`;
            }}
          />

          {isDev && !frontMatter.transcribed && <CiecExtractPanel />}

          <div className="grid grid-cols-2 gap-4 text-xs text-stone-600">
            <div><span className="font-bold">ID:</span> {frontMatter.id}</div>
            <div><span className="font-bold">Comune:</span> {frontMatter.comune}</div>
            <div><span className="font-bold">Year:</span> {frontMatter.year}</div>
            <div><span className="font-bold">Atto:</span> {frontMatter.atto}</div>
            <div><span className="font-bold">Date:</span> {frontMatter.date}</div>
            <div><span className="font-bold">Place:</span> {frontMatter.place}</div>
            <div><span className="font-bold">Source:</span> {frontMatter.source_office}</div>
            <div><span className="font-bold">Protocol:</span> {frontMatter.protocol || 'n/a'}</div>
          </div>

          {/* View original button (image_link) */}
          {isDev && frontMatter.image_link && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2 text-stone-600 border-stone-300 hover:bg-stone-50"
              onClick={() => {
                window.open(frontMatter.image_link, '_blank');
              }}
            >
              <span className="mr-1">↗</span> View original
            </Button>
          )}

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
                      Open ↗
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

          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-wider">Transcription</CardTitle>
            </CardHeader>
            <CardContent>
              <RecordBody record={frontMatter} body={body} />
            </CardContent>
          </Card>

          {/* In-app transcription + quality checker */}
          {isDev && recordId && (
            <TranscriptionPanel recordId={frontMatter.id} />
          )}

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              Copy transcription
            </Button>
            <Button variant="outline" size="sm">
              Copy source title
            </Button>
            {isDev && !frontMatter.verified && (
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:text-emerald-900"
                onClick={() => {
                  window.location.href = `/records/${recordId}?mode=check`;
                }}
              >
                Check against image
              </Button>
            )}
            {isDev && recordId && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2 text-stone-600 border-stone-300 hover:bg-stone-50"
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
            )}
          </div>

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