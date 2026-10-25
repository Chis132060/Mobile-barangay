// Conservative default for 4 GB RAM Android devices.
// A short input/output budget avoids unnecessarily long generations.
// Actual memory allocation and token caps depend on the native runtime.
export const FOUR_GB_PRESET = Object.freeze({
  model: 'qwen3-0.6b',
  maxQuestionCharacters: 700,
  maxAnswerCharacters: 900,
  targetAnswerWords: 120,
  maxHistoryTurns: 0,
});
export function prepareSmallDeviceQuestion(question) {
  const input = String(question ?? '').trim();
  return input ? input.slice(0, FOUR_GB_PRESET.maxQuestionCharacters) : '';
}
export function boundSmallDeviceReply(reply) {
  const output = String(reply ?? '').trim();
  return output.length > FOUR_GB_PRESET.maxAnswerCharacters
    ? output.slice(0, FOUR_GB_PRESET.maxAnswerCharacters).trimEnd() + '…'
    : output;
}
