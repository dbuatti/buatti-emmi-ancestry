import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, AlertCircle } from "lucide-react";
import { parseRecordMarkdown } from "@/lib/records";

interface RecordViewerProps {
  recordId: string;
}

interface RecordFile {
  name: string;
  path: string;
  ext: string;
}

export function RecordViewer({ recordId }: RecordViewerProps) {
  const [files, setFiles] = useState<RecordFile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/record-files/${recordId}`);
        if (!res.ok) {
          throw new Error(`Failed to list files: ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        setFiles(data.files);
        if (data.files.length > 0) {
          setSelected(data.files[0].name);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e.message);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recordId]);

  const selectedFile = files.find((f) => f.name === selected);
  const isPdf = selectedFile?.ext === ".pdf";
  const isImage = [".jpg", ".jpeg", ".png", ".webp"].includes(
    selectedFile?.ext || ""
  );

  const fileUrl = selectedFile ? selectedFile.path : "";

  return (
    <Card className="border-stone-200 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-xs font-bold uppercase tracking-wider">
          Document Image
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col bg-[#FAF6F0] border-b border-stone-200 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 animate-spin text-stone-400" />
              <span className="text-xs text-stone-500">Loading…</span>
            </div>
          </div>
        )}
        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3 max-w-xs">
              {error}
            </p>
          </div>
        )}
        {!loading && !error && files.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <ImageIcon className="w-10 h-10 text-stone-300 mb-2" />
            <p className="text-xs text-stone-500">
              No local files for this record
            </p>
          </div>
        )}
        {!loading && !error && files.length > 0 && selectedFile && (
          <div className="flex-1 relative overflow-auto">
            {/* Thumbnail strip (horizontal, only if multiple files) */}
            {files.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-white/90 border-t border-stone-200 flex items-center gap-1 px-2 overflow-x-auto">
                {files.map((f) => {
                  const isSel = f.name === selected;
                  const imgUrl = f.path;
                  return (
                    <img
                      key={f.name}
                      src={imgUrl}
                      alt={f.name}
                      className={`h-8 w-10 rounded border-2 cursor-pointer ${
                        isSel
                          ? "border-[#800020]"
                          : "border-transparent hover:border-stone-400"
                      } object-cover`}
                      onClick={() => setSelected(f.name)}
                    />
                  );
                })}
              </div>
            )}
            {/* Main view */}
            <div className="flex flex-col items-center justify-center h-full p-2">
              {isPdf ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-full max-h-[600px] rounded border border-stone-200"
                  title="Document PDF"
                />
              ) : (
                <img
                  src={fileUrl}
                  alt={selectedFile.name}
                  className="max-w-full max-h-[600px] rounded border border-stone-200 object-contain cursor-pointer"
                  onError={(e) => {
                    setError(`Failed to load image: ${selectedFile.name}`);
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
