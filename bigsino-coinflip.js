// ===================================================================
// bigsino-coinflip.js — multiplayer head-to-head coin flip (members only)
//
// Flow:
//  - Creator posts a challenge: their bet is DEDUCTED now (escrowed into the pot).
//    Challenge stored under coinflip_challenges/<id> {creator, handle, bet, side, status:'open'}.
//  - Another player ACCEPTS: their bet is deducted, the flip is resolved with a
//    shared random result, winner is paid the full pot (2×bet), status:'done'.
//  - Both clients watch the challenge list live; when a challenge they're in
//    resolves, they see the animation + result.
//  - Creator can CANCEL an open (unjoined) challenge to get their escrow back.
//
// Safeguards: a player can't accept their own challenge; accept is guarded so
// two people can't both grab the same one (first write wins, others see it gone).
// ===================================================================

const FLIP_MIN = 50;
const CF_KEY = 'coinflip_challenges';
let cfUnsub = null;
let watchingResultFor = null; // challenge id we're awaiting animation on

function gateCheck(){
  const d=document.getElementById('denied'), c=document.getElementById('content');
  if(currentUser && currentProfile && currentProfile.bigsinoAccess){ d.style.display='none'; c.style.display='block'; startWatch(); }
  else { d.style.display='block'; c.style.display='none'; }
}
document.addEventListener('hooligan-auth', gateCheck);
document.addEventListener('portal-ready', ()=>{
  gateCheck();
  const cc=document.getElementById('createChal'); if(cc) cc.addEventListener('click', createChallenge);
});

function startWatch(){
  if(cfUnsub) return;
  if(window.storage.onChange && window.storage.isReady && window.storage.isReady()){
    cfUnsub = window.storage.onChange(CF_KEY, (val)=>{ renderChallenges(val?JSON.parse(val):{}); });
  }else{
    setInterval(async ()=>{ const r=await window.storage.get(CF_KEY,true); renderChallenges(r&&r.value?JSON.parse(r.value):{}); }, 2500);
  }
}

async function loadChallenges(){
  const r = await window.storage.get(CF_KEY, true);
  return r && r.value ? JSON.parse(r.value) : {};
}
async function saveChallenges(obj){ await window.storage.set(CF_KEY, JSON.stringify(obj), true); }

async function createChallenge(){
  const bet = Math.floor(Number(document.getElementById('flipBet').value));
  const side = document.getElementById('flipSide').value;
  if(!bet || bet < FLIP_MIN){ flipMsg('min bet '+FLIP_MIN, 'lose'); return; }
  if(getCoins() < bet){ flipMsg('not enough coins', 'lose'); return; }
  if(!(await changeCoins(-bet))){ flipMsg('not enough coins', 'lose'); return; }

  const challenges = await loadChallenges();
  const id = 'cf_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  challenges[id] = {
    id, creator: currentUser.uid, handle: currentProfile.handle || 'hooligan',
    bet, side, status:'open', createdAt: Date.now()
  };
  await saveChallenges(challenges);
  flipMsg('challenge posted — waiting for an opponent...', 'wait');
}

async function acceptChallenge(id){
  let challenges = await loadChallenges();
  const ch = challenges[id];
  if(!ch || ch.status!=='open'){ flipMsg('that challenge is gone', 'lose'); return; }
  if(ch.creator === currentUser.uid){ flipMsg("can't accept your own challenge", 'lose'); return; }
  if(getCoins() < ch.bet){ flipMsg('not enough coins for that bet', 'lose'); return; }

  // claim it (first-write-wins guard): re-read and check still open
  challenges = await loadChallenges();
  if(!challenges[id] || challenges[id].status!=='open'){ flipMsg('someone beat you to it', 'lose'); return; }

  if(!(await changeCoins(-ch.bet))){ flipMsg('not enough coins', 'lose'); return; }

  // resolve the flip
  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  const creatorWins = (ch.side === result);
  const pot = ch.bet * 2;

  challenges[id].status = 'done';
  challenges[id].joiner = currentUser.uid;
  challenges[id].joinerHandle = currentProfile.handle || 'hooligan';
  challenges[id].result = result;
  challenges[id].winnerUid = creatorWins ? ch.creator : currentUser.uid;
  challenges[id].resolvedAt = Date.now();
  await saveChallenges(challenges);

  // pay out: if joiner (me) won, credit pot now; creator gets paid by their own client watcher
  if(!creatorWins){
    await changeCoins(pot);
  }
  // record big win for achievements
  if(challenges[id].winnerUid === currentUser.uid && (pot-ch.bet)>=500) recordBigWin(pot-ch.bet);

  // animate locally
  animateFlip(result, challenges[id].winnerUid === currentUser.uid, pot - ch.bet);
}

