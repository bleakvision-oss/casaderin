import { json, resetAnalytics, verifyToken } from './_shared.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const authHeader = req.headers?.get?.('authorization') || req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!verifyToken(token)) return json(401, { error: 'Neveljavna prijava.' });

  await resetAnalytics();
  return json(200, { ok: true });
};
