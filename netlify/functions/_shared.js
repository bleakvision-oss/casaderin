import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

const MENU_KEY = 'menu-data-v2';
const ANALYTICS_KEY = 'menu-analytics-v1';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

export const LANGS = ['sl', 'en', 'it', 'de'];
export const DRINK_CATEGORY_KEYS = ['house_tea', 'coffee_hot', 'juices_soda', 'other'];
export const ALLERGENS = {
  gluten: { sl: 'gluten', en: 'gluten', it: 'glutine', de: 'Gluten' },
  mleko: { sl: 'mleko', en: 'milk', it: 'latte', de: 'Milch' },
  jajca: { sl: 'jajca', en: 'eggs', it: 'uova', de: 'Eier' },
  soja: { sl: 'soja', en: 'soy', it: 'soia', de: 'Soja' },
  'oreščki': { sl: 'oreščki', en: 'nuts', it: 'frutta a guscio', de: 'Schalenfrüchte' },
  'arašidi': { sl: 'arašidi', en: 'peanuts', it: 'arachidi', de: 'Erdnüsse' },
  sezam: { sl: 'sezam', en: 'sesame', it: 'sesamo', de: 'Sesam' },
  zelena: { sl: 'zelena', en: 'celery', it: 'sedano', de: 'Sellerie' },
  gorčica: { sl: 'gorčica', en: 'mustard', it: 'senape', de: 'Senf' },
  sulfiti: { sl: 'sulfiti', en: 'sulphites', it: 'solfiti', de: 'Sulfite' },
  volčji_bob: { sl: 'volčji bob', en: 'lupin', it: 'lupini', de: 'Lupinen' },
  mehkužci: { sl: 'mehkužci', en: 'molluscs', it: 'molluschi', de: 'Weichtiere' },
  raki: { sl: 'raki', en: 'crustaceans', it: 'crostacei', de: 'Krebstiere' },
  ribe: { sl: 'ribe', en: 'fish', it: 'pesce', de: 'Fisch' }
};

export const UI = {
  status_available: { sl: 'Na voljo', en: 'Available', it: 'Disponibile', de: 'Verfügbar' },
  status_low: { sl: 'Kmalu zmanjka', en: 'Almost gone', it: 'Quasi esaurito', de: 'Fast ausverkauft' },
  status_sold_out: { sl: 'Razprodano', en: 'Sold out', it: 'Esaurito', de: 'Ausverkauft' },
  status_hidden: { sl: 'Skrito', en: 'Hidden', it: 'Nascosto', de: 'Ausgeblendet' },
  section_daily: { sl: 'Dnevna ponudba', en: 'Daily offer', it: 'Offerta del giorno', de: 'Tagesangebot' },
  section_weekly: { sl: 'Tedenska ponudba', en: 'Weekly offer', it: 'Offerta settimanale', de: 'Wochenangebot' },
  section_sweets_drinks: { sl: 'Sladice in pijača', en: 'Sweets and beverages', it: 'Dolci e bevande', de: 'Süßes und Getränke' },
  stew: { sl: 'Enolončnica', en: 'Soup / stew', it: 'Zuppa / stufato', de: 'Suppe / Eintopf' },
  snack: { sl: 'Malica', en: 'Lunch', it: 'Pranzo del giorno', de: 'Tagesgericht' },
  lunch: { sl: 'Kosilo', en: 'Lunch menu', it: 'Menu del giorno', de: 'Tagesmenü' },
  salad_bowl: { sl: 'Solatna bovla', en: 'Salad bowl', it: 'Insalata mista / bowl', de: 'Salat Bowl' },
  vegan_sandwich: { sl: 'Veganski sendvič', en: 'Vegan sandwich', it: 'Panino vegano', de: 'Veganes Sandwich' },
  vegetarian_sandwich: { sl: 'Vegetarijanski sendvič', en: 'Vegetarian sandwich', it: 'Panino vegetariano', de: 'Vegetarisches Sandwich' },
  dessert: { sl: 'Sladica', en: 'Dessert', it: 'Dolce', de: 'Dessert' },
  beverage: { sl: 'Pijača', en: 'Beverage', it: 'Bevanda', de: 'Getränk' },
  drink_cat_house_tea: { sl: 'De Rinov hišni čaj', en: 'De Rin house tea', it: 'Tè della casa De Rin', de: 'De Rin Haustee' },
  drink_cat_coffee_hot: { sl: 'Kava in topli napitki', en: 'Coffee and hot drinks', it: 'Caffè e bevande calde', de: 'Kaffee und Heißgetränke' },
  drink_cat_juices_soda: { sl: 'Sokovi in gazirane pijače', en: 'Juices and soft drinks', it: 'Succhi e bevande gassate', de: 'Säfte und Softdrinks' },
  drink_cat_other: { sl: 'Ostale pijače', en: 'Other drinks', it: 'Altre bevande', de: 'Weitere Getränke' },
  sold_out: { sl: 'Razprodano', en: 'Sold out', it: 'Esaurito', de: 'Ausverkauft' },
  hide: { sl: 'Skrij', en: 'Hide', it: 'Nascondi', de: 'Ausblenden' },
  allergens: { sl: 'Alergeni', en: 'Allergens', it: 'Allergeni', de: 'Allergene' },
  add: { sl: 'Dodaj', en: 'Add', it: 'Aggiungi', de: 'Hinzufügen' },
  suggest: { sl: 'Predlagaj prevode', en: 'Suggest translations', it: 'Suggerisci traduzioni', de: 'Übersetzungen vorschlagen' },
  last_updated_at: { sl: 'Nazadnje posodobljeno ob', en: 'Last updated at', it: 'Ultimo aggiornamento alle', de: 'Zuletzt aktualisiert um' },
  open_google_maps: { sl: 'Odpri v Google Maps', en: 'Open in Google Maps', it: 'Apri in Google Maps', de: 'In Google Maps öffnen' },
  phone_label: { sl: 'Telefon', en: 'Phone', it: 'Telefono', de: 'Telefon' },
  address_label: { sl: 'Naslov', en: 'Address', it: 'Indirizzo', de: 'Adresse' },
  opening_hours_label: { sl: 'Odpiralni čas', en: 'Opening hours', it: 'Orari di apertura', de: 'Öffnungszeiten' },
  instagram_label: { sl: 'Instagram', en: 'Instagram', it: 'Instagram', de: 'Instagram' }
};

