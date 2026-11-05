import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image } from 'lucide-react';

interface RecordViewerProps {
  recordId: string;
}

export function RecordViewer({ recordId }: RecordViewerProps) {
  const imagePath = `/records-local/${recordId}/`;

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-xs font-bold uppercase tracking-wider">Document Image</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-4 h-96 bg-[#FAF6F0] border-b border-stone-200">
        {import.meta.env.DEV ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={imagePath}
              alt="Document image"
              className="max-w-full max-h-full object-contain border border-stone-200 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute bottom-2 right-2 text-[10px] text-stone-400 bg-white/80 px-2 py-1 rounded">
              Local only
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <Image className="w-8 h-8 text-stone-300 mb-2" />
            <p className="text-xs text-stone-500">
              Original document images are local-only. Transcription available below.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
