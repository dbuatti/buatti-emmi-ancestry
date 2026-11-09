#!/usr/bin/env python3
"""Create a Gmail draft from a locally approved correspondence draft.

SCOPE NOTE: This script requests the gmail.compose OAuth scope. Google's
documentation states that gmail.compose permits managing drafts AND sending
emails via users.drafts.send / users.messages.send. This application
deliberately does NOT use any send functionality — it only calls
drafts().create(). There is no send method, endpoint or code path anywhere
in this workflow. However, the OAuth consent grants the technical permission
to send; the restriction is enforced by this application's code, not by the
scope itself.

READ-ONLY with respect to sending: this script only calls drafts().create().
It never calls messages().send() or drafts().send().

Usage:
  python3 scripts/create-gmail-draft.py <local_draft.json>              # dry-run preview
  python3 scripts/create-gmail-draft.py <local_draft.json> --approve     # create the draft
  python3 scripts/create-gmail-draft.py <local_draft.json> --auth        # OAuth for gmail.compose scope

Requires a separate auth file (.local/gmail_auth_compose.json) with the
gmail.compose scope. The existing read-only auth file is NOT sufficient.

No Gmail messages are modified, labelled, archived or deleted.
No emails are sent.
"""
import argparse
import base64
import json
import os
import sys
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMPOSE_AUTH_FILE = os.path.join(ROOT, ".local", "gmail_auth_compose.json")
COMM_ANALYTICS_DIR = os.path.expanduser("~/dyad-apps/comm-analytics")
READONLY_AUTH_FILE = os.path.join(ROOT, ".local", "gmail_auth_readonly.json")
COMPOSE_SCOPES = ["https://www.googleapis.com/auth/gmail.compose"]

# Gmail API endpoint for drafts
GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me/drafts"


def load_compose_credentials():
    """Load OAuth credentials with gmail.compose scope."""
    import json as _json
    from google.oauth2.credentials import Credentials
    auth_file = COMPOSE_AUTH_FILE
    if not os.path.exists(auth_file):
        return None
    try:
        accounts = _json.loads(open(auth_file).read())
        account_email = None
        for email, acct in accounts.items():
            account_email = email
            break
        if not account_email:
            return None
        account = accounts[account_email]
        access_token = account.get("access_token")
        refresh_token = account.get("refresh_token")
        if not access_token:
            return None
        client_id = account.get("client_id", "")
        client_secret = account.get("client_secret", "")
        if not client_id or not client_secret:
            secrets_path = os.path.join(COMM_ANALYTICS_DIR, "client_secrets.json")
            if os.path.exists(secrets_path):
                try:
                    secrets = _json.loads(open(secrets_path).read())
                    installed = secrets.get("installed", {})
                    client_id = client_id or installed.get("client_id", "")
                    client_secret = client_secret or installed.get("client_secret", "")
                except Exception:
                    pass
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            scopes=account.get("scopes", COMPOSE_SCOPES),
        )
        # Validate scopes
        granted = set(creds.scopes or account.get("scopes", []))
        if not granted.issubset(set(COMPOSE_SCOPES)):
            print("ERROR: Account has insufficient scopes: %s" % granted)
            print("Required: %s" % COMPOSE_SCOPES)
            return None
        if creds.expired and creds.refresh_token:
            from google.auth.transport.requests import Request
            creds.refresh(Request())
            account["access_token"] = creds.token
            if creds.expiry:
                account["token_expiry"] = creds.expiry.strftime("%Y-%m-%dT%H:%M:%SZ")
            with open(auth_file, "w") as f:
                _json.dump(accounts, f, indent=2, ensure_ascii=False)
        return creds, account_email
    except Exception as e:
        print("ERROR loading compose credentials: %s" % e)
        return None


