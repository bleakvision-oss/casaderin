import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

const MENU_KEY = 'menu-data-v1';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

export const allergens = [
  'gluten','mleko','jajca','soja','oreščki','arašidi','sezam','zelena','gorčica','sulfiti','volčji_bob','mehkužci','raki','ribe'
];

const defaultData = {
  updatedAt: new Date().toISOString(),
  contact: { location: 'Casa de Rin, Ljubljana', phone: '+386 40 000 000', instagram: 'https://instagram.com/casaderin' },
  daily: [
    { id:'stew', name:{sl:'Enolončnica',en:'Stew',it:'Stufato'}, description:{sl:'Zelenjavna enolončnica dneva.',en:'Vegetable stew of the day.',it:'Stufato vegetale del giorno.'}, price:'7.50', soldOut:false, hidden:false, allergens:['zelena'] },
    { id:'snack', name:{sl:'Malica',en:'Snack plate',it:'Piatto snack'}, description:{sl:'Čičerikina solata, veganski namaz in kruh. Vključuje solato.',en:'Chickpea salad, vegan spread and bread. Includes side salad.',it:'Insalata di ceci, crema vegana e pane. Include insalata.'}, price:'8.90', soldOut:false, hidden:false, allergens:['gluten','soja'] }
  ],
  lunch: { id:'lunch', name:{sl:'Kosilo',en:'Lunch combo',it:'Pranzo completo'}, description:{sl:'Mala enolončnica + malica + solata + sladica.',en:'Small stew + snack + salad + dessert.',it:'Piccolo stufato + snack + insalata + dolce.'}, price:'12.90', soldOut:false, hidden:false, allergens:['gluten','soja','zelena'] },
  weekly: [
    { id:'w1', name:{sl:'Solatna bovla',en:'Salad bowl',it:'Bowl d\'insalata'}, description:{sl:'Sezonska zelenjava, humus in semena.',en:'Seasonal greens, hummus and seeds.',it:'Verdure stagionali, hummus e semi.'}, price:'9.80', soldOut:false, hidden:false, allergens:['sezam'] },
    { id:'w2', name:{sl:'Veganski sendvič',en:'Vegan sandwich',it:'Panino vegano'}, description:{sl:'Izbira: kruh ali tortilja.',en:'Choice: bread or tortilla.',it:'Scelta: pane o tortilla.'}, price:'7.20', soldOut:false, hidden:false, allergens:['gluten','soja'] }
  ],
  desserts: [
    { id:'d1', category:'torte', name:{sl:'Čokoladna veganska torta',en:'Vegan chocolate cake',it:'Torta vegana al cioccolato'}, description:{sl:'Sočna torta brez mleka in jajc.',en:'Moist cake without milk or eggs.',it:'Torta soffice senza latte e uova.'}, price:'4.80', soldOut:false, hidden:false, allergens:['gluten','soja'] }
  ],
  drinks: [
    { id:'p1', name:{sl:'Kava',en:'Coffee',it:'Caffè'}, description:{sl:'Espresso ali podaljšana.',en:'Espresso or long coffee.',it:'Espresso o caffè lungo.'}, price:'2.00', soldOut:false, hidden:false, allergens:[] },
    { id:'p2', name:{sl:'Limonada',en:'Lemonade',it:'Limonata'}, description:{sl:'Domača limonada.',en:'Homemade lemonade.',it:'Limonata fatta in casa.'}, price:'3.20', soldOut:false, hidden:false, allergens:[] }
  ]
};

export async function loadMenu() {
  const store = getStore('menu');
  const data = await store.get(MENU_KEY, { type: 'json' });
  if (!data) {
    await store.setJSON(MENU_KEY, defaultData);
    return defaultData;
  }
  return data;
}

export async function saveMenu(data) {
  const store = getStore('menu');
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await store.setJSON(MENU_KEY, payload);
  return payload;
}

export function makeToken() {
  const secret = process.env.SESSION_SECRET;
  const payload = `${Date.now() + TOKEN_TTL_MS}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig) return false;
  if (Date.now() > Number(exp)) return false;
  const expected = crypto.createHmac('sha256', secret).update(exp).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json'
  }
});
