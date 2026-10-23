import { PwaText } from '@/components/pwa-text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { Button, C, Icon, Input } from '@/components/ui';
import { ChatRequestForm } from '@/components/chat-request-form';
import { requestedChatDocument } from '@/lib/chat-document-forms';
import { apiBaseUrl, pwaApiUrl, supabase } from '@/lib/supabase';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioRecorder } from 'expo-audio';
import { File } from 'expo-file-system';
import { offlineSoraReply } from '@/lib/offline-sora.mjs';
import { useNetworkState } from 'expo-network';
import { clearOfflineHistory, loadOfflineHistory, saveOfflineHistory } from '@/lib/offline-history';

type Language = 'tgl' | 'ceb' | 'en';
type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; offline?: boolean; error?: boolean; citations?: string[]; formType?: string; formSchema?: Record<string, unknown> };
const LANGUAGES: { id: Language; label: string; code: string }[] = [
  { id: 'tgl', label: 'Filipino', code: 'TGL' },
  { id: 'ceb', label: 'Cebuano', code: 'CEB' },
  { id: 'en', label: 'English', code: 'ENG' },
];
const TOPICS = [
  { title: 'Barangay Clearance', query: { tgl: 'Paano makakuha ng Barangay Clearance?', ceb: 'Unsaon pagkuha og Barangay Clearance?', en: 'How do I get a Barangay Clearance?' } },
  { title: 'Certificate of Indigency', query: { tgl: 'Ano ang requirements para sa Certificate of Indigency?', ceb: 'Unsa ang mga kinahanglanon sa Certificate of Indigency?', en: 'What are the requirements for a Certificate of Indigency?' } },
  { title: 'Certificate of Residency', query: { tgl: 'Paano kumuha ng Certificate of Residency?', ceb: 'Unsaon pagkuha og Certificate of Residency?', en: 'How do I apply for a Certificate of Residency?' } },
  { title: 'Business Clearance', query: { tgl: 'Paano mag-apply ng Business Clearance?', ceb: 'Unsaon pag-apply og Business Clearance?', en: 'How do I apply for a Business Clearance?' } },
  { title: 'Barangay Operating Hours', query: { tgl: 'Ano ang oras ng opisina ng barangay?', ceb: 'Unsa ang oras sa opisina sa barangay?', en: 'What are the barangay office hours?' } },
  { title: 'Barangay Laws & Policies', query: { tgl: 'Ano ang mga batas at polisiya na may kinalaman sa barangay?', ceb: 'Unsa ang mga balaod ug polisiya nga may kalabotan sa barangay?', en: 'What laws and policies apply to the barangay?' } },
  { title: 'Barangay Ordinances & Curfew', query: { tgl: 'Ano ang mga ordinansa sa curfew at ingay?', ceb: 'Unsa ang mga ordinansa sa curfew ug kasaba?', en: 'What are the barangay curfew and noise rules?' } },
  { title: 'Upcoming Community Events', query: { tgl: 'Ano ang mga darating na aktibidad ng barangay?', ceb: 'Unsa ang umaabot nga mga kalihokan sa barangay?', en: 'What are the upcoming barangay events?' } },
];
const INTRO = {
  tgl: 'Pumili sa mga opisyal na katanungan sa ibaba para sa agarang sagot at application form:',
  ceb: 'Pilia ang opisyal nga mga pangutana sa ubos alang sa dali nga tubag ug application form:',
  en: 'Select an official question below for instant verified answers and application forms:',
};
const LANGUAGE_KEY = 'barangay-ai-language';
const OFFLINE_MODE_KEY = 'barangay-ai-force-offline';

