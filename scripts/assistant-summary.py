#!/usr/bin/env python3
"""Build aggregated summary for the Research Assistant UI.

Reads:
  - .local/correspondence.db       (messages, classifications, threads)
  - correspondence/extracted/threads.json  (per-thread people/places/institutions)
  - correspondence/extracted/actions.json  (classification per thread)
  - src/data/event-requests.json  (30-day chase clock)
  - src/data/tree-overrides.json  (added people/leads/questions)
  - .local/gmail_auth_compose.json (which accounts can compose drafts)

Outputs JSON to stdout for /api/assistant/summary endpoint.
"""
import json, os, sqlite3, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / ".local" / "correspondence.db"
THREADS_PATH = ROOT / "correspondence" / "extracted" / "threads.json"
ACTIONS_PATH = ROOT / "correspondence" / "extracted" / "actions.json"
EVENT_REQ = ROOT / "src" / "data" / "event-requests.json"
COMPOSE_AUTH = ROOT / ".local" / "gmail_auth_compose.json"


def load_compose_accounts():
    """Return set of account emails with compose scope."""
    if not COMPOSE_AUTH.exists():
        return set()
    try:
        d = json.load(open(COMPOSE_AUTH))
        result = set()
        for email, a in d.items():
            scopes = a.get("scopes", [])
            if any("gmail.compose" in s for s in scopes):
                result.add(email)
        return result
    except Exception:
        return set()


