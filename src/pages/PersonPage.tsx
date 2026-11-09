import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, ExternalLink, Trash2, Plus, Check } from 'lucide-react';
import { initialPeople } from '@/data/familyDataWrapper';
import type { Person } from '@/types';
import type { LifeEvent } from '@/types/record';
import { getAllRecords, parseFamilySearchSection, type RecordEntry } from '@/lib/record-loader';
import { FamilySearchCheck } from '@/components/FamilySearchCheck';
import { QuickSearchLinks } from '@/components/QuickSearchLinks';
import { callApiEventOverride, callApi, callApiOpenInFinder } from '@/components/next-guide-api';
import eventRequests from '@/data/event-requests.json';
import {
  getMeta, withMeta, extractFamilySearchId, savePersonMeta,
  type PersonMeta, type PersonLink,
} from '@/lib/person-meta';

const EVENT_LABEL: Record<LifeEvent['type'], string> = {
  birth: 'Birth', baptism: 'Baptism', marriage: 'Marriage', death: 'Death',
  burial: 'Burial', migration_naturalisation: 'Migration / naturalisation',
};
const STEP_LABEL = ['Not filed', 'Filed', 'Transcribed', 'Verified', 'In app', 'On FamilySearch'];
const GEN_LABEL: Record<number, string> = {
  4: 'You / your generation', 3: 'Parents', 2: 'Grandparents', 1: 'Great-grandparents',
  0: '2× great-grandparents', [-1]: '3× great-grandparents', [-2]: '4× great-grandparents', [-3]: '5× great-grandparents',
};
const today = () => new Date().toISOString().slice(0, 10);
const isLocal = import.meta.env.DEV;

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#800020]">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function PersonPageInner() {
  const { personId = '' } = useParams();
  const navigate = useNavigate();
  const base = initialPeople.find((p) => p.id === personId);
  const [meta, setMeta] = useState<PersonMeta>(getMeta(personId));
  const [records, setRecords] = useState<Map<string, RecordEntry>>(new Map());
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [fsInput, setFsInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [altNote, setAltNote] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [noteText, setNoteText] = useState('');
  const [overrides, setOverrides] = useState<Record<string, { requestedOn?: string; requestedFrom?: string; receivedOn?: string }>>(
    eventRequests as Record<string, { requestedOn?: string; requestedFrom?: string; receivedOn?: string }>
  );

  useEffect(() => {
    getAllRecords().then((l) => setRecords(new Map(l.map((r) => [r.id, r]))));
  }, []);

  const person: Person | undefined = useMemo(
    () => (base ? withMeta({ ...base, familySearchId: meta.familySearchId ?? base.familySearchId }) : undefined),
    [base, meta.familySearchId]
  );

  if (!person) {
    return (
      <div className="p-8">
        <Button variant="outline" size="sm" onClick={() => navigate('/')}><ArrowLeft className="w-3 h-3 mr-1" /> Back</Button>
        <p className="mt-4 text-sm">No person with id "{personId}".</p>
      </div>
    );
  }

  const save = async (patch: Partial<PersonMeta>, okText: string) => {
    setMsg(null);
    try {
      await savePersonMeta(person.id, patch);
      setMeta((m) => ({ ...m, ...patch }));
      setMsg(okText);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  // ---- life events ----
  const events = person.lifeEvents ?? [];
  const evRows = events.map((ev) => {
    const rec = ev.recordId ? records.get(ev.recordId) : undefined;
    const step = rec?.stepNumber ?? 0;
    const o = overrides[`${person.id}|${ev.type}`];
    return { ev, rec, step, o };
  });
  const done = evRows.filter((r) => r.rec && r.step >= 5).length;

  const markRequested = async (type: LifeEvent['type']) => {
    const key = `${person.id}|${type}`;
    try {
      await callApiEventOverride(key, { requestedOn: today(), receivedOn: null });
      setOverrides((o) => ({ ...o, [key]: { ...(o[key] ?? {}), requestedOn: today() } }));
      setMsg('Saved: requested today. The Next card will ask you to chase in 30 days.');
    } catch (e) { setMsg((e as Error).message); }
  };
  const markReceived = async (type: LifeEvent['type']) => {
    const key = `${person.id}|${type}`;
    try {
      await callApiEventOverride(key, { receivedOn: today() });
      setOverrides((o) => ({ ...o, [key]: { ...(o[key] ?? {}), receivedOn: today() } }));
      setMsg('Saved: received. Save the file into FAMILY TREE › _inbox, then type "process inbox" in OpenCode.');
    } catch (e) { setMsg((e as Error).message); }
  };

  const actionFor = (r: (typeof evRows)[number]) => {
    const { ev, rec, step, o } = r;
    if (rec) {
      if (step === 0) return <Hint text='Save the file into FAMILY TREE › _inbox, then in OpenCode:' cmd="process inbox" />;
      if (step === 1) return <Hint text="Switch OpenCode to the VL model, paste a close-up, then:" cmd="transcribe next" />;
      if (step === 2) return <Button size="sm" className="text-xs h-7 bg-[#800020] text-white" onClick={() => navigate(`/records/${rec.id}?mode=check`)}>Open check</Button>;
      if (step === 3) return <Hint text="In OpenCode (coding model):" cmd={`run step 4 for ${rec.id}`} />;
      if (step === 4) return <Button size="sm" className="text-xs h-7 bg-[#800020] text-white" onClick={() => navigate('/')}>FamilySearch card (Next task)</Button>;
      return <span className="text-xs text-emerald-700 inline-flex items-center"><Check className="w-3 h-3 mr-1" /> Done</span>;
    }
    if (ev.status === 'known_no_record') {
      if (o?.receivedOn) return <Hint text={`Received ${o.receivedOn}. Save it to _inbox, then:`} cmd="process inbox" />;
      if (o?.requestedOn) return (
        <span className="text-xs text-stone-600">Requested {o.requestedOn}{o.requestedFrom ? ` from ${o.requestedFrom}` : ''}.{' '}
          {isLocal && <button className="underline" onClick={() => markReceived(ev.type)}>Mark received</button>}
        </span>
      );
      return isLocal ? (
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => markRequested(ev.type)}>Requested</Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => markReceived(ev.type)}>Received</Button>
        </div>
      ) : <span className="text-xs text-stone-500">Document not yet held</span>;
    }
    return <span className="text-xs text-stone-500">No source known yet — search for one</span>;
  };

  function Hint({ text, cmd }: { text: string; cmd: string }) {
    return (
      <div className="text-xs text-stone-600 space-y-1">
        <div>{text}</div>
        <div className="flex items-center gap-1.5">
          <code className="bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5">{cmd}</code>
          <Button size="sm" variant="outline" className="text-[11px] h-6 px-2" onClick={() => copy(cmd, cmd)}>
            <Copy className="w-3 h-3 mr-1" /> {copied === cmd ? 'Copied ✓' : 'Copy'}
          </Button>
        </div>
      </div>
    );
  }

  // ---- records naming this person ----
  const linkedIds = new Set(events.map((e) => e.recordId).filter(Boolean) as string[]);
  const personRecords = [...records.values()].filter(
    (r) => linkedIds.has(r.id) || (r.frontMatter.people ?? []).includes(person.id)
  );

  const fsId = person.familySearchId;
  const alts = meta.altFamilySearchIds ?? [];
  const links = meta.links ?? [];
  const notes = meta.notes ?? [];

  return (
    <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <PersonSwitcher current={person} />

        {/* Header */}
        <div className="rounded-xl bg-[#800020] text-white p-5 shadow">
          <div className="text-xs uppercase tracking-wider opacity-80">{GEN_LABEL[person.generation] ?? `Generation ${person.generation}`} · {person.line} line</div>
          <h1 className="text-3xl font-serif mt-1">{person.name}</h1>
          <div className="text-sm opacity-90 mt-1">
            {person.birthDate || 'Birth unknown'}{person.birthPlace ? `, ${person.birthPlace}` : ''}
            {' — '}
            {person.deathDate || ((person as Person & { isLiving?: boolean }).isLiving ? 'Living' : 'Death unknown')}
          </div>
          <div className="text-xs mt-2 opacity-90">
            Life events with a record on FamilySearch: <b>{done} of {events.length}</b>
          </div>
        </div>

        {msg && <div className="rounded border border-stone-300 bg-white p-2 text-xs text-stone-700">{msg}</div>}

        <div className="rounded-xl bg-white border border-stone-200 p-3">
          <div className="text-xs text-stone-500 mb-2">Quick external searches for {person.name}:</div>
          <QuickSearchLinks name={person.name} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Identity & links */}
          <Section title="FamilySearch & links">
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-stone-500 mb-1">FamilySearch person</div>
                {fsId ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`https://www.familysearch.org/tree/person/details/${fsId}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="text-xs"><ExternalLink className="w-3 h-3 mr-1" /> {fsId}</Button>
                    </a>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => copy('fsid', fsId)}>
                      <Copy className="w-3 h-3 mr-1" /> {copied === 'fsid' ? 'Copied ✓' : 'Copy ID'}
                    </Button>
                  </div>
                ) : <div className="text-xs text-amber-700">Not saved yet.</div>}
                {isLocal && (
                  <div className="flex gap-2 mt-2">
                    <input className="flex-1 rounded border border-stone-300 px-2 py-1 text-xs" placeholder="Paste the FamilySearch person link or ID"
                      value={fsInput} onChange={(e) => setFsInput(e.target.value)} />
                    <Button size="sm" className="text-xs bg-[#800020] text-white" onClick={() => {
                      const id = extractFamilySearchId(fsInput);
                      if (!id) { setMsg('That doesn\'t look like a FamilySearch person link or ID (e.g. P65X-5T7).'); return; }
                      setFsInput('');
                      save({ familySearchId: id }, `Saved FamilySearch ID ${id}.`);
                    }}>Save</Button>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-stone-500 mb-1">Other FamilySearch profiles (duplicates, old IDs)</div>
                {alts.length === 0 && <div className="text-xs text-stone-400">None noted.</div>}
                <ul className="space-y-1">
                  {alts.map((a, i) => (
                    <li key={a.id} className="flex items-center gap-2 text-xs">
                      <a className="underline" href={`https://www.familysearch.org/tree/person/details/${a.id}`} target="_blank" rel="noreferrer">{a.id}</a>
                      <span className="text-stone-500">{a.note}</span>
                      {isLocal && <button onClick={() => save({ altFamilySearchIds: alts.filter((_, j) => j !== i) }, 'Removed.')}><Trash2 className="w-3 h-3 text-stone-400" /></button>}
                    </li>
                  ))}
                </ul>
                {isLocal && (
                  <div className="flex gap-2 mt-2">
                    <input className="w-32 rounded border border-stone-300 px-2 py-1 text-xs" placeholder="Link or ID" value={altInput} onChange={(e) => setAltInput(e.target.value)} />
                    <input className="flex-1 rounded border border-stone-300 px-2 py-1 text-xs" placeholder="Note (e.g. possible duplicate)" value={altNote} onChange={(e) => setAltNote(e.target.value)} />
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                      const id = extractFamilySearchId(altInput);
                      if (!id) { setMsg('Not a FamilySearch link or ID.'); return; }
                      setAltInput(''); setAltNote('');
                      save({ altFamilySearchIds: [...alts, { id, note: altNote.trim() }] }, `Added ${id}.`);
                    }}><Plus className="w-3 h-3" /></Button>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-stone-500 mb-1">Other links</div>
                {links.length === 0 && <div className="text-xs text-stone-400">None yet.</div>}
                <ul className="space-y-1">
                  {links.map((l: PersonLink, i) => (
                    <li key={l.url + i} className="flex items-center gap-2 text-xs">
                      <a className="underline truncate max-w-[16rem]" href={l.url} target="_blank" rel="noreferrer">{l.label || l.url}</a>
                      <button onClick={() => copy(`l${i}`, l.url)}><Copy className="w-3 h-3 text-stone-400" /></button>
                      {isLocal && <button onClick={() => save({ links: links.filter((_, j) => j !== i) }, 'Link removed.')}><Trash2 className="w-3 h-3 text-stone-400" /></button>}
                    </li>
                  ))}
                </ul>
                {isLocal && (
                  <div className="flex gap-2 mt-2">
                    <input className="w-32 rounded border border-stone-300 px-2 py-1 text-xs" placeholder="Label" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} />
                    <input className="flex-1 rounded border border-stone-300 px-2 py-1 text-xs" placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                      if (!/^https?:\/\//.test(linkUrl.trim())) { setMsg('Paste a full link starting with https://'); return; }
                      const next = [...links, { label: linkLabel.trim(), url: linkUrl.trim() }];
                      setLinkLabel(''); setLinkUrl('');
                      save({ links: next }, 'Link saved.');
                    }}><Plus className="w-3 h-3" /></Button>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Notes */}
          <Section title="Notes">
            {notes.length === 0 && <div className="text-xs text-stone-400 mb-2">No notes yet.</div>}
            <ul className="space-y-2 mb-3">
              {notes.map((n, i) => (
                <li key={i} className="text-sm">
                  <span className="text-xs text-stone-500 mr-2">{n.date}</span>{n.text}
                  {isLocal && <button className="ml-2" onClick={() => save({ notes: notes.filter((_, j) => j !== i) }, 'Note removed.')}><Trash2 className="w-3 h-3 text-stone-400 inline" /></button>}
                </li>
              ))}
            </ul>
            {isLocal && (
              <div className="flex gap-2">
                <textarea className="flex-1 rounded border border-stone-300 px-2 py-1 text-xs h-16" placeholder="Add a note (e.g. what Mum remembers)" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                <Button size="sm" variant="outline" className="text-xs self-end" disabled={!noteText.trim()} onClick={() => {
                  const next = [...notes, { date: today(), text: noteText.trim() }];
                  setNoteText('');
                  save({ notes: next }, 'Note saved.');
                }}>Add</Button>
              </div>
            )}
          </Section>
        </div>

        {/* Life events + full step guide */}
        <Section title="Life events — step by step">
          {events.length === 0 && <div className="text-sm text-stone-500">No life events set up for this person yet.</div>}
          <div className="space-y-3">
            {evRows.map((r, i) => {
              const finished = !!r.rec && r.step >= 5;
              const firstOpen = evRows.findIndex((x) => !(x.rec && x.step >= 5) && !(x.o?.requestedOn && !x.o?.receivedOn));
              return (
                <details key={r.ev.type} open={!finished && i === firstOpen} className="rounded-lg border border-stone-200 bg-[#FCFAF7]">
                  <summary className="cursor-pointer list-none p-3 grid md:grid-cols-[11rem_1fr_auto] gap-3 items-center">
                    <div>
                      <div className="font-semibold text-sm text-stone-800">{EVENT_LABEL[r.ev.type]}</div>
                      <div className="text-[11px] text-stone-500">
                        {r.rec ? `Step ${Math.min(r.step, 5)} of 5 · ${STEP_LABEL[Math.min(r.step, 5)]}`
                          : r.o?.receivedOn ? 'Document received — file it'
                          : r.o?.requestedOn ? `Requested ${r.o.requestedOn}`
                          : r.ev.status === 'known_no_record' ? 'Known, no document yet' : 'Missing'}
                      </div>
                    </div>
                    <div className="text-xs text-stone-600 truncate">{r.rec ? r.rec.id : (r.ev.note || '—')}</div>
                    <div className="text-xs">{finished ? <span className="text-emerald-700 inline-flex items-center"><Check className="w-3 h-3 mr-1" /> Done</span> : <span className="text-[#800020] font-semibold">Show steps ▾</span>}</div>
                  </summary>
                  {!finished && (
                    <div className="border-t border-stone-200 p-4">
                      <StepGuide
                        personName={person.name}
                        ev={r.ev}
                        rec={r.rec}
                        step={r.step}
                        o={r.o}
                        onRequested={() => markRequested(r.ev.type)}
                        onReceived={() => markReceived(r.ev.type)}
                        onMsg={setMsg}
                      />
                    </div>
                  )}
                </details>
              );
            })}
          </div>
        </Section>

        {/* Records */}
        <Section title={`Records naming ${person.name.split(' ')[0]} (${personRecords.length})`}>
          {personRecords.length === 0 && <div className="text-sm text-stone-500">No records filed yet.</div>}
          <ul className="space-y-1">
            {personRecords.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <button className="underline text-left" onClick={() => navigate(`/records/${r.id}`)}>{r.id}</button>
                <span className="text-[11px] text-stone-500">{STEP_LABEL[Math.min(r.stepNumber, 5)]}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* FamilySearch person check */}
        <Section title="FamilySearch page check">
          <FamilySearchCheck person={person} people={initialPeople} />
        </Section>
      </div>
    </div>
  );
}


