# Google Play listing (draft, Oct 24, 2026)

Reuses the App Store text (`app-store-listing.md`). Items marked **[YOU]** need Jo-Anne. Play is later: a new personal developer account needs 12 testers opted in for 14 days before it can publish to production.

| Field | Limit | Text |
|---|---|---|
| App name | 30 | Stamp the Past |
| Short description | 80 | Real places, then and now. Find landmarks and stamp your history passport. |
| Category | | Travel & Local (alternative: Education) |
| Tags | | Travel, Education, Trivia |
| Contact email | | **[YOU]** the support Gmail |
| Website | | the real domain |
| Privacy policy URL | | **[YOU]** domain /privacy |

**Full description (max 4000):** use the App Store description verbatim (about 1,900 characters). Replace "iPhone" wording if any.

## Data safety form
- Data collected: **Yes**, only through the optional "Something wrong?" form.
  - Email address (optional, typed by the player), purpose App functionality, not shared, not required.
  - Other messages (the report text), purpose App functionality, not shared, not required.
- Data shared with third parties: **No**.
- Security: data in transit is encrypted (HTTPS). Users can ask for deletion by email (support page). 
- No location, no device IDs, no ads, no analytics.

## Content rating (IARC questionnaire)
Answer honestly. Expect a low rating (for everyone or 10+). History text mentions battles and a massacre in a line or two. No gambling game (casinos appear only as landmarks), no user content, no purchases.

## Target audience
Choose 13+ or "all ages except children under 13" unless you want the stricter Families policy. Families adds review work and ad rules. Recommendation: **13 and older** for 1.0, since there is no account or chat anyway.

## Other
- Ads: **No**. In-app purchases: **No** (for now).
- App access: all functionality available without login.
- Target API level: 36 (set). Build: GitHub Actions makes the bundle; signing key needed **[YOU, later]**.
- Screenshots: phone screenshots required (min 2, 16:9 to 9:16). Reuse `store/screenshots-iphone/` cropped, or retake from an Android emulator later. Feature graphic: `store/play-feature-graphic.png` (1024x500, done).
