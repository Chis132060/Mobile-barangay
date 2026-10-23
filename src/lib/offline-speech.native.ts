import { getSpeechRecognitionAvailability, getSupportedSpeechLocales, transcribe } from 'expo-ai-kit';
export async function transcribeOfflineAudio(uri: string, language: 'tgl' | 'ceb' | 'en'): Promise<string | null> {
  const locale = language === 'tgl' ? 'fil-PH' : language === 'ceb' ? 'ceb-PH' : 'en-US';
  try {
    const supported = await getSupportedSpeechLocales();
    if (!supported.some(x => x.toLowerCase() === locale.toLowerCase())) return null;
    const availability = await getSpeechRecognitionAvailability({ locale });
    if (availability.status !== 'available') return null;
    const result = await transcribe({ audio: { uri }, locale });
    return result.text?.trim() || null;
  } catch { return null; }
}
