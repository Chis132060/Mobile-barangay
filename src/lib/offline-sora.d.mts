export type OfflineLanguage = 'tgl' | 'ceb' | 'en';
export type OfflineReply = { answer: string; category: string; offline: true };
export function offlineSoraReply(question: string, language?: OfflineLanguage): OfflineReply | null;
