# Correspondence evidence model — verified chronology and proposed design

**Status:** investigation + proposal only. Nothing implemented, no database change, no Gmail
action, no family-tree change, no commit.
**Scope:** the 3–6 November 2026 correspondence (D9–D15 + the Fiumefreddo letter).
**Basis:** the SQLite store `.local/correspondence.db` (messages, attachments,
message_classification, ai_jobs), the files in `correspondence/attachments/`, and
`correspondence/extracted/`. **Not** the markdown logs — where those disagree with the DB,
the DB wins and the log is wrong.
**Date written:** 08/11/2026.

---

## 0. Headline finding, before anything else

**The death acts requested in D13 were delivered on 5 November at 13:52 CET, and nobody has
opened them.** They are two page images inside `doc07061420261105133528.pdf`, attached to
message #14. They answer the project's top open question.

Page 1 is the **atto di morte of GALANTI Ida**, hand-completed register form, read via OCR
(rotated 90°, 600 dpi, `--psm 11`):

```
GALANTI / IDA
... è morta ... GALANTI IDA ... 26 gennaio 1970, Ascoli Piceno
(6) cittadina italiana ... pensionata
... che era nata in Ascoli Piceno il 19 marzo 1893
... da (8) fu Antonio
... e da (9) fu Rosati Virginia
... che (10) fu già vedova di Buatti Alfredo
L'atto di nascita del di contro è iscritto nei registri ... al N. 236 (or 238) P.1 ... anno 1893
```

Four independent points — exact birth date, father's forename, mother's full name, and
"widow of Buatti Alfredo" — all match the **1893 Ida** (b. 19/03/1893, daughter of Antonio
Galanti × Virginia Rosati). Nothing matches the 1904 candidate (Ignazio × Curcozzi Clementina).

Page 2 is **ATTI DI MORTE – Parte II – Serie B, 1964**, "Cognome Buatti … Nome Alfredo",
"L'atto di nascita … anno 1888", born Ascoli Piceno, parents Giovanni and Bruni Emidia — i.e.
Alfredo Buatti Sr.'s death act, as asked.

**Caveats, and they matter:**
- This is OCR of a hand-filled register form. The date is legible and repeated twice; the
  act number is not (`236` vs `238`). It should be read by a human before anything is
  recorded as verified.
- Per the project rule, **I have not touched `familyData.ts`** and I have not marked anything
  `verified`. That is Daniele's call.
- If a belt-and-braces confirmation is wanted, the act itself names the next document:
  *Atto di nascita, anno 1893, n. 236 (or 238), Parte I, Comune di Ascoli Piceno.*

The significance for this document: **the answer arrived, was classified, was counted as an
acknowledgement, and sat unread for three days.** Two different readers independently got it
wrong in opposite directions — Claude asserted a same-day reply he had not opened, I dismissed
that assertion as unsupported. Both errors have the same cause: the system has no concept of
"an attachment that has not been read".

---

## 1. Verified chronology

All outbound messages were sent by **Daniele**, from the **`info@danielebuatti.com`**
mailbox, as **ordinary email (PEO)**. None of D9–D15 was submitted by us as PEC. Every
protocol receipt below is a reply *from the receiving office's protocollo system*, not a
submission receipt of ours.

