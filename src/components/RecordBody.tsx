import { Badge } from '@/components/ui/badge';
import { LinkifiedText } from '@/components/LinkifiedText';
import type { RecordFrontMatter } from '@/types/record';

interface RecordBodyProps {
  record: RecordFrontMatter;
  body: string;
}

export function RecordBody({ record, body }: RecordBodyProps) {
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
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Italian transcription</h3>
        <div className="bg-[#FAF6F0] border border-stone-200 rounded p-3 text-stone-700 leading-relaxed whitespace-pre-wrap break-words font-serif text-sm">
          {body}
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
