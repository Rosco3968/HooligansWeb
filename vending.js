// ===================================================================
// vending.js — sketchy late-night vending machine
// Detailed pixel scene: dark street, glowing street lamp lighting the
// machine. 15 GBD per pull -> random junk item -> into collection.
// ===================================================================

const VEND_COST = (typeof VENDING_COST!=='undefined') ? VENDING_COST : 15;
let vctx, VW, VH, vendT=0, dispensing=false, musicOn2=false;

function gateVend(){
  const login=document.getElementById('vendLogin'), game=document.getElementById('vendGame');
  if(!login) return;
  if(currentUser){ login.style.display='none'; game.style.display='block'; if(!vctx) initVend(); renderVendHud(); }
  else { login.style.display='block'; game.style.display='none'; }
}
document.addEventListener('hooligan-auth', gateVend);
document.addEventListener('portal-ready', ()=>{
  gateVend();
  document.getElementById('muteBtn').addEventListener('click', ()=>{ if(window.FishMusic){ const m=FishMusic.toggleMute(); document.getElementById('muteBtn').textContent=m?'🔇 MUSIC OFF':'🔊 MUSIC ON'; } });
  document.getElementById('buyBtn').addEventListener('click', buyVend);
});

function renderVendHud(){ const el=document.getElementById('coinHud'); if(el&&currentUser) el.textContent='💰 '+getCoins()+' GBD'; }

function initVend(){
  const c=document.getElementById('vendScene'); if(!c) return;
  vctx=c.getContext('2d'); VW=c.width; VH=c.height;
  if(!musicOn2){ musicOn2=true; if(window.FishMusic) FishMusic.start(); }
  requestAnimationFrame(drawVend);
}

function drawVend(){
  const ctx=vctx; if(!ctx) return;
  vendT++;
  // night sky
  ctx.fillStyle='#06080f'; ctx.fillRect(0,0,VW,VH);
  // a few stars
  ctx.fillStyle='rgba(255,255,255,0.5)';
  for(let i=0;i<24;i++){ const x=(i*97)%VW, y=(i*53)%140; ctx.fillRect(x,y,2,2); }
  // ground / sidewalk
  ctx.fillStyle='#12161e'; ctx.fillRect(0,VH-70,VW,70);
  ctx.strokeStyle='#1c2230'; ctx.lineWidth=1;
  for(let x=0;x<VW;x+=50){ ctx.beginPath(); ctx.moveTo(x,VH-70); ctx.lineTo(x-20,VH); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0,VH-70); ctx.lineTo(VW,VH-70); ctx.stroke();

  // street lamp (right side), with flicker
  const flicker = (Math.sin(vendT*0.3)>0.92 || Math.random()>0.985) ? 0.5 : 1;
  const lampX=VW-60, lampTop=40;
  // pole
  ctx.fillStyle='#2a2f3a'; ctx.fillRect(lampX-4, lampTop, 8, VH-70-lampTop);
  ctx.fillStyle='#2a2f3a'; ctx.fillRect(lampX-40, lampTop, 44, 8);
  // lamp head
  ctx.fillStyle='#3a3f4a'; ctx.fillRect(lampX-52, lampTop-6, 22, 14);
  // glow cone
  const grd=ctx.createRadialGradient(lampX-41, lampTop+6, 4, lampX-41, lampTop+6, 260);
  grd.addColorStop(0, `rgba(255,225,150,${0.55*flicker})`);
  grd.addColorStop(0.5, `rgba(255,210,120,${0.14*flicker})`);
  grd.addColorStop(1, 'rgba(255,200,100,0)');
  ctx.fillStyle=grd;
  ctx.beginPath(); ctx.moveTo(lampX-41,lampTop+6); ctx.lineTo(lampX-200,VH-70); ctx.lineTo(lampX+90,VH-70); ctx.closePath(); ctx.fill();
  // bulb
  ctx.fillStyle=`rgba(255,240,190,${flicker})`; ctx.beginPath(); ctx.arc(lampX-41, lampTop+6, 5, 0, Math.PI*2); ctx.fill();

  // the vending machine (center-left), detailed pixel art
  drawMachine(ctx, VW*0.36, VH-70, flicker);

  requestAnimationFrame(drawVend);
}

