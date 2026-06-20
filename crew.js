// ===================================================================
// crew.js — profile page logic
// Renders everyone's profiles, your own editable profile, and the
// full customization editor. Admins can delete any profile.
// ===================================================================

let editingProfile = null;

// show owned trophies on a profile card
function trophyShelfHTML(p){
  if(typeof allShopItems === 'undefined') return achievementRow(p);
  const inv = p.inventory || [];
  const trophies = inv.map(id => allShopItems().find(i=>i.id===id)).filter(i=>i && i.type==='trophy');
  let html='';
  if(trophies.length){
    html += `<div class="pcard-trophies" style="margin-top:6px; font-size:18px;">${trophies.map(t=>{
      let lbl = t.icon;
      if(t.id==='l_founder' && p.founderNum) lbl = `🏆#${p.founderNum}`;
      return `<span title="${escapeHtml(t.name)}">${lbl}</span>`;
    }).join(' ')}</div>`;
  }
  html += achievementRow(p);
  return html;
}
function achievementRow(p){
  if(typeof ACHIEVEMENTS==='undefined') return '';
  const have = p.achievements || [];
  if(!have.length) return '';
  const got = ACHIEVEMENTS.filter(a=>have.includes(a.id));
  if(!got.length) return '';
  return `<div style="margin-top:5px;">${got.map(a=>`<span class="ach-badge" title="${escapeHtml(a.desc)}">${a.icon} ${escapeHtml(a.name)}</span>`).join('')}</div>`;
}

document.addEventListener('hooligan-auth', (e) => {
  refreshCrewPage();
});
document.addEventListener('portal-ready', () => {
  wireEditor();
  refreshCrewPage();
});

async function refreshCrewPage(){
  const loggedOut = document.getElementById('loggedOut');
  const myWrap = document.getElementById('myProfileWrap');
  if(!loggedOut) return;

  // show/hide the "log in" note
  if(currentUser){
    loggedOut.style.display = 'none';
    myWrap.style.display = 'block';
    renderMyProfile();
  }else{
    loggedOut.style.display = 'block';
    myWrap.style.display = 'none';
  }
  renderRoster();
}

function profileCardHTML(p, opts){
  opts = opts || {};
  const accent = p.cardAccent || '#c4161c';
  const bg = p.cardBg || '#141414';
  const nameColor = p.nameColor || '#ffb000';
  const titleBadge = (typeof titleBadgeHTML==='function') ? titleBadgeHTML(p) : '';
  const vipBadge = p.vip ? '<span class="name-badge" style="background:linear-gradient(90deg,#ffd700,#ff7a00);color:#000;">★VIP★</span>' : '';
  const flairCls = (typeof flairClass==='function') ? flairClass(p) : '';
  const pic = p.pic || 'https://placehold.co/230x170/000/c4161c?text=NO+PIC';
  const extra = (p.extraPics && p.extraPics.length)
    ? `<div class="pcard-thumbs">${p.extraPics.map(u=>`<img src="${escapeHtml(u)}" loading="lazy" onerror="this.style.display='none'">`).join('')}</div>` : '';
  const meta = [];
  if(p.favSong) meta.push(`<b>♪</b> ${escapeHtml(p.favSong)}`);
  if(p.favAnime) meta.push(`<b>▸</b> ${escapeHtml(p.favAnime)}`);
  const metaHTML = meta.length ? `<div class="pcard-meta">${meta.join('<br>')}</div>` : '';

  let buttons = '';
  if(opts.mine){
    buttons = `<button class="editbtn" onclick="openEditor()">✎ EDIT MY PROFILE</button>`;
  }else if(isAdmin){
    buttons = `<button class="delbtn" onclick="adminDeleteProfile('${escapeHtml(p.uid)}')">DELETE (ADMIN)</button>`;
  }

  return `<div class="pcard" style="box-shadow:0 0 0 1px ${accent}; background:${bg};">
    <div class="pcard-h" style="background:linear-gradient(180deg,${accent},#000); color:${nameColor};"><span class="${flairCls}">${escapeHtml(p.handle)}</span>${vipBadge}${titleBadge}${opts.mine?' <span style="font-size:10px;color:#fff;">(you)</span>':''}</div>
    <img class="pcard-pic" src="${escapeHtml(pic)}" alt="${escapeHtml(p.handle)}" onerror="this.src='https://placehold.co/230x170/000/c4161c?text=BROKEN+LINK'">
    <div class="pcard-b">
      ${p.statusText?`<div class="pcard-status">“${escapeHtml(p.statusText)}”</div>`:''}
      <div class="pcard-bio">${p.bio?escapeHtml(p.bio):'<span style="color:var(--steel-dim);font-style:italic;">no bio yet...</span>'}</div>
      ${metaHTML}
      ${typeof petBadgeHTML==='function' ? petBadgeHTML(p) : ''}
      ${trophyShelfHTML(p)}
      ${extra}
      ${buttons}
    </div>
  </div>`;
}

async function renderMyProfile(){
  const wrap = document.getElementById('myProfile');
  if(!wrap || !currentProfile) return;
  wrap.innerHTML = profileCardHTML(currentProfile, { mine:true });
}

async function renderRoster(){
  const roster = document.getElementById('roster');
  const countEl = document.getElementById('memberCount');
  if(!roster) return;
  try{
    const res = await window.storage.get('member_index', true);
    const idx = res && res.value ? JSON.parse(res.value) : {};
    const uids = Object.keys(idx);
    if(countEl) countEl.textContent = uids.length ? `(${uids.length} hooligans)` : '';
    if(uids.length === 0){
      roster.innerHTML = '<div style="color:var(--steel-dim);padding:10px;">no one has joined yet. be the first — hit JOIN up top.</div>';
      return;
    }
    // load each profile
    const profiles = await Promise.all(uids.map(async uid => {
      try{ const r = await window.storage.get('userprofile:'+uid, true); return r && r.value ? JSON.parse(r.value) : null; }
      catch(e){ return null; }
    }));
    const valid = profiles.filter(Boolean);
    // put your own first if present is handled in the "my profile" section; here show all
    roster.innerHTML = valid.map(p => profileCardHTML(p, { mine: currentUser && p.uid === currentUser.uid && false })).join('') || '<div style="color:var(--steel-dim);padding:10px;">no profiles yet.</div>';
  }catch(e){
    roster.innerHTML = '<div style="color:var(--steel-dim);padding:10px;">couldn\'t load the roster.</div>';
  }
}

// ---- editor ----
function wireEditor(){
  const close = document.getElementById('edClose');
  const cancel = document.getElementById('edCancel');
  const save = document.getElementById('edSave');
  if(close) close.addEventListener('click', closeEditor);
  if(cancel) cancel.addEventListener('click', closeEditor);
  if(save) save.addEventListener('click', saveProfileEdits);
}

function openEditor(){
  if(!currentUser || !currentProfile){ alert('log in first.'); return; }
  editingProfile = JSON.parse(JSON.stringify(currentProfile));
  document.getElementById('edHandle').value = editingProfile.handle || '';
  document.getElementById('edStatus').value = editingProfile.statusText || '';
  document.getElementById('edBio').value = editingProfile.bio || '';
  document.getElementById('edPic').value = editingProfile.pic || '';
  document.getElementById('edExtra').value = (editingProfile.extraPics||[]).join('\n');
  document.getElementById('edSong').value = editingProfile.favSong || '';
  document.getElementById('edAnime').value = editingProfile.favAnime || '';
  document.getElementById('edNameColor').value = editingProfile.nameColor || '#ffb000';
  document.getElementById('edCardBg').value = editingProfile.cardBg || '#141414';
  document.getElementById('edAccent').value = editingProfile.cardAccent || '#c4161c';
  document.getElementById('editorOv').classList.add('on');
}
function closeEditor(){ document.getElementById('editorOv').classList.remove('on'); editingProfile = null; }

async function saveProfileEdits(){
  if(!currentUser) return;
  const handle = document.getElementById('edHandle').value.trim();
  if(!handle){ alert('you need a display name.'); return; }
  const extraRaw = document.getElementById('edExtra').value.trim();
  const updated = Object.assign({}, currentProfile, {
    handle,
    statusText: document.getElementById('edStatus').value.trim(),
    bio: document.getElementById('edBio').value.trim(),
    pic: document.getElementById('edPic').value.trim(),
    extraPics: extraRaw ? extraRaw.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,4) : [],
    favSong: document.getElementById('edSong').value.trim(),
    favAnime: document.getElementById('edAnime').value.trim(),
    nameColor: document.getElementById('edNameColor').value,
    cardBg: document.getElementById('edCardBg').value,
    cardAccent: document.getElementById('edAccent').value,
    updatedAt: Date.now()
  });
  try{
    await window.storage.set('userprofile:'+currentUser.uid, JSON.stringify(updated), true);
    // keep handle in member index fresh
    await addToMemberIndex(currentUser.uid, handle);
    currentProfile = updated;
    closeEditor();
    renderMyProfile();
    renderRoster();
  }catch(e){ alert('save failed: ' + e.message); }
}

// ---- admin moderation ----
async function adminDeleteProfile(uid){
  if(!isAdmin) return;
  if(!confirm('Delete this profile? (admin action)')) return;
  try{
    await window.storage.delete('userprofile:'+uid, true);
    const res = await window.storage.get('member_index', true);
    const idx = res && res.value ? JSON.parse(res.value) : {};
    delete idx[uid];
    await window.storage.set('member_index', JSON.stringify(idx), true);
    renderRoster();
  }catch(e){ alert('delete failed: ' + e.message); }
}
