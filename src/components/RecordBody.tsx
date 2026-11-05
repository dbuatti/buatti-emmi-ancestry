import { Badge } from '@/components/ui/badge';
import { LinkifiedText } from '@/components/LinkifiedText';
import type { RecordFrontMatter } from '@/types/record';
import {
  parseTranscriptionLines,
  TranscriptionLine,
} from '@/lib/record-lines';

interface RecordBodyProps {
  record: RecordFrontMatter;
  body: string;
}

export function RecordBody({ record, body }: RecordBodyProps) {
  const lines = parseTranscriptionLines(body);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge variant="outline">{record.type}</Badge>
        {record.comune && <Badge variant="outline">{record.comune}</Badge>}
        {record.year && <Badge variant="outline">{record.year}</Badge>}
        {record.atto && <Badge variant="outline">Atto {record.atto}</Badge>}
        {record.source_office && <Badge variant="outline">{record.source_office}</Badge>}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
          Transcription
        </h3>
        <div className="bg-[#FAF6F0] border border-stone-200 rounded p-3 text-stone-700 leading-relaxed whitespace-pre-wrap break-words font-serif text-sm">
          {lines.length > 0 ? (
            <div className="space-y-3">
              {/* English first */}
              <div className="mb-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  English translation (AI)
                </span>
                {lines.map((line) => (
                  <div key={line.id} className="text-stone-600 leading-relaxed mb-1">
                    {line.enLabel && line.enValue ? (
                      <>
                        <span className="font-bold">{line.enLabel}:</span>{' '}
                        <span className="italic">{line.enValue}</span>
                      </>
                    ) : (
                      <span className="italic">{line.value}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-200 pt-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Italian original
                </span>
                {lines.map((line) => (
                  <div key={line.id} className="text-stone-700 leading-relaxed mb-1 font-serif">
                    <span className="font-bold">{line.label}:</span>{' '}
                    <span
                      className={`break-words ${
                        line.uncertain ? 'bg-amber-100 text-amber-800 underline decoration-amber-400' : ''
                      }`}
                    >
                      {line.value}
                    </span>
                    {line.uncertain && (
                      <span className="ml-1 text-[10px] text-amber-600">[?]</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            body
          )}
        </div>
      </div>

      {record.people && record.people.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">People</h3>
          <div className="flex flex-wrap gap-1">
            {record.people.map((pid) => (
              <Badge key={pid} variant="secondary">
                {pid}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
