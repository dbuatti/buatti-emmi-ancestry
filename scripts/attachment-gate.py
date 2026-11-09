#!/usr/bin/env python3
"""Attachment gate — Step 1 of the correspondence assistant.

Purpose
-------
Answer one question per inbound message, for every message in scope:

    "Has this message delivered documents, and can we read them?"

It deliberately does NOT answer the *research* question
("does this document fulfil the request?").  That stays `unverified` until a
human says otherwise.  Receiving a document and verifying that it satisfies a
research request are two different events and are stored as two different
fields (`document_receipt` / `fulfilment`).

Downstream stages (classification, action selection, drafting, continuity)
must consume the gate record instead of guessing from subject lines and
bodies.  Nothing here is a separate workflow: it is the input layer the
single-instruction Sweep will call.

Outputs
-------
correspondence/extracted/attachment-gate.json   sidecar, merged (never wiped)
correspondence/extracted/<att_id>.txt           extracted text (same path
                                                convention as
                                                extract-attachments.py)
correspondence/extracted/ocr_pages/<att_id>/    rendered pages for review

Deliberately NOT done here
--------------------------
* no bulk download of the archive
* no retrospective reprocessing of every existing attachment
* no family-data changes, no fact promotion
* no Gmail writes, nothing sent

Usage
-----
  python3 scripts/attachment-gate.py --message 14
  python3 scripts/attachment-gate.py --message 1a1abc46de4b71d3
  python3 scripts/attachment-gate.py --thread 1a1abc46de4b71d3
  python3 scripts/attachment-gate.py --since 2026-11-01T00:00:00Z --inbound-only
  python3 scripts/attachment-gate.py --message 14 --no-download
  python3 scripts/attachment-gate.py --message 14 --json

An explicit scope is always required: there is no implicit "process
everything" mode.
"""
import argparse
import datetime
import importlib.util
import json
import os
import re
import sqlite3
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
EXTRACTED_DIR = os.path.join(ROOT, "correspondence", "extracted")
GATE_PATH = os.path.join(EXTRACTED_DIR, "attachment-gate.json")
PAGES_DIR = os.path.join(EXTRACTED_DIR, "ocr_pages")

# --- gate policy ---------------------------------------------------------
MIN_TEXT_CHARS_PER_PAGE = 400  # below this a PDF is treated as scanned (a PEC
                              # stamp overlay yields ~100 chars/page of "text"
                              # on an otherwise image-only document)
MIN_OCR_CHARS = 120            # below this OCR produced nothing usable
OCR_CONF_OK = 70.0             # mean tesseract confidence we are willing to trust
MAX_OCR_PAGES = 4              # never spend the afternoon on one document
MAX_EXCERPT_CHARS = 6000       # per message, for downstream context

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".gif", ".webp"}
DOCUMENT_EXTS = {".pdf", ".docx", ".doc", ".odt", ".rtf", ".tif", ".tiff"}
AUXILIARY_EXTS = {".p7s", ".xml", ".eml", ".ics", ".vcf", ".sig", ".p7m"}
AUXILIARY_PREFIXES = ("daticert", "segnatura", "postacert", "smime", "ricevuta", "riepilogo_mail")

# Worst-first. The first matching status decides the message gate_status.
STATUS_SEVERITY = [
    "not_downloaded",
    "unreadable",
    "unsupported",
    "needs_visual_review",
    "ocr_low_confidence",
    "ocr_extracted",
    "text_extracted",
    "duplicate",
    "not_a_document",
]

BLOCKING_STATUSES = {
    "not_downloaded",
    "unreadable",
    "unsupported",
    "needs_visual_review",
    "ocr_low_confidence",
}


# ---------------------------------------------------------------------------
# module loading (reuse the existing local tooling, do not duplicate it)
# ---------------------------------------------------------------------------
def _load_module(name, filename):
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)
    if not os.path.exists(path):
        return None
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_M = {}


