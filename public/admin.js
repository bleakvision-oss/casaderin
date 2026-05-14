let token=localStorage.getItem('adminToken')||'';let data=null;
const allergens=['gluten','mleko','jajca','soja','oreščki','arašidi','sezam','zelena','gorčica','sulfiti','volčji_bob','mehkužci','raki','ribe'];
const tr=(o,k)=>o?.[k]||'';
const langFields=(obj,field)=>['sl','en','it'].map(l=>`<label>${field} ${l.toUpperCase()}<input data-l='${l}' data-f='${field}' value="${(obj[field]?.[l]||'').replaceAll('"','&quot;')}"></label>`).join('');
function row(section,i,x,withCategory=false){return `<div class='admin-item' data-s='${section}' data-i='${i}'>${withCategory?`<label>Kategorija<input data-f='category' value='${x.category||''}'></label>`:''}${langFields(x,'name')}${langFields(x,'description')}<label>Cena<input data-f='price' value='${x.price||''}'></label><div class='inline'><label><input type='checkbox' data-f='soldOut' ${x.soldOut?'checked':''}> Razprodano</label><label><input type='checkbox' data-f='hidden' ${x.hidden?'checked':''}> Skrij</label></div><fieldset><legend>Alergeni</legend><div class='inline'>${allergens.map(a=>`<label><input type='checkbox' data-a='${a}' ${x.allergens?.includes(a)?'checked':''}> ${a}</label>`).join('')}</div></fieldset>${section==='drinks'?`<button class='btn del'>Izbriši</button>`:''}</div>`}
function render(){const app=document.getElementById('app');app.innerHTML=`<div class='card'><h3>Dnevna ponudba</h3>${data.daily.map((x,i)=>row('daily',i,x)).join('')}</div><div class='card'><h3>Kosilo</h3>${row('lunch',0,data.lunch)}</div><div class='card'><h3>Tedenska ponudba</h3>${data.weekly.map((x,i)=>row('weekly',i,x)).join('')}</div><div class='card'><h3>Sladice</h3>${data.desserts.map((x,i)=>row('desserts',i,x,true)).join('')}</div><div class='card'><h3>Pijača</h3>${data.drinks.map((x,i)=>row('drinks',i,x)).join('')}<button class='btn' id='addDrink'>+ Dodaj pijačo</button></div><button class='btn' id='save'>Shrani spremembe</button> <span id='msg'></span>`;
app.querySelectorAll('.admin-item').forEach(el=>{
  const s=el.dataset.s;const i=Number(el.dataset.i);const target=s==='lunch'?data.lunch:data[s][i];
  el.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',()=>{const f=inp.dataset.f,l=inp.dataset.l,a=inp.dataset.a;if(a){target.allergens=allergens.filter(x=>el.querySelector(`[data-a="${x}"]`)?.checked);return;}if(inp.type==='checkbox'){target[f]=inp.checked;return;}if(l){target[f]=target[f]||{};target[f][l]=inp.value;}else target[f]=inp.value;}));
  el.querySelector('.del')?.addEventListener('click',()=>{data.drinks.splice(i,1);render();});
});
document.getElementById('addDrink').onclick=()=>{data.drinks.push({id:crypto.randomUUID(),name:{sl:'Nova pijača',en:'New drink',it:'Nuova bevanda'},description:{sl:'',en:'',it:''},price:'0.00',soldOut:false,hidden:false,allergens:[]});render();};
document.getElementById('save').onclick=save;}
async function save(){const r=await fetch('/api/admin/menu',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${token}`},body:JSON.stringify(data)});document.getElementById('msg').textContent=r.ok?'Shranjeno':'Napaka';document.getElementById('msg').className=r.ok?'success':'';}
async function load(){data=await fetch('/api/menu').then(r=>r.json());document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');render();}
async function login(){
  const loginErr=document.getElementById('loginErr');
  loginErr.textContent='';
  const password=document.getElementById('pwd').value;

  try{
    const r=await fetch('/.netlify/functions/admin-login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({password})
    });

    const j=await r.json().catch(()=>({}));
    if(!r.ok){
      loginErr.textContent=j.error||'Napačno geslo';
      return;
    }

    if(!j.token){
      loginErr.textContent='Napaka strežnika';
      return;
    }

    token=j.token;
    localStorage.setItem('adminToken',token);
    await load();
  }catch(_e){
    loginErr.textContent='Napaka strežnika. Poskusite znova.';
  }
}

document.getElementById('loginBtn').onclick=login;if(token)load();
