// ===================================================================
// fishing.js — intro screen art + first-person fishing minigame loop
// Phases: CAST (tap to cast) -> BITE (timing minigame) -> REEL (tension minigame) -> CATCH
// ===================================================================

let introCtx, gameCtx, IW, IH, GW, GH;
let phase = 'idle'; // idle | casting | waiting | bite | reel | done
let currentFish = null;
let musicStarted = false;

document.addEventListener('portal-ready', () => {
  setupIntro();
  setupGame();
  document.getElementById('introScreen').addEventListener('click', enterGame);
  document.getElementById('muteBtn').addEventListener('click', toggleMute);
  document.getElementById('castBtn').addEventListener('click', castLine);
  document.getElementById('catchContinue').addEventListener('click', resetToIdle);
  updateProgressUI();
});
document.addEventListener('hooligan-auth', updateProgressUI);

function updateProgressUI(){
  if(!currentProfile){ return; }
  if(typeof ensureFishingFields==='function') ensureFishingFields(currentProfile);
  const lvl = levelFromXp(currentProfile.fishingXp||0);
  document.getElementById('lvlPill').textContent = `Lv.${lvl.level} Angler`;
  document.getElementById('hudLevel').textContent = `Lv.${lvl.level}`;
  document.getElementById('xpLabel').textContent = `${lvl.xpIntoLevel} / ${lvl.xpForNext} XP`;
  document.getElementById('xpFill').style.width = Math.min(100,(lvl.xpIntoLevel/lvl.xpForNext)*100)+'%';
  const collected = (currentProfile.fishCollection||[]).length;
  document.getElementById('collectedLabel').textContent = `${collected} / ${FISH.length} species`;
}

// ===================================================================
// INTRO SCREEN — pixel boat on a lake at sunset
// ===================================================================
function setupIntro(){
  const c=document.getElementById('introCanvas'); introCtx=c.getContext('2d'); IW=c.width; IH=c.height;
  drawIntroScene();
}
function drawIntroScene(){
  const ctx=introCtx;
  // sunset sky gradient
  const sky=ctx.createLinearGradient(0,0,0,IH*0.62);
  sky.addColorStop(0,'#2b1b4a'); sky.addColorStop(0.4,'#7a3a5a'); sky.addColorStop(0.75,'#e8794a'); sky.addColorStop(1,'#ffd27a');
  ctx.fillStyle=sky; ctx.fillRect(0,0,IW,IH*0.62);
  // sun
  ctx.beginPath(); ctx.arc(IW*0.5, IH*0.56, 60, 0, Math.PI*2);
  const sun=ctx.createRadialGradient(IW*0.5,IH*0.56,0,IW*0.5,IH*0.56,60);
  sun.addColorStop(0,'#fff3c0'); sun.addColorStop(1,'#ff9a3c'); ctx.fillStyle=sun; ctx.fill();
  // pixel clouds
  ctx.fillStyle='rgba(255,210,170,0.5)';
  for(const [x,y,w] of [[120,90,70],[600,60,90],[300,140,50],[680,180,60]]){ pixelBlob(ctx,x,y,w,18); }
  // distant mountains (pixel silhouettes)
  ctx.fillStyle='#3a2a4a';
  pixelMountain(ctx, 0, IH*0.5, IW, 70, 7);
  // water
  const water=ctx.createLinearGradient(0,IH*0.62,0,IH);
  water.addColorStop(0,'#ff9a5a'); water.addColorStop(0.15,'#7a4a6a'); water.addColorStop(1,'#0c1a2a');
  ctx.fillStyle=water; ctx.fillRect(0,IH*0.62,IW,IH*0.38);
  // sun reflection
  ctx.fillStyle='rgba(255,180,90,0.35)';
  for(let i=0;i<6;i++){ const yy=IH*0.64+i*12; const ww=70-i*9; ctx.fillRect(IW*0.5-ww/2, yy, ww, 5); }
  // water ripples
  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=2;
  for(let i=0;i<10;i++){ const y=IH*0.7+i*18; ctx.beginPath(); ctx.moveTo(0,y); for(let x=0;x<IW;x+=20){ ctx.lineTo(x, y+Math.sin(x*0.05+i)*3); } ctx.stroke(); }
  // pixel boat silhouette, detailed
  drawPixelBoat(ctx, IW*0.5, IH*0.78, 1.0);
  // birds
  ctx.strokeStyle='#2a1a3a'; ctx.lineWidth=2;
  for(const [x,y] of [[150,120],[180,110],[610,90]]){ ctx.beginPath(); ctx.moveTo(x-8,y); ctx.lineTo(x,y-6); ctx.lineTo(x+8,y); ctx.stroke(); }
}
function pixelBlob(ctx,x,y,w,h){
  const px=8;
  for(let i=0;i<w;i+=px) for(let j=0;j<h;j+=px){
    if(Math.random()>0.3) ctx.fillRect(x+i-w/2, y+j-h/2, px, px);
  }
}
function pixelMountain(ctx,x,y,w,h,peaks){
  const step=w/peaks;
  ctx.beginPath(); ctx.moveTo(x,y+h);
  for(let i=0;i<=peaks;i++){ const px=x+i*step; const py=y + (i%2===0? 0 : h*0.4); ctx.lineTo(px,py); }
  ctx.lineTo(x+w,y+h); ctx.closePath(); ctx.fill();
}
function drawPixelBoat(ctx, cx, cy, scale){
  ctx.save(); ctx.translate(cx,cy); ctx.scale(scale,scale);
  // hull
  ctx.fillStyle='#1a1015';
  ctx.beginPath();
  ctx.moveTo(-70,0); ctx.lineTo(70,0); ctx.lineTo(55,16); ctx.lineTo(-55,16); ctx.closePath(); ctx.fill();
  // hull highlight rim
  ctx.fillStyle='#3a2a30'; ctx.fillRect(-70,-3,140,4);
  // cabin
  ctx.fillStyle='#241620'; ctx.fillRect(-22,-26,44,24);
  ctx.fillStyle='#0c0a10'; ctx.fillRect(-16,-20,12,10); ctx.fillRect(4,-20,12,10); // windows
  // mast + line
  ctx.strokeStyle='#1a1015'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(40,-26); ctx.lineTo(40,-58); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40,-58); ctx.lineTo(64,-2); ctx.stroke(); // fishing line out to a bobber
  // bobber
  ctx.fillStyle='#c4161c'; ctx.beginPath(); ctx.arc(64,-2,3,0,Math.PI*2); ctx.fill();
  // figure (simple angler silhouette)
  ctx.fillStyle='#1a1015';
  ctx.fillRect(14,-34,10,14); // body
  ctx.beginPath(); ctx.arc(19,-38,6,0,Math.PI*2); ctx.fill(); // head
  ctx.restore();
}

