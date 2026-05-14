import { json, saveMenu, verifyToken } from './_shared.js';

export default async (req) => {
  if (req.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!verifyToken(token)) return json(401, { error: 'Neveljavna prijava.' });

  let payload;
  try {
    payload = JSON.parse(req.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  return json(200, { ok: true, data: await saveMenu(payload) });
};
