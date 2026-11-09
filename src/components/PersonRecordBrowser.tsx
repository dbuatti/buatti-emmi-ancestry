import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileText, ExternalLink, Image as ImageIcon, ZoomIn, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Person } from '@/types';
import { getAllRecords } from '@/lib/record-loader';
import type { RecordEntry } from '@/lib/record-loader';

interface PersonRecordBrowserProps {
  person: Person;
  onOpenRecord?: (recordId: string) => void;
}

const STEP_WORDS: Record<string, string> = {
  filed: 'Filed',
  transcribed: 'Transcribed',
  verified: 'Verified',
  in_app: 'In app',
  on_familysearch: 'On FamilySearch',
};

const isDev = import.meta.env.DEV;

export function PersonRecordBrowser({ person, onOpenRecord }: PersonRecordBrowserProps) {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // Collect all record IDs linked to this person
    const recordIds = new Set<string>();
    if (person.lifeEvents) {
      for (const ev of person.lifeEvents) {
        if (ev.recordId) recordIds.add(ev.recordId);
      }
    }
    getAllRecords().then((all) => {
      if (!alive) return;
      const personRecords = all.filter((r) => recordIds.has(r.id));
      setRecords(personRecords);
      setLoading(false);
    }).catch(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [person.id, person.lifeEvents]);

  if (loading) {
    return (
      <Card className="border-stone-200">
        <CardContent className="p-4">
          <p className="text-xs text-stone-500 font-sans">Loading records…</p>
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="border-stone-200">
        <CardContent className="p-4">
          <p className="text-xs text-stone-500 font-sans">No linked records found for {person.name}.</p>
        </CardContent>
      </Card>
    );
  }

  const current = records[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < records.length - 1;

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(records.length - 1, i + 1));

  return (
    <Card className="border-stone-200">
      <CardContent className="p-4 space-y-3">
        {/* Header with counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#800020]" />
            <span className="text-sm font-bold text-stone-700 font-sans">
              Records for {person.name}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {currentIndex + 1} of {records.length}
          </Badge>
        </div>

        {/* Record card */}
        <div className="rounded border border-stone-200 bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-stone-800 text-sm">
                {current.frontMatter.type || 'Record'}
                {current.frontMatter.date ? ` · ${current.frontMatter.date}` : ''}
              </div>
              <div className="text-xs text-stone-500 font-sans">
                {current.frontMatter.place || 'Place unknown'}
                {current.frontMatter.protocol ? ` · prot. ${current.frontMatter.protocol}` : ''}
              </div>
            </div>
            <Badge
              className={`text-xs ${
                current.step === 'on_familysearch'
                  ? 'bg-emerald-100 text-emerald-800'
                  : current.step === 'in_app'
                  ? 'bg-blue-100 text-blue-800'
                  : current.step === 'verified'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {STEP_WORDS[current.step] ?? current.step}
            </Badge>
          </div>

          {/* People mentioned */}
          {current.frontMatter.people && current.frontMatter.people.length > 0 && (
            <div className="text-xs text-stone-600 font-sans">
              <span className="font-medium">People:</span> {current.frontMatter.people.join(', ')}
            </div>
          )}

          {/* Record image (if available) */}
          <div className="mt-2">
            <RecordImagePreview recordId={current.id} />
          </div>

          {/* Open full record + download */}
          <div className="flex justify-end gap-2 mt-2">
            {isDev && (
              <a
                href={`/records-local/${current.id}/${current.id}.pdf?download=1`}
                className="inline-flex items-center min-h-[36px] text-xs text-[#800020] underline"
              >
                <Download className="w-3 h-3 mr-1" /> Download PDF
              </a>
            )}
            {onOpenRecord && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs min-h-[36px]"
                onClick={() => onOpenRecord(current.id)}
              >
                <ExternalLink className="w-3 h-3 mr-1" /> Open full record
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            className="text-xs min-h-[40px]"
            onClick={goPrev}
            disabled={!hasPrev}
          >
            <ChevronLeft className="w-3 h-3 mr-1" /> Previous
          </Button>
          <div className="flex gap-0.5">
            {records.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="w-8 h-8 flex items-center justify-center"
                aria-label={`Go to record ${i + 1}`}
              >
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-[#800020]' : 'bg-stone-300 hover:bg-stone-400'
                  }`}
                />
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs min-h-[40px]"
            onClick={goNext}
            disabled={!hasNext}
          >
            Next <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RecordImagePreview({ recordId }: { recordId: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`/api/record-files/${recordId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled(alive)) return;
        const files = data?.files ?? [];
        const img = files.find((f: { name: string; ext: string }) =>
          ['.jpg', '.jpeg', '.png', '.webp'].includes(f.ext?.toLowerCase())
        );
        if (img) {
          setImageUrl(img.path || `/records-local/${recordId}/${img.name}`);
        }
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [recordId]);

  if (loading) {
    return (
      <div className="h-32 bg-stone-100 rounded flex items-center justify-center">
        <ImageIcon className="w-6 h-6 text-stone-300 animate-pulse" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="h-32 bg-stone-100 rounded flex items-center justify-center text-xs text-stone-400 font-sans">
        No image available
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src={imageUrl}
        alt={`Record ${recordId}`}
        className="w-full h-48 object-contain rounded bg-stone-50"
      />
      <a
        href={imageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 bg-white/80 rounded p-2.5 text-stone-600 hover:text-[#800020]"
        aria-label="Open image larger"
      >
        <ZoomIn className="w-4 h-4" />
      </a>
    </div>
  );
}

function cancelled(alive: boolean) {
  return !alive;
}

export default PersonRecordBrowser;