const item = (id, nameKey, desc, price, allergens = []) => ({ id, type: nameKey, sortOrder: 0, name: { sl: UI[nameKey]?.sl || '', en: UI[nameKey]?.en || '', it: UI[nameKey]?.it || '', de: UI[nameKey]?.de || '' }, description: desc, price, status: 'available', allergens });

const defaultDrinkCategories = [
  { id: 'house_tea', title: UI.drink_cat_house_tea, items: [] },
  { id: 'coffee_hot', title: UI.drink_cat_coffee_hot, items: [] },
  { id: 'juices_soda', title: UI.drink_cat_juices_soda, items: [] }
];

function normalizeItemStatus(x) {
  const status = x.status || (x.hidden ? 'hidden' : x.soldOut ? 'sold_out' : x.lowStock ? 'low' : 'available');
  return { ...x, status, hidden: status === 'hidden', soldOut: status === 'sold_out', lowStock: status === 'low' };
}

function normalizeDrinkCategories(base) {
  if (Array.isArray(base.drinkCategories)) {
    return base.drinkCategories.map((cat) => ({ ...cat, items: (cat.items || []).map(normalizeItemStatus) }));
  }
  const migratedItems = (base.sections?.drinks || []).map(normalizeItemStatus);
  const categories = structuredClone(defaultDrinkCategories);
  if (migratedItems.length) categories.push({ id: 'other', title: UI.drink_cat_other, items: migratedItems });
  return categories;
}

function normalizeMenuData(raw) {
  const base = raw || {};
  const contact = base.contact || {};
  const sections = base.sections || {};
  return {
    ...base,
    settings: {
      restaurantName: base.settings?.restaurantName || 'Casa de Rin',
      phone: base.settings?.phone || contact.phone || '',
      address: base.settings?.address || contact.location || '',
      googleMapsUrl: base.settings?.googleMapsUrl || '',
      instagramUrl: base.settings?.instagramUrl || contact.instagram || '',
      openingHours: Object.fromEntries(LANGS.map((l) => [l, base.settings?.openingHours?.[l] || ''])),
      footerText: Object.fromEntries(LANGS.map((l) => [l, base.settings?.footerText?.[l] || ''])),
      heroImageUrl: base.settings?.heroImageUrl || ''
    },
    sections: {
      daily: (sections.daily || []).map(normalizeItemStatus),
      lunch: (sections.lunch || []).map(normalizeItemStatus),
      weekly: (sections.weekly || []).map(normalizeItemStatus),
      desserts: (sections.desserts || []).map(normalizeItemStatus),
      drinks: (sections.drinks || []).map(normalizeItemStatus)
    },
    drinkCategories: normalizeDrinkCategories(base)
  };
}

