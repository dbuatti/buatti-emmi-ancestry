# HANDOFF.md — briefing pack for a fresh session

**Last updated: 06/11/2026**
**Repo:** `~/dyad-apps/Buatti-Emmi Ancestry` · branch `main`
**Read this first, then `AGENTS.md` (the full PM log).** This file is a distilled briefing;
`AGENTS.md` is the unabridged history and is where new entries get appended.

---

## 1. What this project is

A React app that holds Daniele Buatti's family-history research: 84 people, 35 research
leads, 17 open questions, plus correspondence tracking for records requested from Italian
comuni, archives and the National Archives of Australia.

It is *not* a GEDCOM tool and has no database. There is one hand-maintained data file and
a set of read-only views over it.

**The four family lines** (the `line` field on each person):

| Section title in export | `line` value | People |
|---|---|---|
| BUATTI – GALANTI | `Buatti` | 28 |
| CHIAPPINI – PIRRI | `Chiappini` | 3 |
| EMMI – PATANÈ | `Emmi` | 18 |
| PATANÈ – D'AGATA / VECCHIO – RAITI | `Patanè` | 35 |

---

## 2. Working agreement with Daniele

- Act as **project manager**, not an encyclopaedia. Propose **one** immediate, fully
  actionable next step — not a wall of options.
- He gets overwhelmed by long lists. Give the single next action plus just enough context.
- **Always log** to `AGENTS.md` (and refresh this file) after acting, so work isn't repeated.
- Never silently "clean up" genealogical uncertainty — see §5.
- Small, verifiable steps. Confirm a link is live before claiming it works.

---

## 3. File map

| Path | What it is |
|---|---|
| `src/data/familyData.ts` | **Single source of truth.** Exports `initialPeople`, `initialResearchLeads`, `initialOpenQuestions`. All research edits happen here. |
| `src/lib/exportFamilyTree.ts` | Pure generator: `buildFamilyTreeExport(people, leads, questions, { date })` → plain-text tree. No I/O. |
| `src/components/LinkifiedText.tsx` | Turns any `http(s)://` URL found inside free text into a real clickable link. Used for person notes, record notes and research-log text. Records can also carry a structured `link` field (rendered as "Open record ↗"). |
| `scripts/export-family-tree.mjs` | CLI wrapper: writes the file, copies to clipboard, verifies with `pbpaste`. |
| `family-tree-export.md` | **Generated artifact** (~200 KB / 2,090 lines). Regenerate after any data edit — never hand-edit. |
| `src/components/AppHeader.tsx` | Hosts the **Copy family tree** button (clipboard + toast, `execCommand` fallback). |
| `AGENTS.md` | Full PM log: what's lodged, what's pending, what's closed. The memory. |
| `correspondence-log.md` | Letter/email trail, prot. numbers, drafts. |
| `AI_RULES.md` | Stack conventions (React 19 + TS + Vite + Tailwind + shadcn/ui + React Router). |
| Pages | `src/pages/Index.tsx`, `ResearchGoals.tsx`, `NotFound.tsx`. |
| Components | `PedigreeChart`, `PersonModal`, `EvidenceWiki`, `RecordMatrix`, `ResearchLog`, `TimelineTab`, `TreeConnected`, `TreeEgo`, `AncestorsDirectory`, `AppHeader`, plus `ui/` (shadcn). |

---

## 4. The export tool ("Copy family tree")

Purpose: dump the entire tree as plain text for pasting into an LLM chat.

- **In app:** header button → clipboard.
- **Terminal:** `pnpm export:tree` → also writes `family-tree-export.md`.
  Flags: `--no-clipboard`, `--out <path>`.
- **Output shape:** `### [SURNAME, Given names] — ID: [id]` per person, grouped into the four
  line sections, ordered by generation, then `EXCLUDED CANDIDATES`, then `OPEN QUESTIONS`
  (unresolved first).
- **Why one shared generator:** button and CLI must never drift. Both call
  `buildFamilyTreeExport`.
