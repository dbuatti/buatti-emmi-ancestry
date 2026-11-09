#!/usr/bin/env bash
# Restore draft files and sidecars from the reconciliation backup.
# Usage: bash scripts/restore-draft-reconciliation.sh [backup_dir]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP="${1:-.local/backups/draft-reconciliation-20261109_094632}"
cd "$BACKUP"
shasum -a 256 -c SHA256SUMS
# Restore draft files
for f in 19f0c407ab3f6961.json 19f5de9529cda63f.json 19f72c9a56c8331b.json 19f8b54fa43baa1a.json 1a17ca51f2fd6cdc.json 1a1a9ab9b9303081.json 1a1a9ab9b9303081_new.json; do
  cp "$BACKUP/$f" "$ROOT/correspondence/extracted/drafts/$f"
done
for f in threads.json actions.json request-links.json; do
  cp "$BACKUP/$f" "$ROOT/correspondence/extracted/$f"
done
echo "Restored from $BACKUP"
