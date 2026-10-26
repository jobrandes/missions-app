# Apple review: "more than a website" plan (guideline 4.2)

Why it matters: Apple can reject apps that are just a website in a frame. Written Oct 26.

## What the app already has (list this in the review notes, done)
- Everything is bundled: all towns, stories and photos work with no network.
- Progress is mirrored into native storage (StampStore plugin), so it survives web view clean-up.
- Optional background alerts: native region monitoring (StampGeo plugin) plus local notifications that open the right stop.
- On-device location check for "Visit verified".
- System share sheet for the stamp card.
- Privacy manifest (PrivacyInfo.xcprivacy), no tracking.

## Cheap additions that help the case (each needs Jo-Anne's yes first)
1. Haptic tap when a stamp is earned (Capacitor Haptics plugin, about 20 lines, needs one Xcode run to test).
2. Home-screen quick actions or a small widget showing "next stop" (bigger job; later).
3. Apple Maps "open directions" button on each stop (a link, no plugin needed).

## Review notes
Already updated in store/app-store-listing.md (now mentions the optional Always-location alerts, off by default, so the reviewer is not surprised by the permission prompt).

## Risks to watch
- The Always-location prompt is the kind of thing reviewers test. The Info.plist text must clearly say why. It does, but read it once on a device.
- If review pushes back on 4.2, turn on the haptics and directions button before resubmitting.
