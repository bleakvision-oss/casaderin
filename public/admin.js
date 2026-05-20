document.body.classList.add('admin-page');
const TOKEN_KEY='adminToken';
const TOKEN_EXP_KEY='adminTokenExpiresAt';
const SESSION_MS=8*60*60*1000;
const ACTIVE_PANEL_KEY = 'adminActivePanel';
const PUBLIC_MENU_URL = 'https://casaderin.netlify.app/menu';

let token = '';
let data = null; let dirty = false;
let lastSnapshot = null;
let saveState = 'idle';
let activePanel = 'daily';
let dnevnikDateFilter = '';
let dnevnikEditingId = '';
let analyticsNotice = '';
let cateringDateFilter = '';
let cateringEditingId = '';
const openAdvancedIds = new Set();
const langs = ['sl', 'en', 'it', 'de'];
const t = (o, k = 'sl') => o?.[k] || o?.sl || '';
const statusKeys = ['available', 'low', 'sold_out', 'hidden'];
const dnevnikResultOptions = ['super', 'okej', 'slabo', 'zmanjkalo'];
const cateringStatusOptions = ['povpraševanje', 'potrjeno', 'izvedeno', 'odpovedano'];
const allergenIds = () => Object.keys(data.allergens || {});
const langFields = (obj, f) => langs.map((l) => `<label>${f} ${l.toUpperCase()}<input data-l='${l}' data-f='${f}' value="${(obj[f]?.[l] || '').replaceAll('"', '&quot;')}"></label>`).join('');
const markDirty = () => { dirty = true; saveState = 'dirty'; updateSaveStatus(); };
const clearDirty = () => { dirty = false; saveState = 'idle'; updateSaveStatus(); };
const snapshotData = () => { if (data) lastSnapshot = structuredClone(data); };
const canUndo = () => !!lastSnapshot;
const showUndoMessage = () => {
  const msg = document.getElementById('msg');
  if (!msg) return;
  msg.textContent = 'Zadnja sprememba razveljavljena';
  msg.className = 'save-status is-saved';
};
const undoLastChange = () => {
  if (!lastSnapshot) return;
  data = structuredClone(lastSnapshot);
  lastSnapshot = null;
  render();
  showUndoMessage();
};
const emptyItem = (type='') => ({ id: crypto.randomUUID(), type, name: { sl: '', en: '', it: '', de: '' }, description: { sl: '', en: '', it: '', de: '' }, price: '0.00', allergens: [], status: 'available', hidden: false, soldOut: false, lowStock: false, sortOrder: 0 });
const cloneItem = (item) => { const clone = structuredClone(item || {}); clone.id = crypto.randomUUID(); clone.name = { sl: clone.name?.sl || '', en: clone.name?.en || '', it: clone.name?.it || '', de: clone.name?.de || '' }; clone.description = { sl: clone.description?.sl || '', en: clone.description?.en || '', it: clone.description?.it || '', de: clone.description?.de || '' }; clone.allergens = Array.isArray(clone.allergens) ? [...clone.allergens] : []; clone.type = clone.type || ''; clone.price = clone.price ?? '0.00'; clone.status = clone.status || 'available'; clone.sortOrder = Number(clone.sortOrder || 0); syncFlags(clone); return clone; };
const syncFlags = (x)=>{x.hidden=x.status==='hidden';x.soldOut=x.status==='sold_out';x.lowStock=x.status==='low';};
const translationTargets = ['en', 'it', 'de'];
const langToDeepL = { en: 'EN', it: 'IT', de: 'DE' };
const normalizePrice = (value) => { const raw = String(value ?? '').trim().replace(',', '.'); const n = Number(raw); if (!Number.isFinite(n)) return '0,00'; return n.toFixed(2).replace('.', ','); };
const normalizePriceForStorage = (value) => normalizePrice(value).replace(',', '.');
const normalizeItemPrice = (item) => { if (item) item.price = normalizePrice(item.price); };
const formatDateSl = (value) => { const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}.${m[2]}.${m[1]}` : (value || '—'); };
const normalizeAllPrices = () => { Object.values(data.sections || {}).flat().forEach(normalizeItemPrice); (data.drinkCategories || []).forEach((cat) => (cat.items || []).forEach(normalizeItemPrice)); };
const saveStatusText = () => ({ dirty: 'Neshranjene spremembe', saving: 'Shranjujem…', saved: 'Shranjeno ✓', error: 'Napaka pri shranjevanju', idle: '' }[saveState] || '');

const sanitizeCateringEntry = (entry = {}, fallbackId = '') => ({
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
const sanitizeCateringEntries = (entries = []) => (Array.isArray(entries) ? entries : []).map((entry) => sanitizeCateringEntry(entry));
const getFormField = (form, fieldName) => {
  if (!form || typeof form !== 'object') return null;
  const direct = form[fieldName];
  if (direct && typeof direct === 'object') return direct;
  const viaElements = form.elements?.namedItem?.(fieldName);
  if (viaElements && typeof viaElements === 'object') return viaElements;
  return null;
};
const setFormValue = (form, fieldName, value = '') => {
  const field = getFormField(form, fieldName);
  if (field && 'value' in field) field.value = value ?? '';
};
const setFormChecked = (form, fieldName, checked = false) => {
  const field = getFormField(form, fieldName);
  if (field && 'checked' in field) field.checked = Boolean(checked);
};
function updateSaveStatus(){ const msg=document.getElementById('msg'); if(!msg) return; msg.textContent=saveStatusText(); msg.className=`save-status is-${saveState}`; }

function clearSession(){token='';localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(TOKEN_EXP_KEY);} 
function allowedPanels(){const staticPanels=['daily','lunch','weekly','desserts','settings','export','qr','analytics','dnevnik','cateringi'];const drinkPanels=(data?.drinkCategories||[]).map((_,i)=>`drinks-${i}`);return new Set([...staticPanels,...drinkPanels]);}
function normalizeActivePanel(candidate){return allowedPanels().has(candidate)?candidate:'daily';}
function setActivePanel(next){activePanel=normalizeActivePanel(next);localStorage.setItem(ACTIVE_PANEL_KEY,activePanel);}
function restoreActivePanel(){const stored=localStorage.getItem(ACTIVE_PANEL_KEY);activePanel=normalizeActivePanel(stored||'daily');}
function setSession(nextToken){token=nextToken;localStorage.setItem(TOKEN_KEY,nextToken);localStorage.setItem(TOKEN_EXP_KEY,String(Date.now()+SESSION_MS));}
function applySessionFromStorage(){const storedToken=localStorage.getItem(TOKEN_KEY);const expiresAt=Number(localStorage.getItem(TOKEN_EXP_KEY)||0);if(!storedToken||!expiresAt||Date.now()>=expiresAt){clearSession();return false;}token=storedToken;return true;}
function showLogin(message=''){document.getElementById('login').classList.remove('hidden');document.getElementById('app').classList.add('hidden');document.getElementById('loginErr').textContent=message;}
function handleUnauthorized(){clearSession();showLogin('Seja je potekla. Prosimo, prijavite se ponovno.');}

const adminStatusLabels = { available: 'Na voljo', low: 'Malo še', sold_out: 'Razprodano', hidden: 'Skrito' };
function statusPills(x){return `<div class="item-status-group">${statusKeys.map((st)=>`<button class='btn status-btn status-${st.replace('_','-')} ${x.status===st?'active':''}' data-status='${st}' type='button'>${adminStatusLabels[st]}</button>`).join('')}</div>`;}
function allergenPills(x){return `<div class='pill-wrap'>${allergenIds().map((a)=>`<button class='pill ${x.allergens?.includes(a)?'active':''}' data-a='${a}' type='button'>${t(data.allergens[a])}</button>`).join('')}</div>`;}
function itemCard(section, i, x, drinkCatIdx=null){const isDrink = drinkCatIdx !== null; const itemId = x.id || `${section}:${drinkCatIdx ?? ''}:${i}`; const isAdvancedOpen = openAdvancedIds.has(itemId); return `<article class='admin-item' data-s='${section}' data-i='${i}' data-c='${drinkCatIdx??''}' data-id='${itemId}'><div class='item-shell'><div class='admin-item-card status-${x.status || 'available'}'><div class='item-move'><button type='button' class='btn move-btn up' title='Premakni gor' aria-label='Premakni gor'>↑</button><button type='button' class='btn move-btn down' title='Premakni dol' aria-label='Premakni dol'>↓</button></div><div class='item-main'><h3 class='item-title'>${t(x.name) || '—'}</h3><p class='item-description'>${t(x.description) || 'Brez opisa'}</p><div class='item-allergens'>${allergenPills(x)}</div></div><div class='item-meta'><div class='item-price'><label class='compact-field sr-only-label'>Cena (€)<input data-f='price' inputmode='decimal' aria-label='Cena v evrih' value='${x.price||''}'></label></div><div class='item-status'>${isDrink?'':statusPills(x)}</div><div class='item-actions'><button class='btn icon-btn duplicate-item' title='Dupliciraj' aria-label='Dupliciraj'>⧉</button><button class='btn icon-btn del' title='Izbriši' aria-label='Izbriši'>🗑</button></div></div><div class='item-advanced'><details class='advanced' ${isAdvancedOpen ? 'open' : ''}><summary><span>Prevodi in napredne nastavitve</span><span class='chevron' aria-hidden='true'>⌄</span></summary><div class='advanced-grid'><label>Ime (SL)<input data-l='sl' data-f='name' value="${(x.name?.sl || '').replaceAll('"', '&quot;')}"></label><label>Opis (SL)<input data-l='sl' data-f='description' value="${(x.description?.sl || '').replaceAll('"', '&quot;')}"></label></div><div class='inline'><button type='button' class='btn suggest'>Predlagaj prevode</button></div><div class='advanced-grid'>${translationTargets.map((l)=>`<label>Ime ${l.toUpperCase()}<input data-l='${l}' data-f='name' value="${(x.name?.[l] || '').replaceAll('"', '&quot;')}"></label><label>Opis ${l.toUpperCase()}<input data-l='${l}' data-f='description' value="${(x.description?.[l] || '').replaceAll('"', '&quot;')}"></label>`).join('')}</div><div class='row'><label>Type<input data-f='type' value='${x.type||''}'></label><label>Sort<input data-f='sortOrder' value='${x.sortOrder||0}'></label></div></details></div></div></div></article>`;}


function dnevnikView(){
const entries=(data.dailyEntries||[])
  .slice()
  .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
const filteredEntries=dnevnikDateFilter?entries.filter((entry)=>entry.date===dnevnikDateFilter):entries;
const options=dnevnikResultOptions.map((opt)=>`<option value='${opt}'>${opt}</option>`).join('');
const formTitle=dnevnikEditingId?'Uredi vnos':'Nov vnos';
return panelShell('dnevnik','Dnevnik','Interni dnevnik priprave in prodaje jedi.',`
  <section class='dashboard-card dnevnik-section'>
    <h3 class='section-title'><span>Iskanje po datumu</span></h3>
    <form id='dnevnikFilterForm' class='dnevnik-form-grid'>
      <label>Datum<input name='filterDate' type='date' value='${dnevnikDateFilter}'></label>
      <div class='inline'>
        <button class='btn' id='filterDnevnikEntries' type='submit'>Išči</button>
        <button class='btn' id='clearDnevnikFilter' type='button'>Prikaži vse</button>
      </div>
    </form>
  </section>
  <section class='dashboard-card dnevnik-section'>
    <h3 class='section-title'><span>${formTitle}</span></h3>
    <form id="dnevnikForm" class='dnevnik-form-grid'>
      <label>Datum<input name="date" type='date' required></label>
      <label>Jed<input name="dishName" required></label>
      <label>Pripravljeno<input name="preparedQty" type='number' inputmode='numeric' min='0' step='1'></label>
      <label>Prodano<input name="soldQty" type='number' inputmode='numeric' min='0' step='1'></label>
      <label>Ostalo<input name="leftoverQty" type='number' inputmode='numeric' min='0' step='1'></label>
      <label>Rezultat<select name="resultStatus">${options}</select></label>
      <label>Opombe<input name="notes"></label>
      <div class='inline'>
        <button class='btn' id="saveDnevnikEntry" type="button">Shrani vnos</button>
        ${dnevnikEditingId?"<button class='btn' id='cancelDnevnikEdit' type='button'>Prekliči urejanje</button>":''}
      </div>
    </form>
  </section>
  <section class='dashboard-card dnevnik-section'>
    <h3 class='section-title'><span>Vnosi</span></h3>
    <div class='item-list dnevnik-entry-list'>${filteredEntries.map((entry)=>`<article class='dnevnik-entry-card dnevnik-entry'><div class='item-shell'><div class='admin-item-card status-available'><div class='item-main'><h3 class='item-title'>${entry.dishName||'—'}</h3><p class='item-description'>Datum: ${entry.date||'—'} · Pripravljeno: ${entry.preparedQty??0} · Prodano: ${entry.soldQty??0} · Ostalo: ${entry.leftoverQty??0}</p><p class='item-description'>Status: ${entry.resultStatus||'—'}${entry.notes?` · Opombe: ${entry.notes}`:''}</p></div><div class='item-actions dnevnik-actions'><button class='btn edit-dnevnik' data-edit-dnevnik-id='${entry.id}' type='button'>Uredi</button><button class='btn del-dnevnik' data-delete-dnevnik-id='${entry.id}' type='button'>Izbriši</button></div></div></div></article>`).join('')}</div>
  </section>`,false,false);} 



function cateringView(){
const entries=(data.cateringEntries||[])
  .slice()
  .sort((a,b)=>String(b.datum||'').localeCompare(String(a.datum||'')));
const filteredEntries=cateringDateFilter?entries.filter((entry)=>entry.datum===cateringDateFilter):entries;
const options=cateringStatusOptions.map((opt)=>`<option value='${opt}'>${opt}</option>`).join('');
const formTitle=cateringEditingId?'Uredi catering':'Nov catering';
return panelShell('cateringi','Cateringi','Interno upravljanje cateringov.',`
  <section class='dashboard-card dnevnik-section'>
    <h3 class='section-title'><span>Iskanje po datumu</span></h3>
    <form id='cateringFilterForm' class='dnevnik-form-grid'>
      <label>Datum<input name='filterDate' type='date' value='${cateringDateFilter}'></label>
      <div class='inline'>
        <button class='btn' id='filterCateringEntries' type='submit'>Išči</button>
        <button class='btn' id='clearCateringFilter' type='button'>Prikaži vse</button>
      </div>
    </form>
  </section>
  <section class='dashboard-card dnevnik-section'>
    <div class='inline catering-add-wrap'>
      <button class='btn add' id='newCateringEntry' type='button'>Dodaj nov catering</button>
    </div>
    <h3 class='section-title'><span>${formTitle}</span></h3>
    <form id="cateringForm" class='dnevnik-form-grid'>
      <label>Datum<input name="datum" type='date' required></label>
      <label>Ura<input name="ura" type='time' required></label>
      <label>Stranka<input name="stranka" required></label>
      <label>Kontakt<input name="kontakt" required></label>
      <label>Lokacija<input name="lokacija" required></label>
      <label>Št. oseb<input name="stOseb" type='number' inputmode='numeric' min='0' step='1' required></label>
      <label>Opis naročila<input name="opisNarocila"></label>
      <label>Dogovorjena cena<input name="dogovorjenaCena"></label>
      <label>Status<select name="status">${options}</select></label>
      <div class='row'><label>Račun izstavljen<input name="racunIzstavljen" type='checkbox'></label><label>Račun plačan<input name="racunPlacan" type='checkbox'></label></div>
      <label>Opombe<input name="opombe"></label>
      <div class='inline'>
        <button class='btn' id="saveCateringEntry" type="button">Shrani catering</button>
        ${cateringEditingId?"<button class='btn' id='cancelCateringEdit' type='button'>Prekliči urejanje</button>":''}
      </div>
    </form>
  </section>
  <section class='dashboard-card dnevnik-section'>
    <h3 class='section-title'><span>Vnosi</span></h3>
    <div class='item-list dnevnik-entry-list'>${filteredEntries.map((entry)=>`<article class='catering-entry-card dnevnik-entry'><div class='item-shell'><div class='admin-item-card status-available'><div class='item-main catering-card-main'><h3 class='item-title'>${entry.stranka||'—'}</h3><div class='catering-card-grid'><p class='item-description'><strong>Datum:</strong> ${formatDateSl(entry.datum)}<br><strong>Ura:</strong> ${entry.ura||'—'}<br><strong>Lokacija:</strong> ${entry.lokacija||'—'}</p><p class='item-description'><strong>Stranka:</strong> ${entry.stranka||'—'}<br><strong>Kontakt:</strong> ${entry.kontakt||'—'}</p><p class='item-description'><strong>Št. oseb:</strong> ${entry.stOseb??0}<br><strong>Cena:</strong> ${entry.dogovorjenaCena||'—'}</p><p class='item-description'><strong>Status:</strong> ${entry.status||'—'}<br><strong>Račun izstavljen:</strong> ${entry.racunIzstavljen?'da':'ne'}<br><strong>Račun plačan:</strong> ${entry.racunPlacan?'da':'ne'}</p><p class='item-description catering-card-note'><strong>Opis naročila:</strong> ${entry.opisNarocila||'—'}</p><p class='item-description catering-card-note'><strong>Opombe:</strong> ${entry.opombe||'—'}</p></div></div><div class='item-actions dnevnik-actions'><button class='btn' data-edit-catering-id='${entry.id}' type='button'>Uredi</button><button class='btn del' data-delete-catering-id='${entry.id}' type='button'>Izbriši</button></div></div></div></article>`).join('')}</div>
  </section>`,false,false);}

function sectionView(key,titleKey,desc){const arr=data.sections[key]||[];return panelShell(key,t(data.translations[titleKey]),desc,`<div class='item-list'>${arr.map((x,i)=>itemCard(key,i,x)).join('')}</div>`,true,arr.length);} 
function drinksView(ci){const cat=(data.drinkCategories||[])[ci]; if(!cat) return ''; const items=cat.items||[]; return panelShell(`drinks-${ci}`, t(cat.title), 'Urejanje skupine pijač.', `<div class='item-list'>${items.map((x,i)=>itemCard('drinks',i,x,ci)).join('')}</div>`,false,items.length,ci);} 
function settingsView(){const s=data.settings;return panelShell('settings','Nastavitve','Nastavitve restavracije in prikaza.',`<section class='dashboard-card' id='restaurant-settings'><div class='row'><label>Restaurant name<input data-settings='restaurantName' value='${s.restaurantName||''}'></label><label>Phone number<input data-settings='phone' value='${s.phone||''}'></label><label>Address<input data-settings='address' value='${s.address||''}'></label></div><label>Google Maps URL<input data-settings='googleMapsUrl' value='${s.googleMapsUrl||''}'></label><label>Instagram URL<input data-settings='instagramUrl' value='${s.instagramUrl||''}'></label>${langFields(s,'openingHours')}${langFields(s,'footerText')}<label>Optional hero image URL<input data-settings='heroImageUrl' value='${s.heroImageUrl||''}'></label></section>`,false,false);} 
function analyticsView(){const a=data.analyticsSummary||{total:0,byLanguage:{},byDevice:{mobile:0,desktop:0},today:0,last7Days:0};return panelShell('analytics','Analytics','Pregled obiska menija.',`<section class='dashboard-card' id='analytics'>${analyticsNotice?`<p class='import-msg success' id='analyticsNotice' aria-live='polite'>${analyticsNotice}</p>`:''}<div class='analytics-grid'><div><strong>Skupaj ogledov:</strong> ${a.total||0}</div><div><strong>Ogledi danes:</strong> ${a.today||0}</div><div><strong>Zadnjih 7 dni:</strong> ${a.last7Days||0}</div><div><strong>Jeziki:</strong> SL ${a.byLanguage?.sl||0} · EN ${a.byLanguage?.en||0} · IT ${a.byLanguage?.it||0} · DE ${a.byLanguage?.de||0}</div></div><div class='inline'><button class="btn danger" id="resetAnalyticsBtn">Počisti analytics</button></div></section>`,false,false);} 
function exportView(){return panelShell('export','Izvoz / Uvoz','Varnostna kopija podatkov menija.',`<section class='dashboard-card'><div class='inline'><button class='btn' id='exportBackup'>Izvozi backup</button><button class='btn' id='importBackupBtn'>Uvozi backup</button><input id='importBackupInput' type='file' accept='.json,application/json' hidden></div><p id='importMsg' class='import-msg' aria-live='polite'></p></section>`,false,false);} 
function panelShell(key,title,desc,body,allowStatus,canDup,drinkIdx=null){return `<div class='panel-shell'><div class='panel-head'><div><h2>${title}</h2><p>${desc}</p></div><div class='inline'><a class='btn' href='/menu.html' target='_blank'>Predogled menija</a>${key!=='analytics'&&key!=='settings'&&key!=='export'&&key!=='qr'&&key!=='dnevnik'&&key!=='cateringi'?`<button class='btn add' data-add-section='${key}'>Dodaj</button>`:''}${canDup!==false?`<button class='btn duplicate-last' data-dup-section='${key}' ${canDup?'':'disabled'}>Dupliciraj zadnjo</button>`:''}</div></div>${body}</div>`;}

function activeContent(){
  if (activePanel==='daily') return sectionView('daily','section_daily','Urejanje dnevne ponudbe.');
  if (activePanel==='lunch') return sectionView('lunch','lunch','Urejanje kosila.');
  if (activePanel==='weekly') return sectionView('weekly','section_weekly','Urejanje tedenske ponudbe.');
  if (activePanel==='desserts') return sectionView('desserts','dessert','Urejanje sladic.');
  if (activePanel.startsWith('drinks-')) return drinksView(Number(activePanel.split('-')[1]));
    if (activePanel==='settings') return settingsView();
  if (activePanel==='analytics') return analyticsView();
  if (activePanel==='dnevnik') return dnevnikView();
  if (activePanel==='cateringi') return cateringView();
  if (activePanel==='qr') { const qrSrc=`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(PUBLIC_MENU_URL)}`; return panelShell('qr','QR koda','Hiter dostop do javnega menija.',`<section class='dashboard-card qr-card'><h3>QR koda za javni meni</h3><p class='qr-url'>${PUBLIC_MENU_URL}</p><img class='qr-image' src='${qrSrc}' alt='QR koda za javni meni'><div class='inline'><a class='btn' href='${PUBLIC_MENU_URL}' target='_blank' rel='noopener noreferrer'>Odpri javni meni</a><a class='btn' href='${qrSrc}' download='casaderin-menu-qr.png' target='_blank' rel='noopener noreferrer'>Prenesi QR kodo</a></div></section>`,false,false);} 
  if (activePanel==='export') return exportView();
  return sectionView('daily','section_daily','Urejanje dnevne ponudbe.');
}

function sidebar(){const icon=(kind='list')=>`<svg viewBox='0 0 24 24' class='nav-icon-svg' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>${{list:"<path d='M8 7h10M8 12h10M8 17h10'/><path d='M4 7h.01M4 12h.01M4 17h.01'/>",plate:"<circle cx='12' cy='12' r='7.5'/><path d='M7.5 16.5c1.2-1.2 2.8-1.8 4.5-1.8s3.3.6 4.5 1.8'/>",calendar:"<rect x='4' y='5.5' width='16' height='14' rx='2'/><path d='M8 3.8v3.4M16 3.8v3.4M4 10h16'/>",dessert:"<path d='M6 10h12l-2.2 8.2a2 2 0 0 1-1.9 1.5h-3.8a2 2 0 0 1-1.9-1.5z'/><path d='M12 10V7.3c0-1.2.8-2.1 2-2.5'/>",cup:"<path d='M6 8h10v8.2a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 16.2z'/><path d='M16 10h1.3a2.2 2.2 0 1 1 0 4.4H16'/>",coffee:"<path d='M6 8h10v8.2a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 16.2z'/><path d='M16 10h1.3a2.2 2.2 0 1 1 0 4.4H16'/><path d='M9 5.5c.7.6.7 1.5 0 2.1M12 5.2c.8.7.8 1.8 0 2.5'/>",drink:"<path d='M7 5h10l-1.6 14.2a1.8 1.8 0 0 1-1.8 1.6h-3.2a1.8 1.8 0 0 1-1.8-1.6z'/><path d='M9.5 10.5h5'/>",gear:"<circle cx='12' cy='12' r='3.2'/><path d='M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4.8a7 7 0 0 0-1.8-1.1L14.3 3h-4.6l-.4 2.7a7 7 0 0 0-1.8 1.1l-2.4-.8-2 3.5L5 11a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-.8a7 7 0 0 0 1.8 1.1l.4 2.7h4.6l.4-2.7a7 7 0 0 0 1.8-1.1l2.4.8 2-3.5-2-1.5c.1-.3.1-.7.1-1z'/>",transfer:"<path d='M12 4v11M8.5 7.5 12 4l3.5 3.5'/><path d='M12 20V9M8.5 16.5 12 20l3.5-3.5'/>",qr:"<path d='M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z'/><path d='M14 14h2v2h-2zM18 14h2v6h-6v-2h4z'/>",chart:"<path d='M5 19V6M5 19h14'/><path d='m8 15 3-4 3 2 4-6'/>",log:"<path d='M7 4h8l3 3v13H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'/><path d='M15 4v3h3M9 11h6M9 15h6'/>",catering:"<path d='M4.5 13h15'/><path d='M6 13v4.8M18 13v4.8'/><path d='M7.5 13c0-2.8 2-5 4.5-5s4.5 2.2 4.5 5'/>"}}[kind]||''}</svg>`;const iconForDrink=(label)=>{const key=String(label||'').toLowerCase();if(key.includes('čaj')) return icon('cup');if(key.includes('kava')) return icon('coffee');if(key.includes('sok')) return icon('drink');return icon('cup');};const nav=(panel,label,kind)=>`<button class='nav-link ${activePanel===panel?'active':''}' data-panel='${panel}'><span class='nav-icon' aria-hidden='true'>${kind==='drink-dynamic'?iconForDrink(label):icon(kind)}</span><span class='nav-label'>${label}</span></button>`;return `<aside class='sidebar'><div class='brand-mini'>CASA DE RIN</div><div class='sidebar-sub'>Upravljanje menija</div><label class='mobile-nav-label'>Sekcija<select id='mobileNav'><option value='daily'>Dnevna ponudba</option><option value='lunch'>Kosilo</option><option value='weekly'>Tedenska ponudba</option><option value='desserts'>Sladice</option>${(data.drinkCategories||[]).map((cat,ci)=>`<option value='drinks-${ci}'>${t(cat.title)}</option>`).join('')}<option value='settings'>Nastavitve</option><option value='export'>Izvoz / Uvoz</option><option value='qr'>QR koda</option><option value='analytics'>Analytics</option><option value='dnevnik'>Dnevnik</option><option value='cateringi'>Cateringi</option></select></label><nav><h5><span>MENI</span></h5>${nav('daily','Dnevna ponudba','list')}${nav('lunch','Kosilo','plate')}${nav('weekly','Tedenska ponudba','calendar')}${nav('desserts','Sladice','dessert')}<h5><span>PIJAČA</span></h5>${(data.drinkCategories||[]).map((cat,ci)=>nav(`drinks-${ci}`,t(cat.title),'drink-dynamic')).join('')}<h5><span>SISTEM</span></h5>${nav('settings','Nastavitve','gear')}${nav('export','Izvoz / Uvoz','transfer')}${nav('qr','QR koda','qr')}${nav('analytics','Analytics','chart')}<h5><span>ADMIN</span></h5>${nav('dnevnik','Dnevnik','log')}${nav('cateringi','Cateringi','catering')}<button class='btn' id='logoutBtn'>Odjava</button></nav></aside>`;}

async function suggestTranslationsForItem(target){const availability = await fetch('/.netlify/functions/translate-suggest').then((r)=>r.json().catch(()=>({}))); if (!availability.configured) { alert('DEEPL_API_KEY manjka. Prevajanje trenutno ni nastavljeno.'); return; } const hasContent = translationTargets.some((lang)=>(target.description?.[lang] || '').trim()); if (hasContent && !window.confirm('Nekatera ciljna polja (EN/IT/DE) že vsebujejo besedilo. Ali jih želiš prepisati?')) return; const slDescription = (target.description?.sl || '').trim(); if (!slDescription) { alert('Manjka slovenski opis za prevod.'); return; } const translate = async (text, targetLang) => { const r = await fetch('/.netlify/functions/translate-suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, targetLang }) }); const j = await r.json().catch(()=>({})); if (!r.ok) throw new Error(j.error || 'Napaka pri prevajanju.'); return j.text; }; try { snapshotData(); for (const lang of translationTargets) { target.description = target.description || {}; target.description[lang] = await translate(slDescription, langToDeepL[lang]); } markDirty(); render(); } catch (e) { alert(e.message || 'Napaka pri prevajanju.'); }}
function resolveTarget(el){const s=el.dataset.s,i=+el.dataset.i,c=el.dataset.c;return c!==''?data.drinkCategories[+c].items[i]:data.sections[s][i];}

function bindDnevnik(){const dnevnikForm=document.getElementById('dnevnikForm'); if(dnevnikForm){if(dnevnikEditingId){const activeEntry=(data.dailyEntries||[]).find((x)=>x.id===dnevnikEditingId);if(activeEntry){dnevnikForm.date.value=activeEntry.date||'';dnevnikForm.dishName.value=activeEntry.dishName||'';dnevnikForm.preparedQty.value=activeEntry.preparedQty??0;dnevnikForm.soldQty.value=activeEntry.soldQty??0;dnevnikForm.leftoverQty.value=activeEntry.leftoverQty??0;dnevnikForm.resultStatus.value=activeEntry.resultStatus||'okej';dnevnikForm.notes.value=activeEntry.notes||'';}}const saveDnevnikEntry=document.getElementById('saveDnevnikEntry'); if(saveDnevnikEntry){saveDnevnikEntry.onclick=(e)=>{e.preventDefault();if(!dnevnikForm.reportValidity())return;snapshotData();const next={id:String(dnevnikEditingId||'').trim()||crypto.randomUUID(),date:String(dnevnikForm.date?.value||''),dishName:String(dnevnikForm.dishName?.value||''),preparedQty:Number(dnevnikForm.preparedQty?.value||0),soldQty:Number(dnevnikForm.soldQty?.value||0),leftoverQty:Number(dnevnikForm.leftoverQty?.value||0),resultStatus:String(dnevnikForm.resultStatus?.value||'okej'),notes:String(dnevnikForm.notes?.value||'')};const entries=data.dailyEntries||[];if(dnevnikEditingId){const idx=entries.findIndex((x)=>x.id===next.id);if(idx>=0)entries[idx]=next;else entries.push(next);}else entries.push(next);data.dailyEntries=entries;dnevnikEditingId='';markDirty();render();};}}
 const dnevnikFilterForm=document.getElementById('dnevnikFilterForm'); if(dnevnikFilterForm){const applyFilter=(e)=>{e.preventDefault();const fd=new FormData(dnevnikFilterForm);dnevnikDateFilter=String(fd.get('filterDate')||'');render();};dnevnikFilterForm.onsubmit=applyFilter;const filterDnevnikEntries=document.getElementById('filterDnevnikEntries');if(filterDnevnikEntries)filterDnevnikEntries.onclick=applyFilter;}
 const clearDnevnikFilter=document.getElementById('clearDnevnikFilter'); if(clearDnevnikFilter){clearDnevnikFilter.onclick=()=>{dnevnikDateFilter='';render();};}
 document.querySelectorAll('[data-edit-dnevnik-id]').forEach((b)=>b.onclick=()=>{dnevnikEditingId=String(b.dataset.editDnevnikId||'');render();});
 document.querySelectorAll('[data-delete-dnevnik-id]').forEach((b)=>b.onclick=()=>{snapshotData();const id=String(b.dataset.deleteDnevnikId||'');data.dailyEntries=(data.dailyEntries||[]).filter((x)=>x.id!==id);if(dnevnikEditingId===id)dnevnikEditingId='';markDirty();render();});
 const cancelDnevnikEdit=document.getElementById('cancelDnevnikEdit'); if(cancelDnevnikEdit){cancelDnevnikEdit.onclick=()=>{dnevnikEditingId='';render();};}}

function bindCateringi(){const cateringForm=document.getElementById('cateringForm'); if(cateringForm){if(cateringEditingId){const activeEntry=(data.cateringEntries||[]).find((x)=>x.id===cateringEditingId);if(activeEntry){setFormValue(cateringForm,'datum',activeEntry.datum||'');setFormValue(cateringForm,'ura',activeEntry.ura||'');setFormValue(cateringForm,'stranka',activeEntry.stranka||'');setFormValue(cateringForm,'kontakt',activeEntry.kontakt||'');setFormValue(cateringForm,'lokacija',activeEntry.lokacija||'');setFormValue(cateringForm,'stOseb',activeEntry.stOseb??'');setFormValue(cateringForm,'opisNarocila',activeEntry.opisNarocila||'');setFormValue(cateringForm,'dogovorjenaCena',activeEntry.dogovorjenaCena||'');setFormValue(cateringForm,'status',activeEntry.status||'povpraševanje');setFormChecked(cateringForm,'racunIzstavljen',!!activeEntry.racunIzstavljen);setFormChecked(cateringForm,'racunPlacan',!!activeEntry.racunPlacan);setFormValue(cateringForm,'opombe',activeEntry.opombe||'');}}const saveCateringEntry=document.getElementById('saveCateringEntry'); if(saveCateringEntry){saveCateringEntry.onclick=(e)=>{e.preventDefault();if(!cateringForm.reportValidity())return;snapshotData();const next=sanitizeCateringEntry({id:String(cateringEditingId||'').trim()||crypto.randomUUID(),datum:getFormField(cateringForm,'datum')?.value,ura:getFormField(cateringForm,'ura')?.value,stranka:getFormField(cateringForm,'stranka')?.value,kontakt:getFormField(cateringForm,'kontakt')?.value,lokacija:getFormField(cateringForm,'lokacija')?.value,stOseb:getFormField(cateringForm,'stOseb')?.value,opisNarocila:getFormField(cateringForm,'opisNarocila')?.value,dogovorjenaCena:getFormField(cateringForm,'dogovorjenaCena')?.value,status:getFormField(cateringForm,'status')?.value,racunIzstavljen:getFormField(cateringForm,'racunIzstavljen')?.checked,racunPlacan:getFormField(cateringForm,'racunPlacan')?.checked,opombe:getFormField(cateringForm,'opombe')?.value});const entries=sanitizeCateringEntries(data.cateringEntries);if(cateringEditingId){const idx=entries.findIndex((x)=>x.id===next.id);if(idx>=0)entries[idx]=next;else entries.push(next);}else entries.push(next);data.cateringEntries=entries;cateringEditingId='';markDirty();render();};}}
 const cateringFilterForm=document.getElementById('cateringFilterForm'); if(cateringFilterForm){const applyFilter=(e)=>{e.preventDefault();const fd=new FormData(cateringFilterForm);cateringDateFilter=String(fd.get('filterDate')||'');render();};cateringFilterForm.onsubmit=applyFilter;const filterCateringEntries=document.getElementById('filterCateringEntries');if(filterCateringEntries)filterCateringEntries.onclick=applyFilter;}
 const clearCateringFilter=document.getElementById('clearCateringFilter'); if(clearCateringFilter){clearCateringFilter.onclick=()=>{cateringDateFilter='';render();};}
 const newCateringEntry=document.getElementById('newCateringEntry'); if(newCateringEntry){newCateringEntry.onclick=()=>{cateringEditingId=''; if(cateringForm) cateringForm.reset(); render();};}
 document.querySelectorAll('[data-edit-catering-id]').forEach((b)=>b.onclick=()=>{cateringEditingId=String(b.dataset.editCateringId||'');render();});
 document.querySelectorAll('[data-delete-catering-id]').forEach((b)=>b.onclick=()=>{snapshotData();const id=String(b.dataset.deleteCateringId||'');data.cateringEntries=sanitizeCateringEntries(data.cateringEntries).filter((x)=>x.id!==id);if(cateringEditingId===id)cateringEditingId='';markDirty();render();});
 const cancelCateringEdit=document.getElementById('cancelCateringEdit'); if(cancelCateringEdit){cancelCateringEdit.onclick=()=>{cateringEditingId='';render();};}}

function bind(){ document.querySelectorAll('.nav-link').forEach((b)=>b.onclick=()=>{setActivePanel(b.dataset.panel);render();}); const mobileNav=document.getElementById('mobileNav'); if(mobileNav){mobileNav.value=activePanel; mobileNav.onchange=()=>{setActivePanel(mobileNav.value);render();};}
 document.querySelectorAll('.admin-item[data-s][data-i]').forEach((el)=>{const target=resolveTarget(el);const itemId=el.dataset.id;const advanced=el.querySelector('details.advanced');if(advanced){advanced.addEventListener('toggle',()=>{if(advanced.open) openAdvancedIds.add(itemId); else openAdvancedIds.delete(itemId);});}el.querySelectorAll('input').forEach((inp)=>inp.addEventListener('input',()=>{snapshotData();markDirty();const {f,l}=inp.dataset;if(l){target[f]=target[f]||{};target[f][l]=inp.value;} else target[f]=f==='sortOrder'?Number(inp.value||0):inp.value;})); el.querySelectorAll("input[data-f='price']").forEach((inp)=>inp.addEventListener('blur',()=>{snapshotData();target.price=normalizePrice(inp.value);inp.value=target.price;markDirty();})); el.querySelectorAll('[data-status]').forEach((b)=>b.onclick=()=>{snapshotData();target.status=b.dataset.status;syncFlags(target);markDirty();render();}); el.querySelectorAll('[data-a]').forEach((b)=>b.onclick=()=>{snapshotData();markDirty();target.allergens=target.allergens||[];const idx=target.allergens.indexOf(b.dataset.a);if(idx>=0)target.allergens.splice(idx,1);else target.allergens.push(b.dataset.a);render();}); const s=el.querySelector('.suggest'); if(s) s.onclick=()=>suggestTranslationsForItem(target); el.querySelector('.duplicate-item').onclick=()=>{snapshotData();const c=el.dataset.c,s=el.dataset.s,i=+el.dataset.i;const arr=c!==''?data.drinkCategories[+c].items:data.sections[s];arr.splice(i+1,0,cloneItem(arr[i]));markDirty();render();}; el.querySelector('.del').onclick=()=>{snapshotData();markDirty();const c=el.dataset.c,s=el.dataset.s,i=+el.dataset.i;if(c!=='')data.drinkCategories[+c].items.splice(i,1);else data.sections[s].splice(i,1);render();}; el.querySelector('.up').onclick=()=>{snapshotData();markDirty();const c=el.dataset.c,s=el.dataset.s,i=+el.dataset.i;const arr=c!==''?data.drinkCategories[+c].items:data.sections[s];if(i>0){[arr[i-1],arr[i]]=[arr[i],arr[i-1]];}render();}; el.querySelector('.down').onclick=()=>{snapshotData();markDirty();const c=el.dataset.c,s=el.dataset.s,i=+el.dataset.i;const arr=c!==''?data.drinkCategories[+c].items:data.sections[s];if(i<arr.length-1){[arr[i+1],arr[i]]=[arr[i],arr[i+1]];}render();}; });
 document.querySelectorAll('[data-add-section]').forEach((b)=>b.onclick=()=>{snapshotData();const k=b.dataset.addSection;if(k.startsWith('drinks-')){const ci=+k.split('-')[1];data.drinkCategories[ci].items.push(emptyItem('beverage'));}else{data.sections[k].push(emptyItem(k));}markDirty();render();});
 document.querySelectorAll('[data-dup-section]').forEach((b)=>b.onclick=()=>{const k=b.dataset.dupSection;let arr=[];if(k.startsWith('drinks-')){arr=data.drinkCategories[+k.split('-')[1]].items||[];}else arr=data.sections[k]||[]; if(!arr.length){alert('Ni še elementa za dupliciranje.');return;}snapshotData();arr.splice(arr.length,0,cloneItem(arr[arr.length-1]));markDirty();render();});
 
 bindDnevnik();
 bindCateringi();
document.querySelectorAll('[data-settings]').forEach((i)=>i.addEventListener('input',()=>{snapshotData();data.settings[i.dataset.settings]=i.value;markDirty();})); document.querySelectorAll('#restaurant-settings [data-f][data-l]').forEach((i)=>i.addEventListener('input',()=>{snapshotData();const {f,l}=i.dataset;data.settings[f]=data.settings[f]||{};data.settings[f][l]=i.value;markDirty();})); const sv=document.getElementById('save'); if(sv) sv.onclick=save; const undo=document.getElementById('undo'); if(undo) undo.onclick=undoLastChange; const cancel=document.getElementById('cancel'); if(cancel) cancel.onclick=()=>load(); const exp=document.getElementById('exportBackup'); if(exp) exp.onclick=exportBackup; const importBtn=document.getElementById('importBackupBtn'); const importInput=document.getElementById('importBackupInput'); if(importBtn&&importInput){importBtn.onclick=()=>importInput.click(); importInput.onchange=async()=>{const file=importInput.files?.[0]; if(!file) return; await importBackupFile(file); importInput.value='';};} const resetAnalyticsBtn=document.getElementById('resetAnalyticsBtn'); if(resetAnalyticsBtn) resetAnalyticsBtn.onclick=resetAnalyticsData; const lg=document.getElementById('logoutBtn'); if(lg) lg.onclick=()=>{clearSession();showLogin();};
 }

function render(){document.getElementById('app').innerHTML=`<div class='admin-shell'>${sidebar()}<div class='admin-main'>${activeContent()}</div></div><div class='savebar'><span id='msg' class='save-status' aria-live='polite'></span><div class='savebar-actions'><button class='btn' id='undo' ${canUndo()?'':'disabled'}>↶ Razveljavi</button><button class='btn' id='save'>Shrani spremembe</button><button class='btn' id='cancel'>Prekliči</button></div></div>`;bind();updateSaveStatus();}
function exportBackup(){const payload={sections:data.sections,items:data.sections,settings:data.settings,translations:data.translations,updatedAt:data.updatedAt,dishLibrary:data.dishLibrary||[],drinkCategories:data.drinkCategories||[],allergens:data.allergens||{},dailyEntries:data.dailyEntries||[],cateringEntries:data.cateringEntries||[]};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`casaderin-menu-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);}