def auth_flow(account_email):
    """Run OAuth flow for gmail.compose scope."""
    import json as _json
    from google_auth_oauthlib.flow import InstalledAppFlow
    from pathlib import Path

    secrets_path = Path(COMM_ANALYTICS_DIR) / "client_secrets.json"
    if not secrets_path.exists():
        print("ERROR: client_secrets.json not found at %s" % secrets_path)
        sys.exit(1)

    print("Starting gmail.compose OAuth flow for %s" % account_email)
    print("Scope: %s" % COMPOSE_SCOPES[0])
    print()
    print("WARNING: The gmail.compose scope technically permits sending emails")
    print("via the Gmail API (users.drafts.send / users.messages.send).")
    print("This application is deliberately designed NOT to send emails.")
    print("It only calls drafts().create(). There is no send functionality,")
    print("send endpoint, or send code path in this workflow.")
    print("The restriction is enforced by this application's code, not by the")
    print("OAuth scope. You are granting the technical permission to send,")
    print("but this application will never use it.")
    print()
    print("A browser window will open for authorization.")

    flow = InstalledAppFlow.from_client_secrets_file(str(secrets_path), scopes=COMPOSE_SCOPES)
    creds = flow.run_local_server(port=0)

    granted = set(creds.scopes or [])
    if not granted.issubset(set(COMPOSE_SCOPES)):
        print("ERROR: Granted scopes %s do not match required %s" % (granted, COMPOSE_SCOPES))
        sys.exit(1)

    accounts = {}
    if os.path.exists(COMPOSE_AUTH_FILE):
        try:
            accounts = _json.loads(open(COMPOSE_AUTH_FILE).read())
        except Exception:
            accounts = {}

    accounts[account_email] = {
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_expiry": creds.expiry.strftime("%Y-%m-%dT%H:%M:%SZ") if creds.expiry else None,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes or COMPOSE_SCOPES),
    }

    os.makedirs(os.path.dirname(COMPOSE_AUTH_FILE), exist_ok=True)
    with open(COMPOSE_AUTH_FILE, "w") as f:
        _json.dump(accounts, f, indent=2, ensure_ascii=False)
    print("Credentials saved to: %s" % COMPOSE_AUTH_FILE)
    print("Account: %s" % account_email)
    print("Scopes: %s" % accounts[account_email]["scopes"])
    sys.exit(0)


def build_mime_message(draft, thread_msgs):
    """Build an RFC 2822 message for the Gmail API."""
    import email
    from email.message import EmailMessage

    msg = EmailMessage()
    msg["From"] = "Daniele Buatti <%s>" % "info@danielebuatti.com"
    if draft.get("recipient_email"):
        msg["To"] = "%s <%s>" % (draft.get("recipient", ""), draft.get("recipient_email"))
    else:
        msg["To"] = draft.get("recipient", "")

    # Determine correspondence action type
    if draft.get("draft_type") == "new_correspondence":
        if thread_msgs:
            action_type = "Start new thread (originating from existing correspondence)"
        else:
            action_type = "New standalone enquiry"
    else:
        if thread_msgs:
            action_type = "Reply in existing thread"
        else:
            action_type = "New standalone enquiry"
    msg["X-Correspondence-Action"] = action_type

    # Subject
    subject = draft.get("subject_suggestion") or ""
    if not subject and thread_msgs:
        subject = thread_msgs[-1].get("subject") or thread_msgs[0].get("subject") or ""
    if draft.get("draft_type") != "new_correspondence":
        if not subject.lower().startswith("re:"):
            subject = "Re: " + subject
    msg["Subject"] = subject

    # Threading headers for replies
    gmail_thread_id = None
    if draft.get("draft_type") != "new_correspondence" and thread_msgs:
        gmail_thread_id = thread_msgs[0].get("gmail_thread_id")
        last_in = None
        for m in reversed(thread_msgs):
            if m.get("direction") == "in":
                last_in = m
                break
        if last_in and last_in.get("gmail_message_id"):
            msg["In-Reply-To"] = last_in["gmail_message_id"]
            msg["References"] = last_in["gmail_message_id"]

    msg.set_content(draft.get("draft_text", ""))
    return msg, gmail_thread_id, action_type


