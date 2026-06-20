// ===================================================================
// casino.js — four GBD-coin games: slots, blackjack, wheel, coin pusher
// All bets/payouts go through wallet.js (changeCoins/getCoins).
// ===================================================================

document.addEventListener('portal-ready', () => {
  if(!document.getElementById('casinoGames')) return;
  wireSlots(); wireBlackjack(); wireWheel(); wirePusher();
  drawWheel(0); initPusher();
  loadCoinLeaderboard();
});

document.addEventListener('hooligan-auth', () => {
  const login = document.getElementById('casinoLogin');
  const games = document.getElementById('casinoGames');
  if(!login) return;
  if(currentUser){ login.style.display='none'; games.style.display='block'; gTab('slots'); }
  else { login.style.display='block'; games.style.display='none'; }
  loadCoinLeaderboard();
});

function gTab(g){
  document.querySelectorAll('.gtab').forEach(b=>b.classList.toggle('on', b.dataset.g===g));
  document.querySelectorAll('.gpanel').forEach(p=>p.classList.toggle('on', p.id==='gp-'+g));
  if(g==='wheel') drawWheel(currentWheelAngle);
  if(g==='pusher') drawPusher();
}

function readBet(id){
  const v = Math.floor(Number(document.getElementById(id).value));
  if(!v || v < 1) return null;
  return v;
}

// ============ SLOTS ============
const SLOT_SYMBOLS = ['🍒','🔔','🍋','⭐','🎸','💀'];
function wireSlots(){ document.getElementById('slotSpin').addEventListener('click', spinSlots); }

async function spinSlots(){
  const bet = readBet('slotBet');
  const msg = document.getElementById('slotMsg');
  if(bet===null){ msg.textContent='enter a valid bet'; msg.className='msg lose'; return; }
  if(getCoins() < bet){ msg.textContent="not enough coins"; msg.className='msg lose'; return; }

  const ok = await changeCoins(-bet);
  if(!ok){ msg.textContent="not enough coins"; msg.className='msg lose'; return; }

  const reels = [document.getElementById('r0'),document.getElementById('r1'),document.getElementById('r2')];
  reels.forEach(r=>r.classList.add('spin'));
  document.getElementById('slotSpin').disabled = true;
  msg.textContent = 'spinning...'; msg.className='msg';

  // animate then settle
  const finals = [randSym(),randSym(),randSym()];
  let ticks=0;
  const iv = setInterval(()=>{ reels.forEach(r=> r.textContent = randSym()); ticks++;
    if(ticks>10){ clearInterval(iv);
      reels.forEach((r,i)=>{ r.classList.remove('spin'); r.textContent = finals[i]; });
      settleSlots(finals, bet);
      document.getElementById('slotSpin').disabled = false;
    }
  }, 90);
}
function randSym(){ return SLOT_SYMBOLS[Math.floor(Math.random()*SLOT_SYMBOLS.length)]; }

async function settleSlots(finals, bet){
  const msg = document.getElementById('slotMsg');
  let mult = 0;
  if(finals[0]===finals[1] && finals[1]===finals[2]){
    mult = (finals[0]==='💀') ? 50 : 20;
  }else if(finals[0]===finals[1] || finals[1]===finals[2] || finals[0]===finals[2]){
    mult = 2;
  }
  if(mult>0){
    const win = bet*mult;
    await changeCoins(win);
    msg.textContent = `WIN! +${win} (${mult}x)`; msg.className='msg win';
  }else{
    msg.textContent = `no match — lost ${bet}`; msg.className='msg lose';
  }
  loadCoinLeaderboard();
}