- Node v24 runs `familyData.ts` directly via type stripping (all its imports are type-only),
  which is why the CLI needs no build step.

---

## 5. Data-model traps — read before editing

1. **Generations are computed, not stored.** The `generation` field is *not* relative to
   Daniele (Daniele = 4, Alfredo Sr = 1). The export walks parent/child links and puts
   Daniele at 0, parents at −1. The stored field is only a fallback for disconnected records.
2. **`line` maps to the four section titles** — adding a new `line` value silently drops
   people from the export's grouped sections. Check the map in `exportFamilyTree.ts`.
3. **Uncertainty must survive verbatim.** Keep `~`, `ca.`, `?`, `lettura incerta`,
   "Unknown — likely …". Never normalise them away.
4. **Conflicting evidence is printed both ways.** Do not pick a winner. Example:
   Alessandro Galanti "~1895 (13 Jul vs 8 Nov — document disagreement)"; Rosario Patanè
   8 Feb 1889 in the record vs 9 Feb 1889 in the baptism-certificate note.
5. **Missing data prints as `unknown`** — never blank, never guessed.
6. **Dates render DD/MM/YYYY** only when the conversion is lossless; otherwise the original
   string is kept.
7. Known tech debt: `familyData.ts` has **36 pre-existing TypeScript errors** (enum strings,
   missing `spouses`, a stray `occupation` key). They do not break `npm run build`. Don't
   "fix" them casually — they're part of the data model's looseness.

---

## 6. Cemetery records — the free lookup that works

The Comune di Ascoli Piceno publishes a searchable burial database. This is currently the
**cheapest, highest-value** manual lookup route. Recipe:

```
POST https://www1.comune.ascolipiceno.it/cimitero/cimiteroweb/forms/DefuntoRicercaPost.asp
  defuntonominativo = "cognome nome"     e.g. "galanti ida"
  datainizio0 / datainizio1 = optional date range
→ result rows link to  .../DefuntoRicercaVisualizza.asp?varId=NNNN
```

**Verified records (all three links confirmed live, 05/11/2026):**

| Person | Record | Death | Plot |
|---|---|---|---|
| Ida Galanti | `DefuntoRicercaVisualizza.asp?varId=15950` | 26/01/1970 | Settore L, Blocco L074O, lotto 074 ossari, Posto 8, fila 1 |
| Alfredo Buatti Sr. | `?varId=15951` | 09/05/1964 | same plot |
| Ezio Buatti | `?varId=25135` | 16/10/1991 | same plot — the family ossuary, three generations |

All three are recorded in `familyData.ts` (`burialPlace`, `burialDetails`, `burialLink`), with
the raw record-page text quoted verbatim.

**Critical limitation:** the record page shows **only the death date and the plot — no birth date, no age.** So the cemetery database cannot resolve the 1893-vs-1904 Ida question. **Find a Grave** was checked as an alternative on 05/11/2026: the main Ascoli cemetery is listed there as "Cimitero di Ascoli Piceno" (Borgo Solestà) with seven Galanti entries but **no Ida Galanti and no Buatti entries at all** — no headstone photo exists there. Route closed.

Also present: 13 other Buatti burials at Borgo Solestà (Domenica †1930, Elisa †1991,
Filomena †1935, Giovanni 1909–1933, Luigi 1910–1978, Lupi Maria 1900–1922, Oddo 1908–1958,
Pietro 1942–2006, Rosa 1919–1979, Trieste 1915–1990, Vincenzo †1935) plus Sonia †2021
(cimitero non definito).

`galanti` returns 180 records across 9 pages — only partially reviewed. No obvious
Antonio Galanti (b. 1857), so his death is likely pre-database or died outside Ascoli.

---

## 7. Research state (as of 06/11/2026)

### The live puzzle
Which **Ida Galanti** married Alfredo Buatti — the one born 1893 (d/o Antonio + Virginia)
or 1904 (d/o Ignazio + Clementina)? Everything else in the Buatti line hangs off this.