function validateBackupStructure(payload){if(!payload||typeof payload!=='object') return false; const hasSections = payload.sections && typeof payload.sections==='object'; const hasSettings = payload.settings && typeof payload.settings==='object'; const hasTranslations = payload.translations && typeof payload.translations==='object'; return !!(hasSections && hasSettings && hasTranslations);}
function showImportMessage(text,isError=false){const msg=document.getElementById('importMsg'); if(!msg) return; msg.textContent=text; msg.className=`import-msg ${isError?'error':'success'}`;}
async function importBackupFile(file){try{const raw=await file.text(); const parsed=JSON.parse(raw); if(!validateBackupStructure(parsed)){showImportMessage('Napaka pri uvozu backup datoteke',true);return;} showImportMessage('Backup datoteka je veljavna.'); if(!window.confirm('Ali želiš prepisati trenutni meni z backup datoteko?')) return; snapshotData(); const nextData={...structuredClone(data),...parsed}; data=nextData; markDirty(); render(); showImportMessage('Backup datoteka naložena. Shrani spremembe za objavo.');}catch(e){showImportMessage('Napaka pri uvozu backup datoteke',true);}}
function hydrateMenuData(menuRes, analyticsRes = {}){data=menuRes; data.analyticsSummary=analyticsRes; data.dailyEntries=Array.isArray(data.dailyEntries)?data.dailyEntries:[]; data.dailyEntries=data.dailyEntries.map((entry)=>({id:entry?.id||crypto.randomUUID(),date:entry?.date||'',dishName:entry?.dishName||'',preparedQty:Number(entry?.preparedQty||0),soldQty:Number(entry?.soldQty||0),leftoverQty:Number(entry?.leftoverQty||0),resultStatus:dnevnikResultOptions.includes(entry?.resultStatus)?entry.resultStatus:'okej',notes:entry?.notes||''})); data.cateringEntries=sanitizeCateringEntries(data.cateringEntries); data.settings=data.settings||{restaurantName:'',phone:'',address:'',googleMapsUrl:'',instagramUrl:'',openingHours:{sl:'',en:'',it:'',de:''},footerText:{sl:'',en:'',it:'',de:''},heroImageUrl:''}; (Object.values(data.sections||{}).flat()).forEach((x)=>{if(!x.status)x.status=x.hidden?'hidden':x.soldOut?'sold_out':x.lowStock?'low':'available';syncFlags(x);normalizeItemPrice(x);}); (data.drinkCategories||[]).forEach((c)=>(c.items||[]).forEach((x)=>{if(!x.status)x.status=x.hidden?'hidden':x.soldOut?'sold_out':x.lowStock?'low':'available';syncFlags(x);normalizeItemPrice(x);}));}
async function fetchMenu(){const res=await fetch(`/api/menu?t=${Date.now()}`, { cache: 'no-store' });if(res.status===401){handleUnauthorized();throw new Error('unauthorized');}return res.json();}
async function fetchAnalyticsSummary(){return fetch(`/api/analytics/summary?t=${Date.now()}`, { cache: 'no-store' }).then((res)=>res.json().catch(()=>({}))).catch(()=>({}));}

