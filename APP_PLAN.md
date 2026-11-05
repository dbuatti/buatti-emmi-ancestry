# App Plan — Records as First-Class Data

## File Structure

```text
src/
  data/
    familyData.ts          # Person[] — records[] now points to records/<id>/ via recordId
  lib/
    records.ts             # load record.md, parse front matter, image URL helper
  hooks/
    useRecords.ts          # hook to load record.md + resolve step status
  pages/
    RecordPage.tsx         # /records/:recordId (transcription text only)
    ToDoPage.tsx           # /todo (unsourced/unverified/awaiting next step)
  components/
    RecordViewer.tsx       # zoomable image viewer — local records-local only
    RecordBody.tsx         # renders record.md body text, [?] marks
    VerifiedToggle.tsx     # verified_by_daniele checkbox (localStorage in dev)
    CopyButtons.tsx        # Copy source title / Copy transcription buttons
    FactBadges.tsx         # sourced / unsourced / provisional fact badges
    NotThisPerson.tsx      # ruled-out namesakes section
    FamilySearchLink.tsx   # FS person ID link per record
records-local/             # NOT in git — actual images/PDFs, one folder per record, .gitignore inside
  .gitignore               # * (ignore everything inside)
records/                   # committed record.md files only
  alfred-buatti-sr-death-1964/
    record.md
  alfred-buatti-sr-birth-1888/
    record.md
  ...                      # one folder per identified record
public/                    # unchanged — no images ever here
```

**Key conventions:**
- `records/` folder (committed to git) contains `record.md` files only
- `records-local/` folder (gitignored) contains actual images/PDFs — never deployed publicly
- In `public` / production builds: `RecordViewer` shows transcription text only; no image paths are resolvable
- In dev: `RecordViewer` may display images from `records-local/` path

## Record Data Format — `record.md`

Each committed record file uses YAML front matter + body. All status lives in front matter:

```yaml
id: YYYY_Comune_type_Surnames_attoN
type: Birth Record | Marriage Record | Death Record | Other
date: DD/MM/YYYY        # original date as written; leave blank if unknown
place: Comune, Italy    # leave blank if unknown
comune: Nome del Comune # leave blank if unknown
register: Nome del registro # leave blank if unknown
year: YYYY              # extracted year; leave blank if unknown
atto: N                 # act number; leave blank if unknown
people: [person_id]     # familyData person ids
source_office: Ufficio / Archivio # leave blank if unknown
protocol: prot. NNNN/YYYY  # or "n/a"; leave blank if unknown
fs_status: on FamilySearch | not on FamilySearch | pending
verified_by_daniele: true | false
transcribed_by: pdftotext | tesseract | Daniele (manual) | image_not_available
```

The five workflow steps tracked in front matter:
1. **filed** — record.md exists in `records/<id>/` (filed: true)
2. **transcribed** — Italian + English in body; `transcribed_by` set
3. **verified** — `verified_by_daniele: true` (only Daniele sets this; AI never sets it)
4. **in_app** — person facts updated with `recordId` links
5. **on_familysearch** — `fs_status: on FamilySearch` (Daniele manually attaches on FamilySearch)

Unknown fields are left as blank (empty string ""), never guessed or invented.

## Person Page Changes (pilot: Gregorio Emmi)

### Every fact links to a record

In `PersonModal.tsx` Overview tab, each fact row gets:
- A `recordId` on the section showing which record supports it.
- A **badge**: `sourced` (record.md exists with transcribed=true, verified=true), `unsourced` (no record), `provisional` (record exists but unverified).

### Records tab

Each row links to `/records/<recordId>` (the RecordPage). The Records tab shows which step each record is stuck at.

### "Not this person" section

New structured section listing ruled-out namesakes with reason + record reference.

## Record Page (`/records/:recordId`)

Layout: two-column split on desktop.

**Left: RecordViewer**
- In dev: shows image/PDF from `records-local/<id>/` if present
- In production: renders transcription text only — no image element, no `<img src>` to a local path

**Right: RecordBody**
- Markdown body rendered from `record.md`
- Uncertain readings marked `[?]` highlighted
- `VerifiedToggle` checkbox: writes to localStorage (`verified_by_daniele`). In dev, field is editable.
- `CopyButtons`: "Copy source title", "Copy transcription"

## To-Do Page (`/todo`)

Lists records where step < 5. Each record shows:
- Person name + which fact it supports
- Current step number
- Brief note (e.g. "awaiting OCR", "D13 sent, waiting for reply")
- Link to the record page for editing

## FamilySearch Integration

Each record.md front matter gets `fs_status`. On the RecordPage:
- If `fs_status === 'on FamilySearch'`: show "View on FamilySearch ↗" link (Daniele supplies the FS person ID manually per record).
- If `fs_status === 'not on FamilySearch'`: badge on To-do page.
- No FS API calls (no key needed) — manual entry only.

## Local-Only Image Constraint

Images live in `records-local/` which is **gitignored** and **not in `public/`**.
- `RecordViewer.tsx` checks `import.meta.env.DEV`. In production, it renders transcription only.
- In dev, resolves from `records-local/<id>/` (multiple extensions tried).
- `vite.config.ts` does not copy `records-local/` into dist.

## Build Order

### Phase 1 — Data layer (pilot: Gregorio Emmi)
1. Create `src/types/record.ts` with `RecordFrontMatter` (with filed/transcribed/verified/in_app/on_familysearch/transcribed_by).
2. Create `src/lib/records.ts` — parse front matter from `records/<id>/record.md`, image URL resolver.
3. Create `records/gregorio-emmi-birth-1915-linguaglossa/record.md` (pilot record).
4. Add `recordId` to `gregorio-emmi.records[]` in `familyData.ts`.
5. Create `records-local/` with `.gitignore`.

### Phase 2 — Record page
6. Create `src/components/RecordViewer.tsx`, `RecordBody.tsx`.
7. Create `src/pages/RecordPage.tsx` + route in `App.tsx` (`/records/:recordId`).
8. Verify local-only image gating works.

### Phase 3 — Person page (pilot: Gregorio Emmi)
9. Update `PersonModal.tsx`: overview facts get `recordId`, status badge.
10. Add ruled-out namesakes section.

### Phase 4 — To-do page
11. Create `src/pages/ToDoPage.tsx` + route `/todo`.
12. Wire into navigation.

### Phase 5 — Polish & rollout
13. Test on full `initialPeople[]`.
14. `pnpm build` passes, `pnpm lint` clean (except pre-existing), deploy preview confirms no images leak.