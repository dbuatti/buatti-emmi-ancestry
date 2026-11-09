#!/usr/bin/env python3
"""Phase 4B - local OCR for scanned (image-only) correspondence attachments.

Uses Tesseract (free, local) with Italian + English. Picks best rotation per
page by Italian-keyword scoring. Renders pages with Poppler at 300 DPI.

Outputs:
  correspondence/extracted/<att_id>.txt          (OCR text)
  correspondence/extracted/ocr_pages/<att_id>/   (rendered page PNGs, for review)
  updates correspondence/extracted/manifest.json (ocr_* fields)

No originals modified. No network. No schema change.
"""
import argparse
import json
import os
import re
import sqlite3
import subprocess
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
EXTRACTED_DIR = os.path.join(ROOT, "correspondence", "extracted")
OCR_PAGES_DIR = os.path.join(EXTRACTED_DIR, "ocr_pages")

ITALIAN_KEYWORDS = [
    "di", "del", "della", "delle", "dei", "il", "la", "le", "lo", "i", "gli",
    "che", "e", "a", "da", "in", "con", "su", "per", "tra", "fra", "non",
    "nato", "nata", "morto", "morta", "stato", "civile", "comune", "casa",
    "comunale", "ore", "giorno", "mese", "anno", "attestazione", "nascita",
    "morte", "figlio", "figlia", "coniuge", "residente", "registro", "volume",
    "pagina", "ufficiale", "certificato", "estratto", "atto", "genitori",
    "padre", "madre", "sposo", "sposa", "vedovo", "vedova", "pensionato",
    "professione", "domicilio", "cittadinanza", "italiana", "ufficio",
]

LANGS = "ita+eng"


def score_text(text):
    toks = re.findall(r"[A-Za-zÀ-ÿ']+", text.lower())
    kw = sum(toks.count(k) for k in ITALIAN_KEYWORDS)
    letters = sum(c.isalpha() for c in text)
    return kw * 8 + letters // 4, kw, letters


# Only words long enough to be real Italian prose.  Short tokens ("di", "e",
# "il") are produced in bulk by garbled table grids and make the loose score
# prefer a wrongly-rotated page.
LONG_KEYWORDS = {k for k in ITALIAN_KEYWORDS if len(k) >= 4}


def score_text_strict(text):
    toks = re.findall(r"[A-Za-zÀ-ÿ']+", text.lower())
    hits = [t for t in toks if t in LONG_KEYWORDS]
    distinct = len(set(hits))
    return distinct * 20 + len(hits) * 4 + min(len(toks), 4000) // 50


def render_pages(pdf_path, out_dir, dpi=300):
    os.makedirs(out_dir, exist_ok=True)
    for f in os.listdir(out_dir):
        if f.lower().endswith(".png"):
            os.remove(os.path.join(out_dir, f))
    subprocess.run(
        ["pdftoppm", "-r", str(dpi), "-png", pdf_path, os.path.join(out_dir, "page")],
        check=True, capture_output=True,
    )
    pages = sorted(f for f in os.listdir(out_dir) if f.lower().endswith(".png"))
    return [os.path.join(out_dir, f) for f in pages]