async function resetAnalyticsData(){
  const confirmed=window.confirm('Ali si prepričan/a, da želiš izbrisati vse analytics podatke?');
  if(!confirmed) return;
  const r=await fetch('/api/admin/analytics/reset',{method:'POST',headers:{'authorization':`Bearer ${token}`}});
  if(r.status===401){handleUnauthorized();return;}
  if(!r.ok){alert('Napaka pri brisanju analytics podatkov.');return;}
  const analyticsRes = await fetchAnalyticsSummary();
  data.analyticsSummary=analyticsRes;
  analyticsNotice='Analytics podatki izbrisani.';
  render();
  setTimeout(()=>{if(analyticsNotice==='Analytics podatki izbrisani.'){analyticsNotice=''; if(activePanel==='analytics') render();}},2500);
}
async function save(){
  normalizeAllPrices();
  saveState='saving';
  updateSaveStatus();
  try {
    data.cateringEntries=sanitizeCateringEntries(data.cateringEntries);
    const payload=structuredClone(data);
    payload.cateringEntries=sanitizeCateringEntries(payload.cateringEntries);
    Object.values(payload.sections||{}).flat().forEach((x)=>x.price=normalizePriceForStorage(x.price));
    (payload.drinkCategories||[]).forEach((c)=>(c.items||[]).forEach((x)=>x.price=normalizePriceForStorage(x.price)));
    const r=await fetch('/api/admin/menu',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${token}`},body:JSON.stringify(payload)});
    if(r.status===401){handleUnauthorized();return;}
    if(r.ok){const preservedPanel=activePanel;hydrateMenuData(structuredClone(payload), data?.analyticsSummary || {});setActivePanel(preservedPanel);lastSnapshot=null; dirty=false; document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden'); render(); saveState='saved'; updateSaveStatus(); setTimeout(async()=>{if(dirty) return; try{const [menuRes, analyticsRes] = await Promise.all([fetchMenu(),fetchAnalyticsSummary()]);if(dirty) return;const panelAfterSave=activePanel;hydrateMenuData(menuRes, analyticsRes);setActivePanel(panelAfterSave);render();}catch(_e){/* background refresh best-effort */}},750); setTimeout(()=>{if(!dirty){saveState='idle';updateSaveStatus();}},2000);} else { saveState='error'; updateSaveStatus(); const responseText=await r.text().catch(()=>''); console.error('Napaka pri shranjevanju', { status:r.status, statusText:r.statusText, body:responseText }); }
  } catch (error) {
    saveState='error';
    updateSaveStatus();
    console.error('Napaka pri shranjevanju', error);
  }
}
async function load(){const [menuRes, analyticsRes] = await Promise.all([fetchMenu(),fetchAnalyticsSummary()]); hydrateMenuData(menuRes, analyticsRes); restoreActivePanel(); lastSnapshot=null; document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');clearDirty();render();}
async function login(){const loginErr=document.getElementById('loginErr');loginErr.textContent='';const password=document.getElementById('pwd').value;const r=await fetch('/.netlify/functions/admin-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const j=await r.json().catch(()=>({}));if(!r.ok)return loginErr.textContent=j.error||'Napačno geslo';setSession(j.token);await load();}
document.getElementById('loginForm').addEventListener('submit',async e=>{e.preventDefault();await login();});
if(applySessionFromStorage())load(); else showLogin();
