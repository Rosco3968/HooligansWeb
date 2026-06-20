// ===================================================================
// shop.js — GBD Coin Shop: badges/titles, profile flair, trophies.
// Items are stored on profile.inventory (array of item ids) and
// profile.equipped (title + flair). Limited items track global stock in
// "shop_stock". Owned items show on profile card, chat, and a flex shelf.
// ===================================================================

const SHOP_ITEMS = [
  // --- TITLES / BADGES (show next to name) ---
  { id:'t_roller', type:'title', name:'☆ HIGH ROLLER ☆', cost:500, cls:'badge-roller', desc:'for the big spenders' },
  { id:'t_legend', type:'title', name:'GBD LEGEND', cost:1500, cls:'badge-legend', desc:'certified menace' },
  { id:'t_degen', type:'title', name:'⚡ DEGEN ⚡', cost:300, cls:'badge-degen', desc:'cannot stop gambling' },
  { id:'t_chief', type:'title', name:'★ SPARTAN ★', cost:800, cls:'badge-chief', desc:'finish the fight' },
  // --- FLAIR (profile + name effects) ---
  { id:'f_gold', type:'flair', name:'Gold Name', cost:400, flair:'gold', desc:'shiny gold name' },
  { id:'f_fire', type:'flair', name:'Flame Border', cost:600, flair:'fire', desc:'flaming profile border' },
  { id:'f_rgb', type:'flair', name:'RGB Name', cost:1000, flair:'rgb', desc:'animated rainbow name' },
  // --- TROPHIES (collectibles on shelf) ---
  { id:'r_skull', type:'trophy', name:'💀 Golden Skull', cost:250, icon:'💀', desc:'a classic' },
  { id:'r_guitar', type:'trophy', name:'🎸 Platinum Axe', cost:350, icon:'🎸', desc:'dad rock approved' },
  { id:'r_board', type:'trophy', name:'🛹 Trophy Deck', cost:300, icon:'🛹', desc:'never been ridden' },
  { id:'r_crown', type:'trophy', name:'👑 GBD Crown', cost:1200, icon:'👑', desc:'rules the portal' },
  // --- LIMITED / ONE-TIME (rare, global stock) ---
  { id:'l_founder', type:'trophy', name:'🏆 FOUNDER #', cost:2000, icon:'🏆', desc:'only 5 ever', limited:5 },
  { id:'l_diamond', type:'flair', name:'💎 Diamond Aura', cost:5000, flair:'diamond', desc:'only 1 ever. the ultimate flex.', limited:1 }
];

function getItem(id){ return SHOP_ITEMS.find(i=>i.id===id); }

// --- buy ---
async function buyItem(itemId){
  if(!currentUser || !currentProfile){ alert('log in to shop.'); return; }
  const item = getItem(itemId); if(!item) return;
  if(!currentProfile.inventory) currentProfile.inventory = [];
  if(currentProfile.inventory.includes(itemId)){ shopMsg('you already own that.', true); return; }
  if(getCoins() < item.cost){ shopMsg('not enough coins.', true); return; }

  // limited stock check
  if(item.limited){
    const stockRes = await window.storage.get('shop_stock', true);
    const stock = stockRes && stockRes.value ? JSON.parse(stockRes.value) : {};
    const sold = stock[itemId] || 0;
    if(sold >= item.limited){ shopMsg('SOLD OUT — that one\'s gone forever.', true); return; }
    stock[itemId] = sold + 1;
    await window.storage.set('shop_stock', JSON.stringify(stock), true);
    // founder gets a number
    if(item.id==='l_founder'){ currentProfile.founderNum = stock[itemId]; }
  }

  await changeCoins(-item.cost);
  currentProfile.inventory.push(itemId);
  // auto-equip titles/flair on first buy
  if(item.type==='title') currentProfile.equippedTitle = itemId;
  if(item.type==='flair') currentProfile.equippedFlair = itemId;
  await persistProfileCoins(); // also saves profile + leaderboard
  shopMsg('GOT IT! '+item.name, false);
  renderShop();
  renderFlexShelf();
}

// --- equip (switch active title/flair among owned) ---
async function equipItem(itemId){
  const item = getItem(itemId); if(!item || !currentProfile) return;
  if(!(currentProfile.inventory||[]).includes(itemId)) return;
  if(item.type==='title') currentProfile.equippedTitle = (currentProfile.equippedTitle===itemId? null : itemId);
  if(item.type==='flair') currentProfile.equippedFlair = (currentProfile.equippedFlair===itemId? null : itemId);
  await persistProfileCoins();
  renderShop(); renderFlexShelf();
}

