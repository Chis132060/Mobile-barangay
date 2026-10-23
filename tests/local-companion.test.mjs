import test from 'node:test';
import assert from 'node:assert/strict';
import { askLocalCompanion, LOCAL_COMPANION_URL } from '../src/lib/local-companion.ts';

test('companion targets fixed loopback only', () => {
  assert.equal(LOCAL_COMPANION_URL, 'http://127.0.0.1:4891/v1/chat/completions');
});
test('sends only system guidance and user question, never auth credentials', async () => {
  let captured;
  const mock = async (url, init) => {
    captured = { url, ...init };
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'Local response' } }] }) };
  };
  const result = await askLocalCompanion('Kumusta?', 'tgl', mock);
  assert.equal(result, 'Local response');
  assert.equal(captured.url, LOCAL_COMPANION_URL);
  assert.equal(captured.headers.Authorization, undefined);
  const payload = JSON.parse(captured.body);
  assert.deepEqual(payload.messages.map(m => m.role), ['system', 'user']);
  assert.equal(payload.messages[1].content, 'Kumusta?');
});
test('returns null for missing model or malformed response', async () => {
  const unavailable = async () => ({ ok: false });
  assert.equal(await askLocalCompanion('Hello', 'en', unavailable), null);
  const malformed = async () => ({ ok: true, json: async () => ({ choices: [] }) });
  assert.equal(await askLocalCompanion('Hello', 'en', malformed), null);
});
test('rejects oversized questions before accessing localhost', async () => {
  let called = false;
  assert.equal(await askLocalCompanion('A'.repeat(1801), 'en', async () => { called = true; }), null);
  assert.equal(called, false);
});
