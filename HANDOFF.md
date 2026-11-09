# Person page (built by Claude, 5 Nov 2026, evening)
/people/:personId (src/pages/PersonPage.tsx). Extras saved to src/data/person-meta.json via POST /api/person-meta (src/lib/person-meta.ts; withMeta() merges over familyData). Sections: header + progress; FamilySearch ID (paste link or ID), other FamilySearch profiles, links; notes; life events with the next action per row (process inbox / transcribe next / Open check / run step 4 / FamilySearch card / Requested-Received); records naming the person; FamilySearch page check. PersonModal has "Open full page →".
STILL TO DO (part 2): facts with sourced/unsourced/provisional badges; open questions + research leads for the person; "Next for this person" (Next card filtered); public build read-only and hiding living people's details; make tree clicks open the page directly; NextGuide person name → link to the page.

# FIRST JOB next session — "Bottom-up queue" prompt (paste into OpenCode, coding model)

```
Replace the hard-coded pilot person in the Next guide with an automatic bottom-up queue:

1. Order people by closeness to Daniele: Daniele first, then parents, then
   grandparents, then great-grandparents, and so on (use generation: highest
   generation number first; within a generation keep a stable order by line).
2. The Next card works on the closest person who is NOT finished. A person is
   finished when every life event (birth, baptism, marriage(s), death, burial,
   migration/naturalisation) has a verified record at step 5 AND their FamilySearch
   person check is clear. Events waiting on a request (requested_on < 30 days) do
   not block: move on, and come back when the chase is due.
3. Show "Working on: <name> (<relationship>)" and progress, e.g. "Gregorio Emmi
   (grandfather) - 4 of 9".
4. Add "Skip this person": saves skipped_on; the person goes to the end of the queue
   and returns after everyone ahead is finished or waiting. Keep the existing
   per-task "Skip for now".
5. Living people (Daniele, parents): same checklist, but records stay local-only and
   never go to FamilySearch Memories.
6. AGENTS.md guide mode uses the same queue (scripts/next-task.ts) so app and
   OpenCode always agree on who is next.
7. Also add "identify <folder>" for _unsorted/: one file at a time, ask me to paste a
   close-up to the VL model, propose the record id from the transcription, file it
   only after I confirm.
Test with the current data: the card should start with Daniele. Commit, don't push.
```

# Session 5 Nov 2026 — summary (Claude)

Done: records system live (inbox → "process inbox" → Next card: file → transcribe → check → apply → FamilySearch); FAMILY TREE folder organised into the repo (189 files, hashes verified; images gitignored, never deployed); Gregorio Emmi birth (Linguaglossa Nati 1915 atto 202, 23 Oct 1915) and baptism (DGS 5455112 n. 251, born 27 Oct / baptised 5 Dec 1915) both through all 5 steps; 23 vs 27 kept as discrepancy; leads: Fiumefreddo Matrimoni 1948 parte II serie A n. 34, Linguaglossa Cittadinanza 1961 atto 32 parte I, godmother Rosaria Emmi, siblings in Linguaglossa baptisms 1901–1921. New: check mode, FamilySearch form card, Get-the-document card (office now taken from "Reference:", editable), FamilySearch person check (/familysearch/:personId, PersonModal tab, saves src/data/fs-checks.json, Next card task once all records are on FamilySearch). Gregorio familySearchId → P65X-5T7 (old G4QG-QD1 kept in a comment).

Next: commit + push; make GitHub repo private; send Fiumefreddo draft (info@ Drafts) then mark Requested; FamilySearch check for Gregorio (add Birth, Christening, Marriage; review P65V-T59, Acireale hint; Concetta Sgroi 1874 vs 1877); later: NSW death cert, Linguaglossa citizenship 1961 atto 32, baptism films 1901–1913, identify 111 _unsorted files. Known issue: TS error in NextGuide "Found online" (personId).

# HANDOFF.md — briefing pack for a fresh session

## Future capability: Email and Document Intelligence (added 06/11/2026)

The Research Operations Centre will eventually understand the relationship between Gmail
correspondence, document attachments and genealogy records.

**Design decisions:**
1. The existing `attachments` table is the starting point. Extend it rather than creating
   a parallel document database.