// ============ BLACKJACK ============
let bjDeck=[], bjPlayer=[], bjDealer=[], bjBet=0, bjActive=false;
function wireBlackjack(){
  document.getElementById('bjDeal').addEventListener('click', bjDeal);
  document.getElementById('bjHit').addEventListener('click', bjHit);
  document.getElementById('bjStand').addEventListener('click', bjStand);
}
function newDeck(){
  const suits=['♠','♥','♦','♣']; const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const d=[]; for(const s of suits) for(const r of ranks) d.push({r,s});
  for(let i=d.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
  return d;
}
function cardVal(c){ if(c.r==='A') return 11; if(['K','Q','J'].includes(c.r)) return 10; return Number(c.r); }
function handVal(h){ let v=0,aces=0; for(const c of h){ v+=cardVal(c); if(c.r==='A')aces++; } while(v>21&&aces){ v-=10; aces--; } return v; }
function cardHTML(c, hidden){
  if(hidden) return '<div class="card back">?</div>';
  const red = (c.s==='♥'||c.s==='♦');
  return `<div class="card ${red?'red':''}">${c.r}${c.s}</div>`;
}
function renderBJ(hideDealer){
  document.getElementById('dealerCards').innerHTML = bjDealer.map((c,i)=> cardHTML(c, hideDealer && i===1)).join('');
  document.getElementById('playerCards').innerHTML = bjPlayer.map(c=>cardHTML(c,false)).join('');
}
async function bjDeal(){
  const bet = readBet('bjBet'); const msg=document.getElementById('bjMsg');
  if(bet===null){ msg.textContent='enter a valid bet'; msg.className='msg lose'; return; }
  if(getCoins()<bet){ msg.textContent='not enough coins'; msg.className='msg lose'; return; }
  if(!(await changeCoins(-bet))){ msg.textContent='not enough coins'; msg.className='msg lose'; return; }
  bjBet=bet; bjDeck=newDeck(); bjPlayer=[bjDeck.pop(),bjDeck.pop()]; bjDealer=[bjDeck.pop(),bjDeck.pop()]; bjActive=true;
  renderBJ(true);
  msg.textContent='hit or stand?'; msg.className='msg';
  document.getElementById('bjHit').disabled=false; document.getElementById('bjStand').disabled=false; document.getElementById('bjDeal').disabled=true;
  if(handVal(bjPlayer)===21) bjStand();
}
async function bjHit(){
  if(!bjActive) return;
  bjPlayer.push(bjDeck.pop()); renderBJ(true);
  if(handVal(bjPlayer)>21){ const msg=document.getElementById('bjMsg'); msg.textContent=`BUST! lost ${bjBet}`; msg.className='msg lose'; endBJ(); }
}
async function bjStand(){
  if(!bjActive) return;
  bjActive=false;
  while(handVal(bjDealer)<17) bjDealer.push(bjDeck.pop());
  renderBJ(false);
  const pv=handVal(bjPlayer), dv=handVal(bjDealer); const msg=document.getElementById('bjMsg');
  if(dv>21 || pv>dv){
    const isBJ = (pv===21 && bjPlayer.length===2);
    const win = isBJ ? Math.floor(bjBet*2.5) : bjBet*2;
    await changeCoins(win);
    msg.textContent = `${isBJ?'BLACKJACK! ':'WIN! '}+${win}`; msg.className='msg win';
  }else if(pv===dv){
    await changeCoins(bjBet); msg.textContent='push — bet returned'; msg.className='msg';
  }else{
    msg.textContent=`dealer wins — lost ${bjBet}`; msg.className='msg lose';
  }
  endBJ();
}
function endBJ(){
  bjActive=false;
  document.getElementById('bjHit').disabled=true; document.getElementById('bjStand').disabled=true; document.getElementById('bjDeal').disabled=false;
  loadCoinLeaderboard();
}

// ============ WHEEL ============
const WHEEL_SLICES = [0,1,2,0,3,1,5,0,2,10,1,0]; // multipliers
const WHEEL_COLORS = ['#c4161c','#1b9e8f','#19d3ff','#7a0a0e','#ffb000','#1b9e8f','#9b30ff','#7a0a0e','#19d3ff','#ffd700','#1b9e8f','#7a0a0e'];
let currentWheelAngle = 0, wheelSpinning=false;
function wireWheel(){ document.getElementById('wheelSpin').addEventListener('click', spinWheel); }
function drawWheel(angle){
  const c=document.getElementById('wheelCanvas'); if(!c) return; const ctx=c.getContext('2d');
  const cx=c.width/2, cy=c.height/2, r=c.width/2-6; const n=WHEEL_SLICES.length; const seg=Math.PI*2/n;
  ctx.clearRect(0,0,c.width,c.height);
  for(let i=0;i<n;i++){
    const a0=angle+i*seg, a1=a0+seg;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,a0,a1); ctx.closePath();
    ctx.fillStyle=WHEEL_COLORS[i]; ctx.fill(); ctx.strokeStyle='#000'; ctx.stroke();
    // label
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(a0+seg/2); ctx.textAlign='right'; ctx.fillStyle='#fff'; ctx.font='bold 13px Impact, sans-serif';
    ctx.fillText(WHEEL_SLICES[i]+'x', r-8, 5); ctx.restore();
  }
  // hub + pointer
  ctx.beginPath(); ctx.arc(cx,cy,14,0,Math.PI*2); ctx.fillStyle='#000'; ctx.fill(); ctx.strokeStyle='#ffb000'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 2); ctx.lineTo(cx-10, -14); ctx.lineTo(cx+10,-14); ctx.closePath(); ctx.fillStyle='#ffb000'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(c.width-2, cy); ctx.lineTo(c.width+14, cy-10); ctx.lineTo(c.width+14, cy+10); ctx.closePath(); ctx.fillStyle='#ffb000'; ctx.fill();
}
async function spinWheel(){
  if(wheelSpinning) return;
  const bet=readBet('wheelBet'); const msg=document.getElementById('wheelMsg');
  if(bet===null){ msg.textContent='enter a valid bet'; msg.className='msg lose'; return; }
  if(getCoins()<bet){ msg.textContent='not enough coins'; msg.className='msg lose'; return; }
  if(!(await changeCoins(-bet))){ msg.textContent='not enough coins'; msg.className='msg lose'; return; }
  wheelSpinning=true; document.getElementById('wheelSpin').disabled=true; msg.textContent='spinning...'; msg.className='msg';
  const n=WHEEL_SLICES.length, seg=Math.PI*2/n;
  const target=Math.floor(Math.random()*n);
  // pointer is on the RIGHT (angle 0). We want slice 'target' centered at angle 0.
  const spins=5;
  const finalAngle = spins*Math.PI*2 - (target*seg + seg/2);
  const start=currentWheelAngle; const dur=2600; const t0=performance.now();
  function frame(t){
    const p=Math.min((t-t0)/dur,1); const ease=1-Math.pow(1-p,3);
    currentWheelAngle = start + (finalAngle-start)*ease;
    drawWheel(currentWheelAngle);
    if(p<1) requestAnimationFrame(frame);
    else { wheelSpinning=false; document.getElementById('wheelSpin').disabled=false; settleWheel(WHEEL_SLICES[target], bet); }
  }
  requestAnimationFrame(frame);
}
async function settleWheel(mult, bet){
  const msg=document.getElementById('wheelMsg');
  if(mult>0){ const win=bet*mult; await changeCoins(win); msg.textContent=`${mult}x — WIN +${win}!`; msg.className='msg win'; }
  else { msg.textContent=`0x — lost ${bet}`; msg.className='msg lose'; }
  loadCoinLeaderboard();
}