function drawMachine(ctx, cx, baseY, light){
  const w=150, h=250, x=cx-w/2, y=baseY-h;
  // machine shadow
  ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(cx, baseY+4, w*0.6, 10, 0,0,Math.PI*2); ctx.fill();
  // body, lit warmer on the lamp side (right)
  const bodyGrd=ctx.createLinearGradient(x,0,x+w,0);
  bodyGrd.addColorStop(0, '#5a1418'); bodyGrd.addColorStop(1, `rgb(${Math.round(140*light)},${Math.round(40*light)},${Math.round(44*light)})`);
  ctx.fillStyle=bodyGrd; ctx.fillRect(x,y,w,h);
  // chrome trim
  ctx.fillStyle='#c0c4cc'; ctx.fillRect(x,y,w,6); ctx.fillRect(x,y+h-6,w,6); ctx.fillRect(x,y,5,h); ctx.fillRect(x+w-5,y,5,h);
  // top sign (glowing)
  ctx.fillStyle=`rgba(255,80,90,${0.7+0.3*light})`; ctx.fillRect(x+10,y+12,w-20,26);
  ctx.fillStyle='#fff'; ctx.font='bold 13px Impact, sans-serif'; ctx.textAlign='center';
  ctx.fillText('GBD JUNK', cx, y+30);
  // glass display with shelves of mystery items
  ctx.fillStyle='rgba(20,30,45,0.85)'; ctx.fillRect(x+12,y+46,w-46,h-110);
  ctx.strokeStyle='#1a2a3a'; ctx.strokeRect(x+12,y+46,w-46,h-110);
  // shelves + item silhouettes
  ctx.fillStyle='rgba(255,255,255,0.08)';
  for(let r=0;r<4;r++){ const sy=y+58+r*30; ctx.fillRect(x+12, sy+24, w-46, 2);
    for(let cc=0;cc<3;cc++){ ctx.fillStyle='rgba(200,210,230,0.18)'; ctx.fillRect(x+20+cc*30, sy, 16, 20); }
  }
  // glass reflection from lamp
  ctx.fillStyle=`rgba(255,230,170,${0.10*light})`;
  ctx.beginPath(); ctx.moveTo(x+12,y+46); ctx.lineTo(x+50,y+46); ctx.lineTo(x+20,y+h-64); ctx.lineTo(x+12,y+h-64); ctx.closePath(); ctx.fill();
  // keypad
  ctx.fillStyle='#1a1a1a'; ctx.fillRect(x+w-30,y+50,22,70);
  ctx.fillStyle='#3ee08a';
  for(let i=0;i<9;i++){ ctx.fillRect(x+w-28+(i%3)*7, y+54+Math.floor(i/3)*7, 5,5); }
  // dispense tray (glowing if dispensing)
  ctx.fillStyle = dispensing ? 'rgba(62,224,138,0.5)' : '#0a0a0a';
  ctx.fillRect(x+14,y+h-44,w-28,30);
  ctx.strokeStyle='#000'; ctx.strokeRect(x+14,y+h-44,w-28,30);
  ctx.fillStyle='#888'; ctx.font='8px Verdana'; ctx.fillText('PUSH', cx-1, y+h-26);
}

async function buyVend(){
  if(dispensing) return;
  if(getCoins() < VEND_COST){ vMsg('need '+VEND_COST+' GBD', 'lose'); return; }
  if(!(await changeCoins(-VEND_COST))){ vMsg('need '+VEND_COST+' GBD', 'lose'); return; }
  renderVendHud();
  dispensing=true;
  document.getElementById('buyBtn').disabled=true;
  document.getElementById('dispensed').style.display='none';
  vMsg('*clunk* *whirr*...');
  if(window.SFXFish) SFXFish.reelStart();

  const item = vendWeightedPick();
  setTimeout(async ()=>{
    if(window.SFXFish) SFXFish.cast();
    const res = await recordVendItem(item.id);
    const r = (typeof RARITY!=='undefined') ? RARITY[item.rarity] : {label:item.rarity,color:'#fff',glow:'none'};
    document.getElementById('dispIcon').textContent=item.icon;
    document.getElementById('dispIcon').style.textShadow=r.glow;
    document.getElementById('dispName').textContent=item.name;
    const rr=document.getElementById('dispRarity'); rr.textContent=r.label.toUpperCase(); rr.style.color=r.color;
    document.getElementById('dispNew').textContent = res && res.isNew ? '✨ NEW — added to your Collection!' : '';
    document.getElementById('dispensed').style.display='block';
    vMsg('you got:', 'win');
    if(window.SFXFish) SFXFish.catchFish((typeof RARITY!=='undefined'&&RARITY[item.rarity].weight<10));
    dispensing=false;
    document.getElementById('buyBtn').disabled=false;
  }, 1400);
}

function vMsg(t,cls){ const m=document.getElementById('vendMsg'); if(m){ m.textContent=t; m.className='vendmsg '+(cls||''); } }
document.addEventListener('hooligan-auth', renderVendHud);
