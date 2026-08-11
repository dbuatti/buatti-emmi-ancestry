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
- **Comune di Ascoli Piceno — Ufficio Stato Civile** (Settore 4 - Servizi al Cittadino, Sergio De Angelis): `prot. 0062771/2026`, lodged 10 Jul 2026. Richiesta copia integrale atto di matrimonio BUATTI ALFREDO × GALANTI IDA (circa 1920-1922) — tiebreaker between 1893 Ida (d/o Antonio+Virginia) and 1904 Ida (d/o Ignazio+Clementina). **Sollecito sent 11 Aug 2026** (subject: "Sollecito — Richiesta copia integrale atto di matrimonio BUATTI ALFREDO × GALANTI IDA (prot. 0062771/2026)").
  → **No further action. Wait for reply.**
- **Comune di Maltignano — Ufficio Anagrafe** (Dott.ssa Paola D'Emidio): `prot. 0008863`, 11 Aug 2026. Delivered copie integrali of Ezio's 1991 death act and Lilia's 1998 death act. Reply sent same day (11 Aug) thanking + flagging Ezio death-location correction + 5 anagrafe questions (residency dates AIRE/registration, family composition) + confirmation of €16.52 (bollo + segreteria) payable via pagoPA. Reply ALSO raised open question: whether Lilia's riacquisto della cittadinanza (L. 91/1992) is recorded in Maltignano's registri di cittadinanza (held for next D'Emidio reply, not sent yet).
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
- [2026-08-11] Ezio bankruptcy NAA RecordSearch sweep: B9 series, surname "Buatti", "Buatti bankruptcy", and case-number "248/1957" all returned no hits. File likely indexed by registry/case number only. Trove Gazette notice remains the surviving public record. Possible route: NAA Contact Us form to locate file 248/1957 in VIC registry series.
- [2026-08-11] Antenati Ascoli Piceno archive confirmed: NO "Matrimoni" (marriage) registers published — only Censimento (201 items, 1800-1880) and 4 Morti allegati (1915/1919). Antenati route closed for Alfredo×Ida marriage tiebreaker AND for Remo×Irma 1930 marriage. Pending comune requests (prot. 0062771, Rosa De Falco SBT anagrafe) remain the operative channels.
- [2026-08-11] **MALTIGNANO BREAKTHROUGH** (Dott.ssa Paola D'Emidio, prot. 0008863): Copie integrali of both death acts received. MAJOR CORRECTION: Ezio died at Ascoli Piceno (Ospedale Civile, Via degli Iris) on 16 Oct 1991 — NOT in Australia as family long believed. He was resident in Maltignano at time of death, listed as pensionato. Birth act cited: n. 377, Parte I, 1923 (Ascoli Piceno). Lilia: atto di morte Parte 2ª serie C n. 6/1998, death confirmed 23 May 1998, transcription chain via Consolato Melbourne (Prot. 9211, 22.09.1998, Cancelliere Stefano Cirilli; Posizione consolare L9952, Matricola 36094). Both grandparents' Maltignano residency periods revealed (Lilia ~1991-93 AIRE-registered 1993; Ezio earlier — pending anagrafe answers). Pending: D'Emidio's reply on 5 anagrafe questions + €16.52 pagoPA confirmation. Open question for next D'Emidio reply: Lilia's riacquisto della cittadinanza under L. 91/1992 (dichiarazione in Maltignano registri di cittadinanza?).
- [2026-08-11] Outlook correction: Ezio's "Returned to Australia 1975" — long stated as fact — is now in question. Maltignano death in 1991 + pensionato status implies either earlier return to Australia, or no Australian return at all post-1963. 1963-1991 Italian period is now the priority reconstruction target. Ricostruzione di carriera certificate (20 Jan 1975) likely tied to Italian employment/pension, not Australian return.
- [2026-08-11] Consulate path queued (Consolato Generale d'Italia Melbourne): Two messages to send separately via consmelbourne.esteri.it contact form. (1) AIRE update: family AIRE-registered at Maltignano via Alfred Buatti, request transmission of civil status records for Alfred's descendants. (2) Historical file request: access to Posizione consolare L9952 / Matricola 36094 (Chiappini Lilia) and any corresponding posizione for Ezio Buatti (never naturalised, Italian citizen throughout); cite Prot. 9211 del 22.09.1998 as proof of file's existence. PEC (con.melbourne@cert.esteri.it) will bounce from Gmail — use contact form. Drafts pending.
- [2026-08-11] **Consulate Message 1 SENT** (AIRE update) via consmelbourne.esteri.it contact form — on-screen confirmation "Grazie! La Sua richiesta è stata ricevuta" (no ticket/ref shown; watch inbox for email confirmation). Requests trasmissione atti di nascita to Maltignano for Roberto (19/08/1981), Stefano (06/10/1983), Marco (01/08/1988), Daniele (20/11/1990) — all born Melbourne VIC. Message 2 (historical file request for L9952 / Matricola 36094) to follow in 24-48 hrs.

## Open next-step candidates
- Family outreach: ask papa (next visit, not scheduled — long calls, unreliable recall) about Gino Chiappini (brother/cousin of Lilia?) and Irma Pirri TB story. **Aunt Angie ruled out — not related to Chiappini line.**
- SP1121/1 item 9637786 ($26.45) — purchasable but **BLOCKED** pending family-relationship confirmation via papa or a free BDM hit (NSW + VIC both now negative).
- Pre-existing lint debt: 3 errors in `src/components/ui/command.tsx`, `src/components/ui/textarea.tsx`, `tailwind.config.ts` (shadcn boilerplate / config — low priority, not blocking).

### Resolved / closed (kept here so not re-proposed)
- ~~NAA RecordSearch sweep for Gino Chiappini~~ — done 11 Aug 2026; negatives logged; SP1121/1 identified.
- ~~Neptunia outbound passenger list~~ — resolved 11 Aug 2026 via B78 departure annotation on item 5746087; PP222/4 item 10153223 *not* purchased (not needed).
- ~~Ryerson + Trove: Gino Chiappini death/funeral notices~~ — done 11 Aug 2026; clean negatives logged.
- ~~NSW BDM historical death index: Chiappin(i)~~ — done 11 Aug 2026; only MARCO 1968 (father LUIGI × JUNE, Hamilton — not our line). Gino not in NSW deaths 1950–1995.
- ~~Victorian BDM historical death index: Chiappin(i)~~ — done 11 Aug 2026; 0 hits. Gino not in VIC deaths to 1976.
- ~~Ascoli Piceno sollecito (prot. 66127/2026)~~ — already sent 9 Aug 2026; do not chase.
- ~~Antenati Ascoli Piceno archive (Matrimoni)~~ — confirmed 11 Aug 2026; no marriage registers published.
- ~~Ezio bankruptcy NAA RecordSearch sweep~~ — done 11 Aug 2026; surname + case-number searches returned no hits.
- ~~Ascoli Piceno sollecito (prot. 0062771 Alfredo×Ida marriage)~~ — sent 11 Aug 2026 to protocollo@comune.ap.it; do not chase.