def _mods():
    if not _M:
        _M["extract"] = _load_module("extract_attachments", "extract-attachments.py")
        _M["ocr"] = _load_module("ocr_attachments", "ocr-attachments.py")
        _M["sync"] = _load_module("sync_gmail", "sync-gmail.py")
    return _M


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def connect(readonly=True):
    if readonly:
        conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
    else:
        conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def classify_kind(filename, mime_type):
    """'document' | 'image' | 'auxiliary' | 'unsupported'."""
    base = os.path.basename((filename or "").lower())
    ext = os.path.splitext(base)[1]
    if base.startswith(AUXILIARY_PREFIXES):
        return "auxiliary"
    if ext in AUXILIARY_EXTS:
        return "auxiliary"
    if ext in IMAGE_EXTS:
        return "image"
    if ext in DOCUMENT_EXTS:
        return "document"
    m = (mime_type or "").lower()
    if "pdf" in m or "wordprocessing" in m or "spreadsheet" in m or "presentation" in m or "opendocument.text" in m:
        return "document"
    if m.startswith("image/"):
        return "image"
    if "pkcs7" in m or m in ("application/xml", "text/xml") or m.endswith("/xml"):
        return "auxiliary"
    return "unsupported"


def pdf_page_count(path):
    try:
        r = subprocess.run(["pdfinfo", path], capture_output=True, text=True, timeout=60)
        for line in r.stdout.splitlines():
            if line.startswith("Pages:"):
                return int(line.split(":", 1)[1].strip())
    except Exception:
        pass
    return 0


