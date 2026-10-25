// Export curator-approved examples for later supervised fine-tuning.
// Data preparation ONLY: no model weights are updated by this script.
// Usage: node scripts/export-sora-training.mjs output/sora-training.jsonl
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const source = new URL('../src/lib/sora-knowledge.json', import.meta.url);
const data = JSON.parse(readFileSync(source, 'utf8'));
if (!Array.isArray(data.entries)) throw new Error('Invalid Sora knowledge pack');
const target = process.argv[2];
if (!target || !target.endsWith('.jsonl')) throw new Error('Provide an explicit .jsonl output path');
const languageNames = { tgl: 'Filipino', ceb: 'Cebuano', en: 'English' };
const lines = [];
const seen = new Set();
for (const entry of data.entries) {
  for (const [language, languageName] of Object.entries(languageNames)) {
    const answer = entry.answers?.[language];
    if (!answer) continue;
    for (const question of entry.keywords || []) {
      const key = language + ':' + question.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(JSON.stringify({
        messages: [
          { role: 'system', content: 'You are Ate Sora, an offline barangay FAQ assistant. Answer in ' + languageName + '. Never fabricate real-time barangay records, fees or policies.' },
          { role: 'user', content: question },
          { role: 'assistant', content: answer },
        ],
        knowledge_id: entry.id,
        dataset_version: data.version,
      }));
    }
  }
}
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, lines.join('\n') + '\n', 'utf8');
process.stdout.write('Exported ' + lines.length + ' validated examples to ' + target + '\n');
