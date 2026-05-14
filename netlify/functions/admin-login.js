import { json, makeToken } from './_shared.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return json(500, { error: 'Server env missing' });
  }

  let password;
  try {
    ({ password } = await req.json());
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  if (password !== process.env.ADMIN_PASSWORD) return json(401, { error: 'Napačno geslo.' });
  return json(200, { token: makeToken() });
};
