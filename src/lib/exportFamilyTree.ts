import type { Person, ResearchLead, OpenQuestion } from '@/types';

/**
 * Plain-text / markdown export of the WHOLE family tree.
 *
 * Design rules (this is a research tool, not a brochure):
 *  - never invent, merge or "tidy" data;
 *  - keep every caveat exactly as stored ("lettura incerta", "ca.", "?", "~", "likely");
 *  - when the data stores two conflicting readings, print both;
 *  - print "unknown" instead of silently omitting a field;
 *  - keep Italian accents; render dates as DD/MM/YYYY only where that loses nothing.
 *
 * Pure function (no Node/browser APIs) so it can be called from the CLI script
 * AND from the "Copy family tree" button in the UI.
 */

export const ROOT_ID = 'daniele-buatti';

const SECTION_ORDER = ['Buatti', 'Chiappini', 'Emmi', 'Patanè', 'Other'];

const SECTION_TITLES: Record<string, string> = {
  Buatti: 'BUATTI–GALANTI',
  Chiappini: 'CHIAPPINI–PIRRI',
  Emmi: 'EMMI–PATANÈ',
  Patanè: "PATANÈ–D'AGATA / VECCHIO–RAITI",
  Other: 'OTHER / EXTENDED',
};

const MONTHS: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  gennaio: '01', febbraio: '02', marzo: '03', aprile: '04', maggio: '05', giugno: '06',
  luglio: '07', agosto: '08', settembre: '09', ottobre: '10', novembre: '11', dicembre: '12',
};

/** Fields present on some records but not declared on the Person interface. */
interface PersonExtras {
  occupation?: string | string[];
  deathCause?: string;
}

function extras(p: Person): PersonExtras {
  return p as unknown as PersonExtras;
}

/* ------------------------------------------------------------------ */
/* Dates                                                              */
/* ------------------------------------------------------------------ */

/**
 * Convert an unambiguous leading "D Month YYYY" into DD/MM/YYYY.
 * Everything the conversion cannot represent losslessly is kept verbatim.
 */
export function formatDate(raw?: string): string {
  if (!raw) return 'unknown';
  const s = String(raw).trim();
  if (!s) return 'unknown';
  if (/^unknown\.?$/i.test(s)) return 'unknown';

  const m = s.match(/^(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})([\s\S]*)$/);
  if (m && MONTHS[m[2].toLowerCase()]) {
    const dd = m[1].padStart(2, '0');
    const mm = MONTHS[m[2].toLowerCase()];
    const rest = m[4] || '';
    return `${dd}/${mm}/${m[3]}${rest}`;
  }
  return s;
}

/** First 4-digit year in a date string (for sorting only). */
function firstYear(raw?: string): number | null {
  if (!raw) return null;
  const m = String(raw).match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

/* ------------------------------------------------------------------ */
/* Graph: generations, branches, ancestors                            */
/* ------------------------------------------------------------------ */

function buildGenerations(people: Person[], rootId: string): Map<string, number> {
  const byId = new Map(people.map(p => [p.id, p]));
  const gens = new Map<string, number>();
  const root = byId.get(rootId);
  if (!root) return gens;

  // 1. Breadth-first over parent/child edges from the root (shortest path wins).
  const queue: { id: string; g: number }[] = [{ id: rootId, g: 0 }];
  gens.set(rootId, 0);
  while (queue.length) {
    const cur = queue.shift() as { id: string; g: number };
    const person = byId.get(cur.id);
    if (!person) continue;
    for (const pid of person.parents || []) {
      if (byId.has(pid) && !gens.has(pid)) {
        gens.set(pid, cur.g - 1);
        queue.push({ id: pid, g: cur.g - 1 });
      }
    }
    for (const cid of person.children || []) {
      if (byId.has(cid) && !gens.has(cid)) {
        gens.set(cid, cur.g + 1);
        queue.push({ id: cid, g: cur.g + 1 });
      }
    }
  }

  // 2. Spouses share a generation. Repeat to a fixpoint.
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 200) {
    changed = false;
    for (const p of people) {
      if (gens.has(p.id)) continue;
      for (const sid of p.spouses || []) {
        const g = gens.get(sid);
        if (g !== undefined) {
          gens.set(p.id, g);
          changed = true;
          break;
        }
      }
    }
  }

  // 3. Anything still disconnected: fall back to the stored generation field,
  //    expressed relative to the root's stored generation (the stored values
  //    are not relative to "me = 0"; they are only usable as a delta).
  const rootStored = typeof root.generation === 'number' ? root.generation : 0;
  for (const p of people) {
    if (!gens.has(p.id)) {
      gens.set(p.id, (typeof p.generation === 'number' ? p.generation : rootStored) - rootStored);
    }
  }

  return gens;
}

