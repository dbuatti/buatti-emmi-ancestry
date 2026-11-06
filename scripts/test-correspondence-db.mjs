#!/usr/bin/env node
import { openDb, closeDb } from './correspondence-db.mjs';

const dbPath = '/tmp/corr-test.db';
// Clean slate
import fs from 'node:fs';
for (const f of [dbPath, dbPath + '-wal', dbPath + '-shm']) {
  try { fs.unlinkSync(f); } catch {}
}

process.env.CORRESPONDENCE_DB_PATH = dbPath;
const db = openDb(dbPath);
const pass = (name) => console.log(`PASS: ${name}`);
const fail = (name, err) => { console.log(`FAIL: ${name} — ${err}`); process.exitCode = 1; };

// 1. Schema version
try {
  const v = db.pragma('user_version', { simple: true });
  if (v === 6) pass('schema version = 6'); else fail('schema version', `got ${v}`);
} catch (e) { fail('schema version', e.message); }

// 2. Create thread
let threadId;
try {
  const now = new Date().toISOString();
  const info = db.prepare(
    `INSERT INTO threads (account_email, gmail_thread_id, created_at, updated_at) VALUES (?,?,?,?)`
  ).run('acct@example.com', 'thread1', now, now);
  threadId = info.lastInsertRowid;
  pass('create thread');
} catch (e) { fail('create thread', e.message); }

// 3. Create message with matching composite key (should succeed)
let messageId;
try {
  const now = new Date().toISOString();
  const info = db.prepare(
    `INSERT INTO messages (account_email, gmail_message_id, gmail_thread_id, thread_id, direction, imported_at)
     VALUES (?,?,?,?,?,?)`
  ).run('acct@example.com', 'msg1', 'thread1', threadId, 'in', now);
  messageId = info.lastInsertRowid;
  pass('create message (matching composite key)');
} catch (e) { fail('create message (matching)', e.message); }

// 4. Create message with mismatched account (should fail — composite FK)
try {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO messages (account_email, gmail_message_id, gmail_thread_id, thread_id, direction, imported_at)
     VALUES (?,?,?,?,?,?)`
  ).run('other@example.com', 'msg2', 'thread1', threadId, 'in', now);
  fail('composite FK (mismatched account)', 'insert succeeded but should have failed');
} catch (e) {
  if (e.message.includes('FOREIGN KEY')) pass('composite FK rejects mismatched account');
  else fail('composite FK', e.message);
}

// 5. Create message with mismatched thread_id (should fail — composite FK)
try {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO messages (account_email, gmail_message_id, gmail_thread_id, thread_id, direction, imported_at)
     VALUES (?,?,?,?,?,?)`
  ).run('acct@example.com', 'msg3', 'thread1', 9999, 'in', now);
  fail('composite FK (mismatched thread_id)', 'insert succeeded but should have failed');
} catch (e) {
  if (e.message.includes('FOREIGN KEY')) pass('composite FK rejects mismatched thread_id');
  else fail('composite FK', e.message);
}

// 6. Create action with message_id from same thread (should succeed)
try {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO actions (thread_id, message_id, description, owner, created_at) VALUES (?,?,?,?,?)`
  ).run(threadId, messageId, 'test action', 'me', now);
  pass('create action (same thread)');
} catch (e) { fail('create action (same thread)', e.message); }

// 7. Create action with message_id from different thread (should fail — trigger)
// First create another thread+message
let threadId2, messageId2;
try {
  const now = new Date().toISOString();
  const t = db.prepare(`INSERT INTO threads (account_email, gmail_thread_id, created_at, updated_at) VALUES (?,?,?,?)`).run('acct@example.com', 'thread2', now, now);
  threadId2 = t.lastInsertRowid;
  const m = db.prepare(`INSERT INTO messages (account_email, gmail_message_id, gmail_thread_id, thread_id, direction, imported_at) VALUES (?,?,?,?,?,?)`).run('acct@example.com', 'msgX', 'thread2', threadId2, 'in', now);
  messageId2 = m.lastInsertRowid;
} catch (e) { fail('setup second thread', e.message); }

try {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO actions (thread_id, message_id, description, owner, created_at) VALUES (?,?,?,?,?)`
  ).run(threadId, messageId2, 'cross-thread action', 'me', now);
  fail('trigger (cross-thread message)', 'insert succeeded but should have failed');
} catch (e) {
  if (e.message.includes('does not belong')) pass('trigger rejects cross-thread message_id');
  else fail('trigger', e.message);
}

// 8. Soft-delete thread: actions preserved
try {
  const now = new Date().toISOString();
  db.prepare('UPDATE threads SET status=?, deleted_at=?, updated_at=? WHERE id=?').run('archived', now, now, threadId);
  const actionCount = db.prepare('SELECT COUNT(*) AS n FROM actions WHERE thread_id = ?').get(threadId).n;
  if (actionCount === 1) pass('soft-delete preserves actions');
  else fail('soft-delete preserves actions', `expected 1, got ${actionCount}`);
} catch (e) { fail('soft-delete', e.message); }

// 9. Permanent delete blocked by RESTRICT (thread has actions)
try {
  db.prepare('DELETE FROM threads WHERE id = ?').run(threadId);
  fail('RESTRICT on delete', 'delete succeeded but should have failed');
} catch (e) {
  if (e.message.includes('FOREIGN KEY') || e.message.includes('RESTRICT')) pass('RESTRICT blocks delete with actions');
  else fail('RESTRICT', e.message);
}

// 10. Transaction rollback test
try {
  const txn = db.transaction(() => {
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO threads (account_email, gmail_thread_id, created_at, updated_at) VALUES (?,?,?,?)`).run('acct@example.com', 'txn-thread', now, now);
    throw new Error('intentional rollback');
  });
  try { txn(); fail('transaction rollback', 'no exception thrown'); }
  catch (e) {
    const row = db.prepare("SELECT COUNT(*) AS n FROM threads WHERE gmail_thread_id='txn-thread'").get().n;
    if (row === 0) pass('transaction rollback works');
    else fail('transaction rollback', `row persisted (${row})`);
  }
} catch (e) { fail('transaction rollback setup', e.message); }

// 11. Persistence: close and reopen
closeDb();
// Reopen via openDb (should not re-run migration)
process.env.CORRESPONDENCE_DB_PATH = dbPath;
const db2 = openDb(dbPath);
const v2 = db2.pragma('user_version', { simple: true });
const tCount = db2.prepare('SELECT COUNT(*) AS n FROM threads').get().n;
if (v2 === 6 && tCount >= 2) pass(`persistence: v=${v2}, threads=${tCount}`);
else fail('persistence', `v=${v2}, threads=${tCount}`);
db2.close();

// Cleanup
for (const f of [dbPath, dbPath + '-wal', dbPath + '-shm']) {
  try { fs.unlinkSync(f); } catch {}
}
console.log('\nAll tests completed.');