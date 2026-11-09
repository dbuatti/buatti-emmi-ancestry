# Agent Improvement Plan — Buatti–Emmi Ancestry

> Living plan for the autonomous-research-agent workstream. Updated at the end of each session.
> If this file and `HANDOFF.md` disagree, treat `HANDOFF.md` as the raw log (rule from AGENTS.md).

## Session plan — plan scope confirmed

### Asked / decided this session

1. **"Is the automatic check correspondence working? Can it be clearer?"**
   - ✅ Working: `com.user.gmail-sync` LaunchAgent → daily 06:00, `sync-gmail.py --incremental`; last run `ok` 2026-11-09 05:27.
   - ✅ Clarity: purpose statement + per-tab captions added to Correspondence page.

2. **"I want you to make a plan"**
   - ✅ Confirmed plan scope BEFORE building: framed around the problems being solved, not the fixes that already landed. Problems enumerated: (a) broken pages, (b) `/research/people` should be its own page, (c) "needs review" semantics, (d) attachment→record→person linking clarity, (e) backup of local files, (f) client-facing per-person records browser, (g) self-doubting analysis ("suggest running through record for additional perspective").

3. **"Keep building out a plan… I always wanna be able to actually visually qualify and clarify things and I also need to make sure that the app is being able to read attachments properly and clearly and bonus points if it actually starts to doubt itself and suggest that I run it through record for additional perspective."**
   - ✅ Plan scoped around: visual qualification cards, attachment readability/integrity checks, and a "cross-reference" suggestion feature that recommends running through other record databases (FamilySearch, BDM indexes, etc.) when facts are ambiguous or contradicted.

### Ranked next steps (in order)

1. ✅ **Build the full-fledged research People page** — per-person browsing of a person's records, links back to attachments + source emails, with visual qualification panels (date, place, names, parentage, source). This is the foundation for Phases 3 & 5. **DONE this session.**
2. ✅ **Attachment→record→person linking workflow** — AttachmentInspector component shows readability status, extracted text links, and per-attachment link-to-person/link-to-record selectors. Self-doubting cross-reference suggestions recommend re-downloading, visual verification, OCR re-check, or cross-checking against FamilySearch/BDM indexes. **DONE this session.**
3. ✅ **Self-doubting cross-reference suggestions** — implemented in both AttachmentInspector and FactQualificationPanel. When facts are missing/ambiguous, surfaces suggestions to search BDM/parish/cemetery/Antenati/NAA/FamilySearch. **DONE this session.**
4. ✅ **Fact qualification panel** — per-person fact verification (birth/death/burial/parents/spouse) with source attribution, record links, verify/unverify toggles, completion badge, and self-doubting suggestions. Wired into ResearchPeople expanded detail. **DONE this session.**
5. ⬜ **Sweep remaining research pages for runtime errors** — `/research/goals`, `/research/assistant`, `/research/tasks`, plus verify every ResearchHub card target resolves. First error found → fix → repeat.
6. ⬜ **Attachment integrity check** — verify each attachment is readable (bytes decoded, size matches DB), flag unreadable/missing attachments with a reason, surface the reason in the attachment list. Currently zero unreadable attachments exist but we need a stable process + audit path.
7. ⬜ **Backup strategy for sources** — `~/Downloads/FAMILY TREE`, `records-local/`, `correspondence/` are local-only. Design a redundancy plan (TS/NS external drive, cloud sync, Periodic backup script with logging).
8. ⬜ **Client-facing per-person records browser** — swipe/click through a person's records on the family tree website.

### Open questions for Daniele

- None blocking the current phase. Vetching the research People page design first.

## Environment note (2026-11-09)

- This dev container is **linux x64**, not macOS arm64 — the rolldown native binding
  (`@rolldown/binding-darwin-arm64`) was missing/broken; fixed by installing
  `@rolldown/binding-linux-x64-gnu@1.0.0-rc.17` (`pnpm add -D`, then reverted package.json + lockfile —
  the working tree stays clean of that change).
- `npx vite build` exits 0 after the fix; dev server (`pnpm dev`, port 8080) healthy.
