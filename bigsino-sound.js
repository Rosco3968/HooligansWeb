// ===================================================================
// bigsino-sound.js — code-generated sound effects (Web Audio API)
// No files to host. Shared by all BIGSINO games.
// ===================================================================
(function(){
  let ctx = null;
  function ac(){ if(!ctx){ try{ ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return ctx; }

  function blip(freq, dur, type, vol, when){
    const c = ac(); if(!c) return;
    const t0 = c.currentTime + (when||0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type||'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol||0.18, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + (dur||0.18));
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + (dur||0.18));
  }
  function noise(dur, vol){
    const c = ac(); if(!c) return;
    const n = Math.floor(c.sampleRate * (dur||0.1));
    const buf = c.createBuffer(1, n, c.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0;i<n;i++) data[i] = (Math.random()*2-1) * Math.pow(1 - i/n, 2);
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value = vol||0.15;
    src.connect(g); g.connect(c.destination); src.start();
  }

  window.SFX = {
    cardDeal(){ noise(0.08, 0.12); blip(420, 0.06, 'square', 0.05); },
    chip(){ blip(900, 0.05, 'square', 0.08); blip(1200, 0.05, 'square', 0.06, 0.04); },
    win(){ [523,659,784,1047].forEach((f,i)=> blip(f, 0.25, 'triangle', 0.2, i*0.09)); },
    bigWin(){ [523,659,784,1047,1319,1568].forEach((f,i)=> blip(f, 0.3, 'triangle', 0.22, i*0.08));
              setTimeout(()=>[1047,1319,1568].forEach((f,i)=>blip(f,0.4,'sawtooth',0.18,i*0.1)), 500); },
    lose(){ blip(300, 0.3, 'sawtooth', 0.15); blip(200, 0.4, 'sawtooth', 0.13, 0.12); },
    push(){ blip(440, 0.2, 'sine', 0.12); },
    spin(){ for(let i=0;i<8;i++) blip(600+i*40, 0.05, 'square', 0.05, i*0.05); },
    gallop(){ noise(0.05, 0.08); },
    coinFlip(){ for(let i=0;i<6;i++) blip(800+Math.random()*400, 0.04, 'sine', 0.06, i*0.08); },
    jackpot(){ for(let i=0;i<14;i++) blip(523 + (i%7)*110, 0.18, 'square', 0.16, i*0.07); },
    click(){ blip(700, 0.04, 'square', 0.07); }
  };
})();
