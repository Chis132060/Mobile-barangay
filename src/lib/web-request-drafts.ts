// Browser-only encrypted request drafts. No key/passphrase is saved.
// Sensitive requests or attachments are never auto-synced.
type EncryptedDraft = { version: 1; salt: number[]; iv: number[]; ciphertext: number[] };
const DB = 'barangay-encrypted-drafts-v1';
const STORE = 'drafts';
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const validOwner = (s: string) => /^[a-f0-9-]{12,80}$/i.test(s);
const validType = (s: string) => ['clearance', 'indigency', 'residency', 'business'].includes(s);
const usable = () => typeof indexedDB !== 'undefined' && typeof crypto !== 'undefined' && !!crypto.subtle;
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
function key(owner: string, type: string) {
  if (!validOwner(owner) || !validType(type)) throw new Error('Invalid user or document type.');
  return owner + ':' + type;
}
async function derive(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  if (passphrase.length < 12) throw new Error('Use a recovery passphrase of at least 12 characters.');
  const base = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: 210000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function saveWebRequestDraft(owner: string, type: string, purpose: string, passphrase: string): Promise<void> {
  if (!usable()) throw new Error('Encrypted browser storage is unavailable here.');
  if (!purpose.trim() || purpose.length > 1200) throw new Error('Purpose must contain 1–1200 characters.');
  const id = key(owner, type);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const secret = await derive(passphrase, salt);
  const plaintext = encoder.encode(JSON.stringify({ type, purpose: purpose.trim(), status: 'local-only', savedAt: new Date().toISOString() }));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource, additionalData: encoder.encode(id) }, secret, plaintext);
  const record: EncryptedDraft = { version: 1, salt: [...salt], iv: [...iv], ciphertext: [...new Uint8Array(encrypted)] };
  await withStore('readwrite', store => store.put(record, id));
}
export async function readWebRequestDraft(owner: string, type: string, passphrase: string): Promise<{ purpose: string; savedAt: string } | null> {
  if (!usable()) return null;
  const id = key(owner, type);
  const record = await withStore<EncryptedDraft | undefined>('readonly', store => store.get(id));
  if (!record) return null;
  if (record.version !== 1 || record.salt?.length !== 16 || record.iv?.length !== 12 || !Array.isArray(record.ciphertext)) throw new Error('Invalid encrypted draft.');
  try {
    const secret = await derive(passphrase, new Uint8Array(record.salt));
    const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(record.iv), additionalData: encoder.encode(id) }, secret, new Uint8Array(record.ciphertext));
    const obj: unknown = JSON.parse(decoder.decode(data));
    if (!obj || typeof obj !== 'object') throw new Error('Corrupt draft.');
    const draft = obj as { status?: string; type?: string; purpose?: unknown; savedAt?: unknown };
    if (draft.status !== 'local-only' || draft.type !== type || typeof draft.purpose !== 'string' || draft.purpose.length > 1200 || typeof draft.savedAt !== 'string') throw new Error('Invalid draft contents.');
    return { purpose: draft.purpose, savedAt: draft.savedAt };
  } catch { throw new Error('Unable to unlock draft. Check the recovery passphrase.'); }
}
export async function deleteWebRequestDraft(owner: string, type: string): Promise<void> {
  if (!usable()) return;
  await withStore('readwrite', store => store.delete(key(owner, type)));
}