export function ChatScreen({ user }: { user: { id: string } | null }) {
  const [language, setLanguage] = useState<Language>('tgl');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyOwner, setHistoryOwner] = useState<string | null>(null);
  const previousHistoryOwner = useRef<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [notice, setNotice] = useState('');
  const [forceOffline, setForceOffline] = useState(false);
  const network = useNetworkState();
  const disconnected = network.isConnected === false || network.isInternetReachable === false;
  const [sessionToken] = useState(() => `expo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [apiSessionId] = useState(createSessionId);
  const scroll = useRef<ScrollView>(null);
  const voiceRecorder = useRef<MediaRecorder | null>(null);
  const voiceStream = useRef<MediaStream | null>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioPlayer = useAudioPlayer(null);
  const isWelcome = messages.length === 0;
  const languageMeta = useMemo(() => LANGUAGES.find((entry) => entry.id === language) || LANGUAGES[0], [language]);

  useEffect(() => () => {
    if (voiceRecorder.current?.state === 'recording') voiceRecorder.current.stop();
    voiceStream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    void AsyncStorage.getItem(LANGUAGE_KEY).then((saved) => {
      if (saved === 'tgl' || saved === 'ceb' || saved === 'en') setLanguage(saved);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    void AsyncStorage.getItem(OFFLINE_MODE_KEY).then(value => {
      if (value === 'true') setForceOffline(true);
    }).catch(() => undefined);
  }, []);

  function toggleOfflineMode() {
    const next = !forceOffline;
    setForceOffline(next);
    void AsyncStorage.setItem(OFFLINE_MODE_KEY, String(next)).catch(() => undefined);
    setNotice(next ? 'Offline FAQ enabled. Messages stay on your device during this session; no AI API or Supabase calls are made for offline replies.' : 'Online AI enabled. Internet is required for live replies.');
  }

  useEffect(() => {
    let active = true;
    const owner = user?.id || 'guest';
    void loadOfflineHistory(user?.id).then(saved => {
      if (!active) return;
      const previous = previousHistoryOwner.current;
      if (previous && previous !== owner) {
        setMessages(saved);
        if (owner === 'guest' && previous !== 'guest') void clearOfflineHistory(previous);
      } else {
        setMessages(current => current.length ? current : saved);
      }
      previousHistoryOwner.current = owner;
      setHistoryOwner(owner);
    });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (historyOwner !== (user?.id || 'guest')) return;
    const offline = messages.filter((item): item is ChatMessage & { offline: true } => item.offline === true);
    void saveOfflineHistory(user?.id, offline);
  }, [messages, historyOwner, user?.id]);

  async function send(raw = input) {
    const question = raw.trim();
    if (!question || busy) return;
    const formType = requestedChatDocument(question);
    setInput('');
    setNotice('');
    const userMessageId = `u-${Date.now()}`;
    const offlineAtSend = forceOffline || disconnected || (typeof navigator !== 'undefined' && navigator.onLine === false);
    setMessages((items) => [...items, { id: userMessageId, role: 'user', content: question, offline: offlineAtSend }]);
    setBusy(true);
    let persistedSessionId: string | null = null;
    // Browser offline signal is immediate; native network failures use the same local fallback.
    const definitelyOffline = forceOffline || disconnected || (typeof navigator !== 'undefined' && navigator.onLine === false);
    if (definitelyOffline) {
      const reply = offlineSoraReply(question, language);
      if (reply) setMessages((items) => [...items, { id: `offline-${Date.now()}`, role: 'assistant', content: reply.answer, offline: true }]);
      setNotice('Offline mode: local FAQs only. Live AI and barangay data are unavailable.');
      setBusy(false);
      return;
    }
    try {
      if (user && supabase) {
        const { data, error } = await supabase.from('chat_sessions').upsert({ user_id: user.id, session_token: sessionToken, last_active_at: new Date().toISOString() }, { onConflict: 'session_token' }).select('id').single();
        if (error) throw error;
        persistedSessionId = data?.id || null;
        if (persistedSessionId) {
          const { error: messageError } = await supabase.from('chat_messages').insert({ user_id: user.id, sender: 'user', message: question, session_id: persistedSessionId });
          if (messageError) throw messageError;
        }
      }
      const base = apiBaseUrl || pwaApiUrl;
      if (!base) throw new Error('Set EXPO_PUBLIC_API_BASE_URL to the existing Barangay AI API server to use Ate Sora.');
      const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const usePwaRoute = !apiBaseUrl && !!pwaApiUrl;
      const response = await fetch(`${base.replace(/\/$/, '')}${usePwaRoute ? '/api/chat' : '/api/v1/chat'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify(usePwaRoute ? { message: question, sessionId: sessionToken, language } : { query: question, session_id: apiSessionId, language }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || body.error || 'The assistant is unavailable right now.');
      const answer = String(body.answer || body.response || body.message || '');
      if (!answer) throw new Error('The assistant returned an empty response.');
      const citations = Array.isArray(body.citations) ? body.citations : [];
      const formSchema = body.form_schema || body.formSchema;
      setMessages((items) => [...items, { id: `a-${Date.now()}`, role: 'assistant', content: answer, citations, formType: body.form_type || formType || undefined, formSchema: formSchema && typeof formSchema === 'object' ? formSchema : undefined }]);
      if (persistedSessionId && user && supabase) {
        await supabase.from('chat_messages').insert({ user_id: user.id, sender: 'ai', message: answer, form_type: formType, citations, model_used: 'gemini-1.5-flash', session_id: persistedSessionId });
        await supabase.from('chat_sessions').update({ last_active_at: new Date().toISOString() }).eq('session_token', sessionToken).eq('user_id', user.id);
      }
    } catch (cause) {
      const networkFailure = cause instanceof TypeError || (cause instanceof Error && /network|fetch|offline|timed out|timeout|failed to fetch/i.test(cause.message));
      if (networkFailure || !apiBaseUrl && !pwaApiUrl) {
        setMessages(items => items.map(item => item.id === userMessageId ? { ...item, offline: true } : item));
        const reply = offlineSoraReply(question, language);
        if (reply) setMessages((items) => [...items, { id: `offline-${Date.now()}`, role: 'assistant', content: reply.answer, offline: true }]);
        setNotice('Offline fallback: local FAQs only. Live AI, document submission, and status checks need internet.');
      } else {
        const message = cause instanceof Error ? cause.message : 'The assistant is unavailable right now.';
        setMessages((items) => [...items, { id: `e-${Date.now()}`, role: 'assistant', content: message, error: true }]);
      }
    } finally {
      setBusy(false);
      requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: true }));
    }
  }

  function startVoice() {
    if (forceOffline || disconnected || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      setNotice('Offline voice transcription is not available. Type your question to receive a local FAQ response.');
      return;
    }
    if (Platform.OS !== 'web') {
      void toggleNativeRecording();
      return;
    }
    if (voiceRecorder.current?.state === 'recording') {
      voiceRecorder.current.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setNotice('This browser does not support microphone recording.');
      return;
    }
    setNotice('');
    void navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      voiceStream.current = stream;
      const recorder = new MediaRecorder(stream);
      voiceRecorder.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => { setVoiceListening(false); setNotice('Microphone recording failed. Please try again.'); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        voiceStream.current = null;
        voiceRecorder.current = null;
        setVoiceListening(false);
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        void sendVoiceRecording(blob);
      };
      recorder.start();
      setVoiceListening(true);
    }).catch(() => setNotice('Microphone permission denied or unavailable.'));
  }

  async function toggleNativeRecording() {
    try {
      if (voiceListening) {
        await audioRecorder.stop();
        setVoiceListening(false);
        const uri = audioRecorder.uri;
        if (!uri) throw new Error('The recording could not be saved. Please try again.');
        await sendNativeVoiceRecording(uri);
        return;
      }
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error('Microphone permission is required to send a voice message.');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setNotice('Listening... Tap the microphone to finish.');
      setVoiceListening(true);
    } catch (cause) {
      setVoiceListening(false);
      setNotice(cause instanceof Error ? cause.message : 'Unable to start voice recording.');
    }
  }

  async function sendNativeVoiceRecording(uri: string) {
    const file = new File(uri);
    if (!file.exists || file.size <= 0 || file.size > 4 * 1024 * 1024) {
      setNotice('Recording must be under 4 MB. Please try a shorter question.');
      return;
    }
    if (!apiBaseUrl) {
      setNotice('Set EXPO_PUBLIC_API_BASE_URL to your existing Barangay AI API server to use voice.');
      return;
    }
    setVoiceProcessing(true);
    setNotice('Processing your voice message...');
    try {
      const audioBase64 = encodeBase64(new Uint8Array(await file.arrayBuffer()));
      const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/v1/voice/converse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ audio_base64: audioBase64, mime_type: 'audio/mp4', language, session_id: apiSessionId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || `Voice request failed (HTTP ${response.status}).`);
      const reply = result.data;
      if (!reply?.answer) throw new Error('Ate Sora returned an empty answer.');
      const transcript = String(reply.transcript || '').trim();
      const answer = String(reply.answer);
      setMessages((items) => [...items,
        ...(transcript ? [{ id: `vu-${Date.now()}`, role: 'user' as const, content: transcript }] : []),
        { id: `va-${Date.now()}`, role: 'assistant' as const, content: answer, citations: Array.isArray(reply.citations) ? reply.citations : [] },
      ]);
      if (reply.audio?.audio_url) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        audioPlayer.replace(reply.audio.audio_url);
        audioPlayer.play();
      }
      if (user && supabase) {
        const { data: sessionRow } = await supabase.from('chat_sessions')
          .upsert({ user_id: user.id, session_token: sessionToken, last_active_at: new Date().toISOString() }, { onConflict: 'session_token' })
          .select('id').single();
        if (sessionRow?.id) {
          await supabase.from('chat_messages').insert([
            ...(transcript ? [{ user_id: user.id, sender: 'user', message: transcript, session_id: sessionRow.id }] : []),
            { user_id: user.id, sender: 'ai', message: answer, citations: Array.isArray(reply.citations) ? reply.citations : [], session_id: sessionRow.id },
          ]);
        }
      }
      setNotice(reply.voice_error || '');
    } catch (cause) {
      const message = cause instanceof TypeError && /fetch/i.test(cause.message)
        ? 'Cannot reach the existing Barangay AI API. Confirm its LAN address in .env.local.'
        : cause instanceof Error ? cause.message : 'Voice request failed.';
      setNotice(message);
    } finally {
      setVoiceProcessing(false);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    }
  }

  async function sendVoiceRecording(blob: Blob) {
    if (blob.size === 0 || blob.size > 4 * 1024 * 1024) { setNotice('Recording must be under 4 MB. Please try a shorter question.'); return; }
    if (!apiBaseUrl) { setNotice('Set EXPO_PUBLIC_API_BASE_URL to your existing Barangay AI API server to use voice.'); return; }
    setVoiceProcessing(true); setNotice('Processing your voice message...');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(new Error('Unable to read voice recording.'));
        reader.readAsDataURL(blob);
      });
      const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/v1/voice/converse`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ audio_base64: base64, mime_type: blob.type.split(';')[0] || 'audio/webm', language, session_id: apiSessionId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || `Voice request failed (HTTP ${response.status}).`);
      const reply = result.data;
      if (!reply?.answer) throw new Error('Ate Sora returned an empty answer.');
      const transcript = String(reply.transcript || '').trim();
      const answer = String(reply.answer);
      setMessages((items) => [...items, ...(transcript ? [{ id: `vu-${Date.now()}`, role: 'user' as const, content: transcript }] : []), { id: `va-${Date.now()}`, role: 'assistant' as const, content: answer, citations: Array.isArray(reply.citations) ? reply.citations : [] }]);
      if (reply.audio?.audio_url) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        audioPlayer.replace(reply.audio.audio_url);
        audioPlayer.play();
      }
      if (user && supabase) {
        const { data: sessionRow } = await supabase.from('chat_sessions').upsert({ user_id: user.id, session_token: sessionToken, last_active_at: new Date().toISOString() }, { onConflict: 'session_token' }).select('id').single();
        if (sessionRow?.id && transcript) {
          await supabase.from('chat_messages').insert([
            { user_id: user.id, sender: 'user', message: transcript, session_id: sessionRow.id },
            { user_id: user.id, sender: 'ai', message: answer, citations: Array.isArray(reply.citations) ? reply.citations : [], session_id: sessionRow.id },
          ]);
        }
      }
      setNotice('');
    } catch (cause) {
      const message = cause instanceof TypeError && /fetch/i.test(cause.message)
        ? 'Cannot reach the existing Barangay AI API. Start the PWA/API service and confirm the LAN address in .env.local.'
        : cause instanceof Error ? cause.message : 'Voice request failed.';
      setNotice(message);
    } finally { setVoiceProcessing(false); }
  }

  return <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
    <View style={{ minHeight: 62, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }}>
        <Image source={require('@/assets/images/ate-sora.jpg')} style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#dbeafe' }} />
        <View><PwaText style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Ate Sora</PwaText><PwaText style={{ fontSize: 10, color: user ? '#16a34a' : '#9ca3af', marginTop: 2 }}>{user ? '●  Resident Mode' : '●  Guest Mode'}</PwaText></View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {!isWelcome && <Pressable accessibilityLabel="New conversation" onPress={() => { setMessages([]); void clearOfflineHistory(user?.id); setNotice(''); }} style={circleControl}><Icon name="refresh" size={17} color="#64748b" /></Pressable>}
        <Pressable accessibilityRole="button" accessibilityLabel={forceOffline ? 'Switch to online AI' : 'Use offline FAQs without internet'} accessibilityState={{ selected: forceOffline }} onPress={toggleOfflineMode} style={[circleControl, { width: 48, backgroundColor: forceOffline ? '#fef3c7' : '#f9fafb' }]}>
          <PwaText style={{ color: forceOffline ? '#92400e' : '#475569', fontSize: 10, fontWeight: '800' }}>{forceOffline ? 'OFF' : 'AUTO'}</PwaText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Change response language" onPress={() => setLanguageOpen(true)} style={[circleControl, { width: 48 }]}><PwaText style={{ fontSize: 11, color: '#475569', fontWeight: '800' }}>{languageMeta.code}</PwaText></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={voiceListening ? 'Stop voice recording' : 'Voice input'} onPress={startVoice} disabled={voiceProcessing} style={[circleControl, (voiceListening || voiceProcessing) && { backgroundColor: '#dbeafe', borderColor: C.blue }]}><Icon name={voiceListening ? 'stop' : 'mic_none'} size={17} color={voiceListening || voiceProcessing ? C.blue : '#64748b'} /></Pressable>
      </View>
    </View>

    {(forceOffline || disconnected) && <View style={{ paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fffbeb', borderBottomWidth: 1, borderBottomColor: '#fde68a' }}>
      <PwaText style={{ fontSize: 11, color: '#92400e' }}>Offline FAQ mode · Basic guidance only · No live AI, voice transcription or barangay records</PwaText>
    </View>}
    {!user && <View style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', gap: 7 }}><Icon name="public" size={14} color="#9ca3af" /><PwaText style={{ flex: 1, fontSize: 10, color: '#9ca3af' }}>Browsing as guest. Sign in to track requests and submit applications.</PwaText></View>}
    {!!notice && <PwaText style={{ color: '#9a3412', backgroundColor: '#fff7ed', paddingHorizontal: 14, paddingVertical: 8, fontSize: 11 }}>{voiceListening ? 'Listening... Tap the microphone to finish.' : notice}</PwaText>}

    <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 16, paddingBottom: 18, flexGrow: isWelcome ? 1 : undefined }} keyboardShouldPersistTaps="handled">
      {isWelcome ? <View style={{ alignItems: 'center', paddingTop: 22, paddingBottom: 8 }}>
        <PwaText style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Ate Sora</PwaText>
        <PwaText style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>Official Multilingual Assistant</PwaText>
        <PwaText style={{ maxWidth: 290, marginTop: 16, marginBottom: 20, textAlign: 'center', fontSize: 12, lineHeight: 19, color: '#9ca3af' }}>{INTRO[language]}</PwaText>
        <View style={{ width: '100%', maxWidth: 380, gap: 6 }}>
          <PwaText style={{ fontSize: 10, fontWeight: '600', color: '#9ca3af', letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 4, paddingHorizontal: 2 }}>Official Topics</PwaText>
          {TOPICS.map((topic) => <Pressable key={topic.title} onPress={() => void send(topic.query[language])} style={{ minHeight: 54, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flex: 1 }}><PwaText style={{ fontSize: 11, fontWeight: '600', color: '#1f2937' }}>{topic.title}</PwaText><PwaText numberOfLines={1} style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>{topic.query[language]}</PwaText></View><Icon name="chevron_right" size={15} color="#cbd5e1" />
          </Pressable>)}
        </View>
      </View> : <View style={{ gap: 14 }}>
        {messages.map((message) => <View key={message.id} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', gap: 5 }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 11, backgroundColor: message.role === 'user' ? C.blue : message.error ? '#f9fafb' : '#f9fafb', borderRadius: 16, borderBottomLeftRadius: message.role === 'assistant' ? 3 : 16, borderBottomRightRadius: message.role === 'user' ? 3 : 16, borderWidth: message.role === 'assistant' ? 1 : 0, borderColor: message.error ? '#fecaca' : '#f3f4f6' }}>
            <PwaText style={{ fontSize: 12, lineHeight: 19, color: message.role === 'user' ? C.white : message.error ? C.red : '#1f2937' }}>{message.content}</PwaText>
          </View>
          {message.offline && <PwaText style={{ fontSize: 10, color: '#a16207', paddingHorizontal: 4 }}>Offline FAQ · No internet or live records</PwaText>}
          {!!message.citations?.length && <PwaText style={{ fontSize: 10, color: C.muted, paddingHorizontal: 4 }}>Sources: {message.citations.slice(0, 3).join(', ')}</PwaText>}
          {!!message.formType && <ChatRequestForm type={message.formType as 'clearance' | 'indigency' | 'residency' | 'business'} sessionToken={sessionToken} formSchema={message.formSchema} />}
        </View>)}
        {busy && <PwaText style={{ fontSize: 11, color: C.muted }}>Ate Sora is responding...</PwaText>}
      </View>}
    </ScrollView>

    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
      <Input value={input} onChangeText={setInput} onSubmitEditing={() => void send()} placeholder="Message Ate Sora..." returnKeyType="send" multiline style={{ flex: 1, minHeight: 48, maxHeight: 100, fontSize: 12, borderColor: '#cbd5e1', borderRadius: 12, paddingVertical: 11, textAlignVertical: 'top' }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Send message" onPress={() => void send()} disabled={!input.trim() || busy} style={{ height: 44, minWidth: 56, paddingHorizontal: 13, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', opacity: !input.trim() || busy ? 0.55 : 1 }}><PwaText style={{ fontSize: 12, fontWeight: '800', color: C.white }}>{busy ? '...' : 'Send'}</PwaText></Pressable>
    </View>

    <Modal visible={languageOpen} transparent animationType="fade" onRequestClose={() => setLanguageOpen(false)}>
      <Pressable onPress={() => setLanguageOpen(false)} style={{ flex: 1, backgroundColor: '#0006', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <View style={{ width: '100%', maxWidth: 360, backgroundColor: C.white, borderRadius: 18, padding: 18, gap: 9 }}>
          <PwaText style={{ fontSize: 15, fontWeight: '800', color: C.text }}>Response language</PwaText>
          {LANGUAGES.map((entry) => <Pressable key={entry.id} onPress={() => { setLanguage(entry.id); void AsyncStorage.setItem(LANGUAGE_KEY, entry.id); setLanguageOpen(false); }} style={{ padding: 12, borderRadius: 11, backgroundColor: language === entry.id ? '#eff6ff' : C.white, borderWidth: 1, borderColor: language === entry.id ? '#bfdbfe' : C.border }}><PwaText style={{ color: language === entry.id ? C.blue : C.text, fontSize: 13, fontWeight: '700' }}>{entry.label}</PwaText></Pressable>)}
          <Button title="Close" secondary onPress={() => setLanguageOpen(false)} />
        </View>
      </Pressable>
    </Modal>
  </View>;
}

function encodeBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const hasB = index + 1 < bytes.length;
    const hasC = index + 2 < bytes.length;
    const b = hasB ? bytes[index + 1] : 0;
    const c = hasC ? bytes[index + 2] : 0;
    result += alphabet[a >> 2] + alphabet[((a & 3) << 4) | (b >> 4)]
      + (hasB ? alphabet[((b & 15) << 2) | (c >> 6)] : '=')
      + (hasC ? alphabet[c & 63] : '=');
  }
  return result;
}

const circleControl = { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', alignItems: 'center' as const, justifyContent: 'center' as const };
function createSessionId() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => { const random = Math.floor(Math.random() * 16); return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16); }); }
