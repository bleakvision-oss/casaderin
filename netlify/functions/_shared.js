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

const item = (id, nameKey, desc, price, allergens=[]) => ({ id, type: nameKey, sortOrder: 0, name: { sl: UI[nameKey]?.sl || '', en: UI[nameKey]?.en || '', it: UI[nameKey]?.it || '', de: UI[nameKey]?.de || '' }, description: desc, price, soldOut: false, hidden: false, allergens });

function normalizeMenuData(raw){const base=raw||{};const contact=base.contact||{};return {...base,settings:{restaurantName:base.settings?.restaurantName||'Casa de Rin',phone:base.settings?.phone||contact.phone||'',address:base.settings?.address||contact.location||'',googleMapsUrl:base.settings?.googleMapsUrl||'',instagramUrl:base.settings?.instagramUrl||contact.instagram||'',openingHours:{sl:base.settings?.openingHours?.sl||'',en:base.settings?.openingHours?.en||'',it:base.settings?.openingHours?.it||'',de:base.settings?.openingHours?.de||''},footerText:{sl:base.settings?.footerText?.sl||'',en:base.settings?.footerText?.en||'',it:base.settings?.footerText?.it||'',de:base.settings?.footerText?.de||''},heroImageUrl:base.settings?.heroImageUrl||''}};}

const defaultData = { updatedAt: new Date().toISOString(), translations: UI, allergens: ALLERGENS, settings:{ restaurantName:'Casa de Rin', phone:'+386 40 000 000', address:'Casa de Rin, Ljubljana', googleMapsUrl:'', instagramUrl:'https://instagram.com/casaderin', openingHours:{ sl:'', en:'', it:'', de:'' }, footerText:{ sl:'', en:'', it:'', de:'' }, heroImageUrl:'' }, sections:{ daily:[item('stew','stew',{sl:'Zelenjavna enolončnica dneva.',en:'Vegetable stew of the day.',it:'Zuppa vegetale del giorno.',de:'Gemüse-Eintopf des Tages.'},'7.50',['zelena']), item('snack','snack',{sl:'Čičerikina solata, veganski namaz in kruh.',en:'Chickpea salad, vegan spread and bread.',it:'Insalata di ceci, crema vegana e pane.',de:'Kichererbsensalat, veganer Aufstrich und Brot.'},'8.90',['gluten','soja'])], lunch:[item('lunch','lunch',{sl:'Mala enolončnica + malica + solata + sladica.',en:'Small stew + lunch + salad + dessert.',it:'Zuppa piccola + pranzo + insalata + dolce.',de:'Kleiner Eintopf + Tagesgericht + Salat + Dessert.'},'12.90',['gluten','soja'])], weekly:[item('w1','salad_bowl',{sl:'Sezonska zelenjava, humus in semena.',en:'Seasonal greens, hummus and seeds.',it:'Verdure stagionali, hummus e semi.',de:'Saisonales Gemüse, Hummus und Samen.'},'9.80',['sezam']), item('w2','vegan_sandwich',{sl:'Izbira: kruh ali tortilja.',en:'Choice: bread or tortilla.',it:'Scelta: pane o tortilla.',de:'Wahl: Brot oder Tortilla.'},'7.20',['gluten'])], desserts:[item('d1','dessert',{sl:'Dnevna sladica.',en:'Dessert of the day.',it:'Dolce del giorno.',de:'Dessert des Tages.'},'4.80')], drinks:[item('p1','beverage',{sl:'Domača pijača.',en:'Homemade beverage.',it:'Bevanda fatta in casa.',de:'Hausgemachtes Getränk.'},'2.00')] } };

export async function loadMenu(){const s=getStore('menu');const d=await s.get(MENU_KEY,{type:'json'});if(!d){await s.setJSON(MENU_KEY,defaultData);return defaultData;}const normalized=normalizeMenuData(d);if(JSON.stringify(normalized)!==JSON.stringify(d))await s.setJSON(MENU_KEY,normalized);return normalized;}
export async function saveMenu(data){const s=getStore('menu');const payload={...normalizeMenuData(data),updatedAt:new Date().toISOString()};await s.setJSON(MENU_KEY,payload);return payload;}
export function makeToken(){const secret=process.env.SESSION_SECRET;const payload=`${Date.now()+TOKEN_TTL_MS}`;const sig=crypto.createHmac('sha256',secret).update(payload).digest('hex');return `${payload}.${sig}`;}
export function verifyToken(token){const secret=process.env.SESSION_SECRET;if(!token||!secret)return false;const [exp,sig]=token.split('.');if(!exp||!sig||Date.now()>Number(exp))return false;const expected=crypto.createHmac('sha256',secret).update(exp).digest('hex');return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected));}
export const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
