import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { C } from '@/components/ui';
import { PWA_FONTS } from '@/components/pwa-text';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    // Production HTTPS (or localhost) only; Expo dev server should not be cached.
    if (typeof window === 'undefined' || (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost')) return;
    if (process.env.NODE_ENV !== 'production') return;
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
  }, []);
  const [fontsLoaded] = useFonts({ MaterialSymbols: require('../../assets/fonts/MaterialSymbols_400Regular.ttf'), ...PWA_FONTS });
  if (!fontsLoaded) return null;
  const webShell = Platform.OS === 'web'
    ? { maxWidth: 448, width: '100%' as const, alignSelf: 'center' as const, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 18, elevation: 5 }
    : {};
  return <><StatusBar style="dark"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg,...webShell}}}/></>;
}
