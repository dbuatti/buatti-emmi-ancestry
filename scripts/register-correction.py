#!/usr/bin/env python3
"""Register a human correction in the unified correction log.

Usage:
  python scripts/register-correction.py --message 55 --field translation_en \\
    --original "My great-aunt:" --corrected "My great-grandmother:" \\
    --type translation --scope generalizable --source manual \\
    --notes "bisnonna = great-grandmother"

  python scripts/register-correction.py --thread 1a1a9ab9b9303081 --field classification \\
    --original "reply_required" --corrected "action_required" \\
    --type action_detection --scope generalizable --source opencode

Types: translation, entity_extraction, relationship, chronology, evidence, action_detection, drafting, classification, other
Scopes: case_specific, generalizable
Sources: app_ui, opencode, script, manual
"""
import argparse, json, os, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORRECTIONS_PATH = os.path.join(ROOT, "correspondence", "extracted", "corrections.json")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from safe_write import safe_write_json, read_with_version

VALID_TYPES = ["translation", "entity_extraction", "relationship", "chronology", "evidence",
               "action_detection", "drafting", "classification", "other"]
VALID_SCOPES = ["case_specific", "generalizable"]
VALID_SOURCES = ["app_ui", "opencode", "script", "manual"]

def infer_type(field):
    """Infer correction type from field name."""
    f = field.lower()
    if "translation" in f: return "translation"
    if "people" in f or "person" in f: return "entity_extraction"
    if "date" in f: return "chronology"
    if "classification" in f: return "classification"
    if "draft" in f: return "drafting"
    if "evidence" in f: return "evidence"
    return "other"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--message", type=int, help="Message ID")
    ap.add_argument("--thread", type=str, help="Thread ID (gmail_thread_id)")
    ap.add_argument("--field", required=True, help="Field corrected (e.g. translation_en, classification)")
    ap.add_argument("--original", required=True, help="Original AI value")
    ap.add_argument("--corrected", required=True, help="Corrected value")
    ap.add_argument("--type", choices=VALID_TYPES, help="Correction type (inferred if not provided)")
    ap.add_argument("--scope", choices=VALID_SCOPES, default="case_specific", help="Scope (default: case_specific)")
    ap.add_argument("--source", choices=VALID_SOURCES, default="manual", help="Source (default: manual)")
    ap.add_argument("--evidence", type=str, default="", help="Supporting evidence quote")
    ap.add_argument("--notes", type=str, default="", help="Notes")
    ap.add_argument("--model-version", type=str, default="llama3.2:latest", help="Model version")
    ap.add_argument("--prompt-version", type=str, default="", help="Prompt version")
    ap.add_argument("--human-confirmed", action="store_true", default=True, help="Human confirmed (default: true)")
    ap.add_argument("--opencode-proposed", action="store_true", help="OpenCode proposed (human_confirmed=false)")
    args = ap.parse_args()

    if args.opencode_proposed:
        args.human_confirmed = False

    # Infer correction type if not provided
    corr_type = args.type or infer_type(args.field)

    # Load existing corrections
    if os.path.exists(CORRECTIONS_PATH):
        data = json.load(open(CORRECTIONS_PATH))
    else:
        data = {"version": 1, "corrections": {}, "generated_at": None}

    corrections = data.get("corrections", {})

    # Generate ID
    corr_id = f"corr_{len(corrections) + 1:04d}"

    entry = {
        "id": corr_id,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "source": args.source,
        "source_detail": f"register-correction.py (CLI)",
        "message_id": args.message,
        "thread_id": args.thread,
        "field": args.field,
        "stage": corr_type,
        "original": args.original,
        "corrected": args.corrected,
        "evidence": args.evidence,
        "correction_type": corr_type,
        "scope": args.scope,
        "model_version": args.model_version,
        "prompt_version": args.prompt_version or None,
        "human_confirmed": args.human_confirmed,
        "rule_proposed": None,
        "rule_approved": None,
        "notes": args.notes,
    }

    corrections[corr_id] = entry
    data["corrections"] = corrections
    data["generated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Write using safe_write
    _, v = read_with_version(CORRECTIONS_PATH) if os.path.exists(CORRECTIONS_PATH) else (None, None)
    safe_write_json(CORRECTIONS_PATH, data, args.source, v, [args.field], f"Correction registered: {corr_type}")

    print(json.dumps({"ok": True, "correction_id": corr_id, "entry": entry}, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
