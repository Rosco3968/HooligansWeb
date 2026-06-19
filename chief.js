// ===================================================================
// chief.js — Master Chief "Clippy" helper
// A little animated assistant that pops up with tips/jokes and reacts
// to what page you're on. Loaded on every page after portal.js.
// ===================================================================

(function(){
  const TIPS_GENERAL = [
    "Need a hand, Spartan? Hit JOIN up top to make your profile.",
    "Pro tip: the sponsor ads might be hiding something. Look close.",
    "GBD means go balls deep. It's basically the site's motto.",
    "Sign the guestbook. The crew remembers who showed up.",
    "Customize your profile colors — make your card actually yours.",
    "Master Chief's rule: finish the fight. Also finish your profile.",
    "Bored? Hit the Arcade and put your name on the leaderboard.",
    "Wort wort wort. (That's Elite for 'welcome to the Hooligans.')"
  ];
  const TIPS_BY_PAGE = {
    'crew.html': [
      "This is the Crew page — log in, then smash EDIT MY PROFILE.",
      "You can add up to 4 extra pics to your profile. Flex accordingly.",
      "Custom name color + card accent = peak 2003 energy."
    ],
    'arcade.html': [
      "Dino Dash: press SPACE or tap to jump. Don't die. Simple.",
      "Log in before you play or your high score won't save, Spartan.",
      "The game speeds up the longer you survive. Stay frosty."
    ],
    'chat.html': [
      "Type away — the chat's live. Drop a GIF, the boys love that.",
      "Looking for the secret room? The clue's in here somewhere...",
      "Be cool in chat. Or don't. I'm a helper, not a cop."
    ],
    'guestbook.html': [
      "Leave your mark in the guestbook. Make it unhinged.",
      "Every legend signed the book once. Your turn."
    ],
    'ads.html': [
      "These sponsors paid us in exposure. Tragic, really.",
      "One of these banners is more than an ad. Triple-tap to find out."
    ],
    'admin.html': [
      "Admin zone. With great power comes great GBD.",
      "You can change basically anything here, boss."
    ]
  };

  let bubbleTimer = null;
  let idleTimer = null;

  function buildChief(){
    if(document.getElementById('chiefWrap')) return;
    const wrap = document.createElement('div');
    wrap.id = 'chiefWrap';
    wrap.style.cssText = 'position:fixed; right:14px; bottom:14px; z-index:600; width:96px; text-align:center; user-select:none;';
    wrap.innerHTML = `
      <div id="chiefBubble" style="
        display:none; position:absolute; bottom:96px; right:0; width:210px;
        background:#fff; color:#111; border:2px solid #1b9e8f; border-radius:8px;
        padding:9px 11px; font-size:12px; line-height:1.35; text-align:left;
        box-shadow:0 4px 14px rgba(0,0,0,0.5);">
        <span id="chiefText"></span>
        <div style="position:absolute; bottom:-9px; right:30px; width:0; height:0;
          border-left:8px solid transparent; border-right:8px solid transparent; border-top:9px solid #1b9e8f;"></div>
        <span id="chiefClose" style="position:absolute; top:2px; right:6px; cursor:pointer; color:#888; font-weight:bold;">×</span>
      </div>
      <div id="chiefGuy" title="Master Chief" style="cursor:pointer; display:inline-block;">
        ${chiefSVG()}
        <div style="font-family:Impact,sans-serif; font-size:10px; color:#1b9e8f; margin-top:-4px; letter-spacing:0.5px;">CHIEF</div>
      </div>
    `;
    document.body.appendChild(wrap);

    document.getElementById('chiefGuy').addEventListener('click', ()=> say(pickTip(), true));
    document.getElementById('chiefClose').addEventListener('click', (e)=>{ e.stopPropagation(); hideBubble(); });

    // greet shortly after load, then idle-nudge occasionally
    setTimeout(()=> say(greeting(), false), 1500);
    scheduleIdle();
  }

  // A simple but recognizable Mjolnir-helmet SVG (not from any copyrighted asset — stylized original)
  function chiefSVG(){
    return `<svg width="74" height="74" viewBox="0 0 74 74" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 5px rgba(0,0,0,0.6));">
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3fae9f"/><stop offset="1" stop-color="#15695f"/>
        </linearGradient>
        <linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffd86b"/><stop offset="1" stop-color="#b8860b"/>
        </linearGradient>
      </defs>
      <!-- helmet body -->
      <path d="M37 8 C53 8 60 20 60 36 C60 52 52 62 37 62 C22 62 14 52 14 36 C14 20 21 8 37 8 Z" fill="url(#hg)" stroke="#0c3f39" stroke-width="2"/>
      <!-- side armor -->
      <path d="M14 34 C9 34 9 46 15 48 L18 40 Z" fill="#15695f" stroke="#0c3f39" stroke-width="1.5"/>
      <path d="M60 34 C65 34 65 46 59 48 L56 40 Z" fill="#15695f" stroke="#0c3f39" stroke-width="1.5"/>
      <!-- visor -->
      <path d="M24 30 C30 25 44 25 50 30 C50 41 44 46 37 46 C30 46 24 41 24 30 Z" fill="url(#vg)" stroke="#7a5200" stroke-width="1.5"/>
      <!-- visor shine -->
      <path d="M28 31 C32 28 40 28 44 30 C40 31 32 31 28 33 Z" fill="#fff6d0" opacity="0.7"/>
      <!-- top vent line -->
      <path d="M37 9 L37 24" stroke="#0c3f39" stroke-width="2"/>
    </svg>`;
  }

  function greeting(){
    if(currentUser && currentProfile){
      return `Welcome back, ${currentProfile.handle || 'Spartan'}. Ready to GBD?`;
    }
    return "Sierra 117, online. Need a hand getting started?";
  }

  function pickTip(){
    const page = (location.pathname.split('/').pop() || 'index.html');
    const pool = (TIPS_BY_PAGE[page] || []).concat(TIPS_GENERAL);
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function say(text, fromClick){
    const bubble = document.getElementById('chiefBubble');
    const txt = document.getElementById('chiefText');
    if(!bubble || !txt) return;
    txt.textContent = text;
    bubble.style.display = 'block';
    bobOnce();
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(hideBubble, fromClick ? 7000 : 6000);
    scheduleIdle();
  }
  function hideBubble(){ const b=document.getElementById('chiefBubble'); if(b) b.style.display='none'; }

  function bobOnce(){
    const guy = document.getElementById('chiefGuy');
    if(!guy) return;
    guy.animate(
      [{transform:'translateY(0)'},{transform:'translateY(-8px)'},{transform:'translateY(0)'}],
      {duration:420, easing:'ease-out'}
    );
  }

  function scheduleIdle(){
    clearTimeout(idleTimer);
    idleTimer = setTimeout(()=>{ say(pickTip(), false); }, 45000); // nudge every 45s idle
  }

  // build once portal core is ready (so currentUser/profile exist)
  if(document.readyState !== 'loading') buildChief();
  else document.addEventListener('DOMContentLoaded', buildChief);
  // re-greet on login change
  document.addEventListener('hooligan-auth', ()=>{ /* no spam; greeting handled on load */ });
})();