function shopMsg(text, bad){
  const el = document.getElementById('shopMsg'); if(!el) return;
  el.textContent = text; el.className = 'msg ' + (bad?'lose':'win');
  setTimeout(()=>{ if(el.textContent===text) el.textContent=''; }, 3500);
}

// --- render the shop catalog ---
async function renderShop(){
  const wrap = document.getElementById('shopGrid'); if(!wrap) return;
  if(!currentUser){ wrap.innerHTML='<div class="need-login">log in to browse the shop.</div>'; return; }
  // get limited stock
  let stock = {};
  try{ const s = await window.storage.get('shop_stock', true); stock = s&&s.value?JSON.parse(s.value):{}; }catch(e){}
  const inv = currentProfile.inventory || [];
  const groups = { title:'TITLES & BADGES', flair:'PROFILE FLAIR', trophy:'TROPHIES' };
  let html = '';
  for(const g of Object.keys(groups)){
    html += `<div class="shop-cat">${groups[g]}</div><div class="shop-row">`;
    SHOP_ITEMS.filter(i=>i.type===g).forEach(item=>{
      const owned = inv.includes(item.id);
      const equipped = (currentProfile.equippedTitle===item.id) || (currentProfile.equippedFlair===item.id);
      let soldOut=false, stockLabel='';
      if(item.limited){ const sold=stock[item.id]||0; soldOut = sold>=item.limited && !owned; stockLabel = `<span class="limited">${Math.max(item.limited-sold,0)}/${item.limited} left</span>`; }
      let btn;
      if(owned){
        btn = (item.type==='trophy') ? `<span class="owned-tag">OWNED</span>`
            : `<button class="shop-btn ${equipped?'equipped':''}" onclick="equipItem('${item.id}')">${equipped?'EQUIPPED ✓':'EQUIP'}</button>`;
      }else if(soldOut){ btn = `<span class="soldout">SOLD OUT</span>`; }
      else{ btn = `<button class="shop-btn" onclick="buyItem('${item.id}')">${item.cost} 💰</button>`; }
      html += `<div class="shop-item ${item.cls||''}">
        <div class="si-name">${item.type==='trophy'?item.icon+' ':''}${escapeHtml(item.name)}</div>
        <div class="si-desc">${escapeHtml(item.desc)} ${stockLabel}</div>
        ${btn}
      </div>`;
    });
    html += '</div>';
  }
  wrap.innerHTML = html;
}

// --- flex shelf: show YOUR owned trophies/titles ---
function renderFlexShelf(){
  const shelf = document.getElementById('flexShelf'); if(!shelf || !currentProfile) return;
  const inv = currentProfile.inventory || [];
  if(!inv.length){ shelf.innerHTML='<div style="color:var(--steel-dim);font-size:11px;">nothing yet — buy something to show off.</div>'; return; }
  shelf.innerHTML = inv.map(id=>{ const it=getItem(id); if(!it) return ''; 
    const label = it.type==='trophy' ? `${it.icon}` : (it.type==='title'? '🎖️' : '✨');
    return `<span class="flex-item" title="${escapeHtml(it.name)}">${label}<span class="flex-tip">${escapeHtml(it.name)}</span></span>`;
  }).join('');
}

// --- helper used by other pages to render someone's title+flair next to their name ---
function titleBadgeHTML(profile){
  if(!profile || !profile.equippedTitle) return '';
  const it = getItem(profile.equippedTitle); if(!it) return '';
  let label = it.name;
  if(it.id==='l_founder' && profile.founderNum) label = `🏆 FOUNDER #${profile.founderNum}`;
  return `<span class="name-badge ${it.cls||''}">${escapeHtml(label)}</span>`;
}
function flairClass(profile){
  if(!profile || !profile.equippedFlair) return '';
  const it = getItem(profile.equippedFlair); if(!it) return '';
  return 'flair-'+it.flair;
}

document.addEventListener('portal-ready', () => { if(document.getElementById('shopGrid')){ renderShop(); renderFlexShelf(); } });
document.addEventListener('hooligan-auth', () => { if(document.getElementById('shopGrid')){ renderShop(); renderFlexShelf(); } });
