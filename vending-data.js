// ===================================================================
// vending-data.js — vending machine items (absurd junk) + collection
// ===================================================================

const VENDING_ITEMS = [
  // common junk
  { id:'v_sock', name:'Single Wet Sock', rarity:'common', icon:'🧦', color:'#9aa5ad' },
  { id:'v_gum', name:'Chewed Gum', rarity:'common', icon:'🍬', color:'#e890b0' },
  { id:'v_battery', name:'Dead Battery', rarity:'common', icon:'🔋', color:'#5a5a5a' },
  { id:'v_napkin', name:'Used Napkin', rarity:'common', icon:'🧻', color:'#e8e8e8' },
  { id:'v_paperclip', name:'Bent Paperclip', rarity:'common', icon:'📎', color:'#cfd6e0' },
  { id:'v_ticket', name:'Expired Parking Ticket', rarity:'common', icon:'🎫', color:'#f0d060' },
  { id:'v_rock', name:'Mystery Rock', rarity:'common', icon:'🪨', color:'#7a7a7a' },
  // uncommon
  { id:'v_spork', name:'Lone Spork', rarity:'uncommon', icon:'🥄', color:'#cfd6e0' },
  { id:'v_mixtape', name:'Unlabeled Mixtape', rarity:'uncommon', icon:'📼', color:'#3a3a3a' },
  { id:'v_troll', name:'Troll Doll', rarity:'uncommon', icon:'🧌', color:'#9b30ff' },
  { id:'v_keytar', name:'Tiny Keytar', rarity:'uncommon', icon:'🎹', color:'#e8484a' },
  { id:'v_hotsauce', name:'Suspicious Hot Sauce', rarity:'uncommon', icon:'🌶️', color:'#c4161c' },
  // rare
  { id:'v_trophy', name:'Participation Trophy', rarity:'rare', icon:'🏆', color:'#ffd700' },
  { id:'v_disco', name:'Mini Disco Ball', rarity:'rare', icon:'🪩', color:'#cfd6e0' },
  { id:'v_lava', name:'Lava Lamp', rarity:'rare', icon:'🪔', color:'#ff7a3c' },
  // epic
  { id:'v_garden', name:'Garden Gnome', rarity:'epic', icon:'🧙', color:'#3ee08a' },
  { id:'v_boombox', name:'Working Boombox', rarity:'epic', icon:'📻', color:'#9b30ff' },
  // legendary
  { id:'v_goldgnome', name:'Solid Gold Gnome', rarity:'legendary', icon:'🧙', color:'#ffd700' }
];

const VENDING_COST = 15;

function vendItemById(id){ return VENDING_ITEMS.find(i=>i.id===id); }
function vendWeightedPick(){
  const W = (typeof RARITY!=='undefined') ? RARITY : { common:{weight:100},uncommon:{weight:55},rare:{weight:25},epic:{weight:9},legendary:{weight:2} };
  const pool = VENDING_ITEMS.map(i=>({i, w:W[i.rarity].weight}));
  const total = pool.reduce((a,b)=>a+b.w,0);
  let r=Math.random()*total;
  for(const x of pool){ if(r<x.w) return x.i; r-=x.w; }
  return pool[0].i;
}

function ensureVendFields(p){
  if(!p.vendCollection) p.vendCollection=[];
  if(!p.vendCounts) p.vendCounts={};
  return p;
}
async function recordVendItem(itemId){
  if(!currentProfile) return null;
  ensureVendFields(currentProfile);
  currentProfile.vendCounts[itemId]=(currentProfile.vendCounts[itemId]||0)+1;
  const isNew=!currentProfile.vendCollection.includes(itemId);
  if(isNew) currentProfile.vendCollection.push(itemId);
  try{ if(typeof persistProfileCoins==='function') await persistProfileCoins();
       else await window.storage.set('userprofile:'+currentUser.uid, JSON.stringify(currentProfile), true); }catch(e){}
  return { item: vendItemById(itemId), isNew };
}
