# Document Processing Workflow

Every document goes through 5 steps, tracked in its `record.md` front matter:

## Step 1: filed
- Copy into `records-local/<id>/` named as `<id>.<ext>` (single file) or `<id>_p1.<ext>`, `<id>_p2.<ext>`, … (multi-page/multiple files)
- Record `original_filename` and `original_sha256` in record.md front matter
- The source file in `~/Downloads/FAMILY TREE/` is **not** moved or altered

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

After a record is verified (`verified: true`), review it in the app:

1. **List every fact** the document states about EVERY person named (not just the main person): births, marriages, deaths, citizenship, residence, occupations, parents. Each fact must cite this record id.
2. **List every OTHER record it refers to** (e.g. "Matrimoni 1948 parte II serie A n. 34") as a research lead: register, year, act number, comune, and whether we already hold it.
3. **Show proposed changes per person** as a short list, marking which are new and which already match existing data. Flag conflicts; never overwrite existing values without confirmation.
4. **Apply only after you say "apply"**. Then set `in_app: true`.
5. **Research leads become tasks** in the Next guide (e.g. "Request X from Comune Y").

**Rules:**
- Only facts the document actually states. No guessing or filling gaps.
- Interpretations (e.g. what "parte II serie A" means) go in a separate "notes" line marked as inference.
- Never overwrite existing facts in familyData.ts without explicit confirmation.
- Only Daniele sets `in_app: true`.


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
- Copy into `records-local/<id>/` named as `<id>.<ext>` (single file) or `<id>_p1.<ext>`, `<id>_p2.<ext>`, … (multi-page/multiple files)
- Record `original_filename` and `original_sha256` in record.md front matter
- Create `records/<id>/record.md` with front matter: `filed: true`, everything else blank/false

