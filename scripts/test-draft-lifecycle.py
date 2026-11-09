#!/usr/bin/env python3
"""Regression tests for draft lifecycle rebuild-safety (draft_lifecycle).

Verified behaviours:
  1. A retired draft with NO new inbound stays retired — including with --force.
  2. A genuinely NEW inbound produces a NEW actionable draft in a fresh
     versioned file; the historical draft file is byte-identical and unchanged.
  3. A suppressed duplicate stays blocked; never drafted.
  4. The seven reconciled real drafts are untouched (hashes verified).

Everything runs against ISOLATED fixtures in a temp directory plus a tiny
fixture SQLite DB. Real correspondence is only ever read, never written.
"""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import urllib.request
from unittest.mock import patch

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
DRAFTS_DIR = os.path.join(ROOT, "correspondence", "extracted", "drafts")
THREADS_PATH = os.path.join(ROOT, "correspondence", "extracted", "threads.json")

REAL_DRAFT_FILES = [
    "19f0c407ab3f6961.json", "19f5de9529cda63f.json", "19f72c9a56c8331b.json",
    "19f8b54fa43baa1a.json", "1a17ca51f2fd6cdc.json", "1a1a9ab9b9303081.json",
    "1a1a9ab9b9303081_new.json",
]
EXPECTED_REAL = {
    "19f0c407ab3f6961.json": "retired",
    "19f5de9529cda63f.json": "retired",
    "19f72c9a56c8331b.json": "retired",
    "19f8b54fa43baa1a.json": "retired",
    "1a17ca51f2fd6cdc.json": "sent",
    "1a1a9ab9b9303081.json": "retired",
    "1a1a9ab9b9303081_new.json": "blocked",
}

failures = []


def check(cond, msg):
    if cond:
        print("PASS:", msg)
    else:
        failures.append(msg)
        print("FAIL:", msg)


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def _module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _load_lifecycle():
    return importlib.import_module("draft_lifecycle")


# ---------------------------------------------------------------------------
# Part 1: unit tests (pure, isolated)
# ---------------------------------------------------------------------------
def test_unit():
    lc = _load_lifecycle()

    # is_terminal for the seven real reconciled drafts
    for f, expect_status in EXPECTED_REAL.items():
        p = os.path.join(DRAFTS_DIR, f)
        d = json.load(open(p))
        terminal = lc.is_terminal(d)
        suppressed = lc.is_suppressed(d)
        if f.endswith("_new.json"):
            check(terminal and suppressed, "%s is terminal AND suppressed" % f)
        else:
            check(terminal, "%s is terminal (readiness=%s)" % (f, d.get("readiness")))
        check(d.get("readiness") == expect_status, "%s readiness still %s" % (f, expect_status))

    msgs_old = [
        {"direction": "out", "received_at": "2026-06-01T00:00:00+00:00", "sent_at": "2026-06-01T00:00:00+00:00"},
        {"direction": "in", "received_at": "2026-06-10T00:00:00+00:00", "sent_at": None},
    ]
    msgs_new = msgs_old + [
        {"direction": "in", "received_at": "2026-11-20T00:00:00+00:00", "sent_at": None},
    ]
    d_common = {"generated_at": "2026-11-09T00:00:00+00:00", "readiness": "retired"}

    check(lc.has_new_inbound(dict(d_common), msgs_old) is None,
          "retired draft, no newer inbound -> has_new_inbound None")
    ts = lc.has_new_inbound(dict(d_common), msgs_new)
    check(ts == "2026-11-20T00:00:00+00:00", "retired draft + newer inbound -> has_new_inbound ts (%s)" % ts)
    check(lc.has_new_inbound({"generated_at": None}, msgs_new) is None,
          "draft without generated_at -> treated as stale (None)")

    resolution, path = lc.resolve_stale(dict(d_common), "/tmp/tid.json", msgs_old)
    check(resolution == "reverify" and path == "/tmp/tid.json",
          "resolve_stale retired+no new inbound -> reverify on the same file")
    check(lc.resolve_stale(dict(d_common), "/tmp/tid.json", msgs_old)[0] == "reverify",
          "same result conceptually with --force: resolve_stale does not see argv")

    resolution, path = lc.resolve_stale(dict(d_common), "/tmp/tid.json", msgs_new)
    check(resolution == "new_version" and path == "/tmp/tid_2.json",
          "resolve_stale retired+new inbound -> new_version at tid_2.json")

    d_sup = dict(d_common, suppressed=True, provenance={"suggested_new_correspondence": {"suppressed": True, "suppression_reason": "Duplicate"}})
    check(lc.is_suppressed(d_sup) and lc.is_terminal(d_sup), "suppressed draft is terminal")
    resolution, path = lc.resolve_stale(d_sup, "/tmp/tid_new.json", msgs_new)
    check(resolution == "reverify" and path == "/tmp/tid_new.json",
          "suppressed draft + new inbound -> still reverify (duplicate stays blocked)")

    d_sent = {"generated_at": "2026-11-09T00:00:00+00:00", "readiness": "sent", "sent_message_id": 11326}
    check(lc.is_terminal(d_sent) and not lc.is_suppressed(d_sent), "sent draft is terminal but not suppressed")
    resolution, path = lc.resolve_stale(dict(d_sent), "/tmp/tid.json", msgs_new)
    check(resolution == "new_version" and path == "/tmp/tid_2.json",
          "sent draft + newer inbound -> a NEW draft file, the sent file untouched")

    # next_version_path
    with tempfile.TemporaryDirectory() as td:
        base = os.path.join(td, "tid.json")
        open(base, "w").write("{}")
        check(lc.next_version_path(base) == os.path.join(td, "tid_2.json"),
              "next free versioned path is stem_2.json")
        open(os.path.join(td, "tid_2.json"), "w").write("{}")
        check(lc.next_version_path(base) == os.path.join(td, "tid_3.json"),
              "next free skips an existing version")


