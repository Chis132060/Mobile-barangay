import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { C } from '@/components/ui';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ MaterialSymbols: require('../../assets/fonts/MaterialSymbols_400Regular.ttf') });
  if (!fontsLoaded) return null;
  return <><StatusBar style="dark"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg}}}/></>;
}
