import { useState, useEffect } from 'react';
import { X, Mail, FileText, Download, ExternalLink, Clock, User, Paperclip, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { LinkifiedText } from '@/components/LinkifiedText';

export interface ThreadMessage {
  id: number;
  direction: 'in' | 'out';
  from_name?: string;
  from_email?: string;
  to_json?: string;
  subject?: string;
  received_at?: string;
  sent_at?: string;
  body_text?: string;
  snippet?: string;
  account_email?: string;
  message_type?: string;
  action_status?: string;
  genealogy_relevance?: string;
  attachments?: ThreadAttachment[];
  attachment_count?: number;
}

export interface ThreadAttachment {
  id: number;
  filename?: string;
  safe_filename?: string;
  mime_type?: string;
  size_bytes?: number;
  gmail_attachment_id?: string;
  downloaded?: boolean;
  unavailable?: number | boolean;
  unavailable_reason?: string;
}

export interface ThreadReaderProps {
  threadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}


function decodeHtmlEntities(s: string): string {
  if (typeof document === 'undefined') return s;
  const t = document.createElement('textarea');
  t.innerHTML = s;
  return t.value;
}

function splitQuotedLines(text: string): { kind: 'text' | 'quote'; lines: string[] }[] {
  const lines = text.split('\n');
  const blocks: { kind: 'text' | 'quote'; lines: string[] }[] = [];
  let cur: { kind: 'text' | 'quote'; lines: string[] } | null = null;
  for (const line of lines) {
    const isQuote = /^\s*>/.test(line);
    const kind = isQuote ? 'quote' : 'text';
    if (!cur || cur.kind !== kind) {
      cur = { kind, lines: [] };
      blocks.push(cur);
    }
    cur.lines.push(line);
  }
  return blocks.filter((b) => b.lines.some((l) => l.trim() !== ''));
}

function parseJsonList(json?: string): { name?: string; email?: string }[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ThreadReader({ threadId, open, onOpenChange }: ThreadReaderProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [expandedQuotes, setExpandedQuotes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !threadId) {
      setMessages([]);
      setError(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/correspondence/threads/${encodeURIComponent(threadId)}/messages`);
        if (!res.ok) throw new Error('Failed to load thread');
        const data = await res.json();
        if (!cancelled) setMessages(data.messages || []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          toast({ title: 'Error', description: 'Failed to load thread messages', variant: 'destructive' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open, threadId, toast]);

  const subject = messages[0]?.subject || '(no subject)';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FAF6F0] border-stone-300 font-sans max-w-5xl max-h-[90vh]">
        <DialogHeader className="border-b border-stone-200 pb-3">
          <DialogTitle className="text-xl font-serif text-[#800020] flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {subject}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs break-all flex items-center gap-2 flex-wrap">
            Thread: {threadId || '—'} · {messages.length} message{messages.length === 1 ? '' : 's'}
            {threadId && (
              <Button size="sm" variant="outline" className="ml-2 h-6 px-2 text-xs" onClick={async () => {
                try {
                  const res = await fetch(`/api/correspondence/threads/${encodeURIComponent(threadId)}/close`, { method: 'POST' });
                  if (!res.ok) throw new Error('close failed');
                  toast({ title: 'Thread closed', description: 'Marked completed + thank-you draft generated.' });
                  onOpenChange(false);
                } catch (e) {
                  toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
                }
              }}>
                Close thread
              </Button>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]" />
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600">Error loading thread: {error}</p>
              </CardContent>
            </Card>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-stone-500 font-sans">
              <Mail className="w-10 h-10 opacity-30 mb-2" />
              <p>No messages in this thread.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const toAddresses = parseJsonList(m.to_json).map((t) => t.email).filter(Boolean);
                const isInbound = m.direction === 'in';
                return (
                  <Card key={m.id} className="border-stone-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <Badge variant="outline" className="text-[10px]">
                              {isInbound ? 'Inbound' : 'Outbound'}
                            </Badge>
                            <span>{formatDate(m.received_at || m.sent_at)}</span>
                            {m.account_email && <span className="font-mono">· {m.account_email}</span>}
                          </div>
                          <div className="mt-1 text-sm font-medium text-stone-800">
                            <User className="w-3 h-3 inline mr-1" />
                            {m.from_name || m.from_email || '—'}
                            {m.from_email && m.from_name ? ` <${m.from_email}>` : ''}
                          </div>
                          {toAddresses.length > 0 && (
                            <div className="text-xs text-stone-500">To: {toAddresses.join(', ')}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {m.message_type && (
                            <Badge variant="outline" className="text-[10px]">{m.message_type.replace(/_/g, ' ')}</Badge>
                          )}
                          {m.genealogy_relevance && (
                            <Badge variant="secondary" className="text-[10px]">{m.genealogy_relevance}</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {/* Body */}
                      {m.body_text && m.body_text.trim() ? (
                        <div className="text-sm text-stone-700 break-words space-y-2">
                          {splitQuotedLines(decodeHtmlEntities(m.body_text)).map((block, bi) => {
                            if (block.kind === 'text') {
                              const text = block.lines.join('\n').trim();
                              if (!text) return null;
                              return (
                                <div key={bi} className="whitespace-pre-wrap">
                                  <LinkifiedText text={text} />
                                </div>
                              );
                            }
                            const quoteText = block.lines.map((l) => l.replace(/^\s*>\s?/, '')).join('\n').trim();
                            const isExpanded = expandedQuotes.has(m.id);
                            return (
                              <div key={bi} className="border-l-2 border-stone-300 pl-3">
                                <button
                                  type="button"
                                  className="text-xs text-stone-500 hover:text-stone-700 underline"
                                  onClick={() =>
                                    setExpandedQuotes((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(m.id)) next.delete(m.id);
                                      else next.add(m.id);
                                      return next;
                                    })
                                  }
                                >
                                  {isExpanded ? 'Hide quoted text' : `Show quoted text (${block.lines.length} line${block.lines.length === 1 ? '' : 's'})`}
                                </button>
                                {isExpanded && (
                                  <div className="mt-1 text-xs text-stone-500 whitespace-pre-wrap italic">
                                    <LinkifiedText text={quoteText} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-stone-400 italic">
                          No email body available. Only metadata/provenance is stored for this message.
                          {m.snippet ? <div className="mt-2 text-xs text-stone-500 not-italic">Snippet: {m.snippet}</div> : null}
                        </div>
                      )}

                      {/* Attachments */}
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-200">
                          <div className="text-xs font-medium text-stone-600 mb-2 flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            Attachments ({m.attachments.length})
                          </div>
                          <div className="space-y-2">
                            {m.attachments.map((att) => {
                              const isDownloaded = Boolean(att.downloaded);
                              const isUnavailable = Boolean(att.unavailable);
                              const attUrl = `/api/correspondence/attachments/${att.id}`;
                              return (
                                <div key={att.id} className="flex items-center justify-between gap-2 p-2 rounded border border-stone-200 bg-white">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-medium text-stone-800 truncate" title={att.filename}>
                                      {att.filename || 'unknown'}
                                    </div>
                                    <div className="text-[10px] text-stone-500">
                                      {att.mime_type || 'unknown'} · {att.size_bytes ? `${(att.size_bytes / 1024).toFixed(1)} KB` : '—'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {isUnavailable ? (
                                      <Badge variant="outline" className="text-[10px] text-red-700 border-red-300">
                                        Unavailable{att.unavailable_reason ? `: ${att.unavailable_reason}` : ''}
                                      </Badge>
                                    ) : isDownloaded ? (
                                      <>
                                        <Badge variant="outline" className="text-[10px] text-green-700 border-green-300">Downloaded</Badge>
                                        <a href={attUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#800020] underline">Open</a>
                                        <a href={`${attUrl}?download=1`} className="text-xs text-[#800020] underline">Download</a>
                                      </>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">
                                        Not downloaded{att.gmail_attachment_id ? ` (Gmail: ${att.gmail_attachment_id.slice(0, 8)}…)` : ''}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