function buildAncestors(people: Person[], rootId: string): Set<string> {
  const byId = new Map(people.map(p => [p.id, p]));
  const ancestors = new Set<string>();
  const root = byId.get(rootId);
  if (!root) return ancestors;

  const seen = new Set<string>([rootId]);
  const queue: string[] = [rootId];
  while (queue.length) {
    const id = queue.shift() as string;
    const person = byId.get(id);
    if (!person) continue;
    for (const pid of person.parents || []) {
      if (!byId.has(pid) || seen.has(pid)) continue;
      seen.add(pid);
      if (pid !== rootId) ancestors.add(pid);
      queue.push(pid);
    }
  }
  return ancestors;
}

function buildBranches(
  people: Person[],
  branchRoots: { paternal?: string; maternal?: string },
): Map<string, string> {
  const byId = new Map(people.map(p => [p.id, p]));
  const branch = new Map<string, string>();

  const markAncestry = (startId: string | undefined, label: string) => {
    if (!startId) return;
    const stack = [startId];
    while (stack.length) {
      const id = stack.pop() as string;
      if (branch.has(id)) continue;
      branch.set(id, label);
      const person = byId.get(id);
      if (!person) continue;
      for (const pid of person.parents || []) {
        if (byId.has(pid) && !branch.has(pid)) stack.push(pid);
      }
    }
  };
  markAncestry(branchRoots.paternal, 'paternal');
  markAncestry(branchRoots.maternal, 'maternal');

  // Propagate through spouses / children / parents until stable.
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 200) {
    changed = false;
    for (const p of people) {
      if (branch.has(p.id)) continue;
      const candidates: string[] = [];
      for (const sid of p.spouses || []) if (branch.has(sid)) candidates.push(branch.get(sid) as string);
      for (const pid of p.parents || []) if (branch.has(pid)) candidates.push(branch.get(pid) as string);
      for (const cid of p.children || []) if (branch.has(cid)) candidates.push(branch.get(cid) as string);
      if (candidates.length) {
        branch.set(p.id, candidates[0]);
        changed = true;
      }
    }
  }
  return branch;
}

/* ------------------------------------------------------------------ */
/* Relationship descriptions                                          */
/* ------------------------------------------------------------------ */

function ancestorTerm(gen: number, gender: 'M' | 'F'): string {
  const male = gender !== 'F';
  if (gen === -1) return male ? 'father (padre)' : 'mother (madre)';
  if (gen === -2) return male ? 'grandfather (nonno)' : 'grandmother (nonna)';
  if (gen === -3) return male ? 'great-grandfather (bisnonno)' : 'great-grandmother (bisnonna)';
  if (gen === -4) return male ? 'great-great-grandfather (trisnonno)' : 'great-great-grandmother (trisnonna)';
  if (gen < -4) {
    const n = Math.abs(gen) - 2;
    return `${n}× great-${male ? 'grandfather' : 'grandmother'}`;
  }
  if (gen === 0) return 'self';
  const n = gen;
  return `${n} generation${n === 1 ? '' : 's'} below Daniele`;
}

interface RelContext {
  rootId: string;
  byId: Map<string, Person>;
  gens: Map<string, number>;
  ancestors: Set<string>;
  branch: Map<string, string>;
}

function branchLabel(id: string, ctx: RelContext): string {
  const b = ctx.branch.get(id);
  if (b === 'paternal') return 'paternal line';
  if (b === 'maternal') return 'maternal line';
  return 'line not stated in data';
}