| Ref | What it asked for | DB msg | Gmail message id | Sent (UTC) | Sent (CET) | To |
|-----|-------------------|--------|------------------|-----------|-----------|-----|
| **D9** | Thank-you to IIS "Celso Ulpiani" for Ezio's student file | 115 | `1a19f0837e4fafd9` | 2026-11-03 **01:31:17** | 02:31 | `apis00800e@istruzione.it` |
| **D10** | SBT: narrower estratto of marriage n. 45/1930 (parents only) | 102 | `1a1a05aaa9a54dcd` | 2026-11-03 **07:40:58** | 08:40 | `comunesbt@comunesbt.it` |
| **D11** | Ascoli: Alfredo's personnel file as *Economo* | 101 | `1a1a05b469669815` | 2026-11-03 **07:41:38** | 08:41 | `protocollo@comune.ap.it` |
| **D12** | Archivio di Stato AP: Remo Chiappini ruolo matricolare | 99 | `1a1a060c99b6b2d0` | 2026-11-03 **07:47:38** | 08:47 | `as-ap@cultura.gov.it` (cc Buondi) |
| **D13** | Ascoli: death acts of Galanti Ida †26/01/1970 and Buatti Alfredo †09/05/1964, with parents | 59 | `1a1a97264920fc7c` | 2026-11-05 **02:03:28** | 03:03 | `protocollo@comune.ap.it` |
| **D14** | SBT: death extract of Pirri Irma, 1930–1952 | 58 | `1a1a97270012d140` | 2026-11-05 **02:03:30** | 03:03 | `comunesbt@comunesbt.it` |
| **D15** | Curia SBT: Irma Pirri parish death/burial entry | 55 | `1a1a9ae9e3868dda` | 2026-11-05 **03:09:15** | 04:09 | `curia@diocesisbt.it` |
| *F1* | Fiumefreddo: Emmi Gregorio × Patanè Rosaria marriage 1948 | 39 | `1a1aadfecdb9b487` | 2026-11-05 **08:42:43** | 09:42 | `servizio1@comune.fiumefreddo-di-sicilia.ct.it` |

D13 and D14 went out **two seconds apart**; D10 and D11 **40 seconds apart**. Batching is a
deliberate habit, not an accident — relevant to §5.

### Receipts and replies

| Ref | Receipt msg | Received (UTC) | What it actually is | Reference |
|-----|-------------|----------------|---------------------|-----------|
| D9 | 103 | 03 Nov **07:31:00** | IIS protocollo receipt | `0030240/2026` del 03/11/2026 |
| D10 | 95 | 03 Nov **09:27:04** | SBT "Conferma di Ricezione" | `0090107/2026` del 03/11/2026 |
| D11 | 98 | 03 Nov **07:57:05** | Aruba PEC receipt, Comune di AP | `REG_UFFICIALE 99876/2026` |
| D12 | 18 | 05 Nov **10:11:25** | Archivio registered **document transmission** | `MIC_AS-AP/05/11/2026/0002978-P` |
| D13 | 43 | 05 Nov **07:59:18** | Aruba PEC "Ricevuta avvenuta protocollazione" | `REG_UFFICIALE 100913/2026` |
| D13 | 14 | 05 Nov **12:52:17** | Aruba PEC, protocolled outgoing document **with the acts attached** | `REG_UFFICIALE 101199/2026`; `ricevuta.pdf` = prot. `0101199` del 05-11-2026, *Uscita*, *PEO*, addetto Falciatori |
| D14 | 40 | 05 Nov **08:34:42** | SBT "Conferma di Ricezione" | `0090907/2026` del 05/11/2026 |
| D15 | 11309 | 06 Nov **10:17:19** | **Substantive answer** (see §2) | — |
| F1 | — | — | no receipt located | — |

Non-obvious detail on D13/#14: `ricevuta.pdf` describes a **movement "Uscita", type "PEO"** —
i.e. the Comune registered *its own outgoing reply* and sent it to us by ordinary email. The
2-page scan `doc07061420261105133528.pdf` is that reply, not a receipt artefact. `43899.eml`
inside the PEC is a byte copy of our original D13, with `Date: Thu, 05 Nov 2026 13:03:28
+1100` and `Message-ID: <CAC5Ug40-…@mail.gmail.com>` — which matches the DB `sent_at`
exactly and independently confirms the transmission time.

### Drafts

- **None of D9–D15 exists as a draft anywhere.** There is no `drafts` table in the database.
- Drafts live as JSON files in `correspondence/extracted/drafts/`, keyed by `thread_id`.
  Two are relevant to this business and **neither was sent**:
  - `1a1a9ab9b9303081.json` — a draft reply to Sig.ra Veccia (thread 55), `review_status: draft`.
  - `1a1a9ab9b9303081_new.json` — an unsent *new* letter to SBT Anagrafe, proposed after the
    Curia reply, `recipient_email: statocivile@comunesbt.it`, `review_status: draft` but with
    `reviewed_at` already set (see §3, inconsistency).