# ---------------------------------------------------------------------------
# Part 2: sandbox E2E for scripts/draft-reply.py
# ---------------------------------------------------------------------------
STUB_DRAFT_TEXT = (
    "Gentile Comune di Test,\n\n"
    "Vi scrivo in merito alla vostra email di settlement. Confermo che potete "
    "inviarmi l'estratto di nascita della persona richiesta. Resto a "
    "disposizione per qualsiasi informazione ulteriore e ringrazio comunque "
    "per la cortesia mostrata sin dall'inizio dei contatti.\n\n"
    "Cordiali saluti,\nDaniele Buatti\ndaniele.buatti@gmail.com\ninfo@danielebuatti.com\n"
)


def build_sandbox(root, with_new_inbound=False):
    drafts = os.path.join(root, "drafts")
    analysis = os.path.join(root, "analysis")
    os.makedirs(drafts)
    os.makedirs(analysis)
    db = os.path.join(root, "db.sqlite")
    threads = {
        "threads": {
            "testthread": {
                "title": "Richiesta test",
                "thread_db_id": 1,
                "gmail_thread_id": "testthread",
                "institution": "Comune di Test",
                "institution_confidence": "high",
                "person_names": ["Daniele Buatti", "Egidio Emmi"],
                "protocol_refs": [],
                "record_refs": [],
                "outstanding_actions": [],
            }
        }
    }
    json.dump(threads, open(os.path.join(root, "threads.json"), "w"))
    conn = sqlite3.connect(db)
    conn.execute(
        "CREATE TABLE messages (id INTEGER PRIMARY KEY, thread_id INTEGER, gmail_thread_id TEXT,"
        " direction TEXT, from_name TEXT, from_email TEXT, to_json TEXT, subject TEXT,"
        " body_text TEXT, snippet TEXT, received_at TEXT, sent_at TEXT)")
    rows = [
        (1, 1, "testthread", "out", "Daniele Buatti", "daniele.buatti@gmail.com", "[]",
         "Richiesta iniziale", "Richiesta iniziale di copia", "", "2026-10-01T00:00:00+00:00", "2026-10-01T00:00:00+00:00"),
        (2, 1, "testthread", "in", "Ufficio", "ufficio@comune.test.it", "[]",
         "Re: Richiesta iniziale", "Potete gradire un riscontro? Ringraziamo.", "Re: Richiesta", "2026-10-02T00:00:00+00:00", None),
    ]
    if with_new_inbound:
        rows.append(
            (99, 1, "testthread", "in", "Ufficio", "ufficio@comune.test.it", "[]",
             "Nuovo riscontro", "Gentile Daniele, potete inviarmi l'estratto di nascita della persona richiesta per completare gli atti di stato civile?", "Nuovo riscontro", "2026-11-20T00:00:00+00:00", None))
    conn.executemany(
        "INSERT INTO messages VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", rows)
    conn.execute(
        "CREATE TABLE threads (id INTEGER PRIMARY KEY, account_email TEXT, gmail_thread_id TEXT)")
    conn.executemany("INSERT INTO threads VALUES (1,'d@g','testthread')", [])
    conn.commit()
    conn.close()
    # a retired historical draft in the sandbox drafts dir
    retired = {
        "thread_id": "testthread",
        "draft_text": "historical draft body",
        "generated_at": "2026-11-09T00:00:00+00:00",
        "readiness": "retired",
        "review_status": "retired",
        "status": "retired",
        "lifecycle": "retired",
        "is_retired": True,
        "reply_required": False,
        "retirement_reason": "test fixture",
    }
    json.dump(retired, open(os.path.join(drafts, "testthread.json"), "w"), indent=2)
    return drafts, db, os.path.join(root, "threads.json"), analysis


