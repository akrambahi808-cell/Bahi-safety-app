const API='https://bahisafety.com/wp-json/wc/store/v1';
const WA='967773133380';
const state={cats:[],products:[],page:1,loading:false,done:false,query:'',sort:'date',history:[],cart:JSON.parse(localStorage.getItem('bahi_cart')||'[]')};

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function money(p){return p?.prices?.price?`${Number(p.prices.price)/10**(p.prices.currency_minor_unit||2)} ${p.prices.currency_symbol||''}`:(p?.price_html||'').replace(/<[^>]*>/g,'')||'السعر عند الطلب'}
function imgOf(p){return p?.images?.[0]?.src||''}
function catImg(c){return c?.image?.src||''}
function iconFor(name){const n=(name||'').toLowerCase(); if(n.includes('حذ')||n.includes('shoe'))return'👞';if(n.includes('نظ')||n.includes('glass'))return'🥽';if(n.includes('قف')||n.includes('glove'))return'🧤';if(n.includes('خو')||n.includes('helmet'))return'⛑️';if(n.includes('كم')||n.includes('mask'))return'😷';if(n.includes('حريق')||n.includes('fire'))return'🧯';if(n.includes('عاكس')||n.includes('reflect'))return'🦺';return'🛡️'}
function catCard(c){const src=catImg(c);return `<article class="cat-card" data-cat="${c.id}">${src?`<img loading="lazy" src="${esc(src)}" alt="${esc(c.name)}">`:`<div style="height:100%;min-height:150px;display:grid;place-items:center;font-size:52px">${iconFor(c.name)}</div>`}<div class="cat-name">${esc(c.name)}<div class="cat-count">${Number(c.count||0)} منتج</div></div></article>`}
function productCard(p){const src=imgOf(p);return `<article class="product-card"><div class="pic" data-product="${p.id}">${src?`<img loading="lazy" decoding="async" src="${esc(src)}" alt="${esc(p.name)}">`:`<div style="height:100%;display:grid;place-items:center;color:#777">لا توجد صورة</div>`}</div><div class="product-info"><h3>${esc(p.name)}</h3><div class="price">${money(p)}</div><div class="product-actions"><button class="mini-btn primary" data-product="${p.id}">التفاصيل</button><button class="mini-btn" data-add="${p.id}">+ سلة</button></div></div></article>`}

async function fetchJSON(url,tries=3){let last;for(let i=0;i<tries;i++){try{const r=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});if(!r.ok)throw Error(`HTTP ${r.status}`);return await r.json()}catch(e){last=e;await new Promise(x=>setTimeout(x,500*(i+1)))}}throw last}
async function loadCats(){
  try{
    const key='bahi_cats_v7';const cached=JSON.parse(localStorage.getItem(key)||'null');
    if(cached?.length){state.cats=cached;renderCats()}
    const data=await fetchJSON(`${API}/products/categories?per_page=100&hide_empty=false`);
    state.cats=(Array.isArray(data)?data:[]).filter(c=>!c.parent||c.parent===0);
    localStorage.setItem(key,JSON.stringify(state.cats));renderCats();
  }catch(e){console.warn('categories',e); if(!state.cats.length){state.cats=[];renderCats()}}
}
function renderCats(){const html=state.cats.map(catCard).join('')||'<div class="about-card">جارٍ تحميل الأقسام...</div>';$('#homeCatGrid').innerHTML=html;$('#allCatGrid').innerHTML=html}

async function loadProducts(reset=false){
 if(state.loading||state.done&&!reset)return; state.loading=true;
 if(reset){state.page=1;state.products=[];state.done=false;$('#productGrid').innerHTML=''}
 $('#loadMore').textContent='جاري التحميل...';
 try{
   const q=new URLSearchParams({page:state.page,per_page:20,order:'desc',orderby:state.sort==='date'?'date':state.sort==='price'?'price':'title'});
   if(state.query)q.set('search',state.query);
   const data=await fetchJSON(`${API}/products?${q}`);
   if(!Array.isArray(data)||!data.length)state.done=true;
   else {state.products.push(...data);state.page++;if(data.length<20)state.done=true;renderProducts();if(state.page===2)renderFeatured()}
 }catch(e){console.error(e);toast('تعذر تحميل المنتجات حالياً. سنحاول مرة أخرى تلقائياً.')}
 state.loading=false;$('#loadMore').textContent=state.done?'تم عرض كل المنتجات':'تحميل المزيد';
}
function renderProducts(){const filtered=state.products;$('#productGrid').innerHTML=filtered.map(productCard).join('')||'<div class="about-card">لا توجد منتجات مطابقة.</div>'}
function renderFeatured(){const list=state.products.slice(0,8);$('#featuredGrid').innerHTML=list.map(productCard).join('')||'<div class="about-card">جاري تحميل المنتجات...</div>'}

async function categoryProducts(id,name){
 showView('category');$('#catTitle').textContent=name;$('#categoryGrid').innerHTML='<div class="about-card">جاري تحميل المنتجات...</div>';
 try{const data=await fetchJSON(`${API}/products?category=${encodeURIComponent(id)}&per_page=20&page=1`);$('#categoryGrid').innerHTML=(data||[]).map(productCard).join('')||'<div class="about-card">لا توجد منتجات منشورة في هذا القسم.</div>'}
 catch(e){$('#categoryGrid').innerHTML='<div class="about-card">تعذر تحميل منتجات القسم حالياً.</div>'}
}

