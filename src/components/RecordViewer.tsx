import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, AlertCircle, Maximize, ExternalLink, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface RecordViewerProps {
  recordId: string;
  sticky?: boolean; // when true, the panel stays fixed while the list scrolls
}

interface RecordFile {
  name: string;
  path: string;
  ext: string;
}

interface PanZoomState {
  scale: number;
  tx: number;
  ty: number;
  isDragging: boolean;
  startX: number;
  startY: number;
  startTx: number;
  startTy: number;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;

export function RecordViewer({ recordId, sticky = false }: RecordViewerProps) {
  const [files, setFiles] = useState<RecordFile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);

  // Pan/zoom state
  const [pz, setPz] = useState<PanZoomState>({
    scale: 1,
    tx: 0,
    ty: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clamp scale
  const clampScale = (s: number) => Math.min(Math.max(s, MIN_SCALE), MAX_SCALE);

  // Reset pan/zoom when a new file is selected
  useEffect(() => {
    setPz({ scale: 1, tx: 0, ty: 0, isDragging: false, startX: 0, startY: 0, startTx: 0, startTy: 0 });
  }, [selected]);

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

  // -------- Pan/Zoom handlers --------
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isImage) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setPz((prev) => {
        const newScale = clampScale(prev.scale + delta);
        // Zoom toward cursor position
        const rect = imgRef.current?.getBoundingClientRect();
        if (!rect) return { ...prev, scale: newScale };
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomFactor = newScale / prev.scale;
        const newTx =
          prev.tx - (mouseX - prev.tx) * (zoomFactor - 1);
        const newTy =
          prev.ty - (mouseY - prev.ty) * (zoomFactor - 1);
        return {
          ...prev,
          scale: newScale,
          tx: newTx,
          ty: newTy,
        };
      });
    },
    [isImage]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isImage || pz.scale <= 1) return;
      setPz((prev) => ({
        ...prev,
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startTx: prev.tx,
        startTy: prev.ty,
      }));
    },
    [isImage, pz.scale]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      setPz((prev) => {
        if (!prev.isDragging) return prev;
        const dx = e.clientX - prev.startX;
        const dy = e.clientY - prev.startY;
        return {
          ...prev,
          tx: prev.startTx + dx,
          ty: prev.startTy + dy,
        };
      });
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    setPz((prev) => ({ ...prev, isDragging: false }));
  }, []);

  const zoomIn = () => {
    setPz((prev) => ({ ...prev, scale: clampScale(prev.scale + SCALE_STEP) }));
  };

  const zoomOut = () => {
    setPz((prev) => ({ ...prev, scale: clampScale(prev.scale - SCALE_STEP) }));
  };

  const resetView = () => {
    setPz({ scale: 1, tx: 0, ty: 0, isDragging: false, startX: 0, startY: 0, startTx: 0, startTy: 0 });
  };

  const toggleFullScreen = () => {
    setFullScreen((prev) => !prev);
  };

  const openInNewTab = () => {
    if (selectedFile) {
      window.open(selectedFile.path, "_blank");
    }
  };

  // Global drag listeners (so dragging continues outside the image)
  useEffect(() => {
    if (!pz.isDragging) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pz.isDragging, handleMouseMove, handleMouseUp]);

  const panelClass = sticky
    ? "sticky top-0 z-10 bg-white border-b border-stone-200"
    : "";

  return (
    <>
      {/* Full-screen modal */}
      {fullScreen && selectedFile && isImage && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onClick={() => setFullScreen(false)}
        >
          <div className="absolute top-4 right-4 flex gap-2 bg-white/10 backdrop-blur p-2 rounded">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(selectedFile.path, "_blank");
              }}
            >
              <ExternalLink className="w-4 h-4 mr-1" /> Open in new tab
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setFullScreen(false);
              }}
            >
              <RotateCcw className="w-4 h-4" /> Close
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <img
              src={fileUrl}
              alt={selectedFile.name}
              className="max-w-full max-h-full object-contain cursor-pointer"
              onClick={() => setFullScreen(false)}
            />
          </div>
        </div>
      )}

      {/* Main card */}
      <Card className={`border-stone-200 flex flex-col h-full ${panelClass}`}>
        <CardHeader className="flex items-center justify-between gap-2 bg-white/80 backdrop-blur sticky top-0 z-10 px-4 py-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider">
            Document Image
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              disabled={!selectedFile}
            >
              <ExternalLink className="w-3 h-3 mr-1" /> Open in new tab
            </Button>
            {isImage && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomOut}
                  disabled={pz.scale <= MIN_SCALE}
                >
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomIn}
                  disabled={pz.scale >= MAX_SCALE}
                >
                  <ZoomIn className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetView}
                  disabled={pz.scale === 1 && pz.tx === 0 && pz.ty === 0}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
                {pz.scale > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullScreen}
                    className="border-transparent hover:bg-white/20"
                  >
                    <Maximize className="w-3 h-3" />
                  </Button>
                )}
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 relative overflow-hidden">
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
            <div className="flex-1 relative overflow-hidden bg-stone-100">
              {/* Thumbnail strip (horizontal, only if multiple files) */}
              {files.length > 1 && !fullScreen && (
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-white/90 border-t border-stone-200 flex items-center gap-1 px-2 overflow-x-auto z-10">
                  {files.map((f) => {
                    const isSel = f.name === selected;
                    return (
                      <img
                        key={f.name}
                        src={f.path}
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
              <div
                className="flex-1 flex items-center justify-center relative"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                style={{
                  cursor:
                    pz.scale > 1 ? "grabbing" : isImage ? "crosshair" : "default",
                }}
              >
                {isPdf ? (
                  <iframe
                    src={fileUrl}
                    className="w-full h-full rounded border border-stone-200"
                    title="Document PDF"
                  />
                ) : (
                  <div
                    className="flex items-center justify-center w-full h-full"
                  >
                    <img
                      ref={imgRef}
                      src={fileUrl}
                      alt={selectedFile.name}
                      className="max-w-full max-h-full object-contain cursor-pointer rounded border border-stone-200"
                      style={{
                        transform: `scale(${pz.scale}) translate(${pz.tx}px, ${pz.ty}px)`,
                        transformOrigin: "center center",
                      }}
                      onClick={
                        pz.scale > 1 ? toggleFullScreen : undefined
                      }
                      onError={(e) => {
                        setError(`Failed to load image: ${selectedFile.name}`);
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
