export const TOKEN_KEY='adminToken';
export const TOKEN_EXP_KEY='adminTokenExpiresAt';
export const SESSION_MS=8*60*60*1000;
export const ACTIVE_PANEL_KEY = 'adminActivePanel';
export const PUBLIC_MENU_URL = 'https://casaderin.netlify.app/menu';

export const langs = ['sl', 'en', 'it', 'de'];
export const t = (o, k = 'sl') => o?.[k] || o?.sl || '';
export const statusKeys = ['available', 'low', 'sold_out', 'hidden'];
export const dnevnikResultOptions = ['super', 'okej', 'slabo', 'zmanjkalo'];
export const cateringStatusOptions = ['povpraševanje', 'potrjeno', 'izvedeno', 'odpovedano'];
export const translationTargets = ['en', 'it', 'de'];
export const langToDeepL = { en: 'EN', it: 'IT', de: 'DE' };
export const adminStatusLabels = { available: 'Na voljo', low: 'Malo še', sold_out: 'Razprodano', hidden: 'Skrito' };

export const syncFlags = (x)=>{x.hidden=x.status==='hidden';x.soldOut=x.status==='sold_out';x.lowStock=x.status==='low';};
export const emptyItem = (type='') => ({ id: crypto.randomUUID(), type, name: { sl: '', en: '', it: '', de: '' }, description: { sl: '', en: '', it: '', de: '' }, price: '0.00', allergens: [], status: 'available', hidden: false, soldOut: false, lowStock: false, sortOrder: 0 });
export const cloneItem = (item) => { const clone = structuredClone(item || {}); clone.id = crypto.randomUUID(); clone.name = { sl: clone.name?.sl || '', en: clone.name?.en || '', it: clone.name?.it || '', de: clone.name?.de || '' }; clone.description = { sl: clone.description?.sl || '', en: clone.description?.en || '', it: clone.description?.it || '', de: clone.description?.de || '' }; clone.allergens = Array.isArray(clone.allergens) ? [...clone.allergens] : []; clone.type = clone.type || ''; clone.price = clone.price ?? '0.00'; clone.status = clone.status || 'available'; clone.sortOrder = Number(clone.sortOrder || 0); syncFlags(clone); return clone; };

export const normalizePrice = (value) => { const raw = String(value ?? '').trim().replace(',', '.'); const n = Number(raw); if (!Number.isFinite(n)) return '0,00'; return n.toFixed(2).replace('.', ','); };
export const normalizePriceForStorage = (value) => normalizePrice(value).replace(',', '.');
export const normalizeItemPrice = (item) => { if (item) item.price = normalizePrice(item.price); };
export const formatDateSl = (value) => { const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}.${m[2]}.${m[1]}` : (value || '—'); };

export const saveStatusText = (saveState) => ({ dirty: 'Neshranjene spremembe', saving: 'Shranjujem…', saved: 'Shranjeno ✓', error: 'Napaka pri shranjevanju', idle: '' }[saveState] || '');

export const sanitizeCateringEntry = (entry = {}, fallbackId = '') => ({
  id: String(entry?.id || fallbackId || crypto.randomUUID()),
  datum: String(entry?.datum || ''),
  ura: String(entry?.ura || ''),
  stranka: String(entry?.stranka || ''),
  kontakt: String(entry?.kontakt || ''),
  lokacija: String(entry?.lokacija || ''),
  stOseb: Number(entry?.stOseb || 0),
  opisNarocila: String(entry?.opisNarocila || ''),
  dogovorjenaCena: String(entry?.dogovorjenaCena || ''),
  status: cateringStatusOptions.includes(entry?.status) ? entry.status : 'povpraševanje',
  racunIzstavljen: Boolean(entry?.racunIzstavljen),
  racunPlacan: Boolean(entry?.racunPlacan),
  opombe: String(entry?.opombe || '')
});
export const sanitizeCateringEntries = (entries = []) => (Array.isArray(entries) ? entries : []).map((entry) => sanitizeCateringEntry(entry));

export const getFormField = (form, fieldName) => {
  if (!form || typeof form !== 'object') return null;
  const direct = form[fieldName];
  if (direct && typeof direct === 'object') return direct;
  const viaElements = form.elements?.namedItem?.(fieldName);
  if (viaElements && typeof viaElements === 'object') return viaElements;
  return null;
};
export const setFormValue = (form, fieldName, value = '') => {
  const field = getFormField(form, fieldName);
  if (field && 'value' in field) field.value = value ?? '';
};
export const setFormChecked = (form, fieldName, checked = false) => {
  const field = getFormField(form, fieldName);
  if (field && 'checked' in field) field.checked = Boolean(checked);
};
