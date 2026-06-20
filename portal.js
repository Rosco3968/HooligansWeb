// ===================================================================
// portal.js — HOOLIGANS PORTAL core engine
// Real accounts (Firebase Auth) + owned customizable profiles + admin role.
// Loaded on every page. Page-specific code lives in separate files.
// ===================================================================

// ---- The ONE admin account. Set this to YOUR email after you sign up. ----
// Whoever logs in with this email gets full admin powers automatically.
// (Change it here, re-upload portal.js. It's just an identifier, not a secret.)
const ADMIN_EMAIL = "Rosco3968@gmail.com";

// ---- Firebase handles (auth/db come from firebase-config.js having run) ----
let fbAuth = null, fbReady = false;
try{
  if(window.firebase && firebase.apps && firebase.apps.length){
    fbAuth = firebase.auth();
    fbReady = true;
  }
}catch(e){ console.warn('[portal] auth not ready', e); }

// current logged-in state
let currentUser = null;       // firebase user object or null
let currentProfile = null;    // this user's profile object or null
let isAdmin = false;

// ---- small helpers ----
function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
}
function uidKey(uid){ return 'userprofile:' + uid; }

// ===================================================================
// AUTH
// ===================================================================

function wireAuthStrip(){
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  if(loginBtn) loginBtn.addEventListener('click', doLogin);
  if(signupBtn) signupBtn.addEventListener('click', doSignup);
  const pass = document.getElementById('loginPass');
  if(pass) pass.addEventListener('keydown', e => { if(e.key === 'Enter') doLogin(); });
}

async function doSignup(){
  if(!fbReady) return alert('Login system not connected yet. Check firebase-config.js.');
  const email = (document.getElementById('loginEmail')||{}).value?.trim();
  const pass = (document.getElementById('loginPass')||{}).value;
  if(!email || !pass) return alert('Enter an email and password (6+ chars) to join.');
  if(pass.length < 6) return alert('Password needs to be at least 6 characters.');
  try{
    const cred = await fbAuth.createUserWithEmailAndPassword(email, pass);
    // seed a starter profile they fully own
    const starter = defaultProfileFor(cred.user);
    await window.storage.set(uidKey(cred.user.uid), JSON.stringify(starter), true);
    // also register them in the member index so the Crew page can list everyone
    await addToMemberIndex(cred.user.uid, starter.handle);
  }catch(e){
    alert('Could not sign up: ' + prettyAuthError(e));
  }
}

async function doLogin(){
  if(!fbReady) return alert('Login system not connected yet. Check firebase-config.js.');
  const email = (document.getElementById('loginEmail')||{}).value?.trim();
  const pass = (document.getElementById('loginPass')||{}).value;
  if(!email || !pass) return alert('Enter your email and password.');
  try{
    await fbAuth.signInWithEmailAndPassword(email, pass);
  }catch(e){
    alert('Could not log in: ' + prettyAuthError(e));
  }
}

async function doLogout(){
  if(fbReady) await fbAuth.signOut();
}

function prettyAuthError(e){
  const m = (e && e.code) || '';
  if(m.includes('email-already-in-use')) return 'that email already has an account — try logging in.';
  if(m.includes('invalid-email')) return 'that email doesn\'t look right.';
  if(m.includes('wrong-password') || m.includes('invalid-credential')) return 'wrong email or password.';
  if(m.includes('user-not-found')) return 'no account with that email — hit JOIN to make one.';
  if(m.includes('weak-password')) return 'password too weak (use 6+ characters).';
  return (e && e.message) || 'unknown error';
}

