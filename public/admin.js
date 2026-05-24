import { ACTIVE_PANEL_KEY, PUBLIC_MENU_URL, SESSION_MS, TOKEN_EXP_KEY, TOKEN_KEY, adminStatusLabels, cateringStatusOptions, cloneItem, dnevnikResultOptions, emptyItem, formatDateSl, getFormField, langToDeepL, langs, normalizeItemPrice, normalizePrice, normalizePriceForStorage, sanitizeCateringEntries, sanitizeCateringEntry, saveStatusText, setFormChecked, setFormValue, statusKeys, syncFlags, t, translationTargets } from './admin-utils.js';
import { panelShell, itemCard as renderItemCard, dnevnikView as renderDnevnikView, cateringView as renderCateringView, exportPanelView as renderExportPanelView, qrPanelView as renderQrPanelView, analyticsView as renderAnalyticsView, settingsView as renderSettingsView, sectionView as renderSectionView, drinksView as renderDrinksView } from './admin-render.js';
import { bindDnevnik, bindCateringi } from './admin-events.js';

document.body.classList.add('admin-page');
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
const normalizeAllPrices = () => { Object.values(data.sections || {}).flat().forEach(normalizeItemPrice); (data.drinkCategories || []).forEach((cat) => (cat.items || []).forEach(normalizeItemPrice)); };

function updateSaveStatus(){ const msg=document.getElementById('msg'); if(!msg) return; msg.textContent=saveStatusText(saveState); msg.className=`save-status is-${saveState}`; }

function clearSession(){token='';localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(TOKEN_EXP_KEY);} 
function allowedPanels(){const staticPanels=['daily','lunch','weekly','desserts','settings','export','qr','analytics','dnevnik','cateringi'];const drinkPanels=(data?.drinkCategories||[]).map((_,i)=>`drinks-${i}`);return new Set([...staticPanels,...drinkPanels]);}
function normalizeActivePanel(candidate){return allowedPanels().has(candidate)?candidate:'daily';}
function setActivePanel(next){activePanel=normalizeActivePanel(next);localStorage.setItem(ACTIVE_PANEL_KEY,activePanel);}
function restoreActivePanel(){const stored=localStorage.getItem(ACTIVE_PANEL_KEY);activePanel=normalizeActivePanel(stored||'daily');}
function setSession(nextToken){token=nextToken;localStorage.setItem(TOKEN_KEY,nextToken);localStorage.setItem(TOKEN_EXP_KEY,String(Date.now()+SESSION_MS));}
function applySessionFromStorage(){const storedToken=localStorage.getItem(TOKEN_KEY);const expiresAt=Number(localStorage.getItem(TOKEN_EXP_KEY)||0);if(!storedToken||!expiresAt||Date.now()>=expiresAt){clearSession();return false;}token=storedToken;return true;}
function showLogin(message=''){document.getElementById('login').classList.remove('hidden');document.getElementById('app').classList.add('hidden');document.getElementById('loginErr').textContent=message;}
function handleUnauthorized(){clearSession();showLogin('Seja je potekla. Prosimo, prijavite se ponovno.');}

function itemCard(section, i, x, drinkCatIdx=null){return renderItemCard(section, i, x, { drinkCatIdx, openAdvancedIds, statusKeys, adminStatusLabels, allergenIds: allergenIds(), t, allergens: data.allergens || {}, translationTargets });}


function dnevnikView(){return renderDnevnikView({ data, dnevnikDateFilter, dnevnikEditingId, dnevnikResultOptions, panelShell });}


function cateringView(){return renderCateringView({ data, cateringDateFilter, cateringEditingId, cateringStatusOptions, formatDateSl, panelShell });}

function sectionView(key,titleKey,desc){return renderSectionView({ data, key, titleKey, desc, t, itemCard, panelShell });}
function drinksView(ci){return renderDrinksView({ data, ci, t, itemCard, panelShell });}
function settingsView(){return renderSettingsView({ data, panelShell, langFields });}
function analyticsView(){return renderAnalyticsView({ data, analyticsNotice, panelShell });} 
function exportView(){return renderExportPanelView({ panelShell });} 
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
  if (activePanel==='qr') return renderQrPanelView({ panelShell, publicMenuUrl: PUBLIC_MENU_URL }); 
  if (activePanel==='export') return exportView();
  return sectionView('daily','section_daily','Urejanje dnevne ponudbe.');
}

