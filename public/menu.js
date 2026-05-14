const state={lang:'sl',data:null};
const t=(obj)=>obj?.[state.lang]||obj?.sl||'';
const ui=(k)=>t(state.data.translations?.[k]||{});
const allergenLabel=(id)=>t(state.data.allergens?.[id]||{sl:id});
const statusBadge=(x)=>x.status==='low'?`<span class='badge low'>${ui('status_low')}</span>`:x.status==='sold_out'?`<span class='badge sold'>${ui('status_sold_out')}</span>`:'';
const allergenPills=(x)=>x.allergens?.length?`<div class='allergens'>${x.allergens.map((a)=>`<span class='all-pill'>${allergenLabel(a)}</span>`).join('')}</div>`:'';
const item=(x)=>{if(x.status==='hidden'||x.hidden)return'';const sold=x.status==='sold_out'||x.soldOut;return `<article class='item ${sold?'sold-dim':''}'><h4>${t(x.name)} ${statusBadge(x)}</h4><div>${t(x.description||{})}</div><div class='price'>${x.price} €</div>${allergenPills(x)}</article>`;};
const card=(title,html)=>`<section class='card'><h3>${title}</h3>${html}</section>`;
function settingsSection(){const s=state.data.settings||{};const phone=s.phone?`<div><strong>Phone:</strong> <a href='tel:${s.phone.replace(/\s+/g,'')}' >${s.phone}</a></div>`:'';const address=s.address?`<div><strong>Address:</strong> ${s.googleMapsUrl?`<a href='${s.googleMapsUrl}' target='_blank' rel='noopener noreferrer'>${s.address}</a>`:s.address}</div>`:'';const insta=s.instagramUrl?`<div><strong>Instagram:</strong> <a href='${s.instagramUrl}' target='_blank' rel='noopener noreferrer'>${s.instagramUrl}</a></div>`:'';const hrs=t(s.openingHours||{})?`<div><strong>Opening hours:</strong> ${t(s.openingHours||{})}</div>`:'';const footer=t(s.footerText||{})?`<div><strong>Footer:</strong> ${t(s.footerText||{})}</div>`:'';const parts=[phone,address,insta,hrs,footer].filter(Boolean).join('');return parts?`<section class='card'><h3>${s.restaurantName||'Restaurant'}</h3>${parts}</section>`:'';}
function drinksSection(){const categories=state.data.drinkCategories||[];if(!categories.length)return card(ui('beverage'),(state.data.sections.drinks||[]).map(item).join(''));return card(ui('beverage'),categories.map((cat)=>{const items=(cat.items||[]).map(item).join('');if(!items)return'';return `<div class='drink-group'><h4>${t(cat.title)}</h4>${items}</div>`;}).join(''));}
function render(){const d=state.data,s=d.sections;document.getElementById('content').innerHTML=[card(ui('section_daily'),s.daily.map(item).join('')),card(ui('lunch'),s.lunch.map(item).join('')),card(ui('section_weekly'),s.weekly.map(item).join('')),card(ui('dessert'),s.desserts.map(item).join('')),drinksSection(),settingsSection()].join('');}
async function load(){state.data=await fetch('/api/menu').then(r=>r.json());render();}
document.getElementById('today').textContent=new Date().toLocaleDateString('sl-SI',{dateStyle:'full'});
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-lang]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.lang=b.dataset.lang;render();});
load();
