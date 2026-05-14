import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

const MENU_KEY = 'menu-data-v2';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

export const LANGS = ['sl', 'en', 'it', 'de'];
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
  sold_out: { sl: 'Razprodano', en: 'Sold out', it: 'Esaurito', de: 'Ausverkauft' },
  hide: { sl: 'Skrij', en: 'Hide', it: 'Nascondi', de: 'Ausblenden' },
  allergens: { sl: 'Alergeni', en: 'Allergens', it: 'Allergeni', de: 'Allergene' },
  add: { sl: 'Dodaj', en: 'Add', it: 'Aggiungi', de: 'Hinzufügen' },
  suggest: { sl: 'Predlagaj prevode', en: 'Suggest translations', it: 'Suggerisci traduzioni', de: 'Übersetzungen vorschlagen' }
};

const item = (id, nameKey, desc, price, allergens=[]) => ({ id, type: nameKey, sortOrder: 0, name: { sl: UI[nameKey]?.sl || '', en: UI[nameKey]?.en || '', it: UI[nameKey]?.it || '', de: UI[nameKey]?.de || '' }, description: desc, price, status: 'available', allergens });

function normalizeMenuData(raw){const base=raw||{};const contact=base.contact||{};return {...base,settings:{restaurantName:base.settings?.restaurantName||'Casa de Rin',phone:base.settings?.phone||contact.phone||'',address:base.settings?.address||contact.location||'',googleMapsUrl:base.settings?.googleMapsUrl||'',instagramUrl:base.settings?.instagramUrl||contact.instagram||'',openingHours:{sl:base.settings?.openingHours?.sl||'',en:base.settings?.openingHours?.en||'',it:base.settings?.openingHours?.it||'',de:base.settings?.openingHours?.de||''},footerText:{sl:base.settings?.footerText?.sl||'',en:base.settings?.footerText?.en||'',it:base.settings?.footerText?.it||'',de:base.settings?.footerText?.de||''},heroImageUrl:base.settings?.heroImageUrl||''}};}

const normalizeItem=(x)=>({ ...x, status: x.status || (x.hidden ? 'hidden' : x.soldOut ? 'sold_out' : 'available') });
const normalizeData=(d)=>({ ...d, sections: Object.fromEntries(Object.entries(d.sections||{}).map(([k,v])=>[k,(v||[]).map(normalizeItem)])) });
export async function loadMenu(){const s=getStore('menu');const d=await s.get(MENU_KEY,{type:'json'});if(!d){await s.setJSON(MENU_KEY,defaultData);return defaultData;}return normalizeData(d);}
export async function saveMenu(data){const s=getStore('menu');const payload={...data,updatedAt:new Date().toISOString()};await s.setJSON(MENU_KEY,payload);return payload;}
export function makeToken(){const secret=process.env.SESSION_SECRET;const payload=`${Date.now()+TOKEN_TTL_MS}`;const sig=crypto.createHmac('sha256',secret).update(payload).digest('hex');return `${payload}.${sig}`;}
export function verifyToken(token){const secret=process.env.SESSION_SECRET;if(!token||!secret)return false;const [exp,sig]=token.split('.');if(!exp||!sig||Date.now()>Number(exp))return false;const expected=crypto.createHmac('sha256',secret).update(exp).digest('hex');return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected));}
export const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
