import { useState, useEffect } from 'react';
import { X, Mail, FileText, Download, ExternalLink, ShieldAlert, Clock, Info, User, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CorrespondenceMessage } from '@/pages/ResearchCentre';
import { LinkifiedText } from '@/components/LinkifiedText';

export interface MessageDetailProps {
  message: CorrespondenceMessage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUALIFIERS = ['~', 'ca.', 'c.', 'lettura incerta', '?'];
const PENDING_PROVENANCE_TEXT = 'Source provenance pending user confirmation';

export function MessageDetail({ message, open, onOpenChange }: MessageDetailProps) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<CorrespondenceMessage | null>(null);

  const activeMessage = detail ?? message;

  useEffect(() => {
    if (!open || !message?.id) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/correspondence/messages/${message.id}/detail`);
        if (!response.ok) throw new Error('Failed to fetch message detail');
        const data = await response.json();
        if (!cancelled && data?.ok && data.message) {
          setDetail(data.message);
        }
      } catch (err) {
        if (!cancelled) {
          toast({
            title: 'Error',
            description: 'Failed to load message detail',
            variant: 'destructive',
          });
        }
      }
    };
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [open, message?.id, toast]);

  if (!activeMessage) {
    return null;
  }

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const bodyType: 'text' | 'html' | 'raw' = activeMessage.body_html_path ? 'html' : activeMessage.raw_path ? 'raw' : 'text';

  const parseJsonList = (json?: string): { name?: string; email?: string }[] => {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const fromDisplay = [activeMessage.from_name, activeMessage.from_email ? `<${activeMessage.from_email}>` : null]
    .filter(Boolean)
    .join(' ');

  const toAddresses = parseJsonList(activeMessage.to_json).map((t) => t.email).filter(Boolean);
  const ccAddresses = parseJsonList(activeMessage.cc_json).map((t) => t.email).filter(Boolean);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) setDetail(null);
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-[#FAF6F0] border-stone-300 font-sans max-w-4xl">
          <DialogHeader className="border-b border-stone-200 pb-4">
            <DialogTitle className="text-2xl font-serif text-[#800020] flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-stone-900" />
              {activeMessage.subject || 'Message Details'}
            </DialogTitle>
            <DialogDescription>
              {activeMessage.account_email} · {activeMessage.gmail_message_id?.slice(0, 8)}…
            </DialogDescription>
          </DialogHeader>

          {/* Provenance section */}
          <Card className="mb-4 border-stone-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  Source Provenance
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs text-stone-600 font-sans">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-stone-400 text-xs mb-1">Account</div>
                  <div className="font-mono break-all">{activeMessage.account_email}</div>
                </div>
                <div>
                  <div className="text-stone-400 text-xs mb-1">Message ID</div>
                  <div className="font-mono break-all">{activeMessage.gmail_message_id || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-stone-400 text-xs mb-1">Thread ID</div>
                  <div className="font-mono break-all">{activeMessage.gmail_thread_id || '—'}</div>
                </div>
                <div>
                  <div className="text-stone-400 text-xs mb-1">Direction</div>
                  <div className="font-mono break-all">
                    {activeMessage.direction === 'in' ? 'Inbound' : activeMessage.direction === 'out' ? 'Outbound' : '—'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-stone-400 text-xs mb-1">From</div>
                  <div className="font-mono break-all">{fromDisplay || '—'}</div>
                </div>
                <div>
                  <div className="text-stone-400 text-xs mb-1">To</div>
                  <div className="font-mono break-all">{toAddresses.length > 0 ? toAddresses.join(', ') : '—'}</div>
                </div>
              </div>
              {ccAddresses.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-stone-400 text-xs mb-1">CC</div>
                    <div className="font-mono break-all">{ccAddresses.join(', ')}</div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-stone-400 text-xs mb-1">Received</div>
                  <div className="font-mono break-all">{formatDate(activeMessage.received_at)}</div>
                </div>
                <div>
                  <div className="text-stone-400 text-xs mb-1">Sent</div>
                  <div className="font-mono break-all">{activeMessage.sent_at ? formatDate(activeMessage.sent_at) : '—'}</div>
                </div>
              </div>
              <div>
                <div className="text-stone-400 text-xs mb-1">Genealogy Relevance</div>
                <div>
                  <Badge variant={activeMessage.genealogy_relevance === 'definite' ? 'secondary' : 'outline'} className="text-xs">
                    {activeMessage.genealogy_relevance || 'Unreviewed'}
                  </Badge>
                </div>
              </div>
              {activeMessage.message_type && (
                <div className="mt-3 pt-3 border-t border-stone-200">
                  <div className="text-stone-400 text-xs mb-1">Message Type</div>
                  <Badge variant="outline" className="text-xs">
                    {activeMessage.message_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
              )}
              {activeMessage.action_status && (
                <div className="mt-2 pt-2 border-t border-stone-200">
                  <div className="text-stone-400 text-xs mb-1">Action Status</div>
                  <Badge variant="outline" className="text-xs">
                    {activeMessage.action_status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              )}
              {activeMessage.attachment_count !== undefined && activeMessage.attachment_count > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-200">
                  <div className="text-stone-400 text-xs mb-1">Attachments</div>
                  <div className="font-mono break-all">
                    {activeMessage.attachment_count} attachments
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Body / Content section */}
          {activeMessage.body_text || activeMessage.body_html_path || activeMessage.raw_path ? (
            <Card className="mb-4 border-stone-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Content
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-sm text-stone-700 break-all">
                {bodyType === 'html' && activeMessage.body_html_path ? (
                  <div
                    className="prose prose-sm max-w-full"
                    dangerouslySetInnerHTML={{ __html: `Loading body from: ${activeMessage.body_html_path}` }}
                  />
                ) : bodyType === 'raw' && activeMessage.raw_path ? (
                  <pre
                    className="mt-2 bg-white p-3 rounded border border-stone-200 text-xs text-stone-500 break-all"
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {activeMessage.raw_path}
                  </pre>
                ) : activeMessage.body_text ? (
                  <p className="whitespace-pre-wrap">{activeMessage.body_text}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-4 border-stone-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-stone-400" />
                  Content
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-stone-400 font-sans">
                <p>No email body available. The message contains only metadata and provenance information.</p>
                <p className="mt-2 text-xs text-stone-500">The raw JSON payload is stored at: <code>{activeMessage.raw_path || 'not available'}</code></p>
              </CardContent>
            </Card>
          )}

          {/* Attachment metadata section */}
          {activeMessage.attachments && activeMessage.attachments.length > 0 ? (
            <Card className="mt-4 border-stone-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Attachments ({activeMessage.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs text-stone-600 font-sans">
                {activeMessage.attachments.map((att, i) => (
                  <div key={i} className="mb-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center flex-shrink-0 font-mono text-[10px]">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-stone-800 line-clamp-1">{att.filename || 'unknown'}</div>
                      <div className="text-[10px] text-stone-400 line-clamp-1">
                        {att.mime_type || 'unknown/mimetype'} · {att.size_bytes ? `${(att.size_bytes / 1024).toFixed(1)} KB` : '—'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {att.unavailable ? (
                        <span className="text-[10px] text-red-600">
                          Unavailable{att.unavailable_reason ? `: ${att.unavailable_reason}` : ''}
                        </span>
                      ) : att.downloaded ? (
                        <>
                          <a
                            href={`/api/correspondence/attachments/${att.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#800020] underline"
                          >
                            Open
                          </a>
                          <a
                            href={`/api/correspondence/attachments/${att.id}?download=1`}
                            className="text-[10px] text-stone-500 underline"
                          >
                            Download
                          </a>
                        </>
                      ) : att.gmail_attachment_id ? (
                        <span className="text-[10px] text-amber-600">
                          Not downloaded (Gmail: {att.gmail_attachment_id.slice(0, 8)}…)
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400">Unknown</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {/* Source provenance expanded view */}
          <Card className="mt-4 border-stone-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                Full Provenance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs text-stone-600 font-sans break-all">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-stone-400 text-xs mb-1">Gmail Account</div>
                  <div className="font-mono break-all">{activeMessage.account_email}</div>
                </div>
                <div>
                  <div className="text-stone-400 text-xs mb-1">Message ID</div>
                  <div className="font-mono break-all">{activeMessage.gmail_message_id || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-stone-400 text-xs mb-1">Thread ID</div>
                  <div className="font-mono break-all">{activeMessage.gmail_thread_id || '—'}</div>
                </div>
                <div>
                  <div className="text-stone-400 text-xs mb-1">Direction</div>
                  <div className="font-mono break-all">
                    {activeMessage.direction === 'in' ? 'Inbound' : activeMessage.direction === 'out' ? 'Outbound' : '—'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-stone-400 text-xs mb-1">Subject</div>
                  <div className="font-mono break-all">{activeMessage.subject || '(no subject)'}</div>
                </div>
                <div>
                  <div className="text-stone-400 text-xs mb-1">Received At</div>
                  <div className="font-mono break-all">{activeMessage.received_at || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-stone-400 text-xs mb-1">Message Type</div>
                  <div className="font-mono break-all">{activeMessage.message_type || '—'}</div>
                </div>
                <div>
                  <div className="text-stone-400 text-xs mb-1">Action Status</div>
                  <div className="font-mono break-all">{activeMessage.action_status || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-stone-400 text-xs mb-1">Genealogy Relevance</div>
                  <div>
                    <Badge variant={activeMessage.genealogy_relevance === 'definite' ? 'secondary' : 'outline'} className="text-xs">
                      {activeMessage.genealogy_relevance || 'Unreviewed'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-stone-400 text-xs mb-1">Attachment Count</div>
                  <div className="font-mono break-all">{activeMessage.attachment_count || 0}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-stone-200">
                <div className="text-stone-400 text-xs mb-1">Notes</div>
                <div className="font-mono break-all text-stone-500">
                  This evidence record originates from a Gmail import of two email accounts.
                  All classification data is stored locally in the SQLite database (.local/correspondence.db).
                  The message can be located in Gmail using the provided account_email and gmail_message_id.
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        className="mb-4 text-sm font-medium text-stone-700"
        onClick={() => onOpenChange(true)}
      >
        View Message Details
      </Button>
    </div>
  );
}
