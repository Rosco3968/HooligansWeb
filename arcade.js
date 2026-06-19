// ===================================================================
// arcade.js — Dino Dash game + high-score leaderboard
// Scores save to the shared DB under "highscores", tied to your handle.
// ===================================================================

const HS_KEY = 'highscores';
const MAX_HS = 15;

let canvas, ctx, W, H;
let game = null;
let myHi = 0;

document.addEventListener('portal-ready', () => {
  canvas = document.getElementById('gameCanvas');
  if(!canvas) return;
  ctx = canvas.getContext('2d');
  W = canvas.width; H = canvas.height;

  document.getElementById('playBtn').addEventListener('click', startGame);

  // input
  window.addEventListener('keydown', (e)=>{
    if(e.code === 'Space' || e.code === 'ArrowUp'){
      e.preventDefault();
      if(game && game.running) game.jump();
      else startGame();
    }
  });
  canvas.addEventListener('pointerdown', (e)=>{
    e.preventDefault();
    if(game && game.running) game.jump();
    else startGame();
  });

  drawIdle();
  loadHighScores();
});

document.addEventListener('hooligan-auth', () => { loadMyHi(); });

function loadMyHi(){
  if(currentProfile && typeof currentProfile.dinoHi === 'number'){
    myHi = currentProfile.dinoHi;
  }else{ myHi = 0; }
  const el = document.getElementById('myHi'); if(el) el.textContent = myHi;
  const ss = document.getElementById('saveState');
  if(ss) ss.textContent = currentUser ? '' : '(log in to save your score)';
}

function drawIdle(){
  ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#1b9e8f'; ctx.fillRect(0, H-30, W, 2); // ground line
  ctx.fillStyle = '#ffb000';
  ctx.font = 'italic bold 22px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DINO DASH', W/2, H/2 - 6);
  ctx.fillStyle = '#cfd6e0';
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillText('press SPACE / ↑ / tap to start', W/2, H/2 + 16);
}

function startGame(){
  game = {
    running: true,
    x: 50, y: H-30, vy: 0, onGround: true,
    grav: 0.7, jumpV: -12,
    dinoSize: 22,
    obstacles: [],
    spawnT: 0, spawnGap: 90,
    speed: 5,
    score: 0,
    t: 0,
    jump(){ if(this.onGround){ this.vy = this.jumpV; this.onGround = false; } }
  };
  loop();
}

function loop(){
  if(!game || !game.running) return;
  const g = game;
  g.t++;

  // physics
  g.vy += g.grav;
  g.y += g.vy;
  const groundY = H-30;
  if(g.y >= groundY){ g.y = groundY; g.vy = 0; g.onGround = true; }

  // speed ramps up
  g.speed = 5 + Math.floor(g.t/400);

  // spawn obstacles
  g.spawnT++;
  if(g.spawnT >= g.spawnGap){
    g.spawnT = 0;
    g.spawnGap = 70 + Math.random()*60;
    const h = 18 + Math.random()*22;
    g.obstacles.push({ x: W+10, w: 12+Math.random()*12, h });
  }

  // move + cull
  for(const o of g.obstacles){ o.x -= g.speed; }
  g.obstacles = g.obstacles.filter(o => o.x + o.w > -5);

  // collision
  const dino = { x: g.x, y: g.y - g.dinoSize, w: g.dinoSize, h: g.dinoSize };
  for(const o of g.obstacles){
    const ox = o.x, oy = groundY - o.h;
    if(dino.x < ox + o.w && dino.x + dino.w > ox && dino.y < groundY && dino.y + dino.h > oy){
      return gameOver();
    }
  }

  g.score = Math.floor(g.t/3);
  document.getElementById('scoreNow').textContent = g.score;

  render();
  requestAnimationFrame(loop);
}

