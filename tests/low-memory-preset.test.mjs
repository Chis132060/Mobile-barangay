import test from 'node:test';
import assert from 'node:assert/strict';
import { FOUR_GB_PRESET, prepareSmallDeviceQuestion, boundSmallDeviceReply } from '../src/lib/low-memory-preset.mjs';
test('default lightweight model is Qwen3 0.6B', () => {
  assert.equal(FOUR_GB_PRESET.model, 'qwen3-0.6b');
  assert.ok(FOUR_GB_PRESET.maxQuestionCharacters <= 700);
  assert.ok(FOUR_GB_PRESET.maxHistoryTurns === 0);
});
test('large prompts and answers are bounded for low memory mode', () => {
  assert.equal(prepareSmallDeviceQuestion('a'.repeat(1800)).length, FOUR_GB_PRESET.maxQuestionCharacters);
  assert.ok(boundSmallDeviceReply('x'.repeat(6000)).length <= FOUR_GB_PRESET.maxAnswerCharacters + 1);
  assert.equal(prepareSmallDeviceQuestion('   '), '');
  assert.equal(boundSmallDeviceReply('  hello   '), 'hello');
});
