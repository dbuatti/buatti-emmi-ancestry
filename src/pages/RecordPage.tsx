import { useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RecordBody } from '@/components/RecordBody';
import { RecordViewer } from '@/components/RecordViewer';
import { RecordCheck } from '@/components/RecordCheck';
import { parseRecordMarkdown, getWorkflowStepNumber } from '@/lib/records';
import type { RecordFrontMatter, RecordLink } from '@/types/record';
import { callApiOpenInFinder, callApiUpdateLinks } from '@/components/next-guide-api';

import gregorioBirthRecordMd from '../../records/1915_Linguaglossa_birth_Emmi-Gregorio_atto202/record.md?raw';
import gregorioBaptismRecordMd from '../../records/1915_Linguaglossa_baptism_Emmi-Gregorio_n251/record.md?raw';

const RECORDS: Record<string, string> = {
  '1915_Linguaglossa_birth_Emmi-Gregorio_atto202': gregorioBirthRecordMd,
  '1915_Linguaglossa_baptism_Emmi-Gregorio_n251': gregorioBaptismRecordMd,
};

export default function RecordPage() {
  const { recordId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const [status, setStatus] = useState<string | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState<string>('');
  const [newLinkLabel, setNewLinkLabel] = useState<string>('');

  const rawMd = RECORDS[recordId ?? ''];
  const record = rawMd ? parseRecordMarkdown(rawMd) : null;

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
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
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
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const isFamilySearchOrAntenati = (url: string) =>
    url.includes('familysearch.org') || url.includes('antenati');

  if (isCheckMode) {
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-6">
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
            {frontMatter.type} — Check
          </h1>
          <Badge variant="outline">
            Step {stepNum} of 5
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-4 h-[calc(100vh-4rem)]">
            <RecordViewer recordId={frontMatter.id} sticky={true} />
          </div>
          <div className="lg:col-span-1 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
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
            <h1 className="text-lg font-bold text-stone-800">{frontMatter.type}</h1>
            <div className="flex gap-2">
              <Badge variant="outline">
                Step {stepNum} of 5
              </Badge>
              {frontMatter.verified && (
                <Badge variant="secondary">Verified</Badge>
              )}
              {frontMatter.on_familysearch && (
                <Badge variant="secondary">FamilySearch</Badge>
              )}
            </div>
          </div>

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
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-500 font-mono">{link.label}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-6 px-2 text-stone-600 border-stone-300 hover:bg-stone-50"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      Open ↗
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-6 px-2 text-stone-400 border-stone-300 hover:bg-stone-50"
                      onClick={() => navigator.clipboard.writeText(link.url)}
                    >
                      Copy
                    </Button>
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
                  } catch (e: any) {
                    setStatus(`Error: ${e.message}`);
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
                  size="sm"
                  placeholder="Paste URL"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="flex-1 text-xs"
                />
                <Input
                  size="sm"
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