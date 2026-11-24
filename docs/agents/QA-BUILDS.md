# QA mobile builds

Every scaffald-app release (`app-vX.Y.Z` tag) gets two ready-to-install builds
attached to its [GitHub release](https://github.com/Scaffald/SaaS/releases),
so a QA run can test the native app without building it (#1419):

| File | Runs on | Install |
|---|---|---|
| `Scaffald-X.Y.Z-sim.app.zip` | iOS **simulator**, iPhone and iPad | `xcrun simctl install` |
| `Scaffald-X.Y.Z.apk` | Android emulator (or a device) | `adb install` |

Both are **Release** builds pointed at **dev** (`dev.scaffald.com`, the dev
Supabase project), with no dev client: they need no Metro and no local repo.
They test what is on dev, the same backend the browser QA run uses. The
release notes name the commit; compare it with
`https://dev.scaffald.com/build.json` to know whether the app and the web
build under test match.

The iOS file is a simulator build. It does not install on a physical iPhone.

## Install and launch

```bash
VERSION=1.30.0   # or: gh release list -R Scaffald/SaaS --limit 1
gh release download "app-v$VERSION" -R Scaffald/SaaS -p "Scaffald-$VERSION*" -D scaffald-qa --clobber
```

iOS simulator:

```bash
unzip -oq "scaffald-qa/Scaffald-$VERSION-sim.app.zip" -d scaffald-qa/ios
xcrun simctl boot "iPhone 17 Pro" 2>/dev/null || true   # or an iPad, e.g. "iPad Pro 13-inch (M5)"
xcrun simctl install booted scaffald-qa/ios/*.app
xcrun simctl launch booted com.scaffald.app.development
```

Android emulator (with one running):

```bash
adb install -r "scaffald-qa/Scaffald-$VERSION.apk"
adb shell monkey -p com.scaffald.app.development -c android.intent.category.LAUNCHER 1
```

The bundle id / package is `com.scaffald.app.development`, the same as the dev
client, so installing one replaces the other. Sign in with the usual dev QA
logins.

## How the builds are made

- Profile `qa` in `apps/scaffald/eas.json`: extends `development` (same env),
  `developmentClient: false`, iOS `Release` + `simulator: true`, Android
  `buildType: apk`, `NODE_ENV=production`.
- `.github/workflows/qa-builds.yml` runs on each `app-v*` tag push (which
  `scripts/release.sh` does). It creates the GitHub release if there is none,
  starts the EAS workflow `apps/scaffald/.eas/workflows/qa-builds.yml` at the
  tagged commit, waits for both builds, and uploads the two files with the
  commit in the notes.
- Ad hoc: run **QA mobile builds** from the Actions tab (`workflow_dispatch`,
  optional `tag`; empty means the latest `app-v*` tag). Re-running replaces
  the files.
- Build by hand without a release:
  `cd apps/scaffald && eas workflow:run .eas/workflows/qa-builds.yml --ref <sha>`.
  Always pass `--ref` (a pushed commit): only the cloud clone hydrates the
  `packages/ui` and `packages/sdk` submodules.

Cost: two EAS builds per release, plus the Actions job waiting for them
(roughly 25 to 40 minutes of the org's 2,000 monthly minutes per release).
