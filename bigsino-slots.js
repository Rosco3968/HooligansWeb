// ===================================================================
// bigsino-slots.js — rigged Vegas slot machine
// Weighted RNG so wins are RARE but payouts are big. Min bet 25.
// ===================================================================

const SLOT_MIN = 25;
// reel symbols with WEIGHTS — high-value symbols are rare.
// The rig: each reel is rolled independently with these weights, so 3-of-a-kind
// of a rare symbol is extremely unlikely, but pays huge.
const SYMS = [
  { s:'💎', w:1 },   // rarest
  { s:'7️⃣', w:2 },
  { s:'🔔', w:4 },
  { s:'🍒', w:6 },
  { s:'🍋', w:9 },
  { s:'🍊', w:11 },
  { s:'🍇', w:13 }
];
const TOTAL_W = SYMS.reduce((a,b)=>a+b.w,0);

function rollSym(){
  let r = Math.random()*TOTAL_W;
  for(const sym of SYMS){ if(r < sym.w) return sym.s; r -= sym.w; }
  return SYMS[SYMS.length-1].s;
}

function payoutFor(a,b,c,bet){
  if(a===b && b===c){
    if(a==='💎') return {mult:100, label:'💎 MEGA JACKPOT 💎', jackpot:true};
    if(a==='7️⃣') return {mult:40, label:'LUCKY 7s!'};
    if(a==='🔔') return {mult:25, label:'TRIPLE BELL!'};
    if(a==='🍒') return {mult:15, label:'TRIPLE CHERRY!'};
    return {mult:10, label:'THREE OF A KIND!'};
  }
  // only a PAIR of the two rarest symbols pays anything (and only break-even-ish);
  // ordinary pairs pay nothing. This is what makes it genuinely rigged.
  if((a===b||b===c||a===c)){
    const pairSym = (a===b)?a : (b===c)?b : a;
    if(pairSym==='💎' || pairSym==='7️⃣') return {mult:2, label:'rare pair'};
  }
  return {mult:0, label:'no win'};
}

function gateCheck(){
  const d=document.getElementById('denied'), c=document.getElementById('content');
  if(currentUser && currentProfile && currentProfile.bigsinoAccess){ d.style.display='none'; c.style.display='block'; }
  else { d.style.display='block'; c.style.display='none'; }
}
document.addEventListener('hooligan-auth', gateCheck);
document.addEventListener('portal-ready', ()=>{
  gateCheck();
  const lever=document.getElementById('pullLever');
  if(lever) lever.addEventListener('click', pull);
});

let spinning=false;
async function pull(){
  if(spinning) return;
  const bet=Math.floor(Number(document.getElementById('slotBet').value));
  const msg=document.getElementById('slotMsg');
  if(!bet||bet<SLOT_MIN){ msg.textContent='min bet '+SLOT_MIN; msg.className='slotmsg lose'; return; }
  if(getCoins()<bet){ msg.textContent='not enough coins'; msg.className='slotmsg lose'; return; }
  if(!(await changeCoins(-bet))){ msg.textContent='not enough coins'; msg.className='slotmsg lose'; return; }

  spinning=true;
  document.getElementById('pullLever').disabled=true;
  document.getElementById('machine').classList.add('spinning');
  msg.textContent='spinning...'; msg.className='slotmsg';
  if(window.SFX) SFX.spin();

  const reels=[document.getElementById('sr0'),document.getElementById('sr1'),document.getElementById('sr2')];
  const finals=[rollSym(),rollSym(),rollSym()];

  // animate each reel, stopping one at a time
  let ticks=0;
  const iv=setInterval(()=>{ reels.forEach(r=>r.textContent=rollSym()); ticks++; if(window.SFX&&ticks%2===0)SFX.click(); }, 80);
  setTimeout(()=>{ reels[0].textContent=finals[0]; }, 700);
  setTimeout(()=>{ reels[1].textContent=finals[1]; }, 1050);
  setTimeout(()=>{
    clearInterval(iv);
    reels[2].textContent=finals[2];
    document.getElementById('machine').classList.remove('spinning');
    settle(finals, bet);
    spinning=false;
    document.getElementById('pullLever').disabled=false;
  }, 1400);
}

async function settle(finals, bet){
  const msg=document.getElementById('slotMsg');
  const res=payoutFor(finals[0],finals[1],finals[2],bet);
  if(res.mult>0){
    const win=Math.floor(bet*res.mult);
    await changeCoins(win);
    const net=win-bet;
    msg.textContent=`${res.label} +${win}`;
    msg.className='slotmsg '+(res.jackpot?'jackpot':'win');
    if(res.jackpot){ if(window.SFX)SFX.jackpot(); recordBigWin(net); }
    else if(res.mult>=8){ if(window.SFX)SFX.bigWin(); recordBigWin(net); }
    else { if(window.SFX)SFX.win(); }
  }else{
    msg.textContent='no win — pull again'; msg.className='slotmsg lose';
    if(window.SFX)SFX.lose();
  }
}

async function recordBigWin(amount){
  if(!currentProfile) return;
  try{ currentProfile.biggestWin=Math.max(currentProfile.biggestWin||0, amount); if(typeof persistProfileCoins==='function') await persistProfileCoins(); }catch(e){}
}
