let token = localStorage.getItem('adminToken') || '';
let data = null;
let dirty = false;
const langs = ['sl', 'en', 'it', 'de'];

const t = (o, k) => o?.[k] || o?.sl || k;
const allergenIds = () => Object.keys(data.allergens || {});
const norm = (v) => (v || '').trim().toLowerCase();

const langFields = (obj, field) => langs.map((l) => `<label>${field} ${l.toUpperCase()}<input data-l='${l}' data-f='${field}' value="${(obj[field]?.[l] || '').replaceAll('"', '&quot;')}"></label>`).join('');

function markDirty(){ dirty = true; }
function clearDirty(){ dirty = false; }
window.addEventListener('beforeunload', (e) => { if (!dirty) return; e.preventDefault(); e.returnValue = ''; });

function formatLastUsed(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('sl-SI');
}

function getSuggestions(query, currentType) {
  const q = norm(query);
  if (!q || q.length < 2) return [];
  return (data.dishLibrary || []).filter((d) => {
    const hay = [d.name?.sl, d.name?.en, d.name?.it, d.name?.de, d.description?.sl, d.description?.en, d.description?.it, d.description?.de, d.type].map(norm).join(' ');
    return hay.includes(q);
  }).sort((a, b) => new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0)).slice(0, 6).map((x) => ({...x, relevantType: x.type === currentType}));
}

function suggestionsHtml(section, index, q, type) {
  const items = getSuggestions(q, type);
  if (!items.length) return '';
  return `<div class='suggestions'>${items.map((s, i) => `<button class='suggestion' type='button' data-use-suggestion='${section}:${index}:${i}'><strong>${s.name?.sl || s.name?.en || 'Jed'}</strong> <span class='muted'>${s.price || ''}€</span><div class='muted'>Nazadnje uporabljeno: ${formatLastUsed(s.lastUsed)}</div></button>`).join('')}</div>`;
}

function row(section, i, x) {
  const activeText = x._suggestText || '';
  return `<div class='admin-item' data-s='${section}' data-i='${i}'>
  <div class='inline quick-status'>
    <button class='btn status ${!x.hidden && !x.soldOut ? 'active' : ''}' data-status='available'>Na voljo</button>
    <button class='btn status ${x.lowStock ? 'active' : ''}' data-status='low'>Kmalu zmanjka</button>
    <button class='btn status ${x.soldOut ? 'active' : ''}' data-status='sold'>Razprodano</button>
    <button class='btn status ${x.hidden ? 'active' : ''}' data-status='hidden'>Skrito</button>
  </div>
  <label>type<input data-f='type' value='${x.type || ''}'></label>
  ${langFields(x, 'name')}
  ${suggestionsHtml(section, i, activeText, x.type)}
  ${langFields(x, 'description')}
  <label>Cena<input data-f='price' value='${x.price || ''}'></label><label>Sort<input data-f='sortOrder' value='${x.sortOrder || 0}'></label>
  <div class='inline'><label><input type='checkbox' data-f='soldOut' ${x.soldOut ? 'checked' : ''}> ${t(data.translations.sold_out, 'sl')}</label><label><input type='checkbox' data-f='hidden' ${x.hidden ? 'checked' : ''}> ${t(data.translations.hide, 'sl')}</label></div>
  <fieldset><legend>${t(data.translations.allergens, 'sl')}</legend><div class='inline'>${allergenIds().map((a) => `<label><input type='checkbox' data-a='${a}' ${x.allergens?.includes(a) ? 'checked' : ''}> ${a}</label>`).join('')}</div></fieldset>
  <div class='inline'><button class='btn suggest'>Predlagaj prevode</button><button class='btn duplicate'>Duplicate</button><button class='btn del'>Izbriši</button></div></div>`;
}

function section(key, titleKey) { const arr = data.sections[key]; return `<details class='card' open><summary><h3>${t(data.translations[titleKey], 'sl')}</h3></summary>${arr.map((x, i) => row(key, i, x)).join('')}<button class='btn add' data-add='${key}'>+ ${t(data.translations.add, 'sl')}</button></details>`; }
function settingsCard() { const s = data.settings; return `<details class='card' id='restaurant-settings'><summary><h3>Nastavitve lokala</h3></summary><label>Restaurant name<input data-settings='restaurantName' value="${(s.restaurantName || '').replaceAll('"', '&quot;')}"></label><label>Phone number<input data-settings='phone' value="${(s.phone || '').replaceAll('"', '&quot;')}"></label><label>Address<input data-settings='address' value="${(s.address || '').replaceAll('"', '&quot;')}"></label><label>Google Maps link<input data-settings='googleMapsUrl' value="${(s.googleMapsUrl || '').replaceAll('"', '&quot;')}"></label><label>Instagram URL<input data-settings='instagramUrl' value="${(s.instagramUrl || '').replaceAll('"', '&quot;')}"></label><label>Optional hero image URL<input data-settings='heroImageUrl' value="${(s.heroImageUrl || '').replaceAll('"', '&quot;')}"></label>${langFields(s, 'openingHours')}${langFields(s, 'footerText')}</details>`; }
function emptyItem(type) { return { id: crypto.randomUUID(), type, name: { sl: '', en: '', it: '', de: '' }, description: { sl: '', en: '', it: '', de: '' }, price: '0.00', allergens: [], soldOut: false, hidden: false, lowStock: false, sortOrder: 0 }; }

function applySuggestion(target, suggestion) {
  target.name = { ...target.name, ...suggestion.name };
  target.description = { ...target.description, ...suggestion.description };
  target.price = suggestion.price || target.price;
  target.allergens = Array.isArray(suggestion.allergens) ? [...suggestion.allergens] : target.allergens;
  if (suggestion.type) target.type = suggestion.type;
  target.soldOut = !!suggestion.soldOut;
  target.hidden = !!suggestion.hidden;
  target.lowStock = !!suggestion.lowStock;
}