- The Gmail draft id `r-3163072428471052640` appears **only** in `correspondence-log.md` line
  199. It is not in the database and not in the drafts folder. It cannot be verified from this
  repo, and it is not evidence of anything.
- Who initiated and sent: **Daniele**, all of it. No outbound message here was machine-generated
  or machine-sent.

---

## 2. The specific discrepancies

### Messages 95, 98, 103

| Msg | Inbound from | Content | Belongs to |
|-----|--------------|---------|------------|
| **95** | `comunesbt@comunesbt.it` | "protocollazione con numero **0090107/2026** e data 03/11/2026 — Oggetto: Re: CHIAPPINI-PIRRI e BUATTI-GALANTI – domanda sull'atto di matrimonio n. 45/1930" | **D10** |
| **98** | `posta-certificata@pec.aruba.it` ("per conto di comune.ap@pec.it") | "POSTA CERTIFICATA: Ricevuta avvenuta protocollazione: **Ricerca storica** eventuale fascicolo personale di BUATTI Alfredo" — `99876/2026` | **D11** |
| **103** | `apis00800e@istruzione.it` | "AOO SCUOLA – Ricevuta del protocollo numero **0030240/2026** del 03/11/2026" | **D9** |

All three are **3 November** receipts for **3 November** requests. None of them concerns D13.

### The alleged "D13 received 3 November receipts"

It did not. The conflation is now fully resolved:

- **D13 is a 5 November transmission** (02:03:28 UTC), proven by the DB Sent record, by the
  PEC's own embedded copy of the original (`43899.eml`, `Date: … 13:03:28 +1100`), and by the
  fact that the reply's `ricevuta.pdf` describes our request.
- The two Ascoli receipts it *does* have are both dated **5 November** (#43 at 07:59, #14 at
  12:52).
- Three different requests (D9→school, D10→SBT, D11→Ascoli) each produced one 3 November
  receipt. Read as a set they look like "three receipts for one request"; they are one receipt
  for each of three requests.

The general lesson, and it is the single most important one in this document: **a protocol
receipt identifies a request only through its own subject/object line and reference number.
Subject similarity is not linkage.** Three requests to three institutions about the same
family will always produce near-identical subject lines.

### Was D9 drafted or sent?

**Sent.** `info@danielebuatti.com` → `apis00800e@istruzione.it`, 3 Nov 01:31:17 UTC, as the
reply in the Ulpiani thread; the school acknowledged at 07:31 the same morning with its own
protocol number, `0030240/2026`. Transmission and registration are both evidenced, from two
independent sources.

### What the Curia actually said (#11309)

Not a dead end, and not a refusal to look. Three facts:

1. **The July request was forwarded to the SBT parishes and produced nothing** — "la sua mail
   precedente, che ho girato alle parrocchie di San Benedetto del Tronto, non ha avuto
   risultato." That closes the July baptism/marriage enquiry as well, which is a research
   result in its own right.
2. The death search cannot be run **because the window is too wide and the parishes too many**
   — a scoping problem, not a refusal.
3. She **names the next office**: "Le consiglio di rivolgersi all'ufficio anagrafe di San
   Benedetto del Tronto dove sicuramente questo nominativo è più facile da trovare."

Note the office: **anagrafe**, not *stato civile*. D14 went to the Comune's *stato civile*
address. These are different offices within the same ente. The `_new` draft already sitting in
`extracted/drafts/` is addressed to `statocivile@comunesbt.it` — the same office D14 is
already sitting in. **That draft would duplicate D14 rather than follow the Curia's advice.**
This is a live example of why the model needs to distinguish *ente* from *office*.

### D12's attachment