def get_thread_messages(thread_id):
    """Load messages for a thread from the DB."""
    import sqlite3
    db_path = os.path.join(ROOT, ".local", "correspondence.db")
    conn = sqlite3.connect("file:%s?mode=ro" % db_path, uri=True)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, direction, gmail_thread_id, gmail_message_id, subject, from_email, from_name, received_at, sent_at "
        "FROM messages WHERE gmail_thread_id=? ORDER BY COALESCE(received_at, sent_at)",
        (thread_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_draft(draft, account_email, dry_run=True):
    """Create a Gmail draft. Returns (draft_id, error)."""
    thread_id = draft.get("thread_id", "").replace("_new", "")
    thread_msgs = get_thread_messages(thread_id)

    msg, gmail_thread_id, action_type = build_mime_message(draft, thread_msgs)

    if dry_run:
        print("DRY RUN — would create Gmail draft:")
        print("  Correspondence action: %s" % action_type)
        print("  To: %s" % msg["To"])
        print("  Subject: %s" % msg["Subject"])
        print("  Thread: %s" % (gmail_thread_id or "(new standalone)"))
        print("  Body: %d chars" % len(draft.get("draft_text", "")))
        print("  In-Reply-To: %s" % (msg.get("In-Reply-To") or "(none)"))
        return "dry-run", None

    creds_result = load_compose_credentials()
    if creds_result is None:
        return None, "Compose credentials not available. Run --auth first."
    creds, auth_email = creds_result

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("ascii")
    body = {"message": {"raw": raw}}
    if gmail_thread_id:
        body["message"]["threadId"] = gmail_thread_id

    try:
        from googleapiclient.discovery import build
        service = build("gmail", "v1", credentials=creds)
        result = service.users().drafts().create(userId="me", body=body).execute()
        return result.get("id"), None
    except Exception as e:
        return None, str(e)


def main():
    ap = argparse.ArgumentParser(description="Create a Gmail draft from a local correspondence draft.")
    ap.add_argument("draft_path", help="Path to local draft JSON")
    ap.add_argument("--approve", action="store_true",
                    help="Actually create the Gmail draft (default: dry-run preview)")
    ap.add_argument("--auth", action="store_true",
                    help="Run OAuth flow for gmail.compose scope")
    ap.add_argument("--set-draft-id", default=None, metavar="DRAFT_ID",
                    help="Record an existing Gmail draft ID without creating a new one (recovery)")
    ap.add_argument("--account", default="info@danielebuatti.com",
                    help="Gmail account email")
    args = ap.parse_args()

    if args.auth:
        auth_flow(args.account)
        return 0

    # Load draft
    if not os.path.exists(args.draft_path):
        print("ERROR: Draft file not found: %s" % args.draft_path)
        sys.exit(1)
    with open(args.draft_path, "r", encoding="utf-8") as f:
        draft = json.load(f)

    # Recovery: record an existing Gmail draft ID without creating a new one
    if args.set_draft_id:
        draft["gmail_draft_id"] = args.set_draft_id
        draft["gmail_draft_created_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        draft["gmail_draft_account"] = args.account
        draft["gmail_draft_status"] = "created (recovered)"
        with open(args.draft_path, "w", encoding="utf-8") as f:
            json.dump(draft, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print("Recorded Gmail draft ID: %s" % args.set_draft_id)
        print("No new draft was created.")
        return 0

    # Duplicate prevention: check if already created
    if draft.get("gmail_draft_id"):
        print("ERROR: This draft already has a Gmail draft ID: %s" % draft.get("gmail_draft_id"))
        print("To re-create, remove the gmail_draft_id field first.")
        sys.exit(1)

    # Readiness check: must not be blocked
    readiness = draft.get("readiness") or draft.get("verification", {}).get("readiness")
    if readiness == "blocked":
        print("ERROR: Draft is blocked by verification. Resolve issues before creating.")
        sys.exit(1)

    if not args.approve:
        # Dry-run preview
        draft_id, err = create_draft(draft, args.account, dry_run=True)
        if err:
            print("ERROR: %s" % err)
            sys.exit(1)
        print("\nDry-run preview complete. Use --approve to create the Gmail draft.")
        return 0

    # Create the draft
    print("Creating Gmail draft...")
    draft_id, err = create_draft(draft, args.account, dry_run=False)
    if err:
        err_lower = err.lower()
        if "timeout" in err_lower or "timed out" in err_lower:
            print("ERROR: API request timed out. The draft may or may not have been created.")
            print("MANUAL RECOVERY:")
            print("  1. Check Gmail Drafts folder for a draft with subject matching this draft.")
            print("  2. If found, record it: python3 scripts/create-gmail-draft.py %s --set-draft-id <DRAFT_ID>" % args.draft_path)
            print("  3. If not found, retry: python3 scripts/create-gmail-draft.py %s --approve" % args.draft_path)
        else:
            print("ERROR: %s" % err)
        sys.exit(1)

    # Store the Gmail draft ID in the local draft
    draft["gmail_draft_id"] = draft_id
    draft["gmail_draft_created_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    draft["gmail_draft_account"] = args.account
    draft["gmail_draft_status"] = "created"
    draft["gmail_draft_body_hash"] = __import__("hashlib").sha256(draft.get("draft_text", "").encode()).hexdigest()

    try:
        with open(args.draft_path, "w", encoding="utf-8") as f:
            json.dump(draft, f, indent=2, ensure_ascii=False)
            f.write("\n")
    except Exception as e:
        print("WARNING: Gmail draft was created (ID: %s) but local file write failed: %s" % (draft_id, e))
        print("MANUAL RECOVERY: Run:")
        print("  python3 scripts/create-gmail-draft.py %s --set-draft-id %s" % (args.draft_path, draft_id))
        sys.exit(1)

    print("Gmail draft created successfully.")
    print("Draft ID: %s" % draft_id)
    print("Account: %s" % args.account)
    print("Local draft updated with gmail_draft_id.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
