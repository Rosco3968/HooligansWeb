// ===================================================================
// admin.js — admin control panel (gated to the admin account)
// Edit site text, ad banners, and moderate profiles/guestbook/chat.
// ===================================================================

document.addEventListener('hooligan-auth', () => { gateCheck(); });
document.addEventListener('portal-ready', () => { gateCheck(); });

function gateCheck(){
  const gate = document.getElementById('adminGate');
  const panel = document.getElementById('adminPanel');
  const msg = document.getElementById('gateMsg');
  if(!gate) return;
  if(currentUser && isAdmin){
    gate.style.display = 'none';
    panel.style.display = 'block';
    aTab('text');
  }else{
    gate.style.display = 'block';
    panel.style.display = 'none';
    if(currentUser && !isAdmin) msg.textContent = 'That account is not the admin. Log in with the admin account.';
  }
}

function aTab(tab){
  document.querySelectorAll('.atab').forEach(b=> b.classList.toggle('on', b.dataset.tab===tab));
  document.querySelectorAll('.apanel').forEach(p=> p.classList.toggle('on', p.id==='ap-'+tab));
  if(tab==='text') fillText();
  if(tab==='ads') fillAds();
  if(tab==='coins') fillCoins();
  if(tab==='mod') fillMod();
}

// ---- site text ----
function fillText(){
  const c = siteConfigCache; if(!c) return;
  document.getElementById('cTitle').value = c.siteTitle;
  document.getElementById('cTagline').value = c.siteTagline;
  document.getElementById('cMarquee').value = c.marqueeText;
  document.getElementById('cWelcomeH').value = c.welcomeHeading;
  document.getElementById('cWelcomeB').value = c.welcomeBody;
  document.getElementById('cFoot1').value = c.footerLine1;
  document.getElementById('cFoot2').value = c.footerLine2;
}
async function saveText(){
  const c = siteConfigCache;
  c.siteTitle = document.getElementById('cTitle').value.trim() || c.siteTitle;
  c.siteTagline = document.getElementById('cTagline').value;
  c.marqueeText = document.getElementById('cMarquee').value;
  c.welcomeHeading = document.getElementById('cWelcomeH').value;
  c.welcomeBody = document.getElementById('cWelcomeB').value;
  c.footerLine1 = document.getElementById('cFoot1').value;
  c.footerLine2 = document.getElementById('cFoot2').value;
  try{
    await window.storage.set(SITE_CONFIG_KEY, JSON.stringify(c), true);
    applySiteText();
    toast('Site text saved.');
  }catch(e){ toast('Save failed: '+e.message, true); }
}

// ---- ads ----
async function fillAds(){
  await loadAds();
  const wrap = document.getElementById('adEditors');
  wrap.innerHTML = adsCache.map(ad=>`
    <div class="adblock" data-id="${ad.id}">
      <div class="ttl">${escapeHtml(ad.id)}${ad.special?' ★ (holds the secret door)':''}</div>
      <div class="fg"><label>Top label</label><input type="text" data-f="top" value="${escapeHtml(ad.top)}"></div>
      <div class="fg"><label>Headline</label><input type="text" data-f="cap" value="${escapeHtml(ad.cap)}"></div>
      <div class="fg"><label>Subtext</label><input type="text" data-f="sub" value="${escapeHtml(ad.sub)}"></div>
      <div class="fg"><label>Button text</label><input type="text" data-f="cta" value="${escapeHtml(ad.cta)}"></div>
      <div class="fg"><label>Image link (blank = emoji)</label><input type="text" data-f="imgUrl" value="${escapeHtml(ad.imgUrl||'')}"></div>
      <div class="fg"><label>Emoji (fallback)</label><input type="text" data-f="icon" value="${escapeHtml(ad.icon||'')}"></div>
      <div class="fg"><label>Star badge text</label><input type="text" data-f="star" value="${escapeHtml(ad.star||'')}"></div>
      <div class="fg"><label>Background (CSS gradient/color)</label><input type="text" data-f="bg" value="${escapeHtml(ad.bg)}"></div>
    </div>`).join('');
}
async function saveAdsAdmin(){
  document.querySelectorAll('#adEditors .adblock').forEach(block=>{
    const ad = adsCache.find(a=>a.id===block.dataset.id);
    if(!ad) return;
    block.querySelectorAll('[data-f]').forEach(inp=>{ ad[inp.dataset.f] = inp.value; });
  });
  try{ await saveAds(); toast('Ads saved.'); }catch(e){ toast('Save failed', true); }
}

