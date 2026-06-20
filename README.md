# THE HOOLIGANS PORTAL

A dense, early-2000s GameSpot-style portal — blended with Halo/UNSC chrome and 90s-anime energy. Real accounts, custom profiles, live chat, an arcade, a Master Chief helper, and a full admin panel. GBD.

====================================================
## SETUP (you only do this once)
====================================================

You already did most of this. Checklist:

1. Firebase project created (hooligans-330c6). ✓
2. Realtime Database enabled + Rules set to read/write true (permanent). ✓
3. Authentication -> Email/Password enabled. ✓
4. firebase-config.js has your real keys. ✓  (databaseURL = .firebaseio.com one)
5. ADMIN: in portal.js, ADMIN_EMAIL is set to Rosco3968@gmail.com.
   Sign up on the site with THAT email and you become admin automatically.

NOTE: image UPLOADS use links (paste a URL), because Firebase Storage now
forces a paid plan. Use postimages.org or imgur.com to turn a phone/PC photo
into a link, then paste it. GIFs in chat have a built-in search.

====================================================
## DEPLOY (GitHub Pages, free)
====================================================

Upload ALL these files together to a public GitHub repo, keep index.html named exactly that:

  index.html, crew.html, ads.html, chat.html, arcade.html, guestbook.html, admin.html,
  theme.css, portal.js, crew.js, arcade.js, chat.js, chief.js, guestbook.js, admin.js,
  firebase-config.js, README.md

Then: repo Settings -> Pages -> Deploy from a branch -> main -> / (root) -> Save.
Wait ~1-2 min. Your link: https://yourname.github.io/your-repo/
Share it with the crew.

====================================================
## WHAT'S ON THE SITE
====================================================

- HOME: portal hub with featured stuff, news, ads, poll.
- THE CREW: real profiles. JOIN to make an account, then EDIT MY PROFILE to
  customize EVERYTHING — handle, status, bio, profile pic, up to 4 extra pics,
  fav song, fav anime, and your card's name/background/accent COLORS.
- LIVE CHAT: real-time. Text, emoji picker, image links, and GIF SEARCH.
- ARCADE: "Dino Dash" — press SPACE / tap to jump. Your high score saves to your
  profile and the leaderboard (must be logged in).
- GUESTBOOK: anyone can sign.
- MASTER CHIEF: the helper bottom-right. Click him for tips; he gives page-specific
  advice and jokes. Custom Halo reticle cursor sitewide.
- SECRET CHAT DOOR: triple-click the skull on the "GO BALLS DEEP" sponsor ad.

====================================================
## ADMIN (you, as Rosco3968@gmail.com)
====================================================

Log in with your admin email, then click "Admin" in the top bar (or the dot in any footer).
The panel is LOCKED to your account only. Tabs:
- SITE TEXT: title, tagline, marquee, hero text, footer — applies everywhere.
- ADS: edit every sponsor banner (text, emoji, image link, colors, badge).
- MODERATION: delete any profile, guestbook entry, or chat message.

You ALSO get inline [del] buttons in chat and on the guestbook while logged in as admin.

====================================================
## NOTES
====================================================
- Admin status is by email (checked against Firebase login), not a hidden password —
  this is real account-based gating, much stronger than before.
- To change the admin email later, edit ADMIN_EMAIL at the top of portal.js.
- Realtime Database "test mode" rules: you already set them to permanent (true/true).
  That means anyone with the link can read/write — fine for a friend crew.

====================================================
## THE CASINO + SHOP (new)
====================================================

CASINO page (in the nav). All games use fake GBD coins — no real money.
- New players start with 250 coins.
- DAILY BONUS by login streak: more consecutive days = bigger bonus (caps at 100/day).
- Broke? Hit 0 and you're auto-given 10 coins.
- Games: SLOTS, BLACKJACK, WHEEL OF GBD, COIN PUSHER. Richest-Hooligans leaderboard.
- The page is intentionally cluttered with flashing fake gambling ads. Clicking one
  pops a "UH OH" window with a spinning skull and snatches 10 coins (capped, just a gag).

