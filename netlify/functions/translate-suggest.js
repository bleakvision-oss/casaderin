import { json } from './_shared.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!process.env.DEEPL_API_KEY) return json(400, { error: 'Prevajanje trenutno ni nastavljeno.' });
  const { text, targetLang } = await req.json();
  const r = await fetch('https://api-free.deepl.com/v2/translate', { method:'POST', headers:{ 'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`, 'Content-Type':'application/x-www-form-urlencoded' }, body:new URLSearchParams({ text, source_lang:'SL', target_lang: targetLang }) });
  const j = await r.json();
  if (!r.ok) return json(500, { error: j.message || 'Translation failed' });
  return json(200, { text: j.translations?.[0]?.text || '' });
};
