/**
 * FamilySearch person check.
 * Parses the text of a FamilySearch "Details" page (select all + copy) and
 * compares it with the app's VERIFIED facts for that person.
 * Never decides who is right: differences are flagged, not resolved.
 */
import type { Person } from '@/types';
import type { LifeEvent } from '@/types/record';
import { parseFamilySearchSection, type RecordEntry } from '@/lib/record-loader';

export type Vital = 'Name' | 'Sex' | 'Birth' | 'Christening' | 'Death' | 'Burial';
const VITALS: Vital[] = ['Name', 'Sex', 'Birth', 'Christening', 'Death', 'Burial'];

export interface ParsedFsPage {
  vitals: Partial<Record<Vital, { lines: string[]; sources: number | null }>>;
  marriage: { present: boolean; text: string } | null;
  parents: { name: string; years: string; id: string }[];
  review: { title: string; detail: string }[];
  ok: boolean;
}

const clean = (l: string) =>
  l.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/^[*\-•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
const FS_ID = /\b[A-Z0-9]{4}-[A-Z0-9]{2,4}\b/;

export function parseFsPage(text: string): ParsedFsPage {
  const lines = text.split(/\r?\n/).map(clean).filter(Boolean);
  const out: ParsedFsPage = { vitals: {}, marriage: null, parents: [], review: [], ok: false };

  // ---- Vitals ----
  const vStart = lines.findIndex((l) => l === 'Vitals');
  const vEnd = lines.findIndex((l, i) => i > vStart && /^Other Information$/.test(l));
  if (vStart !== -1) {
    const block = lines.slice(vStart + 1, vEnd === -1 ? undefined : vEnd);
    let cur: Vital | null = null;
    for (const l of block) {
      const m = l.match(/^(Name|Sex|Birth|Christening|Death|Burial)(?:\s*•\s*(\d+)\s+Sources?)?$/);
      if (m) {
        cur = m[1] as Vital;
        out.vitals[cur] = { lines: [], sources: m[2] ? Number(m[2]) : null };
        continue;
      }
      if (!cur || l === 'Detail View') continue;
      if (l === 'Add') continue; // empty field
      out.vitals[cur]!.lines.push(l);
    }
    out.ok = Object.keys(out.vitals).length > 0;
  }

  // ---- Marriage (Spouses and Children) ----
  const sStart = lines.findIndex((l) => l === 'Spouses and Children');
  if (sStart !== -1) {
    const sEnd = lines.findIndex((l, i) => i > sStart && /^(Children \(\d+\)|Add Child|Parents and Siblings)/.test(l));
    const block = lines.slice(sStart, sEnd === -1 ? sStart + 20 : sEnd);
    if (block.some((l) => /^No Marriage Events$/.test(l))) out.marriage = { present: false, text: '' };
    else {
      const i = block.findIndex((l) => /^Marriage$/.test(l));
      out.marriage = i === -1 ? null : { present: true, text: block[i + 1] ?? '' };
    }
  }

  // ---- Parents (first family under "Parents and Siblings") ----
  const pStart = lines.findIndex((l) => l === 'Parents and Siblings');
  if (pStart !== -1) {
    const pEnd = lines.findIndex((l, i) => i > pStart && /^(Marriage|Children \(\d+\)|Add Child)/.test(l));
    const block = lines.slice(pStart + 1, pEnd === -1 ? pStart + 20 : pEnd);
    for (let i = 0; i < block.length; i++) {
      if (/^(Male|Female)$/.test(block[i + 1] ?? '')) {
        const years = block[i + 2] ?? '';
        const id = block.slice(i + 2, i + 5).find((x) => FS_ID.test(x)) ?? '';
        out.parents.push({ name: block[i], years: /\d{4}|Deceased|Living/.test(years) ? years : '', id: id.match(FS_ID)?.[0] ?? '' });
      }
    }
  }

  // ---- Research Help ----
  const rStart = lines.findIndex((l) => /^Research Help/.test(l));
  if (rStart !== -1) {
    const rEnd = lines.findIndex((l, i) => i > rStart && /^(Search Records|Notes|Show All)$/.test(l));
    const block = lines.slice(rStart + 1, rEnd === -1 ? rStart + 30 : rEnd)
      .filter((l) => !/^(Quality Score:|Not Available at This Time|Learn more\.?|•|Male|Female|Deceased|Living)$/.test(l));
    let item: { title: string; detail: string } | null = null;
    for (const l of block) {
      if (/^(Possible Duplicate|Missing Vital Event|Data Problem|Record Hint|Research Suggestion)/.test(l)) {
        item = { title: l, detail: '' };
        out.review.push(item);
      } else if (/Records,?\s*\d{4}|Church Records|Civil Registration|Census|Index/.test(l) && item && item.detail) {
        // a record hint following another item
        item = { title: 'Record hint', detail: l };
        out.review.push(item);
      } else if (item) {
        item.detail = item.detail ? `${item.detail} · ${l}` : l;
      } else {
        item = { title: 'Research help', detail: l };
        out.review.push(item);
      }
    }
    // Split "Possible Duplicate" detail that swallowed a record hint name
    for (const r of out.review) {
      if (r.title === 'Record hint') {
        const prev = out.review[out.review.indexOf(r) - 1];
        if (prev) {
          const parts = prev.detail.split(' · ');
          const last = parts[parts.length - 1];
          if (last && !FS_ID.test(last) && parts.length > 1) {
            prev.detail = parts.slice(0, -1).join(' · ');
            r.detail = `${last} — ${r.detail}`;
          }
        }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const PROVINCE: Record<string, string> = {
  linguaglossa: 'Catania, Sicilia, Italia',
  'fiumefreddo di sicilia': 'Catania, Sicilia, Italia',
  calatabiano: 'Catania, Sicilia, Italia',
  giarre: 'Catania, Sicilia, Italia',
  'ascoli piceno': 'Ascoli Piceno, Marche, Italia',
  maltignano: 'Ascoli Piceno, Marche, Italia',
  'san benedetto del tronto': 'Ascoli Piceno, Marche, Italia',
};
const titleCase = (s: string) => s.toLowerCase().replace(/\b([a-zàèéìòù])/g, (c) => c.toUpperCase()).replace(/\b(Di|Del|Della)\b/g, (w) => w.toLowerCase());

export function fsPlace(p?: string): string {
  if (!p) return '';
  if (p.includes(',')) return p;
  const tc = titleCase(p.trim());
  const prov = PROVINCE[tc.toLowerCase()];
  return prov ? `${tc}, ${prov}` : tc;
}

export function fsDate(d?: string): string {
  if (!d) return '';
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${Number(m[1])} ${MONTHS[Number(m[2]) - 1]} ${m[3]}`;
  const m2 = d.match(/(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})/);
  if (m2) {
    const mon = MONTHS.find((x) => x.toLowerCase().startsWith(m2[2].toLowerCase().slice(0, 3)));
    if (mon) return `${Number(m2[1])} ${mon} ${m2[3]}`;
  }
  return d;
}

const EVENT_TO_VITAL: Record<LifeEvent['type'], Vital | 'Marriage' | null> = {
  birth: 'Birth', baptism: 'Christening', death: 'Death', burial: 'Burial', marriage: 'Marriage', migration_naturalisation: null,
};

export type CheckKind = 'add' | 'differs' | 'review' | 'not_ready' | 'ok';
export interface CheckItem {
  kind: CheckKind;
  title: string;
  detail: string;
  copy?: { label: string; text: string }[];
}

interface Fact { vital: Vital | 'Marriage'; date: string; place: string; sourceTitle: string; reason: string; via: string }

function verifiedFacts(person: Person, records: Map<string, RecordEntry>): { facts: Fact[]; notReady: CheckItem[] } {
  const facts: Fact[] = [];
  const notReady: CheckItem[] = [];
  const evs = person.lifeEvents ?? [];
  for (const ev of evs) {
    const vital = EVENT_TO_VITAL[ev.type];
    if (!vital) continue;
    const rec = ev.recordId ? records.get(ev.recordId) : undefined;
    if (rec && rec.frontMatter.verified) {
      const fs = parseFamilySearchSection(rec.body);
      facts.push({
        vital,
        date: fs?.eventDate || fsDate(String(rec.frontMatter.date ?? '')),
        place: fsPlace(String(rec.frontMatter.place || rec.frontMatter.comune || '')),
        sourceTitle: fs?.sourceTitle ?? rec.id,
        reason: fs?.reason ?? '',
        via: rec.id,
      });
      continue;
    }
    // Stated in the margin of another VERIFIED record? e.g. "(source: estratto atto 202 …)"
    const src = ev.note?.match(/source:[^)]*?atto\s*(\d+)/i);
    const srcRec = src
      ? evs.map((e) => (e.recordId ? records.get(e.recordId) : undefined))
          .find((r) => r && r.frontMatter.verified && r.id.endsWith(`atto${src[1]}`))
      : undefined;
    const dateM = ev.note?.match(/(\d{1,2}\s+[A-Za-z]{3,}\.?\s+\d{4})/);
    if (srcRec && dateM) {
      const after = ev.note!.slice(ev.note!.indexOf(dateM[1]) + dateM[1].length);
      const placeM = after.match(/^,\s*([^—.;(]+)/);
      const fs = parseFamilySearchSection(srcRec.body);
      facts.push({
        vital,
        date: fsDate(dateM[1]),
        place: fsPlace(placeM?.[1]?.trim()),
        sourceTitle: fs?.sourceTitle ?? srcRec.id,
        reason: `Stated in the margin note of: ${fs?.sourceTitle ?? srcRec.id}.`,
        via: srcRec.id,
      });
      continue;
    }
    if (dateM || ev.note) {
      notReady.push({
        kind: 'not_ready',
        title: `${vital}: not ready — get the document first`,
        detail: ev.note ?? '',
      });
    }
  }
  return { facts, notReady };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9àèéìòù ]/g, ' ').replace(/\s+/g, ' ').trim();

export function comparePerson(person: Person, people: Person[], records: Map<string, RecordEntry>, page: ParsedFsPage): CheckItem[] {
  const items: CheckItem[] = [];
  const { facts, notReady } = verifiedFacts(person, records);

  for (const f of facts) {
    const label = f.vital === 'Christening' ? 'Christening' : f.vital;
    const copy = [
      { label: 'Date', text: f.date },
      { label: 'Place', text: f.place },
      { label: 'Source to cite', text: f.sourceTitle },
      ...(f.reason ? [{ label: 'Reason', text: f.reason }] : []),
    ];
    let fsText = '';
    if (f.vital === 'Marriage') {
      if (!page.marriage) {
        items.push({ kind: 'review', title: 'Marriage: could not read the spouse section', detail: 'Check the couple relationship on FamilySearch by eye.', copy });
        continue;
      }
      fsText = page.marriage.present ? page.marriage.text : '';
    } else {
      fsText = (page.vitals[f.vital]?.lines ?? []).join(' ');
    }
    const year = f.date.match(/\d{4}/)?.[0] ?? '';
    if (!fsText || !/\d{4}/.test(fsText)) {
      items.push({
        kind: 'add',
        title: `Add ${label}: ${f.date}${f.place ? ` · ${f.place}` : ''}`,
        detail: f.vital === 'Marriage' ? 'Add it on the couple relationship (Spouses and Children → the couple → Add event: Marriage).' : `Cite: ${f.sourceTitle}`,
        copy,
      });
    } else {
      const sameDate = norm(fsText).includes(norm(f.date)) || (year && norm(fsText).includes(year) && norm(fsText).includes(norm(f.date).split(' ')[1] ?? ''));
      const comune = norm(f.place.split(',')[0] ?? '');
      const samePlace = !comune || norm(fsText).includes(comune);
      if (sameDate && samePlace) items.push({ kind: 'ok', title: `${label} matches`, detail: fsText });
      else items.push({
        kind: 'differs',
        title: `${label} differs`,
        detail: `FamilySearch: ${fsText}  |  App (verified, ${f.via}): ${f.date}${f.place ? ` · ${f.place}` : ''}. Check which the documents support before changing anything.`,
        copy,
      });
    }
  }

  // Parents' years
  for (const pid of person.parents ?? []) {
    const p = people.find((x) => x.id === pid);
    if (!p) continue;
    const fsP = page.parents.find((x) => norm(x.name) === norm(p.name) || norm(x.name).includes(norm(p.name.split(' ')[0])) && norm(x.name).includes(norm(p.name.split(' ').slice(-1)[0])));
    if (!fsP) {
      items.push({ kind: 'review', title: `Parent ${p.name} not found on the FamilySearch page`, detail: 'Check the Parents and Siblings section.' });
      continue;
    }
    const fsYear = fsP.years.match(/\d{4}/)?.[0];
    const appYear = p.birthDate?.match(/\d{4}/)?.[0];
    if (fsYear && appYear && fsYear !== appYear) {
      items.push({
        kind: 'differs',
        title: `${p.name}: birth year differs`,
        detail: `FamilySearch shows ${fsP.years}${fsP.id ? ` (${fsP.id})` : ''}; the app has ${p.birthDate}. Check which a document supports before changing either.`,
      });
    }
  }

  for (const r of page.review) items.push({ kind: 'review', title: r.title, detail: r.detail });
  items.push(...notReady);
  return items;
}

export const OPEN_KINDS: CheckKind[] = ['add', 'differs', 'review'];
