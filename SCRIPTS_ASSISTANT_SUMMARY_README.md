# Research Assistant Summary Script

This script provides aggregated summary data for the Research Assistant UI page (`/research/assistant`).

## What it does

Aggregates correspondence data from multiple sources:
1. **`.local/correspondence.db`** (SQL database):
   - Threads (`account_email`, `gmail_thread_id`, `subject`, `last_message_at`, etc.)
   - Messages (`received_at`, `snippet`, `body_text`, etc.)
   - Classifications (`message_type`, `action_status`, `genealogy_relevance`)

2. **`correspondence/extracted/threads.json`** (JSON data):
   - Per-thread intelligence: people, institutions, protocol references
   - Chronology and evidence for each message

3. **`correspondence/extracted/actions.json`** (JSON data):
   - Thread classification: awaiting_response, action_required, etc.
   - Research questions, promises, outstanding issues

4. **`src/data/event-requests.json`**:
   - 30-day chase clock for pending requests

5. **`src/data/tree-overrides.json`**:
   - User overrides for tree data (added/deleted people/leads/questions)

6. **`.local/gmail_auth_compose.json`**:
   - Which accounts have Gmail compose scope (enables draft creation)

## Output format

```json
{
  "pending_actions": [...],
  "chase_due": [...],
  "no_action_needed": [...],
  "model_available": true,
  "db_stats": {
    "total_messages": 11091,
    "by_account": {
      "daniele.buatti@gmail.com": 10520,
      "info@danielebuatti.com": 571
    },
    "definite": 103,    // Messages with genealogy_relevance='definite'
    "possible": 15,     // Messages with genealogy_relevance='possible'
    "unreviewed": 10973 // Messages without genealogy_relevance
  }
}
```

## Key features

- **Per-thread intelligence**: People names, institutions, protocol references
- **Compose availability**: Shows which accounts can create Gmail drafts
- **Classification-based routing**: Threads categorized into pending/chased/no_action
- **Chase detection**: Flags requests waiting >30 days for response
- **Accurate stats**: Correct counts of definite/possible/unreviewed messages

## Dev usage

Run the script:

```bash
python3 scripts/assistant-summary.py
```

The output is JSON used by:
- `/api/assistant/summary` endpoint in vite.config.ts
- AssistantDashboard.tsx table data
- ThreadLifecycle and other components

## Integration

This script is the foundation for the Research Assistant UI:
- Phase 1: Script + API endpoint (complete)
- Phase 2: UI components (AssistantDashboard, ThreadSummaryCard, etc.)
- Phase 3: Draft generation and Gmail integration
