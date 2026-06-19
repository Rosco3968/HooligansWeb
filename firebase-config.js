// ============================================
// firebase-config.js  —  HOOLIGANS CLUBHOUSE
// ============================================
//
// This file connects the site to a free Firebase Realtime Database so that
// profiles, the guestbook, and the secret chat are SHARED and LIVE across
// everyone who visits your site.
//
// ┌─────────────────────────────────────────────────────────────┐
// │  STEP 1: Paste YOUR Firebase config between the { } below.    │
// │  You got this from console.firebase.google.com when you       │
// │  registered your web app (the "firebaseConfig" block).        │
// └─────────────────────────────────────────────────────────────┘

const firebaseConfig = {
  apiKey: "AIzaSyCafg4gnM_OQnAhQ_OR60MdjZj9vpZEx9Y",
  authDomain: "hooligans-330c6.firebaseapp.com",
  // IMPORTANT: confirm this matches the URL shown at the top of your
  // Realtime Database screen. If your database is in EUROPE, replace this
  // line with:
  // databaseURL: "https://hooligans-330c6-default-rtdb.europe-west1.firebasedatabase.app",
  databaseURL: "https://hooligans-330c6-default-rtdb.firebaseio.com",
  projectId: "hooligans-330c6",
  storageBucket: "hooligans-330c6.firebasestorage.app",
  messagingSenderId: "126294610261",
  appId: "1:126294610261:web:9b5f3da8fd0103915ddfdc"
};

// ============================================
// Everything below this line is automatic — you don't need to touch it.
// It creates a `window.storage` object with the same get/set/delete/list
// methods the rest of the site already uses, but backed by Firebase.
// ============================================

(function(){
  let db = null;
  let ready = false;
  let initError = null;

  try{
    if(firebaseConfig.apiKey && firebaseConfig.apiKey.indexOf('PASTE_') !== 0){
      firebase.initializeApp(firebaseConfig);
      db = firebase.database();
      ready = true;
    }else{
      initError = 'Firebase config not filled in yet. Open firebase-config.js and paste your keys.';
      console.warn('[Hooligans] ' + initError);
    }
  }catch(e){
    initError = e.message;
    console.error('[Hooligans] Firebase init failed:', e);
  }

  // Firebase keys can't contain . $ # [ ] / — encode storage keys so things
  // like "profile:0" and "guestbook_entries" are always safe.
  function safeKey(key){
    return encodeURIComponent(String(key)).replace(/\./g, '%2E');
  }

  function notReady(){
    return Promise.reject(new Error(initError || 'Firebase not ready'));
  }

  window.storage = {
    // get(key) -> { key, value, shared } | null
    async get(key /*, shared */){
      if(!ready) return notReady();
      const snap = await db.ref('store/' + safeKey(key)).get();
      if(snap.exists()){
        return { key, value: snap.val(), shared: true };
      }
      return null;
    },

    // set(key, value) -> { key, value, shared }
    async set(key, value /*, shared */){
      if(!ready) return notReady();
      await db.ref('store/' + safeKey(key)).set(value);
      return { key, value, shared: true };
    },

    // delete(key) -> { key, deleted, shared }
    async delete(key /*, shared */){
      if(!ready) return notReady();
      await db.ref('store/' + safeKey(key)).remove();
      return { key, deleted: true, shared: true };
    },

    // list(prefix) -> { keys, prefix, shared }
    async list(prefix /*, shared */){
      if(!ready) return notReady();
      const snap = await db.ref('store').get();
      let keys = [];
      if(snap.exists()){
        keys = Object.keys(snap.val()).map(k => decodeURIComponent(k));
        if(prefix) keys = keys.filter(k => k.startsWith(prefix));
      }
      return { keys, prefix, shared: true };
    },

    // Extra: live subscription used by the secret chat for instant updates.
    // Calls back with the parsed value whenever the key changes.
    onChange(key, callback){
      if(!ready) return () => {};
      const ref = db.ref('store/' + safeKey(key));
      const handler = ref.on('value', (snap) => {
        callback(snap.exists() ? snap.val() : null);
      });
      return () => ref.off('value', handler);
    },

    isReady(){ return ready; },
    getError(){ return initError; }
  };
})();
