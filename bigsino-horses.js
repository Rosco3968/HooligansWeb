// ===================================================================
// bigsino-horses.js — 2D pixel horse racing (members only)
// Pick a horse, bet, watch them run. Win pays bet × odds. Min bet 25.
// Odds are inversely tied to a hidden "speed" so favorites pay less.
// ===================================================================

const RACE_MIN = 25;
const HORSES = [
  { name:'GBD ROCKET', color:'#c4161c', odds:2 },
  { name:'DAD ROCK',   color:'#19d3ff', odds:3 },
  { name:'SENDIT SAM', color:'#ffd700', odds:4 },
  { name:'LIL MENACE', color:'#3ee08a', odds:6 },
  { name:'LONGSHOT LARRY', color:'#9b30ff', odds:10 }
];

let canvas, ctx, W, H;
let selected = -1, racing = false, curBet = 0;

function gateCheck(){
  const d=document.getElementById('denied'), c=document.getElementById('content');
  if(currentUser && currentProfile && currentProfile.bigsinoAccess){ d.style.display='none'; c.style.display='block'; setupRace(); }
  else { d.style.display='block'; c.style.display='none'; }
}
document.addEventListener('hooligan-auth', gateCheck);
document.addEventListener('portal-ready', gateCheck);

let inited=false;
function setupRace(){
  if(inited) return; inited=true;
  canvas=document.getElementById('raceCanvas'); if(!canvas) return;
  ctx=canvas.getContext('2d'); W=canvas.width; H=canvas.height;
  renderPicks();
  drawTrack(HORSES.map(()=>40));
  document.getElementById('raceStart').addEventListener('click', startRace);
}

function renderPicks(){
  const wrap=document.getElementById('horsePicks');
  wrap.innerHTML = HORSES.map((h,i)=>`<div class="pick" data-i="${i}" onclick="pickHorse(${i})">
    <div class="nm"><span class="sw" style="background:${h.color}"></span>${h.name}</div>
    <div class="od">${h.odds}× odds</div>
  </div>`).join('');
}
function pickHorse(i){
  if(racing) return;
  selected=i;
  document.querySelectorAll('.pick').forEach(p=>p.classList.toggle('sel', +p.dataset.i===i));
  document.getElementById('raceStart').disabled=false;
  document.getElementById('raceMsg').textContent='bet on '+HORSES[i].name+' and hit RACE';
  document.getElementById('raceMsg').className='racemsg';
}

const LANE_H = () => H/HORSES.length;
function drawTrack(positions){
  ctx.clearRect(0,0,W,H);
  // grass
  ctx.fillStyle='#3a7d3a'; ctx.fillRect(0,0,W,H);
  // dirt track lanes
  for(let i=0;i<HORSES.length;i++){
    const y=i*LANE_H();
    ctx.fillStyle = i%2? '#c89b6a':'#b88a5a'; ctx.fillRect(0,y,W,LANE_H());
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
  }
  // finish line
  const fx=W-40;
  for(let y=0;y<H;y+=10){ ctx.fillStyle=(Math.floor(y/10)%2)?'#fff':'#000'; ctx.fillRect(fx,y,8,10); }
  // horses
  positions.forEach((x,i)=> drawHorse(x, i*LANE_H()+LANE_H()/2, HORSES[i].color, i));
}
function drawHorse(x,y,color,i){
  // simple pixel horse: body, head, legs (legs alternate for gallop)
  const leg = racing ? (Math.floor(Date.now()/80 + i)%2) : 0;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle=color;
  ctx.fillRect(-14,-8,26,12);            // body
  ctx.fillRect(10,-14,9,9);              // head
  ctx.fillRect(17,-12,5,3);              // muzzle
  ctx.fillStyle='#000';
  ctx.fillRect(-14,4, 4, leg?7:5);       // back leg
  ctx.fillRect(6,4, 4, leg?5:7);         // front leg
  ctx.fillStyle='#fff'; ctx.fillRect(13,-12,2,2); // eye
  // tail
  ctx.strokeStyle=color; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-14,-6); ctx.lineTo(-22,-2); ctx.stroke();
  ctx.restore();
}

async function startRace(){
  if(racing || selected<0) return;
  const bet=Math.floor(Number(document.getElementById('raceBet').value));
  const msg=document.getElementById('raceMsg');
  if(!bet||bet<RACE_MIN){ msg.textContent='min bet '+RACE_MIN; msg.className='racemsg lose'; return; }
  if(getCoins()<bet){ msg.textContent='not enough coins'; msg.className='racemsg lose'; return; }
  if(!(await changeCoins(-bet))){ msg.textContent='not enough coins'; msg.className='racemsg lose'; return; }
  curBet=bet; racing=true;
  document.getElementById('raceStart').disabled=true;
  msg.textContent='AND THEY\'RE OFF!'; msg.className='racemsg';

  const startX=40, finishX=W-44;
  let pos=HORSES.map(()=>startX);
  // each horse has a base speed inversely related to odds (favorites faster) + randomness
  const baseSpeed=HORSES.map(h=> 1.6 - h.odds*0.05);
  let lastGallop=0;
  function frame(t){
    for(let i=0;i<HORSES.length;i++){
      pos[i] += Math.max(0.4, baseSpeed[i] + Math.random()*1.6);
    }
    drawTrack(pos);
    if(window.SFX && t-lastGallop>120){ SFX.gallop(); lastGallop=t; }
    const winner = pos.findIndex(p=>p>=finishX);
    if(winner>=0){ racing=false; finishRace(winner); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

async function finishRace(winner){
  const msg=document.getElementById('raceMsg');
  const wH=HORSES[winner];
  if(winner===selected){
    const payout=curBet*wH.odds;
    await changeCoins(payout);
    const net=payout-curBet;
    msg.textContent=`🏆 ${wH.name} WINS! +${net}`; msg.className='racemsg win';
    if(window.SFX){ (net>=500)?SFX.bigWin():SFX.win(); }
    if(net>=500) recordBigWin(net);
  }else{
    msg.textContent=`${wH.name} took it. you lost ${curBet}.`; msg.className='racemsg lose';
    if(window.SFX) SFX.lose();
  }
  document.getElementById('raceStart').disabled=false;
}

async function recordBigWin(amount){
  if(!currentProfile) return;
  try{ currentProfile.biggestWin=Math.max(currentProfile.biggestWin||0, amount); if(typeof persistProfileCoins==='function') await persistProfileCoins(); }catch(e){}
}
