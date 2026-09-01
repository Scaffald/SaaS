# Scaffald — Google Play testing setup

How a build gets from EAS to a tester's phone, and what has to exist first.

---

## The tracks, and which one you want first

Play has four, and a build is promoted up through them:

| Track | Testers | Review | Use |
|---|---|---|---|
| **Internal** | up to 100, by email | none — available in minutes | **start here** |
| Closed | email lists or Google Groups | yes | wider pre-release |
| Open | anyone with the link | yes | public beta |
| Production | everyone | yes | launch |

`eas.json` now has a **`submit.internal`** profile targeting `track: "internal"`.
Previously the only Android submit targets were `production` and a `staging`
profile pointing at `beta` — nothing pointed at internal, which is the one a
first upload should use.

```bash
# once the AAB exists and the service account is in place
pnpm --filter scaffald-app exec eas submit --profile internal --platform android
```

---

## The 12 testers / 14 days rule — check which account type you have

Google requires **personal** developer accounts created after 13 Nov 2023 to run
a closed test with **at least 12 testers, continuously, for 14 days** before
production access is granted.

**Organisation accounts are exempt.** Scaffald is a product of Unicorn LLC, so
if the Play account is registered as an organisation this does not apply.

> **Confirm this before planning a launch date.** If the account is personal,
> production is a minimum of two weeks away from the day 12 testers are
> actually enrolled — not from the day the listing is ready. It is the single
> largest schedule risk in the whole Play process and it is invisible until you
> go looking.

---

## The service account — what EAS needs to upload

`eas submit --platform android` authenticates with a Google Cloud service
account that has been granted access in the Play Console. Creating it is a
console + cloud task, so it is yours rather than something the repo can do:

1. Play Console → **Setup → API access**
2. Create or link a Google Cloud project
3. Create a service account, then grant it in Play Console with at least
   **Release apps to testing tracks** (and *Release to production* later)
4. Download the JSON key
5. Save it as **`apps/scaffald/google-play-service-account.json`**

That exact filename is what all three submit profiles now point at, and it is
gitignored (`.gitignore`, `**/google-play-service-account.json`). It grants
upload rights to your listing — it is a credential, treat it like one.

The profiles previously pointed at `../path/to/service-account-key.json`, a
placeholder that was never going to resolve.

---

## Order of operations

Nothing here works until the build does:

1. **#686** — register the four EAS environment variables. Until then an
   Android build ships without its Mapbox token, exactly as `1.17.0 / 11700`
   did on iOS.
2. **Build the AAB** — `eas build --profile production --platform android`.
   The profile now produces an app bundle rather than asking for both an APK
   and a bundle (#685). No Android build has ever been produced, so expect to
   fix things the first time.
3. **Create the app in Play Console** — needs a developer account and
   acceptance of the Distribution Agreement. Human, one-time.
4. **Service account** — steps above.
5. **Upload to internal** — `eas submit --profile internal --platform android`.
6. **Store listing** — copy from [play-store-listing.md](play-store-listing.md),
   graphics from `../graphics/`, screenshots per
   [../screenshots/README.md](../screenshots/README.md).
7. **App content forms** — [data-safety.md](data-safety.md),
   [content-rating.md](content-rating.md), plus App access credentials so
   review can get past the sign-in wall.

Steps 6 and 7 can be done while 1–5 are in flight; the listing does not need a
build to be drafted, only to be published.

---

## Blockers that are not about Play at all

- **#686** — no Mapbox token in native builds. A screenshot of the jobs map is
  a grey rectangle until this is fixed, and the map is the headline feature.
- **#690** — no way to report content, report a user, or block anyone. Play's
  UGC policy requires all three, and the content-rating questionnaire makes you
  declare "Users Interact", which is what invites the check. This is a
  rejection risk, not a nice-to-have.

---

## Testers

Internal testing takes up to 100 Google account email addresses. Worth having
the list ready before step 5, because the track is useless without it:

- [ ] Decide the list — team, plus a few real tradespeople if any are willing
- [ ] Note that testers must accept an opt-in link before they can install
- [ ] Testers need the **Google account email**, not any other address
