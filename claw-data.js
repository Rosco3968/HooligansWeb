// ===================================================================
// claw-data.js — claw machine prize catalog + collection helpers
// ===================================================================

const CLAW_PRIZES = [
  // common plushies
  { id:'cl_bear', name:'Teddy Bear', rarity:'common', icon:'🧸', color:'#b9763a' },
  { id:'cl_bunny', name:'Plush Bunny', rarity:'common', icon:'🐰', color:'#e8d8e0' },
  { id:'cl_duck', name:'Rubber Duck', rarity:'common', icon:'🦆', color:'#ffd83c' },
  { id:'cl_ball', name:'Bouncy Ball', rarity:'common', icon:'🔴', color:'#e8484a' },
  { id:'cl_star', name:'Foam Star', rarity:'common', icon:'⭐', color:'#ffd700' },
  // uncommon
  { id:'cl_robot', name:'Tin Robot', rarity:'uncommon', icon:'🤖', color:'#9aa5ad' },
  { id:'cl_cat', name:'Lucky Cat', rarity:'uncommon', icon:'🐱', color:'#f0c060' },
  { id:'cl_8ball', name:'Magic 8-Ball', rarity:'uncommon', icon:'🎱', color:'#1a1a1a' },
  { id:'cl_dino', name:'Plush Dino', rarity:'uncommon', icon:'🦖', color:'#3ee08a' },
  // rare
  { id:'cl_unicorn', name:'Sparkle Unicorn', rarity:'rare', icon:'🦄', color:'#e89ad8' },
  { id:'cl_console', name:'Mini Console', rarity:'rare', icon:'🎮', color:'#5a5aff' },
  { id:'cl_crown', name:'Toy Crown', rarity:'rare', icon:'👑', color:'#ffd700' },
  // epic
  { id:'cl_dragon', name:'Plush Dragon', rarity:'epic', icon:'🐉', color:'#c4161c' },
  { id:'cl_ufo', name:'UFO Toy', rarity:'epic', icon:'🛸', color:'#9b30ff' },
  // legendary
  { id:'cl_goldbear', name:'Solid Gold Bear', rarity:'legendary', icon:'🧸', color:'#ffd700' }
];

function clawPrizeById(id){ return CLAW_PRIZES.find(p=>p.id===id); }
function clawWeightedPick(){
  // reuse RARITY weights from fishing-data.js if present, else simple
  const W = (typeof RARITY!=='undefined') ? RARITY : { common:{weight:100},uncommon:{weight:55},rare:{weight:25},epic:{weight:9},legendary:{weight:2} };
  const pool = CLAW_PRIZES.map(p=>({p, w:W[p.rarity].weight}));
  const total = pool.reduce((a,b)=>a+b.w,0);
  let r=Math.random()*total;
  for(const x of pool){ if(r<x.w) return x.p; r-=x.w; }
  return pool[0].p;
}

function ensureClawFields(p){
  if(!p.clawCollection) p.clawCollection = [];
  if(!p.clawCounts) p.clawCounts = {};
  return p;
}
async function recordClawPrize(prizeId){
  if(!currentProfile) return null;
  ensureClawFields(currentProfile);
  currentProfile.clawCounts[prizeId] = (currentProfile.clawCounts[prizeId]||0)+1;
  const isNew = !currentProfile.clawCollection.includes(prizeId);
  if(isNew) currentProfile.clawCollection.push(prizeId);
  try{ if(typeof persistProfileCoins==='function') await persistProfileCoins();
       else await window.storage.set('userprofile:'+currentUser.uid, JSON.stringify(currentProfile), true); }catch(e){}
  return { prize: clawPrizeById(prizeId), isNew };
}
