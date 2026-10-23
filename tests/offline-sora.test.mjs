import test from 'node:test';
import assert from 'node:assert/strict';
import { offlineSoraReply } from '../src/lib/offline-sora.mjs';

test('answers offline without invoking network', () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Network must not be called'); };
  try {
    const reply = offlineSoraReply('Paano kumuha ng Barangay Clearance?', 'tgl');
    assert.equal(reply?.offline, true);
    assert.equal(reply?.category, 'document');
    assert.match(reply.answer, /offline/i);
  } finally { globalThis.fetch = oldFetch; }
});
test('provides Cebuano and English FAQ replies', () => {
  assert.equal(offlineSoraReply('Unsa ang requirements sa indigency?', 'ceb')?.category, 'document');
  assert.match(offlineSoraReply('What are the office hours?', 'en')?.answer ?? '', /offline/i);
});
test('never invents live status, curfew or fees', () => {
  assert.match(offlineSoraReply('Payment status', 'en')?.answer ?? '', /cannot retrieve/i);
  assert.match(offlineSoraReply('curfew ordinance', 'en')?.answer ?? '', /cannot safely state/i);
});
test('safely handles unknown and empty messages', () => {
  assert.equal(offlineSoraReply('') , null);
  assert.equal(offlineSoraReply('What is quantum entanglement?', 'en')?.category, 'unknown');
});
