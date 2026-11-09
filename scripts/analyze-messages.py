#!/usr/bin/env python3
"""M2 pilot: translate + analyse correspondence messages (chunked + evidence)."""
import argparse
import json
_applied_rule_ids = []
_applied_translation_rules = []
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from rules_loader import get_prompt_rules, format_rules_for_prompt, load_active_rules, apply_rules_to_text
except ImportError:
    def get_prompt_rules(stage=None): return {}
    def format_rules_for_prompt(rules, stage=None): return ""
    def load_active_rules(stage=None, mechanism=None): return {}
    def apply_rules_to_text(text, rules): return text, []
import os
import re
import sqlite3
import urllib.request
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
ANALYSIS_DIR = os.path.join(ROOT, "correspondence", "extracted", "analysis")
MODEL = "llama3.2:latest"
CHUNK_SIZE = 2000

SYSTEM = """You are a careful genealogical research assistant. You read Italian/English correspondence
between a genealogy researcher and Italian municipal offices. You must be precise and conservative.

Return ONLY a valid JSON object with these keys (no markdown, no commentary):
{
  "language": "Italian" | "English" | "mixed" | "other",
  "purpose_summary": "2-4 sentences in plain English",
  "people": [{"name": "...", "role": "...", "notes": "...", "evidence": "exact short quote"}],
  "dates": [{"value": "...", "context": "...", "evidence": "exact short quote"}],
  "places": [{"value": "...", "evidence": "exact short quote"}],
  "institutions": [{"value": "...", "evidence": "exact short quote"}],
  "protocol_refs": [{"value": "...", "evidence": "exact short quote"}],
  "record_refs": [{"value": "...", "evidence": "exact short quote"}],
  "actions_requested": [{"value": "...", "evidence": "exact short quote"}],
  "actions_promised": [{"value": "...", "evidence": "exact short quote"}],
  "outstanding_questions": [{"value": "...", "evidence": "exact short quote"}],
  "next_steps": [{"value": "...", "evidence": "exact short quote"}],
  "uncertainties": [{"issue": "...", "evidence": "exact short quote or none"}]
}

Rules:
- Every fact MUST include an "evidence" field with an exact short quote from the source text.
- Distinguish explicit information from inference; put inferences in "uncertainties".
- Do NOT infer parentage, identity or relationships from surnames or nearby names.
- Keep similarly named people separate unless the source explicitly establishes identity.
- Distinguish current-correspondence dates from historical dates in quoted material (note in "context").
- Do NOT invent people or details. If unsure, put in "uncertainties".
- If a field has nothing to report, use [].
- If extraction is incomplete or a section could not be parsed, record it in "uncertainties" with issue "extraction incomplete: <reason>".
- If all fact fields are empty AND purpose_summary is empty, record uncertainty "extraction failed: empty result".
"""


def split_chunks(text):
    if not text:
        return []
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    parts = re.split(r"(\n\s*\n)", text)
    paras = []
    i = 0
    n = len(parts)
    while i < n:
        p = parts[i]
        sep = parts[i + 1] if (i + 1 < n and re.match(r"\n\s*\n", parts[i + 1])) else ""
        paras.append((p, sep))
        i += 2 if sep else 1
    # Split oversized paragraphs into sentence-level blocks.
    flat = []
    for p, sep in paras:
        if len(p) <= CHUNK_SIZE:
            flat.append((p, sep))
        else:
            sents = re.split(r"(?<=[.!?])\s+", p)
            buf_s = ""
            for s in sents:
                if buf_s and len(buf_s) + len(s) + 1 > CHUNK_SIZE:
                    flat.append((buf_s, " "))
                    buf_s = s
                else:
                    buf_s = (buf_s + " " + s).strip() if buf_s else s
            if buf_s:
                flat.append((buf_s, sep))
    paras = flat
    chunks = []
    buf = ""
    buf_start = 0
    pos = 0
    for p, sep in paras:
        block = p + sep
        if buf and len(buf) + len(block) > CHUNK_SIZE:
            chunks.append((buf_start, buf))
            buf = block
            buf_start = pos
        else:
            if not buf:
                buf_start = pos
            buf += block
        pos += len(block)
    if buf:
        chunks.append((buf_start, buf))
    if chunks and chunks[-1][0] + len(chunks[-1][1]) < len(text):
        chunks.append((chunks[-1][0] + len(chunks[-1][1]), text[chunks[-1][0] + len(chunks[-1][1]):]))
    elif not chunks and text:
        chunks.append((0, text))
    out = []
    for i, (st, t) in enumerate(chunks):
        out.append({"seq": i, "start": st, "end": st + len(t), "chars": len(t), "text": t})
    return out