async function productDetail(id){
 showView('product');$('#productDetail').innerHTML='<div class="about-card">جاري تحميل المنتج...</div>';
 try{
   const p=await fetchJSON(`${API}/products/${id}`); const images=p.images||[];let active=images[0]?.src||'';
   $('#productDetail').innerHTML=`<div class="detail"><div class="detail-main"><div><img id="mainProductImage" src="${esc(active)}" alt="${esc(p.name)}" onclick="openLightbox(this.src)"><div class="thumbs">${images.map((im,i)=>`<img class="${i===0?'active':''}" src="${esc(im.src)}" alt="${esc(im.alt||p.name)}" data-main="${esc(im.src)}">`).join('')}</div></div><div><h1>${esc(p.name)}</h1><div class="price">${money(p)}</div><div class="detail-desc">${p.description||p.short_description||'<p>لا يوجد وصف متاح.</p>'}</div><div class="product-actions"><button class="mini-btn primary" data-add="${p.id}">إضافة للسلة</button><a class="mini-btn wa" href="https://wa.me/${WA}?text=${encodeURIComponent('السلام عليكم، أريد الاستفسار عن: '+p.name)}" target="_blank" rel="noopener">واتساب</a></div><a class="btn ghost" href="${esc(p.permalink||'#')}" target="_blank" rel="noopener">عرض المنتج في الموقع</a></div></div></div>`;
   $$('.thumbs img').forEach(t=>t.onclick=()=>{$('#mainProductImage').src=t.dataset.main;$$('.thumbs img').forEach(x=>x.classList.remove('active'));t.classList.add('active')});
 }catch(e){$('#productDetail').innerHTML='<div class="about-card">تعذر تحميل تفاصيل المنتج.</div>'}
}

function showView(id,push=true){
 $$('.view').forEach(v=>v.classList.remove('active'));const el=$('#'+id);if(el)el.classList.add('active');
 if(push&&location.hash!=='#'+id)history.pushState({id},'', '#'+id);
 window.scrollTo({top:0,behavior:'smooth'});closeDrawer()
}
function parseHash(){const h=location.hash.slice(1)||'home';if(h.startsWith('product='))return productDetail(h.split('=')[1]);if(h.startsWith('category=')){const id=h.split('=')[1];const c=state.cats.find(x=>String(x.id)===String(id));return categoryProducts(id,c?.name||'القسم')}showView(h,false)}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2200)}
function closeDrawer(){$('#drawer').classList.remove('open');$('#backdrop').classList.remove('show')}
function openDrawer(){$('#drawer').classList.add('open');$('#backdrop').classList.add('show')}
function addCart(id){const p=state.products.find(x=>String(x.id)===String(id));if(!p){toast('افتح المنتج ثم أضفه للسلة');return}state.cart.push({id:p.id,name:p.name,price:money(p),image:imgOf(p)});localStorage.setItem('bahi_cart',JSON.stringify(state.cart));updateCart();toast('تمت إضافة المنتج إلى السلة')}
function updateCart(){$('#cartCount').textContent=state.cart.length}
function openLightbox(src){if(!src)return;$('#lightboxImg').src=src;$('#lightbox').classList.add('show')}

document.addEventListener('click',e=>{
 const cat=e.target.closest('[data-cat]');if(cat){location.hash=`category=${cat.dataset.cat}`;parseHash();return}
 const prod=e.target.closest('[data-product]');if(prod){location.hash=`product=${prod.dataset.product}`;parseHash();return}
 const add=e.target.closest('[data-add]');if(add){e.stopPropagation();addCart(add.dataset.add)}
 if(e.target.matches('[data-back]'))history.back()
});
$('#menuBtn').onclick=openDrawer;$('#closeMenu').onclick=closeDrawer;$('#backdrop').onclick=closeDrawer;
$('#searchBtn').onclick=()=>$('#searchModal').classList.add('show');$('#closeSearch').onclick=()=>$('#searchModal').classList.remove('show');
$('#modalSearch').oninput=e=>{const q=e.target.value.trim().toLowerCase();const hits=state.products.filter(p=>p.name.toLowerCase().includes(q)).slice(0,10);$('#searchResults').innerHTML=hits.map(productCard).join('')};
$('#loadMore').onclick=()=>loadProducts(false);$('#sortSelect').onchange=e=>{state.sort=e.target.value;loadProducts(true)};$('#searchInput').oninput=e=>{state.query=e.target.value.trim();clearTimeout(window._st);window._st=setTimeout(()=>loadProducts(true),350)};
$('#cartBtn').onclick=()=>toast(`السلة تحتوي على ${state.cart.length} منتج`);
$('#closeLightbox').onclick=()=>$('#lightbox').classList.remove('show');$('#lightbox').onclick=e=>{if(e.target.id==='lightbox')$('#lightbox').classList.remove('show')};
window.addEventListener('hashchange',parseHash);window.addEventListener('popstate',parseHash);

(async function init(){updateCart();parseHash();await loadCats();await loadProducts(true);})();
