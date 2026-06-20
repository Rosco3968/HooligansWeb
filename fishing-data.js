// ===================================================================
// fishing-data.js — fish catalog, rarity tiers, leveling system
// Shared by fishing.js and collection.js
// ===================================================================

// Rarity tiers: weight = how common (higher = more common), xp = level reward
const RARITY = {
  common:    { label:'Common',    color:'#9aa5ad', weight:100, xp:5,  glow:'none' },
  uncommon:  { label:'Uncommon',  color:'#3ee08a', weight:55,  xp:12, glow:'0 0 6px #3ee08a' },
  rare:      { label:'Rare',      color:'#19d3ff', weight:25,  xp:30, glow:'0 0 10px #19d3ff' },
  epic:      { label:'Epic',      color:'#9b30ff', weight:9,   xp:70, glow:'0 0 12px #9b30ff' },
  legendary: { label:'Legendary', color:'#ffd700', weight:2,   xp:200,glow:'0 0 18px #ffd700, 0 0 30px #ff7a00' }
};

// 30 fish across 5 rarities — mix of real + invented species for variety.
const FISH = [
  // COMMON (10)
  { id:'f_bluegill', name:'Bluegill', rarity:'common', icon:'🐟', color:'#6fa8c9', size:'small' },
  { id:'f_perch', name:'Perch', rarity:'common', icon:'🐟', color:'#d6a64a', size:'small' },
  { id:'f_catfish', name:'Catfish', rarity:'common', icon:'🐟', color:'#5a5a4a', size:'med' },
  { id:'f_carp', name:'Common Carp', rarity:'common', icon:'🐟', color:'#a8895a', size:'med' },
  { id:'f_sunfish', name:'Sunfish', rarity:'common', icon:'🐠', color:'#ffb300', size:'small' },
  { id:'f_minnow', name:'Minnow', rarity:'common', icon:'🐟', color:'#bcd', size:'tiny' },
  { id:'f_bass', name:'Largemouth Bass', rarity:'common', icon:'🐟', color:'#3a6b3a', size:'med' },
  { id:'f_trout', name:'Rainbow Trout', rarity:'common', icon:'🐟', color:'#7ec8c0', size:'med' },
  { id:'f_crappie', name:'Crappie', rarity:'common', icon:'🐟', color:'#9fb0bb', size:'small' },
  { id:'f_boot', name:'Old Boot', rarity:'common', icon:'👞', color:'#5a3c28', size:'small', joke:true },
  // UNCOMMON (8)
  { id:'f_pike', name:'Northern Pike', rarity:'uncommon', icon:'🐊', color:'#3f7a4a', size:'large' },
  { id:'f_walleye', name:'Walleye', rarity:'uncommon', icon:'🐟', color:'#c9b870', size:'med' },
  { id:'f_eel', name:'River Eel', rarity:'uncommon', icon:'🐍', color:'#3a3a3a', size:'large' },
  { id:'f_gar', name:'Spotted Gar', rarity:'uncommon', icon:'🐟', color:'#7a8a5a', size:'large' },
  { id:'f_sturgeon', name:'Lake Sturgeon', rarity:'uncommon', icon:'🐟', color:'#6a6a6a', size:'huge' },
  { id:'f_salmon', name:'Sockeye Salmon', rarity:'uncommon', icon:'🐟', color:'#e85a4a', size:'med' },
  { id:'f_puffer', name:'Freshwater Puffer', rarity:'uncommon', icon:'🐡', color:'#e0c060', size:'small' },
  { id:'f_can', name:'Mystery Can', rarity:'uncommon', icon:'🥫', color:'#c0c0c0', size:'tiny', joke:true },
  // RARE (6)
  { id:'f_muskie', name:'Trophy Muskie', rarity:'rare', icon:'🐊', color:'#2a5a3a', size:'huge' },
  { id:'f_koi', name:'Golden Koi', rarity:'rare', icon:'🐠', color:'#ff9a3c', size:'med' },
  { id:'f_glowfish', name:'Glowfin Tetra', rarity:'rare', icon:'🐠', color:'#19d3ff', size:'small' },
  { id:'f_ghostcarp', name:'Ghost Carp', rarity:'rare', icon:'🐟', color:'#dfe8ea', size:'large' },
  { id:'f_octopus', name:'Lake Octopus (??)', rarity:'rare', icon:'🐙', color:'#b03a6a', size:'large', joke:true },
  { id:'f_bootking', name:'King Boot', rarity:'rare', icon:'👑', color:'#6a4a28', size:'med', joke:true },
  // EPIC (4)
  { id:'f_dragonfish', name:'Dragonfish', rarity:'epic', icon:'🐉', color:'#c4161c', size:'huge' },
  { id:'f_kraken_jr', name:'Juvenile Kraken', rarity:'epic', icon:'🦑', color:'#3a1a5a', size:'huge' },
  { id:'f_moonfish', name:'Moonlit Marlin', rarity:'epic', icon:'🐟', color:'#cfd6e0', size:'huge' },
  { id:'f_neonking', name:'Neon Emperor', rarity:'epic', icon:'🐠', color:'#9b30ff', size:'large' },
  // LEGENDARY (2)
  { id:'f_gbdleviathan', name:'The GBD Leviathan', rarity:'legendary', icon:'🐋', color:'#ffd700', size:'colossal' },
  { id:'f_goldenchief', name:'Golden Chief Carp', rarity:'legendary', icon:'🐟', color:'#ffd700', size:'colossal', joke:true }
];

function fishById(id){ return FISH.find(f=>f.id===id); }
function rarityWeightedPick(){
  const pool = [];
  for(const f of FISH){ pool.push({ f, w: RARITY[f.rarity].weight }); }
  const total = pool.reduce((a,b)=>a+b.w,0);
  let r = Math.random()*total;
  for(const p of pool){ if(r<p.w) return p.f; r -= p.w; }
  return pool[0].f;
}

// ---- leveling ----
function levelFromXp(xp){
  // simple curve: level N needs N*60 cumulative xp
  let lvl=1, need=60, total=0;
  while(xp >= total+need){ total+=need; lvl++; need = lvl*60; }
  return { level:lvl, xpIntoLevel: xp-total, xpForNext: need, totalXp:xp };
}

// ---- profile helpers (fishing-specific fields live on the profile) ----
function ensureFishingFields(p){
  if(!p.fishingXp) p.fishingXp = 0;
  if(!p.fishCaught) p.fishCaught = {}; // { fishId: count }
  if(!p.fishCollection) p.fishCollection = []; // unique fish ids ever caught
  return p;
}

async function recordCatch(fishId){
  if(!currentProfile) return null;
  ensureFishingFields(currentProfile);
  currentProfile.fishCaught[fishId] = (currentProfile.fishCaught[fishId]||0)+1;
  const isNew = !currentProfile.fishCollection.includes(fishId);
  if(isNew) currentProfile.fishCollection.push(fishId);
  const fish = fishById(fishId);
  const xpGain = RARITY[fish.rarity].xp;
  const before = levelFromXp(currentProfile.fishingXp);
  currentProfile.fishingXp += xpGain;
  const after = levelFromXp(currentProfile.fishingXp);
  try{ if(typeof persistProfileCoins==='function') await persistProfileCoins();
       else await window.storage.set('userprofile:'+currentUser.uid, JSON.stringify(currentProfile), true); }catch(e){}
  if(typeof checkAchievements==='function'){ try{ await checkAchievements(); }catch(e){} }
  return { fish, xpGain, isNew, leveledUp: after.level > before.level, newLevel: after.level };
}