async function cancelChallenge(id){
  const challenges = await loadChallenges();
  const ch = challenges[id];
  if(!ch || ch.creator !== currentUser.uid || ch.status!=='open') return;
  // refund escrow
  await changeCoins(ch.bet);
  delete challenges[id];
  await saveChallenges(challenges);
  flipMsg('challenge cancelled, bet refunded', 'wait');
}

// When a challenge the CREATOR posted gets resolved, their client pays them if they won
const creditedDone = {}; // avoid double-credit
async function renderChallenges(challenges){
  const list = document.getElementById('challengeList');
  if(!list) return;
  const arr = Object.values(challenges||{});

  // handle resolutions involving me as CREATOR (pay if won, show result)
  for(const ch of arr){
    if(ch.status==='done' && ch.creator===currentUser.uid && !creditedDone[ch.id]){
      creditedDone[ch.id] = true;
      const iWon = ch.winnerUid===currentUser.uid;
      if(iWon){ await changeCoins(ch.bet*2); if((ch.bet)>=500) recordBigWin(ch.bet); }
      animateFlip(ch.result, iWon, ch.bet);
      // clean up done challenge after showing
      setTimeout(async ()=>{ const c=await loadChallenges(); delete c[ch.id]; await saveChallenges(c); }, 4000);
    }
  }

  // render only OPEN challenges
  const open = arr.filter(c=>c.status==='open').sort((a,b)=>a.createdAt-b.createdAt);
  if(!open.length){ list.innerHTML = '<div class="empty">no open challenges. post one above!</div>'; return; }
  list.innerHTML = open.map(ch=>{
    const mine = ch.creator===currentUser.uid;
    const otherSide = ch.side==='heads'?'tails':'heads';
    return `<div class="chal">
      <div class="info"><b>${escapeHtml(ch.handle)}</b> bet <b>${ch.bet}</b> on <span class="side">${ch.side.toUpperCase()}</span></div>
      ${mine
        ? `<button class="gbtn red" onclick="cancelChallenge('${ch.id}')">CANCEL</button>`
        : `<button class="gbtn" onclick="acceptChallenge('${ch.id}')">TAKE ${otherSide.toUpperCase()} (${ch.bet})</button>`}
    </div>`;
  }).join('');
}

function animateFlip(result, iWon, net){
  const coin = document.getElementById('coin');
  const msg = document.getElementById('flipResult');
  coin.classList.add('flipping');
  if(window.SFX) SFX.coinFlip();
  msg.textContent = 'flipping...'; msg.className='coin-result wait';
  setTimeout(()=>{
    coin.classList.remove('flipping');
    coin.textContent = result==='heads'?'H':'T';
    if(iWon){ msg.textContent = `${result.toUpperCase()}! YOU WIN +${net}`; msg.className='coin-result win'; if(window.SFX) (net>=500?SFX.bigWin():SFX.win()); }
    else { msg.textContent = `${result.toUpperCase()}. you lost.`; msg.className='coin-result lose'; if(window.SFX) SFX.lose(); }
  }, 1800);
}

function flipMsg(text, cls){ const m=document.getElementById('flipResult'); if(m){ m.textContent=text; m.className='coin-result '+(cls||''); } }

async function recordBigWin(amount){
  if(!currentProfile) return;
  try{ currentProfile.biggestWin=Math.max(currentProfile.biggestWin||0, amount); if(typeof persistProfileCoins==='function') await persistProfileCoins(); }catch(e){}
}