### Step 1.5 — Online link (if any)
- Ask the user: "Is there an online link to this record's image (FamilySearch, Antenati, etc.)?"
- If yes, record it as `image_link` in front matter (if it's the main source image)
- Any additional related URLs go in `links:` with a short label
- If `image_link` is empty and the link is from FamilySearch or Antenati, save it as `image_link`

### Step 2 — Transcribe

**Typed documents:** User pastes text from Preview (Live Text) plus a screenshot.
- Use the pasted text for the words; use the screenshot only to decide which box each value belongs to.
- Fill in the record's template line by line, exactly as written; keep the original Italian.
- Mark anything uncertain with `[?]`. Never guess or fill gaps.
- Store English translation per line (indented `en: Label: Value` under each Italian line).
- Set `transcribed: true` and `transcribed_by`; set `translated_by` (model name).
- Label translations as "AI translation" in the app.
- Translate field labels too (Cognome → Surname, Padre → Father, Madre → Mother, etc.).

**Handwritten documents:** STOP and say they need Claude. Do not transcribe.

**If you cannot see the image:** STOP and ask the user to paste a screenshot.

### Step 3 — Compare
- Compare against what `familyData.ts` already says about these people.
- List every difference under `## Discrepancies` in `record.md`, citing both sources.
- Never delete existing values in `familyData.ts`.

### Step 4 — Apply to app (in_app)

After the record is verified (`verified: true`), the Next guide proposes changes:

1. **Every fact** the document states about each person named: births, marriages, deaths, citizenship, residence, occupations, parents — each citing this record id.
2. **Every other record referenced** (e.g. "Matrimoni 1948 parte II serie A n. 34") as a research lead: register, year, act number, comune, whether we already hold it.
3. **Proposed changes per person**: new facts vs. existing matches vs. conflicts. Never overwrite without confirmation.
4. **Apply only after you say "apply"** — then set `in_app: true`.
5. **Research leads become Next guide tasks** (e.g. "Request X from Comune Y").

**Rules:**
- Only facts the document actually states; interpretations marked as inference.
- Never overwrite existing values in `familyData.ts` without explicit confirmation.
- Only Daniele sets `in_app: true`.

```
1. filed          → copy source file into records/<id>/, set id=YYYY_Comune_type_Surnames_attoN
2. transcribed    → Italian + English in record.md; [?] for uncertain; note model
3. verified       → Daniele checks; set verified: true/false
4. in_app         → propose changes from verified record; apply only after "apply"; set in_app: true/false
5. on_familysearch → Daniele attaches on FamilySearch; set on_familysearch: true/false
```


If any step is blocked, the to-do page shows the record at that step, and no further steps are attempted until it clears.

---

## In-App Review Process (Step 4: in_app)

Once a record is `verified: true`, the Next guide enters "in app" review mode for that record:

### What happens

1. **Read the transcription** — every line under `## Transcription` in `record.md`.
2. **Extract facts per person named** — for each person mentioned (not just the main subject), list:
   - Birth: date, place
   - Marriage: date, place, spouse, act reference
   - Death: date, place
   - Citizenship: gained/lost, certificate reference, date
   - Residence: address, comune, dates
   - Occupation: title, employer, dates
   - Parents: names, relationship
   Each fact cites this record id as its source.
3. **Extract cross-references to other records** — any register, year, act number, comune mentioned. For each:
   - Register name, year, act number, comune
   - Whether we already hold a copy (check `records/` and `records-local/`)
   - If not held, create a Next guide task: "Request X from Comune Y"
4. **Compare against familyData.ts** — for each person, show:
   - New facts (not currently in familyData.ts)
   - Matching facts (already present, same source or different)
   - Conflicts (different values from existing data)
5. **Present for approval** — show the proposed changes as a short list. Wait for "apply".
6. **Apply** — only after explicit "apply": update `familyData.ts` with new facts, add research leads, set `in_app: true`.

### Rules

- **Only facts the document actually states.** No guessing, no filling gaps.
- **Interpretations** (e.g. what "parte II serie A" means) go in a separate "notes" line, marked as inference.
- **Never overwrite** existing values in `familyData.ts` without explicit confirmation.
- **Only Daniele sets `in_app: true`.** The assistant never sets it.
- **Only Daniele says "apply".** The assistant waits for confirmation before changing any data.

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
image_link: URL  # online link to original image (FamilySearch, Antenati, etc.)
links:           # any other related URLs
  - label: description
    url: https://...
```

---

## Process Inbox

**Run `process inbox`** to process every file in `~/Downloads/FAMILY TREE/_inbox/` (create the folder if missing).

### Step 1 — Identify each file
Use these clues (in order):
1. **Filename clues**: FamilySearch film numbers (e.g. `005455112` = DGS 5455112), image numbers, "entry N", "atto N", names, years
2. **Existing records/*/record.md**: check `image_link` and `notes` fields for matching references
3. **Known `known_no_record` life events** in `familyData.ts`: if a person has `status: 'known_no_record'` for a matching event type, the file may belong there

**Multi-page/multiple files**: Files that are views of the same document (full page + close-up) go in the same record. The larger/full image = `_p1`.

### Step 2 — Resolve uncertainty
If identification is not certain, ask the user ONE question with numbered options:
- List existing records that fit (with their IDs and why they match)
- Option for "new record"
- Never guess — wait for the user's choice

### Step 3 — File
- Copy into `records-local/<id>/` as `<id>_pN.<ext>` (N starting at 1)
- Verify SHA-256
- Record `original_filename` and `original_sha256` in record.md front matter
- Set `filed: true`

### Step 4 — Move originals
- Move originals from `_inbox/` to `~/Downloads/FAMILY TREE/_processed/<id>/` (move, never delete)

### Step 5 — Transcription
- If typed: ask the user to paste the Preview (Live Text) text
- If handwritten and the current model can't read images: say "Switch to the VL model, paste a close-up, then say 'transcribe next'". Then continue normal steps and stop for user check.

---

**"transcribe next"** = transcribe the next record that is `filed` but not `transcribed` (tell the user which one it picked). Use only the image the user pastes; do not read `familyData.ts` or other records while transcribing.