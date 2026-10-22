import { PwaText } from '@/components/pwa-text';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Button, C, ErrorBox, Icon, Input } from '@/components/ui';
import { pwaApiUrl } from '@/lib/supabase';

const PUROKS = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7'];
const ID_TYPES = [
  'Philippine Identification (PhilID / ePhilID)',
  "Voter's ID / Voter's Certification",
  "Driver's License",
  'UMID / SSS / GSIS Card',
  'Postal ID',
  'Barangay Clearance / Proof of Residency',
];
type Form = {
  firstName: string; middleName: string; lastName: string; birthDate: string;
  gender: 'Male' | 'Female'; contactNumber: string; houseNumber: string;
  street: string; purok: string; email: string; password: string;
  idType: string; isBoarder: boolean; boarderCount: string;
};
type PickedFile = { uri: string; name: string; mimeType?: string | null; size?: number };
const INITIAL: Form = {
  firstName: '', middleName: '', lastName: '', birthDate: '', gender: 'Male',
  contactNumber: '', houseNumber: '', street: '', purok: 'Purok 1', email: '',
  password: '', idType: ID_TYPES[0], isBoarder: false, boarderCount: '',
};

function SelectField({ value, options, onSelect }: { value: string; options: string[]; onSelect: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: open ? 5 : 0 }}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((current) => !current)} style={{ minHeight: 42, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <PwaText numberOfLines={1} style={{ flex: 1, fontSize: 12, color: C.text }}>{value}</PwaText><Icon name={open ? 'expand_less' : 'expand_more'} size={18} />
    </Pressable>
    {open && <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: C.white, overflow: 'hidden' }}>{options.map((option) => <Pressable key={option} onPress={() => { onSelect(option); setOpen(false); }} style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}><PwaText style={{ fontSize: 12, color: option === value ? C.blue : C.text, fontWeight: option === value ? '700' : '400' }}>{option}</PwaText></Pressable>)}</View>}
  </View>;
}

function SectionHeading({ children }: { children: string }) {
  return <PwaText style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 1 }}>{children}</PwaText>;
}

function FieldLabel({ children }: { children: string }) {
  return <PwaText style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>{children}</PwaText>;
}

function FormInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} style={[{ fontSize: 12, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }, props.style]} />;
}

