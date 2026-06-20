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
