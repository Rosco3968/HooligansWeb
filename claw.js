// ===================================================================
// claw.js — claw machine game
// Joystick moves claw horizontally over a prize pile; drop grabs.
// Rarer prizes have a higher slip chance, so they're harder to win.
// 5 GBD per grab. Wins go into the collection (CLAW PRIZES tab).
// ===================================================================

const CLAW_COST = 5;
let ctx, CW, CH;
let clawX = 250, clawY = 40, clawTargetX = 250;
let prizes = [];
let state = 'idle'; // idle | dropping | grabbing | lifting | done
let heldPrize = null, grabbedPrize = null;
let musicOn = false;

function gateClaw(){
  const login=document.getElementById('clawLogin'), game=document.getElementById('clawGame');
  if(!login) return;
  if(currentUser){ login.style.display='none'; game.style.display='block'; if(!ctx) initClaw(); }
  else { login.style.display='block'; game.style.display='none'; }
}
document.addEventListener('hooligan-auth', gateClaw);
document.addEventListener('portal-ready', ()=>{
  gateClaw();
  document.getElementById('muteBtn').addEventListener('click', toggleMute);
  bindJoystick();
  document.getElementById('grabBtn').addEventListener('click', dropClaw);
});

function toggleMute(){ if(!window.FishMusic) return; const m=FishMusic.toggleMute(); document.getElementById('muteBtn').textContent = m?'🔇 MUSIC OFF':'🔊 MUSIC ON'; }

function initClaw(){
  const c=document.getElementById('clawCanvas'); if(!c) return;
  ctx=c.getContext('2d'); CW=c.width; CH=c.height;
  if(!musicOn){ musicOn=true; if(window.FishMusic) FishMusic.start(); }
  spawnPrizes();
  requestAnimationFrame(loop);
}
function spawnPrizes(){
  prizes=[];
  const n=10;
  for(let i=0;i<n;i++){
    const p = clawWeightedPick();
    prizes.push({ p, x: 50+Math.random()*(CW-100), y: CH-40-Math.random()*30, grabbed:false });
  }
}

function bindJoystick(){
  const moveLeft=()=>{ clawTargetX=Math.max(30, clawTargetX-30); };
  const moveRight=()=>{ clawTargetX=Math.min(CW-30, clawTargetX+30); };
  document.getElementById('joyLeft').addEventListener('click', ()=>{ if(state==='idle') moveLeft(); });
  document.getElementById('joyRight').addEventListener('click', ()=>{ if(state==='idle') moveRight(); });
  // up/down are flavor (claw is overhead) — nudge target too for feel
  document.getElementById('joyUp').addEventListener('click', ()=>{ if(state==='idle') moveLeft(); });
  document.getElementById('joyDown').addEventListener('click', ()=>{ if(state==='idle') moveRight(); });
  // keyboard
  window.addEventListener('keydown', e=>{ if(state!=='idle') return; if(e.key==='ArrowLeft') moveLeft(); if(e.key==='ArrowRight') moveRight(); if(e.key===' '){ e.preventDefault(); dropClaw(); } });
}

async function dropClaw(){
  if(state!=='idle') return;
  if(getCoins() < CLAW_COST){ clawMsg('need 5 GBD to play', 'lose'); return; }
  if(!(await changeCoins(-CLAW_COST))){ clawMsg('need 5 GBD', 'lose'); return; }
  if(typeof loadCoinLeaderboard==='function') {}
  renderCoinHudLocal();
  state='dropping'; clawY=40;
  document.getElementById('grabBtn').disabled=true;
  clawMsg('dropping...');
  if(window.SFXFish) SFXFish.reelStart();
}

function renderCoinHudLocal(){ const el=document.getElementById('coinHud'); if(el) el.textContent='💰 '+getCoins()+' GBD'; }

function loop(){
  // claw horizontal ease
  clawX += (clawTargetX-clawX)*0.2;

  if(state==='dropping'){
    clawY += 6;
    if(clawY >= CH-58){ clawY=CH-58; tryGrab(); }
  } else if(state==='lifting'){
    clawY -= 5;
    if(heldPrize){ heldPrize.x = clawX; heldPrize.y = clawY+30; }
    if(clawY<=40){ clawY=40; finishGrab(); }
  }
  draw();
  requestAnimationFrame(loop);
}

