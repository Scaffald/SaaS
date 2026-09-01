# Scaffald — Google Play Data Safety answers

Play Console → App content → **Data safety**.

Derived from [privacy-checklist.md](../../app-store-assets/metadata/privacy-checklist.md),
which is the source of truth, and cross-checked against what the code actually
does. Where Play asks a question Apple does not, the answer is worked out here
rather than guessed — the two forms are **not** translations of each other.

> Play holds you to this form. A Data safety declaration that contradicts
> observable app behaviour is an enforcement matter, not a correction request.
> If any answer below stops being true, it must change in the same release as
> the behaviour.

---

## Data collection and security — top-level

| Question | Answer | Why |
|---|---|---|
| Does your app collect or share any of the required user data types? | **Yes** | |
| Is all of the user data collected by your app encrypted in transit? | **Yes** | All API traffic is HTTPS to `auth.scaffald.com`; `EXPO_PUBLIC_SUPABASE_URL` is https-enforced by `ship-ios.sh`. |
| Do you provide a way for users to request that their data be deleted? | **Yes** | In-app account deletion exists, and the delete-user path was repaired in #663. Deletion URL: https://scaffald.com/privacy |

---

## Data types

Play's taxonomy differs from Apple's. Mapping, with Play's own category names:

| Play data type | Collected | Shared | Processed ephemerally | Required | Purposes |
|---|---|---|---|---|---|
| **Personal info → Name** | Yes | No | No | Required | App functionality, Account management |
| **Personal info → Email address** | Yes | No | No | Required | App functionality, Account management |
| **Personal info → Phone number** | Yes | No | No | Optional | App functionality |
| **Personal info → User IDs** | Yes | No | No | Required | App functionality, Analytics |
| **Location → Approximate location** | Yes | No | No | Optional | App functionality |
| **Location → Precise location** | Yes | No | No | Optional | App functionality |
| **Photos and videos → Photos** | Yes | No | No | Optional | App functionality |
| **App activity → App interactions** | Yes | No | No | Optional | Analytics, Personalization |
| **App info and performance → Crash logs** | Yes | No | No | Optional | App functionality, Analytics |
| **App info and performance → Diagnostics** | Yes | No | No | Optional | Analytics |
| **Device or other IDs → Device or other IDs** | Yes | No | No | Optional | Analytics |

### One row that is absent on purpose

**Audio → Voice or sound recordings: not declared, because nothing records
audio.** Drafting this form surfaced `android.permission.RECORD_AUDIO` in the
resolved Android config, which would have forced this row. Checking rather than
declaring it found no `expo-av`, no `expo-audio`, no WebRTC, no `getUserMedia`,
and no mic-adjacent dependency anywhere in the app.

Two sources, both now fixed: an explicit entry added incidentally in c6b40b5
("Building without errors but styles are not quite building correctly"), and
`expo-image-picker`, whose plugin adds RECORD_AUDIO unless told not to.
`microphonePermission: false` removes it and blocks reintroduction.

The Android app now declares only `ACCESS_COARSE_LOCATION` and
`ACCESS_FINE_LOCATION`, both of which the map genuinely uses. Declaring a data
type the app never collects would have been the worse outcome of the two.

**Employment data.** Scaffald collects trade, certifications, work history and
assessment scores. Play has no "employment" data type, so this is not a
declarable row — but it *is* sensitive, it is the core of the product, and it
is visible to employers by design. That visibility is a product behaviour the
privacy policy must describe plainly; Data safety has nowhere to put it.

---

## "Shared" is No everywhere — the reasoning

Play defines *sharing* as transfer to a **third party**. PostHog and Sentry are
service providers processing on Scaffald's behalf under contract, which Play
explicitly excludes from "shared". Same conclusion the privacy checklist reaches
for Apple's tracking question, by a different route.

This holds only while:

- no advertising or attribution SDK is present (today: none — no AppsFlyer,
  Branch, Adjust, Segment, Facebook, Google Ads, SKAdNetwork)
- PostHog keeps `disableGeoip: true`
- analytics identity stays gated on in-app consent (`CookieConsentProvider` →
  `AuthProvider`)

Worker profile data visible to employers **inside the product** is not "sharing"
in Play's sense either — it is the app functioning as described, between users,
not a transfer to another company.

---

## Security practices

| Question | Answer |
|---|---|
| Data is encrypted in transit | **Yes** |
| Users can request data deletion | **Yes** |
| Committed to Play Families Policy | **No** (app is 18+) |
| Independent security review | **No** |

---

## Before submitting

- [ ] Confirm in-app account deletion still works end to end (#663 fixed a path
      where it destroyed data on a request that then failed — worth re-testing
      rather than assuming)
- [ ] Re-read https://scaffald.com/privacy against this table; Play compares them
- [ ] Revisit if employer paid tiers ship — purchase history becomes a data type
