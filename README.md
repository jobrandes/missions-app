# Stamp the Past

A phone-first scavenger-hunt mission app for towns you visit. Find a real landmark, answer a question about what is in front of you (the app does not check your location), earn its badge, then unlock the history story and a Then/Now photo pair.

Built by Jo-Anne and her teenage son. 53 towns, 4 stops each (212 stops), from Reno and Virginia City to Boston, Chicago, New Orleans and Denver. Wrapped for iPhone and Android with Capacitor (`ios/`, `android/`). See `CLAUDE.md` for the full project brief.

## Design rules
- No accounts, no uploads, no GPS, no camera. Progress lives in the browser (localStorage) with a copy/paste save code.
- No weapons or tactical content, no surveillance, no precise location data from kids.
- Every fact carries sources. Disputed claims are tagged instead of hidden.
- Every photo is freely licensed, credited on screen, and logged in `CREDITS.md`. If there is no free photo, the app says "photo pending". It never shows a stand-in.

## Files
- `index.html` is the whole app (HTML, CSS, JS, embedded photos). Open it in a browser or deploy it as a static site.
- `CREDITS.md` is the photo rights log. Update it whenever a photo is added or swapped.
- `docs/` holds the permission-request email draft and the field shot list.
- `netlify.toml` is a static-site config. Publishing is a deliberate step, so see below.

## Deploy (when ready)
Static site, no build step. On Netlify: new site from this repo, publish directory `.`. Deploying makes the app public, so decide that on purpose.

## Adding a photo
1. Check the license on the source page (public domain, CC0, CC BY, CC BY-SA are fine).
2. Resize to about 800px wide, JPEG quality ~74.
3. Add it to `PHOTOS` in `index.html`, point the stop's `ph` entry at it, and add a row to `CREDITS.md`.

I am not a lawyer. Check each license yourself.

## Project layout (rebuilt Oct 18)
```
src/head.html, body.html   page shell (title, fonts, markup)
src/styles.css             all styling (light + dark tokens)
src/app.js                 game logic (no town content in here)
src/packs/<town>.json      one file per town: stops, questions, claims, sources, ranks, photo credits
src/packs/index.json       which towns ship, in order
src/photos/*.jpg           real photos (resized), manifest.json lists them
build.py                   assembles everything into one self-contained index.html
tests/run_all.sh           build + content checks + layout checks + screen-by-screen snapshot
```
**Never edit index.html by hand.** Edit `src/`, then run `sh tests/run_all.sh`.

**Add a town:** copy `src/packs/vc.json`, edit it, add its photos to `src/photos/` and `manifest.json`, add its id to `src/packs/index.json`, run the tests. (Current limits, enforced by the tests: 4 stops per town, 2 Fact or Fiction claims per stop.)

**Add a photo:** save a resized JPEG in `src/photos/`, add its key to `manifest.json`, reference it from a stop with a full credit (`by`, `lic`, `lu`, `page`). The validator refuses a photo without a credit.
