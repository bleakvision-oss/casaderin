const state={lang:'sl',data:null};
const t=(obj)=>obj?.[state.lang]||obj?.sl||'';
const ui=(k)=>t(state.data.translations?.[k]||{});
const allergenLabel=(id)=>t(state.data.allergens?.[id]||{sl:id});
const card=(title,items)=>`<section class='card'><h3>${title}</h3>${items.join('')}</section>`;
const item=(x)=> x.hidden?'':`<article class='item'><h4>${t(x.name)} ${x.soldOut?`<span class='badge sold'>${ui('sold_out')}</span>`:''}</h4><div>${t(x.description||{})}</div><div class='price'>${x.price} €</div>${x.allergens?.length?`<div class='allergens'>${ui('allergens')}: ${x.allergens.map(allergenLabel).join(', ')}</div>`:''}</article>`;
const settingsLine=(label,value)=>value?`<div><strong>${label}:</strong> ${value}</div>`:'';
const settingsLink=(label,url,text,prefix='')=>url?`<div><strong>${label}:</strong> <a href='${url}' target='_blank' rel='noopener noreferrer'>${prefix}${text||url}</a></div>`:'';
function settingsSection(){const s=state.data.settings||{};const mapUrl=s.googleMapsUrl||'';const addressText=s.address||'';const addressBlock=mapUrl?settingsLink('Address',mapUrl,addressText||'Google Maps'):settingsLine('Address',addressText);return `<section class='card'><h3>${s.restaurantName||'Restaurant settings'}</h3>${settingsLine('Phone',s.phone?`<a href='tel:${s.phone.replace(/\s+/g,'')}' >${s.phone}</a>`:'')}${addressBlock}${settingsLink('Instagram',s.instagramUrl,s.instagramUrl)}${settingsLine('Opening hours',t(s.openingHours||{}))}${settingsLine('Footer',t(s.footerText||{}))}</section>`;}
function render(){const d=state.data;const c=document.getElementById('content');const s=d.sections;const updated=d.updatedAt?`<div class='muted updated'>${ui('last_updated_at')} ${new Date(d.updatedAt).toLocaleTimeString(state.lang==='sl'?'sl-SI':'en-GB',{hour:'2-digit',minute:'2-digit'})}</div>`:'';c.innerHTML=[updated,card(ui('section_daily'),s.daily.map(item)),card(ui('lunch'),s.lunch.map(item)),card(ui('section_weekly'),s.weekly.map(item)),card(ui('dessert'),s.desserts.map(item)),card(ui('beverage'),s.drinks.map(item)),settingsSection()].join('');}
async function load(){state.data=await fetch('/api/menu').then(r=>r.json());render();}
document.getElementById('today').textContent=new Date().toLocaleDateString('sl-SI',{dateStyle:'full'});
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-lang]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.lang=b.dataset.lang;render();});
load();
