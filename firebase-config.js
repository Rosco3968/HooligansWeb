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

  // userprofile:<uid> keys get their own real path segment (store/userprofile/<uid>)
  // instead of being percent-encoded into store/userprofile%3A<uid>. This lets the
  // database security rules say "only this uid may write this path" in one line,
  // instead of trying to pattern-match a colon out of an encoded string.
  function pathFor(key){
    const k = String(key);
    if(k.indexOf('userprofile:') === 0){
      return 'store/userprofile/' + safeKey(k.slice('userprofile:'.length));
    }
    return 'store/' + safeKey(k);
  }

  // One-time migration: profiles created before this security update live at the
  // OLD path (store/userprofile%3A<uid>). The first time each person logs in after
  // the update, silently copy their data to the NEW secure path and remove the old
  // copy, so nobody loses their coins, inventory, or profile.
  async function migrateOldProfile(uid){
    try{
      const oldRef = db.ref('store/' + safeKey('userprofile:' + uid));
      const oldSnap = await oldRef.get();
      if(oldSnap.exists()){
        const newRef = db.ref('store/userprofile/' + safeKey(uid));
        const newSnap = await newRef.get();
        if(!newSnap.exists()){
          await newRef.set(oldSnap.val());
        }
        // Note: we intentionally do NOT delete the old copy here. Once rules are
        // tightened, this account may no longer have permission to write/delete
        // the old path, and trying would throw. The orphaned old copy is harmless
        // (nothing reads from the old path anymore) and can be cleaned up later
        // from the Firebase console if you want, with no rush.
      }
    }catch(e){ console.warn('[Hooligans] profile migration skipped:', e.message); }
  }

  function notReady(){
    return Promise.reject(new Error(initError || 'Firebase not ready'));
  }

  window.storage = {
    // get(key) -> { key, value, shared } | null
    async get(key /*, shared */){
      if(!ready) return notReady();
      const snap = await db.ref(pathFor(key)).get();
      if(snap.exists()){
        return { key, value: snap.val(), shared: true };
      }
      return null;
    },

    // set(key, value) -> { key, value, shared }
    async set(key, value /*, shared */){
      if(!ready) return notReady();
      await db.ref(pathFor(key)).set(value);
      return { key, value, shared: true };
    },

    // delete(key) -> { key, deleted, shared }
    async delete(key /*, shared */){
      if(!ready) return notReady();
      await db.ref(pathFor(key)).remove();
      return { key, deleted: true, shared: true };
    },

    // list(prefix) -> { keys, prefix, shared }
    async list(prefix /*, shared */){
      if(!ready) return notReady();
      const keys = [];
      const topSnap = await db.ref('store').get();
      if(topSnap.exists()){
        const top = topSnap.val();
        for(const k of Object.keys(top)){
          if(k === 'userprofile') continue; // handled below, it's a sub-object not a leaf
          keys.push(decodeURIComponent(k));
        }
      }
      // userprofile:<uid> entries live one level deeper now
      const upSnap = await db.ref('store/userprofile').get();
      if(upSnap.exists()){
        for(const uid of Object.keys(upSnap.val())){
          keys.push('userprofile:' + decodeURIComponent(uid));
        }
      }
      return { keys: prefix ? keys.filter(k => k.startsWith(prefix)) : keys, prefix, shared: true };
    },

    // Extra: live subscription used by the secret chat for instant updates.
    // Calls back with the parsed value whenever the key changes.
    onChange(key, callback){
      if(!ready) return () => {};
      const ref = db.ref(pathFor(key));
      const handler = ref.on('value', (snap) => {
        callback(snap.exists() ? snap.val() : null);
      });
      return () => ref.off('value', handler);
    },

    isReady(){ return ready; },
    getError(){ return initError; },
    _migrateOldProfile: migrateOldProfile
  };
})();
