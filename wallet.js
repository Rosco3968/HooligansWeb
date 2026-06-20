// ===================================================================
// wallet.js — GBD Coin economy (fake currency, no real money)
// Balance lives on the user's profile (profile.coins). Also mirrored to a
// "coin_leaderboard" for ranking. Loaded on pages that need coins.
//
// Rules:
//  - New players start at 250 (set when profile is created; enforced here too).
//  - Daily bonus by login STREAK: day1=20, +10 each consecutive day, cap 100.
//    Missing a day resets the streak to 1.
//  - Pity: if balance hits 0, top up to 10 automatically.
//  - Admin can grant coins to one user or everyone.
// ===================================================================

const START_COINS = 250;
const PITY_COINS = 10;
const DAILY_BASE = 20;
const DAILY_STEP = 10;
const DAILY_CAP = 100;

// in-memory mirror of the current user's wallet
let myCoins = 0;

function dayStamp(ts){ const d = new Date(ts||Date.now()); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function daysBetween(aStamp, bStamp){
  const a = new Date(aStamp), b = new Date(bStamp);
  return Math.round((b - a) / 86400000);
}

// Ensure profile has wallet fields; returns the (possibly updated) profile
function ensureWalletFields(p){
  if(typeof p.coins !== 'number') p.coins = START_COINS;
  if(typeof p.streak !== 'number') p.streak = 0;
  if(!p.lastBonus) p.lastBonus = null;
  return p;
}

async function persistProfileCoins(){
  if(!currentUser || !currentProfile) return;
  try{
    await window.storage.set('userprofile:'+currentUser.uid, JSON.stringify(currentProfile), true);
    await updateCoinLeaderboard(currentUser.uid, currentProfile.handle, currentProfile.coins);
  }catch(e){ console.error('coin persist failed', e); }
  myCoins = currentProfile.coins;
  renderCoinHud();
}

// Called on auth load: applies daily bonus / pity, refreshes HUD
async function initWalletForUser(){
  if(!currentUser || !currentProfile) return;
  ensureWalletFields(currentProfile);

  // daily streak bonus
  const today = dayStamp();
  let bonusMsg = null;
  if(currentProfile.lastBonus !== today){
    if(currentProfile.lastBonus){
      const gap = daysBetween(currentProfile.lastBonus, today);
      if(gap === 1) currentProfile.streak = (currentProfile.streak||0) + 1;
      else currentProfile.streak = 1; // missed a day (or weird clock) -> reset
    }else{
      currentProfile.streak = 1;
    }
    const bonus = Math.min(DAILY_BASE + (currentProfile.streak-1)*DAILY_STEP, DAILY_CAP);
    currentProfile.coins = (currentProfile.coins||0) + bonus;
    currentProfile.lastBonus = today;
    bonusMsg = { bonus, streak: currentProfile.streak };
  }

  // pity payout
  if((currentProfile.coins||0) <= 0){
    currentProfile.coins = PITY_COINS;
    bonusMsg = bonusMsg || { pity: true };
  }

  await persistProfileCoins();

  if(bonusMsg){
    if(bonusMsg.pity && !bonusMsg.bonus){
      coinToast(`Broke? Here's ${PITY_COINS} GBD coins. Don't blow it all at once.`);
    }else if(bonusMsg.bonus){
      coinToast(`Daily bonus: +${bonusMsg.bonus} coins! (streak: ${bonusMsg.streak} day${bonusMsg.streak>1?'s':''})`);
    }
  }
}

// spend/win helpers used by games. delta can be + or -. Returns success.
async function changeCoins(delta){
  if(!currentUser || !currentProfile) return false;
  ensureWalletFields(currentProfile);
  if(delta < 0 && currentProfile.coins + delta < 0) return false; // can't overspend
  currentProfile.coins += delta;
  // pity if they hit zero exactly
  if(currentProfile.coins <= 0) currentProfile.coins = PITY_COINS;
  await persistProfileCoins();
  return true;
}

function getCoins(){ return currentProfile ? (currentProfile.coins||0) : 0; }

// ---- leaderboard ----
async function updateCoinLeaderboard(uid, handle, coins){
  try{
    const res = await window.storage.get('coin_leaderboard', true);
    let board = res && res.value ? JSON.parse(res.value) : {};
    board[uid] = { handle, coins, at: Date.now() };
    await window.storage.set('coin_leaderboard', JSON.stringify(board), true);
  }catch(e){}
}

// ---- HUD (a little coin counter shown top of casino page) ----
function renderCoinHud(){
  const el = document.getElementById('coinHud');
  if(!el) return;
  if(currentUser){
    el.innerHTML = `💰 <b style="color:var(--amber);">${getCoins()}</b> GBD`;
  }else{
    el.innerHTML = `<span style="color:var(--steel-dim);">log in to get coins</span>`;
  }
}

function coinToast(text){
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed; top:16px; left:50%; transform:translateX(-50%); z-index:800; background:#111; color:var(--amber); border:2px solid var(--amber); font-family:Impact,sans-serif; padding:11px 18px; box-shadow:0 4px 14px rgba(0,0,0,0.6);';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 4000);
}

// ---- admin giveaway (called from admin panel) ----
async function adminGrantCoins(targetUid, amount){
  if(!isAdmin) return false;
  try{
    if(targetUid === '__ALL__'){
      const res = await window.storage.get('member_index', true);
      const idx = res && res.value ? JSON.parse(res.value) : {};
      for(const uid of Object.keys(idx)){
        const pr = await window.storage.get('userprofile:'+uid, true);
        if(pr && pr.value){
          const p = JSON.parse(pr.value);
          ensureWalletFields(p);
          p.coins += amount;
          await window.storage.set('userprofile:'+uid, JSON.stringify(p), true);
          await updateCoinLeaderboard(uid, p.handle, p.coins);
        }
      }
      // refresh own balance if affected
      if(currentUser && idx[currentUser.uid]){ const r=await window.storage.get('userprofile:'+currentUser.uid,true); if(r&&r.value){ currentProfile=JSON.parse(r.value); myCoins=currentProfile.coins; renderCoinHud(); } }
      return true;
    }else{
      const pr = await window.storage.get('userprofile:'+targetUid, true);
      if(!pr || !pr.value) return false;
      const p = JSON.parse(pr.value);
      ensureWalletFields(p);
      p.coins += amount;
      await window.storage.set('userprofile:'+targetUid, JSON.stringify(p), true);
      await updateCoinLeaderboard(targetUid, p.handle, p.coins);
      if(currentUser && targetUid === currentUser.uid){ currentProfile = p; myCoins = p.coins; renderCoinHud(); }
      return true;
    }
  }catch(e){ console.error('grant failed', e); return false; }
}

// hook into auth
document.addEventListener('hooligan-auth', async () => {
  if(currentUser && currentProfile){ await initWalletForUser(); }
  else { myCoins = 0; renderCoinHud(); }
});