**Answered how:** an Italian *atto di morte* names the deceased's parents. Ida died
26/01/1970 and Alfredo 09/05/1964, so both acts are recent and exactly dated — **D13**
requesting them went to Ascoli on 05/11/2026. A reply saying "figlia di Antonio" ends the
question; "figlia di Ignazio" ends it the other way.

### Awaiting replies (do not chase — already followed up)
- **D13, Comune di Ascoli Piceno** (Dott.ssa Falciatori, protocollo@comune.ap.it) — copia
  integrale of **Ida's 1970 and Alfredo's 1964 death acts**, parents shown. Sent 05/11/2026.
  The letter argues that exactly-dated death acts are not a €250–300 "ricerca".
- **D10 + D14, Comune di San Benedetto del Tronto** (Rosa De Falco) — sent 05/11/2026:
  D10 = estratto of marriage n. 45/1930 (parents only); D14 = **Irma Pirri's death act**,
  window 1930–1952. ⚠️ SBT has now had three requests in a week — **send nothing else to SBT
  until she replies.**
- **D15, Curia di San Benedetto del Tronto** (Sig.ra Veccia, curia@diocesisbt.it) — Irma Pirri's
  parish death/burial entry 1930–1952, plus whether any parish answered the July 2026 request.
  **Sent 06/11/2026.** Awaiting reply.

### Awaiting decisions (money)
- ~~€300 Ascoli fee (prot. 0098310) for the Alfredo×Ida marriage search~~ — **superseded
  05/11/2026** by D13. Don't pay unless D13 comes back refused.
- **NAA Item 4384476** (J25 1969/7259, Patane Alfio & Rosaria) — released "open with
  exemption" 30/10/2026. Buy digital copy **or** view in the Brisbane reading room (5 days'
  notice). Note this Rosaria (b. 1926) is *not* our Rosaria (b. 23/05/1924).
- **NAA SP1121/1 item 9637786** ($26.45) — blocked until the Chiappini relationship is
  confirmed by family memory or a free BDM hit.

### Open but not yet acted on
- **Curia di San Benedetto del Tronto** — now handled via D15 (sent). Next: await reply.

### Answered standing questions
- NAA A446 1967/39646 (Rosario Patanè b. **18/11/1895**) is **not** our Rosario Patanè, who was
  born **8 February 1889** at Contrada Trifilippi, Calatabiano. (Conflicting baptism note: 9 Feb 1889 — both kept.)

### Closed / negative — do not re-run
Ascoli Antenati has **no marriage registers** published (only censimento + 4 morti allegati).
**Find a Grave**: no Ida Galanti, no Buatti entries at Cimitero di Ascoli Piceno.
NSW + VIC BDM death indexes: no Gino Chiappini. Ryerson + Trove: no Gino notices.
NAA RecordSearch by surname / "Buatti bankruptcy" / "248/1957": no hits (the file is likely
indexed by registry number only — the Contact Us route `NAA1000457651` is already lodged).
Neptunia outbound manifest not needed — the departure annotation "LEFT PER NEPTUNIA ON
13/9/63 FROM MELB" is on B78 item 5746087, already held.

---

## 8. Parked thread — FamilySearch record hints (19)

Daniele's FamilySearch account (`Daniele97481`) has **19 pending record hints**, 3 shown.
Parked on 05/11/2026 to be triaged later. **Do not "Review & Attach"** — that writes into the
shared public FamilySearch Tree, where our Emmi line's twin-traps (two Antoninos, two Egidios,
Raiti vs Nasti) would be re-merged.

**Three-question test for every hint:**
1. **Right century?** (a 1904 death of a 75-year-old is not our 1877 Concetta)
2. **Right place?** (Linguaglossa, Sicily — *not* Istria, *not* Ascoli)
3. **Right parents?** (do the named parents match what we hold?)

All three must pass before anything is logged, let alone attached.

