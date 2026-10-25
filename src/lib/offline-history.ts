import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type StoredOfflineMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  offline: true;
};

// SecureStore protects native at-rest content. Browser offline history remains
// in memory only because localStorage/AsyncStorage would not be encrypted.
function historyKey(userId?: string | null) {
  return 'sora-offline-' + (userId || 'guest');
}

export async function loadOfflineHistory(userId?: string | null): Promise<StoredOfflineMessage[]> {
  if (Platform.OS === 'web') return [];
  try {
    const value = await SecureStore.getItemAsync(historyKey(userId));
    const parsed: unknown = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StoredOfflineMessage =>
      item && typeof item === 'object' &&
      (item.role === 'user' || item.role === 'assistant') &&
      item.offline === true && typeof item.id === 'string' &&
      typeof item.content === 'string' && item.content.length <= 800).slice(-6);
  } catch { return []; }
}

export async function saveOfflineHistory(userId: string | null | undefined, messages: StoredOfflineMessage[]) {
  if (Platform.OS === 'web') return;
  // Keep encrypted state small and bounded to avoid SecureStore entry-size limits.
  const entries = messages.filter(m => m.offline && m.content.length <= 800).slice(-6);
  while (entries.length && JSON.stringify(entries).length > 1700) entries.shift();
  try {
    if (entries.length) await SecureStore.setItemAsync(historyKey(userId), JSON.stringify(entries));
    else await SecureStore.deleteItemAsync(historyKey(userId));
  } catch { /* Offline history is optional; never block chat responses. */ }
}

export async function clearOfflineHistory(userId?: string | null) {
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(historyKey(userId)).catch(() => undefined);
}
