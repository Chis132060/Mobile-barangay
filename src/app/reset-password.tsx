import { useState } from 'react';
import { router } from 'expo-router';
import { PwaText } from '@/components/pwa-text';
import { Button, C, Card, ErrorBox, Input, Label, Page, Title } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordRoute() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  async function requestReset() {
    const value = email.trim().toLowerCase();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setError('Enter the email associated with your account.'); return; }
    if (!supabase) { setError('Supabase is not configured.'); return; }
    setBusy(true); setError(''); setSuccess(false);
    try {
      // Password-reset links use the hosted PWA callback, ensuring the existing
      // verified server-side reset flow can finish regardless of native deep-link configuration.
      const target = process.env.EXPO_PUBLIC_PWA_API_URL?.replace(/\/$/, '');
      if (!target || !/^https:\/\//.test(target)) throw new Error('A secure public PWA URL must be configured for password recovery.');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(value, { redirectTo: target + '/auth/callback?next=/reset-password' });
      if (resetError) throw resetError;
      setSuccess(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not request password reset.'); }
    finally { setBusy(false); }
  }
  return <Page>
    <Title sub="Recover access using the same credentials as the Resident PWA.">Reset password</Title>
    <Card>
      <Label>Account email</Label>
      <Input value={email} onChangeText={setEmail} placeholder="Enter account email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" accessibilityLabel="Account email" />
      {!!error && <ErrorBox>{error}</ErrorBox>}
      {success && <PwaText style={{ color: C.green }}>If this account exists, password recovery instructions have been sent. Follow the link to complete the reset securely.</PwaText>}
      <Button title="Send reset link" onPress={() => void requestReset()} disabled={busy} loading={busy} />
      <Button title="Back to sign in" secondary onPress={() => router.replace('/login')} />
    </Card>
  </Page>;
}