function enterGame(){
  document.getElementById('introScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  if(!musicStarted){ musicStarted=true; if(window.FishMusic) FishMusic.start(); }
  resetToIdle();
}
function toggleMute(){
  if(!window.FishMusic) return;
  const muted = FishMusic.toggleMute();
  document.getElementById('muteBtn').textContent = muted? '🔇 MUSIC OFF':'🔊 MUSIC ON';
}

// ===================================================================
// GAME SCENE — first-person POV of water, rod tip visible
// ===================================================================
function setupGame(){
  const c=document.getElementById('fishCanvas'); gameCtx=c.getContext('2d'); GW=c.width; GH=c.height;
  drawGameScene(0);
}
let sceneT=0;
function drawGameScene(lineOutPct){
  const ctx=gameCtx;
  // sky/water matching intro mood but simpler (first-person, looking out over water)
  const sky=ctx.createLinearGradient(0,0,0,GH*0.45);
  sky.addColorStop(0,'#2b3a5a'); sky.addColorStop(1,'#5a6a8a'); ctx.fillStyle=sky; ctx.fillRect(0,0,GW,GH*0.45);
  const water=ctx.createLinearGradient(0,GH*0.45,0,GH);
  water.addColorStop(0,'#3a5a6a'); water.addColorStop(1,'#0a1a2a'); ctx.fillStyle=water; ctx.fillRect(0,GH*0.45,GW,GH*0.55);
  // ripples
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=2;
  for(let i=0;i<8;i++){ const y=GH*0.5+i*22; ctx.beginPath(); ctx.moveTo(0,y); for(let x=0;x<GW;x+=24){ ctx.lineTo(x,y+Math.sin(x*0.04+sceneT*0.02+i)*4); } ctx.stroke(); }
  // rod silhouette from bottom-right (first person)
  ctx.strokeStyle='#1a1015'; ctx.lineWidth=10; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(GW-20,GH+30); ctx.lineTo(GW*0.62, GH*0.38); ctx.stroke();
  // fishing line out to a bobber, length grows with lineOutPct
  const tipX=GW*0.62, tipY=GH*0.38;
  const bobX = tipX - (tipX-GW*0.42)*lineOutPct;
  const bobY = tipY + (GH*0.66-tipY)*lineOutPct;
  ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(tipX,tipY); ctx.lineTo(bobX,bobY); ctx.stroke();
  if(lineOutPct>0.05){
    ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.arc(bobX,bobY,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#c4161c'; ctx.beginPath(); ctx.arc(bobX,bobY-4,4,0,Math.PI*2); ctx.fill();
  }
  sceneT++;
}

function resetToIdle(){
  phase='idle'; currentFish=null;
  document.getElementById('castBtn').style.display='inline-block';
  document.getElementById('biteBar').style.display='none';
  document.getElementById('reelWrap').style.display='none';
  document.getElementById('tensionWrap').style.display='none';
  document.getElementById('catchCard').style.display='none';
  document.getElementById('promptBar').textContent='';
  document.getElementById('rodLine').textContent='ready';
  drawGameScene(0);
}

// ===================================================================
// PHASE 1: CAST
// ===================================================================
function castLine(){
  if(phase!=='idle') return;
  phase='casting';
  document.getElementById('castBtn').style.display='none';
  document.getElementById('rodLine').textContent='casting...';
  if(window.SFXFish) SFXFish.cast();
  let t=0;
  const iv=setInterval(()=>{
    t+=0.08; drawGameScene(Math.min(t,1));
    if(t>=1){ clearInterval(iv); startWaiting(); }
  }, 40);
}

function startWaiting(){
  phase='waiting';
  document.getElementById('rodLine').textContent='waiting for a bite...';
  document.getElementById('promptBar').textContent='';
  const wait = 1200 + Math.random()*2200;
  setTimeout(()=>{ if(phase==='waiting') startBiteMinigame(); }, wait);
}

// ===================================================================
// PHASE 2: BITE — tap when the moving marker is inside the green zone
// ===================================================================
let biteRAF=null, biteMarkerX=0, biteDir=1, biteZoneStart=0, biteZoneW=0;
function startBiteMinigame(){
  phase='bite';
  document.getElementById('rodLine').textContent='FISH ON! tap NOW!';
  document.getElementById('promptBar').textContent='TAP WHEN THE MARKER HITS THE GREEN ZONE';
  const bar=document.getElementById('biteBar'); bar.style.display='block';
  const barW = bar.clientWidth;
  biteZoneW = barW*0.22;
  biteZoneStart = Math.random()*(barW-biteZoneW);
  document.getElementById('biteZone').style.left=biteZoneStart+'px';
  document.getElementById('biteZone').style.width=biteZoneW+'px';
  biteMarkerX=0; biteDir=1;
  if(window.SFXFish) SFXFish.splash();

  const speed = 6 + (levelFromXp(currentProfile?.fishingXp||0).level*0.3);
  function loop(){
    biteMarkerX += biteDir*speed;
    if(biteMarkerX>=barW-4){ biteDir=-1; }
    if(biteMarkerX<=0){ biteDir=1; }
    document.getElementById('biteMarker').style.left=biteMarkerX+'px';
    biteRAF=requestAnimationFrame(loop);
  }
  loop();
  // give them a window to tap; bind one-shot
  const onTap = ()=>{ resolveBite(barW); };
  document.getElementById('gameScreen')._biteTap = onTap;
  document.getElementById('gameScreen').addEventListener('click', onTap, { once:true });
  // auto-miss after a few seconds if they never tap
  this._biteTimeout = setTimeout(()=>{ if(phase==='bite') resolveBite(barW, true); }, 4000);
}
function resolveBite(barW, timedOut){
  if(phase!=='bite') return;
  cancelAnimationFrame(biteRAF);
  document.getElementById('biteBar').style.display='none';
  const hit = !timedOut && biteMarkerX>=biteZoneStart && biteMarkerX<=biteZoneStart+biteZoneW;
  if(hit){ startReelMinigame(); }
  else{
    document.getElementById('rodLine').textContent='it got away...';
    document.getElementById('promptBar').textContent='missed the hookset — try again';
    if(window.SFXFish) SFXFish.miss();
    setTimeout(resetToIdle, 1400);
  }
}

// ===================================================================
// PHASE 3: REEL — keep the fish indicator inside the safe zone by
// holding/releasing reel pressure; tension builds if outside safe zone.
// ===================================================================
let reelRAF=null, fishPos=0.5, fishVel=0, tension=0.15, holding=false;
function startReelMinigame(){
  phase='reel';
  currentFish = rarityWeightedPick();
  document.getElementById('rodLine').textContent='REEL IT IN!';
  document.getElementById('promptBar').textContent='HOLD to reel up, RELEASE to let it run. keep it in the green!';
  document.getElementById('reelWrap').style.display='block';
  document.getElementById('tensionWrap').style.display='block';
  if(window.SFXFish) SFXFish.reelStart();

  fishPos = 0.5; fishVel=0; tension=0.15;
  const safeStart = 0.36, safeEnd = 0.62;
  document.getElementById('reelSafe').style.top = ((1-safeEnd)*100)+'%';
  document.getElementById('reelSafe').style.height = ((safeEnd-safeStart)*100)+'%';

  const wrap = document.getElementById('reelWrap');
  const downHandler = ()=>{ holding=true; };
  const upHandler = ()=>{ holding=false; };
  document.getElementById('gameScreen').addEventListener('pointerdown', downHandler);
  document.getElementById('gameScreen').addEventListener('pointerup', upHandler);
  document.getElementById('gameScreen').addEventListener('pointerleave', upHandler);

  let progress=0; // 0..1 reel-in progress, fills as you stay in safe zone
  function loop(){
    // fish AI: drifts, fights harder for rarer fish
    const fightStrength = 0.012 + RARITY[currentFish.rarity].weight<10 ? 0.012 : 0.005;
    fishVel += (Math.random()-0.5)*fightStrength;
    fishVel *= 0.9;
    fishPos += fishVel;
    fishPos = Math.max(0,Math.min(1,fishPos));
    document.getElementById('reelFish').style.top = ((1-fishPos)*100-5)+'%';

    // your pull: holding moves fish position toward center/up (you reeling it toward safe)
    if(holding){ fishPos += 0.01; }

    const inSafe = fishPos>=safeStart && fishPos<=safeEnd;
    tension += inSafe? -0.012 : 0.02;
    tension = Math.max(0,Math.min(1,tension));
    document.getElementById('tensionFill').style.width = (tension*100)+'%';

    if(inSafe){ progress += 0.012; }

    if(tension>=1){
      cleanupReel(downHandler,upHandler);
      document.getElementById('rodLine').textContent='line snapped!';
      document.getElementById('promptBar').textContent='the line snapped — it got away';
      if(window.SFXFish) SFXFish.snap();
      setTimeout(resetToIdle, 1500);
      return;
    }
    if(progress>=1){
      cleanupReel(downHandler,upHandler);
      finishCatch();
      return;
    }
    reelRAF=requestAnimationFrame(loop);
  }
  loop();
}
function cleanupReel(downHandler,upHandler){
  cancelAnimationFrame(reelRAF);
  document.getElementById('gameScreen').removeEventListener('pointerdown', downHandler);
  document.getElementById('gameScreen').removeEventListener('pointerup', upHandler);
  document.getElementById('gameScreen').removeEventListener('pointerleave', upHandler);
  document.getElementById('reelWrap').style.display='none';
  document.getElementById('tensionWrap').style.display='none';
}

// ===================================================================
// CATCH RESULT
// ===================================================================
async function finishCatch(){
  phase='done';
  document.getElementById('promptBar').textContent='';
  if(window.SFXFish) SFXFish.catchFish(RARITY[currentFish.rarity].weight<10);
  const res = await recordCatch(currentFish.id);
  const card=document.getElementById('catchCard');
  document.getElementById('catchIcon').textContent = currentFish.icon;
  document.getElementById('catchIcon').style.textShadow = RARITY[currentFish.rarity].glow;
  document.getElementById('catchName').textContent = currentFish.name;
  const rEl = document.getElementById('catchRarity');
  rEl.textContent = RARITY[currentFish.rarity].label.toUpperCase();
  rEl.style.color = RARITY[currentFish.rarity].color;
  document.getElementById('catchXp').textContent = `+${res?res.xpGain:RARITY[currentFish.rarity].xp} XP`;
  document.getElementById('catchNew').textContent = res && res.isNew ? '✨ NEW SPECIES — added to your Collection!' : '';
  card.style.display='flex';
  updateProgressUI();
}
