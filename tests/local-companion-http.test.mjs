import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { askLocalCompanion } from '../src/lib/local-companion.ts';

test('real HTTP loopback: Ate Sora talks to an OpenAI-compatible local server', async (t) => {
  const received = [];
  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    received.push({ method: req.method, url: req.url, body: JSON.parse(body) });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: 'Kamusta! Lokal akong tumatakbo.' } }] }));
  });
  try { await new Promise((resolve, reject) => server.once('error', reject).listen(4891, '127.0.0.1', resolve)); }
  catch (err) {
    if (err.code === 'EADDRINUSE') { t.skip('Port 4891 already in use by another local test service'); return; }
    throw err;
  }
  try {
    const answer = await askLocalCompanion('Hello from offline phone', 'en');
    assert.equal(answer, 'Kamusta! Lokal akong tumatakbo.');
    assert.equal(received.length, 1);
    assert.equal(received[0].method, 'POST');
    assert.equal(received[0].url, '/v1/chat/completions');
    assert.equal(received[0].body.stream, false);
    assert.equal(received[0].body.model, 'local');
    assert.deepEqual(received[0].body.messages.map(m => m.role), ['system', 'user']);
    assert.equal(received[0].body.messages[1].content, 'Hello from offline phone');
  } finally { await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve())); }
});
