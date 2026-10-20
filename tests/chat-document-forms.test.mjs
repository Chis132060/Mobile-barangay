import test from 'node:test';
import assert from 'node:assert/strict';
import { requestedChatDocument } from '../src/lib/chat-document-forms.ts';

test('recognizes one explicit PWA document type', () => {
  assert.equal(requestedChatDocument('I need a Barangay Clearance'), 'clearance');
  assert.equal(requestedChatDocument('Please apply for a certificate of indigency'), 'indigency');
  assert.equal(requestedChatDocument('I need proof of residence'), 'residency');
  assert.equal(requestedChatDocument('How can I get a business permit?'), 'business');
});

test('does not open a document form for generic questions or ambiguous requests', () => {
  assert.equal(requestedChatDocument('What services are available?'), null);
  assert.equal(requestedChatDocument('I need a Barangay Clearance and a Business Permit'), null);
});
