import { PwaText } from '@/components/pwa-text';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Button, C, Card, Chip, ErrorBox, Icon, Page, Title } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type Program = { id: string; name: string; description: string | null; category: string; status: string; image_url: string | null; purok: string | null; venue: string | null; schedule_details: string | null; requirements: string | null; registration_open: boolean; registration_deadline: string | null; registration_opens_at: string | null; event_start_at: string | null; event_end_at: string | null; max_participants: number | null; min_age: number | null; max_age: number | null };
type Announcement = { id: string; title: string; description: string; category: string; created_at: string; event_start_at: string | null; event_end_at: string | null; venue: string | null };
type Organization = { id: string; name: string; description: string | null; org_type: string; president: string | null; contact: string | null };
type Application = { program_id: string; status: string; rejection_reason: string | null; created_at: string };
type Tab = 'programs' | 'organizations' | 'announcements';
const TABS: { id: Tab; title: string }[] = [{ id: 'programs', title: 'Programs' }, { id: 'organizations', title: 'Organizations' }, { id: 'announcements', title: 'Announcements' }];

export function UpdatesScreen({ user }: { user: { id: string } | null }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('programs');
  const [category, setCategory] = useState('All');
  const [showApplications, setShowApplications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [error, setError] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return; }
    setError('');
    const [ann, pro, org] = await Promise.all([
      supabase.from('announcements').select('id,title,description,category,created_at,event_start_at,event_end_at,venue').eq('status', 'Published').order('created_at', { ascending: false }),
      supabase.from('barangay_programs').select('id,name,description,category,status,image_url,purok,venue,schedule_details,requirements,registration_open,registration_deadline,registration_opens_at,event_start_at,event_end_at,max_participants,min_age,max_age').eq('is_public', true).in('status', ['Active', 'On Hold']).order('created_at', { ascending: false }),
      supabase.from('barangay_organizations').select('id,name,description,org_type,president,contact').eq('status', 'Active').order('name'),
    ]);
    if (!ann.error) setAnnouncements((ann.data || []) as Announcement[]);
    if (!pro.error) setPrograms((pro.data || []) as Program[]);
    if (!org.error) setOrganizations((org.data || []) as Organization[]);
    const errors = [ann.error?.message, pro.error?.message, org.error?.message].filter(Boolean);
    if (errors.length) setError(errors.join('; '));
    if (user) {
      const { data: resident } = await supabase.from('residents').select('id').eq('user_id', user.id).maybeSingle();
      if (resident) {
        const { data, error: appError } = await supabase.from('program_enrollees').select('program_id,status,rejection_reason,created_at').eq('resident_id', resident.id).order('created_at', { ascending: false });
        if (!appError) setApplications((data || []) as Application[]);
      }
    } else setApplications([]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { void load().finally(() => { if (active) setLoading(false); }); });
    const client = supabase;
    if (!client) return () => { active = false; };
    const channel = client.channel('resident-updates-live-mobile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => { void load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barangay_programs' }, () => { void load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barangay_organizations' }, () => { void load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'program_enrollees' }, () => { void load(); })
      .subscribe();
    return () => { active = false; void client.removeChannel(channel); };
  }, [load, refreshCounter]);

  const applicationByProgram = useMemo(() => Object.fromEntries(applications.map((app) => [app.program_id, app])), [applications]);
  const visiblePrograms = programs.filter((program) => category === 'All' || program.category === category);
  async function joinProgram(id: string) {
    if (!supabase) return;
    if (!user) { setApplyMessage('Please sign in before applying.'); return; }
    if (applying) return;
    setApplying(id); setApplyMessage('');
    const { error: applyError } = await supabase.rpc('apply_to_barangay_program', { p_program_id: id });
    if (applyError) setApplyMessage(applyError.message);
    else { setApplyMessage('Application submitted. Await barangay review.'); await load(); }
    setApplying(null);
  }

  return <Page>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><View style={{ flex: 1 }}><Title sub="Programs, organizations, and official announcements from Barangay Hall">Barangay Updates</Title></View><Pressable accessibilityRole="button" accessibilityLabel="Refresh updates" onPress={() => { setLoading(true); setRefreshCounter((n) => n + 1); }} style={{ padding: 9, marginBottom: 14 }}><Icon name="refresh" size={19} color={loading ? C.blue : C.muted} /></Pressable></View>
    {!!error && <ErrorBox>Unable to load some updates: {error}</ErrorBox>}
    {!!applyMessage && <PwaText accessibilityRole="alert" style={{ color: '#1e40af', backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, fontSize: 12 }}>{applyMessage}</PwaText>}
    <View style={tabBar}>{TABS.map((tab) => <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab.id }} onPress={() => setActiveTab(tab.id)} style={[tabButton, activeTab === tab.id && activeTabStyle]}><PwaText numberOfLines={1} style={{ color: activeTab === tab.id ? '#1d4ed8' : '#4b5563', fontSize: tab.id === 'organizations' ? 11 : 12, fontWeight: '600', textAlign: 'center' }}>{tab.title}</PwaText></Pressable>)}</View>

    {activeTab === 'programs' && <>
      <Card style={{ padding: 13 }}><Pressable accessibilityRole="button" onPress={() => setShowApplications((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><PwaText style={{ fontSize: 13, color: '#111827', fontWeight: '700' }}>My Program Applications</PwaText><PwaText style={{ fontSize: 12, color: '#4b5563' }}>{applications.length} {showApplications ? '▲' : '▼'}</PwaText></Pressable>{showApplications && <View style={{ gap: 8, marginTop: 12 }}>{applications.length === 0 ? <PwaText style={{ fontSize: 12, color: C.muted }}>No applications yet.</PwaText> : applications.map((app) => <View key={`${app.program_id}-${app.created_at}`} style={applicationCard}><PwaText style={{ fontWeight: '700', fontSize: 12, color: '#111827' }}>{programs.find((p) => p.id === app.program_id)?.name || 'Program'}</PwaText><PwaText style={smallText}>Status: {app.status}</PwaText><PwaText style={smallText}>Applied: {new Date(app.created_at).toLocaleDateString()}</PwaText>{!!app.rejection_reason && <PwaText style={{ color: '#b91c1c', fontSize: 11 }}>Reason: {app.rejection_reason}</PwaText>}</View>)}</View>}</Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><PwaText style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Barangay Programs</PwaText><PwaText style={smallText}>{programs.length} available</PwaText></View>
      {programs.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>{['All', ...Array.from(new Set(programs.map((p) => p.category)))].map((item) => <Chip key={item} title={item} active={category === item} onPress={() => setCategory(item)} />)}</ScrollView>}
      {loading ? <PwaText style={smallText}>Loading programs...</PwaText> : programs.length === 0 ? <View style={emptyCard}><PwaText style={smallText}>No active barangay programs have been published by the barangay yet. Please check back for official registration updates.</PwaText></View> : visiblePrograms.map((program) => <Card key={program.id} style={{ gap: 9 }}>
        <PwaText style={categoryBadge}>{program.category}</PwaText>
        <PwaText style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{program.name}</PwaText>
        {!!program.image_url && <Image source={{ uri: program.image_url }} resizeMode="cover" style={{ width: '100%', height: 180, borderRadius: 12, backgroundColor: '#f3f4f6' }} />}
        {program.status === 'On Hold' && <PwaText style={holdNote}>Historical / citywide reference only. Not confirmed as a current barangay program. No registration available; please verify with the barangay office.</PwaText>}
        {!!program.description && <PwaText style={bodyText}>{program.description}</PwaText>}
        <View style={{ gap: 4 }}><PwaText style={smallText}>Area: {program.purok || 'All Puroks'}</PwaText>{!!program.venue && <PwaText style={smallText}>Venue: {program.venue}</PwaText>}{!!program.event_start_at && <PwaText style={eventText}>Event: {new Date(program.event_start_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })} (PH time)</PwaText>}{!!program.event_end_at && new Date(program.event_end_at).getTime() < now && <PwaText style={smallText}>Completed</PwaText>}{!!program.schedule_details && <PwaText style={smallText}>Schedule notes: {program.schedule_details}</PwaText>}{!!program.requirements && <PwaText style={smallText}>Requirements: {program.requirements}</PwaText>}{!!program.registration_opens_at && <PwaText style={smallText}>Applications open: {new Date(program.registration_opens_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}</PwaText>}{!!program.registration_deadline && <PwaText style={smallText}>Apply by: {new Date(program.registration_deadline).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}</PwaText>}{!!program.max_participants && <PwaText style={smallText}>Capacity: {program.max_participants} slots (subject to availability)</PwaText>}{(program.min_age || program.max_age) && <PwaText style={smallText}>Age: {program.min_age || 'Any'} - {program.max_age || 'Any'}</PwaText>}<PwaText style={{ color: program.registration_open ? '#047857' : '#b45309', fontSize: 12, fontWeight: '700' }}>{program.registration_open ? 'Registration Open' : 'Registration Closed'}</PwaText></View>
        <Button title={applicationByProgram[program.id] ? `Application: ${applicationByProgram[program.id].status}` : program.status !== 'Active' || !program.registration_open || !!(program.registration_opens_at && new Date(program.registration_opens_at).getTime() > now) || !!(program.event_start_at && new Date(program.event_start_at).getTime() <= now) || !!(program.registration_deadline && new Date(program.registration_deadline).getTime() < now) ? 'Registration Closed' : applying === program.id ? 'Submitting...' : 'Join Program'} disabled={!!applicationByProgram[program.id] || applying !== null || program.status !== 'Active' || !program.registration_open || !!(program.registration_opens_at && new Date(program.registration_opens_at).getTime() > now) || !!(program.event_start_at && new Date(program.event_start_at).getTime() <= now) || !!(program.registration_deadline && new Date(program.registration_deadline).getTime() < now)} onPress={() => void joinProgram(program.id)} />
      </Card>)}
    </>}

    {activeTab === 'organizations' && <><PwaText style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Community Organizations</PwaText>{loading ? <PwaText style={smallText}>Loading organizations...</PwaText> : organizations.length === 0 ? <View style={emptyCard}><PwaText style={smallText}>No active community organizations have been published.</PwaText></View> : organizations.map((organization) => <Card key={organization.id}><PwaText style={categoryBadge}>{organization.org_type}</PwaText><PwaText style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{organization.name}</PwaText>{!!organization.description && <PwaText style={bodyText}>{organization.description}</PwaText>}{!!organization.president && <PwaText style={smallText}>President: {organization.president}</PwaText>}{!!organization.contact && <PwaText style={smallText}>Contact: {organization.contact}</PwaText>}</Card>)}</>}

    {activeTab === 'announcements' && <><PwaText style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Barangay Announcements</PwaText>{loading ? <PwaText style={smallText}>Loading announcements...</PwaText> : announcements.length === 0 ? <View style={emptyCard}><PwaText style={smallText}>No announcements yet.</PwaText></View> : announcements.map((announcement) => <Card key={announcement.id}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><PwaText style={categoryBadge}>{announcement.category}</PwaText><PwaText style={smallText}>{new Date(announcement.created_at).toLocaleDateString()}</PwaText></View><PwaText style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{announcement.title}</PwaText>{!!announcement.venue && <PwaText style={smallText}>Venue: {announcement.venue}</PwaText>}{!!announcement.event_start_at && <PwaText style={smallText}>Starts: {new Date(announcement.event_start_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}</PwaText>}{!!announcement.event_end_at && <PwaText style={smallText}>Ends: {new Date(announcement.event_end_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}</PwaText>}<PwaText style={bodyText}>{announcement.description}</PwaText></Card>)}</>}
  </Page>;
}

const tabBar = { flexDirection: 'row' as const, gap: 4, borderRadius: 16, padding: 4, backgroundColor: '#f3f4f6' };
const tabButton = { flex: 1, minHeight: 42, paddingHorizontal: 5, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const };
const activeTabStyle = { backgroundColor: '#fff', elevation: 1 };
const applicationCard = { backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, gap: 3 };
const smallText = { color: '#6b7280', fontSize: 11 };
const bodyText = { color: '#4b5563', fontSize: 12, lineHeight: 18 };
const categoryBadge = { color: '#1d4ed8', backgroundColor: '#eff6ff', alignSelf: 'flex-start' as const, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, fontSize: 10, fontWeight: '700' as const };
const holdNote = { color: '#92400e', backgroundColor: '#fffbeb', padding: 10, fontSize: 11, fontWeight: '600' as const, borderRadius: 9 };
const eventText = { color: '#1d4ed8', fontSize: 11, fontWeight: '600' as const };
const emptyCard = { padding: 18, backgroundColor: '#fff', borderWidth: 1, borderStyle: 'dashed' as const, borderColor: '#e5e7eb', borderRadius: 14 };