THE SHOP (tab on the casino page): spend coins to show off.
- TITLES/BADGES (show next to your name on profile + chat), PROFILE FLAIR (gold/RGB/
  flame/diamond name effects), and TROPHIES (shown on your profile + flex shelf).
- Some items are LIMITED / one-time (e.g. FOUNDER #1-5, the 1-of-1 Diamond Aura).
- Owned items show on your profile card, beside your name in chat, and on your flex shelf.

ADMIN: a COINS tab lets you (Rosco3968@gmail.com) hand out coins to one person or
everyone at once — your giveaway feature.

NEW FILES in this version: casino.html, casino.js, wallet.js, junk.js, shop.js
(plus all pages updated with the CASINO nav link + wallet).

====================================================
## BIGSINO — the secret high-roller room (new)
====================================================

A hidden second casino. Here's how it works:

THE DOOR: on the main CASINO page, a glowing golden 🚪 door sits bottom-left.
Click it — it swings open and a flashing black/gold BIGSINO keypad appears.
The code is 1776 (Independence Day — Chief drops the hint if you ask him,
without ever saying the number). Enter it and you're in.

FIRST ENTRY = VIP: cracking the code permanently grants a ★VIP★ badge on your
profile and unlocks the BIGSINO room for your account. Non-members who somehow
reach the pages get "ACCESS DENIED."

INSIDE BIGSINO (premium gold styling, no clutter):
- HIGH-ROLLER BLACKJACK — felt table, animated card deals, win sounds, double-down, min bet 50, blackjack pays 3:2
- VEGAS SLOTS — flashing-light cabinet, RIGGED (about a 5% win rate, ~50% RTP) so wins are rare but a 💎💎💎 jackpot pays 100×
- HORSE RACING — pick a pixel horse, bet, watch the race, payout = bet × odds (longshots pay more)
- COIN FLIP ARENA — multiplayer: post a challenge with a bet+side, another member accepts the other side, winner takes the pot. (Coins are escrowed; it's zero-sum.)
- VIP STORE — ultra-expensive, mostly limited badges/titles/name-colors/trophies (WHALE, KINGPIN, MADE MAN, Void Name 1-of-1, BIGSINO Throne 1-of-1, etc.)

ACHIEVEMENTS: auto-unlock and show on your profile + the VIP store:
- BIG HITTER (win 500+ in one bet), HIGH ROLLER (win 5000+), DINO KING (#1 Dino score),
  LOADED (hold 10k+ coins), INSIDER (found the door), COLLECTOR (own 8+ shop items).

ALL the coins are still fake GBD coins — no real money anywhere.

NEW FILES this version: bigsino.html, bigsino-blackjack.html, bigsino-slots.html,
bigsino-horses.html, bigsino-coinflip.html, bigsino-store.html, bigsino-door.js,
bigsino-bj.js, bigsino-slots.js, bigsino-horses.js, bigsino-coinflip.js,
bigsino-sound.js (plus casino.html/shop.js/wallet.js/crew.js/chat.js updated).

NOTE on the multiplayer coin flip: the money math is solid (zero-sum, no
duplication), but true real-time edge cases (two people accepting the same
challenge in the same instant) are best confirmed with live testing.

====================================================
## SECURITY UPGRADE (new)
====================================================

Your buddy was right to flag this, though one clarification: the Firebase
"API key" in firebase-config.js is NOT a secret — every Firebase site ships
it publicly in the browser, by design. That part was never the real risk.

THE REAL RISK was your database rules being wide open: "anyone can read AND
write anything." That's now tightened:

WHAT'S NOW LOCKED DOWN:
- Each person's profile (coins, inventory, bio, everything) can only be
  edited by THAT person's own logged-in account — or by your admin account
  (so giveaways and moderation still work). Before, anyone could overwrite
  ANYONE's profile via browser dev tools. That's now blocked.
- Site text, the marquee, and ad banners can ONLY be edited by your admin
  account (Rosco3968@gmail.com), even via direct database calls — not just
  through the admin panel UI.
- All shared community data (chat, guestbook, leaderboards, etc.) still
  requires being logged in to write — random strangers without an account
  can't touch anything.

WHAT THIS DOES NOT PROTECT AGAINST (being straight with you):
- A technically-skilled person can still open browser dev tools and edit
  THEIR OWN coin balance, inventory, or stats directly — e.g. give
  themselves 1,000,000 coins. Stopping that fully requires a real backend
  server validating every transaction (Cloud Functions), which is a much
  bigger project than a free static site supports. For a friend group,
  the realistic goal is stopping people from messing with EACH OTHER's
  stuff and from vandalizing the site — which this achieves.
- Chat and guestbook are stored as one shared list per page (not
  individual messages), so per-message permissions aren't possible with
  these rules — any logged-in member can technically clear the whole
  list via dev tools, same as before. Moderation (admin [del] buttons)
  is unaffected.

## HOW TO APPLY THE NEW RULES (you do this once)

1. Open console.firebase.google.com -> your hooligans-330c6 project.
2. Build -> Realtime Database -> Rules tab.
3. Select ALL the existing text in the rules box and delete it.
4. Open the new file firebase-rules.json (included in this package),
   copy its ENTIRE contents, and paste it into the Rules box.
5. Tap Publish.

That's it — no app code changes needed beyond what's already in this
package (firebase-config.js was updated to match the new rule structure,
and it automatically migrates each person's existing profile the first
time they log in after this update, so nobody loses their coins or items).

IMPORTANT: upload the updated firebase-config.js and portal.js together
with the rest of this package — they were changed specifically to work
with the new rules. Uploading the new rules WITHOUT the updated
firebase-config.js (or vice versa) could temporarily break logins, since
the old code writes to a path the new rules don't recognize as profile data.

====================================================
## ARCADE EXPANSION + PET SHOP (new)
====================================================

FISHING TRIP (Arcade): a full fishing game.
- Intro screen: pixel boat on a lake at sunset, "Fishing Trip" title.
- Three-part minigame: CAST → time a BITE (tap when the marker hits the
  green zone) → REEL it in (keep the tension bar out of the red).
- 30 fish across 5 rarities (common → legendary), real + silly ones
  (Old Boot, GBD Leviathan, Golden Chief Carp...).
- Level up as you catch — rarer fish give more XP.
- Gentle ambient music with a mute button.

CLAW MACHINE (Arcade): hot-pink "Claw King" cabinet.
- Use the joystick (or arrow keys) to line up the claw, drop to grab.
- 15 prizes from teddy bears to a Solid Gold Bear. Rarer prizes are
  "heavier" — higher chance to slip out of the claw. 5 GBD per grab.
- Music + mute.

VENDING MACHINE (Arcade): a sketchy machine under a flickering street
lamp at night (glowing pixel scene). 15 GBD gets you a random absurd
junk item — Single Wet Sock, Mystery Rock, Garden Gnome, Troll Doll,
Participation Trophy, Solid Gold Gnome, etc. Music + mute.

THE COLLECTION (Arcade → "Collection 📖"): a leather almanac book with
three tabs — FISH, CLAW PRIZES, VENDING. Everything you haven't found
yet is a blacked-out "?" silhouette; catching/winning/buying a new one
fills in its entry automatically.

THE PET SHOP (pets.html, linked from Crew nav): adopt a virtual pet that
lives on your profile card. Six hand-drawn pixel pets: Monkey, Rat, Bear
(critters) and Dragon, Goblin, Old Man (oddballs). Dragon and Old Man are
limited-stock. Your active pet shows on your profile for everyone to see;
switch anytime.

ALL game sounds are generated in the browser (no audio files to host).

NEW FILES this version:
  fishing.html, fishing-collection.html, claw.html, vending.html, pets.html,
  fishing-data.js, fishing.js, fishing-music.js, fishing-sfx.js, collection.js,
  claw-data.js, claw.js, vending-data.js, vending.js, pets-data.js, pets.js
(plus arcade.html, crew.html/crew.js, theme.css, firebase-config.js, portal.js updated)