2. Preserve full provenance: original Gmail account, message, thread, attachment and
   original file. Never discard the original source.
3. Build a searchable attachment inventory as part of the correspondence experience.
4. Eventually classify documents, extract names/dates/places and suggest links to
   genealogy people and life events.
5. All person and record matching must require user approval. Never silently assign
   uncertain documents to a person.
6. Document lifecycle statuses: discovered, needs_review, verified, filed, duplicate.
7. Outstanding research requests stay in the existing genealogy research workflow
   (`lifeEvents` with `known_no_record`), not as attachment statuses.
8. Never overwrite existing records or discard original sources.

**Implementation phases (not yet started):**
- Phase 3 (UI): correspondence dashboard — prerequisite for document intelligence UI
- Phase 4 (backend): attachment inventory API, filename-based record-type classifier,
  cross-account duplicate detection, document status column, link suggestion engine
- Phase 5 (UI): document review workflow, "open original email", "save to record"

**Current readiness:** Data layer is well-positioned. Attachments table has filename,
mime_type, size_bytes, gmail_attachment_id, local_path, ocr_text, unavailable tracking.
Messages have account_email, gmail_message_id, gmail_thread_id, subject, snippet,
body_text. Full provenance chain exists. Gaps: no document classification, no entity
extraction, no lifecycle tracking beyond availability, no bridge to genealogy records.

---
# HANDOFF.md — briefing pack for a fresh session

