import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface IntegrityIssue {
  id: number;
  issue: string;
  detail: string;
}

interface IntegrityAttachment {
  id: number;
  filename: string;
  message_id: number;
  status: string;
  issues: string[];
}

interface IntegrityResult {
  total: number;
  downloaded: number;
  unavailable: number;
  not_downloaded: number;
  passed: number;
  failed: number;
  issues: IntegrityIssue[];
  attachments: IntegrityAttachment[];
}

export function AttachmentIntegrityCheck() {
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/correspondence/attachment-integrity');
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Check failed');
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-emerald-100 text-emerald-800';
      case 'warning': return 'bg-amber-100 text-amber-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'unavailable': return 'bg-stone-100 text-stone-600';
      case 'not_downloaded': return 'bg-amber-100 text-amber-800';
      default: return 'bg-stone-100 text-stone-600';
    }
  };

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Attachment Integrity Check
          <Button size="sm" variant="outline" className="text-xs ml-auto" onClick={runCheck} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ShieldCheck className="w-3 h-3 mr-1" />}
            {loading ? 'Checking…' : 'Re-check'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {error && (
          <p className="text-xs text-red-600 font-sans">{error}</p>
        )}
        {loading && !result && (
          <p className="text-xs text-stone-500 font-sans">Running integrity check…</p>
        )}
        {result && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded border border-stone-200 p-2 text-center">
                <div className="text-lg font-bold text-stone-800">{result.total}</div>
                <div className="text-[10px] text-stone-500 font-sans">Total</div>
              </div>
              <div className="rounded border border-emerald-200 p-2 text-center bg-emerald-50">
                <div className="text-lg font-bold text-emerald-700">{result.passed}</div>
                <div className="text-[10px] text-emerald-600 font-sans">Passed</div>
              </div>
              <div className="rounded border border-red-200 p-2 text-center bg-red-50">
                <div className="text-lg font-bold text-red-700">{result.failed}</div>
                <div className="text-[10px] text-red-600 font-sans">Failed</div>
              </div>
              <div className="rounded border border-stone-200 p-2 text-center">
                <div className="text-lg font-bold text-stone-600">{result.not_downloaded + result.unavailable}</div>
                <div className="text-[10px] text-stone-500 font-sans">Not downloaded / Unavailable</div>
              </div>
            </div>

            {/* Issues list */}
            {result.issues.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Issues ({result.issues.length})
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-stone-200 rounded p-2 bg-white">
                  {result.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <Badge className="text-[9px] bg-red-100 text-red-800 shrink-0">
                        #{issue.id}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-stone-700">{issue.issue}:</span>{' '}
                        <span className="text-stone-600">{issue.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.issues.length === 0 && result.downloaded > 0 && (
              <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 font-sans flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> All downloaded attachments passed integrity check.
              </div>
            )}

            {/* Status breakdown */}
            <div className="text-[10px] text-stone-400 font-sans">
              Downloaded: {result.downloaded} · Unavailable: {result.unavailable} · Not downloaded: {result.not_downloaded}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AttachmentIntegrityCheck;
