import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button, C, Card, Chip, ErrorBox, Icon, Label, Row, Title } from '@/components/ui';

type Announcement = {
  id: string; title: string; description: string; category: string;
  created_at: string; event_start_at: string | null; event_end_at: string | null; venue: string | null;
};
type Program = {
  id: string; name: string; description: string | null; category: string; status: string;
  image_url: string | null; purok: string | null; venue: string | null; schedule_details: string | null;
  requirements: string | null; registration_open: boolean; registration_deadline: string | null;
  registration_opens_at: string | null; event_start_at: string | null; event_end_at: string | null;
  max_participants: number | null; min_age: number | null; max_age: number | null;
};
type Application = { program_id: string; status: string; rejection_reason: string | null; created_at: string };

const phDate = (date: string) => new Date(date).toLocaleString('en-PH', {
  timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short',
});

export function UpdatesScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'programs' | 'announcements'>('programs');
  const [category, setCategory] = useState('All');
  const [showApplications, setShowApplications] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [annResult, programResult] = await Promise.all([
        supabase.from('announcements')
          .select('id,title,description,category,created_at,event_start_at,event_end_at,venue')
          .eq('status', 'Published').order('created_at', { ascending: false }),
        supabase.from('barangay_programs')
          .select('id,name,description,category,status,image_url,purok,venue,schedule_details,requirements,registration_open,registration_deadline,registration_opens_at,event_start_at,event_end_at,max_participants,min_age,max_age')
          .eq('is_public', true).in('status', ['Active', 'On Hold'])
          .order('created_at', { ascending: false }),
      ]);
      if (!annResult.error) setAnnouncements((annResult.data || []) as Announcement[]);
      if (!programResult.error) setPrograms((programResult.data || []) as Program[]);
      const queryErrors = [annResult.error?.message, programResult.error?.message].filter(Boolean);
      if (queryErrors.length) setError(`Unable to load some updates: ${queryErrors.join('; ')}`);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: resident, error: residentError } = await supabase
          .from('residents').select('id').eq('user_id', user.id).maybeSingle();
        if (residentError) throw residentError;
        if (resident) {
          const { data, error: applicationError } = await supabase
            .from('program_enrollees')
            .select('program_id,status,rejection_reason,created_at')
            .eq('resident_id', resident.id);
          if (applicationError) throw applicationError;
          setApplications((data || []) as Application[]);
        }
      } else setApplications([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load updates.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const loadTimer = setTimeout(() => void load(), 0);
    const clockTimer = setTimeout(() => setNow(Date.now()), 0);
    const clockInterval = setInterval(() => setNow(Date.now()), 60_000);
    if (!supabase) return () => { clearTimeout(loadTimer); clearTimeout(clockTimer); clearInterval(clockInterval); };
    const client = supabase;
    const channel = client.channel('resident-mobile-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barangay_programs' }, () => void load())
      .subscribe();
    return () => { clearTimeout(loadTimer); clearTimeout(clockTimer); clearInterval(clockInterval); void client.removeChannel(channel); };
  }, [load]);

  async function joinProgram(programId: string) {
    if (!supabase || applying) return;
    setApplying(programId); setMessage('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Please sign in before applying.');
      const { error: applyError } = await supabase.rpc('apply_to_barangay_program', { p_program_id: programId });
      if (applyError) throw applyError;
      setMessage('Application submitted. Await barangay review.');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to submit application.');
    } finally { setApplying(null); }
  }

  const categories = ['All', ...new Set(programs.map((p) => p.category))];
  const canApply = (p: Program) => p.status === 'Active' && p.registration_open
    && now > 0
    && (!p.registration_opens_at || new Date(p.registration_opens_at).getTime() <= now)
    && (!p.registration_deadline || new Date(p.registration_deadline).getTime() >= now)
    && (!p.event_start_at || new Date(p.event_start_at).getTime() > now)
    && !applications.some((a) => a.program_id === p.id);

  return <View style={{ flex: 1, backgroundColor: C.bg }}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 14 }}>
      <Row><Title sub="Programs and official announcements from Barangay Hall">Barangay Updates</Title>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh updates" onPress={() => void load()} style={{ padding: 8 }}>
          <Icon name="refresh" color={loading ? C.blue : C.muted} />
        </Pressable>
      </Row>
      {!!error && <ErrorBox>{error}</ErrorBox>}
      {!!message && <View accessibilityRole="alert" style={{ padding: 12, borderRadius: 12, backgroundColor: '#eff6ff' }}>
        <Text style={{ color: '#1e40af', fontSize: 12 }}>{message}</Text>
      </View>}
      <View style={{ flexDirection: 'row', padding: 4, gap: 5, borderRadius: 16, backgroundColor: '#f1f5f9' }}>
        {(['programs', 'announcements'] as const).map((section) => <Pressable key={section} onPress={() => setTab(section)}
          style={{ flex: 1, padding: 11, borderRadius: 12, alignItems: 'center', backgroundColor: tab === section ? C.white : 'transparent' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === section ? '#1d4ed8' : C.muted }}>
            {section === 'programs' ? 'Programs' : 'Announcements'}
          </Text>
        </Pressable>)}
      </View>

      {tab === 'programs' ? <>
        <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
          <Pressable onPress={() => setShowApplications((v) => !v)} style={{ padding: 15 }}>
            <Row><Text style={{ fontSize: 13, fontWeight: '800', color: C.text }}>My Program Applications</Text>
              <Text style={{ fontSize: 11, color: C.muted }}>{applications.length} {showApplications ? '▲' : '▼'}</Text></Row>
          </Pressable>
          {showApplications && <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 8 }}>
            {applications.length === 0 ? <Text style={{ fontSize: 12, color: C.muted }}>No applications yet.</Text> : applications.map((a) => <View key={a.program_id} style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, gap: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>{programs.find((p) => p.id === a.program_id)?.name || 'Program'}</Text>
              <Text style={{ fontSize: 11, color: C.muted }}>Status: {a.status}</Text>
              <Text style={{ fontSize: 11, color: C.muted }}>Applied: {new Date(a.created_at).toLocaleDateString()}</Text>
              {!!a.rejection_reason && <Text style={{ fontSize: 11, color: C.red }}>Reason: {a.rejection_reason}</Text>}
            </View>)}
          </View>}
        </Card>
        <Row><Label>Barangay Programs</Label><Text style={{ fontSize: 11, color: C.muted }}>{programs.length} available</Text></Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          {categories.map((c) => <Chip key={c} title={c} active={category === c} onPress={() => setCategory(c)} />)}
        </ScrollView>
        {loading && programs.length === 0 ? <ActivityIndicator color={C.blue} /> : programs.length === 0
          ? <Card><Text style={{ fontSize: 12, color: C.muted, textAlign: 'center' }}>No active barangay programs have been published by the barangay yet. Please check back for official registration updates.</Text></Card>
          : programs.filter((p) => category === 'All' || p.category === category).map((p) => <Card key={p.id}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: C.blue }}>{p.category}</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: C.text }}>{p.name}</Text>
            {!!p.image_url && <Image source={{ uri: p.image_url }} accessibilityLabel={p.name} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />}
            {p.status === 'On Hold' && <Text style={{ padding: 9, borderRadius: 9, backgroundColor: '#fffbeb', color: '#92400e', fontSize: 11, lineHeight: 16 }}>Historical / citywide reference only. Not confirmed as a current barangay program. No registration available; please verify with the barangay office.</Text>}
            {!!p.description && <Text style={{ fontSize: 12, lineHeight: 18, color: '#475569' }}>{p.description}</Text>}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, color: C.muted }}>Area: {p.purok || 'All Puroks'}</Text>
              {!!p.venue && <Text style={{ fontSize: 11, color: C.muted }}>Venue: {p.venue}</Text>}
              {!!p.event_start_at && <Text style={{ fontSize: 11, color: C.blue, fontWeight: '700' }}>Event: {phDate(p.event_start_at)} (PH time)</Text>}
              {!!p.event_end_at && now > 0 && new Date(p.event_end_at).getTime() < now && <Text style={{ fontSize: 11, fontWeight: '700', color: C.muted }}>Completed</Text>}
              {!!p.schedule_details && <Text style={{ fontSize: 11, color: C.muted }}>Schedule notes: {p.schedule_details}</Text>}
              {!!p.requirements && <Text style={{ fontSize: 11, lineHeight: 16, color: C.muted }}>Requirements: {p.requirements}</Text>}
              {!!p.registration_opens_at && <Text style={{ fontSize: 11, color: C.muted }}>Applications open: {phDate(p.registration_opens_at)}</Text>}
              {!!p.registration_deadline && <Text style={{ fontSize: 11, color: C.muted }}>Apply by: {phDate(p.registration_deadline)}</Text>}
              {!!p.max_participants && <Text style={{ fontSize: 11, color: C.muted }}>Capacity: {p.max_participants} slots (subject to availability)</Text>}
              {(p.min_age || p.max_age) && <Text style={{ fontSize: 11, color: C.muted }}>Age: {p.min_age || 'Any'} – {p.max_age || 'Any'}</Text>}
              <Text style={{ fontSize: 11, fontWeight: '700', color: p.registration_open ? C.green : '#b45309' }}>{p.registration_open ? 'Registration Open' : 'Registration Closed'}</Text>
            </View>
            <Button title={applications.find((a) => a.program_id === p.id)?.status ? `Application: ${applications.find((a) => a.program_id === p.id)?.status}` : applying === p.id ? 'Submitting...' : 'Join Program'}
              disabled={!canApply(p) || applying !== null} loading={applying === p.id} onPress={() => void joinProgram(p.id)} />
          </Card>)}
      </> : <>
        <Label>Barangay Announcements</Label>
        {loading && announcements.length === 0 ? <ActivityIndicator color={C.blue} /> : announcements.length === 0
          ? <Card><Text style={{ textAlign: 'center', color: C.muted, fontSize: 12 }}>No announcements yet.</Text></Card>
          : announcements.map((a) => <Card key={a.id}>
            <Row><Text style={{ fontSize: 10, fontWeight: '800', color: C.blue, textTransform: 'uppercase' }}>{a.category}</Text>
              <Text style={{ fontSize: 10, color: C.muted }}>{new Date(a.created_at).toLocaleDateString()}</Text></Row>
            <Text style={{ fontSize: 15, fontWeight: '800', color: C.text }}>{a.title}</Text>
            {!!a.event_start_at && <Text style={{ fontSize: 11, color: C.blue, fontWeight: '700' }}>Event: {phDate(a.event_start_at)} (PH time)</Text>}
            {!!a.venue && <Text style={{ fontSize: 11, color: C.muted }}>Venue: {a.venue}</Text>}
            <Text style={{ fontSize: 12, lineHeight: 18, color: '#475569' }}>{a.description}</Text>
          </Card>)}
      </>}
    </ScrollView>
  </View>;
}
