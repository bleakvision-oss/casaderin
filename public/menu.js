const state={lang:'sl',data:null};
const fallbackUi={phone_label:{sl:'Telefon',en:'Phone',it:'Telefono',de:'Telefon'},address_label:{sl:'Naslov',en:'Address',it:'Indirizzo',de:'Adresse'},opening_hours_label:{sl:'Odpiralni čas',en:'Opening hours',it:'Orari di apertura',de:'Öffnungszeiten'},instagram_label:{sl:'Instagram',en:'Instagram',it:'Instagram',de:'Instagram'},open_google_maps:{sl:'Odpri v Google Maps',en:'Open in Google Maps',it:'Apri in Google Maps',de:'In Google Maps öffnen'}};
const t=(obj)=>obj?.[state.lang]||obj?.sl||'';
const ui=(k)=>t(state.data.translations?.[k]||fallbackUi[k]||{});
const allergenLabel=(id)=>t(state.data.allergens?.[id]||{sl:id});
const statusBadge=(x)=>x.status==='low'?`<span class='badge low'>${ui('status_low')}</span>`:x.status==='sold_out'?`<span class='badge sold'>${ui('status_sold_out')}</span>`:`<span class='badge available'>${ui('status_available')}</span>`;
const normalizePrice=(value)=>{const n=Number(String(value??'').replace(',', '.'));if(!Number.isFinite(n))return '0,00';return n.toFixed(2).replace('.', ',');};
const allergenPills=(x)=>x.allergens?.length?`<div class='allergens'>${x.allergens.map((a)=>`<span class='all-pill'>${allergenLabel(a)}</span>`).join('')}</div>`:'';
const formatPrice=(value)=>`${normalizePrice(value)} €`;
const item=(x,opts={})=>{if(x.status==='hidden'||x.hidden)return'';const sold=x.status==='sold_out'||x.soldOut;const showStatus=opts.showStatus!==false;const image=x.imageUrl?`<div class='item-image-wrap'><img class='item-image' src='${x.imageUrl}' alt='${t(x.name)}' loading='lazy'></div>`:'';return `<article class='item ${sold?'sold-dim':''} ${x.imageUrl?'has-image':'no-image'}'><div class='item-copy'><div class='item-head'><h4>${t(x.name)}</h4><div class='item-meta'>${showStatus?statusBadge(x):''}<div class='price'>${formatPrice(x.price)}</div></div></div><div class='item-desc'>${t(x.description||{})}</div>${allergenPills(x)}</div>${image}</article>`;};
const card=(title,html)=>`<section class='card'><h3><span class='diamond-sep' aria-hidden='true'></span>${title}<span class='diamond-sep' aria-hidden='true'></span></h3>${html||`<p class='muted'>—</p>`}</section>`;
function formatUpdatedAt(iso){if(!iso)return '';const date=new Date(iso);if(Number.isNaN(date.getTime()))return '';return `${ui('last_updated_at')} ${date.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}`;}
function settingsSection(){const s=state.data.settings||{};const rows=[];if(s.phone)rows.push(`<a class='info-row' href='tel:${s.phone.replace(/\s+/g,'')}'><span class='icon'>📞</span><span class='label'>${ui('phone_label')}</span><span class='value'>${s.phone}</span></a>`);if(s.address){const addressValue=s.googleMapsUrl?`<a href='${s.googleMapsUrl}' target='_blank' rel='noopener noreferrer'>${s.address}</a>`:s.address;rows.push(`<div class='info-row'><span class='icon'>📍</span><span class='label'>${ui('address_label')}</span><span class='value'>${addressValue}</span></div>`);}const opening=t(s.openingHours||{});if(opening)rows.push(`<div class='info-row'><span class='icon'>🕒</span><span class='label'>${ui('opening_hours_label')}</span><span class='value'>${opening}</span></div>`);if(s.instagramUrl)rows.push(`<a class='info-row' href='${s.instagramUrl}' target='_blank' rel='noopener noreferrer'><span class='icon'>📷</span><span class='label'>${ui('instagram_label')}</span><span class='value'>@casaderin</span></a>`);if(s.googleMapsUrl)rows.push(`<a class='maps-btn' href='${s.googleMapsUrl}' target='_blank' rel='noopener noreferrer'><span class='icon' aria-hidden='true'>🗺️</span><span class='maps-label'>${ui('open_google_maps')}</span></a>`);if(!rows.length)return '';return `<aside class='visitor-card'><h3>${s.restaurantName||'Casa de Rin'}</h3><div class='visitor-grid'>${rows.join('')}</div></aside>`;}
function introSection(){const updated=formatUpdatedAt(state.data.updatedAt);const st=state.data.settings||{};const hero=st.heroImageUrl?`<figure class='hero-media'><img src='${st.heroImageUrl}' alt='${st.restaurantName||'Casa de Rin'}' loading='eager'></figure>`:'';return `<section class='hero-intro'>${updated?`<p class='updated'>${updated}</p>`:''}${settingsSection()}${hero}</section>`;}
function ensureLangFlags(){const flags={sl:'🇸🇮',it:'🇮🇹',en:'🇬🇧',de:'🇩🇪'};document.querySelectorAll('[data-lang]').forEach((btn)=>{const flagEl=btn.querySelector('.flag');if(flagEl&&flags[btn.dataset.lang])flagEl.textContent=flags[btn.dataset.lang];});}
function drinkRow(x){return `<div class='drink-row'><div class='drink-main'><strong>${t(x.name)}</strong>${t(x.description||{})?`<div class='drink-desc'>${t(x.description||{})}</div>`:''}${allergenPills(x)}</div><div class='price'>${formatPrice(x.price)}</div></div>`;}
function drinksSection(){const categories=state.data.drinkCategories||[];const fallback=state.data.sections.drinks||[];if(!categories.length)return card(ui('beverage'),fallback.map((x)=>item(x,{showStatus:false})).join(''));return card(ui('beverage'),categories.map((cat)=>{const rows=(cat.items||[]).filter((x)=>!(x.status==='hidden'||x.hidden)).map(drinkRow).join('');if(!rows)return'';return `<section class='drink-group card'><h4>${t(cat.title)}</h4>${rows}</section>`;}).join(''));}
function render(){const d=state.data,s=d.sections;document.getElementById('content').innerHTML=[introSection(),card(ui('section_daily'),s.daily.map(item).join('')),card(ui('lunch'),s.lunch.map(item).join('')),card(ui('section_weekly'),s.weekly.map(item).join('')),card(ui('dessert'),s.desserts.map(item).join('')),drinksSection(),`<footer class='menu-footer'>Dober tek · Buon appetito · Bon appétit · Guten Appetit<div class='price-note'>Vse cene so v evrih. Cenik velja od 20. 4. 2026.<br>All prices are in euros. Price list valid from 20 April 2026.<br>Tutti i prezzi sono in euro. Listino prezzi valido dal 20 aprile 2026.<br>Alle Preise sind in Euro angegeben. Preisliste gültig ab dem 20. April 2026.</div><div id='refresh-note' class='refresh-note' aria-live='polite'></div></footer>`].join('');}
async function load(){state.data=await fetch('/api/menu').then(r=>r.json());render();}
async function refreshMenuSilently(){
  const scrollY=window.scrollY;
  const next=await fetch('/api/menu').then(r=>r.json());
  state.data=next;
  render();
  window.scrollTo({top:scrollY});
  const note=document.getElementById('refresh-note');
  if(note){
    note.textContent='Meni je osvežen';
    note.classList.add('show');
    setTimeout(()=>note.classList.remove('show'),2000);
  }
}
async function trackView(){
  const mobile=window.matchMedia('(max-width: 760px)').matches;
  await fetch('/api/analytics/track',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lang:state.lang,device:mobile?'mobile':'desktop'})}).catch(()=>{});
}
document.getElementById('today').textContent=new Date().toLocaleDateString('sl-SI',{dateStyle:'full'});
ensureLangFlags();
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-lang]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.lang=b.dataset.lang;render();trackView();});
load();
trackView();
setInterval(refreshMenuSilently,90000);
