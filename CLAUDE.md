# Stamp the Past: project brief for Claude

Read this first in every session. Keep it current: update it whenever scope, rules, status or the roadmap change.

## What this is
**Stamp the Past** is a phone-first history scavenger-hunt app about real landmarks. Tagline: "Go there. Prove it. Stamp the past."
Built by Jo-Anne (builder, on-site verifier) and her 14-year-old son (tester and idea source). Public credit: "made by a mom and her teenage son". Never name the son publicly.

- Repo: `jobrandes/missions-app` (private). Test site: `stamp-the-past.netlify.app` (renamed from missions-app-test on Oct 20; auto-deploys on push to GitHub).
- Claude Artifact copy: https://claude.ai/artifact/4jha39rpChXp1cMVXRYkBs (republish after every build; the page must stay under 16 MB).
- The App Store is the eventual destination. Netlify is only for testing.

## Goals (apply to every decision)
1. Fun to build together. "We made this."
2. Unique, not a copy of an existing app. Not a Strava-style "Local Legend" feature (explicitly rejected).
3. Aim for a top App Store ranking. Eventually earns money.
4. Funny, confident tone. Sarcasm and humor welcome.
5. Go global months after the MVP (France, Mexico, Italy, etc.), so nothing may be tied to one town or an English idiom.

## Hard rules
- No weapons or tactical guidance. No surveillance. No precise location data from kids. No GPS, accounts or uploads in the MVP.
- Caden does not manage payments or accounts, and does not publish personal info.
- Jo-Anne verifies on site. Content is "written from sources, not yet checked on site" until she walks it.
- Photos: real, freely licensed photos only (Wikimedia Commons, Library of Congress, public domain). Credit every photo in `CREDITS.md` and in the stop's `ph` block. If no free photo exists, show an honest "photo pending". **Do not go live with missing photos** (her requirement, Oct 19). Never email archives or ask permission-by-email.
- In-phone missions only, not printable.
- Naming: no teen slang, no mashed-up made-up words. Domain not purchased yet. No lawyer. Claude checks App Store, domains and trademarks itself.
- Protect her Claude usage. Connect to GitHub, Netlify and Google instead of doing things by hand. Check quality and mobile and desktop responsiveness every time. She is not a developer but knows quality engineering.
- Verify facts from fetched sources, never memory. When a source disagrees with a popular claim, use the source and mark the claim "disputed" or "not true".

