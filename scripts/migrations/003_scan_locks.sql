-- Migration 003: Scan locks table for atomic overlapping scan protection
CREATE TABLE IF NOT EXISTS scan_locks (
  account_email TEXT PRIMARY KEY,
  locked_at TEXT NOT NULL,
  lock_pid INTEGER NOT NULL,
  lock_expires_at TEXT NOT NULL
);