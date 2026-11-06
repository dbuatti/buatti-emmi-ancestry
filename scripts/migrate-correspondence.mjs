#!/usr/bin/env node
import { getDb, getDbPath, closeDb } from './correspondence-db.mjs';

const db = getDb();
const version = db.pragma('user_version', { simple: true });
const tables = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
).all().map(r => r.name);
console.log('DB path:', getDbPath());
console.log('Schema version:', version);
console.log('Tables:', tables.join(', '));
console.log('Migration complete.');
closeDb();