import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lookupKnowledge } from '../src/lib/sora-knowledge-retrieval.mjs';
const pack = JSON.parse(readFileSync(new URL('../src/lib/sora-knowledge.json', import.meta.url)));
test('JSON knowledge pack has unique IDs and complete multilingual answers', () => {
  assert.equal(pack.version, 1);
  assert.ok(pack.entries.length >= 10);
  const ids = new Set();
  for (const entry of pack.entries) {
    assert.ok(!ids.has(entry.id), 'Duplicate knowledge ID: ' + entry.id);
    ids.add(entry.id);
    assert.ok(entry.keywords.length >= 2);
    for (const locale of ['tgl','ceb','en']) assert.ok(entry.answers[locale]?.length > 25, entry.id + ':' + locale);
  }
});
test('matches specific JSON knowledge rather than generic FAQ', () => {
  assert.equal(lookupKnowledge('Paano mag-apply ng Barangay Clearance?', 'tgl', pack)?.knowledgeId, 'document-clearance');
  assert.equal(lookupKnowledge('What about Certificate of Indigency?', 'en', pack)?.knowledgeId, 'document-indigency');
  assert.equal(lookupKnowledge('Naa koy payment status?', 'ceb', pack)?.knowledgeId, 'payment');
});
test('works with network disabled and declines unverified questions', () => {
  const old = globalThis.fetch;
  globalThis.fetch = () => { throw Error('Offline, do not fetch'); };
  try {
    assert.match(lookupKnowledge('office hours', 'en', pack)?.answer ?? '', /offline/i);
    assert.equal(lookupKnowledge('How do black holes form?', 'en', pack), null);
  } finally { globalThis.fetch = old; }
});
test('resists unrelated partial words, arbitrary data, oversized queries', () => {
  assert.equal(lookupKnowledge('my nonclearance', 'en', pack), null);
  assert.equal(lookupKnowledge('a'.repeat(1801), 'en', pack), null);
  assert.equal(lookupKnowledge('', 'tgl', pack), null);
});
