// ===================================================================
// bigsino-door.js — the secret golden door -> BIGSINO password gate
// A golden 🚪 door sits on the casino page. Click it: it animates open,
// then a flashing black/gold "BIGSINO" popup asks for a 4-digit code (1776).
// Correct code -> sets a flag + grants VIP badge on first entry -> go to bigsino.html
// Chief drops an Independence Day hint instead of ever saying the number.
// ===================================================================

const BIGSINO_CODE = '1776';

function placeBigsinoDoor(){
  if(document.getElementById('bigsinoDoor')) return;
  const door = document.createElement('div');
  door.id = 'bigsinoDoor';
  door.title = '???';
  door.innerHTML = `
    <div class="door-frame">
      <div class="door-panel" id="doorPanel">
        <div class="door-knob"></div>
      </div>
      <div class="door-glow"></div>
    </div>
    <div class="door-label">?</div>`;
  document.body.appendChild(door);
  door.addEventListener('click', openBigsinoDoor);
}

function openBigsinoDoor(){
  const panel = document.getElementById('doorPanel');
  if(panel) panel.classList.add('open');
  playDoorCreak();
  setTimeout(showBigsinoGate, 850);
}

function showBigsinoGate(){
  if(document.getElementById('bigsinoGate')) return;
  const ov = document.createElement('div');
  ov.id = 'bigsinoGate';
  ov.innerHTML = `
    <div class="bg-flash"></div>
    <div class="bg-inner">
      <div class="bg-logo">BIGSINO</div>
      <div class="bg-sub">members only. enter the code.</div>
      <div class="bg-code">
        <input maxlength="1" inputmode="numeric" class="bg-d" data-i="0">
        <input maxlength="1" inputmode="numeric" class="bg-d" data-i="1">
        <input maxlength="1" inputmode="numeric" class="bg-d" data-i="2">
        <input maxlength="1" inputmode="numeric" class="bg-d" data-i="3">
      </div>
      <div class="bg-msg" id="bgMsg"></div>
      <div class="bg-actions">
        <button id="bgCancel">back away</button>
        <button id="bgEnter">ENTER</button>
      </div>
      <div class="bg-hint">stuck? ask Chief about the code.</div>
    </div>`;
  document.body.appendChild(ov);

  const digits = [...ov.querySelectorAll('.bg-d')];
  digits.forEach((d,i)=>{
    d.addEventListener('input', ()=>{ d.value = d.value.replace(/\D/g,''); if(d.value && i<3) digits[i+1].focus(); });
    d.addEventListener('keydown', e=>{ if(e.key==='Backspace' && !d.value && i>0) digits[i-1].focus(); if(e.key==='Enter') tryBigsinoCode(); });
  });
  digits[0].focus();

  ov.querySelector('#bgEnter').addEventListener('click', tryBigsinoCode);
  ov.querySelector('#bgCancel').addEventListener('click', ()=>{ ov.remove(); const p=document.getElementById('doorPanel'); if(p) p.classList.remove('open'); });

  // Chief hint about Independence Day (never says 1776)
  if(typeof chiefSay === 'function'){
    chiefSay("That door? Old as the nation, Spartan. Think the year the Declaration of Independence was signed — freedom's first year.");
  }
}

async function tryBigsinoCode(){
  const ov = document.getElementById('bigsinoGate');
  const digits = [...ov.querySelectorAll('.bg-d')];
  const code = digits.map(d=>d.value).join('');
  const msg = document.getElementById('bgMsg');
  if(code === BIGSINO_CODE){
    msg.textContent = 'WELCOME TO BIGSINO.'; msg.style.color = '#ffd700';
    playBigsinoChime();
    // grant VIP on first entry
    await grantVipBadge();
    setTimeout(()=>{ window.location.href = 'bigsino.html'; }, 900);
  }else{
    msg.textContent = 'WRONG. the door stays shut.'; msg.style.color = '#ff4444';
    ov.querySelector('.bg-inner').classList.add('shake');
    setTimeout(()=> ov.querySelector('.bg-inner').classList.remove('shake'), 500);
    digits.forEach(d=> d.value=''); digits[0].focus();
  }
}

async function grantVipBadge(){
  if(!currentUser || !currentProfile) return;
  if(!currentProfile.inventory) currentProfile.inventory = [];
  if(!currentProfile.vip){
    currentProfile.vip = true;
    if(!currentProfile.inventory.includes('vip_badge')) currentProfile.inventory.push('vip_badge');
    // mark BIGSINO access flag
    currentProfile.bigsinoAccess = true;
    try{ if(typeof persistProfileCoins==='function') await persistProfileCoins();
      else await window.storage.set('userprofile:'+currentUser.uid, JSON.stringify(currentProfile), true);
    }catch(e){ console.error(e); }
  }else{
    currentProfile.bigsinoAccess = true;
    try{ await window.storage.set('userprofile:'+currentUser.uid, JSON.stringify(currentProfile), true); }catch(e){}
  }
}

// ---- tiny code-generated sounds (Web Audio) ----
let _actx = null;
function actx(){ if(!_actx){ try{ _actx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return _actx; }
function tone(freq, dur, type, vol){
  const c = actx(); if(!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type||'sine'; o.frequency.value = freq;
  g.gain.value = vol||0.2;
  o.connect(g); g.connect(c.destination);
  o.start(); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (dur||0.2));
  o.stop(c.currentTime + (dur||0.2));
}
function playDoorCreak(){ const c=actx(); if(!c) return; const o=c.createOscillator(),g=c.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(120,c.currentTime); o.frequency.exponentialRampToValueAtTime(40,c.currentTime+0.7); g.gain.value=0.08; o.connect(g); g.connect(c.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.8); o.stop(c.currentTime+0.8); }
function playBigsinoChime(){ [523,659,784,1047].forEach((f,i)=> setTimeout(()=>tone(f,0.3,'triangle',0.25), i*120)); }

document.addEventListener('portal-ready', () => {
  // only place the door on the casino page
  if(document.getElementById('casinoGames')) placeBigsinoDoor();
});
