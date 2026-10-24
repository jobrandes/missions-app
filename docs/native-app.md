# Native app (iPhone and Android) with Capacitor

The web app in `site/` is wrapped by Capacitor. Same code, same photos, bundled inside the app (works offline, no server).

- Bundle / application id: `com.stampthepast.app` (PERMANENT once uploaded to a store; change it in `capacitor.config.json` and re-add the platforms BEFORE the first upload if you want something else).
- Capacitor 8, iOS uses Swift Package Manager (no CocoaPods needed), Android targets API 36 (Google requires 36 for new apps from Aug 31, 2026).
- Icons and splash come from `assets/` via `npx capacitor-assets generate` (icon source: `tools/make_icon_src.py`).
- Feedback form: inside the app it posts to `https://stamp-the-past.netlify.app/` (no-cors); on the web it posts to `/`.

## Note
The iOS web files (`ios/App/App/public`) and `capacitor.config.json` are committed on purpose, and no Capacitor plugins are installed, so the Xcode project opens straight after a git clone with no npm step. Run `npm run sync` after any web change and commit the result. Re-adding a plugin means `npm install` on the Mac again.

## Commands
- `npm install` once.
- `npm run sync` = `python3 build.py && npx cap sync` (rebuild web files, copy into ios/ and android/).
- `npm run ios` opens Xcode. `npm run android` opens Android Studio.

## First iPhone run (Mac with Xcode)
1. `npm install && npm run sync`, then `npm run ios` (or open `ios/App/App.xcodeproj`).
2. In Xcode, click the App target > Signing & Capabilities > pick your Apple ID team (a free Apple ID works for testing on your own phone).
3. Plug in the iPhone, trust the computer, turn on Developer Mode (Settings > Privacy & Security), choose the phone at the top, press Run.
4. For TestFlight: paid Apple Developer account ($99/yr), Product > Archive, Distribute App > App Store Connect.

## Still to decide or do
- Progress is in the web view's localStorage. Before store release, move it to Capacitor Preferences (plugin is installed) so iOS cleanup cannot wipe it; keep the TN3 code as backup.
- Privacy policy URL for stores: `https://stamp-the-past.netlify.app/privacy.html` (move to a real domain later).
- Store listing, screenshots, Data safety / App Privacy answers, content rating (aim 13+).
