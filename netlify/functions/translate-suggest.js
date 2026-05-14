import { json } from './_shared.js';

const translationUnavailableMessage = 'Prevajanje trenutno ni nastavljeno. Dodaj DEEPL_API_KEY v Netlify environment variables.';

function isTranslationConfigured() {
  const provider = (process.env.TRANSLATION_PROVIDER || '').trim().toLowerCase();
  const deeplApiKey = (process.env.DEEPL_API_KEY || '').trim();
  if (!provider || !deeplApiKey) return false;
  return provider === 'deepl';
}

export default async (req) => {
  if (req.method === 'GET') return json(200, { configured: isTranslationConfigured() });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!isTranslationConfigured()) return json(400, { error: translationUnavailableMessage });
  const { text, targetLang } = await req.json();
  const r = await fetch('https://api-free.deepl.com/v2/translate', { method:'POST', headers:{ 'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`, 'Content-Type':'application/x-www-form-urlencoded' }, body:new URLSearchParams({ text, source_lang:'SL', target_lang: targetLang }) });
  const j = await r.json();
  if (!r.ok) return json(500, { error: j.message || 'Translation failed' });
  return json(200, { text: j.translations?.[0]?.text || '' });
};
