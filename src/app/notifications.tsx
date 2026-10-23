import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { PwaText } from '@/components/pwa-text';
import { Button, C, Card, ErrorBox, Icon, Page, Title } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type Notice = { id: string; title: string; message: string; read_status: boolean; created_at: string };

export default function NotificationsRoute() {
  const [items, setItems] = useState<Notice[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    if (!supabase) { setError('Supabase is not configured.'); return; }
    setBusy(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Please sign in to view notifications.');
      const { data, error: queryError } = await supabase.from('notifications')
        .select('id,title,message,read_status,created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
      if (queryError) throw queryError;
      setItems((data ?? []) as Notice[]);
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load notifications.'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => {
    let active = true;
    let scopedChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
    queueMicrotask(() => { if (active) void reload(); });
    async function subscribeForResident() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      scopedChannel = supabase.channel('native-notification-center-' + user.id)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, () => { if (active) void reload(); }).subscribe();
    }
    void subscribeForResident();
    return () => {
      active = false;
      if (scopedChannel) void supabase?.removeChannel(scopedChannel);
    };
  }, [reload]);
  async function markRead(id: string) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: updateError } = await supabase.from('notifications')
      .update({ read_status: true }).eq('id', id).eq('user_id', user.id);
    if (updateError) { setError(updateError.message); return; }
    setItems(current => current.map(item => item.id === id ? { ...item, read_status: true } : item));
  }
  return <Page>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name="arrow_back" color={C.blue} size={18} /><PwaText style={{ color: C.blue }}>Back</PwaText>
    </Pressable>
    <Title sub="Updates from your barangay staff and resident services.">Notifications</Title>
    {!!error && <ErrorBox>{error}</ErrorBox>}
    <PwaText style={{ fontSize: 12, color: C.muted }}>{items.filter(n => !n.read_status).length} unread</PwaText>
    {items.map(item => <Pressable key={item.id} accessibilityRole="button" onPress={() => void markRead(item.id)}>
      <Card style={{ backgroundColor: item.read_status ? C.white : '#eff6ff', borderColor: item.read_status ? C.border : '#bfdbfe' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
          <PwaText style={{ color: C.text, fontWeight: item.read_status ? '500' : '700', flex: 1 }}>{item.title}</PwaText>
          {!item.read_status && <Icon name="circle" color={C.blue} size={10} />}
        </View>
        <PwaText style={{ color: C.muted, fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</PwaText>
        <PwaText style={{ color: C.text, fontSize: 13 }}>{item.message}</PwaText>
      </Card>
    </Pressable>)}
    {!busy && !items.length && <Card><PwaText style={{ color: C.muted }}>No notifications yet.</PwaText></Card>}
    <Button title={busy ? 'Refreshing...' : 'Refresh notifications'} secondary onPress={() => void reload()} disabled={busy} />
  </Page>;
}
