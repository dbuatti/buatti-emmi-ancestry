# AGENTS.md — Project memory & PM log

This file is the long-lived memory for AI assistants acting as project manager on this repo.
Read it BEFORE proposing any next step, and APPEND to the log after each action so we don't repeat work.

## Working agreement with the user (Daniele)
- Act as project manager: propose ONE immediate, fully-actionable next step, not a wall of steps.
- Daniele gets overwhelmed by long lists — give the single next action, with just enough context.
- Always log progress here so memory persists across sessions. Do not repeat done work.
- Tech stack & conventions: see `AI_RULES.md`. Stack = React 19 + TS + Vite + Tailwind + shadcn/ui + React Router.

## Repo orientation (as of last update)
- React ancestry-research app. Pages: `Index.tsx`, `ResearchGoals.tsx`, `NotFound.tsx`.
- Single source of genealogy data: `src/data/familyData.ts` (the `initialPeople`, `initialResearchLeads`, `initialOpenQuestions` exports).
- Components live in `src/components/` (PedigreeChart, PersonModal, EvidenceWiki, RecordMatrix, ResearchLog, TimelineTab, TreeConnected, TreeEgo, AncestorsDirectory, AppHeader, plus shadcn `ui/`).
- Git branch `main`, in sync with origin/main (last update 11 Aug 2026).
- Build/test/dev commands: `pnpm dev`, `pnpm build`, `pnpm build:dev`, `pnpm lint`. No test runner configured.

## Currently lodged / awaiting reply (do NOT chase — already followed up)
- **Comune di Ascoli Piceno — Ufficio Stato Civile** (Settore 4, Sig.ra Vellei Fiorella): `prot. 66127/2026`, lodged 20 Jul 2026. **Sollecito sent 9 Aug 2026** (subject: "Sollecito — Richiesta copia integrale atto di nascita BUATTI EZIO (prot. 66127/2026)"). The 9 Aug follow-up *expanded* the request to TWO items:
  1. Copia integrale atto di nascita BUATTI EZIO (27/04/1923, di Alfredo × Galanti Ida) — anchored by 1944 comune photo attestation from Perugia fascicolo (prot. 2026-USDPAMM-0309113, 04/08/2026).
  2. Copia integrale atto di matrimonio trascritto ad Ascoli Piceno 1963, parte 2, serie C, n. 36 (Ezio Buatti × Lilia Chiappini, married Australia 4 Ott 1952) — ref from SBT note prot. 0066017 del 06/08/2026.
  → **No further action. Wait for reply.**

## Timed / pending research threads (do NOT propose before their trigger date)
- ~20 Aug 2026 — NAA delivery of Lilia naturalisation file MP1187/1 V1965/3748 (Item ID 16189462) expected. Already purchased; only action is to watch the inbox.
- After September 2026 — Contact Curia di SBT (Sig.ra Veccia) re Irma Pirri death/burial record. DO NOT propose this before September.

## Progress log (newest at bottom)
- [2026-08-11] Repo analyzed. AGENTS.md created. Uncommitted work in `src/data/familyData.ts`: research-status updates flowing from receipt of NSW marriage cert 27340/1952 (Ezio × Lilia) and NAA clarification that Lilia has no separate MSD/ARD alien-registration record. Not yet committed.
- [2026-08-11] `pnpm lint` reviewed: 3 pre-existing errors in shadcn `ui/` files + `tailwind.config.ts` (not from our edits). `pnpm build` passes. Committed `faae84e` + pushed to origin/main. Working tree clean.
- [2026-08-11] Ascoli Piceno sollecito verified: user already sent 9 Aug 2026 follow-up (prot. 66127/2026) and expanded it to two requests (birth act + 1963 marriage transcript ref SBT prot. 0066017). PM-proposed step was redundant — retracted. Logged here so it isn't re-proposed.
- [2026-08-11] Gino Chiappini NAA sweep done: B78/A712/K1146/MP1187/B659/K266 all returned no hits (no naturalisation, no outbound voyage — confirmed negatives). General search returned 2 items; the only new lead is **SP1121/1 item 9637786** (Sydney migrant reception intake, Box 191, 1952, not digitised). Updated `familyData.ts` (Lilia notes + nextSteps). Pending commit.
- [2026-08-11] Neptunia 1963 outbound NAA search: outbound manifest found = **PP222/4 item 10153223** (Fremantle, 18 Sep 1963, not digitised). 13 Sep 1963 departure date confirmed via multiple B78/D4878 records. Next: re-check Ezio's B78 file (item 5746087, already in hand) for departure annotation before spending on PP222/4.
- [2026-08-11] B78 file re-checked — departure annotation present on marriage-notification page: "LEFT PER NEPTUNIA ON 13/9/63 FROM MELB" (date confirmed as 1963, not a 65/63 ambiguity). Ship/port/date confirmed without buying PP222/4. Also re-confirmed: "Noted for Return" stamp on 1952 arrival form. Committed + pushed.
- [2026-08-11] Gino Chiappini Ryerson + Trove sweep: Ryerson = 0 notices. Trove = no death/funeral notice for Gino; only unrelated hits (1939 cycling, 1974/82 gazette for different Chiappini family). Free Australian paper trail for Gino effectively exhausted — remaining avenues cost money (SP1121/1 $26.45) or need papa. Committed + pushed.

## Open next-step candidates
- Free NSW BDM historical death index: `Chiappin(i)` search — historical deaths (50+ yrs ago) freely searchable. Gino b.1927; if he died before ~1977 in NSW (where he settled, did fruit-picking Mildura/Bonalgo), a record exists at no cost. Browser-doable.
- Free Victorian BDM historical index: same `Chiappin(i)` search — covers VIC deaths (Ezio/Lilia later lived in Richmond, VIC).
- Family outreach: ask papa (next visit, not scheduled — long calls, unreliable recall) about Gino Chiappini (brother/cousin of Lilia?) and Irma Pirri TB story. **Aunt Angie ruled out — not related to Chiappini line.**
- SP1121/1 item 9637786 ($26.45) — purchasable but **BLOCKED** pending family-relationship confirmation via papa or a free BDM hit.
- Pre-existing lint debt: 3 errors in `src/components/ui/command.tsx`, `src/components/ui/textarea.tsx`, `tailwind.config.ts` (shadcn boilerplate / config — low priority, not blocking).

### Resolved / closed (kept here so not re-proposed)
- ~~NAA RecordSearch sweep for Gino Chiappini~~ — done 11 Aug 2026; negatives logged; SP1121/1 identified.
- ~~Neptunia outbound passenger list~~ — resolved 11 Aug 2026 via B78 departure annotation on item 5746087; PP222/4 item 10153223 *not* purchased (not needed).
- ~~Ryerson + Trove: Gino Chiappini death/funeral notices~~ — done 11 Aug 2026; clean negatives logged.
- ~~Ascoli Piceno sollecito (prot. 66127/2026)~~ — already sent 9 Aug 2026; do not chase.