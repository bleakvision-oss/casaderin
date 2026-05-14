const state={lang:'sl',data:null};
const allergenMap={gluten:'Gluten',mleko:'Mleko',jajca:'Jajca',soja:'Soja','oreščki':'Oreščki','arašidi':'Arašidi',sezam:'Sezam',zelena:'Zelena',gorčica:'Gorčica',sulfiti:'Sulfiti','volčji_bob':'Volčji bob','mehkužci':'Mehkužci',raki:'Raki',ribe:'Ribe'};
const t=(obj)=>obj?.[state.lang]||obj?.sl||'';
const card=(title,items)=>`<section class='card'><h3>${title}</h3>${items.join('')}</section>`;
const item=(x,showCategory=false)=> x.hidden?'':`<article class='item'><h4>${showCategory?`<span class='badge'>${x.category||''}</span> `:''}${t(x.name)} ${x.soldOut?`<span class='badge sold'>Razprodano</span>`:''}</h4><div>${t(x.description||{})}</div><div class='price'>${x.price} €</div>${x.allergens?.length?`<div class='allergens'>Alergeni: ${x.allergens.map(a=>allergenMap[a]||a).join(', ')}</div>`:''}</article>`;
function render(){const d=state.data;const c=document.getElementById('content');c.innerHTML=[
card('Dnevna ponudba',d.daily.map(v=>item(v))),
card('Kosilo',[item(d.lunch)]),
card('Tedenska ponudba',d.weekly.map(v=>item(v))),
card('Sladice',d.desserts.map(v=>item(v,true))),
card('Pijača',d.drinks.map(v=>item(v))),
`<section class='card'><h3>Kontakt</h3><div>${d.contact.location}</div><div>${d.contact.phone}</div><a href='${d.contact.instagram}' target='_blank'>Instagram</a><p class='allergens'>Za dodatne informacije o alergenih se obrnite na osebje.</p></section>`
].join('');}
async function load(){state.data=await fetch('/api/menu').then(r=>r.json());render();}
document.getElementById('today').textContent=new Date().toLocaleDateString('sl-SI',{dateStyle:'full'});
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-lang]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.lang=b.dataset.lang;render();});
load();