function sidebar(){const iconMap={daily:"<rect x='5' y='6' width='3' height='3' rx='0.6'/><rect x='5' y='11' width='3' height='3' rx='0.6'/><rect x='5' y='16' width='3' height='3' rx='0.6'/><path d='M10.5 7.5h8M10.5 12.5h8M10.5 17.5h8'/>",lunch:"<path d='M4 13h16'/><path d='M6 13a6 6 0 0 1 12 0'/><path d='M6 13v3M18 13v3'/>",weekly:"<rect x='4' y='5' width='16' height='15' rx='2'/><path d='M8 3v4M16 3v4M4 10h16'/>",desserts:"<path d='M5 18h12.5'/><path d='M7 10h11l-4 8H8z'/><path d='M14.5 10a2.5 2.5 0 0 0-5 0'/>",tea:"<path d='M5 10h10v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z'/><path d='M15 11h2a2.5 2.5 0 0 1 0 5h-2'/><path d='M8 6c.8.6.8 1.6 0 2.2'/>",coffee:"<path d='M5 10h10v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z'/><path d='M15 11h2a2.5 2.5 0 0 1 0 5h-2'/><path d='M8.5 6c.8.6.8 1.6 0 2.2M11.5 5.5c.8.7.8 1.8 0 2.6'/>",juices:"<path d='M8 4.5h8l-1.1 14a2 2 0 0 1-2 1.8h-1.8a2 2 0 0 1-2-1.8z'/><path d='M9 8h6M11 12h2'/>",settings:"<circle cx='12' cy='12' r='3'/><path d='M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.8 6.8l1.4 1.4M15.8 15.8l1.4 1.4M6.8 17.2l1.4-1.4M15.8 8.2l1.4-1.4'/>",export:"<path d='M8 4v16'/><path d='M5.5 6.5 8 4l2.5 2.5'/><path d='M16 20V4'/><path d='M13.5 17.5 16 20l2.5-2.5'/>",qr:"<rect x='4' y='4' width='6' height='6' rx='1'/><rect x='14' y='4' width='6' height='6' rx='1'/><rect x='4' y='14' width='6' height='6' rx='1'/><path d='M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM16 16h2v2h-2zM18 18h2v2h-2'/>",analytics:"<path d='M5 19V9'/><path d='M11 19V6'/><path d='M17 19v-8'/><path d='M3.5 19h17'/>",dnevnik:"<path d='M7 4.5h9l2.5 2.5V19.5H7a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2z'/><path d='M16 4.5V7h2.5M9 11h7M9 15h7'/>",cateringi:"<path d='M4 13h16'/><path d='M6 13a6 6 0 0 1 12 0'/><path d='M6 13v3M18 13v3'/>"};const icon=(kind='daily')=>`<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' class='nav-icon-svg' aria-hidden='true' focusable='false'>${iconMap[kind]||iconMap.daily}</svg>`;const iconForDrink=(label)=>{const key=String(label||'').toLowerCase();if(key.includes('čaj')||key.includes('tea')) return icon('tea');if(key.includes('kava')||key.includes('coffee')) return icon('coffee');if(key.includes('sok')||key.includes('juice')) return icon('juices');return icon('tea');};const nav=(panel,label,kind)=>`<button class='nav-link ${activePanel===panel?'active':''}' data-panel='${panel}'><span class='nav-icon' aria-hidden='true'>${kind==='drink-dynamic'?iconForDrink(label):icon(kind)}</span><span class='nav-label'>${label}</span></button>`;return `<aside class='sidebar'><div class='brand-mini'>CASA DE RIN</div><div class='sidebar-sub'>Upravljanje menija</div><nav><h5><span>MENI</span></h5>${nav('daily','Dnevna ponudba','daily')}${nav('lunch','Kosilo','lunch')}${nav('weekly','Tedenska ponudba','weekly')}${nav('desserts','Sladice','desserts')}<h5><span>PIJAČA</span></h5>${(data.drinkCategories||[]).map((cat,ci)=>nav(`drinks-${ci}`,t(cat.title),'drink-dynamic')).join('')}<h5><span>SISTEM</span></h5>${nav('settings','Nastavitve','settings')}${nav('export','Izvoz / Uvoz','export')}${nav('qr','QR koda','qr')}${nav('analytics','Analytics','analytics')}<h5><span>ADMIN</span></h5>${nav('dnevnik','Dnevnik','dnevnik')}${nav('cateringi','Cateringi','cateringi')}<button class='btn' id='logoutBtn'>Odjava</button></nav></aside>`;}

