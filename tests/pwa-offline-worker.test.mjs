import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const code = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const listeners = {};
const context = {
  self: { location: { origin: 'https://barangay.example' }, addEventListener: (type, fn) => { listeners[type] = fn; } },
  URL, Request, Response, caches: {}, fetch: async () => { throw new Error('unexpected fetch'); },
};
vm.runInNewContext(code, context, { filename: 'sw.js' });
function intercepted(url, { method = 'GET', authorization = false, mode = 'same-origin' } = {}) {
  let response = null;
  const headers = authorization ? { Authorization: 'Bearer secret' } : {};
  const request = new Request(url, { method, headers });
  // Node's Request cannot be created with navigate mode; simulate the browser event.
  if (mode === 'navigate') Object.defineProperty(request, 'mode', { value: 'navigate' });
  const event = { request, respondWith: p => { response = p; } };
  listeners.fetch(event);
  return response !== null;
}
test('PWA registers install/activate/fetch handlers', () => {
  assert.equal(typeof listeners.install, 'function');
  assert.equal(typeof listeners.activate, 'function');
  assert.equal(typeof listeners.fetch, 'function');
});
test('PWA never intercepts Supabase/API, authenticated requests, or writes', () => {
  assert.equal(intercepted('https://barangay.example/api/payments'), false);
  assert.equal(intercepted('https://barangay.example/rest/v1/document_requests'), false);
  assert.equal(intercepted('https://barangay.example/storage/user-photo.png'), false);
  assert.equal(intercepted('https://barangay.example/assets/private.png', { authorization: true }), false);
  assert.equal(intercepted('https://barangay.example/assets/file.png', { method: 'POST' }), false);
  assert.equal(intercepted('https://other.example/assets/file.js'), false);
});
test('PWA handles same-origin navigation and public static assets', () => {
  assert.equal(intercepted('https://barangay.example/requests', { mode: 'navigate' }), true);
  assert.equal(intercepted('https://barangay.example/_expo/static/js/web.js'), true);
  assert.equal(intercepted('https://barangay.example/assets/icon.png'), true);
  assert.equal(intercepted('https://barangay.example/assets/icon.png?token=private'), false);
});
