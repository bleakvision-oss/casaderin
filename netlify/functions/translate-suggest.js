import { json } from './_shared.js';

const translationUnavailableMessage = 'Prevajanje trenutno ni nastavljeno.';
const deeplFreeEndpoint = 'https://api-free.deepl.com/v2/translate';

function isTranslationConfigured() {
  const deeplApiKey = (process.env.DEEPL_API_KEY || '').trim();
  return deeplApiKey.length > 0;
}

function parseDeepLError(payload) {
  if (!payload || typeof payload !== 'object') return 'Napaka pri prevajanju.';
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message.trim();
  if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail.trim();
  return 'Napaka pri prevajanju.';
}

export default async (req) => {
  if (req.method === 'GET') return json(200, { configured: isTranslationConfigured() });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!isTranslationConfigured()) return json(400, { error: translationUnavailableMessage });
  try {
    const { text, targetLang } = await req.json();
    const allowed = new Set(['EN', 'IT', 'DE']);
    if (typeof text !== 'string' || !text.trim()) return json(400, { error: 'Ni besedila za prevod.' });
    if (!allowed.has(targetLang)) return json(400, { error: 'Nepodprt ciljni jezik.' });
    const r = await fetch(deeplFreeEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ text, source_lang: 'SL', target_lang: targetLang })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const detail = parseDeepLError(j);
      const prefix = r.status === 403 ? 'Neveljaven DeepL API ključ.' : r.status === 456 ? 'Dosežena je kvota DeepL Free.' : `DeepL napaka (${r.status}).`;
      return json(502, { error: `${prefix} ${detail}`.trim() });
    }
    const translated = j.translations?.[0]?.text;
    if (typeof translated !== 'string') return json(502, { error: 'DeepL ni vrnil prevoda.' });
    return json(200, { text: translated });
  } catch {
    return json(500, { error: 'Strežniška napaka pri prevajanju.' });
  }
};