def read_text_file(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


def _status_rank(status):
    try:
        return STATUS_SEVERITY.index(status)
    except ValueError:
        return len(STATUS_SEVERITY)


_DUP_SUFFIXES = ("_marcato", "_firmato", "_signed", "_timbrato", "_1", "(1)")


def doc_stem(filename):
    """Filename stem with PEC/signature suffixes removed.

    A PEC message normally carries both `X.pdf` (the document) and
    `X_Marcato.pdf` (the same document with the postmark applied).  Treating
    them as two documents costs a second OCR pass and tells us nothing new.
    """
    stem = os.path.splitext(os.path.basename((filename or "").lower()))[0]
    changed = True
    while changed:
        changed = False
        for suf in _DUP_SUFFIXES:
            if stem.endswith(suf) and len(stem) > len(suf):
                stem = stem[: -len(suf)]
                changed = True
    return stem.strip(" -_.()")


# ---------------------------------------------------------------------------
# extraction (reuses extract-attachments.py + ocr-attachments.py)
# ---------------------------------------------------------------------------
def _extract_pdf_text(path):
    """Text layer only. Returns (text, pages)."""
    pages = pdf_page_count(path)
    try:
        out = subprocess.run(
            ["pdftotext", "-layout", path, "-"],
            capture_output=True, text=True, timeout=300,
        )
        return (out.stdout or ""), pages
    except Exception:
        return "", pages


def _run_ocr(path, att_id, dpi):
    """OCR via the existing ocr-attachments helpers. Returns dict or None."""
    mods = _mods()
    ocr = mods.get("ocr")
    if ocr is None:
        return None
    page_dir = os.path.join(PAGES_DIR, str(att_id))
    try:
        pages = ocr.render_pages(path, page_dir, dpi=dpi)
    except Exception as e:
        return {"error": "%s: %s" % (type(e).__name__, e)}
    page_texts, confs, rots, notes = [], [], [], []
    for i, pg in enumerate(pages, start=1):
        try:
            txt, rot, psm, conf, note = ocr.ocr_page(pg, rank="strict")
        except TypeError:
            txt, rot, psm, conf, note = ocr.ocr_page(pg)
        except Exception as e:
            txt, rot, psm, conf, note = "", 0, 0, None, "error: %s" % e
        txt = txt.replace("\r\n", "\n").replace("\r", "\n")
        page_texts.append("===== PAGE %d =====\n%s" % (i, txt.strip()))
        confs.append(conf)
        rots.append(rot)
        notes.append("page %d: %s" % (i, note))
    text = "\n\n".join(page_texts) + "\n"
    numeric = [c for c in confs if isinstance(c, (int, float))]
    mean_conf = round(sum(numeric) / len(numeric), 1) if numeric else None
    return {
        "text": text,
        "pages": len(pages),
        "confidences": confs,
        "mean_confidence": mean_conf,
        "rotations": rots,
        "notes": "; ".join(notes),
        "page_dir": os.path.relpath(page_dir, ROOT),
    }


def process_attachment(conn, row, dpi, allow_ocr=True, force=False):
    """Return the per-attachment gate record (never raises)."""
    att_id = row["id"]
    filename = row["filename"] or row["safe_filename"] or ""
    mime = row["mime_type"] or ""
    kind = classify_kind(filename, mime)

    rec = {
        "attachment_id": att_id,
        "filename": filename,
        "safe_filename": row["safe_filename"],
        "mime_type": mime,
        "size_bytes": row["size_bytes"],
        "kind": kind,
        "status": None,
        "method": None,
        "chars": 0,
        "pages": None,
        "confidence": None,
        "text_path": None,
        "page_images": None,
        "notes": "",
        "requires_visual_review": False,
        "unverified": True,
    }

    if kind == "auxiliary":
        rec["status"] = "not_a_document"
        rec["notes"] = "envelope, receipt or signature — not a research document"
        return rec
    if kind == "unsupported":
        rec["status"] = "unsupported"
        rec["notes"] = "no local extractor for this format"
        rec["requires_visual_review"] = True
        return rec

    local_path = row["local_path"]
    if not local_path or not os.path.exists(local_path):
        rec["status"] = "not_downloaded"
        rec["notes"] = "attachment is not on disk; download was skipped or failed"
        rec["requires_visual_review"] = True
        return rec

    rec["local_path"] = local_path

    if kind == "image":
        rec["status"] = "needs_visual_review"
        rec["notes"] = "raster image — no text extraction; open the file"
        rec["requires_visual_review"] = True
        return rec

    # -- document -----------------------------------------------------
    is_pdf = mime.lower().startswith("application/pdf") or filename.lower().endswith(".pdf")
    if not is_pdf:
        rec["status"] = "unsupported"
        rec["notes"] = "no local extractor for %s" % (os.path.splitext(filename)[1] or mime or "this format")
        rec["requires_visual_review"] = True
        return rec

    need_ocr = True
    text, pages = _extract_pdf_text(local_path)
    rec["pages"] = pages
    stripped = text.strip()
    per_page = (len(stripped) / pages) if pages else 0
    if pages and per_page >= MIN_TEXT_CHARS_PER_PAGE:
        rec["status"] = "text_extracted"
        rec["method"] = "pdftotext -layout"
        rec["chars"] = len(stripped)
        need_ocr = False
    else:
        rec["chars_per_page"] = round(per_page, 1)
        text = ""

    if need_ocr:
        if not allow_ocr:
            rec["status"] = "needs_visual_review"
            rec["notes"] = "no text layer and OCR was disabled (--no-ocr)"
            rec["requires_visual_review"] = True
            return rec
        if rec.get("pages") and rec["pages"] > MAX_OCR_PAGES:
            rec["notes"] = "only the first %d of %s pages were OCR'd" % (MAX_OCR_PAGES, rec["pages"])
        ocr = _run_ocr(local_path, att_id, dpi)
        if ocr is None:
            rec["status"] = "unreadable"
            rec["notes"] = "OCR helper unavailable"
            rec["requires_visual_review"] = True
            return rec
        if ocr.get("error"):
            rec["status"] = "unreadable"
            rec["notes"] = "OCR failed: %s" % ocr["error"]
            rec["requires_visual_review"] = True
            return rec
        text = ocr["text"]
        rec["pages"] = ocr["pages"]
        rec["confidence"] = ocr["mean_confidence"]
        rec["page_images"] = ocr["page_dir"]
        rec["method"] = "tesseract (ita+eng, rotation brute-force)"
        rec["chars"] = len(text.strip())
        if len(text.strip()) < MIN_OCR_CHARS:
            rec["status"] = "unreadable"
            rec["notes"] = (ocr["notes"] + "; less than %d characters recognised" % MIN_OCR_CHARS).strip("; ")
            rec["requires_visual_review"] = True
            return rec
        conf = ocr["mean_confidence"]
        if conf is not None and conf < OCR_CONF_OK:
            rec["status"] = "ocr_low_confidence"
            rec["requires_visual_review"] = True
        else:
            rec["status"] = "ocr_extracted"
        rec["notes"] = ((rec["notes"] + "; ") if rec["notes"] else "") + ocr["notes"]

    # write the text next to the other extracted artefacts
    if text:
        out_path = os.path.join(EXTRACTED_DIR, "%d.txt" % att_id)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(text)
        rec["text_path"] = os.path.relpath(out_path, ROOT)

    return rec


def ensure_downloaded(message_rows, allow_download=True):
    """Download the attachments of the given messages only (never bulk)."""
    out = {"attempted": [], "errors": []}
    if not allow_download:
        return out
    mods = _mods()
    sync = mods.get("sync")
    if sync is None:
        out["errors"].append("sync-gmail.py not importable; cannot download")
        return out
    for msg in message_rows:
        gmail_id = msg["gmail_message_id"]
        has_missing = msg["missing_downloads"] or 0
        if not gmail_id or not has_missing:
            continue
        try:
            res = sync.run_download(gmail_message_id=gmail_id)
            out["attempted"].append({"gmail_message_id": gmail_id, "result": res})
        except Exception as e:
            out["errors"].append({"gmail_message_id": gmail_id, "error": "%s: %s" % (type(e).__name__, e)})
    return out


# ---------------------------------------------------------------------------
# the gate itself
# ---------------------------------------------------------------------------
def gate_for_message(conn, msg_row, dpi, allow_ocr=True, allow_download=True):
    msg_id = msg_row["id"]
    atts = conn.execute(
        """SELECT id, filename, safe_filename, mime_type, size_bytes, local_path,
                  gmail_attachment_id, unavailable
           FROM attachments WHERE message_id=? ORDER BY id""",
        (msg_id,),
    ).fetchall()

    records = []
    seen_stems = {}
    for a in atts:
        if a["unavailable"]:
            records.append({
                "attachment_id": a["id"],
                "filename": a["filename"],
                "kind": classify_kind(a["filename"], a["mime_type"]),
                "status": "not_downloaded",
                "notes": "Gmail reports this attachment unavailable: %s" % (a["unavailable"] or ""),
                "requires_visual_review": True,
                "unverified": True,
            })
            continue
        kind = classify_kind(a["filename"], a["mime_type"])
        stem = doc_stem(a["filename"])
        if kind in ("document", "image") and stem in seen_stems:
            records.append({
                "attachment_id": a["id"],
                "filename": a["filename"],
                "safe_filename": a["safe_filename"],
                "mime_type": a["mime_type"],
                "size_bytes": a["size_bytes"],
                "kind": kind,
                "status": "duplicate",
                "duplicate_of": seen_stems[stem],
                "notes": "same document as attachment %s (PEC/postmark copy) — not extracted twice"
                         % seen_stems[stem],
                "requires_visual_review": False,
                "unverified": True,
            })
            continue
        rec = process_attachment(conn, a, dpi=dpi, allow_ocr=allow_ocr)
        if kind in ("document", "image"):
            seen_stems[stem] = a["id"]
        records.append(rec)

    documents = [r for r in records if r["kind"] in ("document", "image")]
    statuses = [r["status"] for r in records]

    if not records:
        gate_status = "no_attachments"
    elif not documents:
        gate_status = "auxiliary_only"
    else:
        doc_statuses = [r["status"] for r in documents]
        worst = min(doc_statuses, key=_status_rank)
        if worst == "not_downloaded":
            gate_status = "documents_not_downloaded"
        elif worst in ("unreadable", "unsupported"):
            gate_status = "documents_unreadable"
        elif worst in ("needs_visual_review", "ocr_low_confidence"):
            gate_status = "documents_need_review"
        else:
            gate_status = "documents_ready"

    usable = {"text_extracted", "ocr_extracted"}
    excerpt_parts = []
    for r in records:
        if r.get("status") in usable and r.get("text_path"):
            t = read_text_file(os.path.join(ROOT, r["text_path"])).strip()
            if t:
                excerpt_parts.append("--- %s (%s) ---\n%s" % (r["filename"], r["status"], t))
    excerpt = "\n\n".join(excerpt_parts)[:MAX_EXCERPT_CHARS]

    return {
        "message_id": msg_id,
        "gmail_message_id": msg_row["gmail_message_id"],
        "gmail_thread_id": msg_row["gmail_thread_id"],
        "direction": msg_row["direction"],
        "subject": msg_row["subject"],
        "from_email": msg_row["from_email"],
        "received_at": msg_row["received_at"],
        "gate_status": gate_status,
        "has_documents": bool(documents),
        "document_count": len([r for r in documents if r.get("status") != "duplicate"]),
        "requires_human_review": bool(documents),
        "blocks_no_action": any(s in BLOCKING_STATUSES for s in statuses) and bool(documents),
        "document_receipt": "documents_present" if documents else "none",
        # receipt != fulfilment. The gate can never verify a research request.
        "fulfilment": "unverified",
        "attachments": records,
        "text_excerpt": excerpt,
        "gated_at": now_iso(),
        "extraction_unverified": True,
    }


def load_gate():
    if not os.path.exists(GATE_PATH):
        return {"version": 1, "messages": {}}
    try:
        with open(GATE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        return {"version": 1, "messages": {}}
    data.setdefault("version", 1)
    data.setdefault("messages", {})
    return data


def save_gate(data):
    os.makedirs(EXTRACTED_DIR, exist_ok=True)
    data["generated_at"] = now_iso()
    with open(GATE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# API for downstream stages
# ---------------------------------------------------------------------------
def gate_summary(gate, message_ids):
    """Compact gate view for a set of messages (classification / drafting)."""
    wanted = [str(m) for m in message_ids]
    entries = [gate["messages"][m] for m in wanted if m in gate["messages"]]
    if not entries:
        return None
    blocking = [e for e in entries if e.get("blocks_no_action")]
    with_docs = [e for e in entries if e.get("has_documents")]
    return {
        "message_ids": [e["message_id"] for e in entries],
        "gate_statuses": {str(e["message_id"]): e["gate_status"] for e in entries},
        "has_documents": bool(with_docs),
        "document_count": sum(e.get("document_count") or 0 for e in entries),
        "blocks_no_action": bool(blocking),
        "blocking_message_ids": [e["message_id"] for e in blocking],
        "requires_human_review": any(e.get("requires_human_review") for e in entries),
        "fulfilment": "unverified",
        "ungated_messages_with_attachments": [],
    }


def attachment_context(gate, message_ids, max_chars=8000):
    """Text block for drafting. Returns (block, provenance).

    Only text that passed the gate (`text_extracted` / `ocr_extracted`) is
    offered to the drafter.  Low-confidence OCR and unreadable documents are
    listed as gaps instead, so a draft is never built on garbage.
    """
    usable = {"text_extracted", "ocr_extracted"}
    blocks, gaps, prov = [], [], []
    for mid in message_ids:
        e = gate["messages"].get(str(mid))
        if not e:
            continue
        docs = [a for a in e.get("attachments", []) if a.get("kind") in ("document", "image")]
        good = [a for a in docs if a.get("status") in usable]
        bad = [a for a in docs if a.get("status") not in usable and a.get("status") != "duplicate"]
        if bad:
            gaps.append(
                "message %s: %s"
                % (
                    mid,
                    "; ".join(
                        "%s (%s%s)"
                        % (
                            a.get("filename"),
                            a.get("status"),
                            ", conf %s" % a["confidence"] if a.get("confidence") is not None else "",
                        )
                        for a in bad
                    ),
                )
            )
        if good and e.get("text_excerpt"):
            blocks.append(
                "--- ATTACHMENT GATE: message %s (%s) ---\n%s"
                % (mid, e["gate_status"], e["text_excerpt"])
            )
            prov.append({
                "message_id": e["message_id"],
                "gate_status": e["gate_status"],
                "attachments": [
                    {
                        "attachment_id": a.get("attachment_id"),
                        "filename": a.get("filename"),
                        "status": a.get("status"),
                        "text_path": a.get("text_path"),
                    }
                    for a in good
                ],
            })
    if not blocks and not gaps:
        return "", []
    header = (
        "=== ATTACHMENTS RECEIVED (extracted locally, UNVERIFIED) ===\n"
        "The following text was extracted from documents attached to the "
        "correspondence. It is machine-extracted (text layer or OCR) and has "
        "not been checked by a human. Do not treat it as verified fact, do not "
        "strengthen what it says, and mark anything uncertain with [VERIFY].\n"
    )
    body = "\n\n".join(blocks)
    if gaps:
        body += "\n\n=== ATTACHMENTS PRESENT BUT NOT READABLE ===\n" + "\n".join(gaps)
        body += ("\nDo not assume these documents are absent, and do not describe "
                 "their contents. Say that they are attached and will follow.")
    return (header + body)[:max_chars], prov


def gate_for_thread(conn, gmail_thread_id, gate=None):
    gate = gate or load_gate()
    rows = conn.execute(
        "SELECT id FROM messages WHERE gmail_thread_id=?", (gmail_thread_id,)
    ).fetchall()
    ids = [r["id"] for r in rows]
    summary = gate_summary(gate, ids)
    if summary is None:
        # No gate record yet: report the attachment rows we know about so the
        # caller can avoid a silent "nothing to do".
        missing = conn.execute(
            """SELECT m.id FROM messages m
               WHERE m.gmail_thread_id=? AND m.direction='in'
                 AND EXISTS (SELECT 1 FROM attachments a WHERE a.message_id=m.id)""",
            (gmail_thread_id,),
        ).fetchall()
        if missing:
            return {
                "message_ids": [],
                "gate_statuses": {},
                "has_documents": False,
                "document_count": 0,
                "blocks_no_action": False,
                "blocking_message_ids": [],
                "requires_human_review": True,
                "fulfilment": "unverified",
                "ungated_messages_with_attachments": [r["id"] for r in missing],
            }
        return None
    ungated = conn.execute(
        """SELECT m.id FROM messages m
           WHERE m.gmail_thread_id=? AND m.direction='in'
             AND EXISTS (SELECT 1 FROM attachments a WHERE a.message_id=m.id)""",
        (gmail_thread_id,),
    ).fetchall()
    summary["ungated_messages_with_attachments"] = [
        r["id"] for r in ungated if str(r["id"]) not in gate["messages"]
    ]
    return summary


# ---------------------------------------------------------------------------
# guard: an unread attachment must never end up as "no action needed"
# ---------------------------------------------------------------------------
def upgrade_no_action(conn, gate_record):
    """Flip a message-level `no_action_needed` to `needs_review`.

    Conservative and one-way: it never downgrades a status, and it only runs
    for inbound messages the gate has actually looked at.
    """
    if gate_record["direction"] != "in" or not gate_record["has_documents"]:
        return None
    # A document arriving on an inbound message is never "no action needed",
    # whether or not we could read it.  Unreadable ones are the most dangerous,
    # but a readable delivery is still worth reviewing before it is dismissed.
    row = conn.execute(
        "SELECT action_status FROM message_classification WHERE message_id=?",
        (gate_record["message_id"],),
    ).fetchone()
    if not row or row["action_status"] != "no_action_needed":
        return None
    conn.execute(
        """UPDATE message_classification
           SET action_status='needs_review',
               action_confidence=MAX(COALESCE(action_confidence, 0), 0.6),
               classified_at=?
           WHERE message_id=?""",
        (now_iso(), gate_record["message_id"]),
    )
    return "no_action_needed"


# ---------------------------------------------------------------------------
# scope resolution
# ---------------------------------------------------------------------------
def resolve_messages(conn, args):
    base = """SELECT m.id, m.gmail_message_id, m.gmail_thread_id, m.direction,
                     m.subject, m.from_email, m.received_at,
                     (SELECT COUNT(*) FROM attachments a
                       WHERE a.message_id=m.id AND a.unavailable=0
                         AND (a.local_path IS NULL OR a.local_path='')) AS missing_downloads
              FROM messages m"""
    where, params = [], []

    if args.message:
        ident = str(args.message).strip()
        if ident.isdigit():
            where.append("m.id = ?")
            params.append(int(ident))
        else:
            where.append("m.gmail_message_id = ?")
            params.append(ident)
    elif args.thread:
        where.append("m.gmail_thread_id = ?")
        params.append(args.thread)
    elif args.since:
        where.append("COALESCE(m.received_at, m.sent_at) >= ?")
        params.append(args.since)
    else:
        raise SystemExit(
            "Explicit scope required: --message <id|gmail_id>, --thread <id>, or --since <iso>."
        )

    if getattr(args, "inbound_only", False):
        where.append("m.direction = 'in'")

    sql = base + " WHERE " + " AND ".join(where) + " ORDER BY COALESCE(m.received_at, m.sent_at)"
    return conn.execute(sql, params).fetchall()


def main():
    ap = argparse.ArgumentParser(description="Attachment gate for correspondence messages.")
    ap.add_argument("--message", help="DB message id or Gmail message id")
    ap.add_argument("--thread", help="Gmail thread id")
    ap.add_argument("--since", help="ISO timestamp; gate every message since then")
    ap.add_argument("--inbound-only", action="store_true", default=False)
    ap.add_argument("--no-download", action="store_true", default=False,
                    help="never call Gmail; gate only what is already on disk")
    ap.add_argument("--no-ocr", action="store_true", default=False,
                    help="skip OCR (text layer only)")
    ap.add_argument("--no-db-write", action="store_true", default=False,
                    help="do not upgrade message-level action_status")
    ap.add_argument("--dpi", type=int, default=400)
    ap.add_argument("--json", action="store_true", default=False)
    args = ap.parse_args()

    conn = connect(readonly=False)
    rows = resolve_messages(conn, args)
    if not rows:
        print("No messages matched the given scope.", file=sys.stderr)
        return 2

    # download only the attachments of the messages in scope
    dl = ensure_downloaded(rows, allow_download=not args.no_download)
    if dl["attempted"]:
        # re-read local_path after downloading
        rows = resolve_messages(conn, args)

    gate = load_gate()
    results = []
    for msg in rows:
        rec = gate_for_message(
            conn, msg, dpi=args.dpi,
            allow_ocr=not args.no_ocr,
            allow_download=not args.no_download,
        )
        if not args.no_db_write:
            flipped = upgrade_no_action(conn, rec)
            if flipped:
                rec["action_status_upgraded_from"] = flipped
                conn.commit()
        gate["messages"][str(rec["message_id"])] = rec
        results.append(rec)

    save_gate(gate)

    if args.json:
        print(json.dumps({"gate": results, "download": dl,
                          "gate_path": os.path.relpath(GATE_PATH, ROOT)}, indent=2))
        return 0

    print("attachment gate: %d message(s)" % len(results))
    for r in results:
        flag = " BLOCKS-NO-ACTION" if r["blocks_no_action"] else ""
        print("\n  msg %s [%s] %s%s" % (
            r["message_id"], r["direction"], r["gate_status"], flag))
        print("    %s" % (r["subject"] or "")[:100])
        for a in r["attachments"]:
            print("      - %-46s %-18s %s" % (
                (a.get("filename") or "")[:46], a.get("status"),
                ("conf=%s" % a["confidence"]) if a.get("confidence") is not None else ""))
        if r["has_documents"]:
            print("    documents=%d  fulfilment=%s  human-review=%s" % (
                r["document_count"], r["fulfilment"], r["requires_human_review"]))
    if dl["errors"]:
        print("\n  download errors: %s" % dl["errors"])
    print("\n  gate written: %s" % os.path.relpath(GATE_PATH, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
