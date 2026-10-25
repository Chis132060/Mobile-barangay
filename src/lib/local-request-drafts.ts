// Explicit, local-only request draft. NEVER a submitted request.
// Only document type and purpose are stored; no IDs, files, payments or session tokens.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
export type RequestDraft = { type: string; purpose: string; savedAt: string; status: 'local-only' };
const prefix = 'barangay-local-draft-';
const safeOwner = (owner: string) => /^[a-f0-9-]{12,80}$/i.test(owner);
const makeKey = (owner: string, type: string) => prefix + owner + '-' + type;
const allowedTypes = ['clearance', 'indigency', 'residency', 'business'];
export async function saveRequestDraft(owner: string | null, type: string, purpose: string): Promise<boolean> {
  if (Platform.OS === 'web' || !owner || !safeOwner(owner) || !allowedTypes.includes(type) || purpose.length > 1200) return false;
  try {
    await SecureStore.setItemAsync(makeKey(owner,type), JSON.stringify({type,purpose,savedAt:new Date().toISOString(),status:'local-only'} satisfies RequestDraft));
    return true;
  } catch { return false; }
}
export async function readRequestDraft(owner: string | null, type: string): Promise<RequestDraft | null> {
  if (Platform.OS === 'web' || !owner || !safeOwner(owner) || !allowedTypes.includes(type)) return null;
  try {
    const raw = await SecureStore.getItemAsync(makeKey(owner,type));
    if (!raw) return null;
    const obj: unknown = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return null;
    const draft = obj as Partial<RequestDraft>;
    return draft.type === type && draft.status === 'local-only' && typeof draft.purpose === 'string' && draft.purpose.length <= 1200 && typeof draft.savedAt === 'string'
      ? draft as RequestDraft : null;
  } catch { return null; }
}
export async function clearRequestDraft(owner: string | null, type: string): Promise<void> {
  if (Platform.OS === 'web' || !owner || !safeOwner(owner) || !allowedTypes.includes(type)) return;
  await SecureStore.deleteItemAsync(makeKey(owner,type)).catch(() => undefined);
}