def ollama_translate_chunk(chunk_text):
    system = ("You are a professional translator. Translate the following email excerpt from Italian "
              "(or any other language) into English. Preserve names, dates, act numbers, protocol "
              "numbers, offices, and official terminology exactly. Translate EVERY sentence. "
              "Return ONLY the English translation, no commentary, no markdown, no summarising.")
    global _applied_translation_rules
    try:
        _trules = get_prompt_rules(stage="translation")
        _trule_text = format_rules_for_prompt(_trules, stage="translation")
        _applied_translation_rules = list(_trules.keys())
        if _trule_text:
            system += "\n" + _trule_text
    except Exception:
        _trule_text = ""
        _applied_translation_rules = []
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": chunk_text},
        ],
        "stream": False,
        "options": {"temperature": 0.1},
    }
    req = urllib.request.Request(
        "http://127.0.0.1:11434/api/chat",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as r:
        resp = json.load(r)
    return (resp.get("message", {}).get("content", "") or "").strip()


def ollama_translate_full(body):
    chunks = split_chunks(body)
    if not chunks:
        return "", [], True, 0
    manifest = []
    parts = []
    all_ok = True
    for c in chunks:
        try:
            tr = ollama_translate_chunk(c["text"])
            ok = bool(tr.strip())
            if not ok:
                all_ok = False
            manifest.append({"seq": c["seq"], "start": c["start"], "end": c["end"],
                             "source_chars": c["chars"], "translated_chars": len(tr),
                             "status": "ok" if ok else "empty"})
            parts.append(tr)
        except Exception as e:
            all_ok = False
            manifest.append({"seq": c["seq"], "start": c["start"], "end": c["end"],
                             "source_chars": c["chars"], "translated_chars": 0,
                             "status": "error", "error": str(e)})
            parts.append(f"[TRANSLATION FAILED FOR CHUNK {c['seq']}: {e}]")
    full = "\n\n".join(parts)
    # Deterministic safety net: apply active translation rules as text replacements
    try:
        _all_trules = load_active_rules(stage="translation")
        full, _ = apply_rules_to_text(full, _all_trules)
    except Exception:
        pass
    reconstructed = "\n\n".join(c["text"] for c in chunks)
    norm_body = re.sub(r"\s+", " ", body).strip()
    norm_recon = re.sub(r"\s+", " ", reconstructed).strip()
    covered = len(body)
    if norm_recon != norm_body:
        all_ok = False
        manifest.append({"note": f"coverage mismatch: {len(norm_recon)} != {len(norm_body)}"})
    else:
        manifest.append({"note": f"coverage OK: {len(chunks)} chunks"})
    return full, manifest, all_ok, covered


def ollama_analyse(subject, body, from_name, from_email, to_json, received_at, sent_at, translation):
    global _applied_rule_ids
    global _applied_rule_ids
    # Load active rules for analysis stage
    try:
        _arules = get_prompt_rules(stage="analysis")
        _arule_text = format_rules_for_prompt(_arules, stage="analysis")
        _applied_rule_ids = list(_arules.keys())
    except Exception:
        _arule_text = ""
        _applied_rule_ids = []
    user = f"""Subject: {subject}
From: {from_name} <{from_email}>
To: {to_json}
Date: {received_at or sent_at}

English translation:
{translation[:6000]}

Return a JSON object with purpose_summary, people, dates, places, institutions, protocol_refs, record_refs, actions_requested, actions_promised, outstanding_questions, next_steps, uncertainties. Every fact must include an evidence quote. Be concise.""" + (_arule_text if _arule_text else "")
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": user},
        ],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.1},
    }
    import time
    last_err = None
    for attempt in range(2):
        try:
            req = urllib.request.Request(
                "http://127.0.0.1:11434/api/chat",
                data=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=300) as r:
                resp = json.load(r)
            content = resp.get("message", {}).get("content", "")
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                m = re.search(r"\{.*\}", content, re.S)
                if m:
                    data = json.loads(m.group(0))
                else:
                    raise
            fact_keys = ["people", "dates", "places", "institutions", "protocol_refs", "record_refs",
                         "actions_requested", "actions_promised", "outstanding_questions", "next_steps"]
            if all(not data.get(k) for k in fact_keys) and not data.get("purpose_summary"):
                data.setdefault("uncertainties", []).append(
                    {"issue": "extraction incomplete: all fact fields empty", "evidence": "none"})
            # validate evidence presence
            for k in fact_keys:
                for item in (data.get(k) or []):
                    if isinstance(item, dict) and "evidence" not in item:
                        item["evidence"] = "MISSING"
                        data.setdefault("uncertainties", []).append(
                            {"issue": f"missing evidence quote in {k}", "evidence": str(item)[:80]})
            data["_model"] = MODEL
            data["_truncated"] = len(body) > 6000
            return data
        except Exception as e:
            last_err = e
            time.sleep(2)
    return {
        "purpose_summary": "(analysis failed: %s)" % last_err,
        "people": [], "dates": [], "places": [], "institutions": [],
        "protocol_refs": [], "record_refs": [], "actions_requested": [],
        "actions_promised": [], "outstanding_questions": [], "next_steps": [],
        "uncertainties": [{"issue": "analysis call failed: %s" % last_err, "evidence": "none"}],
        "_model": MODEL, "_error": str(last_err),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", type=int, nargs="+")
    ap.add_argument("--unanalysed", action="store_true", help="Analyse all genealogy-relevant messages without analysis files")
    ap.add_argument("--limit", type=int, default=10, help="Max messages to analyse per run (default 10)")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    if not args.ids and not args.unanalysed:
        ap.error("Either --ids or --unanalysed is required")

    os.makedirs(ANALYSIS_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Ensure ai_jobs table exists (it should already)
    # Recover stale running jobs (lock expired)
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    stale = conn.execute(
        "SELECT id, job_key FROM ai_jobs WHERE status='running' AND lock_expires_at IS NOT NULL AND lock_expires_at < ?",
        (now_iso,)
    ).fetchall()
    for sj in stale:
        conn.execute(
            "UPDATE ai_jobs SET status='pending', locked_at=NULL, lock_expires_at=NULL, last_error='Stale job recovered' WHERE id=?",
            (sj["id"],)
        )
        print(f"  Recovered stale job: {sj['job_key']}")
    if stale:
        conn.commit()

    if args.unanalysed:
        # Find genealogy-relevant messages without analysis files
        rows = conn.execute("""SELECT m.id FROM messages m
            JOIN message_classification mc ON mc.message_id = m.id
            WHERE mc.genealogy_relevance IN ('definite','possible')
            AND NOT EXISTS (SELECT 1 FROM message_analysis ma WHERE ma.message_id = m.id)
            ORDER BY m.id LIMIT ?""", (args.limit,)).fetchall()
        ids = [r["id"] for r in rows]
        if not ids:
            print("No unanalysed genealogy-relevant messages found.")
            conn.close()
            return
        print(f"Found {len(ids)} unanalysed messages: {ids}")
        args.ids = ids
    else:
        if not args.ids:
            print("No message IDs provided.")
            conn.close()
            return

    failed_mids = set()
    for mid in args.ids:
        # Create or update ai_jobs entry
        job_key = f"analyse_msg_{mid}"
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        existing_job = conn.execute("SELECT id, status, attempts, max_attempts FROM ai_jobs WHERE job_key=?", (job_key,)).fetchone()
        if existing_job:
            if existing_job["status"] == "done":
                print(f"msg {mid}: already done (ai_jobs). skipping.")
                continue
            if existing_job["attempts"] >= existing_job["max_attempts"]:
                print(f"msg {mid}: max attempts ({existing_job['max_attempts']}) reached. skipping.")
                continue
            conn.execute(
                "UPDATE ai_jobs SET status='running', attempts=attempts+1, locked_at=?, lock_expires_at=?, updated_at=? WHERE id=?",
                (now, (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)).isoformat(), now, existing_job["id"])
            )
        else:
            conn.execute(
                "INSERT INTO ai_jobs (job_key, entity_type, entity_id, message_id, step, status, attempts, max_attempts, locked_at, lock_expires_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (job_key, "message", mid, mid, "translate", "running", 1, 3, now,
                 (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)).isoformat(),
                 now, now)
            )
        conn.commit()
        out_path = os.path.join(ANALYSIS_DIR, f"message_{mid}.json")
        if os.path.exists(out_path) and not args.force:
            print(f"msg {mid}: already analysed (use --force). skipping.")
            continue
        row = conn.execute("""SELECT id, account_email, gmail_message_id, gmail_thread_id, direction,
            from_name, from_email, to_json, cc_json, subject, received_at, sent_at, body_text
            FROM messages WHERE id=?""", (mid,)).fetchone()
        if not row:
            print(f"msg {mid}: not found")
            failed_mids.add(mid)
            job_key = f"analyse_msg_{mid}"
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            conn.execute("UPDATE ai_jobs SET status='failed', last_error='Message not found', updated_at=? WHERE job_key=?", (now, job_key))
            conn.commit()
            continue
        body = row["body_text"] or ""
        print(f"\n=== msg {mid}: {row['subject'][:70]} (body {len(body)} chars) ===", flush=True)

        print("  translating (chunked)...", flush=True)
        translation, chunk_manifest, trans_ok, covered = ollama_translate_full(body)
        print(f"  chunks={len(chunk_manifest)} covered={covered}/{len(body)} ok={trans_ok} trans_chars={len(translation)}", flush=True)

        print("  analysing...", flush=True)
        try:
            data = ollama_analyse(row["subject"] or "", body, row["from_name"] or "", row["from_email"] or "",
                                  row["to_json"] or "[]", row["received_at"], row["sent_at"], translation)
        except Exception as e:
            print(f"  ANALYSIS FAILED: {e}")
            failed_mids.add(mid)
            job_key = f"analyse_msg_{mid}"
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            conn.execute("UPDATE ai_jobs SET status='failed', last_error=?, updated_at=? WHERE job_key=?", (str(e), now, job_key))
            conn.commit()
            continue

        data["message_id"] = mid
        data["gmail_message_id"] = row["gmail_message_id"]
        data["account_email"] = row["account_email"]
        data["language"] = data.get("language") or "unknown"
        data["translation_en"] = translation
        data["translation_chunks"] = chunk_manifest
        data["translation_complete"] = trans_ok
        data["translation_coverage"] = f"{covered}/{len(body)}"
        data["analysed_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        data["rules_applied"] = list(set(_applied_rule_ids + getattr(sys.modules[__name__], '_applied_translation_rules', [])))
        data["rule_versions"] = {}
        for rid in data["rules_applied"]:
            # Check both stages
            for stage in ["analysis", "translation"]:
                r = get_prompt_rules(stage=stage).get(rid, {})
                if r:
                    data["rule_versions"][rid] = r.get("version", 1)
                    break
            if rid not in data["rule_versions"]:
                data["rule_versions"][rid] = 1
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        conn.execute("""INSERT INTO message_analysis
            (message_id, analysis_version, language, translation_en, summary_en, sender_intent,
             model_translation, model_summary, analysed_at)
            VALUES (?,?,?,?,?,?,?,?,?)
            ON CONFLICT(message_id, analysis_version) DO UPDATE SET
              language=excluded.language, translation_en=excluded.translation_en,
              summary_en=excluded.summary_en, sender_intent=excluded.sender_intent,
              model_translation=excluded.model_translation, model_summary=excluded.model_summary,
              analysed_at=excluded.analysed_at""",
            (mid, 1, data.get("language"), translation, data.get("purpose_summary"),
             "; ".join(x.get("value", "") for x in (data.get("actions_requested") or []) + (data.get("outstanding_questions") or [])),
             MODEL, MODEL, data["analysed_at"]))
        conn.commit()
        print(f"  purpose: {(data.get('purpose_summary') or '')[:180]}")
        print(f"  people: {data.get('people')}")
        print(f"  protocol: {data.get('protocol_refs')}")
        print(f"  records: {data.get('record_refs')}")
        print(f"  actions: {data.get('actions_requested')}")
        print(f"  outstanding: {data.get('outstanding_questions')}")
        print(f"  uncertainties: {data.get('uncertainties')}")
        print(f"  saved: {out_path}")
    # Mark jobs as done (except failed ones)
    for mid in args.ids:
        if mid in failed_mids:
            continue
        job_key = f"analyse_msg_{mid}"
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        conn.execute(
            "UPDATE ai_jobs SET status='done', locked_at=NULL, lock_expires_at=NULL, last_error=NULL, updated_at=? WHERE job_key=?",
            (now, job_key)
        )
    conn.commit()
    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()