import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DB_PATH = path.resolve(PROJECT_ROOT, '.local', 'correspondence.db');
const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

let cached = null;

export function getDbPath() {
  return process.env.CORRESPONDENCE_DB_PATH || DEFAULT_DB_PATH;
}

export function openDb(dbPath) {
  const resolved = dbPath || getDbPath();
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const db = new Database(resolved);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  // Migration runner: apply versioned .sql files in order
  const currentVersion = db.pragma('user_version', { simple: true }) || 0;
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d+_.*\.sql$/.test(f))
    .sort();
  for (const file of files) {
    const version = parseInt(file.match(/^(\d+)_/)[1], 10);
    if (version <= currentVersion) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    const apply = db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${version}`);
    });
    apply();
    console.log(`[correspondence-db] applied migration ${file} (v${version})`);
  }
  return db;
}

export function getDb() {
  if (!cached) cached = openDb();
  return cached;
}

export function closeDb() {
  if (cached) { cached.close(); cached = null; }
}