def ocr_page(img_path, rank="score"):
    im = Image.open(img_path)
    # Pass 1: pick best rotation using psm 6
    best_rot = 0
    best_rot_score = None
    for rot in (0, 90, 180, 270):
        rim = im.rotate(rot, expand=True) if rot else im
        tmp = img_path + ".rot.png"
        rim.save(tmp)
        try:
            txt = subprocess.run(
                ["tesseract", tmp, "stdout", "-l", LANGS, "--psm", "6"],
                capture_output=True, text=True, timeout=300,
            ).stdout
        except Exception:
            txt = ""
        sc, kw, letters = score_text(txt)
        if rank == "strict":
            rk = (score_text_strict(txt),)
        elif rank == "keywords":
            rk = (kw, letters)
        else:
            rk = (sc,)
        if best_rot_score is None or rk > best_rot_score:
            best_rot_score = rk
            best_rot = rot
        try:
            os.remove(tmp)
        except OSError:
            pass
    # Pass 2: refine psm on best rotation
    rim = im.rotate(best_rot, expand=True) if best_rot else im
    tmp = img_path + ".rot.png"
    rim.save(tmp)
    best = None
    for psm in (4, 6, 11):
        try:
            txt = subprocess.run(
                ["tesseract", tmp, "stdout", "-l", LANGS, "--psm", str(psm)],
                capture_output=True, text=True, timeout=300,
            ).stdout
        except Exception:
            continue
        conf = None
        try:
            tsv = subprocess.run(
                ["tesseract", tmp, "stdout", "-l", LANGS, "--psm", str(psm), "tsv"],
                capture_output=True, text=True, timeout=300,
            ).stdout
            confs = []
            for line in tsv.splitlines()[1:]:
                cols = line.split("\t")
                if len(cols) >= 12 and cols[11].strip():
                    try:
                        c = float(cols[10])
                    except ValueError:
                        c = -1.0
                    if c > 0:
                        confs.append(c)
            if confs:
                conf = round(sum(confs) / len(confs), 1)
        except Exception:
            pass
        sc, kw, letters = score_text(txt)
        if rank == "strict":
            rk = (score_text_strict(txt),)
        elif rank == "keywords":
            rk = (kw, letters)
        else:
            rk = (sc,)
        best_rk = None
        if best is not None:
            if rank == "strict":
                best_rk = (score_text_strict(best[3]),)
            elif rank == "keywords":
                best_rk = (best[5], best[6])
            else:
                best_rk = (best[0],)
        if best is None or rk > best_rk:
            best = (sc, best_rot, psm, txt, conf, kw, letters)
    try:
        os.remove(tmp)
    except OSError:
        pass
    if best is None:
        return "", 0, 0, None, "no OCR result"
    sc, rot, psm, txt, conf, kw, letters = best
    note = "rotation=%d psm=%d score=%d kw=%d letters=%d conf=%s" % (rot, psm, sc, kw, letters, conf)
    return txt, rot, psm, conf, note


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", type=int, nargs="*", help="attachment ids to OCR")
    ap.add_argument("--dpi", type=int, default=300)
    args = ap.parse_args()

    manifest_path = os.path.join(EXTRACTED_DIR, "manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    by_id = {r["att_id"]: r for r in manifest}

    if args.ids:
        targets = args.ids
    else:
        targets = [r["att_id"] for r in manifest if r.get("image_only")]

    conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
    conn.row_factory = sqlite3.Row

    for aid in targets:
        rec = by_id.get(aid)
        if not rec:
            print("att %d: not in manifest, skip" % aid)
            continue
        r2 = conn.execute("SELECT local_path, safe_filename, size_bytes FROM attachments WHERE id=?", (aid,)).fetchone()
        pdf_path = r2["local_path"]
        print("=" * 70)
        print("att %d: %s (%d bytes)" % (aid, r2["safe_filename"], r2["size_bytes"]))
        print("source sha256:", rec.get("sha256"))

        page_dir = os.path.join(OCR_PAGES_DIR, str(aid))
        pages = render_pages(pdf_path, page_dir, dpi=args.dpi)
        print("rendered %d page(s) at %d dpi" % (len(pages), args.dpi))

        page_texts = []
        page_notes = []
        page_confs = []
        page_rots = []
        for i, pg in enumerate(pages, start=1):
            txt, rot, psm, conf, note = ocr_page(pg)
            txt = txt.replace("\r\n", "\n").replace("\r", "\n")
            page_texts.append("===== PAGE %d =====\n%s" % (i, txt.strip()))
            page_notes.append("page %d: %s" % (i, note))
            page_confs.append(conf)
            page_rots.append(rot)
            print("  page %d: rot=%d conf=%s chars=%d" % (i, rot, conf, len(txt.strip())))

        full = "\n\n".join(page_texts) + "\n"
        out_path = os.path.join(EXTRACTED_DIR, "%d.txt" % aid)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(full)

        rec["method"] = "tesseract 5.5.4 (ita+eng, OSD rotation brute-force)"
        rec["ocr_engine"] = "tesseract 5.5.4"
        rec["ocr_languages"] = "ita+eng"
        rec["ocr_dpi"] = args.dpi
        rec["ocr_pages"] = len(pages)
        rec["ocr_rotations"] = page_rots
        rec["ocr_confidences"] = page_confs
        rec["ocr_chars"] = len(full.strip())
        rec["ocr_notes"] = "; ".join(page_notes)
        rec["image_only"] = False
        rec["empty"] = len(full.strip()) == 0
        rec["chars"] = len(full)
        rec["lines"] = full.count("\n")
        rec["ocr_page_images"] = os.path.relpath(page_dir, ROOT)
        print("  total OCR chars: %d" % len(full.strip()))
        for n in page_notes:
            print("  " + n)

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print()
    print("Manifest updated:", manifest_path)
    conn.close()


if __name__ == "__main__":
    main()