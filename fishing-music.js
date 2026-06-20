// ===================================================================
// fishing-music.js — gentle code-generated ambient loop (Web Audio)
// No audio files needed. Loops a soft pentatonic pad + water-ish texture.
// ===================================================================
(function(){
  let ctx=null, master=null, playing=false, nodes=[];
  let muted=false;

  function ac(){ if(!ctx){ try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); master=ctx.createGain(); master.gain.value=0.15; master.connect(ctx.destination); }catch(e){} } return ctx; }

  // soft water-ish noise bed
  function startWaterBed(){
    const c=ac(); if(!c) return;
    const bufSize=c.sampleRate*2;
    const buf=c.createBuffer(1,bufSize,c.sampleRate);
    const d=buf.getChannelData(0);
    let last=0;
    for(let i=0;i<bufSize;i++){ const w=(Math.random()*2-1); last = (last*0.96)+(w*0.04); d[i]=last*0.5; }
    const src=c.createBufferSource(); src.buffer=buf; src.loop=true;
    const filt=c.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=900;
    const g=c.createGain(); g.gain.value=0.5;
    src.connect(filt); filt.connect(g); g.connect(master);
    src.start();
    nodes.push(src);
  }

  // gentle pentatonic pad notes, looping with random gaps (calm fishing-hole vibe)
  const NOTES=[220,247,277,330,370,440,494]; // A minor pentatonic-ish
  let padTimer=null;
  function scheduleNote(){
    const c=ac(); if(!c || !playing) return;
    const f=NOTES[Math.floor(Math.random()*NOTES.length)];
    const o=c.createOscillator(), g=c.createGain();
    o.type='sine'; o.frequency.value=f;
    const t0=c.currentTime;
    g.gain.setValueAtTime(0,t0);
    g.gain.linearRampToValueAtTime(0.22,t0+1.2);
    g.gain.linearRampToValueAtTime(0,t0+4.5);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0+4.6);
    padTimer = setTimeout(scheduleNote, 2200+Math.random()*2600);
  }

  window.FishMusic = {
    start(){
      if(playing) return;
      const c=ac(); if(!c) return;
      if(c.state==='suspended') c.resume();
      playing=true;
      startWaterBed();
      scheduleNote();
    },
    stop(){
      playing=false;
      clearTimeout(padTimer);
      nodes.forEach(n=>{ try{ n.stop(); }catch(e){} });
      nodes=[];
    },
    toggleMute(){
      muted=!muted;
      if(master) master.gain.value = muted?0:0.15;
      return muted;
    },
    isMuted(){ return muted; }
  };
})();