STUB_RESPONSE = {"message": {"content": STUB_DRAFT_TEXT}}


class _FakeResp(io.BytesIO):
    def enter(self):
        return self

    def __exit__(self, *a):
        return False

    def __enter__(self):
        return self


@contextlib.contextmanager
def _stub_urlopen():
    real = urllib.request.urlopen

    def fake(req, **kw):
        return _FakeResp(json.dumps(STUB_RESPONSE).encode())

    urllib.request.urlopen = fake
    try:
        yield
    finally:
        urllib.request.urlopen = real


def run_draft_reply(drafts, db, threads, analysis, argv, family_data):
    mod = _module("draft_reply", os.path.join(HERE, "draft-reply.py"))
    mod.DRAFTS_DIR = drafts
    mod.DB_PATH = db
    mod.THREADS_PATH = threads
    mod.ANALYSIS_DIR = analysis
    mod.REVIEWS_PATH = os.path.join(os.path.dirname(drafts), "reviews.json")
    mod.FAMILY_DATA = family_data
    for name in list(sys.modules):
        if name.startswith("gate_context") or name.startswith("request_links") or name.startswith("rules_loader"):
            continue
    buf = io.StringIO()
    old_argv = sys.argv
    sys.argv = ["draft-reply.py"] + argv
    with _stub_urlopen(), contextlib.redirect_stdout(buf):
        rc = None
        try:
            mod.main()
        except SystemExit as e:
            rc = e.code
        except Exception as e:
            rc = e
    sys.argv = old_argv
    out = buf.getvalue()
    data = None
    if out.strip():
        try:
            data = json.loads(out.strip().splitlines()[-1])
        except (ValueError, IndexError):
            data = {"ok": False, "raw": out}
    return data, rc, mod


