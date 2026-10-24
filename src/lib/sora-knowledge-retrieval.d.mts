export type SoraLanguage = 'tgl' | 'ceb' | 'en';
export type KnowledgePack = { entries: Array<{id: string; intent: string; keywords: string[]; answers: Record<SoraLanguage,string>}> };
export function lookupKnowledge(question: string, language: SoraLanguage, pack: KnowledgePack): {answer:string;category:string;offline:true;knowledgeId:string} | null;
