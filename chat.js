// ===================================================================
// chat.js — live crew chat: text, emojis, image links, GIF search
// Messages live in the shared DB under "live_chat", updated in real time.
// ===================================================================

const CHAT_KEY = 'live_chat';
const MAX_CHAT = 120;
const EMOJIS = ['😀','😂','💀','🔥','🤘','🛹','🎸','⚡','👊','😎','🤝','🫡','🥶','💯','👀','🤙','🍻','⭐','☠️','🤟'];

// GIF search via Tenor's free public/anonymous endpoint. If it ever fails,
// users can still paste GIF links directly.
const TENOR_KEY = 'LIVDSRZULELA'; // long-standing public demo key
let chatUnsub = null;

document.addEventListener('portal-ready', () => {
  if(!document.getElementById('chatMsgs')) return;
  wireChat();
  subscribeChat();
  buildEmojiPicker();
  // secret backchannel: if arriving via the ad's hidden door
  if(location.hash === '#backchannel'){ /* reserved hook */ }
});

document.addEventListener('hooligan-auth', () => {
  const note = document.getElementById('chatLoginNote');
  const who = document.getElementById('chatWho');
  if(note) note.style.display = currentUser ? 'none' : 'block';
  if(who) who.textContent = currentUser ? ('as ' + (currentProfile?.handle||'you')) : '(read-only — log in to chat)';
});

function wireChat(){
  document.getElementById('cmsgSend').addEventListener('click', sendChat);
  document.getElementById('cmsgInput').addEventListener('keydown', e=>{ if(e.key==='Enter') sendChat(); });
  document.getElementById('emojiBtn').addEventListener('click', ()=> togglePop('emojiPop'));
  document.getElementById('gifBtn').addEventListener('click', ()=> togglePop('gifPop'));
  document.getElementById('imgBtn').addEventListener('click', promptImageLink);
  document.getElementById('gifGo').addEventListener('click', searchGifs);
  document.getElementById('gifQuery').addEventListener('keydown', e=>{ if(e.key==='Enter') searchGifs(); });
}

function togglePop(id){
  const el = document.getElementById(id);
  const other = id==='emojiPop' ? 'gifPop' : 'emojiPop';
  document.getElementById(other).classList.remove('on');
  el.classList.toggle('on');
}

function buildEmojiPicker(){
  const pop = document.getElementById('emojiPop');
  pop.innerHTML = EMOJIS.map(e=>`<span>${e}</span>`).join('');
  pop.querySelectorAll('span').forEach(s=>{
    s.addEventListener('click', ()=>{
      const input = document.getElementById('cmsgInput');
      input.value += s.textContent;
      input.focus();
    });
  });
}

function promptImageLink(){
  const url = prompt('Paste an image link (jpg/png/gif).\n\nNeed one? Upload at postimages.org or imgur.com and copy the direct image link.');
  if(url && url.trim()){ postMessage({ type:'img', url:url.trim() }); }
}

async function searchGifs(){
  const q = document.getElementById('gifQuery').value.trim();
  const box = document.getElementById('gifResults');
  if(!q){ box.innerHTML = '<span class="secret-hint">type something and hit GO</span>'; return; }
  box.innerHTML = '<span class="secret-hint">searching...</span>';
  try{
    const url = `https://g.tenor.com/v1/search?q=${encodeURIComponent(q)}&key=${TENOR_KEY}&limit=12&media_filter=minimal`;
    const res = await fetch(url);
    const data = await res.json();
    const results = (data.results||[]).map(r=>{
      const media = r.media && r.media[0];
      const gif = media && (media.tinygif || media.gif);
      return gif ? gif.url : null;
    }).filter(Boolean);
    if(results.length === 0){ box.innerHTML = '<span class="secret-hint">no gifs found. try another word, or paste a gif link via the image button.</span>'; return; }
    box.innerHTML = '';
    results.forEach(u=>{
      const img = document.createElement('img');
      img.src = u; img.loading='lazy';
      img.addEventListener('click', ()=>{ postMessage({ type:'img', url:u }); document.getElementById('gifPop').classList.remove('on'); });
      box.appendChild(img);
    });
  }catch(e){
    box.innerHTML = '<span class="secret-hint">GIF search unavailable right now — you can still paste a GIF link with the 🖼️ button.</span>';
  }
}

function sendChat(){
  const input = document.getElementById('cmsgInput');
  const text = input.value.trim();
  if(!text) return;
  postMessage({ type:'text', text });
  input.value = '';
}

async function postMessage(payload){
  if(!currentUser){ alert('log in to chat (JOIN up top).'); return; }
  try{
    const res = await window.storage.get(CHAT_KEY, true);
    let msgs = res && res.value ? JSON.parse(res.value) : [];
    msgs.push(Object.assign({
      id: 'm_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      uid: currentUser.uid,
      handle: currentProfile?.handle || 'hooligan',
      color: currentProfile?.nameColor || '#ffb000',
      title: currentProfile?.equippedTitle || null,
      flair: currentProfile?.equippedFlair || null,
      founderNum: currentProfile?.founderNum || null,
      time: Date.now()
    }, payload));
    if(msgs.length > MAX_CHAT) msgs = msgs.slice(msgs.length - MAX_CHAT);
    await window.storage.set(CHAT_KEY, JSON.stringify(msgs), true);
  }catch(e){ console.error('chat send failed', e); }
}

function subscribeChat(){
  // live updates if backend supports onChange (Firebase), else poll
  if(window.storage.onChange && window.storage.isReady && window.storage.isReady()){
    chatUnsub = window.storage.onChange(CHAT_KEY, (val)=>{
      renderChat(val ? JSON.parse(val) : []);
    });
  }else{
    setInterval(async ()=>{
      const res = await window.storage.get(CHAT_KEY, true);
      renderChat(res && res.value ? JSON.parse(res.value) : []);
    }, 3000);
  }
}

function renderChat(msgs){
  const box = document.getElementById('chatMsgs');
  if(!box) return;
  if(!msgs || msgs.length===0){ box.innerHTML = '<div class="secret-hint">it\'s quiet... say something.</div>'; return; }
  const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 20;
  box.innerHTML = msgs.map(m=>{
    const t = new Date(m.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    const delBtn = isAdmin ? `<span class="del" onclick="adminDeleteMsg('${m.id}')">[del]</span>` : '';
    const badge = (typeof titleBadgeHTML==='function' && m.title) ? titleBadgeHTML({equippedTitle:m.title, founderNum:m.founderNum}) : '';
    const flairCls = (typeof flairClass==='function' && m.flair) ? flairClass({equippedFlair:m.flair}) : '';
    let body;
    if(m.type === 'img'){
      body = `<img class="cimg" src="${escapeHtml(m.url)}" loading="lazy" onerror="this.replaceWith(document.createTextNode('[broken image link]'))">`;
    }else{
      body = escapeHtml(m.text);
    }
    return `<div class="cmsg"><span class="who ${flairCls}" style="color:${escapeHtml(m.color||'#ffb000')}">${escapeHtml(m.handle)}</span>${badge}<span class="tm">${t}</span>${delBtn}<br>${body}</div>`;
  }).join('');
  if(atBottom) box.scrollTop = box.scrollHeight;
}

async function adminDeleteMsg(id){
  if(!isAdmin) return;
  try{
    const res = await window.storage.get(CHAT_KEY, true);
    let msgs = res && res.value ? JSON.parse(res.value) : [];
    msgs = msgs.filter(m=>m.id !== id);
    await window.storage.set(CHAT_KEY, JSON.stringify(msgs), true);
  }catch(e){ console.error(e); }
}
