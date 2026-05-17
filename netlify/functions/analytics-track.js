import { appendAnalyticsView, json } from './_shared.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  let payload = {};
  try { payload = await req.json(); } catch {}
  const lang = ['sl','en','it','de'].includes(payload.lang) ? payload.lang : 'sl';
  const device = payload.device === 'mobile' ? 'mobile' : 'desktop';
  await appendAnalyticsView({ lang, device, ts: new Date().toISOString(), page: '/menu' });
  return json(200, { ok: true });
};
