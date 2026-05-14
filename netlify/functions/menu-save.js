import { json, saveMenu, verifyToken } from './_shared.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const authHeader = req.headers?.get?.('authorization') || req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!verifyToken(token)) return json(401, { error: 'Neveljavna prijava.' });

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  return json(200, { ok: true, data: await saveMenu(payload) });
};
