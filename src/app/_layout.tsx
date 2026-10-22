import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { C } from '@/components/ui';
import { PWA_FONTS } from '@/components/pwa-text';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ MaterialSymbols: require('../../assets/fonts/MaterialSymbols_400Regular.ttf'), ...PWA_FONTS });
  if (!fontsLoaded) return null;
  const webShell = Platform.OS === 'web'
    ? { maxWidth: 448, width: '100%' as const, alignSelf: 'center' as const, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 18, elevation: 5 }
    : {};
  return <><StatusBar style="dark"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg,...webShell}}}/></>;
}
