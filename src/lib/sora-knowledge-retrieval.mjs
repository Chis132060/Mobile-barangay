// Portable, deterministic knowledge retrieval. The caller supplies a validated JSON pack.
// This is grounding/retrieval, not LLM weight training.
const normalize = value => String(value ?? '').toLocaleLowerCase('en').normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export function lookupKnowledge(question, language, pack) {
  const input = normalize(question);
  if (!input || input.length > 1800 || !pack || !Array.isArray(pack.entries)) return null;
  let winner = null;
  let length = 0;
  for (const entry of pack.entries) {
    if (!entry || typeof entry !== 'object' || !Array.isArray(entry.keywords)) continue;
    for (const keyword of entry.keywords) {
      const term = normalize(keyword);
      if (term.length < 5 || term.length <= length) continue;
      if ((' ' + input + ' ').includes(' ' + term + ' ')) { winner = entry; length = term.length; }
    }
  }
  if (!winner) return null;
  const answer = winner.answers?.[language] || winner.answers?.tgl;
  if (typeof answer !== 'string' || !answer.trim()) return null;
  return { answer, category: winner.intent, offline: true, knowledgeId: winner.id };
}