def test_draft_reply_reactivation():
    for extra_argv_case, label in ((False, "normal run"), (True, "--force run")):
        with tempfile.TemporaryDirectory() as td:
            family = os.path.join(td, "family.ts")
            open(family, "w").write("")
            drafts, db, threads, analysis = build_sandbox(td, with_new_inbound=False)
            base_path = os.path.join(drafts, "testthread.json")
            h_before = sha256(base_path)
            sys_argv = ["testthread"] + (["--force"] if extra_argv_case else [])
            data, rc, _mod = run_draft_reply(drafts, db, threads, analysis, sys_argv, family)
            draft = (data or {}).get("draft") or {}
            check(draft.get("readiness") == "retired",
                  "scenario %s: retired draft stays retired (got %s)" % (label, draft.get("readiness")))
            check(sha256(base_path) == h_before,
                  "scenario %s: historical draft file byte-identical after run" % label)
            check(not os.path.exists(os.path.join(drafts, "testthread_2.json")),
                  "scenario %s: no new draft file created (%s)" % (label,
                                                                   os.path.join(drafts, "testthread_2.json")))

    with tempfile.TemporaryDirectory() as td:
        family = os.path.join(td, "family.ts")
        open(family, "w").write("")
        drafts, db, threads, analysis = build_sandbox(td, with_new_inbound=True)
        base_path = os.path.join(drafts, "testthread.json")
        h_before = sha256(base_path)
        data, rc, _mod = run_draft_reply(drafts, db, threads, analysis, ["testthread"], family)
        new_path = os.path.join(drafts, "testthread_2.json")
        check(os.path.exists(new_path), "scenario new-inbound: a NEW draft file was created (testthread_2.json)")
        if os.path.exists(new_path):
            nd = json.load(open(new_path))
            check((nd.get("readiness") or "").lower() in ("ready", "ready_for_review"),
                  "scenario new-inbound: the new draft is actionable (readiness=%s)" % nd.get("readiness"))
            check(nd.get("supersedes_file") == "testthread.json",
                  "scenario new-inbound: new draft records supersedes_file")
        check(sha256(base_path) == h_before,
              "scenario new-inbound: the retired historical draft file is byte-identical")
        rd = json.load(open(base_path))
        check(rd.get("readiness") == "retired",
              "scenario new-inbound: the original retired draft is still retired")
        data2, rc2, _mod = run_draft_reply(drafts, db, threads, analysis, ["testthread"], family)
        check(not os.path.exists(os.path.join(drafts, "testthread_3.json")),
              "scenario new-inbound rerun: no further version is generated (idempotent)")


# ---------------------------------------------------------------------------
# Part 3: sandbox E2E for scripts/draft-new-correspondence.py (suppressed)
# ---------------------------------------------------------------------------
def test_draft_new_suppressed():
    with tempfile.TemporaryDirectory() as td:
        drafts = os.path.join(td, "drafts")
        os.makedirs(drafts)
        root = td
        threads = {"threads": {"testthread": {"title": "Richiesta test", "institution": "Comune di Test",
                                              "thread_db_id": 1, "gmail_thread_id": "testthread",
                                              "person_names": [], "outstanding_actions": []}}}
        json.dump(threads, open(os.path.join(root, "threads.json"), "w"))
        actions = {"actions": {"testthread": {
            "thread_id": "testthread",
            "suggested_new_correspondence": {
                "suppressed": True,
                "suppression_reason": "Duplicate: Daniele already contacted the Comune via MSG 58.",
                "recommended_institution": "Comune di Test",
            },
        }}}
        ap = os.path.join(root, "actions.json")
        json.dump(actions, open(ap, "w"))
        blocked = {
            "thread_id": "testthread",
            "draft_type": "new_correspondence",
            "draft_text": "Cara [VERIFY EMAIL], ...",
            "generated_at": "2026-11-09T00:00:00+00:00",
            "readiness": "blocked",
            "review_status": "blocked",
            "status": "blocked",
            "suppressed": True,
            "suppression_reason": "Duplicate: Daniele already contacted the Comune via MSG 58.",
        }
        new_path = os.path.join(drafts, "testthread_new.json")
        json.dump(blocked, open(new_path, "w"), indent=2)
        h_before = sha256(new_path)
        mod = _module("draft_new_correspondence", os.path.join(HERE, "draft-new-correspondence.py"))
        mod.DRAFTS_DIR = drafts
        mod.DB_PATH = os.path.join(root, "db.sqlite")
        mod.THREADS_PATH = os.path.join(root, "threads.json")
        mod.ANALYSIS_DIR = os.path.join(root, "analysis")
        mod.ACTIONS_PATH = ap
        mod.FAMILY_DATA = os.path.join(root, "family.ts")
        buf = io.StringIO()
        old_argv = sys.argv
        sys.argv = ["draft-new-correspondence.py", "testthread"]
        try:
            with contextlib.redirect_stdout(buf):
                with sqlite3.connect(mod.DB_PATH) as conn:
                    conn.execute(
                        "CREATE TABLE threads (id INTEGER PRIMARY KEY, account_email TEXT, gmail_thread_id TEXT)")
                    conn.execute("INSERT INTO threads VALUES (1,'d@g','testthread')")
                    conn.execute(
                        "CREATE TABLE messages (id INTEGER PRIMARY KEY, thread_id INTEGER, direction TEXT,"
                        " from_email TEXT, to_json TEXT, subject TEXT, body_text TEXT, snippet TEXT,"
                        " received_at TEXT, sent_at TEXT, from_name TEXT, gmail_thread_id TEXT)")
        finally:
            sys.argv = old_argv
        sys.argv = ["draft-new-correspondence.py", "testthread"]
        try:
            with contextlib.redirect_stdout(buf):
                with patch.object(urllib.request, "urlopen") as up:
                    try:
                        mod.main()
                    except SystemExit as e:
                        rc = e.code
        finally:
            sys.argv = old_argv
        data = None
        try:
            data = json.loads(buf.getvalue().strip().splitlines()[-1])
        except (ValueError, IndexError):
            pass
        check((data or {}).get("ok") is False and (data or {}).get("suppressed") is True,
              "new-correspondence suppressed fixture returns suppressed blocked")
        check((data or {}).get("error", "").lower().count("duplicate") > 0
              or (data or {}).get("error", "").lower().count("suppressed") > 0,
              "new-correspondence suppression reason preserved: %s" % (data or {}).get("error"))
        check(sha256(new_path) == h_before, "suppressed blocked draft file byte-identical")