**Last updated: 09/11/2026 (OCR: comune-extract reader `src/lib/ocr/ciec-extract.ts` + panel + `pnpm test:ocr`; Egidio 1870 atto 31 transcribed, unverified; earlier — session continues — Records hub page created + /research/records index route added (fixed "records page doesn't go anywhere"); needs_review semantics clarified; backup + client records browser discussed). PLUS this session: assistant panel: purpose column, pill filters, chase-filter fix, translate button; Gemini analyse/translate backend with --model/--backlog + retry/backoff; NextGuide sent-correspondence auto-detect; thread-links phase 2 from analyses; PLUS this session: Next-card fixes — get_document headline now renders task.note; task queue prefers pending requested events over never-requested fresh ones; new /research/documents page created + wired (route + ResearchHub card); new Research sub-nav (ResearchLayout) added to App routes; source-in-email lookup implemented + fixed (startsWith + query) and LIVE VERIFIED (found source content in msg 39; `Linguaglossa` query → 25 hits); Correspondence page clarity pass added (purpose statement + per-tab captions); RecordMatrix now renders EVERY stored person (was hard-coded 22 ids); ResearchLayout rendered `{children}` instead of `<Outlet />` → research pages rendered BLANK (nav only) — FIXED + verified in browser; `/research/people` index added (redirect → /family/people) — FIXED + verified; tsc clean (familyData-only pre-existing), vite build exit 0, dev server 200 on all /research/* + /api/health.)** PLUS this session: ScanStatusBanner delivered + verified (banner on Correspondence page; health endpoint returns `scan`; last scan 09/11/2026 16:27:58 ok; Re-scan button live); Gemini sweep 19/19 done; NAA msg 11355 analysed (recognised NAA1000467032 / B160-248-1957).; assistant panel: purpose column, pill filters, chase-filter fix, translate button; Gemini analyse/translate backend with --model/--backlog + retry/backoff; NextGuide sent-correspondence auto-detect; thread-links phase 2 from analyses)**
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

- **09/11/2026 (scan banner + retrigger delivered; gemini sweep green; naa scan recognised)** — User: "Can I have a small banner that shows when the last gmail scan was" + "And ability to retrigger". **Banner**: extended `GET /api/correspondence/health` to return a `scan` block (per-account `last_scan_at`/`last_scan_status`/`last_error` from `scan_state`). New `src/components/ScanStatusBanner.tsx` → small banner on the Correspondence page: pulsing status dot + "Last Gmail scan: … (ok)" + **Re-scan now** button (POST `/api/correspondence/detect-new` → toast + refresh). Verified live in browser on `/research/centre`: banner shows "Last Gmail scan: 09/11/2026, 16:27:58 (ok)", Re-scan button present + click dispatched OK. **Gemini sweep finished**: all 19 ai_jobs done, 0 failed. **Gemini analysis of latest NAA email (msg 11355) completed** — recognised protocol `NAA1000467032`, record `B160 / 248 / 1957 / [Sequestration Order files] Buatti, Ezio / Melbourne`, people Daniele Buatti + NAA officer Kimberley D + Ezio Buatti. **Gemini coverage**: only 125/11,112 messages scanned (~1%) — NOT all emails yet. **User thread context**: PEC from comune.ap@pec.it (death acts Ida Galanti m.26/01/1970 + Alfredo Buatti m.09/05/1964, thread `1a1abc46de4b71d3`, classification government/definite, 10 attachments incl. daticert.xml, postacert.eml, doc07061420261105133528.pdf, riepilogo_mail_77780194.pdf, ricevuta.pdf…).

- **09/11/2026 (research pages BLANK — layout Outlet bug + /research/people 404 fixed)** — User: "Nothing is loading:" → investigated in browser: `/research` rendered **nav only** (no `<main>`, no h1, body text = nav labels only, `document.readyState complete`, zero console errors). **Root cause**: the new `ResearchLayout` in `src/App.tsx` rendered `{children}` instead of React Router's `<Outlet />` — pathless layout routes inject the child page via `<Outlet />`, so the nav rendered but page content never did. **Fix**: `ResearchLayout` now renders `<Outlet />` (import added to the existing react-router-dom import). Verified live in browser: `/research` now renders hub content (h1 "Research", main, cards). **Also fixed**: missing index route for `/research/people` (nav + Hub card pointed there, but only `/research/people/:personId` existed → 404) → added `<Route path="/research/people" element={<Navigate to="/family/people" replace />} />`. Verified: `/research/people` now redirects to `/family/people` and renders. Final gates after fix: `tsc -b` clean (familyData-only pre-existing), eslint clean on touched files, `npx vite build` exit 0.

- **09/11/2026 (agent autonomy: source-in-email + clarity + record matrix + build fix)** — Daniele: "Do it" → source-in-email lookup built (`GET /api/correspondence/source?q=` LIKE over subject/from/snippet/body, LIMIT 25) + NextGuide panel. Live test caught route bug (`url ===` failed with `?q=` → fixed to `startsWith` + URL parsing like the sent-request endpoint). Verified: found real source content ("Dall'estratto dell'atto di nascita di EMMI Gregorio (Linguaglossa, atto n. 202/1915, rilasciato il 30/06/2026)...") in message 39; `Linguaglossa` query → 25 hits. Research nav (`ResearchLayout` + `RESEARCH_NAV`) added — all /research/* pages navigable. Correspondence clarity pass: purpose statement + per-tab captions (archive / new items / requests / decisions). RecordMatrix now maps over ALL `people` passed in (dropped hard-coded `PEOPLE_IDS`) — every stored person, all their records. Build broken mid-session (linux x64 container vs darwin-arm64 rolldown binding) → fixed via `@rolldown/binding-linux-x64-gnu@1.0.0-rc.17` (package.json/lockfile reverted after). Final gates this session: `tsc -b` clean outside familyData baseline, `npx vite build` exit 0, eslint clean on all touched TS/TSX, dev server 200 on all /research/* + /api/health.

- **09/11/2026 (source-in-email + research nav + build fix)** — Daniele said "Do it" → built the source-in-email lookup. New `GET /api/correspondence/source?q=<text>` in `localCorrespondenceApiPlugin` (LIKE match over subject/from_name/from_email/snippet/body_text, LIMIT 25) + "Source in email" panel on the NextGuide get_document card (queries `task.whereItIs || task.office || task.eventType`). **Bug found & fixed**: the new `useEffect` landed after the `if (!recordsLoaded) return` early return → rules-of-hooks violation (conditional hook) — moved task computation + effect above all early returns. `tsc -b` clean (outside familyData baseline), eslint clean on NextGuide/App/ResearchHub (0 errors; vite.config.ts at pre-existing 38-debt). **Build broken this session**: `npx vite build` exited 1 — rolldown native binding `@rolldown/binding-darwin-arm64` not found because this container is **linux x64**, not darwin/arm64; fixed via `pnpm add -D @rolldown/binding-linux-x64-gnu@1.0.0-rc.17` (then reverted package.json + lockfile; tree clean). Build now exits 0; dev server 200 on all /research/* + /api/health. Next card confusion fixes (task.note headline, pending-before-fresh queue) from earlier this session remain in place.

- **09/11/2026 (agent autonomy: next-card + docs page + research nav)** — Daniele pushed back on the app: "Create a page somewhere that explains where images and documents are stored and how the inbox and processing commands work." New `src/pages/Documents.tsx` (storage zones: intake `_inbox/`/_unsorted/`/_processed/, `records-local/<id>/` `<id>_pN.ext` + sha256, `records/<id>/record.md` fields, Gmail attachments → `correspondence/attachments/` + `.local/correspondence.db`); 5-step lifecycle cards; `process inbox` steps (identify → resolve uncertainty → file → move → transcribe); companion commands (`transcribe next`, `identify <folder>`, check-against-image). Wired: route `/research/documents` + ResearchHub card. Also added Research sub-nav (`ResearchLayout` + `RESEARCH_NAV`) in App routes → all `/research/*` pages now navigable from one menu (fixes "can't go back or navigate" on `/research/people/gregorio-emmi`). Next-card fixes: get_document headline now renders `task.note` (was hardcoded — duplicate "Get the document"); task queue prefers pending (requested/waiting ≤30d) known_no_record events over never-requested fresh ones — Gregorio's death/marriage/burial (requested 2026-11-05) now surface instead of jumping to never-requested migration event. Gates: `tsc -b` clean outside pre-existing `familyData.ts` errors, `vite build` passes, dev server 200 on /research/people/gregorio-emmi + /research/documents + /api/health, App renders again after ResearchLayout crash fix. Plan file added: `AGENT-PLAN.md`.

- **09/11/2026 (sidecar persistence for UI adds/edits — pothole 2 closed)** — Daniele approved option 2. **Non-persistent add/edit buttons fixed via the sidecar-file route** (same pattern as person-meta.json; familyData.ts is never written). New `src/data/tree-overrides.json` stores **operations only** (added people/leads/questions, `deletedPersonIds`, `leadStatus`/`questionStatus` overrides) — never a copy of familyData, so no drift. New `src/lib/tree-overrides.ts` exports pure merges (`withPeopleOverrides`/`withLeadOverrides`/`withQuestionOverrides`) + fire-and-forget `saveTreeOverride()` that warns via toast but degrades gracefully outside local mode (404-aware). Index.tsx state initializers merge the sidecar; add/delete person persist; **Reset now also clears the sidecar** (`op:'reset'`) so restored-to-default data stays that way. ResearchLog add-lead/add-question and both status-update paths persist. New dev endpoint **POST /api/tree-overrides** in `localRecordsApiPlugin` (op-dispatch, id regex, status whitelists; `addPerson` *revives* a previously deleted id). **Verified**: `pnpm build` passes; eslint clean on all touched files; `tsc -b` 0 new errors; real-module merge tests (esbuild --bundle of the actual TS, not a re-implementation) pass in clean phase A and mutated phase B; endpoint round-trip tested with sidecar then reset byte-identical to seed (md5 `6e41b6d1…`). **Trap found and fixed during testing**: re-adding a person whose id matches a familyData person used to shadow the real record with an empty UI stub — merge now prefers base data (adds are revival-only in that case). Committed, not pushed.

- **09/11/2026 (audit follow-through — two persistence/visibility fixes)** — Followed the audit: implemented the two zero-decision fixes. (1) **RecordPage loads ALL records**: the two hard-coded `?raw` imports are replaced by the same `import.meta.glob('/records/*/record.md')` mechanism as `src/lib/record-loader.ts`; previously `/record/:id` dead-ended with "Record not found" for 11 of the 13 records linked from PersonPage/NextGuide/PersonModal. Defensive fallback: an empty front-matter `id` falls back to the URL `recordId` (record-loader parity). Also cleared the file's pre-existing lint debt (4× `catch (e: any)` → typed) — `npx eslint src/pages/RecordPage.tsx` is clean. **Verified live**: the dev-served module imports all 13 record.md files. (2) **`POST /api/person-meta` implemented** in `localRecordsApiPlugin` (mirrors `/api/event-override`: shallow merge, null deletes the field, `patch:null` deletes the entry; validates `personId`). The audit found the endpoint missing (404) — the PersonPage Save buttons for FamilySearch ID / alt profiles / links / notes could never persist. **Verified end-to-end**: POST → file updated → `patch:null` → `src/data/person-meta.json` byte-identical to pre-test (md5 `1f707cee…`). Gates: `pnpm build` passes; full `tsc -b` error set unchanged (54, all pre-existing incl. the RecordPage `size="sm"` pair and the vite.config `lastLines` pair from uncommitted correspondence work); eslint shows **zero errors inside the inserted vite.config block** (445–485). Committed, not pushed.
- **07/11/2026 (Phase 2 — attachment download live)** — OAuth for `info@danielebuatti.com`
  re-authorised and confirmed working (dry-run sync OK). Added `--download` /
  `--download-message <GMAIL_MESSAGE_ID>` to `scripts/sync-gmail.py`:
  `download_attachment()` via `users().messages().attachments().get(userId='me',
  id=<att>, messageId=<msg>)`, binary-safe base64 decode, writes to
  `correspondence/attachments/<safe_filename>`, sets `attachments.local_path`, skips rows
  with `local_path` already set (idempotent). Ran live for Phase 2 test message
  `1a1abc46de4b71d3` (internal id 14): **9/9 attachments downloaded**, byte-exact size match
  vs DB `size_bytes`; re-run → 0 candidates (idempotent). `postacert.eml` correctly skipped
  (no gmail_attachment_id). Also added `getAttachmentsDir()` to `scripts/correspondence-db.mjs`
  + `.d.mts`. New dev endpoint **GET /api/correspondence/attachments/:id** in
  `localCorrespondenceApiPlugin` (dev-only, path-traversal safe, 404 if not downloaded).
  `MessageDetail.tsx` "Local" link now points at that endpoint (was a raw filesystem path).
  Verified: endpoint 200 + MD5 match on PDF (1,019,458 B), 404s for undownloaded/missing;
  health 200; RC page 200; Python tests 117/117; `tsc -b` back to pre-existing 44-error
  baseline (none in touched files); `vite build` passes; eslint clean on touched TS/TSX
  (vite.config.ts remaining errors are pre-existing, lines ≤600). **No commit/push done.**
