# Two stamp tiers: design (Oct 30, 2026)

Goal: let people who cannot get to a place still play and learn, without cheapening a stamp earned in person. Keeps "Go there. Prove it." true.

## States of a stop
1. Not started
2. **Virtual (new):** explored from home and answered the question. Outline "ink sketch" stamp, labelled "virtual".
3. **Stamped:** the existing full stamp (the player says they are there). Unchanged.
4. **Verified:** existing gold verified visit (GPS). Unchanged.
A virtual stop upgrades to a full stamp when the player later does the normal "I am here" flow.

## How it is stored (no change to the save code)
- New localStorage key `stp-virt`: {"townId:stopId": 1}, like `stp-geo`. It is mirrored to native storage automatically (all `stp-*` keys are).
- The `TN3-` save code is NOT changed: virtual stamps are not in the backup code (a restored phone loses outlines, never real stamps). Acceptable for a lighter tier.
- Real stamps (`ALL[town].done`) stay exactly as they are, so levels, badges, town completion and the boss are not affected by virtual play.

## Rewards (recommended defaults)
- Virtual stop: +25 XP, once per stop, capped so it can never beat a real stamp (100). Counts toward Explorer level only. Does NOT count toward: town completion, town rank, badges that say "stamps", trails, or the weekly streak.
- One new badge, "Armchair Explorer" (10 virtual stops), plus the upgrade prompt "You explored this from home. Go stamp it for real."
- Passport shows outline stamps in a lighter style with a "virtual" tag.

## Changes needed
- Find-it "Explore from home" flow: allow answering the question (today it is read-only preview) and save to `stp-virt` instead of discarding.
- Stamp art: outline variant (CSS/SVG).
- Passport and stop list: show state 2.
- gStats/xp: add a capped virtual XP term.
- Tests: demo no longer leaves XP at zero (update the flows test), virtual does not complete a town, upgrade path works, save code unchanged.
- Privacy and store text: no change (nothing leaves the phone).

## Open questions for Jo-Anne
1. Do virtual stops give any XP? (Default: yes, small and capped.)
2. Should virtual stops show in the Passport, or only on the stop? (Default: Passport, lighter.)
3. Do we want this before or after we see more test-card feedback? (Default: after at least a few answers, since two people have asked.)
