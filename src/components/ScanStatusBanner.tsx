import { useEffect, useState } from 'react';
import { MailCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export interface ScanInfo {
  account_email: string;
  last_scan_at: string | null;
  last_scan_status: string;
  last_error: string | null;
}

export function ScanStatusBanner() {
  const { toast } = useToast();
  const [scan, setScan] = useState<ScanInfo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/correspondence/health');
      const json = await res.json();
      setScan((json?.scan as ScanInfo[]) ?? []);
    } catch {
      setScan([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/correspondence/detect-new', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      toast({ title: 'Scan complete', description: `${json?.new_messages ?? 0} new message(s) surfaced` });
    } catch {
      toast({ title: 'Scan failed', description: 'Could not run detection', variant: 'destructive' });
    } finally {
      setScanning(false);
      await refresh();
    }
  };

  if (loading) {
    return (
      <div className="mb-4 rounded-xl border border-stone-200 bg-[#F4EFE6] px-4 py-3 text-xs text-stone-500 font-sans">
        Checking last Gmail scan…
      </div>
    );
  }

  const latest = scan && scan.length > 0
    ? [...scan].sort((a, b) => (b.last_scan_at || '').localeCompare(a.last_scan_at || ''))[0]
    : null;
  const ok = latest ? latest.last_scan_status === 'ok' : false;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-[#F4EFE6] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${latest && ok ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        <MailCheck className="w-4 h-4 text-[#800020]" />
        <p className="text-xs font-sans text-stone-700">
          {latest?.last_scan_at ? (
            <>
              Last Gmail scan:{' '}
              <span className="font-medium">{new Date(latest.last_scan_at).toLocaleString()}</span>{' '}
              <span className={latest.last_scan_status === 'ok' ? 'text-emerald-700' : 'text-amber-800'}>
                ({latest.last_scan_status})
              </span>
            </>
          ) : (
            'No Gmail scan yet.'
          )}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={runScan} disabled={scanning}>
        <RefreshCw className={`w-3 h-3 mr-1 ${scanning ? 'animate-spin' : ''}`} />
        {scanning ? 'Scanning…' : 'Re-scan now'}
      </Button>
    </div>
  );
}
