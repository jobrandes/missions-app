# Then & Now

A phone-first scavenger-hunt mission app for towns you visit. Find a real landmark, answer a question you can only answer standing there, earn its badge, then unlock the history story and a Then/Now photo pair.

Built by Jo-Anne and Caden. First mission: downtown Reno (4 stops).

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
