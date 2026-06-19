// ===================================================================
// guestbook.js — sign + display guestbook (anyone can sign)
// ===================================================================
const GB_KEY = 'guestbook_entries';
const GB_MAX = 80;

document.addEventListener('portal-ready', () => {
  if(!document.getElementById('gbEntries')) return;
  document.getElementById('gbSign').addEventListener('click', signGuestbook);
  loadGuestbook();
  // live refresh
  if(window.storage.onChange && window.storage.isReady && window.storage.isReady()){
    window.storage.onChange(GB_KEY, v => renderGuestbook(v ? JSON.parse(v) : []));
  }else{
    setInterval(loadGuestbook, 6000);
  }
});
document.addEventListener('hooligan-auth', () => loadGuestbook());

async function loadGuestbook(){
  try{
    const res = await window.storage.get(GB_KEY, true);
    renderGuestbook(res && res.value ? JSON.parse(res.value) : []);
  }catch(e){ renderGuestbook([]); }
}

function renderGuestbook(entries){
  const box = document.getElementById('gbEntries');
  if(!box) return;
  if(!entries || entries.length===0){ box.innerHTML = '<div style="color:var(--steel-dim);font-style:italic;">no one has signed yet. be the first.</div>'; return; }
  box.innerHTML = entries.slice().reverse().map(e=>{
    const t = new Date(e.time).toLocaleString();
    const del = isAdmin ? `<span class="gb-del" onclick="delGuestbook('${e.id}')">[del]</span>` : '';
    return `<div class="gb-entry"><b>${escapeHtml(e.name)}</b><span class="gb-time">${t}</span>${del}<br>${escapeHtml(e.msg)}</div>`;
  }).join('');
}

async function signGuestbook(){
  const name = (document.getElementById('gbName').value.trim()) || (currentProfile?.handle) || 'anonymous hooligan';
  const msg = document.getElementById('gbMsg').value.trim();
  if(!msg){ alert('write something first.'); return; }
  try{
    const res = await window.storage.get(GB_KEY, true);
    let entries = res && res.value ? JSON.parse(res.value) : [];
    entries.push({ id:'gb_'+Date.now()+'_'+Math.random().toString(36).slice(2,6), name, msg, time: Date.now() });
    if(entries.length > GB_MAX) entries = entries.slice(entries.length-GB_MAX);
    await window.storage.set(GB_KEY, JSON.stringify(entries), true);
    document.getElementById('gbMsg').value = '';
    loadGuestbook();
  }catch(e){ alert('sign failed: '+e.message); }
}

async function delGuestbook(id){
  if(!isAdmin) return;
  if(!confirm('Delete this entry?')) return;
  const res = await window.storage.get(GB_KEY, true);
  let entries = res && res.value ? JSON.parse(res.value) : [];
  entries = entries.filter(x=>x.id!==id);
  await window.storage.set(GB_KEY, JSON.stringify(entries), true);
  loadGuestbook();
}