// ---- coins giveaway ----
async function fillCoins(){
  const sel = document.getElementById('coinTarget');
  const bal = document.getElementById('coinBalances');
  try{
    const res = await window.storage.get('member_index', true);
    const idx = res && res.value ? JSON.parse(res.value) : {};
    const uids = Object.keys(idx);
    sel.innerHTML = '<option value="__ALL__">★ EVERYONE</option>' +
      uids.map(u=>`<option value="${u}">${escapeHtml(idx[u].handle||u)}</option>`).join('');
    const lbRes = await window.storage.get('coin_leaderboard', true);
    const board = lbRes && lbRes.value ? JSON.parse(lbRes.value) : {};
    const arr = Object.values(board).sort((a,b)=>b.coins-a.coins);
    bal.innerHTML = arr.length
      ? arr.map(e=>`<div class="arow"><div class="info"><b style="color:#fff;">${escapeHtml(e.handle||'?')}</b></div><div style="color:var(--amber);font-family:Impact,sans-serif;">${e.coins} 💰</div></div>`).join('')
      : '<div style="color:var(--steel-dim);">no players yet.</div>';
  }catch(e){ sel.innerHTML='<option>couldn\'t load</option>'; }
}

async function adminGiveCoins(){
  const target = document.getElementById('coinTarget').value;
  const amount = Math.floor(Number(document.getElementById('coinAmount').value));
  if(!amount || amount === 0){ toast('Enter an amount', true); return; }
  const ok = await adminGrantCoins(target, amount);
  if(ok){
    toast(target==='__ALL__' ? `Gave ${amount} coins to everyone!` : `Gave ${amount} coins.`);
    document.getElementById('coinAmount').value='';
    fillCoins();
  }else{ toast('Giveaway failed', true); }
}

// ---- moderation ----
async function fillMod(){
  // profiles
  const pWrap = document.getElementById('modProfiles');
  try{
    const res = await window.storage.get('member_index', true);
    const idx = res && res.value ? JSON.parse(res.value) : {};
    const uids = Object.keys(idx);
    if(!uids.length){ pWrap.innerHTML = '<div style="color:var(--steel-dim);">no profiles yet.</div>'; }
    else{
      pWrap.innerHTML = uids.map(uid=>`<div class="arow"><div class="info"><b style="color:#fff;">${escapeHtml(idx[uid].handle||uid)}</b></div><button onclick="modDelProfile('${uid}')">DELETE</button></div>`).join('');
    }
  }catch(e){ pWrap.innerHTML = '<div style="color:var(--steel-dim);">couldn\'t load.</div>'; }

  // guestbook
  const gWrap = document.getElementById('modGuestbook');
  try{
    const res = await window.storage.get('guestbook_entries', true);
    const entries = res && res.value ? JSON.parse(res.value) : [];
    if(!entries.length){ gWrap.innerHTML = '<div style="color:var(--steel-dim);">no entries.</div>'; }
    else{
      gWrap.innerHTML = entries.slice().reverse().map(en=>`<div class="arow"><div class="info"><b style="color:#fff;">${escapeHtml(en.name)}</b>: ${escapeHtml(en.msg)}</div><button onclick="modDelGuest('${en.id}')">DELETE</button></div>`).join('');
    }
  }catch(e){ gWrap.innerHTML = '<div style="color:var(--steel-dim);">couldn\'t load.</div>'; }

  // chat
  const cWrap = document.getElementById('modChat');
  try{
    const res = await window.storage.get('live_chat', true);
    const msgs = res && res.value ? JSON.parse(res.value) : [];
    if(!msgs.length){ cWrap.innerHTML = '<div style="color:var(--steel-dim);">no messages.</div>'; }
    else{
      cWrap.innerHTML = msgs.slice().reverse().slice(0,40).map(m=>`<div class="arow"><div class="info"><b style="color:#fff;">${escapeHtml(m.handle)}</b>: ${m.type==='img'?'[image]':escapeHtml(m.text||'')}</div><button onclick="modDelChat('${m.id}')">DELETE</button></div>`).join('');
    }
  }catch(e){ cWrap.innerHTML = '<div style="color:var(--steel-dim);">couldn\'t load.</div>'; }
}

async function modDelProfile(uid){
  if(!isAdmin || !confirm('Delete this profile?')) return;
  await window.storage.delete('userprofile:'+uid, true);
  const res = await window.storage.get('member_index', true);
  const idx = res && res.value ? JSON.parse(res.value) : {};
  delete idx[uid]; await window.storage.set('member_index', JSON.stringify(idx), true);
  fillMod();
}
async function modDelGuest(id){
  if(!isAdmin || !confirm('Delete this guestbook entry?')) return;
  const res = await window.storage.get('guestbook_entries', true);
  let e = res && res.value ? JSON.parse(res.value) : [];
  e = e.filter(x=>x.id!==id); await window.storage.set('guestbook_entries', JSON.stringify(e), true);
  fillMod();
}
async function modDelChat(id){
  if(!isAdmin || !confirm('Delete this chat message?')) return;
  const res = await window.storage.get('live_chat', true);
  let m = res && res.value ? JSON.parse(res.value) : [];
  m = m.filter(x=>x.id!==id); await window.storage.set('live_chat', JSON.stringify(m), true);
  fillMod();
}

function toast(text, bad){
  const t = document.createElement('div');
  t.style.cssText = `position:fixed; top:16px; right:16px; z-index:800; background:${bad?'#c4161c':'#1b9e8f'}; color:#fff; font-family:Impact,sans-serif; padding:11px 16px; border:1px solid #000; box-shadow:0 3px 10px rgba(0,0,0,0.5);`;
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 2200);
}
