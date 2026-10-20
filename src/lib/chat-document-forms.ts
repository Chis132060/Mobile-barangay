export type ChatDocumentType = 'clearance' | 'indigency' | 'residency' | 'business';

/** Matches only one explicit PWA-supported resident document request. */
export function requestedChatDocument(message: string): ChatDocumentType | null {
  const matches: ChatDocumentType[] = [];
  if (/barangay\s+clearance|barangay\s+cle[a]?rance/i.test(message)) matches.push('clearance');
  if (/indigency|certificate\s+of\s+indigency/i.test(message)) matches.push('indigency');
  if (/residen(?:cy|ce)\s+certificate|certificate\s+of\s+residen(?:cy|ce)|proof\s+of\s+residen(?:cy|ce)/i.test(message)) matches.push('residency');
  if (/business\s+clearance|business\s+permit/i.test(message)) matches.push('business');
  return matches.length === 1 ? matches[0] : null;
}