function upsertDishLibrary(payload) { /* unchanged logic */
  const entries = [];
  const sections = payload.sections || {};
  Object.values(sections).forEach((arr) => (arr || []).forEach((it) => entries.push({ name: it.name || {}, description: it.description || {}, price: it.price || '', allergens: Array.isArray(it.allergens) ? [...it.allergens] : [], soldOut: !!it.soldOut, hidden: !!it.hidden, lowStock: !!it.lowStock, type: it.type || '' })));
  (payload.drinkCategories || []).forEach((cat) => (cat.items || []).forEach((it) => entries.push({ name: it.name || {}, description: it.description || {}, price: it.price || '', allergens: Array.isArray(it.allergens) ? [...it.allergens] : [], soldOut: !!it.soldOut, hidden: !!it.hidden, lowStock: !!it.lowStock, type: it.type || 'beverage' })));
  const existing = Array.isArray(payload.dishLibrary) ? payload.dishLibrary : [];
  const now = new Date().toISOString();
  const keyOf = (d) => [d.type, d.name?.sl, d.name?.en, d.name?.it, d.name?.de, d.description?.sl, d.description?.en, d.description?.it, d.description?.de].map((x) => (x || '').trim().toLowerCase()).join('|');
  const map = new Map(existing.map((d) => [keyOf(d), d]));
  entries.forEach((e) => {
    const k = keyOf(e);
    if (!k.replace(/\|/g, '')) return;
    const found = map.get(k);
    if (found) Object.assign(found, { ...e, lastUsed: now });
    else map.set(k, { ...e, lastUsed: now });
  });
  payload.dishLibrary = Array.from(map.values());
  return payload;
}

const defaultData = { updatedAt: new Date().toISOString(), dishLibrary: [], translations: UI, allergens: ALLERGENS, settings: { restaurantName: 'Casa de Rin', phone: '+386 40 000 000', address: 'Casa de Rin, Ljubljana', googleMapsUrl: '', instagramUrl: 'https://instagram.com/casaderin', openingHours: { sl: '', en: '', it: '', de: '' }, footerText: { sl: '', en: '', it: '', de: '' }, heroImageUrl: '' }, sections: { daily: [item('stew', 'stew', { sl: 'Zelenjavna enolončnica dneva.', en: 'Vegetable stew of the day.', it: 'Zuppa vegetale del giorno.', de: 'Gemüse-Eintopf des Tages.' }, '7.50', ['zelena'])], lunch: [item('lunch', 'lunch', { sl: 'Mala enolončnica + malica + solata + sladica.', en: 'Small stew + lunch + salad + dessert.', it: 'Zuppa piccola + pranzo + insalata + dolce.', de: 'Kleiner Eintopf + Tagesgericht + Salat + Dessert.' }, '12.90', ['gluten', 'soja'])], weekly: [], desserts: [], drinks: [] }, drinkCategories: [{ id: 'house_tea', title: UI.drink_cat_house_tea, items: [item('p1', 'beverage', { sl: 'Domača pijača.', en: 'Homemade beverage.', it: 'Bevanda fatta in casa.', de: 'Hausgemachtes Getränk.' }, '2.00')] }, { id: 'coffee_hot', title: UI.drink_cat_coffee_hot, items: [] }, { id: 'juices_soda', title: UI.drink_cat_juices_soda, items: [] }] };

export async function loadMenu() { const s = getStore('menu'); const d = await s.get(MENU_KEY, { type: 'json' }); if (!d) { await s.setJSON(MENU_KEY, defaultData); return defaultData; } const normalized = normalizeMenuData(d); if (JSON.stringify(normalized) !== JSON.stringify(d)) await s.setJSON(MENU_KEY, normalized); return normalized; }
export async function saveMenu(data) { const s = getStore('menu'); const payload = upsertDishLibrary({ ...normalizeMenuData(data), updatedAt: new Date().toISOString() }); await s.setJSON(MENU_KEY, payload); return payload; }
export async function appendAnalyticsView(view) { const s = getStore('menu'); const existing = await s.get(ANALYTICS_KEY, { type: 'json' }) || []; const next = [...existing, view].slice(-5000); await s.setJSON(ANALYTICS_KEY, next); return next; }
export async function loadAnalytics() { const s = getStore('menu'); return await s.get(ANALYTICS_KEY, { type: 'json' }) || []; }
export async function resetAnalytics() { const s = getStore('menu'); await s.setJSON(ANALYTICS_KEY, []); return []; }
export function makeToken() { const secret = process.env.SESSION_SECRET; const payload = `${Date.now() + TOKEN_TTL_MS}`; const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex'); return `${payload}.${sig}`; }
export function verifyToken(token) { const secret = process.env.SESSION_SECRET; if (!token || !secret) return false; const [exp, sig] = token.split('.'); if (!exp || !sig || Date.now() > Number(exp)) return false; const expected = crypto.createHmac('sha256', secret).update(exp).digest('hex'); return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); }
export const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
