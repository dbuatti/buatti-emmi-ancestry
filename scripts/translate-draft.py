#!/usr/bin/env python3
"""Translate a correspondence draft's text to English using the existing Ollama infrastructure.

Usage: python3 scripts/translate-draft.py <draft_path>

Reads the draft JSON, translates draft_text (and subject_suggestion if present)
from Italian to English using Ollama (same model as analyze-messages.py),
and writes translation_en / subject_translation_en / translation_status back
to the draft JSON. Caches results (skips if already translated).

No external services. No Gmail. No sends.
"""
import argparse
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from rules_loader import get_prompt_rules, format_rules_for_prompt, load_active_rules, apply_rules_to_text
except ImportError:
    def get_prompt_rules(stage=None): return {}
    def format_rules_for_prompt(rules, stage=None): return ""
    def load_active_rules(stage=None, mechanism=None): return {}
    def apply_rules_to_text(text, rules): return text, []

_applied_translation_rules = []
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = "llama3.2:latest"
OLLAMA_URL = "http://127.0.0.1:11434/api/chat"


def translate_chunk(chunk_text):
    global _applied_translation_rules
    system = ("You are a professional translator. Translate the following email excerpt from Italian "
              "(or any other language) into English. Preserve names, dates, act numbers, protocol "
              "numbers, offices, and official terminology exactly. Translate EVERY sentence. "
              "Return ONLY the English translation, no commentary, no markdown, no summarising.")
    try:
        _trules = get_prompt_rules(stage="translation")
        _trule_text = format_rules_for_prompt(_trules, stage="translation")
        _applied_translation_rules = list(_trules.keys())
        if _trule_text:
            system += "\n" + _trule_text
    except Exception:
        _trule_text = ""
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": chunk_text},
        ],
        "stream": False,
        "options": {"temperature": 0.1},
    }
    req = urllib.request.Request(OLLAMA_URL, data=__import__("json").dumps(payload).encode(),
                                headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        resp = json.load(r)
    return (resp.get("message", {}).get("content", "") or "").strip()


def split_chunks(text, max_chars=3000):
    if len(text) <= max_chars:
        return [text]
    chunks = []
    current = ""
    for para in text.split("\n\n"):
        if len(current) + len(para) + 2 > max_chars and current:
            chunks.append(current.strip())
            current = para
        else:
            current = (current + "\n\n" + para).strip() if current else para
    if current:
        chunks.append(current.strip())
    return chunks


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("draft_path")
    ap.add_argument("--force", action="store_true", help="Re-translate even if cached")
    args = ap.parse_args()

    if not os.path.exists(args.draft_path):
        print("ERROR: file not found", file=sys.stderr)
        return 2

    with open(args.draft_path, "r", encoding="utf-8") as f:
        draft = json.load(f)

    # Skip if already translated (unless --force)
    if not args.force and draft.get("translation_status") == "translated" and draft.get("draft_text_en"):
        print("Already translated. Use --force to re-translate.")
        return 0

    text = draft.get("draft_text", "")
    if not text:
        print("ERROR: no draft_text", file=sys.stderr)
        return 2

    try:
        chunks = split_chunks(text)
        translated = []
        for chunk in chunks:
            translated.append(translate_chunk(chunk))
        full_translation = "\n\n".join(translated)

        # Deterministic safety net: apply active translation rules as text replacements
        try:
            _all_trules = load_active_rules(stage="translation")
            full_translation, _applied_det = apply_rules_to_text(full_translation, _all_trules)
        except Exception:
            _applied_det = []

        draft["draft_text_en"] = full_translation
        draft["translation_status"] = "translated"
        draft["translation_model"] = MODEL
        draft["translation_completed_at"] = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
        draft["translation_rules_applied"] = list(dict.fromkeys((_applied_translation_rules or []) + (_applied_det or [])))

        # Translate subject if present (fall back to thread title)
        subject = draft.get("subject_suggestion")
        if not subject:
            tid = (draft.get("thread_id") or "").replace("_new", "")
            try:
                threads = json.load(open(os.path.join(ROOT, "correspondence", "extracted", "threads.json"))).get("threads", {})
                thread = threads.get(tid, {})
                subject = thread.get("title") or thread.get("subject")
            except Exception:
                pass
        if subject:
            subj_translation = translate_chunk(subject)
            try:
                _all_trules = load_active_rules(stage="translation")
                subj_translation, _ = apply_rules_to_text(subj_translation, _all_trules)
            except Exception:
                pass
            draft["subject_translation_en"] = subj_translation

        with open(args.draft_path, "w", encoding="utf-8") as f:
            json.dump(draft, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print("Translated: %d chars -> %d chars" % (len(text), len(full_translation)))
        return 0
    except Exception as e:
        draft["translation_status"] = "failed"
        draft["translation_error"] = str(e)
        with open(args.draft_path, "w", encoding="utf-8") as f:
            json.dump(draft, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print("ERROR: %s" % e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
