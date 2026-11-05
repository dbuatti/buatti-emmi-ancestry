# Document Processing Workflow

Every document goes through 5 steps, tracked in its `record.md` front matter:

## Step 1: filed
- Original copied untouched into `records/<id>/`
- `id`: `YYYY_Comune_type_Surnames_attoN`
- The source file in `~/Downloads/FAMILY TREE/` is **not** moved or altered
- Record the SHA-256 hash for duplicate detection

## Step 2: transcribed

**Typed documents (e.g. estratto multilingue forms):**
- You will paste text copied from Preview (Live Text) plus attach a screenshot.
- Use the pasted text for the words; use the screenshot only to decide which box each value belongs to.
- Italian transcription in `record.md` (verbatim, keep original spelling and abbreviations).
- English translation below Italian.
- Uncertain readings marked with `[?]` — do not guess or fill gaps.
- Note which model/person performed the transcription.
- Set `transcribed: true` and `transcribed_by`.

**Handwritten documents:** STOP and say they need Claude. Do not transcribe.

**If you cannot see the image at all:** STOP and ask the user to paste a screenshot.

## Step 3: verified
- Daniele has checked names, dates and parents against the image
- **Only Daniele sets this field** — AI/assistants never set step 3 or 5

## Step 4: in_app
- Person facts updated and linked to this record in the React app
- Each fact on the person page that this record supports gets:
  - a `recordId` link
  - a status badge: `sourced` / `unsourced` / `provisional`
- The `RecordMatrix` component shows which records are attached to which persons

## Step 5: on_familysearch
- Daniele has attached the record on FamilySearch (manually, no automated API)

---

## Rules (never break these)

1. **Never change a person's facts without linking a record.**
2. **Never mark step 3 or 5 done yourself.** Only Daniele sets these.
3. **New information from emails or chats becomes a record first, then flows to the app.**
   - Write the record.md, commit it, then update the person page.
4. **The app's to-do page lists every record not at step 5**, and which step it is stuck at.

---

## Process a new document

Run these steps whenever asked to **process <file>**:

### Step 1 — Copy
- Copy the file into `records-local/<id>/` (never move or delete the original).
- `id` follows the format: `YYYY_Comune_type_Surnames_attoN`.
- Check the SHA-256 of the copy matches the original.
- Create `records/<id>/record.md` with front matter: `filed: true`, everything else blank/false.

### Step 2 — Transcribe

**Typed documents:** User pastes text from Preview (Live Text) plus a screenshot.
- Use the pasted text for the words; use the screenshot only to decide which box each value belongs to.
- Fill in the record's template line by line, exactly as written; keep the original Italian.
- Mark anything uncertain with `[?]`. Never guess or fill gaps.
- Set `transcribed: true` and `transcribed_by`.

**Handwritten documents:** STOP and say they need Claude. Do not transcribe.

**If you cannot see the image:** STOP and ask the user to paste a screenshot.
- On multilingual forms: **Padre = father, Madre = mother.**

### Step 3 — Compare
- Compare against what `familyData.ts` already says about these people.
- List every difference under `## Discrepancies` in `record.md`, citing both sources.
- Never delete existing values in `familyData.ts`.

### Step 4 — Stop for review
- STOP. Show the user the filled lines and the discrepancies.
- Ask the user to check them against the document.
- Only when the user says **"verified"**: set `verified: true` and update the app.

```
1. filed          → copy source file into records/<id>/, set id=YYYY_Comune_type_Surnames_attoN
2. transcribed    → Italian + English in record.md; [?] for uncertain; note model
3. verified       → Daniele checks; set verified: true/false
4. in_app         → update PersonModal facts with recordId links
5. on_familysearch → Daniele attaches on FamilySearch; set on_familysearch: true/false
```

If any step is blocked, the to-do page shows the record at that step, and no further steps are attempted until it clears.

---

## File: records/<id>/record.md front matter fields

```yaml
id: YYYY_Comune_type_Surnames_attoN
type: Birth Record | Marriage Record | Death Record | Other
date: DD/MM/YYYY        # original date as written; lossy if only year known
place: Comune, Italy
comune: Nome del Comune
register: Nome del registro
year: YYYY              # extracted year
atto: N                 # act number
people: [person_id]     # familyData person ids
source_office: Ufficio / Archivio
protocol: prot. NNNN/YYYY  # or "n/a"
transcribed_by: "pdftotext" | "tesseract" | "Daniele (manual)" | "image_not_available"
filed: true | false
transcribed: true | false
verified: true | false       # only Daniele sets true
in_app: true | false
on_familysearch: true | false   # only Daniele sets true
```