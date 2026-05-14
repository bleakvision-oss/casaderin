import { json, makeToken } from './_shared.js';

export default async (req) => {
  if (req.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  const { password } = JSON.parse(req.body || '{}');
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) return json(500, { error: 'Server env missing' });
  if (password !== process.env.ADMIN_PASSWORD) return json(401, { error: 'Napačno geslo.' });
  return json(200, { token: makeToken() });
};