| Hint | Status |
|---|---|
| Egidio Emmi 1870– (Catania, Tribunale) | Likely ours — check it is **Nati 1870, atto n. 31, parte I** |
| Concetta Sgroi 1874– (Catania, Tribunale) | ⚠️ Our date is 10/03/1877 (atto n. 58). A third variant, or a different woman. **Do not attach.** |
| Salvatore Emmi 1864– (Diocesi di Acireale) | Arithmetic problem: our Antonino (b. ~1849) would have been ~15. Not Egidio's brother, or the year is wrong. |
| "Antonino Emmi as son of Egidio" | **Best lead of the batch.** Probably the unnamed older brother who went to Venezuela — Sicilian naming convention names the first son after the paternal grandfather (Antonino). Needs a birth year + the mother's name. |
| 15 more not yet seen | Use "View more hints" and list them before triaging one by one |

**Value is in the collections, not the names:** *Catania, Tribunale, 1866–1929* = court duplicates
of the same acts, same act numbers (a free cross-check index); *Diocesi di Acireale, 1560–1950*
= parish registers, the same corpus as our DGS films (e.g. DGS 5455112 gave Gregorio's 1915
baptism) and the only route that can settle **Raiti vs Nasti** via a baptism.

---

## 9. Known conflicts — print both, never resolve

| Fact | Version A | Version B |
|---|---|---|
| Ida Galanti's identity | b. 1893, d/o Antonio + Virginia | b. 1904, d/o Ignazio + Clementina |
| Alessandro Galanti birth | ~1895, 13 July | ~1895, 8 November |
| Rosario Patanè birth | 8 Feb 1889 (record) | 9 Feb 1889 (baptism-certificate note) |
| Ezio's return to Australia | "returned 1975" (family story) | died Maltignano/Ascoli 16/10/1991 as *pensionato* — 1963–1991 period still unreconstructed |
| Ezio's address | Via T. B. Barro 11 (1944–48) | Via Fabriano 25 (first appears on a 1964 doc) |

---

## 10. Ranked next steps

1. **Wait on D13** (Ida + Alfredo death acts, Ascoli) — the next reply that can actually end
   the 1893/1904 question. Don't pay the €300 unless it's refused.
2. **Send D11** (Alfredo's personnel file as *Economo*) to Ascoli — but a week or two after
   D13, not the same day.
3. **Hold D14/D10** — three SBT requests already in flight; let De Falco answer.
4. **Decide on NAA Item 4384476** (buy copy vs Brisbane reading room).

---

## 11. Command cheat sheet

```bash
pnpm dev            # vite dev server
pnpm build          # the real gate — must pass
pnpm lint           # 3 pre-existing errors in ui/ + tailwind.config.ts, not ours
pnpm export:tree    # regenerate family-tree-export.md + clipboard
node scripts/export-family-tree.mjs --no-clipboard --out /tmp/tree.md

npx tsc --noEmit -p tsconfig.app.json   # expect 36 pre-existing familyData.ts errors only

git status --short | grep -v -E "node_modules|dist/|\.dyad|\.DS_Store"
```

---

## 12. Change history of this document

- **06/11/2026** — D15 (Curia letter) sent to curia@diocesisbt.it; moved to "Awaiting replies". Updated ranked next steps; removed D15 from top priority (step 1 now: wait on D13).
- **05/11/2026** — created. Captures: the export tool + data-model traps, the cemetery
  link fix and its verified records (`varId=15950` / `15951`, plus the unrecorded
  `buatti ezio` 1991 entry), the current research state, the known-conflict table, and the
  ranked next steps.
- **05/11/2026 (later same day)** — D13 and D14 sent; Ezio's burial record (`varId=25135`,
  same ossuary) added to the data and to the export. Recorded that the cemetery page shows
  **no birth date or age**, that Find a Grave has **no Ida Galanti and no Buatti entries**,
  and that the €300 marriage search is **superseded** by D13. Next step is now the Curia
  di SBT for Irma Pirri.
