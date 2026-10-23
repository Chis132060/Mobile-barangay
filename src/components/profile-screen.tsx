import { PwaText } from '@/components/pwa-text';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, View } from 'react-native';
import { Button, C, ErrorBox, Icon, Input, Label, Page } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type Resident = { id: string; verification_status?: string | null; household_onboarding_completed?: boolean | null; address?: string | null; purok?: string | null };
type Notice = { id: string; title: string; message: string; read_status: boolean };
const SETTINGS = [
  { title: 'Notifications Settings', icon: 'notifications', color: '#3b82f6', body: 'In-app notifications are available. Native push notifications require device registration and backend delivery before they can be enabled.' },
  { title: 'Privacy & Security', icon: 'shield', color: '#6366f1', body: 'Your personal details are encrypted and securely stored. Only authorized Barangay officials have access to resident records.' },
  { title: 'Help & Support', icon: 'help', color: '#f59e0b', body: 'Submit a support ticket to barangay staff or ask Ate Sora in AI Chat.' },
];

export function ProfileScreen({ user, go, onSignedOut }: { user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null; go: (route: string) => void; onSignedOut: () => void }) {
  const [fullName, setFullName] = useState(String(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Resident'));
  const [email, setEmail] = useState(user?.email || 'resident@barangay.gov');
  const [nameDraft, setNameDraft] = useState(fullName);
  const [resident, setResident] = useState<Resident | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [setting, setSetting] = useState<(typeof SETTINGS)[number] | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [household, setHousehold] = useState({ number: '', size: '1', income: '', housing: 'Owned', relationship: 'Household Head', senior: false, pwd: false, fourPs: false });
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase || !user) { setLoading(false); return; }
      const [{ data: auth }, { data: residentRow }, { data: notificationRows }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('residents').select('id,verification_status,household_onboarding_completed').eq('user_id', user.id).maybeSingle(),
        supabase.from('notifications').select('id,title,message,read_status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ]);
      if (!active) return;
      const nextEmail = auth.user?.email || user.email || 'resident@barangay.gov';
      const nextName = String(auth.user?.user_metadata?.full_name || user.user_metadata?.full_name || nextEmail.split('@')[0] || 'Resident');
      setEmail(nextEmail); setFullName(nextName); setNameDraft(nextName);
      const profile = residentRow as Resident | null;
      if (profile) {
        const { data: address } = await supabase.from('addresses').select('house_number,street,purok').eq('resident_id', profile.id).maybeSingle();
        profile.address = [address?.house_number, address?.street].filter(Boolean).join(' ') || 'Not provided';
        profile.purok = address?.purok || 'Not provided';
      }
      if (!active) return;
      setResident(profile); setNotices((notificationRows || []) as Notice[]); setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [user]);

  async function saveProfile() {
    if (!supabase || !user) return;
    const value = nameDraft.trim();
    if (!value) { setError('Enter your full name.'); return; }
    setSaving(true); setError('');
    const { error: saveError } = await supabase.auth.updateUser({ data: { full_name: value } });
    setSaving(false);
    if (saveError) { setError(saveError.message); return; }
    setFullName(value); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  async function markRead(id: string) {
    if (!supabase) return;
    const { error: updateError } = await supabase.from('notifications').update({ read_status: true }).eq('id', id).eq('user_id', user?.id);
    if (updateError) { setError(updateError.message); return; }
    setNotices((items) => items.map((item) => item.id === id ? { ...item, read_status: true } : item));
  }

  async function saveHousehold() {
    try {
      setError('');
      if (!supabase || !user) throw new Error('Sign in to complete onboarding.');
      const { data: residentRow, error: residentError } = await supabase.from('residents').select('id,verification_status').eq('user_id', user.id).maybeSingle();
      if (residentError || !residentRow) throw new Error('Resident profile not found.');
      if (residentRow.verification_status !== 'Verified') throw new Error('Your account must be verified before household onboarding.');
      const { data: existing, error: lookupError } = await supabase.from('households').select('id').eq('household_head_id', residentRow.id).maybeSingle();
      if (lookupError) throw lookupError;
      const householdNumber = household.number.trim() || `HH-${residentRow.id.slice(0, 8).toUpperCase()}`;
      let householdId = existing?.id;
      const householdData = { household_number: householdNumber, member_count: Math.max(1, Number(household.size) || 1), monthly_income: Math.max(0, Number(household.income) || 0), housing_type: household.housing };
      if (householdId) {
        const { error: updateError } = await supabase.from('households').update(householdData).eq('id', householdId);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase.from('households').insert({ ...householdData, household_head_id: residentRow.id }).select('id').single();
        if (insertError || !data) throw insertError || new Error('Unable to save household.');
        householdId = data.id;
      }
      const { data: member } = await supabase.from('household_members').select('id').eq('household_id', householdId).eq('resident_id', residentRow.id).maybeSingle();
      const memberResult = member ? await supabase.from('household_members').update({ relationship: household.relationship.trim() || 'Household Head' }).eq('id', member.id) : await supabase.from('household_members').insert({ household_id: householdId, resident_id: residentRow.id, relationship: household.relationship.trim() || 'Household Head' });
      if (memberResult.error) throw memberResult.error;
      const { error: updateError } = await supabase.from('residents').update({ senior_status: household.senior, pwd_status: household.pwd, four_ps_status: household.fourPs, household_onboarding_completed: true, household_onboarding_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', residentRow.id);
      if (updateError) throw updateError;
      await supabase.from('audit_logs').insert({ user_id: user.id, action: 'COMPLETE_RESIDENT_ONBOARDING', module: 'residents', details: { resident_id: residentRow.id, household_id: householdId, household_size: householdData.member_count, senior_status: household.senior, pwd_status: household.pwd, four_ps_status: household.fourPs } });
      setResident((previous) => previous ? { ...previous, household_onboarding_completed: true } : previous);
      setOnboarding(false); Alert.alert('Resident profile', 'Household information saved.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save household information.'); }
  }

  return <Page>
    {saved && <View style={success}><Icon name="check_circle" color="#059669" size={17} /><PwaText style={{ color: '#047857', fontSize: 12, fontWeight: '700' }}>Profile information updated successfully!</PwaText></View>}
    {!!error && <ErrorBox>{error}</ErrorBox>}
    <View style={hero}>
      <View style={avatar}><PwaText style={{ color: C.white, fontSize: 27, fontWeight: '700' }}>{fullName.charAt(0).toUpperCase()}</PwaText></View>
      <PwaText style={{ color: '#111827', fontSize: 18, fontWeight: '700' }}>{loading ? 'Loading...' : fullName}</PwaText>
      <PwaText style={{ color: '#6b7280', fontSize: 14 }}>{email}</PwaText>
      <Pressable accessibilityRole="button" onPress={() => { setNameDraft(fullName); setError(''); setEditing(true); }} style={editButton}><PwaText style={{ color: C.blue, fontSize: 14, fontWeight: '500' }}>Edit Profile</PwaText></Pressable>
    </View>

    <View style={householdCard}>
      <PwaText style={sectionLabel}>HOUSEHOLD INFORMATION</PwaText>
      <InfoRow label="Address" value={resident?.address || 'Not provided'} />
      <InfoRow label="Purok" value={resident?.purok || 'Not provided'} />
      <View style={infoRow}><PwaText style={rowLabel}>Verification</PwaText><PwaText style={[verified, resident?.verification_status !== 'Verified' && { backgroundColor: '#fef3c7', color: '#92400e' }]}>{resident?.verification_status || 'Pending Verification'}</PwaText></View>
    </View>

    {!resident?.household_onboarding_completed && !!user && <Pressable accessibilityRole="button" onPress={() => setOnboarding(true)} style={onboardingCard}><Icon name="home" color={C.blue} size={19} /><View style={{ flex: 1 }}><PwaText style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Complete resident profile</PwaText><PwaText style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>Add household details and program eligibility</PwaText></View><Icon name="chevron_right" color="#d1d5db" size={20} /></Pressable>}

    <View style={menuCard}>{SETTINGS.map((item, index) => <Pressable key={item.title} accessibilityRole="button" onPress={() => item.title === 'Help & Support' ? router.push('/support') : setSetting(item)} style={[menuRow, index < SETTINGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f9fafb' }]}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Icon name={item.icon} size={20} color={item.color} /><PwaText style={{ fontSize: 14, color: '#374151', fontWeight: '500' }}>{item.title}</PwaText></View><Icon name="chevron_right" size={17} color="#d1d5db" /></Pressable>)}</View>

    <View style={menuCard}><PwaText style={sectionLabel}>LATEST NOTIFICATIONS</PwaText>{notices.length ? notices.map((notice) => <Pressable key={notice.id} onPress={() => !notice.read_status && void markRead(notice.id)} style={noticeRow}><PwaText style={{ color: '#111827', fontSize: 13, fontWeight: notice.read_status ? '500' : '700' }}>{notice.title}</PwaText><PwaText style={{ color: '#6b7280', fontSize: 12, marginTop: 3 }}>{notice.message}</PwaText></Pressable>) : <PwaText style={{ color: '#6b7280', fontSize: 12 }}>No new notifications</PwaText>}</View>

    <Pressable accessibilityRole="button" onPress={async () => { await supabase?.auth.signOut(); onSignedOut(); go(user ? 'login' : 'login'); }} style={signOut}><Icon name={user ? 'logout' : 'login'} size={17} color={user ? '#dc2626' : C.blue} /><PwaText style={{ color: user ? '#dc2626' : C.blue, fontSize: 14, fontWeight: '600' }}>{user ? 'Sign Out' : 'Sign In'}</PwaText></Pressable>

    <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}><View style={modalBackdrop}><View style={modalCard}><View style={modalHeader}><PwaText style={{ color: '#111827', fontSize: 16, fontWeight: '700' }}>Edit Profile</PwaText><Pressable onPress={() => setEditing(false)}><Icon name="close" size={21} /></Pressable></View><Label>Full Name</Label><Input value={nameDraft} onChangeText={setNameDraft} autoCapitalize="words" /><Label>Email (Read Only)</Label><Input value={email} editable={false} style={{ backgroundColor: '#f9fafb', color: '#6b7280' }} />{!!error && <ErrorBox>{error}</ErrorBox>}<View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1 }}><Button title="Cancel" secondary onPress={() => setEditing(false)} /></View><View style={{ flex: 1 }}><Button title="Save Changes" onPress={() => void saveProfile()} loading={saving} /></View></View></View></View></Modal>
    <Modal visible={!!setting} transparent animationType="fade" onRequestClose={() => setSetting(null)}><View style={modalBackdrop}><View style={modalCard}><View style={modalHeader}><PwaText style={{ color: '#111827', fontSize: 16, fontWeight: '700' }}>{setting?.title}</PwaText><Pressable onPress={() => setSetting(null)}><Icon name="close" size={21} /></Pressable></View><PwaText style={{ color: '#4b5563', fontSize: 13, lineHeight: 20 }}>{setting?.body}</PwaText><Button title="Close" onPress={() => setSetting(null)} /></View></View></Modal>
    <Modal visible={onboarding} transparent animationType="fade" onRequestClose={() => setOnboarding(false)}><View style={modalBackdrop}><View style={modalCard}><PwaText style={{ color: '#111827', fontSize: 17, fontWeight: '700' }}>Household onboarding</PwaText><PwaText style={{ color: '#6b7280', fontSize: 12, lineHeight: 18 }}>Your account must be approved. These details help maintain household records and determine program eligibility.</PwaText><Input placeholder="Household No. (optional)" value={household.number} onChangeText={(number) => setHousehold((v) => ({ ...v, number }))} /><Input placeholder="Household size" keyboardType="number-pad" value={household.size} onChangeText={(size) => setHousehold((v) => ({ ...v, size }))} /><Input placeholder="Monthly income" keyboardType="decimal-pad" value={household.income} onChangeText={(income) => setHousehold((v) => ({ ...v, income }))} /><Input placeholder="Housing: Owned / Rented / Informal Settler / Other" value={household.housing} onChangeText={(housing) => setHousehold((v) => ({ ...v, housing }))} /><Input placeholder="Relationship to household head" value={household.relationship} onChangeText={(relationship) => setHousehold((v) => ({ ...v, relationship }))} />{([{ key: 'senior', label: 'Senior citizen' }, { key: 'pwd', label: 'Person with disability (PWD)' }, { key: 'fourPs', label: '4Ps beneficiary' }] as const).map(({ key, label }) => <Pressable key={key} onPress={() => setHousehold((v) => ({ ...v, [key]: !v[key] }))}><PwaText style={{ color: C.text, paddingVertical: 4 }}>{household[key] ? '[x]' : '[ ]'} {label}</PwaText></Pressable>)}{!!error && <ErrorBox>{error}</ErrorBox>}<Button title="Save profile" onPress={() => void saveHousehold()} /><Button title="Close" secondary onPress={() => setOnboarding(false)} /></View></View></Modal>
  </Page>;
}

function InfoRow({ label, value }: { label: string; value: string }) { return <View style={infoRow}><PwaText style={rowLabel}>{label}</PwaText><PwaText style={{ color: '#1f2937', fontSize: 13, fontWeight: '500', textAlign: 'right', flexShrink: 1 }}>{value}</PwaText></View>; }
const hero = { alignItems: 'center' as const, paddingVertical: 24, gap: 4, backgroundColor: '#f8fbff', borderRadius: 16, borderWidth: 1, borderColor: '#eff6ff' };
const avatar = { height: 80, width: 80, borderRadius: 40, backgroundColor: C.blue, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 8, elevation: 4 };
const editButton = { marginTop: 8, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.blue };
const householdCard = { backgroundColor: '#eff6ff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#dbeafe', gap: 12 };
const sectionLabel = { color: C.blue, fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.7, marginBottom: 3 };
const infoRow = { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, gap: 12 };
const rowLabel = { color: '#6b7280', fontSize: 13 };
const verified = { color: '#065f46', backgroundColor: '#d1fae5', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: '700' as const };
const onboardingCard = { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 };
const menuCard = { backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', paddingHorizontal: 15, paddingVertical: 7, gap: 2, elevation: 1 };
const menuRow = { minHeight: 54, flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const };
const noticeRow = { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb' };
const signOut = { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center' as const, justifyContent: 'center' as const, flexDirection: 'row' as const, gap: 8, backgroundColor: C.white };
const success = { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row' as const, gap: 8, alignItems: 'center' as const };
const modalBackdrop = { flex: 1, backgroundColor: '#0006', alignItems: 'center' as const, justifyContent: 'center' as const, padding: 20 };
const modalCard = { width: '100%' as const, maxWidth: 390, backgroundColor: C.white, borderRadius: 18, padding: 20, gap: 13, elevation: 20 };
const modalHeader = { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' };
