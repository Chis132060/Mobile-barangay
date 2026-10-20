import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button, C, Card, ErrorBox, Icon, Input, Title } from '@/components/ui';

type Household = { number: string; size: string; income: string; housing: string; relationship: string; senior: boolean; pwd: boolean; fourPs: boolean };
const initial: Household = { number: '', size: '1', income: '', housing: 'Owned', relationship: 'Household Head', senior: false, pwd: false, fourPs: false };

/** Mirrors the PWA's authenticated-shell prompt and completeResidentOnboarding action. */
export function ResidentOnboardingPrompt({ userId }: { userId?: string }) {
  const [visible, setVisible] = useState(false);
  const [residentId, setResidentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Household>(initial);

  useEffect(() => {
    let active = true;
    async function check() {
      if (!supabase || !userId) { setLoading(false); return; }
      const { data, error: queryError } = await supabase.from('residents')
        .select('id,verification_status,household_onboarding_completed')
        .eq('user_id', userId).maybeSingle();
      if (!active) return;
      if (queryError) setError(queryError.message);
      if (data?.verification_status === 'Verified' && !data.household_onboarding_completed) {
        setResidentId(data.id); setVisible(true);
      }
      setLoading(false);
    }
    void check();
    return () => { active = false; };
  }, [userId]);

  async function save() {
    if (!supabase || !userId || !residentId) return;
    setSaving(true); setError('');
    try {
      const householdNumber = form.number.trim() || `HH-${residentId.slice(0, 8).toUpperCase()}`;
      const housingType = ['Owned', 'Rented', 'Informal Settler', 'Other'].includes(form.housing) ? form.housing : 'Owned';
      const householdSize = Math.max(1, Number(form.size) || 1);
      const monthlyIncome = Math.max(0, Number(form.income) || 0);
      const { data: resident, error: residentError } = await supabase.from('residents')
        .select('id,verification_status').eq('id', residentId).eq('user_id', userId).maybeSingle();
      if (residentError) throw residentError;
      if (!resident || resident.verification_status !== 'Verified') throw new Error('Your resident account must be verified before completing onboarding.');
      const { data: household, error: householdError } = await supabase.from('households')
        .select('id').eq('household_head_id', residentId).maybeSingle();
      if (householdError) throw householdError;
      let householdId = household?.id;
      if (householdId) {
        const { error: updateError } = await supabase.from('households').update({ household_number: householdNumber, member_count: householdSize, monthly_income: monthlyIncome, housing_type: housingType }).eq('id', householdId);
        if (updateError) throw updateError;
      } else {
        const { data: created, error: createError } = await supabase.from('households')
          .insert({ household_number: householdNumber, household_head_id: residentId, member_count: householdSize, monthly_income: monthlyIncome, housing_type: housingType }).select('id').single();
        if (createError) throw createError;
        householdId = created.id;
      }
      const { data: membership, error: membershipLookupError } = await supabase.from('household_members')
        .select('id').eq('household_id', householdId).eq('resident_id', residentId).maybeSingle();
      if (membershipLookupError) throw membershipLookupError;
      const relationship = form.relationship.trim() || 'Household Head';
      const membershipResult = membership
        ? await supabase.from('household_members').update({ relationship }).eq('id', membership.id)
        : await supabase.from('household_members').insert({ household_id: householdId, resident_id: residentId, relationship });
      if (membershipResult.error) throw membershipResult.error;
      const { error: residentUpdateError } = await supabase.from('residents').update({
        senior_status: form.senior, pwd_status: form.pwd, four_ps_status: form.fourPs,
        household_onboarding_completed: true, household_onboarding_completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', residentId).eq('user_id', userId);
      if (residentUpdateError) throw residentUpdateError;
      const { error: auditError } = await supabase.from('audit_logs').insert({
        user_id: userId, action: 'COMPLETE_RESIDENT_ONBOARDING', module: 'residents',
        details: { resident_id: residentId, household_id: householdId, household_size: householdSize, senior_status: form.senior, pwd_status: form.pwd, four_ps_status: form.fourPs },
      });
      if (auditError) console.warn('Resident onboarding audit could not be written:', auditError.message);
      setVisible(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'We could not save your household information.'); }
    finally { setSaving(false); }
  }

  if (loading || !visible) return null;
  const update = (key: keyof Household, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  return <Modal visible transparent animationType="fade" onRequestClose={() => !saving && setVisible(false)}>
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#02061780', padding: 16 }}>
      <Card style={{ maxHeight: '92%', borderRadius: 24, padding: 18 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Icon name="home" size={22} color={C.blue} />
            <View style={{ flex: 1 }}><Title sub="Your account is approved. These details help the Barangay maintain household records and identify eligible programs.">Complete your resident profile</Title></View>
            <Pressable accessibilityLabel="Complete later" disabled={saving} onPress={() => setVisible(false)}><Icon name="close" size={20} /></Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 11, fontWeight: '700', color: C.muted }}>Household No. (optional)</Text><Input value={form.number} onChangeText={(v) => update('number', v)} placeholder="Auto-generated" /></View>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 11, fontWeight: '700', color: C.muted }}>Household size</Text><Input value={form.size} onChangeText={(v) => update('size', v)} keyboardType="number-pad" /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 11, fontWeight: '700', color: C.muted }}>Monthly income (₱)</Text><Input value={form.income} onChangeText={(v) => update('income', v)} keyboardType="decimal-pad" placeholder="Optional" /></View>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 11, fontWeight: '700', color: C.muted }}>Housing</Text><Input value={form.housing} onChangeText={(v) => update('housing', v)} placeholder="Owned / Rented / Other" /></View>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.muted }}>Relationship to household head</Text>
          <Input value={form.relationship} onChangeText={(v) => update('relationship', v)} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: C.text }}>Program eligibility (you may update this later)</Text>
          {([['senior', 'Senior citizen'], ['pwd', 'Person with disability (PWD)'], ['fourPs', '4Ps beneficiary']] as const).map(([key, label]) => <Pressable key={key} onPress={() => update(key, !form[key])} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 34 }}><Icon name={form[key] ? 'check_box' : 'check_box_outline_blank'} size={19} color={C.blue} /><Text style={{ fontSize: 12, color: C.text }}>{label}</Text></Pressable>)}
          {!!error && <ErrorBox>{error}</ErrorBox>}
          <Text style={{ fontSize: 10, color: C.muted }}>Stored under your resident record.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1 }}><Button title="Complete later" secondary disabled={saving} onPress={() => setVisible(false)} /></View><View style={{ flex: 1 }}><Button title={saving ? 'Saving…' : 'Save profile'} loading={saving} onPress={() => void save()} /></View></View>
        </ScrollView>
      </Card>
    </View>
  </Modal>;
}