- **07/11/2026** — **Research Operations Centre Phase 1 built and verified green.** New tab
  `research-centre` (dashboard + definite/possible lists). New: `src/pages/ResearchCentre.tsx`,
  `src/components/CorrespondenceList.tsx`, `src/components/MessageDetail.tsx`,
  `src/lib/exportFamilyTree.ts`-style dev endpoints in `vite.config.ts`
  (`localCorrespondenceApiPlugin`: `/api/correspondence/health`,
  `/genealogy/summary`, `/genealogy/messages`, `/messages/:id/detail`). DB: definite=33,
  possible=2, unreviewed=5993, total=6028 (no overlap; integrity ok; backup pre-fix at
  `/tmp/correspondence.db.backup_20261106_224638_pre_fix`, user_version 6). Build passes,
  `tsc -b` clean for new files, eslint clean for new files, dev server live on
  **127.0.0.1:8080**, all four endpoints curl-verified, Python tests 117/117 and Node tests
  11/11 pass. MessageDetail now fetches its own detail via `/messages/:id/detail`. No
  correspondence data in `dist/`.
- **06/11/2026** — D15 (Curia letter) sent to curia@diocesisbt.it; moved to "Awaiting replies". Updated ranked next steps; removed D15 from top priority (step 1 now: wait on D13).
- **06/11/2026 (bottom-up queue)** — Replaced the hard-coded `gregorio-emmi` pilot in `scripts/next-task.ts` with an automatic bottom-up queue: people ordered by stored generation (highest first), Daniele first, then by line; first non-finished/non-waiting person is worked on. "Finished" = every life event at step 5 (step 4 for living people) and FamilySearch person check clear; events waiting on a request (<30 days) don't block. Added `relationship` to NextTask and "Working on: <name> (<relationship>)" in the card. Added person-level "Skip this person" (persists `skippedOn` in `src/data/person-skips.json`, deprioritises the person). Living people skip step 5 and the FS person check. Added `/api/person-skip` endpoint and `callApiPersonSkip`. Documented "identify <folder>" for `_unsorted/` in WORKFLOW.md/AGENTS.md. Seeded lifeEvents for Daniele, Alfred and Venera so the card starts with Daniele. Committed, not pushed.
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

