// Web and unsupported platforms have no native AI runtime.
export async function askLocalSora(_question: string, _language: 'tgl' | 'ceb' | 'en'): Promise<string | null> {
  return null;
}

export async function prepareLocalSora(): Promise<'ready' | 'unsupported'> { return 'unsupported'; }
