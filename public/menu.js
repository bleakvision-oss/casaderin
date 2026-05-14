const state={lang:'sl',data:null};
const t=(obj)=>obj?.[state.lang]||obj?.sl||'';
const ui=(k)=>t(state.data.translations?.[k]||{});
const allergenLabel=(id)=>t(state.data.allergens?.[id]||{sl:id});
const card=(title,items)=>`<section class='card'><h3>${title}</h3>${items.join('')}</section>`;
const statusBadge=(x)=>x.status==='low'?`<span class='badge low'>${ui('status_low')}</span>`:x.status==='sold_out'?`<span class='badge sold'>${ui('status_sold_out')}</span>`:'';
const item=(x)=> x.status==='hidden'?'':`<article class='item ${x.status==='sold_out'?'item-sold':''}'><h4>${t(x.name)} ${statusBadge(x)}</h4><div>${t(x.description||{})}</div><div class='price'>${x.price} €</div>${x.allergens?.length?`<div class='allergen-pills'>${x.allergens.map(a=>`<span class='allergen-pill selected'>${allergenLabel(a)}</span>`).join('')}</div>`:''}</article>`;
function render(){const d=state.data;const c=document.getElementById('content');const s=d.sections;c.innerHTML=[card(ui('section_daily'),s.daily.map(item)),card(ui('lunch'),s.lunch.map(item)),card(ui('section_weekly'),s.weekly.map(item)),card(ui('dessert'),s.desserts.map(item)),card(ui('beverage'),s.drinks.map(item)),`<section class='card'><h3>Kontakt</h3><div>${d.contact.location}</div></section>`].join('');}
async function load(){state.data=await fetch('/api/menu').then(r=>r.json());render();}
document.getElementById('today').textContent=new Date().toLocaleDateString('sl-SI',{dateStyle:'full'});
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-lang]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.lang=b.dataset.lang;render();});
load();
