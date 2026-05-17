const TOKEN_KEY='adminToken';
const TOKEN_EXP_KEY='adminTokenExpiresAt';
const SESSION_MS=8*60*60*1000;

let token = '';
let data = null; let dirty = false;
let saveState = 'saved';
const langs = ['sl', 'en', 'it', 'de'];
const t = (o, k = 'sl') => o?.[k] || o?.sl || '';
const statusKeys = ['available', 'low', 'sold_out', 'hidden'];
const statusClass = { available: 'ok', low: 'warn', sold_out: 'bad', hidden: 'muted' };
const allergenIds = () => Object.keys(data.allergens || {});
const langFields = (obj, f) => langs.map((l) => `<label>${f} ${l.toUpperCase()}<input data-l='${l}' data-f='${f}' value="${(obj[f]?.[l] || '').replaceAll('"', '&quot;')}"></label>`).join('');
const markDirty = () => { dirty = true; saveState = 'dirty'; updateSaveStatus(); };
const clearDirty = () => { dirty = false; saveState = 'saved'; updateSaveStatus(); };
const emptyItem = (type='') => ({ id: crypto.randomUUID(), type, name: { sl: '', en: '', it: '', de: '' }, description: { sl: '', en: '', it: '', de: '' }, price: '0.00', allergens: [], status: 'available', hidden: false, soldOut: false, lowStock: false, sortOrder: 0 });
const cloneItem = (item) => {
  const clone = structuredClone(item || {});
  clone.id = crypto.randomUUID();
  clone.name = { sl: clone.name?.sl || '', en: clone.name?.en || '', it: clone.name?.it || '', de: clone.name?.de || '' };
  clone.description = { sl: clone.description?.sl || '', en: clone.description?.en || '', it: clone.description?.it || '', de: clone.description?.de || '' };
  clone.allergens = Array.isArray(clone.allergens) ? [...clone.allergens] : [];
  clone.type = clone.type || '';
  clone.price = clone.price ?? '0.00';
  clone.status = clone.status || 'available';
  clone.sortOrder = Number(clone.sortOrder || 0);
  syncFlags(clone);
  return clone;
};
const syncFlags = (x)=>{x.hidden=x.status==='hidden';x.soldOut=x.status==='sold_out';x.lowStock=x.status==='low';};
const translationTargets = ['en', 'it', 'de'];
const langToDeepL = { en: 'EN', it: 'IT', de: 'DE' };


const normalizePrice = (value) => {
  const raw = String(value ?? '').trim().replace(',', '.');
  const n = Number(raw);
  if (!Number.isFinite(n)) return '0,00';
  return n.toFixed(2).replace('.', ',');
};
const normalizePriceForStorage = (value) => normalizePrice(value).replace(',', '.');
const normalizeItemPrice = (item) => { if (item) item.price = normalizePrice(item.price); };
const normalizeAllPrices = () => {
  Object.values(data.sections || {}).flat().forEach(normalizeItemPrice);
  (data.drinkCategories || []).forEach((cat) => (cat.items || []).forEach(normalizeItemPrice));
};
const saveStatusText = () => ({ dirty: 'Neshranjene spremembe', saving: 'Shranjujem…', saved: 'Shranjeno', error: 'Napaka' }[saveState] || '');
function updateSaveStatus(){ const msg=document.getElementById('msg'); if(msg) msg.textContent=saveStatusText(); }

function clearSession(){
  token='';
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
}

function setSession(nextToken){
  token=nextToken;
  localStorage.setItem(TOKEN_KEY,nextToken);
  localStorage.setItem(TOKEN_EXP_KEY,String(Date.now()+SESSION_MS));
}

function applySessionFromStorage(){
  const storedToken=localStorage.getItem(TOKEN_KEY);
  const expiresAt=Number(localStorage.getItem(TOKEN_EXP_KEY)||0);
  if(!storedToken||!expiresAt||Date.now()>=expiresAt){
    clearSession();
    return false;
  }
  token=storedToken;
  return true;
}

function showLogin(message=''){
  document.getElementById('login').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginErr').textContent=message;
}

function handleUnauthorized(){
  clearSession();
  showLogin('Seja je potekla. Prosimo, prijavite se ponovno.');
}