`BUATTI Daniele - chiappini remo.pdf`, 243,841 bytes, `local_path: None` — **never downloaded,
never read**. The covering text is only "Si trasmette come file allegato a questa e-mail il
documento e gli eventuali allegati" — a registered-document transmission with no summary. It
may be the ruolo matricolare, or a "not held here, try X" letter. **Nobody knows, and the
system currently presents it as if it were an answer.**

---

## 3. Assessment of the existing model

### What is stored, and where

| Stage | Where it lives | Reliable? |
|-------|----------------|-----------|
| Draft created | `correspondence/extracted/drafts/<thread>.json` — `draft_text`, `generated_at`, `model`, `review_status`, `provenance`, `warnings` | Partly. Never referenced by the DB. Not queryable. |
| Draft edited | `edited_text`, `reviewed_at` in the same file | **Broken.** `…_new.json` has `reviewed_at` set and `review_status` still `"draft"`; the two fields are not coupled. |
| Transmitted | `messages.direction='out'` + `messages.sent_at` | **Yes** — and this is the only trustworthy transmission evidence. |
| Channel (PEC vs ordinary) | **nowhere** | No. Must be inferred from the *reply*. |
| PEC acceptance | in the PEC body text only | Partly. Never linked to a request. |
| PEC delivery | in PEC headers/`daticert.xml` | Partly. Not parsed into fields. |
| Protocol registration | free text inside `subject` / `body_text` | No. No `protocol_number` column exists. |
| Substantive response | nowhere distinct — collapses into the same `messages` row | No. |
| Document supplied | `attachments` row with `local_path`, `ocr_text` | No. No content type, no read state. |
| Request fulfilled | nowhere | No concept of a request at all. |

### Structural gaps

1. **No `requests` entity.** The unit of work in this domain is *"I asked office X for document
   Y on date Z, under reference R"*. The schema models messages, so a request is smeared across
   an outbound row, several inbound rows, and prose in `correspondence-log.md`. Every
   attribution error in §2 is a consequence.
2. **`direction` + `sent_at` is the whole outbound model.** There is no way to express
   "transmitted but not yet acknowledged", "acknowledged but not answered", "answered with a
   document I have not opened".
3. **Acknowledgement ≠ answer, and the classifier cannot tell them apart.** Live results:

   | Msg | What it is | `action_status` | Verdict |
   |-----|-----------|-----------------|---------|
   | #14 | **the death acts** | `needs_review` | right, but only because it is a government PEC |
   | #11309 | Curia's full answer | `no_action_needed` | **wrong** |
   | #128 | Ulpiani supplies a 3.7 MB student file, gratis | `no_action_needed` | **wrong** |
   | #18 | Archivio sends a registered document (unread) | `needs_review` | right |
   | #43, #40, #95, #98, #103 | pure receipts | `no_action_needed` | right |

   The classifier is reading subject lines and body prose. It is not reading attachments, and
   it has no notion of "is this a receipt or is this the thing I asked for".
4. **`attachments` has no state.** No `doc_type`, no `content_read_at`, no summary, no
   duplicate link. `local_path IS NULL` is indistinguishable from "not yet downloaded" and
   "downloaded elsewhere". For the five documents that matter most right now — the Ascoli acts,
   D12's PDF, and both Ulpiani PDFs — `local_path` is `None`.
5. **`actions` table exists and is empty (0 rows).** Nothing tracks "awaiting reply since …",
   chase dates, or completion. All of that lives in prose.