def main():
    compose_accounts = load_compose_accounts()

    threads_data = {}
    if THREADS_PATH.exists():
        td = json.load(open(THREADS_PATH))
        threads_data = td.get("threads", {})

    actions = {}
    if ACTIONS_PATH.exists():
        ad = json.load(open(ACTIONS_PATH))
        actions = ad.get("actions", {})

    event_req = {}
    if EVENT_REQ.exists():
        er = json.load(open(EVENT_REQ))
        event_req = er.get("events", {})

    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row

    rows = conn.execute("""
        SELECT t.id AS thread_db_id, t.account_email, t.gmail_thread_id,
               t.subject, t.status, t.last_message_at, t.last_inbound_at,
               t.last_outbound_at, t.has_unanswered_inbound,
               m.received_at, m.sent_at, m.snippet, m.direction,
               mc.message_type, mc.action_status, mc.genealogy_relevance
        FROM threads t
        JOIN messages m ON m.thread_id = t.id AND m.account_email = t.account_email
        JOIN message_classification mc ON mc.message_id = m.id
        WHERE mc.genealogy_relevance IN ('definite', 'possible')
        ORDER BY t.last_message_at DESC NULLS LAST, t.id
    """).fetchall()

    today = datetime.date.today()
    pending_actions = []
    chase_due = []
    no_action_needed = []
    all_genthreads = []

    # Group by thread: one entry per thread, snippet from the LATEST INBOUND message
    # (the old code took an arbitrary message row, which was often Daniele's own
    # outbound message — mislabeled as "latest inbound").
    latest_inbound = {}   # (account, gtid) -> (ts, snippet)
    seen_threads = {}     # (account, gtid) -> first row for that thread
    for r in rows:
        key = (r["account_email"], r["gmail_thread_id"])
        if key not in seen_threads:
            seen_threads[key] = r
        if r["direction"] == "in":
            ts = r["received_at"] or ""
            prev = latest_inbound.get(key)
            if prev is None or ts > prev[0]:
                latest_inbound[key] = (ts, r["snippet"] or "")

    for r in seen_threads.values():
        gtid = r["gmail_thread_id"]
        tid = str(r["thread_db_id"])
        inst_info = threads_data.get(gtid, {})
        act = actions.get(gtid, {})
        classification = act.get("classification", "")

        person_names = inst_info.get("person_names", [])[:2]
        institution = inst_info.get("institution", "")
        protocol_refs = inst_info.get("record_refs", [])[:2] or inst_info.get("protocol_refs", [])[:2]
        snippet = (latest_inbound.get((r["account_email"], gtid), ("", ""))[1] or "")[:100]
        days_waiting = None
        last_activity = r["last_message_at"] or r["last_outbound_at"]
        if last_activity:
            try:
                da = datetime.datetime.strptime(str(last_activity)[:10], "%Y-%m-%d").date()
                days_waiting = (today - da).days
            except Exception:
                days_waiting = None
        compose_avail = r["account_email"] in compose_accounts

        entry = {
            "thread_id": tid,
            "gmail_thread_id": gtid,
            "account_email": r["account_email"],
            "compose_available": compose_avail,
            "institution": institution,
            "people": person_names,
            "protocol_refs": protocol_refs,
            "classification": classification,
            "days_waiting": days_waiting,
            "latest_inbound_snippet": snippet,
            "status": r["status"],
            "has_unanswered_inbound": r["has_unanswered_inbound"],
        }

        if classification in ("reply_required", "action_required", "awaiting_response",
                               "follow_up_due"):
            pending_actions.append(entry)
        elif classification == "no_action_needed":
            no_action_needed.append(entry)
        elif classification in ("resolved", "documents_received"):
            continue

        if days_waiting is not None and days_waiting > 30:
            for evt_key, evt_val in event_req.items():
                if evt_val.get("requestedOn") and not evt_val.get("receivedOn"):
                    try:
                        req_date = datetime.datetime.strptime(evt_val["requestedOn"], "%Y-%m-%d").date()
                        if (today - req_date).days > 30:
                            chase_due.append(entry)
                            break
                    except Exception:
                        pass

        # Build genealogy thread entry
        days_wait = None
        last_act = r["last_message_at"] or r["last_outbound_at"]
        if last_act:
            try:
                da = datetime.datetime.strptime(str(last_act)[:10], "%Y-%m-%d").date()
                days_wait = (today - da).days
            except Exception:
                days_wait = None
        all_genthreads.append({
            "thread_id": tid,
            "gmail_thread_id": gtid,
            "account_email": r["account_email"],
            "compose_available": compose_avail,
            "institution": institution,
            "people": person_names,
            "protocol_refs": protocol_refs,
            "classification": classification or "",
            "days_waiting": days_wait,
            "latest_inbound_snippet": snippet,
            "has_unanswered_inbound": r["has_unanswered_inbound"],
            "last_activity": r["last_message_at"],
            "created_at": (r["received_at"] or r["sent_at"])[:10] if r["received_at"] or r["sent_at"] else None,
        })

    total_msgs = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
    definite_count = conn.execute(
        "SELECT COUNT(*) FROM message_classification WHERE genealogy_relevance = 'definite'"
    ).fetchone()[0]
    possible_count = conn.execute(
        "SELECT COUNT(*) FROM message_classification WHERE genealogy_relevance = 'possible'"
    ).fetchone()[0]
    unreviewed_count = total_msgs - definite_count - possible_count

    by_account = {}
    try:
        rows_acct = conn.execute(
            "SELECT m.account_email, COUNT(*) FROM messages m "
            "GROUP BY m.account_email"
        ).fetchall()
        for ra in rows_acct:
            by_account[ra[0]] = ra[1]
    except Exception:
        pass
    for acct in ["daniele.buatti@gmail.com", "info@danielebuatti.com"]:
        by_account.setdefault(acct, 0)

    conn.close()

    output = {
        "pending_actions": pending_actions,
        "chase_due": chase_due,
        "no_action_needed": no_action_needed,
        "model_available": True,
        "db_stats": {
            "total_messages": total_msgs,
            "by_account": by_account,
            "definite": definite_count,
            "possible": possible_count,
            "unreviewed": unreviewed_count,
            "genealogy_threads": len(all_genthreads),
            "needs_action": len(pending_actions),
            "no_action": len(no_action_needed),
            "unclassified": 0,
        },
        "all_genealogy_threads": all_genthreads,
    }

    print(json.dumps(output, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
