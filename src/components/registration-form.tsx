import { PwaText } from '@/components/pwa-text';
import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Button, C, ErrorBox, Icon } from '@/components/ui';
import { pwaApiUrl } from '@/lib/supabase';

/** Registration must use the existing resident portal's server action.
 * That action creates Auth users with its private server key, uploads ID images,
 * and performs rollback on partial failure. The Expo public client cannot safely
 * reproduce those privileged operations, so this screen opens the canonical PWA.
 */
export function RegistrationForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function openSecureRegistration() {
    if (!pwaApiUrl) {
      setError('Resident registration is unavailable. Set EXPO_PUBLIC_PWA_API_URL to the existing resident portal address.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await WebBrowser.openBrowserAsync(`${pwaApiUrl.replace(/\/$/, '')}/register`, {
        toolbarColor: C.blue,
        showTitle: true,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open secure registration.');
    } finally {
      setBusy(false);
    }
  }

  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: C.white }}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28, backgroundColor: C.white }}>
      <View style={{ width: '100%', maxWidth: 448, alignSelf: 'center', alignItems: 'center', gap: 14 }}>
        <Image source={require('@/assets/images/barangay-logo.png')} resizeMode="contain" style={{ width: 64, height: 64 }} />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <PwaText style={{ fontSize: 20, fontWeight: '700', color: '#111827', letterSpacing: -0.4 }}>Resident Registration</PwaText>
          <PwaText style={{ fontSize: 12, color: '#6b7280' }}>Smart Barangay Online Services</PwaText>
        </View>
        {!!error && <ErrorBox>{error}</ErrorBox>}
        <View style={{ width: '100%', padding: 15, borderRadius: 14, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff', flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Icon name="verified_user" size={18} color={C.blue} />
          <PwaText style={{ flex: 1, color: '#1d4ed8', fontSize: 12, lineHeight: 18 }}>
            Your ID photo and account are submitted through the barangay&apos;s secure registration portal. Continue there to complete the same registration form used by the resident website.
          </PwaText>
        </View>
        <View style={{ width: '100%', gap: 9 }}>
          <Button title={busy ? 'Opening secure registration...' : 'Continue to Registration'} loading={busy} onPress={() => void openSecureRegistration()} />
          <Pressable accessibilityRole="button" onPress={() => router.replace('/login')} style={{ padding: 10 }}>
            <PwaText style={{ textAlign: 'center', color: '#6b7280', fontSize: 12 }}>Already have an account? <PwaText style={{ color: C.blue, fontWeight: '700' }}>Sign In</PwaText></PwaText>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
