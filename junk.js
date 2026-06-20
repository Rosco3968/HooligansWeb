// ===================================================================
// junk.js — cluttered flashing fake-gambling ad boxes + "UH OH" popup
// Clicking any junk ad opens a Win95 window with a spinning 3D skull
// and docks 10 GBD coins (capped so you never go negative).
// ===================================================================

const JUNK_NAMES = [
  'MEGA SLOTS','LUCKY 7','GOLD RUSH','SPIN2WIN','JACKPOT CITY','VEGAS NITE',
  'CASH BLAST','WILD REELS','BIG BONUS','FREE SPINS','HOT STREAK','TRIPLE GOLD',
  'COIN STORM','ROYAL FLUSH','LUCKY DICE','MOON CASINO','TURBO BET','GBD GOLD',
  'PAYDAY!','BONUS WHEEL','FORTUNE 88','RAGE SLOTS','SKULL JACKPOT','NEON WIN',
  'CASH COW','DIAMOND HIT','POWER PLAY','SUPER LUCKY','MEGA MILLZ','WIN BIG NOW'
];
const JUNK_BGS = [
  'linear-gradient(135deg,#ff2079,#9b30ff)','linear-gradient(135deg,#ffd700,#ff7a00)',
  'linear-gradient(135deg,#00d65a,#00c2ff)','linear-gradient(135deg,#e8121f,#ffb000)',
  'linear-gradient(135deg,#19d3ff,#9b30ff)','linear-gradient(135deg,#a020f0,#ff2079)',
  'linear-gradient(135deg,#c4161c,#000)','linear-gradient(135deg,#1b9e8f,#ffd700)'
];
const JUNK_CORNERS = ['$$$','WIN!','HOT','NEW','24/7','FREE','BONUS','▲▲▲','★★★','!!!'];
const JUNK_ANIM = ['flash','shake','blink'];

function buildJunkAds(){
  document.querySelectorAll('[data-junk]').forEach(grid=>{
    const n = parseInt(grid.dataset.junk||'8',10);
    let h='';
    for(let i=0;i<n;i++){
      const name = JUNK_NAMES[Math.floor(Math.random()*JUNK_NAMES.length)];
      const bg = JUNK_BGS[Math.floor(Math.random()*JUNK_BGS.length)];
      const anim = JUNK_ANIM[Math.floor(Math.random()*JUNK_ANIM.length)];
      const corner = JUNK_CORNERS[Math.floor(Math.random()*JUNK_CORNERS.length)];
      const cornerSide = Math.random()>0.5?'':' lt';
      const rays = Math.random()>0.5 ? '<span class="jrays"></span>' : '';
      h += `<div class="junk ${anim}" style="background:${bg}">
        ${rays}
        <span class="corner${cornerSide}">${corner}</span>
        <span class="jt">${name}</span>
      </div>`;
    }
    grid.innerHTML = h;
    grid.querySelectorAll('.junk').forEach(j=> j.addEventListener('click', uhOhPopup));
  });
}

let skullRAF = null;
async function uhOhPopup(){
  // dock 10 coins (capped). Only if logged in.
  let stolen = 0;
  if(typeof currentUser !== 'undefined' && currentUser && typeof getCoins === 'function'){
    const have = getCoins();
    stolen = Math.min(10, have);
    if(stolen > 0 && typeof changeCoins === 'function'){ await changeCoins(-stolen); }
  }

  const host = document.getElementById('popupHost') || document.body;
  const win = document.createElement('div');
  win.className = 'w95';
  // random-ish position near center
  const left = Math.max(10, (window.innerWidth/2 - 120) + (Math.random()*120-60));
  const top = Math.max(10, (window.innerHeight/2 - 110) + (Math.random()*120-60));
  win.style.left = left+'px'; win.style.top = top+'px';
  win.innerHTML = `
    <div class="w95-tb"><span>⚠ system32.exe</span><span class="x">✕</span></div>
    <div class="w95-body">
      <div id="skullCanvasWrap"><canvas width="120" height="120"></canvas></div>
      <div class="uh">UH OH</div>
      <div class="sub">${stolen>0 ? `the house took <b>${stolen}</b> GBD coins.` : (typeof currentUser!=='undefined' && currentUser ? `you're broke. lucky you.` : `log in and find out what this does.`)}</div>
    </div>`;
  host.appendChild(win);

  const canvas = win.querySelector('canvas');
  spinSkull(canvas);

  win.querySelector('.x').addEventListener('click', ()=>{ win.remove(); });
  // also auto-close after a while
  setTimeout(()=>{ if(win.parentNode) win.remove(); }, 9000);

  if(typeof loadCoinLeaderboard === 'function') loadCoinLeaderboard();
}

// minimal 3D-ish spinning skull on a canvas (wireframe-ish, no libs)
function spinSkull(canvas){
  const ctx = canvas.getContext('2d');
  const cx = canvas.width/2, cy = canvas.height/2;
  let ang = 0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const s = Math.cos(ang); // fake 3D rotation: squash horizontally
    const w = 34 * Math.abs(s) + 10;
    // skull head
    ctx.save(); ctx.translate(cx,cy);
    ctx.fillStyle = '#e8e8e8'; ctx.strokeStyle='#333'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(0,-6,w,30,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // jaw
    ctx.beginPath(); ctx.ellipse(0,24,w*0.6,12,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // eyes (move with rotation)
    ctx.fillStyle='#000';
    const eyeOff = 12 * s;
    ctx.beginPath(); ctx.ellipse(-13+eyeOff*0.2,-8,6*Math.abs(s)+2,8,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(13+eyeOff*0.2,-8,6*Math.abs(s)+2,8,0,0,Math.PI*2); ctx.fill();
    // nose
    ctx.beginPath(); ctx.moveTo(0,2); ctx.lineTo(-4,12); ctx.lineTo(4,12); ctx.closePath(); ctx.fill();
    // teeth
    ctx.strokeStyle='#333'; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*5,18); ctx.lineTo(i*5,30); ctx.stroke(); }
    ctx.restore();
    ang += 0.12;
    canvas._raf = requestAnimationFrame(draw);
  }
  draw();
}

document.addEventListener('portal-ready', () => {
  if(document.querySelector('[data-junk]')) buildJunkAds();
});
