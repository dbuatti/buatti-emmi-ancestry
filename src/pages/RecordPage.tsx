import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecordBody } from '@/components/RecordBody';
import { RecordViewer } from '@/components/RecordViewer';
import { RecordCheck } from '@/components/RecordCheck';
import { parseRecordMarkdown, getWorkflowStepNumber } from '@/lib/records';
import type { RecordFrontMatter } from '@/types/record';

// Import Gregorio's birth record as raw markdown
import gregorioBirthRecordMd from '../../records/1915_Linguaglossa_birth_Emmi-Gregorio_atto202/record.md?raw';

const RECORDS: Record<string, string> = {
  '1915_Linguaglossa_birth_Emmi-Gregorio_atto202': gregorioBirthRecordMd,
};

export default function RecordPage() {
  const { recordId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

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

  if (isCheckMode) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <RecordViewer recordId={frontMatter.id} />
          </div>
          <div className="lg:col-span-7">
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
    <div className="max-w-5xl mx-auto p-4 space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-wider">Transcription</CardTitle>
            </CardHeader>
            <CardContent>
              <RecordBody record={frontMatter} body={body} />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Copy transcription
            </Button>
            <Button variant="outline" size="sm">
              Copy source title
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
