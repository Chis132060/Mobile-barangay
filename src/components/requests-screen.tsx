import { PwaText } from '@/components/pwa-text';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, C, Card, Chip, ErrorBox, Icon, Input, Page, Title } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type Request = { id: string; status: string; fee_amount: number | null; payment_status: string | null; session_id: string | null; form_data: Record<string, unknown> | null; pickup_date: string | null; pickup_instructions: string | null; remarks: string | null; requested_date: string; document_type: { name: string } | { name: string }[] | null };
type Filter = 'All' | 'Pending' | 'Ready for Pickup' | 'Approved' | 'Released';
const FILTERS: Filter[] = ['All', 'Pending', 'Ready for Pickup', 'Approved', 'Released'];

export function RequestsScreen({ go }: { go: (route: string) => void }) {
  const { width, height } = useWindowDimensions();
  const compact = width < 360;
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<Request | null>(null);
  const [payRequest, setPayRequest] = useState<Request | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedQR, setScannedQR] = useState('');
  const [reference, setReference] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Please sign in to view your requests.');
      const { data: resident, error: residentError } = await supabase.from('residents').select('id').eq('user_id', user.id).maybeSingle();
      if (residentError) throw residentError;
      if (!resident) throw new Error('Resident profile not found.');
      const { data, error: queryError } = await supabase.from('document_requests').select('id,status,fee_amount,payment_status,session_id,form_data,pickup_date,pickup_instructions,remarks,requested_date,document_type:document_types(name)').eq('resident_id', resident.id).order('requested_date', { ascending: false });
      if (queryError) throw queryError;
      setRequests((data || []) as Request[]);
    } catch (cause) {
      setRequests([]);
      setError(cause instanceof Error ? cause.message : 'Unable to load your requests. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
    if (!supabase) return;
    const channel = supabase.channel('resident-document-requests-mobile').on('postgres_changes', { event: '*', schema: 'public', table: 'document_requests' }, () => void load()).subscribe();
    return () => { void supabase?.removeChannel(channel); };
  }, [load]);

  const filtered = useMemo(() => requests.filter((request) => filter === 'All' || (filter === 'Ready for Pickup' ? /ready|pickup/i.test(request.status) : request.status.toLowerCase().includes(filter.toLowerCase()))), [requests, filter]);
  async function submitPayment() {
    if (!supabase || !payRequest || submitting) return;
    const referenceNumber = reference.trim();
    if (!referenceNumber) { setPaymentError('Enter the reference number from your payment receipt.'); return; }
    setSubmitting(true); setPaymentError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Unauthorized. Please sign in again.');
      const { data: resident, error: residentError } = await supabase.from('residents').select('id').eq('user_id', user.id).single();
      if (residentError || !resident) throw new Error('Resident profile not found.');
      const { data: request, error: requestError } = await supabase.from('document_requests').select('resident_id,fee_amount,payment_status').eq('id', payRequest.id).single();
      if (requestError || !request) throw new Error('Request not found.');
      if (request.resident_id !== resident.id) throw new Error('Unauthorized access to this request.');
      if (request.payment_status === 'Paid' || request.payment_status === 'Pending') throw new Error(`Payment is already ${request.payment_status}.`);
      const amount = Number(request.fee_amount || 0);
      if (amount <= 0) throw new Error('This request is free.');
      // payments.resident_id references residents.id (not auth.users.id).
      const { error: paymentError } = await supabase.from('payments').insert({ request_id: payRequest.id, resident_id: resident.id, amount, provider: 'QR_PAY', reference_number: referenceNumber, status: 'Pending' });
      if (paymentError?.code === '23505') throw new Error('This reference number has already been submitted or you already have a pending payment.');
      if (paymentError) throw new Error(`Failed to submit payment: ${paymentError.message}`);
      const { error: updateError } = await supabase.from('document_requests').update({ payment_status: 'Pending' }).eq('id', payRequest.id).eq('resident_id', resident.id);
      if (updateError) throw new Error('Payment reference was recorded, but the request status could not be updated. Do not submit a second reference; contact barangay staff for reconciliation.');
      setPayRequest(null); setScannedQR(''); setReference(''); Alert.alert('Payment reference submitted', 'Barangay staff will verify your payment.'); await load();
    } catch (cause) { setPaymentError(cause instanceof Error ? cause.message : 'Unable to submit payment.'); }
    finally { setSubmitting(false); }
  }

  return <Page>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><View style={{ flex: 1 }}><Title sub="Track status, fees, and pickup schedules">My Document Requests</Title></View><Pressable accessibilityRole="button" accessibilityLabel="Refresh list" onPress={() => void load()} style={{ padding: 8, marginBottom: 14 }}><Icon name={loading ? 'progress_activity' : 'refresh'} size={19} color={loading ? C.blue : C.muted} /></Pressable></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: compact ? 'flex-start' : 'space-between', alignItems: 'center', gap: 8 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: compact ? 'auto' : 0 }}><View style={{ height: 8, width: 8, borderRadius: 4, backgroundColor: '#22c55e' }} /><PwaText style={{ color: '#15803d', fontSize: 10, fontWeight: '700' }}>Live</PwaText></View><Pressable accessibilityRole="button" onPress={() => go('chat')} style={aiButton}><Icon name="auto_awesome" size={14} color={C.white} /><PwaText style={{ color: C.white, fontSize: 11, fontWeight: '700' }}>AI Request</PwaText></Pressable><Button title="+ New request" onPress={() => go('new-request')} /></View>
    {!!error && <ErrorBox>{error}</ErrorBox>}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>{FILTERS.map((item) => <Chip key={item} title={item} active={filter === item} onPress={() => setFilter(item)} />)}</ScrollView>
    {loading ? <PwaText style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 12 }}>Loading your applications...</PwaText> : filtered.length === 0 ? <View style={emptyBox}><Icon name="content_paste_search" size={40} color="#d1d5db" /><PwaText style={{ color: '#374151', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>No requests found</PwaText><PwaText style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>Ask the AI Assistant or tap below to apply for a Clearance or Certificate.</PwaText><Pressable onPress={() => go('chat')} style={chatButton}><PwaText style={{ fontSize: 11, fontWeight: '700', color: C.white }}>Open Chatbot Assistant  ›</PwaText></Pressable></View> : filtered.map((request) => {
      const ready = /ready|pickup/i.test(request.status);
      const fee = Number(request.fee_amount || 0);
      const free = fee === 0 || request.payment_status === 'Free';
      return <Card key={request.id} style={{ borderColor: ready ? '#a7f3d0' : '#f3f4f6', padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }}><View style={[docIcon, ready && { backgroundColor: '#d1fae5' }]}><Icon name="description" size={18} color={ready ? '#047857' : C.blue} /></View><View style={{ flex: 1 }}><PwaText style={{ color: '#111827', fontSize: 12, fontWeight: '800' }}>{documentName(request) || 'Barangay Document'}</PwaText>{!!request.session_id && <PwaText style={{ color: '#9ca3af', fontSize: 10 }}>Batch: {request.session_id.slice(0, 10)}</PwaText>}</View></View><Pressable onPress={() => setDetail(request)} style={[statusBadge, { backgroundColor: statusBackground(request.status), alignSelf: 'flex-start' }]}><PwaText style={{ color: statusColor(request.status), fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>{request.status}</PwaText></Pressable></View>
        {ready && <View style={{ backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><PwaText style={{ color: '#047857', fontSize: 11, fontWeight: '800' }}>✓  Ready for Pick Up!</PwaText><Pressable onPress={() => setDetail(request)}><PwaText style={{ color: '#047857', fontSize: 10, fontWeight: '700', textDecorationLine: 'underline' }}>View Details</PwaText></Pressable></View>}
        <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Icon name="payments" size={14} color="#9ca3af" /><PwaText style={{ fontSize: 10, color: '#4b5563' }}>Payment:</PwaText><PwaText style={{ color: free ? '#047857' : '#1d4ed8', fontSize: 11, fontWeight: '700' }}>{free ? 'FREE (₱0.00)' : `₱${fee.toFixed(2)}`}</PwaText></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><PwaText style={[paymentBadge, { color: paymentColor(request.payment_status, free), backgroundColor: paymentBackground(request.payment_status, free) }]}>{request.payment_status || (free ? 'Free' : 'Unpaid')}</PwaText>{!free && (!request.payment_status || request.payment_status === 'Unpaid' || request.payment_status === 'Rejected') && <Pressable onPress={() => { setPayRequest(request); setScannedQR(''); setReference(''); setPaymentError(''); setScanning(true); }} style={payButton}><Icon name="qr_code" color={C.white} size={13} /><PwaText style={{ color: C.white, fontSize: 10, fontWeight: '700' }}>Pay GCash</PwaText></Pressable>}</View></View>
        {!!request.remarks && !ready && <PwaText numberOfLines={1} style={remarks}>{request.remarks}</PwaText>}
        <View style={footer}><PwaText>Applied: {new Date(request.requested_date).toLocaleDateString()}</PwaText><PwaText>ID: {request.id.slice(0, 8)}</PwaText></View>
        <Pressable accessibilityRole="button" onPress={() => setDetail(request)} style={{ alignSelf: 'flex-end', paddingVertical: 3 }}><PwaText style={{ color: '#047857', fontSize: 10, fontWeight: '700', textDecorationLine: 'underline' }}>View details</PwaText></Pressable>
      </Card>;
    })}

    <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}><View style={modalBackdrop}><View style={[modalSheet, responsiveModal]}><View style={modalHeader}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}><Icon name="description" color={C.blue} size={20} /><PwaText style={{ flex: 1, fontSize: 17, fontWeight: '700', color: '#111827' }}>Request Details</PwaText></View><Pressable onPress={() => setDetail(null)}><Icon name="close" size={21} /></Pressable></View><ScrollView style={{ maxHeight: Math.min(height * 0.68, 520) }} contentContainerStyle={{ gap: 14 }}>
      <DetailField label="Document" value={(detail && documentName(detail)) || 'Barangay Document'} /><View style={{ flexDirection: compact ? 'column' : 'row', justifyContent: 'space-between', gap: 12 }}><DetailField label="Status" value={detail?.status || ''} /><DetailField label="Date Requested" value={detail ? new Date(detail.requested_date).toLocaleDateString() : ''} /></View>
      {!!detail && /ready|pickup|release/i.test(detail.status) && <View style={pickupCard}><PwaText style={{ color: '#065f46', fontSize: 10, fontWeight: '800' }}>PICKUP INSTRUCTIONS</PwaText><PwaText style={{ color: '#064e3b', fontSize: 12, lineHeight: 18 }}>{detail.pickup_instructions || 'Please proceed to Frontline Window 2. Bring 1 Valid ID.'}</PwaText>{!!detail.pickup_date && <PwaText style={{ color: '#047857', fontSize: 10, fontWeight: '700' }}>{new Date(detail.pickup_date).toLocaleDateString()} (8:00 AM - 5:00 PM)</PwaText>}</View>}
      <View style={paymentCard}><View style={infoLine}><PwaText style={detailLabel}>Payment Status</PwaText><PwaText style={[paymentBadge, { color: paymentColor(detail?.payment_status || null, Number(detail?.fee_amount || 0) === 0), backgroundColor: paymentBackground(detail?.payment_status || null, Number(detail?.fee_amount || 0) === 0) }]}>{detail?.payment_status || (Number(detail?.fee_amount || 0) === 0 ? 'Free' : 'Unpaid')}</PwaText></View><View style={infoLine}><PwaText style={detailLabel}>Fee Amount</PwaText><PwaText style={{ color: '#111827', fontWeight: '800' }}>{Number(detail?.fee_amount || 0) === 0 ? 'FREE' : `₱${Number(detail?.fee_amount || 0).toFixed(2)}`}</PwaText></View></View>
      {!!detail?.remarks && <DetailField label="Remarks / Purpose" value={detail.remarks} />}
      {!!detail?.pickup_instructions && <DetailField label="Pickup Instructions" value={detail.pickup_instructions} />}
    </ScrollView><Button title="Close Details" secondary onPress={() => setDetail(null)} /></View></View></Modal>

    <Modal visible={!!payRequest && scanning} animationType="slide" onRequestClose={() => { setScanning(false); setPayRequest(null); }}><QRScanner onScan={(value) => { setScannedQR(value); setScanning(false); }} onCancel={() => { setScanning(false); setPayRequest(null); }} /></Modal>
    <Modal visible={!!payRequest && !!scannedQR} transparent animationType="slide" onRequestClose={() => { setPayRequest(null); setScannedQR(''); }}><View style={modalBackdrop}><View style={[modalSheet, responsiveModal]}><View style={modalHeader}><PwaText style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' }}>Confirm Payment</PwaText><Pressable onPress={() => { setPayRequest(null); setScannedQR(''); setReference(''); }}><Icon name="close" size={21} /></Pressable></View><ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: Math.min(height * 0.72, 560) }} contentContainerStyle={{ gap: 13 }}><View style={scannedCard}><PwaText style={{ color: '#1e40af', fontSize: 11 }}>Scanned Destination:</PwaText><PwaText selectable style={{ color: '#1e3a8a', fontFamily: 'monospace', fontWeight: '700', fontSize: 12 }}>{scannedQR}</PwaText><PwaText style={{ color: '#1e40af', fontSize: 12 }}>Please send exactly <PwaText style={{ fontSize: 18, fontWeight: '800' }}>₱{Number(payRequest?.fee_amount || 0).toFixed(2)}</PwaText> via GCash/Bank Transfer.</PwaText></View><PwaText style={label}>REFERENCE NUMBER</PwaText><Input value={reference} onChangeText={setReference} placeholder="e.g. 1234567890" autoCapitalize="characters" />{!!paymentError && <ErrorBox>{paymentError}</ErrorBox>}<Button title={submitting ? 'Submitting...' : 'Submit Verification'} onPress={() => void submitPayment()} loading={submitting} disabled={!reference.trim()} /></ScrollView></View></View></Modal>
  </Page>;
}

function QRScanner({ onScan, onCancel }: { onScan: (value: string) => void; onCancel: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  if (!permission?.granted) return <View style={{ flex: 1, backgroundColor: '#111827', justifyContent: 'center', padding: 24, gap: 14 }}><PwaText style={{ color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '700' }}>Scan GCash / bank QR</PwaText><PwaText style={{ color: '#d1d5db', textAlign: 'center', fontSize: 13 }}>Allow camera access to scan the payment destination QR code.</PwaText><Button title="Allow Camera" onPress={() => void requestPermission()} /><Button title="Cancel" secondary onPress={onCancel} /></View>;
  return <View style={{ flex: 1, backgroundColor: '#111827' }}><CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => onScan(data)} /><View style={{ position: 'absolute', bottom: 24, left: 20, right: 20 }}><Button title="Cancel" secondary onPress={onCancel} /></View></View>;
}
function documentName(request: Request) { const value = request.document_type; return Array.isArray(value) ? value[0]?.name : value?.name; }
function DetailField({ label, value }: { label: string; value: string }) { return <View><PwaText style={labelStyle}>{label.toUpperCase()}</PwaText><PwaText style={{ color: '#1f2937', fontSize: 13, fontWeight: '500', marginTop: 4 }}>{value}</PwaText></View>; }
function statusBackground(status: string) { if (/ready|pickup/i.test(status)) return '#10b981'; if (status === 'Approved') return '#dbeafe'; if (/released|completed/i.test(status)) return '#f3e8ff'; if (status === 'Rejected') return '#fee2e2'; return '#fef3c7'; }
function statusColor(status: string) { if (/ready|pickup/i.test(status)) return '#fff'; if (status === 'Approved') return '#1e40af'; if (/released|completed/i.test(status)) return '#6b21a8'; if (status === 'Rejected') return '#b91c1c'; return '#92400e'; }
function paymentColor(status: string | null, free: boolean) { if (status === 'Paid') return '#065f46'; if (status === 'Pending') return '#1e40af'; if (status === 'Free' || free) return '#047857'; return '#92400e'; }
function paymentBackground(status: string | null, free: boolean) { if (status === 'Paid') return '#d1fae5'; if (status === 'Pending') return '#dbeafe'; if (status === 'Free' || free) return '#ecfdf5'; return '#fef3c7'; }
const aiButton = { backgroundColor: '#4f46e5', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 11, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5 };
const emptyBox = { backgroundColor: '#f9fafb', borderWidth: 1, borderStyle: 'dashed' as const, borderColor: '#e5e7eb', borderRadius: 24, padding: 24, alignItems: 'center' as const, gap: 10 };
const chatButton = { backgroundColor: C.blue, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 2 };
const docIcon = { width: 36, height: 36, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center' as const, justifyContent: 'center' as const };
const statusBadge = { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 };
const paymentBadge = { fontSize: 9, fontWeight: '800' as const, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4, overflow: 'hidden' as const };
const payButton = { backgroundColor: '#111827', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 };
const remarks = { color: '#4b5563', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 9, padding: 8, fontSize: 11 };
const footer = { paddingTop: 8, borderTopWidth: 1, borderColor: '#f9fafb', flexDirection: 'row' as const, justifyContent: 'space-between' as const, color: '#9ca3af' };
const modalBackdrop = { flex: 1, justifyContent: 'flex-end' as const, backgroundColor: '#0009' };
const modalSheet = { backgroundColor: C.white, padding: 20, gap: 13, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' as const };
const responsiveModal = { width: '100%' as const, maxWidth: 448, alignSelf: 'center' as const };
const modalHeader = { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f3f4f6' };
const pickupCard = { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', padding: 12, borderRadius: 12, gap: 5 };
const paymentCard = { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', padding: 12, borderRadius: 12, gap: 9 };
const infoLine = { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const };
const detailLabel = { color: '#4b5563', fontSize: 12, fontWeight: '700' as const };
const label = { fontSize: 10, fontWeight: '700' as const, color: '#374151', letterSpacing: 0.3 };
const labelStyle = { color: '#9ca3af', fontSize: 10, fontWeight: '800' as const, letterSpacing: 0.8 };
const scannedCard = { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe', padding: 14, borderRadius: 12, gap: 8 };