function bind() {
  document.querySelectorAll('.admin-item').forEach((el) => {
    const s = el.dataset.s, i = +el.dataset.i, target = data.sections[s][i];
    el.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => { markDirty(); const { f, l, a } = inp.dataset; if (a) { target.allergens = allergenIds().filter((x) => el.querySelector(`[data-a="${x}"]`)?.checked); return; } if (inp.type === 'checkbox') { target[f] = inp.checked; return; } if (l) { target[f] = target[f] || {}; target[f][l] = inp.value; if (f === 'name' && l === 'sl') target._suggestText = inp.value; if (f === 'description' && l === 'sl' && !target._suggestText) target._suggestText = inp.value; } else target[f] = f === 'sortOrder' ? Number(inp.value || 0) : inp.value; }));
    el.querySelector('.del').onclick = () => { markDirty(); data.sections[s].splice(i, 1); render(); };
    el.querySelector('.duplicate').onclick = () => { markDirty(); const cp = structuredClone(target); cp.id = crypto.randomUUID(); cp.name = { ...cp.name, sl: cp.name?.sl ? `${cp.name.sl} kopija` : 'kopija' }; data.sections[s].splice(i + 1, 0, cp); render(); };
    el.querySelector('.suggest').onclick = () => suggest(target, el);
    el.querySelectorAll('[data-status]').forEach((b) => b.onclick = () => { markDirty(); const st = b.dataset.status; target.hidden = st === 'hidden'; target.soldOut = st === 'sold'; target.lowStock = st === 'low'; if (st === 'available') { target.hidden = false; target.soldOut = false; target.lowStock = false; } render(); });
  });
  document.querySelectorAll('[data-use-suggestion]').forEach((b) => b.onclick = () => { const [s, i, idx] = b.dataset.useSuggestion.split(':'); const source = getSuggestions(data.sections[s][+i]._suggestText || '', data.sections[s][+i].type)[+idx]; if (source) { applySuggestion(data.sections[s][+i], source); markDirty(); render(); } });
  document.querySelectorAll('[data-add]').forEach((b) => b.onclick = () => { markDirty(); data.sections[b.dataset.add].push(emptyItem(b.dataset.add)); render(); });
  document.querySelectorAll('[data-settings]').forEach((inp) => inp.addEventListener('input', () => { markDirty(); data.settings[inp.dataset.settings] = inp.value; }));
  document.querySelectorAll('#restaurant-settings [data-f][data-l]').forEach((inp) => inp.addEventListener('input', () => { markDirty(); const f = inp.dataset.f, l = inp.dataset.l; data.settings[f] = data.settings[f] || {}; data.settings[f][l] = inp.value; }));
  document.getElementById('save').onclick = save;
}
function hasText(v){return !!(v||'').trim();}
async function isTranslationConfigured(){try{const r=await fetch('/.netlify/functions/translate-suggest');const j=await r.json();return !!j.configured;}catch{return false;}}
async function suggest(item){
  const canTranslate=await isTranslationConfigured();
  if(!canTranslate){
    alert('Prevajanje trenutno ni nastavljeno. Dodaj DEEPL_API_KEY v Netlify environment variables.');
    return;
  }
  for(const lang of ['en','it','de']){
    const hasExistingName=hasText(item.name?.[lang]);
    const hasExistingDescription=hasText(item.description?.[lang]);
    if((hasExistingName||hasExistingDescription)&&!confirm(`${lang.toUpperCase()} prevod že obstaja. Želite zamenjati besedilo?`))continue;
    const [n,d]=await Promise.all([tr(item.name.sl,lang),tr(item.description.sl,lang)]);
    if(n) item.name[lang]=n;
    if(d) item.description[lang]=d;
  }
  markDirty();
  render();
}
async function tr(text,lang){const map={en:'EN',it:'IT',de:'DE'};const r=await fetch('/.netlify/functions/translate-suggest',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text,targetLang:map[lang]})});const j=await r.json();if(!r.ok){alert(j.error||'Napaka prevoda');return '';}return j.text;}
function render(){const app=document.getElementById('app');app.innerHTML=[settingsCard(),section('daily','section_daily'),section('lunch','lunch'),section('weekly','section_weekly'),section('desserts','dessert'),section('drinks','beverage'),"<div class='savebar'><button class='btn' id='save'>Shrani spremembe</button> <span id='msg'></span></div>"].join('');bind();}
async function save(){const r=await fetch('/api/admin/menu',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${token}`},body:JSON.stringify(data)});document.getElementById('msg').textContent=r.ok?'Shranjeno':'Napaka';if(r.ok) clearDirty();}
async function load(){data=await fetch('/api/menu').then(r=>r.json());data.dishLibrary=data.dishLibrary||[];data.settings=data.settings||{restaurantName:'',phone:'',address:'',googleMapsUrl:'',instagramUrl:'',openingHours:{sl:'',en:'',it:'',de:''},footerText:{sl:'',en:'',it:'',de:''},heroImageUrl:''};document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');clearDirty();render();}
async function login(){const loginErr=document.getElementById('loginErr');loginErr.textContent='';const password=document.getElementById('pwd').value;try{const r=await fetch('/.netlify/functions/admin-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const j=await r.json().catch(()=>({}));if(!r.ok)return loginErr.textContent=j.error||'Napačno geslo';token=j.token;localStorage.setItem('adminToken',token);await load();}catch{loginErr.textContent='Napaka strežnika. Poskusite znova.';}}
document.getElementById('loginForm').addEventListener('submit',async e=>{e.preventDefault();await login();});if(token)load();