6. **Cross-account duplication is unhandled.** 205 groups / 11,063 messages are the same
   content present in **both** mailboxes under different `gmail_message_id`s (e.g. #21 / #766;
   #128 / #810). Any count of "documents received" or "replies" is inflated by ~2 % unless
   deduplicated. Worse, #810 has **four** attachment rows for **two** files (each file twice) —
   a genuine duplicate-attachment bug on top of the cross-account one.
7. **Timestamps are sound but easy to misuse.** `sent_at` and `received_at` are correctly
   normalised to UTC (the PEC body says 13:52:17 +0100, the row says 12:52:17Z). The danger is
   not the storage, it is the reasoning: D13 sent 03:03 CET, receipt at 07:59 CET, second
   receipt 13:52 CET — *five to eleven hours apart, same day*. D12 sent 3 Nov, registered
   5 Nov — *two days apart*. Deriving a send date from a protocol date is wrong by up to two
   days in this very corpus.
8. **The markdown logs disagree with the DB and nothing notices.** `correspondence-log.md`
   dates D10 to 5 Nov (actually 3 Nov); `AGENTS.md` dates D15 to 6 Nov (actually 5 Nov).
   These errors propagate into every downstream summary, including Claude's.

---

## 4. Proposed evidence model

The core move: **separate the request, the event, and the evidence.** An event is what
happened. Evidence is what lets you believe it. They are different rows, and an event may have
one, several, or no pieces of evidence.

```
Request ──< Event ──< Evidence
   │                      │
   └──────────┬───────────┘
        Attachment (content)
```

### 4.1 What each evidence kind proves — and what it does not

| Evidence kind | Proves | Does **not** prove |
|---|---|---|
| Draft file (`review_status: draft`) | A draft existed at time T | That anything was sent |
| Gmail Sent record (`direction='out'`, `sent_at`) | **Transmission occurred, at that time, to that address** | Delivery, registration, reading |
| SMTP bounce / no-reply failure | Transmission failed | — |
| PEC acceptance receipt ("accettazione") | The PEC provider accepted the message | That the office registered it |
| PEC delivery receipt ("avvenuta consegna") | The message reached the destination mailbox | That a human read it |
| "Ricevuta avvenuta protocollazione" | The office **registered** something, on that date, under that number | That the registration is of *our* request; that a reply exists |
| "Conferma di Ricezione" (comune mailer) | Registration by the comune | Same caveats |
| Protocol number quoted in a later message | Administrative continuity | The date of our transmission |
| Inbound message body naming our request | A human engaged with it | That it is an answer |
| Inbound attachment whose content matches the request | **Document supplied** | That it is complete, correct, or legible |
| Request fulfilled | Nothing until a human says so | — |

**Hard rules that follow, and that the current system violates:**

- **R1 — Transmission is evidenced by a Sent record, never by a protocol receipt.** Protocol
  receipts are corroborating administrative evidence. A normal Gmail email with no receipt at
  all is still sent (D9 has a receipt; D15 does not, and was still sent).
- **R2 — Never infer a transmission date from a protocol date.** They differ by hours (D13) and
  by days (D12) in this corpus. Store both, never derive one from the other.
- **R3 — A receipt is not a response.** Receipts may only move a request to `acknowledged` /
  `registered`. Moving to `answered` requires an inbound message that a human or a model has
  read.
- **R4 — An unread attachment is an open question, not an answer.** A request with an unread
  attachment may not be closed, and may not be chased, and may not be re-asked elsewhere.
- **R5 — Linkage must be by reference number or explicit quote, not by subject similarity.**
  Where linkage is ambiguous, record `link_confidence` and surface the ambiguity.

### 4.2 Shape of the proposal (not implemented)

New tables — additive only, no change to `messages` / `attachments` semantics:

```
requests
  id, subject_summary, person_ids (json), office_id, channel,
  opened_at, sent_message_id, state, state_basis (json), uncertainty (text)

request_events
  id, request_id, kind, occurred_at, message_id, attachment_id,
  source (db|attachment|human|inferred), confidence

request_evidence
  id, request_id, event_id, kind, value, issuing_body,
  reference_number, reference_date, source_path, verified_by, verified_at

offices
  id, ente, office_name, email, channel, notes        -- "Comune SBT / Anagrafe" ≠ "Comune SBT / Stato civile" ≠ "Curia SBT"

attachments  (additive columns)
  doc_type, content_read_at, content_summary, duplicate_of_id, content_sha256
```

`requests.state` is a **derived** value with an explicitly permitted `unknown`:

```
drafted → transmitted → acknowledged? → registered? → answered? → document_supplied? → closed
                                        │
                                        └─ any stage may stay `unknown` indefinitely
```

Each transition names the evidence kinds that can justify it. If no evidence of a permitted
kind exists, the state does **not** advance — it stays where it was, with `uncertainty`
explaining why. This is the "preserve uncertainty rather than invent a status" requirement,
expressed as a schema rule rather than a good intention.

**D13 under this model** would read:

```
request  D13  Ascoli / Stato civile / protocollo@comune.ap.it / PEO
  event  transmitted        2026-11-05T02:03:28Z   msg 59                     (confidence: certain)
  event  acknowledged       2026-11-05T07:59:18Z   msg 43  100913/2026         (certain)
  event  registered         2026-11-05T12:52:17Z   msg 14  101199/2026 → 0101199 (certain)
  event  document_supplied  2026-11-05T12:52:17Z   msg 14  doc070614…pdf       (content_unread → pending)
  state  document_supplied, unresolved: attachment content not read
```

And **D12**:

```
request  D12  Archivio di Stato AP / as-ap@cultura.gov.it / PEO
  event  transmitted  2026-11-03T07:47:38Z  msg 99                          (certain)
  event  registered   2026-11-05T10:11:25Z  msg 18  0002978-P               (certain)
  event  document_supplied?  msg 18  BUATTI…chiappini remo.pdf             (unread → not asserted)
  state  registered, unresolved: is the attachment an answer? unknown
```

---

## 5. Reassessment of Claude's recommendations

The behavioural advice was mostly sound. The factual basis for it was not, and the difference
matters because the advice will be reused.

| # | Recommendation | Verdict | Why |
|---|---|---|---|
| 1 | Check full sent + received history before drafting | **Sound** — and he did not follow it for himself | He reasoned from `correspondence-log.md`, which mis-dates D10 and D15, and never queried `direction='out'`. The rule is right; it needs to be enforced by tooling, not by diligence. |
| 2 | Read every attachment before replying | **Sound, and the most important one** | Everything else follows from it. Ascoli's answer and Ulpiani's file were both unread. |
| 3 | Count open requests per person; hold at ≥2 | **Heuristic, keep as a warning only** | The instinct is right (four SBT items in a week is a lot) but the count requires the `offices` distinction: Curia SBT, Comune SBT *stato civile* and Comune SBT *anagrafe* are three addressees, and #11309 explicitly asks for a fourth. Also, "hold at ≥2" would have blocked D14, which was the correct move. Present as a soft flag with the count shown, never a block. |
| 4 | Space chases 3–4 weeks | **Heuristic** | Sensible default, wrong as a rule. It should be measured from the last *outbound* event, suspended while evidence is still arriving (D13's second receipt landed 5 hours after the first), and overridable. Never blocks; only orders. |
| 5 | Thank anyone who did real work | **Sound** | D9 to Ulpiani was correct and well-timed. Now Ascoli has done real work, so Ascoli is owed the same — which inverts the previous "ask nothing more, thank nothing" posture. Conditioned on actual work, not on politeness. |
| 6 | Prefer free routes over paid ones | **Sound, and vindicated** | The €300 *ricerca* route was declined in favour of two exact-date death acts; the free route produced the answer in eleven hours. |
| 7 | One thing per email; cite protocol number | **Right about citations, wrong about one-thing** | Daniele deliberately batches (D13 asks two acts; D10/D11/D14 went out 40 s and 2 s apart) and it works. The load-bearing part is *citing the protocol number* so replies can be matched — which is exactly what the D10/D11/D13 confusion shows. Restate as "one decision per request, one reference per citation". |
| 8 | One next step at a time | **Sound** | Matches the user's own working agreement in `AGENTS.md`. |

**The two factual errors, stated plainly**, because they are the audit trail:

- **"Ascoli replied the same day with a scanned PDF" — correct, though asserted without
  reading it.** A lucky hit. And the same-day reply was real: two death acts at 13:52.
- **"D13 has 3-November protocol receipts" — wrong.** Those were the receipts of D9, D10 and
  D11.
- Downstream of both: the answer sat unread, and the summary that reached Daniele said the
  tiebreaker was still open when it had in fact closed.

**Root cause, in one sentence:** the assistant reasoned from a human-written narrative log
plus subject lines, instead of from `messages` + `attachments` + the bytes of the attachments.
Any of the eight principles, applied to that same input, would have produced the same errors.

---

## 6. Addendum for the Research Assistant cycle

### 6.1 Principles worth adopting (each with its enforcement)

| # | Principle | Enforced by |
|---|---|---|
| P1 | The DB is the record; prose logs are commentary. Where they differ, the DB wins and the log gets flagged. | §6.4 P2-3 |
| P2 | Transmission is proven by a Sent record; registration by a protocol reference; delivery by a receipt. Never substitute one for another. | §4.1 R1–R3 |
| P3 | Never derive a transmission date from a protocol date. Store both. | §4.1 R2 |
| P4 | An unread attachment is an open question. | §4.1 R4, P0-1 |
| P5 | Link a reply to a request by reference number or explicit quote, never by subject similarity. | §4.1 R5, P0-3 |
| P6 | Records are per-*request*, not per-message. | §4.2 |
| P7 | Distinguish *ente* from *office*: "Comune di SBT / Anagrafe" is not "Comune di SBT / Stato civile" is not "Curia di SBT". | `offices` table |
| P8 | Harvest what offices volunteer. #11309 named the anagrafe; the death act named birth act 1893 n. 236. | recommend-only step |
| P9 | Record the recommended step *and* the counter-argument. D14 to SBT was advisable but crowded. | §6.2 T2 |
| P10 | Uncertainty is a valid final answer. `unknown` must be expressible at every stage. | §4.2 state rule |

### 6.2 Autonomy framework

| Tier | Name | What it may do | Examples from this corpus |
|---|---|---|---|
| **T0** | **Observe** | Read DB, attachments, files. Change nothing, surface nothing. | Reconstructing the D9–D15 chronology from `sent_at`. |
| **T1** | **Decide** (silently, reversible, citable) | Assert facts that the evidence directly supports, always with the source row/attachment named. State "unread" as a fact when it is one. | "D13 transmitted 05/11 02:03 UTC (msg 59)"; "msg 14 contains 2 unread page images"; "D13 and D10 are different requests (different receipt numbers)". |
| **T2** | **Recommend** | Propose exactly one next action, with its evidence, its confidence, and the case against it. Human decides. | "Open `doc070614…pdf` before writing to Ascoli again"; "reply to Veccia briefly and ask the *anagrafe*, not *stato civile*"; "leave Fiumefreddo until December". |
| **T3** | **Draft** | Write a letter or draft reply, mark it `review_status: draft`, never send. | The `_new` Anagrafe draft — but addressed correctly per P7 first. |
| **T4** | **Never automate** | — | Sending anything; creating drafts in the user's Gmail without asking; marking any fact `verified`; editing `familyData.ts`; deleting or archiving correspondence; activating a rule; paying a fee; contacting a third party on Daniele's behalf. |

Promotion between tiers must be **per-action-type and reversible**: a T1 assertion that turns
out wrong must be cheap to retract (drop the row, do not cascade). This corpus contains two
wrong T1-level assertions (§0), which is precisely why T1 keeps a `source` field on every claim.

### 6.3 Prioritised improvements

**P0 — correctness blockers. These caused the current errors.**

| ID | Change | Why now | Acceptance test |
|---|---|---|---|
| P0-1 | **Attachment content gate.** Any inbound message with an attachment is `content_unread` until `content_read_at` is set. While unread: no "answered", no "close", no "chase elsewhere", no "the answer hasn't come". | The Ascoli acts and Ulpiani's file were both unread while the system reported progress. | With `doc070614…pdf` unread, D13 must report `unresolved: attachment not read`, never `answered`. |
| P0-2 | **`channel` + separated evidence.** Record PEO vs PEC on every message; forbid any code path that writes `sent_at` from a protocol date. | D12: sent 3 Nov, registered 5 Nov. D13: 03:03 → 07:59 → 13:52. | A test that feeds only receipts produces `transmitted: unknown`, not a date. |
| P0-3 | **`requests` + reference linkage.** Link outbound → receipts → replies by number/quote. | Five attribution errors in one week, all subject-similarity-driven. | The D9/D10/D11/D13 fixture must attach each receipt to the right request with zero cross-links. |

**P1 — prevents the next class of error.**

| ID | Change | Acceptance test |
|---|---|---|
| P1-1 | Classify inbound as `receipt` / `acknowledgement` / `registered_document` / `answer` / `document` — not just `action_required`. | #11309 and #128 must not be `no_action_needed`. |
| P1-2 | Deduplicate cross-account messages (205 groups) and duplicate attachment rows (#810 has 4 rows for 2 files). | "Documents supplied" for Ulpiani = 2, not 4; no double-count across mailboxes. |
| P1-3 | Make `local_path IS NULL` an explicit `content_unavailable` state and surface it in the UI, with the existing `--download` capability as the queue. | The Ascoli acts, D12's PDF and both Ulpiani PDFs all appear as "not yet read", not as "no attachment". |

**P2 — hygiene.**

| ID | Change |
|---|---|
| P2-1 | Move draft lifecycle into the DB, or at minimum couple `review_status`/`reviewed_at` so `…_new.json` cannot be `reviewed` but still `draft`. |
| P2-2 | Extract and store `protocol_number` / `reference_date` as columns instead of leaving them in `subject` text. |
| P2-3 | Log-vs-DB divergence lint: warn when `correspondence-log.md` / `AGENTS.md` dates disagree with `sent_at` (would have caught D10 "5 Nov", D15 "06/11"). |
| P2-4 | `offices` table to resolve ente/office (Curia SBT / Comune SBT Anagrafe / Comune SBT Stato civile) before any "how many open requests" count. |

### 6.4 Test scenarios

All eight can be built from real rows already in the DB.

1. **Receipt is not a response.** Fixture: D9 → msg 103. Assert request state is
   `registered`, not `answered`; assert no date is copied from the protocol date.
2. **Date independence.** Fixture: D12 → msg 99 (sent 3 Nov) + msg 18 (registered 5 Nov).
   Assert `transmitted_at = 2026-11-03T07:47:38Z` and that no code path can reassign 5 Nov.
3. **Same-day multi-receipt.** Fixture: D13 → msg 43 (07:59) + msg 14 (12:52). Assert the
   second receipt does not create a second request and does not resend anything.
4. **Three receipts, three requests.** Fixture: msgs 95, 98, 103. Assert each links to D10,
   D11 and D9 respectively, and that zero link to D13.
5. **Unread attachment blocks closure.** Fixture: D13 + msg 14 with `content_read_at` null.
   Assert state `document_supplied` with `unresolved: attachment not read`, and assert any
   "reply/chase" recommendation is suppressed.
6. **Answer hidden in a PEC envelope.** Fixture: msg 14. Assert the attachment list is walked,
   that `ricevuta.pdf` is recognised as *registration evidence* while
   `doc070614…pdf` is candidate *content*, and that `43899.eml` is linked back to msg 59.
7. **Acknowledgement-shaped refusal.** Fixture: msg 11309. Assert `answer` (not
   `no_action_needed`), that the July enquiry is recorded as *negative result*, and that the
   volunteered next office is harvested as a recommendation — to *anagrafe*, not *stato civile*.
8. **Cross-account duplicate.** Fixture: #128 / #810. Assert one logical document set of two
   files, not four, and that the document count is mailbox-independent.

---

## 7. What this document did not do

No database or schema change. No Gmail read/write beyond the existing local store. Nothing
sent, drafted, archived or deleted. No change to `familyData.ts` or to any record. No rule
proposed, approved or activated. No commit or push.

**Not done, deliberately, and awaiting a decision:** opening the two death acts as records,
updating Ida Galanti's parentage and the 1893 resolution, and logging this session in
`AGENTS.md` / `HANDOFF.md`. All three are edits, and the first two are exactly the kind of
change that must not be made without Daniele saying so.