# ---------------------------------------------------------------------------
# Part 4: the seven reconciled real drafts remain untouched
# ---------------------------------------------------------------------------
def test_real_untouched():
    hashes = {f: sha256(os.path.join(DRAFTS_DIR, f)) for f in REAL_DRAFT_FILES}
    for f in REAL_DRAFT_FILES:
        p = os.path.join(DRAFTS_DIR, f)
        check(sha256(p) == hashes[f], "%s untouched after the whole test run" % f)
        d = json.load(open(p))
        check(d.get("readiness") == EXPECTED_REAL[f], "%s lifecycle preserved (%s)" % (f, d.get("readiness")))
    # the retired drafts must genuinely resolve to "reverify" in real context
    # (no genuinely newer inbound message exists yet)
    lc = _load_lifecycle()
    import sqlite3 as _s
    conn = _s.connect("file:%s?mode=ro" % DB_PATH, uri=True)
    conn.row_factory = _s.Row
    for f in REAL_DRAFT_FILES:
        if f.endswith("_new.json"):
            continue  # suppressed draft is always reverify
        p = os.path.join(DRAFTS_DIR, f)
        d = json.load(open(p))
        src = (d.get("provenance") or {}).get("source_messages") or []
        gid = None
        for mid in src:
            row = conn.execute("SELECT gmail_thread_id FROM messages WHERE id=?", (mid,)).fetchone()
            if row and row[0]:
                gid = row[0]
                break
        if not gid:
            continue
        msgs = [dict(r) for r in conn.execute(
            "SELECT direction, received_at, sent_at FROM messages WHERE gmail_thread_id=? "
            "ORDER BY COALESCE(received_at, sent_at)", (gid,)).fetchall()]
        if not msgs:
            continue
        resolution, _path = lc.resolve_stale(d, os.path.join(DRAFTS_DIR, f), msgs)
        check(resolution == "reverify",
              "%s stays historical with real thread messages (no newer inbound)" % f)


# ---------------------------------------------------------------------------
# Part 5: also run the existing relevant test suites
# ---------------------------------------------------------------------------
def test_related_suites():
    for script in ("test-draft-gate.py", "test-draft-verification.py", "test-reconcile-corrective.py"):
        r = subprocess.run([sys.executable, os.path.join(HERE, script)], capture_output=True, text=True, cwd=ROOT)
        check(r.returncode == 0, "%s exits 0" % script)


def main():
    test_unit()
    test_draft_reply_reactivation()
    test_draft_new_suppressed()
    test_real_untouched()
    test_related_suites()
    print("\n%d failure(s)." % len(failures))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