- **09/11/2026 (assistant panel + LLM backend + sent-auto-detect + thread-links phase 2)** —
  (1) `scripts/assistant-summary.py` crashed on a missing `REQUEST_LINKS_PATH` constant (NameError)
  after the purpose-lookup edit — fixed, and `purpose` now flows into pending_actions + all
  genealogy threads (derived from `request-links.json`). (2) Assistant thread list gained
  **pill filters** (institution/people/status, multi-select, counts) via new `src/components/PillFilter.tsx`.
  (3) Duplicate stats card removed from `ResearchAssistant.tsx` (dashboard renders its own).
  (4) **Chase filter bug fixed**: `chase` status filter *excluded* threads with days_waiting > 30;
  now it includes them (shows threads needing chase). (5) Draft panel: **Translate to English**
  button wired to new `POST /api/assistant/translate` (Gemini, temp 0.1, thinking off);
  translation displayed under the draft. (6) `scripts/analyze-messages.py`: **Gemini backend**
  added — `gemini_analyse` (json_mode, thinkingBudget 0, maxOutput 4000), `gemini_translate_chunk`
  + `gemini_translate_full`, `--model {ollama,gemini}`, `--backlog` (targets
  genealogy_relevance IS NULL). Retry with backoff (15/30/60s) + 2s pacing between calls. (7)
  **NextGuide**: new **"Check sent correspondence"** button on Get-the-document cards →
  `GET /api/correspondence/sent-request?personId&eventType` → auto-logs `requestedOn` +
  `requestedFrom` from the detected sent Gmail message. (8) `scripts/build-thread-links.py`:
  phase 2 adds **person thread-links from Gemini analyses** (304 → 327 links). Gemini pilot:
  msgs 14/55 analysed clean via Gemini (translation ok, clean uncertainties); msg 115 + batch
  hits → **HTTP 429 rate limit** (free tier throttling; retry/backoff + pacing now in place).
  Comprehensive suite re-run: 16/18 (2 known false-ish: build-grep false negative; draft fell back
  to qwen because Gemini was 429-ing).
