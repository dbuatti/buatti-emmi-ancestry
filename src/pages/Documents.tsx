import { Link } from 'react-router-dom';
import { AttachmentIntegrityCheck } from '@/components/AttachmentIntegrityCheck';
import { Archive, Database, FileText, FolderOpen, Image as ImageIcon, Inbox, ArrowRight, ListTodo } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const INBOX_ROOT = '~/Downloads/FAMILY TREE/';

const STORAGE_ZONES = [
  {
    icon: Inbox,
    title: 'Intake inbox (drop zone)',
    path: '_inbox/',
    body: 'New documents land here (scans, photos, PDFs). Run `process inbox` to file everything inside.',
  },
  {
    icon: FolderOpen,
    title: 'Unsorted pile',
    path: '_unsorted/',
    body: 'Files waiting to be identified one at a time. Use `identify <folder>` to sort them.',
  },
  {
    icon: Archive,
    title: 'Processed originals',
    path: '_processed/<record-id>/',
    body: 'Originals moved here after a record is filed. Move, never delete.',
  },
];

const RECORD_FIELDS = [
  { key: 'filed', label: 'filed', body: 'Copied into records-local/<id>/ as <id>_pN.ext and created records/<id>/record.md with filed: true.' },
  { key: 'transcribed', label: 'transcribed', body: 'Typed docs: you paste Live Text text + screenshot (Italian verbatim, uncertain → [?], English below). Handwritten: VL model close-up or stop for Claude.' },
  { key: 'verified', label: 'verified', body: 'Daniele checks names/dates/parents against the image. Only Daniele sets verified: true.' },
  { key: 'in_app', label: 'in_app', body: 'After verified: list facts for every person named, register leads as tasks; apply after "apply". Only Daniele sets in_app: true.' },
  { key: 'on_familysearch', label: 'on_familysearch', body: 'Daniele attaches the record on FamilySearch (manual, no automated API). Only Daniele sets it true.' },
];

const PROCESS_STEPS = [
  { n: '1', title: 'Identify', body: 'Filename clues (film numbers, atto n., entry N), existing records/<id>/record.md image_links, and known_no_record life events.' },
  { n: '2', title: 'Resolve uncertainty', body: 'If unsure, ask the user ONE question with numbered options (existing records + "new record"). Never guess.' },
  { n: '3', title: 'File', body: 'Copy into records-local/<id>/ as <id>_pN.ext, verify SHA-256, set filed: true in records/<id>/record.md.' },
  { n: '4', title: 'Move originals', body: 'Move from _inbox/ to _processed/<id>/. Move, never delete.' },
  { n: '5', title: 'Transcribe', body: 'Typed → paste text; handwritten → VL close-up or stop for Claude. Never save free-form narrative paragraphs — use Label / en: pairs.' },
];

export default function Documents() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <Link to="/research" className="text-sm text-[#800020] underline inline-flex items-center gap-1">
            ← Research
          </Link>
          <h1 className="text-3xl font-bold text-stone-900 mt-3 mb-2">Documents &amp; Storage</h1>
          <p className="text-stone-600 font-sans max-w-3xl">
            Where every image and document in this project lives — on disk, in the correspondence
            database, and in the record lifecycle — and how the inbox / processing commands move a
            document through the system.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Database className="w-6 h-6 text-[#800020]" /> Where documents are stored
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STORAGE_ZONES.map((z) => (
              <Card key={z.title} className="border-stone-200">
                <CardHeader>
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <z.icon className="w-5 h-5 text-[#800020]" /> {z.title}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">{INBOX_ROOT}{z.path}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-stone-600 font-sans">{z.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-4">
            <AttachmentIntegrityCheck />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#800020]" /> Record files
                </CardTitle>
                <CardDescription className="font-mono text-xs">records/&lt;id&gt;/record.md</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-600 font-sans">
                  Front matter per record: type, date (DD/MM/YYYY), place, comune, register, year, atto, people, source_office, protocol, transcribed_by, filed, transcribed, verified, in_app, on_familysearch, image_link, links. One folder per record; scan images named &lt;id&gt;_p1.&lt;ext&gt;, &lt;id&gt;_p2.&lt;ext&gt;… (larger/full page = _p1).
                </p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#800020]" /> Gmail correspondence attachments
                </CardTitle>
                <CardDescription className="font-mono text-xs">correspondence/attachments/ + .local/correspondence.db</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-600 font-sans">
                  Downloaded via scripts/sync-gmail.py (--download / --download-message), stored with safe filenames and binary-safe decoding; indexed in the local SQLite DB (attachments table: message_id, filename, mime_type, size_bytes, gmail_attachment_id, local_path, ocr_text, unavailable). The correspondence workspace also holds raw/ and extracted/ JSON per message plus tier reports.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-[#800020]" /> The 5-step record lifecycle
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RECORD_FIELDS.map((f) => (
              <Card key={f.key} className="border-stone-200">
                <CardHeader>
                  <CardTitle className="text-lg font-serif">
                    <span className="text-[#800020] font-mono">{f.key}</span> <span className="text-stone-700">{f.label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-stone-600 font-sans">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-[#800020]" /> `process inbox` — how a document gets filed
          </h2>
          <ol className="list-decimal pl-6 space-y-3 max-w-3xl">
            {PROCESS_STEPS.map((s) => (
              <li key={s.n}>
                <span className="font-bold font-sans">{s.title}:</span>{' '}
                <span className="text-stone-700 font-sans">{s.body}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="text-lg font-serif">transcribe next</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-600 font-sans">Transcribes the next record that is filed but not transcribed. Uses only the image you paste.</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="text-lg font-serif">identify &lt;folder&gt;</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-600 font-sans">Sorts files in _unsorted/ one at a time, proposing a record id, asking for confirmation before filing.</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Check against image</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-600 font-sans">Workflow step 3 — Daniele verifies names, dates, parents against the source image; the assistant never sets it.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
            <ArrowRight className="w-6 h-6 text-[#800020]" /> Next in the pipeline
          </h2>
          <p className="text-stone-700 font-sans max-w-3xl">
            Every received document follows the same arc: drop in <span className="font-mono">_inbox/</span> →{' '}
            <span className="font-mono">process inbox</span> → transcribe → verify (Daniele) → apply (Daniele) → attach on FamilySearch (Daniele).
            While a chase is pending, the Next card shows the office, the reference, and the 30-day chase clock.
          </p>
          <div className="mt-6">
            <Link to="/research/tasks">
              <Button variant="outline" className="font-sans border-stone-300 hover:bg-stone-100 text-stone-700 flex items-center gap-2">
                Open the Tasks page <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