function tryGrab(){
  state='grabbing';
  // find nearest prize under the claw
  let nearest=null, nd=9999;
  for(const pr of prizes){ if(pr.grabbed) continue; const d=Math.abs(pr.x-clawX); if(d<nd){ nd=d; nearest=pr; } }
  if(window.SFXFish) SFXFish.splash();
  setTimeout(()=>{
    if(nearest && nd < 34){
      // slip chance scales with rarity weight (rarer = lower weight = higher slip)
      const w = (typeof RARITY!=='undefined') ? RARITY[nearest.p.rarity].weight : 50;
      const slipChance = Math.min(0.85, 1 - (w/120)); // common ~0.17, legendary ~0.83
      if(Math.random() > slipChance){
        nearest.grabbed=true; heldPrize=nearest; grabbedPrize=nearest.p;
      } else {
        grabbedPrize=null; heldPrize=null; clawMsg('so close! it slipped...', 'lose');
      }
    } else {
      grabbedPrize=null; heldPrize=null; clawMsg('grabbed nothing but air', 'lose');
    }
    state='lifting';
  }, 500);
}

async function finishGrab(){
  state='done';
  const won = grabbedPrize; // capture before we null the globals
  if(won){
    const res = await recordClawPrize(won.id);
    clawMsg(`WON: ${won.name}!`, 'win');
    if(window.SFXFish) SFXFish.catchFish((typeof RARITY!=='undefined'&&RARITY[won.rarity].weight<10));
    if(res && res.isNew){ setTimeout(()=> clawMsg(`✨ NEW: ${won.name} added to your Collection!`, 'win'), 1500); }
    // remove from pile
    prizes = prizes.filter(x=> !(x.grabbed && x.p===won));
  }
  grabbedPrize=null; heldPrize=null;
  setTimeout(()=>{
    if(prizes.filter(p=>!p.grabbed).length < 6) spawnPrizes();
    state='idle';
    document.getElementById('grabBtn').disabled=false;
    if(!document.getElementById('clawMsg').classList.contains('win')) clawMsg('line up the claw and drop it');
  }, 1800);
}

function draw(){
  ctx.clearRect(0,0,CW,CH);
  // glass reflection
  ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(0,0,CW,CH);
  // prize chute (bottom-left)
  ctx.fillStyle='#0a0612'; ctx.fillRect(0,CH-20,80,20);
  ctx.fillStyle='#ff2da0'; ctx.font='9px Verdana'; ctx.fillText('PRIZE', 18, CH-7);
  // prize pile
  for(const pr of prizes){
    if(pr.grabbed && pr!==heldPrize) continue;
    ctx.save(); ctx.translate(pr.x, pr.y);
    const glow = (typeof RARITY!=='undefined') ? RARITY[pr.p.rarity].glow : 'none';
    if(glow && glow!=='none'){ ctx.shadowColor=RARITY[pr.p.rarity].color; ctx.shadowBlur=12; }
    ctx.font='28px serif'; ctx.textAlign='center'; ctx.fillText(pr.p.icon, 0, 0);
    ctx.restore();
  }
  // rail
  ctx.fillStyle='#3a2030'; ctx.fillRect(0,16,CW,6);
  // claw cable
  ctx.strokeStyle='#888'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(clawX,22); ctx.lineTo(clawX,clawY); ctx.stroke();
  // claw head
  ctx.fillStyle='#ccc'; ctx.fillRect(clawX-12,clawY-10,24,10);
  // claw prongs
  ctx.strokeStyle='#ddd'; ctx.lineWidth=3; ctx.lineCap='round';
  const open = (state==='idle'||state==='dropping')? 10 : 4;
  ctx.beginPath(); ctx.moveTo(clawX-8,clawY); ctx.lineTo(clawX-open,clawY+16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(clawX+8,clawY); ctx.lineTo(clawX+open,clawY+16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(clawX,clawY); ctx.lineTo(clawX,clawY+18); ctx.stroke();
}

function clawMsg(t,cls){ const m=document.getElementById('clawMsg'); if(m){ m.textContent=t; m.className='clawmsg '+(cls||''); } }

// keep coin HUD synced
document.addEventListener('hooligan-auth', ()=>{ const el=document.getElementById('coinHud'); if(el && currentUser) el.textContent='💰 '+getCoins()+' GBD'; });
