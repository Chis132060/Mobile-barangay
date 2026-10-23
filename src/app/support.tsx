import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { PwaText } from '@/components/pwa-text';
import { Button, C, Card, ErrorBox, Input, Page, Title } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type Ticket = { id: string; category: string; subject: string; description: string; status: string; staff_reply: string | null; created_at: string };
const categories = ['Account', 'Documents', 'Technical', 'Privacy', 'Other'] as const;
type Category = typeof categories[number];

export default function SupportRoute() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [category, setCategory] = useState<Category>('Account');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!supabase) throw new Error('Supabase configuration is missing.');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Please sign in to manage support tickets.');
      const { data, error: queryError } = await supabase.from('support_tickets')
        .select('id,category,subject,description,status,staff_reply,created_at')
        .eq('resident_user_id', user.id).order('created_at', { ascending: false }).limit(50);
      if (queryError) throw queryError;
      setTickets((data ?? []) as Ticket[]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load tickets.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    let scopedChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
    queueMicrotask(() => { if (active) void reload(); });
    async function subscribeForResident() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      scopedChannel = supabase.channel('mobile-resident-support-' + user.id)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'support_tickets',
          filter: `resident_user_id=eq.${user.id}`,
        }, () => { if (active) void reload(); }).subscribe();
    }
    void subscribeForResident();
    return () => {
      active = false;
      if (scopedChannel) void supabase?.removeChannel(scopedChannel);
    };
  }, [reload]);

  async function submit() {
    if (busy) return;
    const s = subject.trim(), d = description.trim();
    if (!s || !d) { setError('Please enter a subject and description.'); return; }
    if (s.length > 160 || d.length > 5000) { setError('Subject or description is too long.'); return; }
    setBusy(true); setError('');
    try {
      if (!supabase) throw new Error('Supabase configuration is missing.');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Please sign in first.');
      const { error: insertError } = await supabase.from('support_tickets')
        .insert({ resident_user_id: user.id, category, subject: s, description: d });
      if (insertError) throw insertError;
      setSubject(''); setDescription('');
      Alert.alert('Submitted', 'Your support ticket has been sent to barangay staff.');
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Ticket submission failed.'); }
    finally { setBusy(false); }
  }

  return <Page>
    <Pressable onPress={() => router.back()} accessibilityRole="button"><PwaText style={{ color: C.blue, fontWeight: '700' }}>‹ Back</PwaText></Pressable>
    <Title sub="Send a concern to barangay staff and track their response.">Help & Support</Title>
    <Card>
      <PwaText style={{ fontSize: 16, fontWeight: '700', color: C.text }}>Frequently asked questions</PwaText>
      <PwaText style={{ fontWeight: '700', color: C.text }}>How do I verify my account?</PwaText>
      <PwaText style={{ color: C.muted, fontSize: 13 }}>Barangay staff review your registration and ID. View the Pending Approval screen for your current status.</PwaText>
      <PwaText style={{ fontWeight: '700', color: C.text }}>How do I track a request?</PwaText>
      <PwaText style={{ color: C.muted, fontSize: 13 }}>Open Requests to see its status, payment, and pickup instructions.</PwaText>
      <PwaText style={{ fontWeight: '700', color: C.text }}>What if registration is rejected?</PwaText>
      <PwaText style={{ color: C.muted, fontSize: 13 }}>Review the rejection reason, then ask staff for guidance with a support ticket.</PwaText>
      <PwaText style={{ fontWeight: '700', color: C.text }}>How is my data protected?</PwaText>
      <PwaText style={{ color: C.muted, fontSize: 13 }}>Never share passwords or verification codes. Use the Privacy category for personal data requests.</PwaText>
    </Card>
    <Card>
      <PwaText style={{ fontSize: 16, fontWeight: '700', color: C.text }}>New support ticket</PwaText>
      <PwaText style={{ color: C.muted, fontSize: 12 }}>Never include passwords or verification codes.</PwaText>
      <PwaText style={{ color: C.text, fontWeight: '600' }}>Category</PwaText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {categories.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: category === item }}
          onPress={() => setCategory(item)} style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: category === item ? C.blue : C.border, backgroundColor: category === item ? '#eff6ff' : C.white }}>
          <PwaText style={{ fontSize: 12, color: category === item ? C.blue : C.text }}>{item}</PwaText>
        </Pressable>)}
      </View>
      <Input accessibilityLabel="Ticket subject" placeholder="Subject" value={subject} onChangeText={setSubject} maxLength={160} />
      <Input accessibilityLabel="Describe your concern" placeholder="Describe your concern" value={description} onChangeText={setDescription} maxLength={5000} multiline style={{ minHeight: 115, textAlignVertical: 'top' }} />
      {!!error && <ErrorBox>{error}</ErrorBox>}
      <Button title={busy ? 'Submitting...' : 'Submit ticket'} onPress={() => void submit()} disabled={busy} />
    </Card>
    <Title sub="Tickets are shared with the PWA and authorized admin staff.">My tickets</Title>
    {loading ? <PwaText style={{ color: C.muted }}>Loading tickets...</PwaText> : tickets.length === 0 ? <Card><PwaText style={{ color: C.muted }}>No tickets yet.</PwaText></Card> :
      tickets.map(ticket => <Card key={ticket.id}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
          <PwaText style={{ color: C.text, fontWeight: '700', flex: 1 }}>{ticket.subject}</PwaText>
          <PwaText style={{ color: C.blue, fontWeight: '700', fontSize: 12 }}>{ticket.status}</PwaText>
        </View>
        <PwaText style={{ color: C.muted, fontSize: 12 }}>{ticket.category} · {new Date(ticket.created_at).toLocaleDateString()}</PwaText>
        <PwaText style={{ color: C.text }}>{ticket.description}</PwaText>
        {ticket.staff_reply ? <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#eff6ff' }}>
          <PwaText style={{ fontWeight: '700', color: C.blue }}>Barangay staff reply</PwaText>
          <PwaText style={{ color: C.text }}>{ticket.staff_reply}</PwaText>
        </View> : null}
      </Card>)}
    <Button title="Refresh" secondary onPress={() => void reload()} />
  </Page>;
}
