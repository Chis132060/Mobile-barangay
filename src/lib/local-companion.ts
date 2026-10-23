// Optional same-device companion for techjarves' Flutter local API.
// Never send tokens, personal records, location, or Supabase data to this service.
// Loopback is fixed to prevent SSRF and accidental remote disclosure.
export const LOCAL_COMPANION_URL = 'http://127.0.0.1:4891/v1/chat/completions';

export async function askLocalCompanion(
  question: string,
  language: 'tgl' | 'ceb' | 'en',
  fetcher: typeof fetch = fetch,
): Promise<string | null> {
  const prompt = question.trim();
  if (!prompt || prompt.length > 1800) return null;
  const instruction = language === 'ceb' ? 'Answer in Cebuano.'
    : language === 'en' ? 'Answer in English.' : 'Sumagot sa Filipino.';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetcher(LOCAL_COMPANION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'local',
        stream: false,
        messages: [
          { role: 'system', content: `You are Ate Sora, an offline barangay guidance assistant. ${instruction} Never invent current fees, rules, office hours, contacts, resident records, payments, or request statuses. Say that no live barangay records are available. Do not claim to be the official source of current barangay policy.` },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('choices' in data)) return null;
    const choices = (data as { choices?: { message?: { content?: unknown } }[] }).choices;
    const answer = choices?.[0]?.message?.content;
    return typeof answer === 'string' && answer.trim() ? answer.trim().slice(0, 4000) : null;
  } catch { return null; }
  finally { clearTimeout(timer); }
}
