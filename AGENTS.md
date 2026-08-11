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
- Git branch `main`, 2 commits ahead of origin/main.
- Build/test/dev commands: `pnpm dev`, `pnpm build`, `pnpm build:dev`, `pnpm lint`. No test runner configured.

## Timed / pending research threads (do NOT propose before their trigger date)
- ~20 Aug 2026 — NAA delivery of Lilia naturalisation file MP1187/1 V1965/3748 (Item ID 16189462) expected.
- After September 2026 — Contact Curia di SBT (Sig.ra Veccia) re Irma Pirri death/burial record. DO NOT propose this before September.

## Progress log (newest at bottom)
- [2026-08-11] Repo analyzed. AGENTS.md created. Uncommitted work in `src/data/familyData.ts`: research-status updates flowing from receipt of NSW marriage cert 27340/1952 (Ezio × Lilia) and NAA clarification that Lilia has no separate MSD/ARD alien-registration record. Not yet committed.

## Open next-step candidates (after current uncommitted work lands)
- pnpm lint + commit the pending familyData.ts changes.
- Reminders: Lilia NAA file ~20 Aug; Irma Pirri death search after September.