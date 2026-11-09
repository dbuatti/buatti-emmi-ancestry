#!/usr/bin/env python3
"""
Phase 4A — local text extraction for the downloaded correspondence attachments.

Reads the local SQLite DB read-only, extracts text from each downloaded
attachment using free local tools only, and writes:

  correspondence/extracted/<att_id>.txt   -- extracted text (UTF-8)
  correspondence/extracted/manifest.json  -- per-attachment provenance + stats

No original attachment is modified. No network access. No schema change.
"""
import argparse
import email
import hashlib
import html
import json
import os
import re
import sqlite3
import subprocess
import sys
import xml.etree.ElementTree as ET
from email import policy
from email.parser import BytesParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
ATTACHMENTS_DIR = os.path.join(ROOT, "correspondence", "attachments")
EXTRACTED_DIR = os.path.join(ROOT, "correspondence", "extracted")

MAX_TEXT_CHARS = 200000  # safety cap per file


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def run_pdftotext(path):
    """Return (text, method, notes)."""
    try:
        info = subprocess.run(["pdfinfo", path], capture_output=True, text=True, timeout=60)
        pages = 0
        for line in info.stdout.splitlines():
            if line.startswith("Pages:"):
                try:
                    pages = int(line.split(":", 1)[1].strip())
                except ValueError:
                    pages = 0
        out = subprocess.run(["pdftotext", "-layout", path, "-"],
                            capture_output=True, text=True, timeout=300)
        text = out.stdout or ""
        notes = []
        if out.returncode != 0:
            notes.append("pdftotext exit %d: %s" % (out.returncode, out.stderr.strip()[:300]))
        # detect image-only: very little text relative to pages
        if pages > 0 and len(text.strip()) < max(40, pages * 20):
            notes.append("image-only or scanned PDF (no embedded text layer); %d page(s), %d chars" % (pages, len(text.strip())))
        # image count
        imgs = subprocess.run(["pdfimages", "-list", path], capture_output=True, text=True, timeout=60)
        img_lines = [l for l in imgs.stdout.splitlines() if re.match(r"^\s*\d+\s+\d+\s+image", l)]
        if img_lines:
            notes.append("%d embedded image(s) detected" % len(img_lines))
        return text, "pdftotext -layout", "; ".join(notes) if notes else ""
    except FileNotFoundError as e:
        return "", "pdftotext", "tool not found: %s" % e
    except Exception as e:
        return "", "pdftotext", "error: %s" % e


def extract_xml(path):
    notes = []
    try:
        tree = ET.parse(path)
        root = tree.getroot()
    except ET.ParseError as e:
        # fall back to raw text
        try:
            with open(path, "rb") as f:
                raw = f.read().decode("utf-8", errors="replace")
            return raw, "raw (XML parse failed: %s)" % e, "parse error: %s" % e
        except Exception as e2:
            return "", "raw", "error: %s" % e2
    lines = []
    def walk(elem, depth=0):
        indent = "  " * depth
        tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
        attrs = " ".join("%s=%r" % (k.split("}")[-1], v) for k, v in elem.attrib.items())
        text = (elem.text or "").strip()
        if attrs or text:
            head = tag
            if attrs:
                head += " [" + attrs + "]"
            if text:
                head += ": " + text
            lines.append(indent + head)
        for child in elem:
            walk(child, depth + 1)
        tail = (elem.tail or "").strip()
        if tail:
            lines.append(indent + tail)
    walk(root)
    # also collect all text nodes in document order as a flat fallback
    flat = " ".join(t.strip() for t in root.itertext() if t.strip())
    if not lines:
        lines.append(flat)
    text = "\n".join(lines)
    if not text.strip():
        notes.append("no text nodes found")
    # count elements
    nelem = sum(1 for _ in root.iter())
    notes.append("%d element(s)" % nelem)
    return text, "xml.etree.ElementTree", "; ".join(notes)