function relationshipTo(p: Person, ctx: RelContext): string {
  if (p.id === ctx.rootId) return 'self — this is Daniele';

  const gen = ctx.gens.get(p.id);
  const term = gen === undefined ? null : ancestorTerm(gen, p.gender);

  if (ctx.ancestors.has(p.id) && term) {
    if (gen === -1) return term;
    return `${term}, ${branchLabel(p.id, ctx)}`;
  }

  // Spouse of a direct ancestor.
  const ancestorSpouse = (p.spouses || []).map(id => ctx.byId.get(id)).find(s => !!s && ctx.ancestors.has(s.id));
  if (ancestorSpouse) {
    const sGen = ctx.gens.get(ancestorSpouse.id);
    const sTerm = sGen === undefined ? 'direct ancestor' : ancestorTerm(sGen, ancestorSpouse.gender);
    return `spouse of ${sTerm} ${ancestorSpouse.name}, ${branchLabel(ancestorSpouse.id, ctx)}`;
  }

  // Child of a direct ancestor (i.e. sibling of a direct ancestor descendant).
  const ancestorParents = (p.parents || []).map(id => ctx.byId.get(id)).filter((x): x is Person => !!x && ctx.ancestors.has(x.id));
  if (ancestorParents.length) {
    const terms = ancestorParents
      .map(a => `${ancestorTerm(ctx.gens.get(a.id) as number, a.gender)} ${a.name}`)
      .join(' × ');
    const siblingAncestor = (p.parents || [])
      .map(id => ctx.byId.get(id))
      .filter((x): x is Person => !!x)
      .flatMap(x => (x.children || []).map(cid => ctx.byId.get(cid)))
      .find((x): x is Person => !!x && x.id !== p.id && ctx.ancestors.has(x.id));
    const viaSibling = siblingAncestor
      ? `; sibling of ${ancestorTerm(ctx.gens.get(siblingAncestor.id) as number, siblingAncestor.gender)} ${siblingAncestor.name}`
      : '';
    return `${p.gender === 'M' ? 'son' : 'daughter'} of ${terms}, ${branchLabel(ancestorParents[0].id, ctx)}${viaSibling}`;
  }

  // Sibling of a direct ancestor.
  for (const pid of p.parents || []) {
    const parent = ctx.byId.get(pid);
    if (!parent) continue;
    const sibling = (parent.children || [])
      .map(cid => ctx.byId.get(cid))
      .find((x): x is Person => !!x && x.id !== p.id && ctx.ancestors.has(x.id));
    if (sibling) {
      return `${p.gender === 'M' ? 'brother' : 'sister'} of ${ancestorTerm(
        ctx.gens.get(sibling.id) as number,
        sibling.gender,
      )} ${sibling.name}, ${branchLabel(sibling.id, ctx)}`;
    }
  }

  if (gen === 0) {
    return `${p.gender === 'M' ? 'brother' : 'sister'} (same generation as Daniele)`;
  }

  if ((p.parents || []).length) {
    const parents = (p.parents || [])
      .map(id => ctx.byId.get(id)?.name || `unknown (id ${id} not in dataset)`)
      .join(' × ');
    return `extended family — child of ${parents}; exact relationship to Daniele not stated in data`;
  }

  return 'extended family — exact relationship to Daniele not stated in data';
}

/* ------------------------------------------------------------------ */
/* Names / formatting helpers                                         */
/* ------------------------------------------------------------------ */

function nameHeadline(name: string): string {
  const trimmed = String(name || '').trim();
  let base = trimmed;
  let suffix = '';
  if (trimmed.endsWith(')')) {
    const i = trimmed.lastIndexOf(' (');
    if (i > 0) {
      base = trimmed.slice(0, i).trim();
      suffix = trimmed.slice(i).trim();
    }
  }
  const tokens = base.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) {
    const only = tokens[0] || 'unknown';
    return `${only.toUpperCase()}${suffix ? ' ' + suffix : ' (single name recorded — given name or surname not stated)'}`;
  }
  const surname = tokens[tokens.length - 1];
  const given = tokens.slice(0, -1).join(' ');
  return `${surname.toUpperCase()}, ${given}${suffix ? ' ' + suffix : ''}`;
}

/** A place string, or '' when the data only says "Unknown". */
function placeText(place?: string): string {
  if (!place) return '';
  const s = String(place).trim();
  if (!s || /^unknown\.?$/i.test(s)) return '';
  return s;
}