async function suggestTranslationsForItem(target){const availability = await fetch('/.netlify/functions/translate-suggest').then((r)=>r.json().catch(()=>({}))); if (!availability.configured) { alert('DEEPL_API_KEY manjka. Prevajanje trenutno ni nastavljeno.'); return; } const hasContent = translationTargets.some((lang)=>(target.description?.[lang] || '').trim()); if (hasContent && !window.confirm('Nekatera ciljna polja (EN/IT/DE) že vsebujejo besedilo. Ali jih želiš prepisati?')) return; const slDescription = (target.description?.sl || '').trim(); if (!slDescription) { alert('Manjka slovenski opis za prevod.'); return; } const translate = async (text, targetLang) => { const r = await fetch('/.netlify/functions/translate-suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, targetLang }) }); const j = await r.json().catch(()=>({})); if (!r.ok) throw new Error(j.error || 'Napaka pri prevajanju.'); return j.text; }; try { snapshotData(); for (const lang of translationTargets) { target.description = target.description || {}; target.description[lang] = await translate(slDescription, langToDeepL[lang]); } markDirty(); render(); } catch (e) { alert(e.message || 'Napaka pri prevajanju.'); }}
function resolveTarget(el){const s=el.dataset.s,i=+el.dataset.i,c=el.dataset.c;return c!==''?data.drinkCategories[+c].items[i]:data.sections[s][i];}

function bind(){ document.querySelectorAll('.nav-link').forEach((b)=>b.onclick=()=>{setActivePanel(b.dataset.panel);render();});
 document.querySelectorAll('.admin-item[data-s][data-i]').forEach((el)=>{const target=resolveTarget(el);const itemId=el.dataset.id;const advanced=el.querySelector('details.advanced');if(advanced){advanced.addEventListener('toggle',()=>{if(advanced.open) openAdvancedIds.add(itemId); else openAdvancedIds.delete(itemId);});}el.querySelectorAll('input').forEach((inp)=>inp.addEventListener('input',()=>{snapshotData();markDirty();const {f,l}=inp.dataset;if(l){target[f]=target[f]||{};target[f][l]=inp.value;} else target[f]=f==='sortOrder'?Number(inp.value||0):inp.value;})); el.querySelectorAll("input[data-f='price']").forEach((inp)=>inp.addEventListener('blur',()=>{snapshotData();target.price=normalizePrice(inp.value);inp.value=target.price;markDirty();})); el.querySelectorAll('[data-status]').forEach((b)=>b.onclick=()=>{snapshotData();target.status=b.dataset.status;syncFlags(target);markDirty();render();}); el.querySelectorAll('[data-a]').forEach((b)=>b.onclick=()=>{snapshotData();markDirty();target.allergens=target.allergens||[];const idx=target.allergens.indexOf(b.dataset.a);if(idx>=0)target.allergens.splice(idx,1);else target.allergens.push(b.dataset.a);render();}); const s=el.querySelector('.suggest'); if(s) s.onclick=()=>suggestTranslationsForItem(target); el.querySelector('.duplicate-item').onclick=()=>{snapshotData();const c=el.dataset.c,s=el.dataset.s,i=+el.dataset.i;const arr=c!==''?data.drinkCategories[+c].items:data.sections[s];arr.splice(i+1,0,cloneItem(arr[i]));markDirty();render();}; el.querySelector('.del').onclick=()=>{snapshotData();markDirty();const c=el.dataset.c,s=el.dataset.s,i=+el.dataset.i;if(c!=='')data.drinkCategories[+c].items.splice(i,1);else data.sections[s].splice(i,1);render();}; el.querySelector('.up').onclick=()=>{snapshotData();markDirty();const c=el.dataset.c,s=el.dataset.s,i=+el.dataset.i;const arr=c!==''?data.drinkCategories[+c].items:data.sections[s];if(i>0){[arr[i-1],arr[i]]=[arr[i],arr[i-1]];}render();}; el.querySelector('.down').onclick=()=>{snapshotData();markDirty();const c=el.dataset.c,s=el.dataset.s,i=+el.dataset.i;const arr=c!==''?data.drinkCategories[+c].items:data.sections[s];if(i<arr.length-1){[arr[i+1],arr[i]]=[arr[i],arr[i+1]];}render();}; });
 document.querySelectorAll('[data-add-section]').forEach((b)=>b.onclick=()=>{snapshotData();const k=b.dataset.addSection;if(k.startsWith('drinks-')){const ci=+k.split('-')[1];data.drinkCategories[ci].items.push(emptyItem('beverage'));}else{data.sections[k].push(emptyItem(k));}markDirty();render();});
 document.querySelectorAll('[data-dup-section]').forEach((b)=>b.onclick=()=>{const k=b.dataset.dupSection;let arr=[];if(k.startsWith('drinks-')){arr=data.drinkCategories[+k.split('-')[1]].items||[];}else arr=data.sections[k]||[]; if(!arr.length){alert('Ni še elementa za dupliciranje.');return;}snapshotData();arr.splice(arr.length,0,cloneItem(arr[arr.length-1]));markDirty();render();});
 
 bindDnevnik({ data, snapshotData, markDirty, render, getDnevnikEditingId: ()=>dnevnikEditingId, setDnevnikEditingId: (v)=>{dnevnikEditingId=v;}, getDnevnikDateFilter: ()=>dnevnikDateFilter, setDnevnikDateFilter: (v)=>{dnevnikDateFilter=v;} });
 bindCateringi({ data, snapshotData, markDirty, render, getCateringEditingId: ()=>cateringEditingId, setCateringEditingId: (v)=>{cateringEditingId=v;}, setCateringDateFilter: (v)=>{cateringDateFilter=v;}, sanitizeCateringEntry, sanitizeCateringEntries, setFormValue, setFormChecked, getFormField });
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