- **05/11/2026 (later still)** — URLs embedded in notes are now clickable throughout the app
  (`LinkifiedText.tsx`), and records support a structured `link` field rendered as
  "Open record ↗" (Concetta Sgroi's 1877 birth act migrated). Export prints `Link:` lines.
  Also recorded a ruled-out negative: a FamilySearch "Concetta Sgroi" hint resolved to a
  1904 death at **Pinguente/Buzet, Istria** — 75 years old, never married, daughter of
  Salvatore Sgroi — i.e. **not our Concetta** (b. 1877 Linguaglossa, m. 1900, d/o Gregorio
  Sgroi + Santa Calì). Same-name trap; the hint should be dismissed.
- **05/11/2026 (evening)** — added **§8 Parked thread: FamilySearch hints (19)** so the batch can
  be resumed cheaply, with a three-question test (century / place / parents) and a per-hint
  verdict table. Recorded the best lead of the batch: the "Antonino Emmi as son of Egidio" hint
  may identify the **unnamed older brother who went to Venezuela** — Sicilian naming convention
  names the first son after the paternal grandfather, and that grandfather was Antonino Emmi
  (~1849). Not confirmed; noted on the brother's record so it isn't lost.
- **05/11/2026 (late)** — record-page tooling only (no research impact): check mode widened
  (3:2 split, `max-w-[1800px]`); transcriptions now stored as line items (`- Line N: …` +
  `  en: Line N: …`) and the check screen rebuilt around them; links are **deletable**
  (Open / Copy / Delete) and the links YAML reader was fixed (it never read the label value, so
  every link showed as "label"); `process inbox` workflow added to `WORKFLOW.md`/`AGENTS.md`;
  and the record page now ends each record with a **Next step** card (`STEP_DETAILS` in
  `src/lib/workflow-steps.ts`) naming step 4 (`in_app`) / 5 (`on_familysearch`) and a copyable
  prompt for OpenCode. Research state unchanged — D13 (Ida + Alfredo death acts) is still the
  reply that matters.
- **05/11/2026 (late, step 4)** — `1915_Linguaglossa_baptism_Emmi-Gregorio_n251` is now
  **`in_app: true`** (step 4 of 5). Nothing in the app contradicted the entry, so the apply was
  provenance-only: translation fixes (*ut ass.* = "as is stated"; "and Josepha Nicotra [role
  unread, possibly midwife]"), the officiant/midwife readings downgraded to **unverified**,
  the FamilySearch ark added to the record entry + source, a new lead
  **`lead-linguaglossa-baptisms-5455112`** (walk Linguaglossa baptisms **1901–1921** — DGS
  5455112 for 1914–1921, and find the films for 1901–1913 — for Gregorio's 5+ siblings and for
  Rosaria Emmi), and a new open question **`q-godmother-rosaria-emmi`**.
- **05/11/2026 (step 4 tooling)** — `parseDiscrepancies` never returned anything: it looked for
  the substring `"discrepancy"`, which the plural header `## Discrepancies` does not contain.
  Now matches the stem `/^discrepanc/i`, so check mode finally shows each record's real
  discrepancies (baptism = 3, atto 202 = 2). `WORKFLOW.md` step 4 now **requires** the
  `## FamilySearch` block in the same pass (8 numbered fields), and says a record is not
  `in_app` until that block exists. Committed `a766844`, not pushed.
- **05/11/2026 (Next card)** — `known_no_record` events no longer say "Create one". The card now
  reads **"Get the document"**, shows **Where it is** straight from the event's `note`, and names
  the office found in that note. Buttons: **Requested (waiting for reply)** (hides the event for
  **30 days**, then it returns as **Chase `<office>`?** with the day count), **Found online**
  (asks for the link and creates `records/<id>/record.md`), **Received** (saves `receivedOn` and
  shows the `process inbox` instructions). State persists in **`src/data/event-requests.json`**,
  keyed `"<personId>|<eventType>"`. New dev endpoints `POST /api/event-override`,
  `POST /api/create-record`, `POST /api/open-inbox`. See `WORKFLOW.md` → "The Next card and
  `known_no_record` events".

*(Append one dated line here at the end of every session, and update "Last updated" above.)*