## How the code works
- `build.py` builds `index.html` (the Artifact fragment) and `site/` (index, `_headers`, `sw.js`, manifest, icons, privacy, support, hidden Netlify form) from `src/`. `netlify.toml` publishes `site/`.
- Packs: `src/packs/<id>.json`. Order and "coming soon" list: `src/packs/index.json`. Boss questions: `src/boss.json` (4 per pack). Photos: `src/photos/<key>.jpg` (max 640 px, q60) plus `manifest.json`. Photos are NOT embedded: the page references `photos/<key>.jpg` and they load on demand (build copies them to `site/photos/`; the Artifact publish must pass every photo in `files`, max 255 per publish). Tests wrap the page in `src/_*.html` so relative photo paths work.
- Pack schema: id, name, explorer, initials, ranks, heroKey, heroAlt, heroLi, heroCredit, mission, afterDone, safetyNote, badgeMap {stopId:[photoKey,"x% y%"]}, level, region, stops. Exactly 4 stops per town. Each stop has id, name, short, badge, tag, teaser, map, clue, safety, field, q{prompt,options,answer,hint,verify}, then{yr,label,line,ph?,link{t,u}} (link is REQUIRED), now{...,ph?}, story[], fact, disputed, claims[] (2, a: 0 solid, 1 disputed, 2 not true), sources[] (2+ https), card.
- XP: 100 per stop, 25 per claim, 600 max per town. Save code is `TN3-` plus one 12-char group per town, so the dash count equals the town count. When adding towns, bump the counts in `tests/flows.py` (town count, `code.count('-')`, and the "too many towns" test with N+1 groups).
- Validator rules: 3+ distinct correct-answer positions per pack, hint must not give the answer, boss answers not all in one slot, 4 distinct boss options.
- Home: regions are collapsible groups and rails. The passport has its own page (rail button next to Home, `onPass` state, `viewPass()`), and Home shows a teaser row. The passport is grouped by region (folds, with per-region stamp counts). The hero circles and "How it works" badges follow the current mission. "Try it from home" demo mode earns no saved stamp.
- Tests: `sh tests/run_all.sh`. If only expected screens change, accept with `python3 tests/snapshot.py index.html tests/baseline.json`.
- Commit trailers: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` and the session link.

## Photo pipeline (what works)
- LoC images: navigate the pane to the cdn.loc.gov URL (it redirects to tile.loc.gov; both need site access), then same-origin fetch of location.href and download via canvas. Commons categories can be listed cross-origin from en.wikipedia with origin=*.
- Wikimedia/LoC downloads run in the Claude app's built-in browser (Chrome JS from Apple Events is unreliable). Request site access for commons.wikimedia.org, upload.wikimedia.org, en.wikipedia.org, loc.gov.
- Search the Commons API; filter licenses to Public domain, CC0, CC BY, CC BY-SA; width at least 1000 for "now", at least 600 for old PD.
- For "then" photos the Commons keyword search is poor. Best method: on an en.wikipedia.org page, call /w/api.php with generator=images (article) or generator=categorymembers (Commons category, from a commons.wikimedia.org page) plus prop=imageinfo&iiurlwidth=960, filter license and date, fetch the thumbnail cross-origin (upload.wikimedia.org allows it), shrink on a canvas to 720 px and trigger an <a download>. Also try LoC HABS/HAER surveys and DPLA postcards.
- Download: navigate a tab to the upload.wikimedia.org 960px thumbnail, fetch same-origin, save via `<a download>`. Files land in `~/Downloads` as hidden temp files; rename by byte size, then `device_stage_files`, view a contact sheet to confirm each photo matches its stop, then resize and wire in.

## Status (Oct 20, 2026)
52 towns, 208 stops, 419 photos. **Every stop now has a free-licensed "then" and "now" photo.** Stops were swapped for landmarks that have free "then" photos: Fisher Building, Campus Martius, Saint Anthony Falls, Basilica of Saint Mary, Georgia Capitol, Atlanta Flatiron, Piedmont Park, Memphis Cotton Exchange, Fort Pulaski, Rookery, Lincoln Park Conservatory, Bradbury Building, Angels Flight, Olvera Street, Pioneer Square, Carpenters' Hall (Oct 19), then Reno Train Depot (replaced Original Arch), Cave Rock (replaced Sand Harbor) and Commons Beach (replaced Fanny Bridge) (Oct 20).
- West: Reno, Virginia City, Lake Tahoe (two packs), San Francisco, Los Angeles, Seattle, Portland, Salt Lake City, San Diego
- East: Boston, Washington DC, New York, Philadelphia, Pittsburgh, Baltimore, Providence, Gettysburg, Newport, Portland (Maine), New Haven, Burlington (VT)
- Midwest: Chicago, Detroit, Minneapolis, Cleveland, St. Louis, Milwaukee, Columbus
- South: New Orleans, Atlanta, Memphis, Savannah, Richmond, Charleston, Houston, Nashville, Louisville, Knoxville
- Southwest (new, Oct 20): Denver, Santa Fe, Phoenix, Albuquerque, Tucson, Colorado Springs, Las Vegas, Flagstaff, El Paso, San Antonio
- "Coming soon": Paris.
Some "then" photos are looser matches (labelled honestly): Providence Arcade (1958 survey photo, exterior vs interior now), Milwaukee Soldiers Home (1885 engraving), Carpenters' Hall (old plans), Pioneer Square (the street), Olvera Street (the old Plaza), Camp Richardson (survey photo), Tahoe stereoviews (Tahoe City, c. 1870s).
Also done: 4-step first-run guide (illustrated modal, Next/Back/Skip, ends by scrolling to the mission list; 'Replay the guide' link in the Home footer; seen flag `then-now-tour`), demo mode, dynamic Home hero, region-grouped passport, offline support, privacy and support pages, feedback form.


## Still to do
1. ~~Page size~~ done Oct 20: photos load as files on demand and the data is embedded once (index.html 0.4 MB, was 13.9 MB). Artifact publish needs `files` (limit 255 per publish, 511 per version, so about 500 photos total; then split or move to a CDN).
2. **Southwest** (Las Vegas done Oct 20: Fremont Street 1952, El Cortez 1940s postcard, Fifth Street School 1936, Hoover Dam 1935; photo keys use prefix lw_) (Denver, Santa Fe, Phoenix, Albuquerque, Tucson; written from sources, not yet checked on site).  Pittsburgh, Baltimore, Cleveland, St. Louis, Cincinnati, Indianapolis, Buffalo, Richmond, Charleston, Houston, Nashville, Providence, Salt Lake City, San Diego, Portland and Milwaukee done Oct 20. Hartford, Albany and Omaha scouted: too few free old photos (Hartford and Albany mostly drawings or modern photos mislabelled). Columbus and Gettysburg done Oct 20 (Gettysburg 'now' for the Wills House is an interior bedroom; Soldiers' Monument 'then' is a 1905 Detroit Photographic postcard). Scouted and too thin so far: Rochester (nothing old), Salem (Capitol 1909/1939 only), Next: Salem has only 3 good stops (Capitol 1909/1927 old capitol vs today's, Waller Hall 1868, Oregon Supreme Court Building c.1922; Kay Woolen Mill HABS are drawings only, so a 4th is needed). Louisville done Oct 20 (Galt House had only an 1891 print, so Louisville Water Tower replaced it Oct 21: 1890 tornado-ruins LoC photo vs 2024; Cave Hill had only certificates, so Union Station replaced it). Knoxville, Newport and Portland ME done Oct 20 (Newport/Portland 'then' are NYPL Detroit Publishing postcards, cropped; Portland City Hall 'then' is the 1867 hall that burned in 1908). New Haven and Burlington done Oct 20 (New Haven Green 'then' is a c.1910 postcard photo; Burlington 'then' photos are c.1930-45 Tichnor linen postcards). Jacksonville (only Hemming Park has a matching now/then) and Mobile (Spring Hill, Dauphin St, Government St need matching 'now' photos) are on hold. **Jo-Anne's note (Oct 20): the Southwest is the thinnest region, so keep scouting it.** Colorado Springs done Oct 20 (Pikes Peak 'then' is a c.1953 Tichnor postcard of the avenue; 'now' is the mountain from the highway). El Paso done Oct 21 (Union Depot 1972 white-stucco photo vs 2014 red brick, San Jacinto Plaza 1902 postcard, Hotel Paso del Norte 1913 postcard, Ysleta Mission 1936 HABS; prefix ep_). Flagstaff done Oct 21 (Lowell 1905, depot 1926, Weatherford Hotel, Walnut Canyon c.1900; photo keys prefix fg_; Monte Vista had no exterior 'then'; extra downloaded files unused). San Antonio done Oct 21 (Alamo 1922 LoC photo, San Fernando c.1910 postcard, Mission San Jose 1936 HABS, Sunset Depot postcard c.1903-24; prefix sa_; Nic Tengg c.1900 cards for Mission San Jose and Sunset Depot looked drawn, so rejected). Tulsa and Oklahoma City are too thin. Also: Little Rock and Lexington too thin; Kansas City and Dallas stay on hold (short of free old photos). Later South America (Buenos Aires or Lima) and Paris.
3. ~~App icon~~ done Oct 20 (rubber-stamp postmark with a columned landmark). Desktop layout for town and stop screens done Oct 20 (2-col stop list, 2-col story pane from 900px; phone unchanged).
4. Jo-Anne-owned: Reno on-site walk (`docs/verification-checklist.md`), confirm stampthepast.com and run the USPTO search, support email, Apple Developer account, posting for testers.
5. Later: wrap for the App Store (decided Oct 20: no login. In the native wrapper, save progress in the app's own storage (Capacitor Preferences or similar), not browser localStorage, so iOS inactivity cleanup can't wipe it; it rides along with the normal iCloud device backup. Keep the TN3 save code as a manual backup. Sign in with Apple only if cross-device sync or leaderboards are ever needed), pricing/monetization decision, more towns each month.

Other docs: `docs/roadmap.md`, `docs/name-and-launch.md`, `docs/verification-checklist.md`, `docs/tester-post.md`, `CREDITS.md`.


**Photo audit Oct 21 (Jo-Anne: photos are number one, no paintings or drawings):** all 205 then-photos reviewed. Swapped to real photos: Chicago Buckingham 1933, Gettysburg monument 1905, Philly Carpenters' Hall, New Orleans Jackson Square 1900, New Haven Green c.1910. Nashville Fort Nashborough replaced by Public Square (1892 LoC photo vs courthouse; ids square/na_ps_), Louisville Galt House replaced by Water Tower (lv_wt_). Still non-photo 'then' (need real photos): Atlanta Capitol, Milwaukee Soldiers Home, Milwaukee Auditorium, Savannah River Street. Painted-looking linen postcards to revisit: cs_pk, cl_tt, in_wm, bv_bp/cs/bl, lw_ec, tu_cc, tu_dp, sa_lf, sa_pg, de_cm, sd_mi, de_di, at_pk.

**UX batch 1 (Oct 21):** compact slim header inside a stop (no tabs/city rail), one back control (top '‹ Trail'; bottom bar only appears after step 1 as '‹ Previous step'; #barExit hidden), 'Sources' step label, 12px labels, fade on scrolling rails, no duplicate badge toast. Tests now exit stops via `.stophead [data-a=exit]`. Next: UX batch 2 (one photo block on story screen, rename Cards/Rewards/Passport, collapse empty passport towns, single locked tile) and batch 3 (home search + region cards, hero contrast, per-town mission text, tour length, slider nudge).

**UX batch 2 (Oct 21):** story screen shows one slider plus caption blocks (no repeated photos; old paired photos only when a photo is missing), tabs renamed Trail / Time Cards / Stamps, rail button 'My Passport', one combined 'N locked' tile in Time Cards, passport lists only started towns per region with a '"N not started"' line.

**UX batch 3 (Oct 21):** home town search (#townSearch filters towns, opens regions), progress ring per region, stronger hero scrim, mission card lists the town's four stops (full boilerplate only before the first stamp), unverified note shortens to one line, tour cut from 7 to 4 steps, slider nudges once per session. UX review done; remaining ideas: move hero photo credit out of the hero, tablet layout pass.
