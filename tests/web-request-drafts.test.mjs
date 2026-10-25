import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { saveWebRequestDraft, readWebRequestDraft, deleteWebRequestDraft } from '../src/lib/web-request-drafts.ts';

test('AES-GCM PWA draft roundtrip, wrong password, user isolation, delete', async (t) => {
  const originalCrypto = globalThis.crypto;
  const originalDb = globalThis.indexedDB;
  const data = new Map();
  const db = {
    objectStoreNames: { contains: () => true },
    createObjectStore: () => undefined,
    close: () => {},
    transaction: () => {
      const tx = {
        objectStore: () => ({
          get: key => ({ result: data.get(key) }),
          put: (value, key) => { data.set(key, value); return { result: key }; },
          delete: key => { data.delete(key); return { result: undefined }; },
        }),
      };
      queueMicrotask(() => tx.oncomplete?.());
      return tx;
    },
  };
  globalThis.crypto = webcrypto;
  globalThis.indexedDB = {
    open: () => {
      const req = { result: db };
      queueMicrotask(() => req.onsuccess?.());
      return req;
    },
  };
  t.after(() => { globalThis.crypto = originalCrypto; globalThis.indexedDB = originalDb; });
  const alice = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  const bob = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
  const pass = 'long private phrase 123';
  await saveWebRequestDraft(alice, 'clearance', 'Need clearance for work', pass);
  assert.equal(data.size, 1);
  const stored = [...data.values()][0];
  assert.equal(JSON.stringify(stored).includes('Need clearance for work'), false, 'plaintext leaked to database');
  assert.equal((await readWebRequestDraft(alice, 'clearance', pass))?.purpose, 'Need clearance for work');
  await assert.rejects(readWebRequestDraft(alice, 'clearance', 'incorrect passphrase'), /unlock/i);
  assert.equal(await readWebRequestDraft(bob, 'clearance', pass), null);
  await deleteWebRequestDraft(alice, 'clearance');
  assert.equal(await readWebRequestDraft(alice, 'clearance', pass), null);
});