function defaultProfileFor(user){
  const handle = (user.email || 'hooligan').split('@')[0];
  return {
    uid: user.uid,
    handle: handle,
    email: user.email,
    bio: '',
    pic: '',
    extraPics: [],
    // fully-customizable look:
    nameColor: '#ffb000',
    cardBg: '#141414',
    cardAccent: '#c4161c',
    favSong: '',
    favAnime: '',
    statusText: 'just joined the Hooligans',
    layout: 'classic',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

// React to login/logout across every page
function initAuthState(){
  if(!fbReady){ renderAuthStrip(); return; }
  fbAuth.onAuthStateChanged(async (user) => {
    currentUser = user || null;
    isAdmin = !!(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if(user){
      try{
        if(window.storage && typeof window.storage._migrateOldProfile === 'function'){
          await window.storage._migrateOldProfile(user.uid);
        }
        const res = await window.storage.get(uidKey(user.uid), true);
        currentProfile = res && res.value ? JSON.parse(res.value) : defaultProfileFor(user);
      }catch(e){ currentProfile = defaultProfileFor(user); }
    }else{
      currentProfile = null;
    }
    renderAuthStrip();
    document.dispatchEvent(new CustomEvent('hooligan-auth', { detail: { user: currentUser, profile: currentProfile, isAdmin } }));
  });
}

function renderAuthStrip(){
  const strip = document.getElementById('acctStrip');
  if(!strip) return;
  if(currentUser){
    const adminBadge = isAdmin ? ' <span style="color:var(--amber);font-family:Impact,sans-serif;">[ADMIN]</span>' : '';
    strip.innerHTML = `
      <span id="acctStatus" style="color:var(--cyan);">▸ ${escapeHtml(currentProfile?.handle || currentUser.email)}${adminBadge}</span>
      <a href="crew.html" style="color:var(--steel);font-weight:bold;">My Profile</a>
      ${isAdmin ? '<a href="admin.html" style="color:var(--amber);font-weight:bold;">Admin</a>' : ''}
      <button id="logoutBtn">LOG OUT</button>
    `;
    const lo = document.getElementById('logoutBtn');
    if(lo) lo.addEventListener('click', doLogout);
  }else{
    strip.innerHTML = `
      <span id="acctStatus" style="color:var(--steel-dim);">not logged in</span>
      <input type="text" id="loginEmail" placeholder="email" />
      <input type="password" id="loginPass" placeholder="pw" />
      <button id="loginBtn">LOG IN</button>
      <button id="signupBtn" style="background:var(--teal);">JOIN</button>
    `;
    wireAuthStrip();
  }
}

// ===================================================================
// MEMBER INDEX (so Crew page can list everyone's profiles)
// ===================================================================
async function addToMemberIndex(uid, handle){
  try{
    const res = await window.storage.get('member_index', true);
    let idx = res && res.value ? JSON.parse(res.value) : {};
    idx[uid] = { handle, joinedAt: Date.now() };
    await window.storage.set('member_index', JSON.stringify(idx), true);
  }catch(e){ console.warn('member index update failed', e); }
}

// ===================================================================
// SITE CONFIG (admin-editable text/theme) — same model as before
// ===================================================================
const SITE_CONFIG_KEY = 'site_config_v2';
const defaultSiteConfig = {
  siteTitle: 'HOOLIGANS',
  siteTagline: 'go balls deep or go home\nest. whenever // GBD certified',
  marqueeText: '★ WELCOME TO THE HOOLIGANS PORTAL ★ GO BALLS DEEP OR GO HOME ★ NEW: THE ARCADE IS LIVE ★ SIGN THE GUESTBOOK ★',
  welcomeHeading: 'WELCOME TO THE PORTAL',
  welcomeBody: 'the official Hooligans HQ. claim a real profile, hit the arcade, talk live, and look closely at the sponsors — there\'s always more than meets the eye. GBD.',
  footerLine1: '© THE HOOLIGANS. ALL RIGHTS RESERVED, NOT THAT WE\'D ENFORCE THEM.',
  footerLine2: 'made with rage, nostalgia, and zero adult supervision'
};
let siteConfigCache = null;

async function loadSiteConfig(){
  try{
    const res = await window.storage.get(SITE_CONFIG_KEY, true);
    if(res && res.value){
      siteConfigCache = Object.assign({}, defaultSiteConfig, JSON.parse(res.value));
      return siteConfigCache;
    }
  }catch(e){}
  siteConfigCache = JSON.parse(JSON.stringify(defaultSiteConfig));
  return siteConfigCache;
}
function applySiteText(){
  const cfg = siteConfigCache; if(!cfg) return;
  document.querySelectorAll('[data-cfg="siteTitle"]').forEach(el=>{
    el.innerHTML = escapeHtml(cfg.siteTitle).replace(/^(.{4})(.*)$/, '$1<span class="gg">$2</span>') + '<span class="dot">.</span>';
  });
  document.querySelectorAll('[data-cfg="siteTagline"]').forEach(el=> el.innerHTML = escapeHtml(cfg.siteTagline).replace(/\n/g,'<br>'));
  document.querySelectorAll('[data-cfg="marqueeText"]').forEach(el=> el.textContent = cfg.marqueeText);
  document.querySelectorAll('[data-cfg="welcomeHeading"]').forEach(el=> el.textContent = cfg.welcomeHeading);
  document.querySelectorAll('[data-cfg="welcomeBody"]').forEach(el=> el.textContent = cfg.welcomeBody);
  document.querySelectorAll('[data-cfg="footerLine1"]').forEach(el=> el.textContent = cfg.footerLine1);
  document.querySelectorAll('[data-cfg="footerLine2"]').forEach(el=> el.textContent = cfg.footerLine2);
}

// ===================================================================
// ADS (admin-editable, supports image URL or emoji) — carried from before
// ===================================================================
const ADS_KEY = 'site_ad_banners_v3';
const defaultAds = [
  { id:'a1', bg:'linear-gradient(135deg,#c4161c,#000)', top:'GBD GEAR CO.', cap:'GO BALLS DEEP', sub:'gear for people who skip the instructions', cta:'SEND IT >>', icon:'💀', star:'GBD!', imgUrl:'', special:true },
  { id:'a2', bg:'linear-gradient(135deg,#1b9e8f,#0c5a51)', top:'DAD ROCK HQ', cap:'VINYL CLUB', sub:'classic rock you "discovered"', cta:'JOIN >>', icon:'🎸', star:'RARE', imgUrl:'' },
  { id:'a3', bg:'linear-gradient(135deg,#19d3ff,#0a4a66)', top:'CLEARANCE', cap:'GRIP BLOWOUT', sub:'bandaids sold separately', cta:'SHOP >>', icon:'🛹', star:'-90%', imgUrl:'' },
  { id:'a4', bg:'linear-gradient(135deg,#ffb000,#7a5200)', top:'HOT DROP', cap:'NU-METAL GEL', sub:'rage + red bull, now 200% louder', cta:'HYPE >>', icon:'🤘', star:'WOW!', imgUrl:'' },
  { id:'a5', bg:'linear-gradient(135deg,#9b30ff,#19d3ff)', top:'NO REFUNDS', cap:'DELINQUENT ACADEMY', sub:'throw hands like a flashback ep', cta:'ENROLL >>', icon:'⚡', star:'NEW', imgUrl:'' }
];
let adsCache = null;
async function loadAds(){
  try{
    const res = await window.storage.get(ADS_KEY, true);
    if(res && res.value){ adsCache = JSON.parse(res.value); return adsCache; }
  }catch(e){}
  adsCache = JSON.parse(JSON.stringify(defaultAds));
  return adsCache;
}
async function saveAds(){ try{ await window.storage.set(ADS_KEY, JSON.stringify(adsCache), true); }catch(e){ console.error(e); } }

function adHTML(ad){
  const art = ad.imgUrl
    ? `<img class="ad-photo" src="${escapeHtml(ad.imgUrl)}" alt="${escapeHtml(ad.cap)}" onerror="this.style.display='none';this.parentNode.querySelector('.ad-icon').style.display='inline-block';"><span class="ad-icon" style="display:none;">${ad.icon||'⭐'}</span>`
    : `<span class="ad-icon">${ad.icon||'⭐'}</span>`;
  return `<div class="ad" data-ad-id="${ad.id}">
    <div class="ad-tag">${escapeHtml(ad.top)} <span class="blink">●</span></div>
    <div class="ad-art" style="background:${ad.bg}"><span class="ad-rays"></span>${art}<span class="ad-star">${escapeHtml(ad.star||'NEW')}</span></div>
    <div class="ad-cap"><b>${escapeHtml(ad.cap)}</b><span>${escapeHtml(ad.sub)}</span><br><span class="ad-cta">${escapeHtml(ad.cta)}</span></div>
  </div>`;
}
async function renderAds(){
  await loadAds();
  document.querySelectorAll('[data-ad-slot]').forEach(slot=>{
    const c = parseInt(slot.dataset.adCount||'1',10);
    const off = parseInt(slot.dataset.adOffset||'0',10);
    let h=''; for(let i=0;i<c;i++){ h += adHTML(adsCache[(off+i)%adsCache.length]); }
    slot.innerHTML = h;
  });
}

// ===================================================================
// CUSTOM CURSOR (Halo-style reticle) — toggleable
// ===================================================================
function initCursor(){
  // a crosshair reticle as an inline SVG data-uri
  const reticle = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><circle cx='14' cy='14' r='10' fill='none' stroke='%2319d3ff' stroke-width='2'/><line x1='14' y1='0' x2='14' y2='7' stroke='%2319d3ff' stroke-width='2'/><line x1='14' y1='21' x2='14' y2='28' stroke='%2319d3ff' stroke-width='2'/><line x1='0' y1='14' x2='7' y2='14' stroke='%2319d3ff' stroke-width='2'/><line x1='21' y1='14' x2='28' y2='14' stroke='%2319d3ff' stroke-width='2'/><circle cx='14' cy='14' r='2' fill='%23ffb000'/></svg>\") 14 14, crosshair";
  document.body.style.cursor = reticle;
}

// ===================================================================
// INIT
// ===================================================================
document.addEventListener('DOMContentLoaded', async () => {
  if(window.storage && window.storage.isReady && !window.storage.isReady()){
    const bar = document.createElement('div');
    bar.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9999;background:#c4161c;color:#fff;font-family:Verdana;font-size:12px;padding:8px;text-align:center;';
    bar.textContent='Shared database not connected — paste your keys into firebase-config.js (see README).';
    document.body.prepend(bar);
  }
  await loadSiteConfig();
  applySiteText();
  renderAds();
  initCursor();
  wireAuthStrip();
  initAuthState();

  // highlight active nav
  const path = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.topnav a').forEach(a=>{ if(a.getAttribute('href')===path) a.classList.add('active'); });

  // admin dot
  const adminLink = document.getElementById('adminLink');
  if(adminLink) adminLink.addEventListener('click', ()=> location.href='admin.html');

  // let page-specific scripts know the core is ready
  document.dispatchEvent(new CustomEvent('portal-ready'));
});
