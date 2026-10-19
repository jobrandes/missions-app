# Roadmap (later enhancements)

Ideas Jo-Anne and Caden want to keep, not build yet.

## Personal photo memories (album)
Let players add their own photo at a stop, like a memory or album.
- Today the app promises parents "No photo uploads". Any version of this must keep photos **on the phone only** (never uploaded) or that promise changes.
- Kids' privacy: no location data attached, strip photo metadata, no sharing feature in the first version.
- App Store: privacy answers and the privacy page must be updated before shipping it.
- Possible first version: a "Memory" slot on each completed stop, saved in the phone's own storage, shown beside the Then/Now pair.

## Regions
Home groups missions by region (The West, The East). Later: Central, South America, Europe (Paris first), and so on.

## Other
- Free "then" photos for stops still showing "photo pending".
- On-site verification of every check-in question flagged `verify`.
- Re-add "Google can't help you" copy only after questions are confirmed on site.

## Done (Oct 18)
Celebration + passport, offline mode, verified-on-site badge, "historians argue" callout, final challenge (4 questions per mission, best score saved on the phone).

## Next ideas
- First-run walkthrough (20 seconds).
- Hints that cost XP; streaks / mission of the day.
- "Local legend" card at each stop.
- Accessibility pass (text size, screen reader labels, reduced motion).

## Done while away
- First-run walkthrough (3 steps, once, skippable).
- Accessibility: keyboard focus stays inside popups; Esc closes them.
- Fixed a flaky test seed (tests now seed before load).
- Final challenge rewards: Gold/Silver/Bronze seals (4/3/2 of 4), challenge points (50 per correct, +100 perfect, counted from best score only), per-answer feedback lines and animations, Grand Historian when every town is gold.
- Next stop panel after each stop's Fact or Fiction.
- Netlify Forms enabled on the test site (Oct 19) so the report button can send.

## Oct 19: more towns + demo
- Added Chicago (Midwest), San Francisco (West) and Philadelphia (East): 12 stops, 12 challenge questions, all from sourced facts, check-in questions marked "not yet checked on site".
- Photos for the new towns are pending (honest "photo pending"). Needs free-to-use photos via Chrome/Commons.
- "Try it from home (preview)" on unstamped stops: unlocks the story without saving a stamp or points.
- Home "How it works" now shows the current mission's stop badges.
