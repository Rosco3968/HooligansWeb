// ===================================================================
// pets.js — pet shop (buy a virtual pet) + render the pet on profiles.
// Owned pets stored on profile.pets (array of ids); the active one is
// profile.pet. Pets appear on the profile card.
// ===================================================================

async function buyPet(petId){
  if(!currentUser || !currentProfile){ alert('log in to adopt a pet.'); return; }
  const pet = petById(petId); if(!pet) return;
  if(!currentProfile.pets) currentProfile.pets = [];
  if(currentProfile.pets.includes(petId)){ petMsg('you already own that pet.', true); return; }
  if(getCoins() < pet.cost){ petMsg('not enough coins.', true); return; }

  // limited stock check (shared with shop_stock)
  if(pet.limited){
    let stock = {};
    try{ const s=await window.storage.get('shop_stock', true); stock=s&&s.value?JSON.parse(s.value):{}; }catch(e){}
    const sold = stock['pet:'+petId] || 0;
    if(sold >= pet.limited){ petMsg('SOLD OUT — all adopted!', true); return; }
    stock['pet:'+petId] = sold+1;
    await window.storage.set('shop_stock', JSON.stringify(stock), true);
  }

  await changeCoins(-pet.cost);
  currentProfile.pets.push(petId);
  currentProfile.pet = petId; // auto-equip newest
  try{ if(typeof persistProfileCoins==='function') await persistProfileCoins(); }catch(e){}
  petMsg('ADOPTED: '+pet.name+'!', false);
  if(typeof checkAchievements==='function') await checkAchievements();
  renderPetShop();
}

async function equipPet(petId){
  if(!currentProfile || !(currentProfile.pets||[]).includes(petId)) return;
  currentProfile.pet = (currentProfile.pet===petId ? null : petId);
  try{ if(typeof persistProfileCoins==='function') await persistProfileCoins(); }catch(e){}
  renderPetShop();
}

function petMsg(text, bad){
  const el=document.getElementById('petMsg'); if(!el) return;
  el.textContent=text; el.className='msg '+(bad?'lose':'win');
  setTimeout(()=>{ if(el.textContent===text) el.textContent=''; }, 3500);
}

async function renderPetShop(){
  const wrap=document.getElementById('petGrid'); if(!wrap) return;
  if(!currentUser){ wrap.innerHTML='<div class="need-login">log in to adopt a pet.</div>'; return; }
  let stock={};
  try{ const s=await window.storage.get('shop_stock', true); stock=s&&s.value?JSON.parse(s.value):{}; }catch(e){}
  const owned = currentProfile.pets || [];
  const groups = { basic:'CRITTERS', funny:'ODDBALLS' };
  let html='';
  for(const g of Object.keys(groups)){
    html += `<div class="pet-cat">${groups[g]}</div><div class="pet-row">`;
    PETS.filter(p=>p.kind===g).forEach(pet=>{
      const have=owned.includes(pet.id);
      const equipped=currentProfile.pet===pet.id;
      let soldOut=false, stockLabel='';
      if(pet.limited){ const sold=stock['pet:'+pet.id]||0; soldOut = sold>=pet.limited && !have; stockLabel=`<span class="limited">${Math.max(pet.limited-sold,0)}/${pet.limited} left</span>`; }
      let btn;
      if(have){ btn=`<button class="pet-btn ${equipped?'equipped':''}" onclick="equipPet('${pet.id}')">${equipped?'ON PROFILE ✓':'SET ACTIVE'}</button>`; }
      else if(soldOut){ btn=`<span class="soldout">SOLD OUT</span>`; }
      else{ btn=`<button class="pet-btn" onclick="buyPet('${pet.id}')">${pet.cost} 💰</button>`; }
      html += `<div class="pet-item">
        <div class="pet-art">${pet.svg}</div>
        <div class="pet-name">${escapeHtml(pet.name)}</div>
        <div class="pet-blurb">${escapeHtml(pet.blurb)} ${stockLabel}</div>
        ${btn}
      </div>`;
    });
    html+='</div>';
  }
  wrap.innerHTML=html;
}

// render the equipped pet on a profile card (called from crew.js)
function petBadgeHTML(profile){
  if(!profile || !profile.pet) return '';
  const pet = petById(profile.pet); if(!pet) return '';
  return `<div class="profile-pet" title="${escapeHtml(pet.name)}">
    <div class="pp-art">${pet.svg}</div>
    <div class="pp-name">${escapeHtml(pet.name)}</div>
  </div>`;
}

document.addEventListener('portal-ready', ()=>{ if(document.getElementById('petGrid')) renderPetShop(); });
document.addEventListener('hooligan-auth', ()=>{ if(document.getElementById('petGrid')) renderPetShop(); });
