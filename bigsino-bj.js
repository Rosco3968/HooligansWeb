// ===================================================================
// bigsino-bj.js — high-roller blackjack (members only)
// Felt table, animated deals, sounds, double-down. Min bet 50.
// ===================================================================

const MIN_BET = 50;
let deck=[], pHand=[], dHand=[], curBet=0, active=false, doubled=false;

function gateCheck(){
  const denied=document.getElementById('denied'), content=document.getElementById('content');
  if(currentUser && currentProfile && currentProfile.bigsinoAccess){ denied.style.display='none'; content.style.display='block'; }
  else { denied.style.display='block'; content.style.display='none'; }
}
document.addEventListener('hooligan-auth', gateCheck);
document.addEventListener('portal-ready', () => {
  gateCheck();
  document.getElementById('bjDeal').addEventListener('click', deal);
  document.getElementById('bjHit').addEventListener('click', hit);
  document.getElementById('bjStand').addEventListener('click', stand);
  document.getElementById('bjDouble').addEventListener('click', doubleDown);
});

function makeDeck(){
  const suits=['♠','♥','♦','♣'], ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const d=[]; for(const s of suits) for(const r of ranks) d.push({r,s});
  for(let i=d.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
  return d;
}
function cval(c){ if(c.r==='A') return 11; if(['K','Q','J'].includes(c.r)) return 10; return Number(c.r); }
function total(h){ let v=0,a=0; for(const c of h){ v+=cval(c); if(c.r==='A')a++; } while(v>21&&a){ v-=10; a--; } return v; }

function cardEl(c, hidden, idx){
  if(hidden) return `<div class="pcard back" style="animation-delay:${idx*0.12}s">?</div>`;
  const red=(c.s==='♥'||c.s==='♦');
  return `<div class="pcard ${red?'red':''}" style="animation-delay:${idx*0.12}s"><span class="tl">${c.r}${c.s}</span>${c.r}${c.s}<span class="br">${c.r}${c.s}</span></div>`;
}
function render(hideDealer){
  document.getElementById('dealerCards').innerHTML = dHand.map((c,i)=>cardEl(c, hideDealer && i===1, i)).join('');
  document.getElementById('playerCards').innerHTML = pHand.map((c,i)=>cardEl(c,false,i)).join('');
  document.getElementById('playerTotal').textContent = pHand.length? '('+total(pHand)+')':'';
  document.getElementById('dealerTotal').textContent = (!hideDealer && dHand.length)? '('+total(dHand)+')':'';
}
function msg(text, cls){ const m=document.getElementById('bjMsg'); m.textContent=text; m.className='bjmsg '+(cls||''); }

async function deal(){
  const bet = Math.floor(Number(document.getElementById('bjBet').value));
  if(!bet || bet < MIN_BET){ msg('minimum bet is '+MIN_BET, 'lose'); return; }
  if(getCoins() < bet){ msg('not enough coins, high roller', 'lose'); return; }
  if(!(await changeCoins(-bet))){ msg('not enough coins', 'lose'); return; }
  curBet=bet; doubled=false; deck=makeDeck(); pHand=[deck.pop(),deck.pop()]; dHand=[deck.pop(),deck.pop()]; active=true;
  if(window.SFX){ SFX.chip(); setTimeout(()=>SFX.cardDeal(),150); setTimeout(()=>SFX.cardDeal(),300); setTimeout(()=>SFX.cardDeal(),450); }
  render(true);
  msg('hit, stand, or double?');
  document.getElementById('bjHit').disabled=false;
  document.getElementById('bjStand').disabled=false;
  document.getElementById('bjDouble').disabled = (getCoins() < bet);
  document.getElementById('bjDeal').disabled=true;
  if(total(pHand)===21) stand();
}
async function hit(){
  if(!active) return;
  pHand.push(deck.pop()); if(window.SFX) SFX.cardDeal(); render(true);
  document.getElementById('bjDouble').disabled=true;
  if(total(pHand)>21){ msg('BUST! −'+curBet, 'lose'); if(window.SFX) SFX.lose(); end(); }
}
async function doubleDown(){
  if(!active || pHand.length!==2) return;
  if(getCoins() < curBet){ msg('not enough to double', 'lose'); return; }
  await changeCoins(-curBet); curBet*=2; doubled=true;
  if(window.SFX) SFX.chip();
  pHand.push(deck.pop()); if(window.SFX) SFX.cardDeal(); render(true);
  if(total(pHand)>21){ msg('BUST! −'+curBet, 'lose'); if(window.SFX) SFX.lose(); end(); }
  else stand();
}
async function stand(){
  if(!active) return;
  active=false;
  while(total(dHand)<17){ dHand.push(deck.pop()); }
  render(false);
  const pv=total(pHand), dv=total(dHand);
  if(pv>21){ msg('BUST! −'+curBet,'lose'); if(window.SFX)SFX.lose(); }
  else if(dv>21 || pv>dv){
    const isBJ=(pv===21 && pHand.length===2);
    const payout = isBJ ? Math.floor(curBet*2.5) : curBet*2;
    await changeCoins(payout);
    const net = payout-curBet;
    if(isBJ){ msg('BLACKJACK! +'+net,'win'); if(window.SFX)SFX.bigWin(); recordBigWin(net); }
    else { msg('WINNER +'+net,'win'); if(window.SFX)SFX.win(); if(net>=500) recordBigWin(net); }
  }
  else if(pv===dv){ await changeCoins(curBet); msg('PUSH','push'); if(window.SFX)SFX.push(); }
  else { msg('dealer wins −'+curBet,'lose'); if(window.SFX)SFX.lose(); }
  end();
}
function end(){
  active=false;
  document.getElementById('bjHit').disabled=true;
  document.getElementById('bjStand').disabled=true;
  document.getElementById('bjDouble').disabled=true;
  document.getElementById('bjDeal').disabled=false;
}

// record big wins for achievements (Phase 5 will surface these)
async function recordBigWin(amount){
  if(!currentProfile) return;
  try{
    currentProfile.biggestWin = Math.max(currentProfile.biggestWin||0, amount);
    if(typeof persistProfileCoins==='function') await persistProfileCoins();
  }catch(e){}
}
