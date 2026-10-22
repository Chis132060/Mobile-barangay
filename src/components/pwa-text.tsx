import { Text, StyleSheet, TextProps } from 'react-native';

export const PWA_FONTS = {
  Inter_400Regular: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  Inter_500Medium: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  Inter_600SemiBold: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  Inter_700Bold: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  Inter_800ExtraBold: require('@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf'),
};

export function PwaText({ style, ...props }: TextProps) {
  const weight = StyleSheet.flatten(style)?.fontWeight;
  const family = weight === '800' || weight === '900' || weight === 'bold' ? 'Inter_800ExtraBold'
    : weight === '700' ? 'Inter_700Bold'
      : weight === '600' ? 'Inter_600SemiBold'
        : weight === '500' ? 'Inter_500Medium' : 'Inter_400Regular';
  return <Text {...props} style={[{ fontFamily: family }, style]} />;
}\n