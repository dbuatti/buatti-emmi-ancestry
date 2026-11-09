#!/usr/bin/env bash
# backup-sources.sh — back up all research sources to a safe location
#
# Usage:
#   ./scripts/backup-sources.sh [destination]
#
# Default destination: ~/Backups/buatti-emmi-ancestry/<timestamp>
# Override with BACKUP_DEST env var or first positional arg.
#
# Backs up:
#   1. ~/Downloads/FAMILY TREE/  (intake + processed documents)
#   2. records-local/              (per-record image files)
#   3. correspondence/             (extracted text, attachments, analysis)
#   4. .local/correspondence.db   (SQLite correspondence database)
#   5. records/                    (record.md transcription files)
#
# Logs to: <destination>/backup.log

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DEST="${1:-${BACKUP_DEST:-$HOME/Backups/buatti-emmi-ancestry/$TIMESTAMP}}"

mkdir -p "$DEST"
LOG="$DEST/backup.log"

echo "=== Backup started: $(date) ===" | tee -a "$LOG"
echo "Source root: $ROOT" | tee -a "$LOG"
echo "Destination: $DEST" | tee -a "$LOG"
echo "" | tee -a "$LOG"

# Track total size
TOTAL=0

backup_dir() {
  local src="$1"
  local label="$2"
  if [ -d "$src" ]; then
    local size
    size=$(du -sh "$src" 2>/dev/null | cut -f1)
    echo "Backing up $label ($size)..." | tee -a "$LOG"
    rsync -a --delete "$src/" "$DEST/$label/" 2>&1 | tee -a "$LOG"
    echo "  ✅ $label done" | tee -a "$LOG"
  else
    echo "  ⚠️ $label not found: $src" | tee -a "$LOG"
  fi
}

backup_file() {
  local src="$1"
  local label="$2"
  if [ -f "$src" ]; then
    local size
    size=$(du -h "$src" 2>/dev/null | cut -f1)
    echo "Backing up $label ($size)..." | tee -a "$LOG"
    cp "$src" "$DEST/$label" 2>&1 | tee -a "$LOG"
    echo "  ✅ $label done" | tee -a "$LOG"
  else
    echo "  ⚠️ $label not found: $src" | tee -a "$LOG"
  fi
}

# 1. Family Tree folder (intake + processed)
backup_dir "$HOME/Downloads/FAMILY TREE" "family-tree"

# 2. records-local (per-record images)
backup_dir "$ROOT/records-local" "records-local"

# 3. correspondence (extracted text, attachments, analysis)
backup_dir "$ROOT/correspondence" "correspondence"

# 4. SQLite database
mkdir -p "$DEST/db"
backup_file "$ROOT/.local/correspondence.db" "db/correspondence.db"

# 5. records (transcription files)
backup_dir "$ROOT/records" "records"

# 6. familyData.ts (the single source of genealogy data)
mkdir -p "$DEST/data"
backup_file "$ROOT/src/data/familyData.ts" "data/familyData.ts"
backup_file "$ROOT/src/data/familyDataWrapper.ts" "data/familyDataWrapper.ts"
backup_file "$ROOT/src/data/person-meta.json" "data/person-meta.json"
backup_file "$ROOT/src/data/tree-overrides.json" "data/tree-overrides.json"
backup_file "$ROOT/src/data/event-requests.json" "data/event-requests.json"

echo "" | tee -a "$LOG"
echo "=== Backup complete: $(date) ===" | tee -a "$LOG"
echo "Destination: $DEST" | tee -a "$LOG"

# Print summary
echo ""
echo "Backup complete. Contents:"
ls -la "$DEST" | tee -a "$LOG"