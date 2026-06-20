// ===================================================================
// fishing-sfx.js — sound effects for the fishing minigame (Web Audio)
// ===================================================================
(function(){
  let ctx=null;
  function ac(){ if(!ctx){ try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return ctx; }
  function tone(freq,dur,type,vol,when){
    const c=ac(); if(!c) return;
    const t0=c.currentTime+(when||0);
    const o=c.createOscillator(), g=c.createGain();
    o.type=type||'sine'; o.frequency.value=freq;
    g.gain.setValueAtTime(vol||0.2,t0);
    g.gain.exponentialRampToValueAtTime(0.001,t0+(dur||0.2));
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0+(dur||0.2));
  }
  function splashNoise(dur,vol){
    const c=ac(); if(!c) return;
    const n=Math.floor(c.sampleRate*(dur||0.3));
    const buf=c.createBuffer(1,n,c.sampleRate); const d=buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.5);
    const src=c.createBufferSource(); src.buffer=buf;
    const filt=c.createBiquadFilter(); filt.type='bandpass'; filt.frequency.value=1200;
    const g=c.createGain(); g.gain.value=vol||0.18;
    src.connect(filt); filt.connect(g); g.connect(c.destination); src.start();
  }
  window.SFXFish = {
    cast(){ tone(300,0.15,'sine',0.1); splashNoise(0.4,0.1); },
    splash(){ splashNoise(0.25,0.15); },
    miss(){ tone(200,0.3,'sawtooth',0.12); },
    reelStart(){ tone(500,0.1,'square',0.1); },
    snap(){ tone(150,0.4,'sawtooth',0.15); tone(100,0.5,'sawtooth',0.12,0.1); },
    catchFish(big){
      if(big){ [523,659,784,1047,1319].forEach((f,i)=>tone(f,0.3,'triangle',0.22,i*0.09)); }
      else{ [523,659,784].forEach((f,i)=>tone(f,0.22,'triangle',0.18,i*0.08)); }
    }
  };
})();