function statusPills(x){return `<div class='inline quick-status'>${statusKeys.map((s)=>`<button class='btn status ${statusClass[s]} ${x.status===s?'active':''}' data-status='${s}'>${t(data.translations[`status_${s}`])}</button>`).join('')}</div>`;}
function allergenPills(x){return `<div class='pill-wrap'>${allergenIds().map((a)=>`<button class='pill ${x.allergens?.includes(a)?'active':''}' data-a='${a}' type='button'>${t(data.allergens[a])}</button>`).join('')}</div>`;}
function row(section, i, x, drinkCatIdx=null){
  const isDrink = drinkCatIdx !== null;
  const path = drinkCatIdx===null ? `data.sections.${section}[${i}]` : `data.drinkCategories[${drinkCatIdx}].items[${i}]`;
  return `<div class='admin-item status-${x.status||'available'}' data-s='${section}' data-i='${i}' data-c='${drinkCatIdx??''}'><div class='inline'><small>${path}</small></div>${isDrink?'':statusPills(x)}${langFields(x,'name')}${langFields(x,'description')}<div class='inline'><button class='btn suggest'>Predlagaj prevode</button></div><div class='row'><label>Type<input data-f='type' value='${x.type||''}'></label><label>Cena<input data-f='price' value='${x.price||''}'></label><label>Sort<input data-f='sortOrder' value='${x.sortOrder||0}'></label></div><fieldset><legend>${t(data.translations.allergens)}</legend>${allergenPills(x)}</fieldset><div class='inline'><button class='btn up'>↑</button><button class='btn down'>↓</button><button class='btn duplicate-item'>Dupliciraj</button><button class='btn del'>Izbriši</button></div></div>`;
}
function section(key,titleKey){const arr=data.sections[key]||[];return `<details class='card' open><summary><h3>${t(data.translations[titleKey])}</h3></summary>${arr.map((x,i)=>row(key,i,x)).join('')}<div class='inline action-buttons'><button class='btn add' data-add='${key}'>+ ${t(data.translations.add)}</button><button class='btn duplicate-last' data-dup='${key}' ${arr.length?'':'disabled'}>Dupliciraj zadnjo</button></div></details>`;}
function drinksSection(){return `<details class='card' open><summary><h3>${t(data.translations.beverage)}</h3></summary>${(data.drinkCategories||[]).map((cat,ci)=>`<details class='card' open><summary><strong>${t(cat.title)}</strong></summary>${(cat.items||[]).map((x,i)=>row('drinks',i,x,ci)).join('')}<div class='inline action-buttons'><button class='btn add-drink' data-ci='${ci}'>+ ${t(data.translations.add)}</button><button class='btn duplicate-last-drink' data-dup-ci='${ci}' ${(cat.items||[]).length?'':'disabled'}>Dupliciraj zadnjo</button></div></details>`).join('')}</details>`;}
function settingsCard(){const s=data.settings;return `<details class='card' id='restaurant-settings' open><summary><h3>Restaurant settings</h3></summary><label>Restaurant name<input data-settings='restaurantName' value='${s.restaurantName||''}'></label><label>Phone number<input data-settings='phone' value='${s.phone||''}'></label><label>Address<input data-settings='address' value='${s.address||''}'></label><label>Google Maps URL<input data-settings='googleMapsUrl' value='${s.googleMapsUrl||''}'></label><label>Instagram URL<input data-settings='instagramUrl' value='${s.instagramUrl||''}'></label>${langFields(s,'openingHours')}${langFields(s,'footerText')}<label>Optional hero image URL<input data-settings='heroImageUrl' value='${s.heroImageUrl||''}'></label></details>`;}
function resolveTarget(el){const s=el.dataset.s,i=+el.dataset.i,c=el.dataset.c;return c!==''?data.drinkCategories[+c].items[i]:data.sections[s][i];}
async function suggestTranslationsForItem(target){/* unchanged */
  const availability = await fetch('/.netlify/functions/translate-suggest').then((r)=>r.json().catch(()=>({})));
  if (!availability.configured) { alert('DEEPL_API_KEY manjka. Prevajanje trenutno ni nastavljeno.'); return; }
  const hasContent = translationTargets.some((lang)=>(target.description?.[lang] || '').trim());
  if (hasContent && !window.confirm('Nekatera ciljna polja (EN/IT/DE) že vsebujejo besedilo. Ali jih želiš prepisati?')) return;
  const slDescription = (target.description?.sl || '').trim();
  if (!slDescription) { alert('Manjka slovenski opis za prevod.'); return; }
  const translate = async (text, targetLang) => {
    const r = await fetch('/.netlify/functions/translate-suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, targetLang }) });
    const j = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(j.error || 'Napaka pri prevajanju.');
    return j.text;
  };
  try {
    for (const lang of translationTargets) { target.description = target.description || {}; target.description[lang] = await translate(slDescription, langToDeepL[lang]); }
    markDirty(); render();
  } catch (e) { alert(e.message || 'Napaka pri prevajanju.'); }
}
function bind(){
  document.querySelectorAll('.admin-item').forEach((el)=>{const target=resolveTarget(el);el.querySelectorAll('input').forEach((inp)=>inp.addEventListener('input',()=>{markDirty();const {f,l}=inp.dataset;if(l){target[f]=target[f]||{};target[f][l]=inp.value;} else target[f]=f==='sortOrder'?Number(inp.value||0):inp.value;}));
    el.querySelectorAll("input[data-f='price']").forEach((inp)=>inp.addEventListener('blur',()=>{target.price=normalizePrice(inp.value);inp.value=target.price;markDirty();}));
    el.querySelectorAll('[data-status]').forEach((b)=>b.onclick=()=>{target.status=b.dataset.status;syncFlags(target);markDirty();render();});el.querySelectorAll('[data-a]').forEach((b)=>b.onclick=()=>{markDirty();target.allergens=target.allergens||[];const idx=target.allergens.indexOf(b.dataset.a);if(idx>=0)target.allergens.splice(idx,1);else target.allergens.push(b.dataset.a);render();});el.querySelector('.suggest').onclick=()=>suggestTranslationsForItem(target);el.querySelector('.duplicate-item').onclick=()=>{const c=el.dataset.c,s=el.dataset.s,i=+el.dataset.i;const arr=c!==''?data.drinkCategories[+c].items:data.sections[s];arr.splice(i+1,0,cloneItem(arr[i]));markDirty();render();};el.querySelector('.del').onclick=()=>{markDirty();const c=el.dataset.c,s=el.dataset.s,i=+el.dataset.i;if(c!=='')data.drinkCategories[+c].items.splice(i,1);else data.sections[s].splice(i,1);render();};el.querySelector('.up').onclick=()=>{markDirty();const c=el.dataset.c,s=el.dataset.s,i=+el.dataset.i;const arr=c!==''?data.drinkCategories[+c].items:data.sections[s];if(i>0){[arr[i-1],arr[i]]=[arr[i],arr[i-1]];}render();};el.querySelector('.down').onclick=()=>{markDirty();const c=el.dataset.c,s=el.dataset.s,i=+el.dataset.i;const arr=c!==''?data.drinkCategories[+c].items:data.sections[s];if(i<arr.length-1){[arr[i+1],arr[i]]=[arr[i],arr[i+1]];}render();};});
  document.querySelectorAll('[data-add]').forEach((b)=>b.onclick=()=>{data.sections[b.dataset.add].push(emptyItem(b.dataset.add));markDirty();render();});
  document.querySelectorAll('[data-dup]').forEach((b)=>b.onclick=()=>{const arr=data.sections[b.dataset.dup]||[];if(!arr.length){alert('Ni še elementa za dupliciranje.');return;}arr.splice(arr.length,0,cloneItem(arr[arr.length-1]));markDirty();render();});
  document.querySelectorAll('[data-ci]').forEach((b)=>b.onclick=()=>{data.drinkCategories[+b.dataset.ci].items.push(emptyItem('beverage'));markDirty();render();});
  document.querySelectorAll('[data-dup-ci]').forEach((b)=>b.onclick=()=>{const arr=data.drinkCategories[+b.dataset.dupCi].items||[];if(!arr.length){alert('Ni še elementa za dupliciranje.');return;}arr.splice(arr.length,0,cloneItem(arr[arr.length-1]));markDirty();render();});
  document.querySelectorAll('[data-settings]').forEach((i)=>i.addEventListener('input',()=>{data.settings[i.dataset.settings]=i.value;markDirty();}));
  document.querySelectorAll('#restaurant-settings [data-f][data-l]').forEach((i)=>i.addEventListener('input',()=>{const {f,l}=i.dataset;data.settings[f]=data.settings[f]||{};data.settings[f][l]=i.value;markDirty();}));
  document.getElementById('save').onclick=save;
  document.getElementById('exportBackup').onclick=exportBackup;
  document.getElementById('logoutBtn').onclick=()=>{clearSession();showLogin();};
}
function analyticsCard(){const a=data.analyticsSummary||{total:0,byLanguage:{},byDevice:{mobile:0,desktop:0},today:0,last7Days:0};return `<details class='card' open><summary><h3>Analytics</h3></summary><div class='analytics-grid'><div><strong>Skupaj ogledov:</strong> ${a.total||0}</div><div><strong>Ogledi danes:</strong> ${a.today||0}</div><div><strong>Zadnjih 7 dni:</strong> ${a.last7Days||0}</div><div><strong>Jeziki:</strong> SL ${a.byLanguage?.sl||0} · EN ${a.byLanguage?.en||0} · IT ${a.byLanguage?.it||0} · DE ${a.byLanguage?.de||0}</div><div><strong>Naprave:</strong> Mobile ${a.byDevice?.mobile||0} · Desktop ${a.byDevice?.desktop||0}</div></div></details>`;}
function render(){document.getElementById('app').innerHTML=["<div class='admin-content'><div class='admin-toolbar'><button class='btn' id='logoutBtn'>Odjava</button><button class='btn' id='exportBackup'>Izvozi backup</button></div>",analyticsCard(),settingsCard(),section('daily','section_daily'),section('lunch','lunch'),section('weekly','section_weekly'),section('desserts','dessert'),drinksSection(),"</div><div class='savebar'><button class='btn' id='save'>Shrani spremembe</button><span id='msg' class='save-status' aria-live='polite'></span></div>"].join('');bind();updateSaveStatus();}
function exportBackup(){const payload={sections:data.sections,items:data.sections,settings:data.settings,translations:data.translations,updatedAt:data.updatedAt,dishLibrary:data.dishLibrary||[],drinkCategories:data.drinkCategories||[],allergens:data.allergens||{}};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`casaderin-menu-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);}
async function save(){
  normalizeAllPrices();
  saveState='saving'; updateSaveStatus();
  const payload=structuredClone(data);
  Object.values(payload.sections||{}).flat().forEach((x)=>x.price=normalizePriceForStorage(x.price));
  (payload.drinkCategories||[]).forEach((c)=>(c.items||[]).forEach((x)=>x.price=normalizePriceForStorage(x.price)));
  const r=await fetch('/api/admin/menu',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${token}`},body:JSON.stringify(payload)});
  if(r.status===401){handleUnauthorized();return;}
  if(r.ok){
    await load();
    clearDirty();
  } else { saveState='error'; updateSaveStatus(); }
}
async function load(){
  const [menuRes, analyticsRes] = await Promise.all([
    fetch('/api/menu').then(r=>r.json()),
    fetch('/api/analytics/summary').then(r=>r.json()).catch(()=>({}))
  ]);
  data=menuRes;
  data.analyticsSummary=analyticsRes;
  data.settings=data.settings||{restaurantName:'',phone:'',address:'',googleMapsUrl:'',instagramUrl:'',openingHours:{sl:'',en:'',it:'',de:''},footerText:{sl:'',en:'',it:'',de:''},heroImageUrl:''};
  (Object.values(data.sections||{}).flat()).forEach((x)=>{if(!x.status)x.status=x.hidden?'hidden':x.soldOut?'sold_out':x.lowStock?'low':'available';syncFlags(x);normalizeItemPrice(x);});
  (data.drinkCategories||[]).forEach((c)=>(c.items||[]).forEach((x)=>{if(!x.status)x.status=x.hidden?'hidden':x.soldOut?'sold_out':x.lowStock?'low':'available';syncFlags(x);normalizeItemPrice(x);}));
  document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');clearDirty();render();
}
async function login(){const loginErr=document.getElementById('loginErr');loginErr.textContent='';const password=document.getElementById('pwd').value;const r=await fetch('/.netlify/functions/admin-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const j=await r.json().catch(()=>({}));if(!r.ok)return loginErr.textContent=j.error||'Napačno geslo';setSession(j.token);await load();}
document.getElementById('loginForm').addEventListener('submit',async e=>{e.preventDefault();await login();});
if(applySessionFromStorage())load(); else showLogin();