function joinNames(ids: string[], byId: Map<string, Person>, fallback = 'unknown'): string {
  if (!ids || ids.length === 0) return fallback;
  return ids.map(id => byId.get(id)?.name || `unknown (id ${id} not in dataset)`).join('; ');
}

function list(items: string[], fallback = 'unknown'): string {
  if (!items || items.length === 0) return fallback;
  return items.filter(Boolean).join('; ');
}

function birthYearForSort(p: Person): number {
  const y = firstYear(p.birthDate);
  return y === null ? Number.POSITIVE_INFINITY : y;
}

function isExcluded(p: Person): boolean {
  if (p.researchStatus && p.researchStatus.status === 'Ruled Out') return true;
  return (p.records || []).some(r => r.status === 'Ruled Out');
}

/* ------------------------------------------------------------------ */
/* Person block                                                       */
/* ------------------------------------------------------------------ */

function renderPerson(p: Person, ctx: RelContext): string[] {
  const byId = ctx.byId;
  const gen = ctx.gens.get(p.id);
  const x = extras(p);
  const out: string[] = [];

  out.push(`### ${nameHeadline(p.name)}  — ID: ${p.id}`);
  out.push(`- Relationship to Daniele: ${relationshipTo(p, ctx)}`);
  out.push(`- Generation: ${gen === undefined ? 'unknown' : String(gen)}`);
  const birthPlace = placeText(p.birthPlace);
  out.push(`- Born: ${formatDate(p.birthDate)}${birthPlace ? ', ' + birthPlace : p.birthDate ? ', place unknown' : ''}`);

  const deathDate = p.deathDate && p.deathDate.trim() ? formatDate(p.deathDate) : p.isLiving ? 'unknown — recorded as living' : 'unknown';
  const deathPlace = placeText(p.deathPlace) || (p.deathDate ? 'place unknown' : '');
  out.push(`- Died: ${deathDate}${deathPlace ? ', ' + deathPlace : ''}`);

  out.push(`- Parents: ${p.parents && p.parents.length ? joinNames(p.parents, byId) : 'unknown'}`);

  // Spouses, with whatever marriage evidence is stored on either partner.
  if (!p.spouses || p.spouses.length === 0) {
    out.push('- Spouse(s): unknown');
  } else {
    const lines = p.spouses.map(sid => {
      const spouse = byId.get(sid);
      const spouseName = spouse ? spouse.name : `unknown (id ${sid} not in dataset)`;
      const seen = new Set<string>();
      const recs = [...(p.records || []), ...((spouse && spouse.records) || [])].filter(
        r => /marriage|matrimonio|spous/i.test(r.type) && r.notes,
      );
      const notes: string[] = [];
      for (const r of recs) {
        const n = String(r.notes || '').trim();
        if (!n || seen.has(n)) continue;
        seen.add(n);
        notes.push(`${r.type} [${r.status}]: ${n}`);
      }
      return `${spouseName} — ${notes.length ? notes.join(' | ') : 'marriage date/place: unknown (no marriage record in data)'}`;
    });
    out.push('- Spouse(s):');
    for (const l of lines) out.push(`  - ${l}`);
  }

  out.push(`- Children: ${p.children && p.children.length ? joinNames(p.children, byId) : 'unknown (none recorded in data)'}`);

  // Occupation / residences
  const occupations = [...(p.occupations || []), ...(Array.isArray(x.occupation) ? x.occupation : x.occupation ? [x.occupation] : [])];
  const residences = p.residences || [];
  if (!occupations.length && !residences.length) {
    out.push('- Occupation / residences: unknown');
  } else {
    const bits: string[] = [];
    if (occupations.length) bits.push(`occupations: ${list(occupations)}`);
    if (residences.length) bits.push(`residences: ${list(residences)}`);
    out.push(`- Occupation / residences: ${bits.join(' | ')}`);
  }

  // Sources: record-by-record evidence trail + source bibliography.
  const recordLines = (p.records || []).map(
    r => `${r.type} — ${r.status}${r.notes ? ' — ' + r.notes : ''}${r.link ? ' — Link: ' + r.link : ''}`,
  );
  const sourceLines = (p.sources || []).map(s => {
    const bits = [`${s.title} (${s.type})`];
    if (s.reference) bits.push(s.reference);
    if (s.link) bits.push(s.link);
    return bits.join(' — ');
  });
  if (!recordLines.length && !sourceLines.length) {
    out.push('- Sources: unknown');
  } else {
    out.push('- Sources:');
    for (const l of recordLines) out.push(`  - ${l}`);
    for (const l of sourceLines) out.push(`  - ${l}`);
  }

  // Notes: free-text notes, research status, next steps.
  const noteLines: string[] = [];
  for (const n of p.notes || []) if (n && n.trim()) noteLines.push(n.trim());
  if (p.researchStatus) {
    noteLines.push(
      `Research status: ${p.researchStatus.status}${p.researchStatus.details ? ' — ' + p.researchStatus.details : ''}`,
    );
    for (const step of p.researchStatus.nextSteps || []) if (step && step.trim()) noteLines.push(`Next step: ${step.trim()}`);
  }
  if (!noteLines.length) {
    out.push('- Notes: unknown');
  } else {
    out.push('- Notes:');
    for (const l of noteLines) out.push(`  - ${l}`);
  }

  // Everything else the record stores.
  if (p.siblings && p.siblings.length) out.push(`- Siblings (as stored): ${p.siblings.join('; ')}`);
  if (p.burialPlace || p.burialDetails || p.burialLink) {
    const bits = [p.burialPlace || 'place unknown'];
    if (p.burialDetails) bits.push(p.burialDetails);
    if (p.burialLink) bits.push(p.burialLink);
    out.push(`- Burial: ${bits.join(' — ')}`);
  }
  if (x.deathCause) out.push(`- Cause of death: ${x.deathCause}`);
  if (p.education && p.education.length) {
    out.push('- Education:');
    for (const e of p.education) out.push(`  - ${e}`);
  }
  if (p.migration) {
    const bits: string[] = [];
    if (p.migration.details) bits.push(p.migration.details);
    for (const v of p.migration.voyages || []) {
      const vBits = [v.ship ? `ship ${v.ship}` : 'ship unknown'];
      if (v.departure) vBits.push(`departure ${v.departure}`);
      if (v.arrival) vBits.push(`arrival ${v.arrival}`);
      if (v.date) vBits.push(`date ${formatDate(v.date)}`);
      if (v.details) vBits.push(v.details);
      bits.push(`voyage: ${vBits.join(', ')}`);
    }
    if (p.migration.sponsorship) bits.push(`sponsorship: ${p.migration.sponsorship}`);
    if (p.migration.settled) bits.push(`settled: ${p.migration.settled}`);
    if (bits.length) out.push(`- Migration: ${bits.join(' | ')}`);
  }
  if (p.military) {
    const bits: string[] = [];
    if (p.military.service) bits.push(`service: ${p.military.service}`);
    if (p.military.captured) bits.push(`captured: ${p.military.captured}`);
    if (p.military.internment) bits.push(`internment: ${p.military.internment}`);
    if (p.military.repatriation) bits.push(`repatriation: ${p.military.repatriation}`);
    if (p.military.details) bits.push(p.military.details);
    if (bits.length) out.push(`- Military: ${bits.join(' | ')}`);
  }
  if (p.physicalDescription) {
    const d = p.physicalDescription;
    const bits: string[] = [];
    if (d.height) bits.push(`height ${d.height}`);
    if (d.build) bits.push(`build ${d.build}`);
    if (d.hair) bits.push(`hair ${d.hair}`);
    if (d.eyes) bits.push(`eyes ${d.eyes}`);
    if (d.other) bits.push(d.other);
    if (bits.length) out.push(`- Physical description: ${bits.join(', ')}`);
  }
  if (p.passport) {
    out.push(
      `- Passport: number ${p.passport.number || 'unknown'}, issued ${p.passport.issued || 'unknown'}, issued by ${p.passport.issuedBy || 'unknown'}`,
    );
  }
  if (p.alienRegistration) out.push(`- Alien registration: ${p.alienRegistration}`);
  if (p.italianAddress) out.push(`- Italian address: ${p.italianAddress}`);

  return out;
}