export function RegistrationForm({ go }: { go: (screen: string) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(INITIAL);
  const [idImage, setIdImage] = useState<PickedFile | null>(null);
  const [rbi, setRbi] = useState<PickedFile | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const update = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));

  const next = (target: number) => {
    setError('');
    setStep(target);
  };
  const selectRbi = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    if (file.size && file.size > 5 * 1024 * 1024) {
      setError('RBI file must be 5MB or smaller.');
      return;
    }
    setError('');
    setRbi({ uri: file.uri, name: file.name, mimeType: file.mimeType, size: file.size });
  };
  const takeIdPhoto = async () => {
    try {
      const photo = await camera.current?.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error('Could not capture the ID photo. Please try again.');
      setIdImage({ uri: photo.uri, name: 'id_capture.jpg', mimeType: 'image/jpeg' });
      setCameraOpen(false);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not capture the ID photo.');
    }
  };
  const continueToSecureSubmission = async () => {
    setError('');
    if (!pwaApiUrl) {
      setError('Secure registration is unavailable. Set EXPO_PUBLIC_PWA_API_URL to the existing resident portal URL.');
      return;
    }
    setBusy(true);
    try {
      const base = pwaApiUrl.replace(/\/$/, '');
      await WebBrowser.openBrowserAsync(`${base}/register`, { toolbarColor: C.blue, showTitle: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open secure registration.');
    } finally {
      setBusy(false);
    }
  };

  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: C.white }}><ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 28, backgroundColor: C.white }} keyboardShouldPersistTaps="handled"><View style={{ width: '100%', maxWidth: 448, alignSelf: 'center', gap: 14 }}>
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <Image source={require('@/assets/images/barangay-logo.png')} resizeMode="contain" style={{ width: 64, height: 64, marginBottom: 10 }} />
      <PwaText style={{ fontSize: 20, fontWeight: '700', color: '#111827', letterSpacing: -0.4 }}>Resident Registration</PwaText>
      <PwaText style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Smart Barangay Online Services</PwaText>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 11, gap: 2 }}>
      {[
        { label: '1. Personal', icon: 'person' }, { label: '2. Address', icon: 'location_on' },
        { label: '3. Account', icon: 'key' }, { label: '4. ID Verification', icon: 'verified_user' },
      ].map((item, index) => <View key={item.label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}><Icon name={item.icon} size={14} color={step === index + 1 ? C.blue : '#9ca3af'} /><PwaText numberOfLines={1} style={{ fontSize: 9, fontWeight: '700', color: step === index + 1 ? C.blue : '#9ca3af' }}>{item.label}</PwaText></View>)}
    </View>
    {!!error && <ErrorBox>{error}</ErrorBox>}

    {step === 1 && <View style={{ gap: 14 }}>
      <SectionHeading>Personal Information</SectionHeading>
      <View><FieldLabel>First Name *</FieldLabel><FormInput value={form.firstName} onChangeText={(v) => update('firstName', v)} placeholder="Juan" autoCapitalize="words" /></View>
      <View style={{ flexDirection: 'row', gap: 9 }}>
        <View style={{ flex: 1 }}><FieldLabel>Middle Name</FieldLabel><FormInput value={form.middleName} onChangeText={(v) => update('middleName', v)} placeholder="Santos" autoCapitalize="words" /></View>
        <View style={{ flex: 1 }}><FieldLabel>Last Name *</FieldLabel><FormInput value={form.lastName} onChangeText={(v) => update('lastName', v)} placeholder="Dela Cruz" autoCapitalize="words" /></View>
      </View>
      <View style={{ flexDirection: 'row', gap: 9 }}><View style={{ flex: 1 }}><FieldLabel>Date of Birth *</FieldLabel><FormInput value={form.birthDate} onChangeText={(v) => update('birthDate', v)} placeholder="YYYY-MM-DD" /></View><View style={{ flex: 1 }}><FieldLabel>Gender</FieldLabel><SelectField value={form.gender} options={['Male', 'Female']} onSelect={(v) => update('gender', v as Form['gender'])} /></View></View>
      <View><FieldLabel>Mobile / Contact Number *</FieldLabel><FormInput value={form.contactNumber} onChangeText={(v) => update('contactNumber', v.replace(/\D/g, '').slice(0, 11))} placeholder="09171234567" keyboardType="phone-pad" /></View>
      <PwaText style={{ fontSize: 10, color: C.muted }}>Enter a Philippine mobile number starting with 09.</PwaText>
      <Button title="Next: Residency Address" disabled={!form.firstName.trim() || !form.lastName.trim() || !form.birthDate || !/^09\d{9}$/.test(form.contactNumber)} onPress={() => next(2)} />
    </View>}

    {step === 2 && <View style={{ gap: 14 }}>
      <SectionHeading>Barangay Address</SectionHeading>
      <View style={{ padding: 11, borderRadius: 11, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }}><PwaText style={{ color: '#1d4ed8', fontSize: 11, lineHeight: 17 }}><PwaText style={{ fontWeight: '800' }}>Residency Requirement: </PwaText>You must have resided in this barangay for at least 6 months to be eligible. Your submitted ID and profiling information will be verified by the Barangay.</PwaText></View>
      <View><FieldLabel>Purok / Zone *</FieldLabel><SelectField value={form.purok} options={PUROKS} onSelect={(v) => update('purok', v)} /></View>
      <View><FieldLabel>Street Name *</FieldLabel><FormInput value={form.street} onChangeText={(v) => update('street', v)} placeholder="Rizal Street" autoCapitalize="words" /></View>
      <View><FieldLabel>House / Lot Number</FieldLabel><FormInput value={form.houseNumber} onChangeText={(v) => update('houseNumber', v)} placeholder="House # 123" /></View>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: form.isBoarder }} onPress={() => update('isBoarder', !form.isBoarder)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, backgroundColor: '#f9fafb' }}><View style={{ width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: form.isBoarder ? C.blue : '#9ca3af', backgroundColor: form.isBoarder ? C.blue : C.white, alignItems: 'center', justifyContent: 'center' }}>{form.isBoarder && <PwaText style={{ color: C.white, fontSize: 10, fontWeight: '800' }}>✓</PwaText>}</View><PwaText style={{ flex: 1, fontSize: 12, color: '#374151', fontWeight: '600' }}><Icon name="home" size={14} color="#6b7280" />  I am a boarder / renter in this barangay</PwaText></Pressable>
      {form.isBoarder && <View style={{ gap: 8, padding: 11, borderWidth: 1, borderColor: '#fde68a', borderRadius: 11, backgroundColor: '#fffbeb' }}>
        <PwaText style={{ fontSize: 11, color: '#92400e', lineHeight: 17 }}><PwaText style={{ fontWeight: '800' }}>Boarder Profiling Required: </PwaText>Please provide the total number of boarders and attach your RBI (Record of Barangay Inhabitants).</PwaText>
        <FieldLabel>Total Boarders in Boarding House *</FieldLabel><FormInput value={form.boarderCount} onChangeText={(v) => update('boarderCount', v.replace(/\D/g, ''))} placeholder="e.g. 5" keyboardType="number-pad" />
        <PwaText style={{ fontSize: 10, color: C.muted }}>Count yourself and all co-boarders individually.</PwaText>
        <Button title={rbi?.name || 'Attach RBI document'} secondary onPress={() => void selectRbi()} />
        <PwaText style={{ fontSize: 10, color: C.muted }}>Accepted: PDF, JPG, PNG. Maximum 5MB.</PwaText>
      </View>}
      <View style={{ flexDirection: 'row', gap: 8 }}><Button title="Back" secondary onPress={() => next(1)} /><View style={{ flex: 1 }}><Button title="Next: Account Info" disabled={!form.street.trim()} onPress={() => next(3)} /></View></View>
    </View>}

    {step === 3 && <View style={{ gap: 14 }}>
      <SectionHeading>Account Credentials</SectionHeading>
      <View><FieldLabel>Email Address *</FieldLabel><FormInput value={form.email} onChangeText={(v) => update('email', v.trim())} placeholder="juan@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" /></View>
      <View><FieldLabel>Password *</FieldLabel><FormInput value={form.password} onChangeText={(v) => update('password', v)} placeholder="••••••••" secureTextEntry autoCapitalize="none" /><PwaText style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Minimum 12 characters</PwaText></View>
      <View style={{ flexDirection: 'row', gap: 8 }}><Button title="Back" secondary onPress={() => next(2)} /><View style={{ flex: 1 }}><Button title="Next: Upload Valid ID" disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || form.password.length < 12} onPress={() => next(4)} /></View></View>
    </View>}

    {step === 4 && <View style={{ gap: 14 }}>
      <SectionHeading>Barangay Resident Verification</SectionHeading>
      <View><FieldLabel>Select Government ID Type *</FieldLabel><SelectField value={form.idType} options={ID_TYPES} onSelect={(v) => update('idType', v)} /></View>
      <FieldLabel>Capture Valid ID *</FieldLabel>
      {cameraOpen ? <View style={{ gap: 8 }}>
        {!permission?.granted ? <><PwaText style={{ color: C.muted, fontSize: 12 }}>Camera permission is needed to capture your valid ID.</PwaText><Button title="Allow Camera" onPress={() => void requestPermission()} /></> : <>
          <CameraView ref={camera} style={{ height: 270, borderRadius: 14, overflow: 'hidden' }} facing="back" />
          <View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1 }}><Button title="Cancel" secondary onPress={() => setCameraOpen(false)} /></View><View style={{ flex: 1 }}><Button title="Capture ID" onPress={() => void takeIdPhoto()} /></View></View>
        </>}
      </View> : idImage ? <View style={{ alignItems: 'center', gap: 8 }}><Image source={{ uri: idImage.uri }} style={{ width: '100%', height: 128, borderRadius: 9 }} resizeMode="cover" /><Pressable onPress={() => setCameraOpen(true)}><PwaText style={{ fontSize: 11, fontWeight: '700', color: C.blue }}>Retake ID Photo</PwaText></Pressable></View> : <View style={{ padding: 16, alignItems: 'center', gap: 7, borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 16, backgroundColor: '#f9fafb' }}><Icon name="photo_camera" size={32} color="#9ca3af" /><Pressable onPress={() => { setCameraOpen(true); if (!permission?.granted) void requestPermission(); }} style={{ paddingVertical: 8 }}><PwaText style={{ fontSize: 12, fontWeight: '600', color: '#4b5563' }}>Tap to Start Camera</PwaText><PwaText style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', marginTop: 3 }}>Position ID clearly in frame</PwaText></Pressable></View>}
      <View style={{ padding: 11, backgroundColor: '#eff6ff', borderRadius: 11 }}><PwaText style={{ color: '#1d4ed8', fontSize: 11, lineHeight: 17 }}>The secure portal does not receive the information, ID photo, or RBI file entered in Expo. You will need to enter and attach them again there before submission.</PwaText></View>
      <View style={{ flexDirection: 'row', gap: 8 }}><Button title="Back" secondary onPress={() => { setCameraOpen(false); next(3); }} /><View style={{ flex: 1 }}><Button title={busy ? 'Opening secure portal...' : 'Submit Registration'} disabled={!idImage} loading={busy} onPress={() => void continueToSecureSubmission()} /></View></View>
    </View>}

    <PwaText style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>Already have an account? <PwaText onPress={() => router.replace('/login')} style={{ color: C.blue, fontWeight: '700' }}>Sign In</PwaText></PwaText>
  </View></ScrollView></SafeAreaView>;
}
