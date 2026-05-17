import { json, loadAnalytics } from './_shared.js';

export default async () => {
  const views = await loadAnalytics();
  const now = new Date();
  const startToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sevenDaysAgo = new Date(startToday);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const byLanguage = { sl: 0, en: 0, it: 0, de: 0 };
  const byDevice = { mobile: 0, desktop: 0 };
  let today = 0;
  let last7Days = 0;

  for (const v of views) {
    if (byLanguage[v.lang] !== undefined) byLanguage[v.lang] += 1;
    if (byDevice[v.device] !== undefined) byDevice[v.device] += 1;
    const ts = new Date(v.ts);
    if (ts >= startToday) today += 1;
    if (ts >= sevenDaysAgo) last7Days += 1;
  }

  return json(200, { total: views.length, byLanguage, byDevice, today, last7Days });
};