def strip_html(s):
    # simple tag stripper
    s = re.sub(r"<script[^>]*>.*?</script>", " ", s, flags=re.S | re.I)
    s = re.sub(r"<style[^>]*>.*?</style>", " ", s, flags=re.S | re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def extract_eml(path):
    notes = []
    try:
        with open(path, "rb") as f:
            msg = BytesParser(policy=policy.default).parse(f)
    except Exception as e:
        return "", "email parser", "parse error: %s" % e
    out = []
    def header_block(m, indent=""):
        for key in ("From", "To", "Cc", "Bcc", "Subject", "Date", "Message-ID", "Content-Type"):
            v = m.get(key)
            if v is not None:
                out.append("%s%s: %s" % (indent, key, str(v).strip()))
    def walk(m, depth=0):
        indent = "  " * depth
        ctype = m.get_content_type()
        if m.is_multipart():
            out.append("%s[Multipart: %s]" % (indent, ctype))
            for part in m.get_payload():
                walk(part, depth + 1)
            return
        # leaf
        if ctype == "text/plain":
            try:
                payload = m.get_payload(decode=True)
                charset = m.get_content_charset() or "utf-8"
                text = payload.decode(charset, errors="replace")
            except Exception as e:
                text = ""
                notes.append("text/plain decode error: %s" % e)
            out.append("%s--- text/plain ---" % indent)
            out.append(text)
        elif ctype == "text/html":
            try:
                payload = m.get_payload(decode=True)
                charset = m.get_content_charset() or "utf-8"
                html_text = payload.decode(charset, errors="replace")
            except Exception as e:
                html_text = ""
                notes.append("text/html decode error: %s" % e)
            out.append("%s--- text/html (tags stripped) ---" % indent)
            out.append(strip_html(html_text))
        elif ctype == "message/rfc822":
            out.append("%s--- nested message/rfc822 ---" % indent)
            nested = m.get_payload()
            if isinstance(nested, list):
                nested = nested[0] if nested else None
            if nested is not None:
                header_block(nested, indent + "  ")
                walk(nested, depth + 1)
        else:
            fname = m.get_filename()
            out.append("%s[Attachment: %s | %s | %d bytes]" % (indent, fname or "(unnamed)", ctype, len(m.get_payload(decode=True) or b"")))
    out.append("=== HEADERS ===")
    header_block(msg)
    out.append("")
    out.append("=== BODY ===")
    walk(msg)
    text = "\n".join(out)
    # count parts
    parts = list(msg.walk())
    notes.append("%d MIME part(s)" % len(parts))
    return text, "email (stdlib)", "; ".join(notes)


def extract_p7s(path):
    # S/MIME signature: not document text. Try to surface signer + signing time.
    notes = ["S/MIME cryptographic signature (.p7s); not document text"]
    try:
        r = subprocess.run(["openssl", "smime", "-in", path, "-inform", "DER", "-pk7out"],
                           capture_output=True, text=True, timeout=60)
        if r.returncode == 0:
            # parse cert subjects
            r2 = subprocess.run(["openssl", "pkcs7", "-print_certs", "-noout"],
                                input=r.stdout, capture_output=True, text=True, timeout=60)
            if r2.stdout.strip():
                notes.append("certificates present:\n" + r2.stdout.strip()[:1500])
    except Exception as e:
        notes.append("openssl error: %s" % e)
    return "", "none (cryptographic signature)", "; ".join(notes)


def extract_one(att_id, filename, safe_filename, mime_type, local_path):
    ext = os.path.splitext(safe_filename or filename or "")[1].lower()
    mime = (mime_type or "").lower()
    if ext == ".pdf" or "pdf" in mime:
        text, method, notes = run_pdftotext(local_path)
    elif ext == ".xml" or "xml" in mime:
        text, method, notes = extract_xml(local_path)
    elif ext == ".eml" or "rfc822" in mime or "message" in mime:
        text, method, notes = extract_eml(local_path)
    elif ext == ".p7s":
        text, method, notes = extract_p7s(local_path)
    else:
        text, method, notes = "", "none", "unhandled format: ext=%s mime=%s" % (ext, mime)
    if len(text) > MAX_TEXT_CHARS:
        text = text[:MAX_TEXT_CHARS] + "\n...[TRUNCATED at %d chars]..." % MAX_TEXT_CHARS
    # normalise newlines
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text, method, notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", type=int, nargs="*", help="attachment ids to process")
    ap.add_argument("--force", action="store_true", help="re-extract even if output exists")
    args = ap.parse_args()

    os.makedirs(EXTRACTED_DIR, exist_ok=True)
    conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
    conn.row_factory = sqlite3.Row
    q = """SELECT a.id AS att_id, a.filename, a.safe_filename, a.mime_type, a.size_bytes,
                  a.local_path, a.gmail_attachment_id,
                  m.id AS message_id, m.gmail_message_id AS gmail_msg_id,
                  m.account_email, m.subject, m.received_at,
                  mc.genealogy_relevance
           FROM attachments a
           JOIN messages m ON m.id = a.message_id
           LEFT JOIN message_classification mc ON mc.message_id = a.message_id
           WHERE a.local_path IS NOT NULL AND a.local_path != ''
           ORDER BY a.id"""
    rows = conn.execute(q).fetchall()
    if args.only:
        want = set(args.only)
        rows = [r for r in rows if r["att_id"] in want]

    manifest = []
    for r in rows:
        att_id = r["att_id"]
        out_path = os.path.join(EXTRACTED_DIR, "%d.txt" % att_id)
        text, method, notes = extract_one(att_id, r["filename"], r["safe_filename"],
                                         r["mime_type"], r["local_path"])
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(text)
        # image-only flag for pdfs
        image_only = ("image-only" in (notes or "")) or ("scanned" in (notes or "").lower())
        record = {
            "att_id": att_id,
            "filename": r["filename"],
            "safe_filename": r["safe_filename"],
            "mime_type": r["mime_type"],
            "size_bytes": r["size_bytes"],
            "local_path": r["local_path"],
            "sha256": sha256_file(r["local_path"]),
            "message_id": r["message_id"],
            "gmail_message_id": r["gmail_msg_id"],
            "account_email": r["account_email"],
            "subject": r["subject"],
            "received_at": r["received_at"],
            "genealogy_relevance": r["genealogy_relevance"],
            "gmail_attachment_id": r["gmail_attachment_id"],
            "extracted_file": os.path.relpath(out_path, ROOT),
            "method": method,
            "notes": notes,
            "chars": len(text),
            "lines": text.count("\n"),
            "image_only": bool(image_only),
            "empty": len(text.strip()) == 0,
        }
        manifest.append(record)
        print("att %3d | %-42s | chars=%6d | %s" % (att_id, (r["safe_filename"] or "")[:42], len(text), method), flush=True)
        if notes:
            print("          notes: %s" % notes)

    manifest_path = os.path.join(EXTRACTED_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print()
    print("Manifest written:", manifest_path)
    print("Total processed:", len(manifest))

    # summary
    from collections import Counter
    by_method = Counter(m["method"].split(" ")[0] for m in manifest)
    print("By method:", dict(by_method))
    print("Empty:", sum(1 for m in manifest if m["empty"]))
    print("Image-only:", sum(1 for m in manifest if m["image_only"]))


if __name__ == "__main__":
    main()