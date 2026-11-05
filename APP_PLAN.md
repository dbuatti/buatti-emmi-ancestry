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
transcribed_by: pdftotext | tesseract | Daniele (manual) | image_not_available
translated_by: model name (e.g. "Nemotron 3.5 Super VL (free)")
image_visibility: public | family | local    # default: local; never default to public
image_link: https://...    # URL on FamilySearch/Antenati; optional; never copied
filed: true | false
transcribed: true | false
verified: true | false       # only Daniele sets true
in_app: true | false
on_familysearch: true | false   # only Daniele sets true
```

The five workflow steps tracked in front matter:
1. **filed** — record.md exists in `records/<id>/` (filed: true)
2. **transcribed** — Italian + English per line in body; `transcribed_by` and `translated_by` set. English stored per line under each Italian line (`en: Label: Value`), labeled "AI translation" in the app.
3. **verified** — `verified: true` (only Daniele sets this; AI never sets it)
4. **in_app** — person facts updated with `recordId` links (in_app: true)
5. **on_familysearch** — Daniele attaches on FamilySearch (on_familysearch: true)

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

### Life Events Checklist

Each person page shows a "Life events" checklist with six rows:

| Row | Meaning |
|-----|---------|
| Birth | Civil birth record |
| Baptism | Parish baptism record |
| Marriage(s) | Civil marriage record(s) |
| Death | Civil death record |
| Burial | Cemetery/burial record |
| Migration/Naturalisation | Passenger list, alien registration, naturalisation cert |

Each row shows one of three states:

- **record linked** — a `recordId` points to `records/<id>/record.md`; the row also shows the workflow step status (1–5): filed/transcribed/verified/in_app/on_familysearch.
- **known-but-no-record** — the event is known from a source (notes, familyData, etc.) but no record.md exists yet.
- **missing** — no source at all; the fact is not established.

The checklist is derived from `person.lifeEvents` in familyData.ts:

```ts
interface LifeEvent {
  type: 'birth' | 'baptism' | 'marriage' | 'death' | 'burial' | 'migration_naturalisation';
  recordId?: string;       // key into records/<id>/, if a record.md exists
  step?: 1 | 2 | 3 | 4 | 5; // workflow step status from record.md front matter
  status: 'linked' | 'known_no_record' | 'missing';
  note?: string;           // brief explanation (e.g. "baptism 5 Dec 1915, DGS 5455112")
}
```

If `recordId` is set, `step` is read from that record.md's front matter (filed/transcribed/verified/in_app/on_familysearch). If `status === 'known_no_record'`, `note` explains what is known. If `status === 'missing'`, the row is empty except the label.

Build this for Gregorio Emmi first, using his existing data in familyData.ts.

## Record Page (`/records/:recordId`)

Layout: two-column split on desktop.

**Left: RecordViewer**
- In dev: shows image/PDF from `records-local/<id>/` if present
- In production: renders transcription text only — no image element, no `<img src>` to a local path

**Right: RecordBody**
- Markdown body rendered from `record.md`
- Uncertain readings marked `[?]` highlighted
- `VerifiedToggle` checkbox: writes `verified: true` (only Daniele sets). In dev, field is editable.
- `CopyButtons`: "Copy source title", "Copy transcription"

## To-Do Page (`/todo`)

Lists records where step < 5. Each record shows:
- Person name + which fact it supports
- Current step number
- Brief note (e.g. "awaiting OCR", "D13 sent, waiting for reply")
- Link to the record page for editing

## Next Guide (local mode)

A card at the top of the app shows ONE task at a time:

- **Task card**: single actionable task (e.g. "Verify Gregorio Emmi's birth record — step 2: transcribed, step 3: pending verification").
- **Buttons**: `Done` / `Something's wrong` / `Skip for now`.
- **Order**:
  1. One person at a time (start with Gregorio Emmi)
  2. Each record through: check → app → FamilySearch
  3. The person's missing events
  4. That person's unsorted files
- **Done / Skip**: buttons write to record.md via a small local endpoint (in dev: local file write; in production: n/a — local mode only). Skipped tasks go to the end of the queue.
- **Progress**: shown as "Gregorio: 4 of 9".
- **"Something's wrong"**: saves a free-text note under `## Discrepancies` in the record's `record.md`.

The next-task logic lives in `scripts/next-task.ts`, used by both the app (via local endpoint) and by the assistant to propose the next task.


## FamilySearch Integration

Each record.md front matter gets `on_familysearch`. On the RecordPage:
- If `on_familysearch === true`: show "View on FamilySearch ↗" link (Daniele supplies the FS person ID manually per record).
- If `on_familysearch === false`: badge on To-do page.
- No FS API calls (no key needed) — manual entry only.

## Image Visibility Levels

Each record.md front matter has two new fields:

```yaml
image_visibility: public | family | local    # default: local; never default to public
image_link: https://...    # URL on FamilySearch/Antenati; optional; never copied
```

### local (default)
- Image shown only when the app runs on Daniele's Mac (dev mode).
- `RecordViewer.tsx` resolves from `records-local/<id>/`.
- No image element is emitted in production builds.
- **Never default to public.** Only Daniele sets this field.

### public
- The image is copied into the deployed site and shown on the record page.
- Only Daniele sets this field. Never default to public.
- The image is copied into `public/` before build; the build copies it into dist.
- `RecordViewer` renders the image element when `image_visibility === 'public'`.

### family (planned, not built yet)
- A later phase using a private Supabase storage bucket plus login.
- Images shown only to signed-in users.
- **Do not build this phase yet.**

### image_link
- Optional URL of the image on FamilySearch/Antenati.
- Shown as a "View original ↗" button on the record page.
- **Never copied** — it links out, it is not deployed.

## Local-Only Image Constraint

Images live in `records-local/` which is **gitignored** and **not in `public/`**.
- `RecordViewer.tsx` checks `import.meta.env.DEV`. In production, it renders transcription only.
- In dev, resolves from `records-local/<id>/` (multiple extensions tried).
- `vite.config.ts` does not copy `records-local/` into dist.
- For `image_visibility: public`, the image is copied into `public/` before build.

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