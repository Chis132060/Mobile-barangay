import { FOUR_GB_PRESET, prepareSmallDeviceQuestion, boundSmallDeviceReply } from './low-memory-preset.mjs';
import {
  downloadModel, getDownloadableModels, isAvailable,
  prepareBuiltInModel, sendMessage, setModel, stripThinking,
} from 'expo-ai-kit';

const SMALL_MODEL = FOUR_GB_PRESET.model;
// Curated Apache-2.0 model. Roughly 0.5 GB, explicitly downloaded while online.
let activatedDownload = false;

async function activateDownloadedModel(): Promise<boolean> {
  if (activatedDownload) return true;
  try {
    const catalog = await getDownloadableModels();
    const entry = catalog.find(item => item.id === SMALL_MODEL);
    if (!entry?.meetsRequirements || !['downloaded', 'ready'].includes(entry.status)) return false;
    await setModel(SMALL_MODEL);
    activatedDownload = true;
    return true;
  } catch { return false; }
}

export async function askLocalSora(question: string, language: 'tgl' | 'ceb' | 'en'): Promise<string | null> {
  try {
    const downloadedReady = await activateDownloadedModel();
    if (!downloadedReady) {
      if (!(await isAvailable())) return null;
      // Offline generation succeeds if the OS model has previously been prepared.
      await prepareBuiltInModel();
    }
    const compactQuestion = prepareSmallDeviceQuestion(question);
    if (!compactQuestion) return null;
    const instruction = language === 'ceb' ? 'Answer in Cebuano.' : language === 'en' ? 'Answer in English.' : 'Sumagot sa Filipino.';
    const result = await sendMessage([
      { role: 'system', content: `You are Ate Sora, a helpful offline barangay assistant. ${instruction} Never invent live resident records, office hours, fees, ordinances, emergency contacts or current request status. State clearly that you cannot access live information offline. Keep the final reply under ${FOUR_GB_PRESET.targetAnswerWords} words; avoid long reasoning. Answer safely and concisely.` },
      { role: 'user', content: compactQuestion },
    ]);
    // Qwen can emit hidden thinking markers; display only the final answer.
    return boundSmallDeviceReply(stripThinking(result.text || '').text) || null;
  } catch { return null; }
}

export async function prepareLocalSora(): Promise<'ready' | 'unsupported'> {
  try {
    if (await activateDownloadedModel()) return 'ready';
    if (!(await isAvailable())) return 'unsupported';
    await prepareBuiltInModel();
    return 'ready';
  } catch { return 'unsupported'; }
}

export async function downloadSmallOfflineModel(onProgress: (progress: number) => void): Promise<'ready' | 'unsupported'> {
  try {
    const catalog = await getDownloadableModels();
    const entry = catalog.find(item => item.id === SMALL_MODEL);
    if (!entry?.meetsRequirements) return 'unsupported';
    if (!['downloaded', 'ready'].includes(entry.status)) {
      await downloadModel(SMALL_MODEL, { onProgress });
    }
    await setModel(SMALL_MODEL);
    activatedDownload = true;
    return 'ready';
  } catch { return 'unsupported'; }
}