/* ---------- Navigation between people ---------- */
const ORDERED = [...initialPeople].sort(
  (a, b) => b.generation - a.generation || a.line.localeCompare(b.line) || a.name.localeCompare(b.name)
);

function PersonSwitcher({ current }: { current: Person }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const go = (id: string) => { setQ(''); setOpen(false); navigate(`/people/${id}`); };

  const idx = ORDERED.findIndex((p) => p.id === current.id);
  const prev = idx > 0 ? ORDERED[idx - 1] : null;
  const next = idx >= 0 && idx < ORDERED.length - 1 ? ORDERED[idx + 1] : null;

  const matches = q.trim()
    ? ORDERED.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 12)
    : ORDERED.slice(0, 12);

  const byId = (id: string) => initialPeople.find((p) => p.id === id);
  const fam: { label: string; people: Person[] }[] = [
    { label: 'Parents', people: (current.parents ?? []).map(byId).filter(Boolean) as Person[] },
    { label: 'Spouse', people: (current.spouses ?? []).map(byId).filter(Boolean) as Person[] },
    { label: 'Children', people: (current.children ?? []).map(byId).filter(Boolean) as Person[] },
  ].filter((f) => f.people.length);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/')}><ArrowLeft className="w-3 h-3 mr-1" /> Tree</Button>
        <Button variant="outline" size="sm" disabled={!prev} onClick={() => prev && go(prev.id)} title={prev ? `Closer: ${prev.name}` : ''}>
          ← {prev ? prev.name.split(' ')[0] : 'Closer'}
        </Button>
        <Button variant="outline" size="sm" disabled={!next} onClick={() => next && go(next.id)} title={next ? `Further back: ${next.name}` : ''}>
          {next ? next.name.split(' ')[0] : 'Further'} →
        </Button>
        <div className="relative flex-1 min-w-[14rem]">
          <input
            className="w-full rounded border border-stone-300 px-3 py-1.5 text-sm"
            placeholder="Go to person… (type a name)"
            value={q}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) go(matches[0].id); }}
          />
          {open && matches.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded border border-stone-200 bg-white shadow-lg">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[#FAF6F0] ${p.id === current.id ? 'font-bold text-[#800020]' : ''}`}
                    onMouseDown={(e) => { e.preventDefault(); go(p.id); }}
                  >
                    {p.name}
                    <span className="ml-2 text-[11px] text-stone-500">{GEN_LABEL[p.generation] ?? `Gen ${p.generation}`} · {p.line}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {fam.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {fam.map((f) => (
            <div key={f.label} className="flex flex-wrap items-center gap-1">
              <span className="text-stone-500">{f.label}:</span>
              {f.people.map((p) => (
                <button key={p.id} className="rounded-full border border-stone-300 px-2 py-0.5 hover:bg-[#FAF6F0] hover:border-[#800020]" onClick={() => go(p.id)}>
                  {p.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/** Remount per person so saved links/notes and inputs never carry over between people. */
export default function PersonPage() {
  const { personId = '' } = useParams();
  return <PersonPageInner key={personId} />;
}


/* ---------- Full step-by-step guide for one life event ---------- */
const MODEL = {
  coding: 'OpenCode — coding model (e.g. DeepSeek)',
  vision: 'OpenCode — VL model (Nemotron 3.5 Super VL)',
  you: 'You — in the app',
  fs: 'You — on FamilySearch',
};

function CopyCmd({ cmd }: { cmd: string }) {
  const [c, setC] = useState(false);
  return (
    <span className="inline-flex items-center gap-1.5">
      <code className="bg-white border border-stone-300 rounded px-2 py-0.5 text-[13px]">{cmd}</code>
      <Button size="sm" variant="outline" className="text-[11px] h-6 px-2" onClick={() => { navigator.clipboard.writeText(cmd); setC(true); setTimeout(() => setC(false), 1500); }}>
        <Copy className="w-3 h-3 mr-1" /> {c ? 'Copied ✓' : 'Copy'}
      </Button>
    </span>
  );
}

function Steps({ who, title, items }: { who: string; title: string; items: React.ReactNode[] }) {
  return (
    <div>
      <div className="text-sm font-bold text-[#800020]">{title}</div>
      <div className="text-[11px] text-stone-500 mb-2">Where: {who}</div>
      <ol className="list-decimal ml-5 space-y-1.5 text-sm text-stone-700">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ol>
    </div>
  );
}

function StepGuide(props: {
  personName: string;
  ev: LifeEvent;
  rec?: RecordEntry;
  step: number;
  o?: { requestedOn?: string; requestedFrom?: string; receivedOn?: string };
  onRequested: () => void;
  onReceived: () => void;
  onMsg: (m: string) => void;
}) {
  const { personName, ev, rec, step, o, onRequested, onReceived, onMsg } = props;
  const navigate = useNavigate();
  const first = personName.split(' ')[0];
  const label = EVENT_LABEL[ev.type].toLowerCase();

  // ----- No record yet: get the document, then file it -----
  if (!rec) {
    if (o?.receivedOn) {
      return <Steps who={MODEL.coding} title={`Step 1 — File ${first}'s ${label}`} items={[
        <>Save the document (full page, plus a close-up if useful) into <b>Downloads › FAMILY TREE › _inbox</b>.</>,
        <>Copy the web address of the page if it's online (FamilySearch / Antenati) — OpenCode will ask for it.</>,
        <>In OpenCode type: <CopyCmd cmd="process inbox" /></>,
        <>It names, files and links it to {first}. Come back here — the next step appears.</>,
      ]} />;
    }
    return (
      <div className="space-y-3">
        <Steps who="You" title={`Get ${first}'s ${label} document`} items={[
          <>Where it should be: <span className="text-stone-600">{ev.note || 'unknown — search FamilySearch / Antenati first'}</span></>,
          <>If it's online: download the full page into <b>FAMILY TREE › _inbox</b>, then type <CopyCmd cmd="process inbox" /> in OpenCode.</>,
          <>If it must be requested from an office: ask Claude to draft the Italian/English request, send it, then click <b>Requested</b> below.</>,
          <>When it arrives: click <b>Received</b>, save it to <b>_inbox</b>, then <CopyCmd cmd="process inbox" />.</>,
        ]} />
        {isLocal && (
          <div className="flex flex-wrap gap-2">
            {o?.requestedOn
              ? <span className="text-xs text-stone-600">Requested {o.requestedOn}{o.requestedFrom ? ` from ${o.requestedFrom}` : ''} — the Next card will remind you to chase after 30 days.</span>
              : <Button size="sm" variant="outline" className="text-xs" onClick={onRequested}>Requested (waiting for reply)</Button>}
            <Button size="sm" variant="outline" className="text-xs" onClick={onReceived}>Received</Button>
          </div>
        )}
      </div>
    );
  }

  const id = rec.id;
  // ----- Step 1: file -----
  if (step === 0) {
    return <Steps who={MODEL.coding} title="Step 1 of 5 — File the document" items={[
      <>Save the image/PDF into <b>Downloads › FAMILY TREE › _inbox</b>.</>,
      <>In OpenCode type: <CopyCmd cmd="process inbox" /></>,
      <>It copies, renames (<code>{id}_p1…</code>) and checks the file, then this page moves to step 2.</>,
    ]} />;
  }
  // ----- Step 2: transcribe -----
  if (step === 1) {
    return (
      <div className="space-y-3">
        <Steps who={MODEL.vision} title="Step 2 of 5 — Transcribe" items={[
          <>Click <b>Open record</b> below to see the image.</>,
          <><b>Typed document</b> (comune extract, certificate): open it in Preview, press <b>Cmd + A</b>, <b>Cmd + C</b>, and paste the text into OpenCode with a screenshot.</>,
          <><b>Handwritten</b>: in OpenCode switch to the VL model. Screenshot just the entry with <b>Cmd + Shift + Ctrl + 4</b>, then <b>Cmd + V</b> into OpenCode.</>,
          <>Type: <CopyCmd cmd="transcribe next" /></>,
          <>Switch back to the coding model and type <CopyCmd cmd="continue" /> — it saves the lines and compares them with the tree, then stops.</>,
          <>If the handwriting is too hard: open a fresh Claude chat with the close-up and ask for a line-by-line transcription.</>,
        ]} />
        <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/records/${id}`)}><ExternalLink className="w-3 h-3 mr-1" /> Open record</Button>
      </div>
    );
  }
  // ----- Step 3: check -----
  if (step === 2) {
    return (
      <div className="space-y-3">
        <Steps who={MODEL.you} title="Step 3 of 5 — Check it against the image" items={[
          <>Click <b>Open check</b>: image on the left, lines on the right.</>,
          <>Tick each line that matches the image. Use <b>Line is wrong</b> to correct anything — the AI's reading is kept under Discrepancies.</>,
          <>Leave unreadable words as <b>[?]</b> — never fill them from memory or the tree.</>,
          <>Click <b>Verified</b>, then use your browser's Back button to return here.</>,
        ]} />
        <Button size="sm" className="text-xs bg-[#800020] text-white" onClick={() => navigate(`/records/${id}?mode=check`)}>Open check</Button>
      </div>
    );
  }
  // ----- Step 4: apply -----
  if (step === 3) {
    return <Steps who={MODEL.coding} title="Step 4 of 5 — Add its facts to the people it names" items={[
      <>In OpenCode type: <CopyCmd cmd={`run step 4 for ${id}`} /></>,
      <>Read its list: facts per person, records it mentions (research leads), and conflicts. Check nothing is invented.</>,
      <>Reply <CopyCmd cmd="apply" /> (or say what to change). It also prepares the FamilySearch texts for step 5.</>,
    ]} />;
  }
  // ----- Step 5: FamilySearch -----
  const fs = parseFamilySearchSection(rec.body);
  const markOnFs = async () => {
    try {
      await callApi(id, 'front-matter', 'on_familysearch=true');
      onMsg('Saved: on FamilySearch. Reloading…');
      setTimeout(() => window.location.reload(), 900);
    } catch (e) { onMsg((e as Error).message); }
  };
  return (
    <div className="space-y-3">
      <Steps who={MODEL.fs} title="Step 5 of 5 — Add it to FamilySearch" items={[
        <>Open {first} on FamilySearch (button at the top of this page) → <b>Sources</b>. If this record is already attached, <b>Edit</b> it instead of adding a second copy.</>,
        <>Otherwise <b>Add Source</b>, and copy each field below into the form, in order.</>,
        <>Save, then click <b>Done – added to FamilySearch</b> here.</>,
        <>Then use the <b>FamilySearch page check</b> at the bottom of this page to add the facts (birth, christening, marriage…) to {first}'s details.</>,
      ]} />
      {!fs ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          This record has no FamilySearch texts yet. In OpenCode type <CopyCmd cmd={`write the ## FamilySearch section for ${id}`} />
        </div>
      ) : (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-2">
          {([
            ['Event Date', fs.eventDate], ['Source Title', fs.sourceTitle], ['Source Type', fs.sourceType],
            ['Citation', fs.citation], ['Notes', fs.notes], ['Reason to Attach', fs.reason],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[8rem_1fr_auto] gap-2 items-start">
              <div className="text-xs font-semibold text-stone-700 pt-1">{k}</div>
              <div className="text-xs text-stone-700 bg-white rounded border border-stone-200 p-2 whitespace-pre-wrap">{v || '—'}</div>
              <FieldCopy text={v} />
            </div>
          ))}
          <div className="text-xs text-stone-700"><b>Vital tags:</b> {fs.vitalTags} · <b>Source Box:</b> {fs.sourceBox}</div>
          <div className="flex flex-wrap gap-2 pt-1">
            {/^web page url/i.test(fs.sourceType) ? null : (
              <Button size="sm" variant="outline" className="text-xs" onClick={() => callApiOpenInFinder(id).catch((e) => onMsg(e.message))}>
                <ExternalLink className="w-3 h-3 mr-1" /> Show file in Finder
              </Button>
            )}
            {isLocal && <Button size="sm" className="text-xs bg-[#800020] text-white" onClick={markOnFs}><Check className="w-3 h-3 mr-1" /> Done – added to FamilySearch</Button>}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldCopy({ text }: { text: string }) {
  const [c, setC] = useState(false);
  return (
    <Button size="sm" variant="outline" className="text-[11px] h-7 px-2" disabled={!text} onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 1500); }}>
      <Copy className="w-3 h-3 mr-1" /> {c ? 'Copied ✓' : 'Copy'}
    </Button>
  );
}