// ============ COIN PUSHER ============
let pusherCoins=[], pusherCtx, pusherCanvas, pusherShelf, pusherAnim=null;
function wirePusher(){ document.getElementById('pusherDrop').addEventListener('click', dropCoin); }
function initPusher(){
  pusherCanvas=document.getElementById('pusherCanvas'); if(!pusherCanvas) return;
  pusherCtx=pusherCanvas.getContext('2d');
  pusherShelf = pusherCanvas.height - 70; // ledge line
  // seed a few coins on the shelf
  pusherCoins=[];
  for(let i=0;i<8;i++) pusherCoins.push({ x:40+Math.random()*(pusherCanvas.width-80), y: pusherShelf - Math.random()*40, r:11, settled:true });
  drawPusher();
}
function drawPusher(){
  if(!pusherCtx) return; const c=pusherCanvas, ctx=pusherCtx;
  ctx.clearRect(0,0,c.width,c.height);
  // back wall + pusher plate
  ctx.fillStyle='#111'; ctx.fillRect(0,0,c.width,40);
  ctx.fillStyle='#1b9e8f'; ctx.fillRect(0, 30 + Math.sin(Date.now()/400)*6, c.width, 14); // moving pusher
  // shelf edge
  ctx.strokeStyle='#c4161c'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,pusherShelf); ctx.lineTo(c.width,pusherShelf); ctx.stroke();
  // coins
  for(const co of pusherCoins){
    ctx.beginPath(); ctx.arc(co.x,co.y,co.r,0,Math.PI*2);
    ctx.fillStyle='#ffd700'; ctx.fill(); ctx.strokeStyle='#b8860b'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#b8860b'; ctx.font='bold 9px Impact'; ctx.textAlign='center'; ctx.fillText('G',co.x,co.y+3);
  }
  // win tray label
  ctx.fillStyle='#666'; ctx.font='9px Verdana'; ctx.textAlign='center'; ctx.fillText('▼ coins falling here pay out ▼', c.width/2, c.height-6);
}
async function dropCoin(){
  const msg=document.getElementById('pusherMsg');
  if(getCoins()<5){ msg.textContent='need 5 coins to drop'; msg.className='msg lose'; return; }
  if(!(await changeCoins(-5))){ msg.textContent='need 5 coins'; msg.className='msg lose'; return; }
  msg.textContent=''; 
  // add a new coin at top center, falling
  pusherCoins.push({ x: pusherCanvas.width/2 + (Math.random()*40-20), y: 50, r:11, settled:false, vy:0 });
  if(!pusherAnim) runPusher();
  loadCoinLeaderboard();
}
function runPusher(){
  let fellThisRun = 0;
  function step(){
    const c=pusherCanvas;
    const pusherY = 30 + Math.sin(Date.now()/400)*6 + 14;
    let moving=false;
    for(const co of pusherCoins){
      if(!co.settled){
        co.vy=(co.vy||0)+0.5; co.y+=co.vy;
        if(co.y>=pusherShelf-co.r){ co.y=pusherShelf-co.r; co.settled=true; co.vy=0; }
        moving=true;
      }
    }
    // pusher plate shoves settled coins forward (down toward edge) when extended
    for(const co of pusherCoins){
      if(co.settled && co.y < pusherShelf+2){
        // gentle nudge based on pusher position
        co.x += 0; co.y += 0.25; // creep toward edge
      }
    }
    // resolve overlaps (simple push apart horizontally)
    for(let i=0;i<pusherCoins.length;i++) for(let j=i+1;j<pusherCoins.length;j++){
      const a=pusherCoins[i],b=pusherCoins[j]; const dx=b.x-a.x, dy=b.y-a.y; const d=Math.hypot(dx,dy)||0.1; const min=a.r+b.r;
      if(d<min){ const push=(min-d)/2; const nx=dx/d, ny=dy/d; a.x-=nx*push; a.y-=ny*push; b.x+=nx*push; b.y+=ny*push; moving=true; }
    }
    // coins that pass the bottom edge = payout
    const before=pusherCoins.length;
    pusherCoins = pusherCoins.filter(co=>{
      if(co.y > pusherCanvas.height-20){ fellThisRun++; return false; }
      if(co.x<-20||co.x>pusherCanvas.width+20) return false;
      return true;
    });
    drawPusher();
    if(moving || Math.abs(Math.sin(Date.now()/400))>0.01){ pusherAnim=requestAnimationFrame(step); }
    else { pusherAnim=null; }
    // keep animating a short while for the pusher motion
  }
  // run for a bounded time so the pusher keeps moving a bit
  let frames=0;
  function loop(){ step(); frames++; if(frames<240){ requestAnimationFrame(loop); } else {
    if(fellThisRun>0){ changeCoins(fellThisRun*5).then(()=>{ const msg=document.getElementById('pusherMsg'); msg.textContent=`${fellThisRun} coin(s) fell — +${fellThisRun*5}!`; msg.className='msg win'; loadCoinLeaderboard(); }); }
    pusherAnim=null;
  } }
  pusherAnim=requestAnimationFrame(loop);
}

// keep pusher plate visually moving even when idle
setInterval(()=>{ if(document.getElementById('gp-pusher') && document.getElementById('gp-pusher').classList.contains('on') && !pusherAnim) drawPusher(); }, 120);

// ============ COIN LEADERBOARD ============
async function loadCoinLeaderboard(){
  const t=document.getElementById('coinLb'); if(!t) return;
  try{
    const res=await window.storage.get('coin_leaderboard', true);
    const board=res&&res.value?JSON.parse(res.value):{};
    const arr=Object.values(board).sort((a,b)=>b.coins-a.coins).slice(0,12);
    if(!arr.length){ t.innerHTML='<tr><td style="padding:10px;color:var(--steel-dim);">no players yet</td></tr>'; return; }
    t.innerHTML=arr.map((e,i)=>`<tr><td class="rk">${i+1}</td><td><b style="color:#fff;">${escapeHtml(e.handle||'?')}</b></td><td class="sc">${e.coins}</td></tr>`).join('');
  }catch(e){ t.innerHTML='<tr><td style="padding:10px;color:var(--steel-dim);">couldn\'t load</td></tr>'; }
}
