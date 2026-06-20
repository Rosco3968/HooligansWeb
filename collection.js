// ===================================================================
// collection.js — the Hooligan Almanac (sticker-book of catches/prizes)
// Fish page is live now. Claw/vending pages are placeholders until
// those phases are built, but the structure is ready for them.
// ===================================================================

function bTab(p){
  document.querySelectorAll('.btab').forEach(b=>b.classList.toggle('on', b.dataset.p===p));
  document.querySelectorAll('.page').forEach(pg=>pg.classList.toggle('on', pg.id==='page-'+p));
}

document.addEventListener('portal-ready', renderFishPage);
document.addEventListener('hooligan-auth', renderFishPage);

function renderFishPage(){
  bTab('fish');
  const grid = document.getElementById('fishGrid');
  const summary = document.getElementById('fishSummary');
  if(!grid) return;
  const have = (currentProfile && currentProfile.fishCollection) || [];
  const caughtCounts = (currentProfile && currentProfile.fishCaught) || {};

  grid.innerHTML = FISH.map(f=>{
    const got = have.includes(f.id);
    const r = RARITY[f.rarity];
    if(!got){
      return `<div class="entry locked"><div class="ei">❔</div><div class="en">???</div><div class="er" style="color:#4a3a2a;">${r.label}</div></div>`;
    }
    return `<div class="entry"><div class="ei" style="text-shadow:${r.glow};">${f.icon}</div><div class="en">${escapeHtml(f.name)}</div><div class="er" style="color:${r.color};">${r.label}</div><div class="ec">caught ×${caughtCounts[f.id]||1}</div></div>`;
  }).join('');

  summary.textContent = `${have.length} / ${FISH.length} species discovered`;

  // claw prizes page
  const clawGrid=document.getElementById('clawGrid');
  if(clawGrid){
    if(typeof CLAW_PRIZES==='undefined'){ clawGrid.innerHTML='<div style="grid-column:1/-1;text-align:center;color:#9a8060;padding:20px;font-size:12px;">claw prizes loading...</div>'; }
    else {
      const have=(currentProfile&&currentProfile.clawCollection)||[];
      const counts=(currentProfile&&currentProfile.clawCounts)||{};
      clawGrid.innerHTML = CLAW_PRIZES.map(pr=>{
        const got=have.includes(pr.id); const r=RARITY[pr.rarity];
        if(!got) return `<div class="entry locked"><div class="ei">❔</div><div class="en">???</div><div class="er" style="color:#4a3a2a;">${r.label}</div></div>`;
        return `<div class="entry"><div class="ei" style="text-shadow:${r.glow};">${pr.icon}</div><div class="en">${escapeHtml(pr.name)}</div><div class="er" style="color:${r.color};">${r.label}</div><div class="ec">won ×${counts[pr.id]||1}</div></div>`;
      }).join('');
      document.getElementById('clawSummary').textContent = `${have.length} / ${CLAW_PRIZES.length} prizes won`;
    }
  }
  const vendGrid=document.getElementById('vendingGrid');
  if(vendGrid){
    if(typeof VENDING_ITEMS==='undefined'){ vendGrid.innerHTML='<div style="grid-column:1/-1;text-align:center;color:#9a8060;padding:20px;font-size:12px;">vending items loading...</div>'; }
    else {
      const have=(currentProfile&&currentProfile.vendCollection)||[];
      const counts=(currentProfile&&currentProfile.vendCounts)||{};
      vendGrid.innerHTML = VENDING_ITEMS.map(it=>{
        const got=have.includes(it.id); const r=RARITY[it.rarity];
        if(!got) return `<div class="entry locked"><div class="ei">❔</div><div class="en">???</div><div class="er" style="color:#4a3a2a;">${r.label}</div></div>`;
        return `<div class="entry"><div class="ei" style="text-shadow:${r.glow};">${it.icon}</div><div class="en">${escapeHtml(it.name)}</div><div class="er" style="color:${r.color};">${r.label}</div><div class="ec">got ×${counts[it.id]||1}</div></div>`;
      }).join('');
      document.getElementById('vendingSummary').textContent = `${have.length} / ${VENDING_ITEMS.length} junk items collected`;
    }
  }
}
