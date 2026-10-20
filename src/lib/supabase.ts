import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const webStore = {
  getItem: (key: string) => Promise.resolve(typeof localStorage === 'undefined' ? null : localStorage.getItem(key)),
  setItem: (key: string, value: string) => { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); return Promise.resolve(); },
  removeItem: (key: string) => { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); return Promise.resolve(); },
};
const store = {
  getItem: (key: string) => Platform.OS === 'web' ? webStore.getItem(key) : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => Platform.OS === 'web' ? webStore.setItem(key, value) : SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => Platform.OS === 'web' ? webStore.removeItem(key) : SecureStore.deleteItemAsync(key),
};

/** Resolve the checked-in LAN placeholders against the host running Expo.
 * On web, use the browser's hostname. In Expo Go, hostUri is the dev machine's LAN address.
 */
function resolveServiceUrl(configured: string | undefined): string {
  if (!configured) return '';
  try {
    const parsed = new URL(configured);
    if (/^(your_lan_ip|your-host|YOUR_LAN_IP)$/i.test(parsed.hostname)) {
      const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
      const runtimeHost = Platform.OS === 'web'
        ? (typeof window !== 'undefined' ? window.location.hostname : '')
        : (expoHost || '');
      if (!runtimeHost || /^(your_lan_ip|your-host)$/i.test(runtimeHost)) return '';
      parsed.hostname = runtimeHost;
      return parsed.toString().replace(/\/$/, '');
    }
    return configured.replace(/\/$/, '');
  } catch {
    return configured.replace(/\/$/, '');
  }
}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = url && anon ? createClient(url, anon, {
  auth: { storage: store, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
}) : null;
export const apiBaseUrl = resolveServiceUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
export const pwaApiUrl = resolveServiceUrl(process.env.EXPO_PUBLIC_PWA_API_URL);

export async function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured. Add the existing project URL and anon key to .env.local.');
  return supabase;
}

