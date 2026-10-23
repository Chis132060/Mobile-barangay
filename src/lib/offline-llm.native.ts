import { isAvailable, prepareBuiltInModel, sendMessage } from 'expo-ai-kit';
export async function askLocalSora(question: string, language: 'tgl' | 'ceb' | 'en'): Promise<string | null> {
  if (!(await isAvailable())) return null;
  // Preparation may require a one-time system model download; only use when installed.
  try {
    await prepareBuiltInModel();
    const instruction = language === 'ceb' ? 'Answer in Cebuano.' : language === 'en' ? 'Answer in English.' : 'Sumagot sa Filipino.';
    const result = await sendMessage([
      { role: 'system', content: `You are Ate Sora, a helpful offline barangay assistant. ${instruction} Never invent live resident records, office hours, fees, ordinances, emergency contacts or current request status. State clearly that you cannot access live information offline. Answer safely and concisely.` },
      { role: 'user', content: question },
    ]);
    return result.text?.trim() || null;
  } catch { return null; }
}

export async function prepareLocalSora(): Promise<'ready' | 'unsupported'> {
  if (!(await isAvailable())) return 'unsupported';
  try { await prepareBuiltInModel(); return 'ready'; } catch { return 'unsupported'; }
}
