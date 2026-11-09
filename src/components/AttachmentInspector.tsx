import { useEffect, useState } from 'react';
import { FileText, Eye, Link2, AlertTriangle, CheckCircle2, HelpCircle, Download, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { initialPeople } from '@/data/familyDataWrapper';
import { getAllRecords } from '@/lib/record-loader';
import type { RecordEntry } from '@/lib/record-loader';

interface AttachmentGateRecord {
  attachment_id: number;
  filename: string;
  safe_filename?: string;
  mime_type?: string;
  size_bytes?: number;
  kind?: string;
  status?: string;
  method?: string;
  chars?: number;
  pages?: number;
  confidence?: number;
  text_path?: string;
  page_images?: string;
  notes?: string;
  requires_visual_review?: boolean;
  unverified?: boolean;
}

interface AttachmentGateData {
  messages?: Record<string, {
    gate_status?: string;
    blocks_no_action?: boolean;
    requires_human_review?: boolean;
    fulfilment?: string;
    attachments?: AttachmentGateRecord[];
    ungated_messages_with_attachments?: number[];
  }>;
}

interface Attachment {
  id?: number;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  local_path?: string;
  downloaded?: boolean;
  unavailable?: boolean;
  unavailable_reason?: string;
  gmail_attachment_id?: string;
}

const STATUS_COLORS: Record<string, string> = {
  text_extracted: 'bg-emerald-100 text-emerald-800',
  ocr_extracted: 'bg-emerald-100 text-emerald-800',
  ocr_low_confidence: 'bg-amber-100 text-amber-800',
  needs_visual_review: 'bg-amber-100 text-amber-800',
  unreadable: 'bg-red-100 text-red-800',
  not_downloaded: 'bg-red-100 text-red-800',
  not_a_document: 'bg-stone-100 text-stone-600',
  unsupported: 'bg-stone-100 text-stone-600',
};

const STATUS_LABELS: Record<string, string> = {
  text_extracted: 'Text extracted',
  ocr_extracted: 'OCR extracted',
  ocr_low_confidence: 'OCR low confidence',
  needs_visual_review: 'Needs visual review',
  unreadable: 'Unreadable',
  not_downloaded: 'Not downloaded',
  not_a_document: 'Not a document',
  unsupported: 'Unsupported format',
};

const STATUS_EXPLANATIONS: Record<string, string> = {
  text_extracted: 'Text layer extracted successfully — readable and searchable.',
  ocr_extracted: 'Text recognised via OCR with good confidence — readable.',
  ocr_low_confidence: 'OCR text recognised but confidence is low — verify visually.',
  needs_visual_review: 'No text layer; requires manual visual review.',
  unreadable: 'Could not extract text — open the file and read it manually.',
  not_downloaded: 'Attachment not on disk; download was skipped or failed.',
  not_a_document: 'Envelope/receipt/signature — not a research document.',
  unsupported: 'No local extractor for this format.',
};

export function AttachmentInspector({ messageId }: { messageId: number }) {
  const [gate, setGate] = useState<AttachmentGateData['messages'] extends Record<string, infer V> ? V : null>(null);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkedPerson, setLinkedPerson] = useState<string>('');
  const [linkedRecord, setLinkedRecord] = useState<string>('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      fetch(`/api/correspondence/attachment-gate/${messageId}`).then((r) => r.json()).catch(() => ({ ok: true, gate: null })),
      getAllRecords().then((r) => r).catch(() => []),
    ]).then(([gateRes, recs]) => {
      if (!alive) return;
      setGate(gateRes?.gate ?? null);
      setRecords(recs);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [messageId]);

  if (loading) {
    return (
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Attachment Inspector
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-xs text-stone-500 font-sans">Loading attachment gate data…</p>
        </CardContent>
      </Card>
    );
  }

  const atts = gate?.attachments ?? [];
  const gateStatus = gate?.gate_status ?? 'unknown';

  // Self-doubting cross-reference suggestions
  const suggestions: string[] = [];
  if (atts.some((a) => a.status === 'unreadable' || a.status === 'not_downloaded')) {
    suggestions.push('Some attachments are unreadable or not downloaded — consider re-downloading or opening the file manually.');
  }
  if (atts.some((a) => a.status === 'ocr_low_confidence')) {
    suggestions.push('OCR confidence is low on some documents — verify the extracted text against the original image.');
  }
  if (atts.some((a) => a.status === 'needs_visual_review')) {
    suggestions.push('Some attachments need visual review — open the file and check dates/names against the record.');
  }
  if (!gate || atts.length === 0) {
    suggestions.push('No attachment gate data yet — run the attachment gate script to assess readability.');
  }
  if (atts.some((a) => a.status === 'text_extracted' || a.status === 'ocr_extracted')) {
    suggestions.push('Extracted text available — cross-check names/dates against FamilySearch or BDM indexes for additional perspective.');
  }

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Attachment Inspector
          {gateStatus !== 'unknown' && (
            <Badge variant="outline" className="text-xs ml-2">
              Gate: {gateStatus}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Readability summary */}
        {atts.length === 0 ? (
          <p className="text-xs text-stone-500 font-sans">No attachment gate data for this message.</p>
        ) : (
          <div className="space-y-3">
            {atts.map((att, i) => {
              const status = att.status ?? 'unknown';
              const colorClass = STATUS_COLORS[status] ?? 'bg-stone-100 text-stone-600';
              const label = STATUS_LABELS[status] ?? status;
              const explanation = STATUS_EXPLANATIONS[status] ?? 'Unknown status.';

              return (
                <div key={i} className="rounded border border-stone-200 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-stone-800 text-xs line-clamp-1">{att.filename || 'unknown'}</div>
                      <div className="text-[10px] text-stone-400">
                        {att.mime_type || 'unknown'} · {att.size_bytes ? `${(att.size_bytes / 1024).toFixed(1)} KB` : '—'}
                        {att.pages ? ` · ${att.pages} pages` : ''}
                        {att.chars ? ` · ${att.chars} chars` : ''}
                        {att.confidence ? ` · ${Math.round(att.confidence * 100)}% conf.` : ''}
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${colorClass}`}>{label}</Badge>
                  </div>

                  <p className="text-[10px] text-stone-500 font-sans">{explanation}</p>
                  {att.notes && (
                    <p className="text-[10px] text-stone-400 font-sans italic">{att.notes}</p>
                  )}

                  {/* Extracted text preview */}
                  {att.text_path && (
                    <div className="mt-2">
                      <a
                        href={`/api/correspondence/attachments/${att.attachment_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#800020] underline flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Open extracted text
                      </a>
                    </div>
                  )}

                  {/* Link to person/record */}
                  <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-stone-100">
                    <select
                      className="text-[10px] rounded border border-stone-300 bg-white px-2 py-1 font-sans"
                      value={linkedPerson}
                      onChange={(e) => setLinkedPerson(e.target.value)}
                    >
                      <option value="">Link to person…</option>
                      {initialPeople.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="text-[10px] rounded border border-stone-300 bg-white px-2 py-1 font-sans"
                      value={linkedRecord}
                      onChange={(e) => setLinkedRecord(e.target.value)}
                    >
                      <option value="">Link to record…</option>
                      {records.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id}
                        </option>
                      ))}
                    </select>
                    {linkedPerson && linkedRecord && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] h-6 px-2"
                        onClick={() => {
                          // Placeholder: wire to thread-links API later
                        }}
                      >
                        <Link2 className="w-3 h-3 mr-1" /> Link
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cross-reference suggestions (self-doubting) */}
        {suggestions.length > 0 && (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 font-sans">
              <Sparkles className="w-4 h-4" /> Cross-reference suggestions
            </div>
            {suggestions.map((s, i) => (
              <p key={i} className="text-[10px] text-amber-700 font-sans">→ {s}</p>
            ))}
          </div>
        )}

        {/* Gate status summary */}
        {gate && (
          <div className="text-[10px] text-stone-400 font-sans">
            Gate status: {gateStatus} · {gate.requires_human_review ? 'Requires human review' : 'No human review needed'}
            {gate.fulfilment && ` · Fulfilment: ${gate.fulfilment}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AttachmentInspector;
