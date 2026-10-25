import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { saveRequestDraft, readRequestDraft, clearRequestDraft } from '@/lib/local-request-drafts';
import { Platform } from 'react-native';
import { Button, C, Card, ErrorBox, Input, Label } from '@/components/ui';
import type { ChatDocumentType } from '@/lib/chat-document-forms';

const CATALOG: Record<ChatDocumentType, { title: string; fee: number }> = {
  clearance: { title: 'Barangay Clearance', fee: 50 },
  indigency: { title: 'Certificate of Indigency', fee: 0 },
  residency: { title: 'Certificate of Residency', fee: 30 },
  business: { title: 'Business Clearance', fee: 500 },
};
type PickedFile = DocumentPicker.DocumentPickerAsset;
export type ChatFormSchema = { fields?: { name: string; label?: string; type?: string; required?: boolean; options?: string[]; placeholder?: string }[] };

export function ChatRequestForm({ type, sessionToken, formSchema }: { type: ChatDocumentType; sessionToken: string; formSchema?: ChatFormSchema }) {
  const details = CATALOG[type];
  const [purpose, setPurpose] = useState('');
  const [contact, setContact] = useState('');
  const [extra, setExtra] = useState({ idType: 'PhilID / National ID', incomeBracket: 'Below ₱10,000', dependentsCount: '1', assistanceType: 'Medical / Hospitalization', yearsResiding: '5 years', purokAddress: 'Purok 1', businessName: '', businessNature: 'Retail / Sari-Sari Store', registrationType: 'New', ownerContactNumber: '', dtiSecRegistrationNo: '', tin: '', establishmentType: 'Sari-sari store', capitalization: '', grossSalesPreviousYear: '', businessAddress: '' });
  const [residentId, setResidentId] = useState<string | null>(null);
  const [draftOwner, setDraftOwner] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const paid = details.fee > 0;
  const reservedFields = ['purpose', 'document_type', 'idType', 'incomeBracket', 'dependentsCount', 'yearsResiding', 'purokAddress', 'businessName', 'businessNature'];
  const customSchemaFields = (formSchema?.fields || []).filter((field) => field.name && !reservedFields.includes(field.name));

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (active && session?.user?.id) {
        setDraftOwner(session.user.id);
        const draft = await readRequestDraft(session.user.id, type);
        if (active && draft) { setPurpose(draft.purpose); setDraftNotice('Local draft restored. Not submitted to the barangay.'); }
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('residents').select('id,verification_status,contact_number').eq('user_id', user.id).maybeSingle();
      if (active && data?.verification_status === 'Verified') {
        setResidentId(data.id);
        setContact(data.contact_number || '');
      }
    };
    void load();
    return () => { active = false; };
  }, [type]);

  async function saveDraft() {
    const ok = await saveRequestDraft(draftOwner, type, purpose.trim());
    setDraftNotice(ok ? 'Saved locally on this device only. NOT submitted; attachments and other fields are not saved.' : 'Secure local draft storage is only available on a signed-in native device. This web form is not stored offline.');
  }

  async function discardDraft() {
    await clearRequestDraft(draftOwner, type);
    setDraftNotice('Local draft deleted from this device.');
  }

  const update = (key: keyof typeof extra, value: string) => setExtra((old) => ({ ...old, [key]: value }));

  async function pickAttachment() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const selected = result.assets[0];
    if ((selected.size || 0) > 5 * 1024 * 1024) return setError('The selected file is larger than the 5 MB limit.');
    setError('');
    setFile(selected);
  }

  async function submit() {
    setError('');
    try {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !residentId) throw new Error('Your resident account must be verified before submitting a request.');
      if (!purpose.trim() || purpose.length > 2000) throw new Error('Enter a purpose (up to 2000 characters).');
      const missingSchemaField = customSchemaFields.find((field) => field.required && !String(customFields[field.name] || '').trim());
      if (missingSchemaField) throw new Error(`Complete the required ${missingSchemaField.label || missingSchemaField.name} field.`);
      if ((type === 'residency' || type === 'business') && !file) throw new Error(type === 'residency' ? 'Attach proof of address for the Certificate of Residency.' : 'Attach at least one business registration or supporting document.');
      if (type === 'business' && (!extra.businessName.trim() || !extra.businessNature.trim() || !extra.businessAddress.trim())) throw new Error('Business name, nature, and address are required.');
      setBusy(true);

      const { data: docType, error: docTypeError } = await supabase.from('document_types').select('id').eq('name', details.title).maybeSingle();
      if (docTypeError) throw docTypeError;
      if (!docType) throw new Error(`${details.title} is not configured by the Barangay. Please contact the administrator.`);

      const { data: transaction, error: transactionError } = await supabase.from('request_transactions').insert({
        resident_id: residentId,
        user_id: user.id,
        session_id: sessionToken,
        status: 'Pending',
        total_fee: details.fee,
        payment_status: paid ? 'Unpaid' : 'Free',
      }).select('id').single();
      if (transactionError || !transaction) throw transactionError || new Error('Unable to create request transaction.');

      const formData: Record<string, unknown> = {
        purpose: purpose.trim(),
        contactNumber: contact,
        requestedVia: 'Chatbot AI Dynamic Form',
        requirementsStatus: file ? 'Complete' : 'Pending',
        ...customFields,
      };
      if (type === 'clearance') formData.idType = extra.idType;
      if (type === 'indigency') Object.assign(formData, { incomeBracket: extra.incomeBracket, dependentsCount: extra.dependentsCount, assistanceType: extra.assistanceType });
      if (type === 'residency') Object.assign(formData, { yearsResiding: extra.yearsResiding, purokAddress: extra.purokAddress });
      if (type === 'business') Object.assign(formData, { businessName: extra.businessName, businessNature: extra.businessNature, registrationType: extra.registrationType, ownerContactNumber: extra.ownerContactNumber || contact, dtiSecRegistrationNo: extra.dtiSecRegistrationNo, tin: extra.tin, establishmentType: extra.establishmentType, capitalization: extra.capitalization, grossSalesPreviousYear: extra.grossSalesPreviousYear, businessAddress: extra.businessAddress });

      const { data: request, error: requestError } = await supabase.from('document_requests').insert({
        resident_id: residentId,
        document_type_id: docType.id,
        transaction_id: transaction.id,
        status: 'Pending',
        fee_amount: details.fee,
        payment_status: paid ? 'Unpaid' : 'Free',
        session_id: sessionToken,
        form_data: formData,
        requirements_status: file ? 'Complete' : 'Pending',
        submitted_at: new Date().toISOString(),
        remarks: `[Session ${sessionToken}] ${details.title}: ${purpose.trim()}`,
        requested_date: new Date().toISOString(),
      }).select('id').single();
      if (requestError || !request) throw requestError || new Error('Unable to create document request.');
      setRequestId(request.id);

      if (file) {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
        if (!['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(extension)) throw new Error('Choose a PDF, JPG, PNG, or Word document.');
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${user.id}/${sessionToken}/${request.id}/${type}-${safeName}`;
        const blob = await (await fetch(file.uri)).blob();
        const { error: uploadError } = await supabase.storage.from('request-attachments').upload(storagePath, blob, { contentType: file.mimeType || 'application/octet-stream', upsert: false });
        if (uploadError) throw new Error(`Unable to upload ${file.name}: ${uploadError.message}`);
        const { error: attachmentError } = await supabase.from('documents').insert({ request_id: request.id, file_url: storagePath, file_name: file.name, mime_type: file.mimeType || 'application/octet-stream', document_kind: 'attachment', uploaded_by: user.id, field_snapshot: { service: details.title, session_id: sessionToken } });
        if (attachmentError) throw new Error(`Unable to record ${file.name}: ${attachmentError.message}`);
      }

      if (type === 'business') {
        const { error: businessError } = await supabase.from('businesses').insert({ owner_id: residentId, business_name: extra.businessName.trim(), business_type: extra.businessNature || 'Other', business_nature: extra.businessNature || null, registration_type: extra.registrationType || 'New', owner_contact_number: extra.ownerContactNumber || contact || null, dti_sec_registration_no: extra.dtiSecRegistrationNo || null, tin: extra.tin || null, establishment_type: extra.establishmentType || null, capitalization: extra.capitalization ? Number(extra.capitalization) : null, gross_sales_previous_year: extra.grossSalesPreviousYear ? Number(extra.grossSalesPreviousYear) : null, address: extra.businessAddress, status: 'Pending' });
        if (businessError) throw businessError;
      }
      await supabase.from('transactions').insert({ user_id: user.id, module: 'Documents', action: 'Create Request', description: `Submitted ${details.title} via AI session ${sessionToken}.` });
      await clearRequestDraft(user.id, type);
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to submit the document request.');
    } finally {
      setBusy(false);
    }
  }

  if (submitted) return <Card style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}><Text style={{ fontSize: 14, fontWeight: '800', color: '#065f46' }}>Application submitted successfully</Text><Text style={{ fontSize: 12, color: '#047857' }}>{details.title} · Request {requestId.slice(0, 10)} · {paid ? `₱${details.fee.toFixed(2)}` : 'FREE'}</Text><Button title="Track in My Requests" onPress={() => router.replace('/requests')} /></Card>;

  return <View style={{ marginTop: 10, padding: 14, borderRadius: 18, borderWidth: 2, borderColor: '#bfdbfe', backgroundColor: '#eff6ff', gap: 10 }}><View><Text style={{ fontSize: 13, fontWeight: '800', color: '#172554' }}>Online Document Application</Text><Text style={{ fontSize: 10, color: C.blue }}>{details.title} · {paid ? `₱${details.fee.toFixed(2)}` : 'FREE'}</Text></View>{!residentId&&<><Text style={{ fontSize: 11, color: '#92400e' }}>Sign in with a verified resident account to submit this application.</Text><Button title="Sign in" secondary onPress={()=>router.replace('/login')}/></>}{!!error&&<ErrorBox>{error}</ErrorBox>}<Text style={{fontSize:11,color:'#92400e'}}>Offline drafts save only the purpose on a native device. Attachments, payments and submission require internet.</Text><Button title="Save local draft (not submitted)" secondary onPress={() => void saveDraft()} disabled={busy || Platform.OS === 'web' || !draftOwner} /><Button title="Delete local draft" secondary onPress={() => void discardDraft()} disabled={busy || Platform.OS === 'web' || !draftOwner} />{!!draftNotice && <Text style={{fontSize:11,color:'#475569'}}>{draftNotice}</Text>}<Label>Purpose / Layunin *</Label><Input value={purpose} onChangeText={setPurpose} placeholder="Explain why you need this document" maxLength={2000} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
    {type === 'clearance'&&<><Label>Identification type</Label><Input value={extra.idType} onChangeText={(v)=>update('idType',v)} /></>}
    {type === 'indigency'&&<><Label>Income bracket</Label><Input value={extra.incomeBracket} onChangeText={(v)=>update('incomeBracket',v)} /><Label>Dependents</Label><Input value={extra.dependentsCount} onChangeText={(v)=>update('dependentsCount',v)} keyboardType="number-pad"/><Label>Assistance type</Label><Input value={extra.assistanceType} onChangeText={(v)=>update('assistanceType',v)} /></>}
    {type === 'residency'&&<><Label>Years residing</Label><Input value={extra.yearsResiding} onChangeText={(v)=>update('yearsResiding',v)} /><Label>Purok address</Label><Input value={extra.purokAddress} onChangeText={(v)=>update('purokAddress',v)} /></>}
    {type === 'business'&&<><Label>Business name *</Label><Input value={extra.businessName} onChangeText={(v)=>update('businessName',v)} /><Label>Business nature *</Label><Input value={extra.businessNature} onChangeText={(v)=>update('businessNature',v)} /><Label>Business address *</Label><Input value={extra.businessAddress} onChangeText={(v)=>update('businessAddress',v)} /><Label>Registration type</Label><Input value={extra.registrationType} onChangeText={(v)=>update('registrationType',v)} /><Label>Owner contact number</Label><Input value={extra.ownerContactNumber} onChangeText={(v)=>update('ownerContactNumber',v)} keyboardType="phone-pad"/><Label>DTI / SEC registration number</Label><Input value={extra.dtiSecRegistrationNo} onChangeText={(v)=>update('dtiSecRegistrationNo',v)} /><Label>TIN</Label><Input value={extra.tin} onChangeText={(v)=>update('tin',v)} /><Label>Establishment type</Label><Input value={extra.establishmentType} onChangeText={(v)=>update('establishmentType',v)} /><Label>Capitalization</Label><Input value={extra.capitalization} onChangeText={(v)=>update('capitalization',v)} keyboardType="decimal-pad"/><Label>Gross sales last year</Label><Input value={extra.grossSalesPreviousYear} onChangeText={(v)=>update('grossSalesPreviousYear',v)} keyboardType="decimal-pad"/></>}
    {customSchemaFields.map((field)=><View key={field.name}><Label>{field.label||field.name}{field.required?' *':''}</Label>{field.type==='select'&&field.options?.length?<View style={{gap:6}}>{field.options.map((option)=><Pressable key={option} onPress={()=>setCustomFields((old)=>({...old,[field.name]:option}))} style={{padding:10,borderRadius:10,borderWidth:1,borderColor:customFields[field.name]===option?C.blue:C.border,backgroundColor:customFields[field.name]===option?'#eff6ff':C.white}}><Text style={{fontSize:12,color:C.text}}>{option}</Text></Pressable>)}</View>:<Input value={customFields[field.name]||''} onChangeText={(value)=>setCustomFields((old)=>({...old,[field.name]:value}))} placeholder={field.placeholder||field.label||field.name} keyboardType={field.type==='number'?'decimal-pad':'default'} />}</View>)}
    {(type === 'residency'||type === 'business')&&<><Label>{type === 'residency'?'Proof of address *':'Registration or supporting document *'}</Label><Button title={file?.name||'Attach PDF / JPG / PNG / DOC'} secondary onPress={()=>void pickAttachment()} /></>}
    <Button title="Submit document request" onPress={()=>void submit()} loading={busy} disabled={!residentId} />
  </View>;
}