- **09/11/2026 (OCR)** — Structured reader for multilingual comune estratti (`src/lib/ocr/ciec-extract.ts`, `CiecExtractPanel`, `pnpm test:ocr`): field extraction, boilerplate filtering, two-reading cross-check, record.md output. Egidio 1870 atto 31 transcribed (`verified: false`; atto 31-vs-311 and Raiti-vs-Nasti flagged). YAML `null` no longer shows as "null". The local OCR panel is still uncommitted on Daniele's Mac.

- **09/11/2026 (records page fix + plan confirmation)** — User: "I want you to make a plan" → confirmed plan scope before building. **Confirmed bug fixed**: `/research/records` had NO index route (only `/research/records/:recordId` existed) → ResearchHub "Records" card + nav fell through to NotFound ("doesn't go anywhere"). **Fix**: new `src/pages/Records.tsx` hub (loads via `getAllRecords()`, shows type/id/date/people/step) + `<Route path="/research/records" element={<Records />} />` in App.tsx. **Gates**: tsc clean outside familyData baseline, eslint clean on touched files, `npx vite build` exit 0. **Plan problems addressed this round**: (1) broken pages — records index fixed, others TBD; (2) `/research/people` should be its own full-fledged page, not → `/family/people` redirect; (3) "needs review" meaning clarified — message-level (govt w/ attachments, personal admin keywords, attachment-gate upgrade inbound docs no_action→needs_review) + request-level (ambiguous OR readable-but-unverified docs); (4) attachment→record→person linking — user-driven determination process; (5) backup of sources (`~/Downloads/FAMILY TREE`, `records-local/`, correspondence/) — local-only, MacBook-death risk; (6) client-facing per-person records browser (swipe/click through records). Immediate next: live-verify /research/records (curl in flight), then build full-fledged research People page.

*(Append one dated line here at the end of every session, and update "Last updated" above.)*
