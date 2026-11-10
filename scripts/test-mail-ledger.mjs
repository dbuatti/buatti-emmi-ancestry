// Run: pnpm test:ledger
import assert from 'node:assert/strict';
import { buildLedger, classifyMessage, partyKey, cleanSubject, ledgerTotals } from '../src/lib/mail-ledger.ts';

let failures = 0, n = 0;
const check = (name, fn) => { n++; try { fn(); console.log('ok  ', name); } catch (e) { failures++; console.log('FAIL', name, '\n     ', e.message); } };
const ME = ['info@danielebuatti.com', 'daniele.buatti@gmail.com'];
let id = 0;
const out = (thread, to, at, subject = 'Richiesta atto') => ({ id: ++id, thread, direction: 'out', fromEmail: ME[0], to: [to], subject, at });
const inn = (thread, from, at, subject = 'Re: Richiesta atto', fromName) => ({ id: ++id, thread, direction: 'in', fromEmail: from, fromName, to: [ME[0]], subject, at });
const NOW = new Date('2026-11-10T00:00:00Z');

check('classify: PEC receipts are not replies', () => {
  assert.equal(classifyMessage({ direction: 'in', fromEmail: 'posta-certificata@pec.aruba.it', subject: 'CONSEGNA: Richiesta atto' }), 'receipt');
  assert.equal(classifyMessage({ direction: 'in', fromEmail: 'x@pec.it', subject: 'ACCETTAZIONE: Richiesta' }), 'receipt');
  assert.equal(classifyMessage({ direction: 'in', fromEmail: 'x@pec.it', subject: 'AVVISO DI NON ACCETTAZIONE: Richiesta' }), 'receipt');
  assert.equal(classifyMessage({ direction: 'in', fromEmail: 'mailer-daemon@googlemail.com', subject: 'Delivery Status Notification' }), 'receipt');
});
check('classify: auto-replies are not replies', () => {
  assert.equal(classifyMessage({ direction: 'in', fromEmail: 'noreply@formresponse.com', subject: 'Grazie' }), 'auto');
  assert.equal(classifyMessage({ direction: 'in', fromEmail: 'ufficio@comune.ap.it', subject: 'Risposta automatica: Richiesta' }), 'auto');
});
check('classify: a real answer is a reply; PEC-wrapped real mail too', () => {
  assert.equal(classifyMessage({ direction: 'in', fromEmail: 'comune.ap@pec.it', subject: 'POSTA CERTIFICATA: Riscontro richiesta prot. 66127' }), 'reply');
  assert.equal(classifyMessage({ direction: 'in', fromEmail: 'rosa@comunesbt.it', subject: 'R: Richiesta atto' }), 'reply');
  assert.equal(classifyMessage({ direction: 'out', fromEmail: ME[0], subject: 'CONSEGNA' }), 'sent');
});
check('partyKey groups offices by domain, keeps private addresses apart', () => {
  assert.equal(partyKey('Protocollo@Comune.AP.it'), 'comune.ap.it');
  assert.equal(partyKey('anagrafe@comune.ap.it'), 'comune.ap.it');
  assert.equal(partyKey('zia.maria@gmail.com'), 'zia.maria@gmail.com');
  assert.equal(partyKey('comune.ap@pec.it'), 'comune.ap@pec.it');
});
check('cleanSubject strips stacked prefixes', () => assert.equal(cleanSubject('POSTA CERTIFICATA: R: I: Richiesta atto'), 'Richiesta atto'));

check('sent, then only PEC receipts → still waiting (the key case)', () => {
  const rows = buildLedger([
    out('t1', 'protocollo@comune.ap.it', '2026-10-01T10:00:00Z'),
    inn('t1', 'posta-certificata@pec.aruba.it', '2026-10-01T10:00:05Z', 'ACCETTAZIONE: Richiesta atto'),
    inn('t1', 'posta-certificata@pec.aruba.it', '2026-10-01T10:00:09Z', 'CONSEGNA: Richiesta atto'),
  ], ME, NOW);
  assert.equal(rows.length, 1);
  const r = rows[0];
  assert.deepEqual([r.key, r.sent, r.replies, r.receipts, r.state, r.daysWaiting], ['comune.ap.it', 1, 0, 2, 'waiting', 39]);
});

check('real reply after last sent → answered; a later chase flips back to waiting', () => {
  const base = [out('t1', 'a@comune.x.it', '2026-09-01T00:00:00Z'), inn('t1', 'b@comune.x.it', '2026-09-10T00:00:00Z')];
  assert.equal(buildLedger(base, ME, NOW)[0].state, 'answered');
  const chased = buildLedger([...base, out('t1', 'a@comune.x.it', '2026-11-05T00:00:00Z', 'Sollecito')], ME, NOW)[0];
  assert.deepEqual([chased.state, chased.daysWaiting, chased.sent, chased.replies, chased.lastSubject], ['waiting', 5, 2, 1, 'Sollecito']);
});

check('auto-reply does not count as an answer', () => {
  const r = buildLedger([
    out('t9', 'ufficio@consolato.example', '2026-08-11T00:00:00Z'),
    inn('t9', 'noreply@formresponse.com', '2026-08-11T00:01:00Z', 'Grazie! La Sua richiesta è stata ricevuta'),
  ], ME, NOW)[0];
  assert.deepEqual([r.key, r.state, r.autoReplies, r.replies], ['consolato.example', 'waiting', 1, 0]);
});

check('incoming-only correspondent; two addresses at one office merge; threads counted', () => {
  const rows = buildLedger([
    inn('t2', 'cugino@gmail.com', '2026-10-20T00:00:00Z', 'Foto di nonno', 'Cugino Pippo'),
    out('t3', 'anagrafe@comune.y.it', '2026-10-01T00:00:00Z'),
    out('t4', 'protocollo@comune.y.it', '2026-10-02T00:00:00Z'),
  ], ME, NOW);
  const office = rows.find((r) => r.key === 'comune.y.it');
  assert.deepEqual([office.sent, office.threads, office.addresses.length], [2, 2, 2]);
  const cousin = rows.find((r) => r.key === 'cugino@gmail.com');
  assert.deepEqual([cousin.state, cousin.name, cousin.daysWaiting], ['incoming', 'Cugino Pippo', null]);
});

check('order: longest wait first, then answered, then incoming; mail to self ignored', () => {
  const rows = buildLedger([
    out('a', 'x@one.it', '2026-11-01T00:00:00Z'),
    out('b', 'x@two.it', '2026-09-01T00:00:00Z'),
    out('c', 'x@three.it', '2026-09-01T00:00:00Z'), inn('c', 'x@three.it', '2026-09-02T00:00:00Z'),
    inn('d', 'x@four.it', '2026-09-02T00:00:00Z'),
    out('e', ME[1], '2026-09-02T00:00:00Z'),
  ], ME, NOW);
  assert.deepEqual(rows.map((r) => r.key), ['two.it', 'one.it', 'three.it', 'four.it']);
  assert.deepEqual(ledgerTotals(rows), { sent: 3, replies: 2, receipts: 0, autoReplies: 0, waiting: 2, overdue: 1 });
});

check('orphan receipts (no thread conversation) are dropped, not shown as a correspondent', () => {
  assert.deepEqual(buildLedger([inn('z', 'posta-certificata@pec.aruba.it', '2026-10-01T00:00:00Z', 'CONSEGNA: x')], ME, NOW), []);
});

console.log(failures ? `${failures} of ${n} failed` : `all ${n} passed`);
if (failures) process.exit(1);
