import knowledge from './sora-knowledge.json';
import { lookupKnowledge } from './sora-knowledge-retrieval.mjs';
export function knowledgeReply(question: string, language: 'tgl' | 'ceb' | 'en') {
  return lookupKnowledge(question, language, knowledge);
}
