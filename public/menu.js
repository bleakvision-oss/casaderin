const state={lang:'sl',data:null};
const t=(obj)=>obj?.[state.lang]||obj?.sl||'';
const ui=(k)=>t(state.data.translations?.[k]||{});
const allergenLabel=(id)=>t(state.data.allergens?.[id]||{sl:id});
const statusBadge=(x)=>x.status==='low'?`<span class='badge low'>${ui('status_low')}</span>`:x.status==='sold_out'?`<span class='badge sold'>${ui('status_sold_out')}</span>`:'';
const allergenPills=(x)=>x.allergens?.length?`<div class='allergens'>${x.allergens.map((a)=>`<span class='all-pill'>${allergenLabel(a)}</span>`).join('')}</div>`:'';
const item=(x)=>{if(x.status==='hidden'||x.hidden)return'';const sold=x.status==='sold_out'||x.soldOut;return `<article class='item ${sold?'sold-dim':''}'><h4>${t(x.name)} ${statusBadge(x)}</h4><div>${t(x.description||{})}</div><div class='price'>${x.price} €</div>${allergenPills(x)}</article>`;};
const card=(title,html)=>`<section class='card'><h3>${title}</h3>${html}</section>`;

function formatUpdatedAt(iso){
  if(!iso)return '';
  const date=new Date(iso);
  if(Number.isNaN(date.getTime()))return '';
  return `${ui('last_updated_at')} ${date.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}`;
}

function settingsSection(){
  const s=state.data.settings||{};
  const rows=[];
  if(s.phone)rows.push(`<a class='info-row' href='tel:${s.phone.replace(/\s+/g,'')}'><span class='icon'>📞</span><span class='label'>${ui('phone_label')||'Phone'}</span><span class='value'>${s.phone}</span></a>`);

  if(s.address){
    const addressLink=s.googleMapsUrl||'';
    const addressValue=addressLink?`<a href='${addressLink}' target='_blank' rel='noopener noreferrer'>${s.address}</a>`:s.address;
    rows.push(`<div class='info-row'><span class='icon'>📍</span><span class='label'>${ui('address_label')||'Address'}</span><span class='value'>${addressValue}</span></div>`);
  }

  const opening=t(s.openingHours||{});
  if(opening)rows.push(`<div class='info-row'><span class='icon'>🕒</span><span class='label'>${ui('opening_hours_label')||'Opening hours'}</span><span class='value'>${opening}</span></div>`);

  if(s.instagramUrl)rows.push(`<a class='info-row' href='${s.instagramUrl}' target='_blank' rel='noopener noreferrer'><span class='icon'>📷</span><span class='label'>${ui('instagram_label')||'Instagram'}</span><span class='value'>@casaderin</span></a>`);

  if(s.googleMapsUrl)rows.push(`<a class='maps-btn' href='${s.googleMapsUrl}' target='_blank' rel='noopener noreferrer'>🗺️ ${ui('open_google_maps')}</a>`);

  if(!rows.length)return '';
  return `<aside class='visitor-card'><h3>${s.restaurantName||'Casa de Rin'}</h3><div class='visitor-grid'>${rows.join('')}</div></aside>`;
}

function introSection(){
  const updated=formatUpdatedAt(state.data.updatedAt);
  return `<section class='intro-block'>${updated?`<p class='updated'>${updated}</p>`:''}${settingsSection()}</section>`;
}

function drinksSection(){const categories=state.data.drinkCategories||[];if(!categories.length)return card(ui('beverage'),(state.data.sections.drinks||[]).map(item).join(''));return card(ui('beverage'),categories.map((cat)=>{const items=(cat.items||[]).map(item).join('');if(!items)return'';return `<div class='drink-group'><h4>${t(cat.title)}</h4>${items}</div>`;}).join(''));}
function render(){const d=state.data,s=d.sections;document.getElementById('content').innerHTML=[introSection(),card(ui('section_daily'),s.daily.map(item).join('')),card(ui('lunch'),s.lunch.map(item).join('')),card(ui('section_weekly'),s.weekly.map(item).join('')),card(ui('dessert'),s.desserts.map(item).join('')),drinksSection()].join('');}
async function load(){state.data=await fetch('/api/menu').then(r=>r.json());render();}
document.getElementById('today').textContent=new Date().toLocaleDateString('sl-SI',{dateStyle:'full'});
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-lang]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.lang=b.dataset.lang;render();});
load();