function render(){
  const g = game;
  ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0,0,W,H);
  // parallax speed-lines (anime touch)
  ctx.strokeStyle = 'rgba(25,211,255,0.15)';
  ctx.lineWidth = 1;
  for(let i=0;i<6;i++){
    const lx = (W - ((g.t*g.speed*0.7 + i*120) % (W+120)));
    ctx.beginPath(); ctx.moveTo(lx, 20+i*5); ctx.lineTo(lx+40, 20+i*5); ctx.stroke();
  }
  // ground
  ctx.fillStyle = '#1b9e8f'; ctx.fillRect(0, H-30, W, 2);
  // dino (a little red block "master chief-ish" helmet shape)
  const dy = g.y - g.dinoSize;
  ctx.fillStyle = '#19d3ff';
  ctx.fillRect(g.x, dy, g.dinoSize, g.dinoSize);
  ctx.fillStyle = '#ffb000';
  ctx.fillRect(g.x+4, dy+6, g.dinoSize-8, 5); // visor
  // obstacles (cacti)
  ctx.fillStyle = '#c4161c';
  for(const o of g.obstacles){ ctx.fillRect(o.x, H-30-o.h, o.w, o.h); }
  // score
  ctx.fillStyle = '#cfd6e0'; ctx.font = '12px Verdana'; ctx.textAlign='left';
  ctx.fillText('score ' + g.score, 8, 16);
}

async function gameOver(){
  game.running = false;
  const finalScore = game.score;
  // draw game over
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#c4161c'; ctx.font = 'italic bold 26px Impact'; ctx.textAlign='center';
  ctx.fillText('WASTED', W/2, H/2-4);
  ctx.fillStyle = '#cfd6e0'; ctx.font = '13px Verdana';
  ctx.fillText('score: ' + finalScore + '  —  press START to go again', W/2, H/2+18);

  // save if logged in and it's a personal best
  if(currentUser && finalScore > myHi){
    myHi = finalScore;
    document.getElementById('myHi').textContent = myHi;
    try{
      // update profile
      currentProfile.dinoHi = myHi;
      await window.storage.set('userprofile:'+currentUser.uid, JSON.stringify(currentProfile), true);
      // update leaderboard
      await submitHighScore(currentProfile.handle || 'hooligan', myHi, currentUser.uid);
      const ss = document.getElementById('saveState'); if(ss) ss.textContent = 'new personal best saved!';
    }catch(e){ console.error('score save failed', e); }
  }else if(!currentUser){
    const ss = document.getElementById('saveState'); if(ss) ss.textContent = '(log in to save your score)';
  }
}

async function submitHighScore(handle, score, uid){
  const res = await window.storage.get(HS_KEY, true);
  let scores = res && res.value ? JSON.parse(res.value) : [];
  // keep only best per uid
  const existing = scores.find(s => s.uid === uid);
  if(existing){ if(score > existing.score){ existing.score = score; existing.handle = handle; existing.at = Date.now(); } }
  else { scores.push({ uid, handle, score, at: Date.now() }); }
  scores.sort((a,b)=> b.score - a.score);
  scores = scores.slice(0, MAX_HS);
  await window.storage.set(HS_KEY, JSON.stringify(scores), true);
  loadHighScores();
}

async function loadHighScores(){
  const table = document.getElementById('hsTable');
  if(!table) return;
  try{
    const res = await window.storage.get(HS_KEY, true);
    const scores = res && res.value ? JSON.parse(res.value) : [];
    if(scores.length === 0){
      table.innerHTML = '<tr><td class="note" style="padding:10px;">no scores yet. be the first — GBD.</td></tr>';
      return;
    }
    table.innerHTML = scores.map((s,i)=>`<tr>
      <td class="rk">${i+1}</td>
      <td class="who"><b>${escapeHtml(s.handle)}</b></td>
      <td class="sc">${s.score}</td>
    </tr>`).join('');
  }catch(e){
    table.innerHTML = '<tr><td class="note" style="padding:10px;">couldn\'t load scores.</td></tr>';
  }
}