/* ------------------------------------------------------------------ */
/* Main export                                                        */
/* ------------------------------------------------------------------ */

export interface ExportOptions {
  /** Defaults to today. Injected so the CLI and tests can pin the date. */
  date?: Date;
  rootId?: string;
}

export function buildFamilyTreeExport(
  people: Person[],
  leads: ResearchLead[] = [],
  questions: OpenQuestion[] = [],
  options: ExportOptions = {},
): string {
  const rootId = options.rootId || ROOT_ID;
  const now = options.date || new Date();
  const today = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const byId = new Map(people.map(p => [p.id, p]));
  const gens = buildGenerations(people, rootId);
  const ancestors = buildAncestors(people, rootId);
  const root = byId.get(rootId);
  const father = (root?.parents || []).map(id => byId.get(id)).find(p => p && p.gender === 'M');
  const mother = (root?.parents || []).map(id => byId.get(id)).find(p => p && p.gender === 'F');
  const branch = buildBranches(people, { paternal: father?.id, maternal: mother?.id });

  const ctx: RelContext = { rootId, byId, gens, ancestors, branch };

  const excludedPeople = people.filter(isExcluded);
  const excludedIds = new Set(excludedPeople.map(p => p.id));
  const mainPeople = people.filter(p => !excludedIds.has(p.id));
  const excludedLeads = leads.filter(l => l.status === 'Ruled Out');
  const unresolved = questions.filter(q => q.status !== 'Resolved');

  const lines: string[] = [];
  lines.push('# Buatti — Emmi Family Tree Export');
  lines.push('');
  lines.push(`- **Export date:** ${today}`);
  lines.push(
    `- **Total people:** ${people.length} — ${mainPeople.length} in the main tree, ${excludedPeople.length} excluded candidates`,
  );
  lines.push(
    `- **Research leads stored:** ${leads.length} (${leads.filter(l => l.status === 'To Investigate' || l.status === 'In Progress').length} open, ${excludedLeads.length} ruled out)`,
  );
  lines.push(
    `- **Open questions stored:** ${questions.length} (${unresolved.length} unresolved, ${questions.length - unresolved.length} resolved)`,
  );
  lines.push(`- **Root person:** ${root ? `${root.name} (${root.id})` : rootId}`);
  lines.push(
    '- **Generation convention:** Daniele = 0, parents = -1, grandparents = -2, etc. Generations are computed from the stored parent/child links (the `generation` field in the data is not relative to Daniele and is used only as a last-resort fallback for disconnected records).',
  );
  lines.push(
    `- **Ordering:** grouped by the stored family-line field (${SECTION_ORDER.filter(k => mainPeople.some(p => (p.line || 'Other') === k)).map(k => SECTION_TITLES[k]).join(', ')}), then oldest generation first, then birth year, then name.`,
  );
  lines.push(
    '- **Conventions:** dates are rendered DD/MM/YYYY only when that is lossless; every qualifier ("~", "ca.", "likely", "lettura incerta", "?", "Unknown — likely ...", document disagreements) is preserved verbatim. Conflicting readings are both printed, never resolved. Missing values are printed as "unknown".',
  );
  lines.push('');
  lines.push('---');
  lines.push('');

  // ---- Main sections ----
  for (const sectionKey of SECTION_ORDER) {
    const members = mainPeople
      .filter(p => (p.line || 'Other') === sectionKey)
      .sort((a, b) => {
        const ga = gens.get(a.id) ?? 0;
        const gb = gens.get(b.id) ?? 0;
        if (ga !== gb) return ga - gb;
        const ya = birthYearForSort(a);
        const yb = birthYearForSort(b);
        if (ya !== yb) return ya - yb;
        return a.name.localeCompare(b.name);
      });
    if (!members.length) continue;

    lines.push(`## ${SECTION_TITLES[sectionKey] || sectionKey.toUpperCase()}`);
    const gensInSection = members.map(p => gens.get(p.id)).filter((g): g is number => g !== undefined);
    if (gensInSection.length) {
      lines.push('');
      lines.push(
        `_${members.length} people, generations ${Math.min(...gensInSection)} to ${Math.max(...gensInSection)}._`,
      );
    }
    lines.push('');

    let currentGen: number | undefined;
    for (const p of members) {
      const g = gens.get(p.id);
      if (g !== currentGen) {
        currentGen = g;
        lines.push(`#### Generation ${g === undefined ? 'unknown' : g}`);
        lines.push('');
      }
      lines.push(...renderPerson(p, ctx));
      lines.push('');
    }
  }

  // ---- Excluded candidates ----
  lines.push('## EXCLUDED CANDIDATES');
  lines.push('');
  if (!excludedPeople.length && !excludedLeads.length) {
    lines.push('None stored.');
    lines.push('');
  } else {
    lines.push(
      'People and research leads the data explicitly marks as ruled out. Listed here in full — never silently dropped — because the reason for exclusion is itself evidence.',
    );
    lines.push('');

    for (const p of excludedPeople) {
      const gen = gens.get(p.id);
      lines.push(`### ${nameHeadline(p.name)}  — ID: ${p.id}`);
      lines.push(`- Family line: ${SECTION_TITLES[p.line || 'Other'] || p.line}`);
      lines.push(`- Generation (computed): ${gen === undefined ? 'unknown' : gen}`);
      const exBirthPlace = placeText(p.birthPlace);
      const exDeathPlace = placeText(p.deathPlace);
      lines.push(
        `- Born: ${formatDate(p.birthDate)}${exBirthPlace ? ', ' + exBirthPlace : p.birthDate ? ', place unknown' : ''}`,
      );
      lines.push(`- Died: ${p.deathDate ? formatDate(p.deathDate) : 'unknown'}${exDeathPlace ? ', ' + exDeathPlace : p.deathDate ? ', place unknown' : ''}`);
      lines.push(`- Parents: ${p.parents && p.parents.length ? joinNames(p.parents, byId) : 'unknown'}`);
      const reasons: string[] = [];
      if (p.researchStatus?.details) reasons.push(p.researchStatus.details);
      for (const r of (p.records || []).filter(r => r.status === 'Ruled Out')) {
        reasons.push(`${r.type} ruled out${r.notes ? ': ' + r.notes : ''}`);
      }
      for (const n of p.notes || []) if (/ruled out|excluded|not (our|the)|different person|not related/i.test(n)) reasons.push(n);
      lines.push(`- Reason excluded: ${reasons.length ? reasons.join(' | ') : 'unknown — flagged Ruled Out but no reason text stored'}`);
      const src = (p.sources || []).map(s => `${s.title} (${s.type})${s.reference ? ' — ' + s.reference : ''}`);
      const recs = (p.records || []).map(r => `${r.type} — ${r.status}${r.notes ? ' — ' + r.notes : ''}`);
      if (src.length || recs.length) {
        lines.push('- Sources:');
        for (const s of [...recs, ...src]) lines.push(`  - ${s}`);
      } else {
        lines.push('- Sources: unknown');
      }
      lines.push('');
    }

    for (const l of excludedLeads) {
      lines.push(`### LEAD — ${l.title}  — ID: ${l.id}`);
      lines.push(`- Status: ${l.status} | Category: ${l.category}`);
      lines.push(`- Proposal (as stored): ${l.description}`);
      lines.push(`- Reason excluded: ${l.whyRuledOut || 'unknown — marked Ruled Out but no reason text stored'}`);
      lines.push(`- Sources: ${l.sources && l.sources.length ? l.sources.join('; ') : 'unknown'}`);
      lines.push('');
    }
  }

  // ---- Open questions ----
  lines.push('## OPEN QUESTIONS');
  lines.push('');
  if (!questions.length) {
    lines.push('None stored.');
    lines.push('');
  } else {
    lines.push('Every stored research question, unresolved first. Resolved ones are kept because the answer often carries the source citation.');
    lines.push('');
    const sortedQuestions = [...questions].sort((a, b) => {
      const rank = (s: string) => (s === 'Resolved' ? 1 : 0);
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.id.localeCompare(b.id);
    });
    for (const q of sortedQuestions) {
      lines.push(`### Q — ${q.question}  — ID: ${q.id}`);
      lines.push(`- Category: ${q.category}`);
      lines.push(`- Status: ${q.status}`);
      lines.push(`- Notes: ${q.notes && q.notes.trim() ? q.notes.trim() : 'unknown'}`);
      lines.push('');
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
