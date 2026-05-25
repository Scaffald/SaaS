# Expo SDK 55 → 56 Upgrade Plan

**Status:** Planning (no code changes yet)
**Author:** Planning session 2026-05-24
**Companion doc:** [EXPO_SDK_55_UPGRADE_STATUS.md](./EXPO_SDK_55_UPGRADE_STATUS.md)

## Why a plan first

The 5 open Dependabot PRs (#287 expo-crypto, #288 @expo/dom-webview, #289 expo, #292 expo-font, #294 expo-document-picker) cannot land in isolation. Each one fails at `pnpm install` because peer-dependency constraints with the still-pinned `expo-modules-core` 55.0.23, `react-native` 0.83.6, and `@expo/dom-webview` 55.0.5 in `pnpm.overrides` will reject the 56.x package. The upgrade must land as one atomic change.

## Required version targets

### Core runtime

| Package | Current (SDK 55) | SDK 56 Target | Where it lives |
|---|---|---|---|
| expo | ~55.0.25 | ^56.0.4 | catalog |
| react-native | 0.83.6 | 0.85.3 | catalog + `pnpm.overrides` |
| react | 19.2.0 | 19.2.0 (unchanged) | catalog |
| expo-modules-core | 55.0.23 | ~56.0.11 | `pnpm.overrides` |
| expo-modules-autolinking | 55.0.18 | ~56.x | `pnpm.overrides` |
| expo-router | ~55.0.15 | ~56.2.4 | catalog |
| @expo/metro-runtime | ~55.0.11 | ~56.x | catalog |
| babel-preset-expo | ~55.0.19 | ~56.x | catalog |

### Expo features (catalog)

All of these are at `~55.x` today and must move to `~56.x` together:
expo-blur, expo-glass-effect, expo-image, expo-crypto, expo-font, expo-document-picker, expo-apple-auth, expo-build-properties, expo-clipboard, expo-constants, expo-dev-client, expo-device, expo-image-manipulator, expo-image-picker, expo-linear-gradient, expo-linking, expo-localization, expo-location, expo-notifications, expo-secure-store, expo-splash-screen, expo-status-bar, expo-system-ui, expo-tracking-transparency, expo-updates, expo-web-browser.

### App-level deps (apps/scaffald/package.json, not in catalog)

| Package | Current | Target |
|---|---|---|
| @expo/ui | ~55.0.17 | ~56.x |
| @expo/dom-webview | ~55.0.5 | ~56.0.5 |

### RN ecosystem (catalog)

| Package | Current | Target |
|---|---|---|
| react-native-gesture-handler | ~2.30.0 | ~2.31.1 |
| react-native-safe-area-context | ~5.6.1 | ~5.7.0 |
| react-native-screens | ~4.23.0 | 4.25.1 |
| react-native-svg | 15.15.1 (override 15.15.3) | 15.15.4 |
| react-native-webview | 13.16.0 | 13.16.1 |

### Isolated workspaces

- **`packages/ui`** has its own lockfile with `react-native-reanimated` 4.2.2 + `react-native-worklets` 0.7.4. SDK 56 expects **4.3.1 / 0.8.3**. Bump only if `expo-modules-core` 56 causes a build failure inside this workspace; otherwise leave alone.
- **`apps/ui-storybook-native`** is a separate Expo app. It must be bumped in tandem so its `storybook` script still launches against the new core.

## Toolchain prerequisites

- **Node ≥ 20.19.4** — check CI runners and EAS build profiles.
- **Xcode ≥ 26.4** — `apps/scaffald/scripts/ios:check-xcode-version` currently hard-codes "≥ 16". Update or remove.
- **iOS deployment target 16.4** (was 15.1) — set via `expo-build-properties` in `app.config.ts`. Drops iPhone 7 / SE-1.
- **Hermes v1** is the default JS engine in SDK 56 — already what we use.
- **New Architecture** is the default — `RCT_NEW_ARCH_ENABLED=1` is already set, so no change there.

## Breaking changes that affect us

1. **`expo-router` decouples from `@react-navigation/*`**. Imports like `useFocusEffect` from `@react-navigation/native` move to `expo-router`. Codemod available:
   ```
   npx expo-codemod sdk-56-expo-router-react-navigation-replace
   ```
   Sweep `apps/scaffald/**` and `packages/scf-core/**`.

2. **Expo Go is gone from app stores.** Dev builds only. Update onboarding docs that still mention Expo Go.

3. **`@expo/vector-icons` deprecated** in favor of scoped `@react-native-vector-icons/*` packages. We use `lucide-react-native` directly, so unaffected.

4. **TypeScript 6.0.3** ships in the new templates. We're on 5.9.3. Optional bump — can pin with `expo.install.exclude` to defer.

5. **react-native-dotenv 3.4.9** may interact with RN 0.85's updated Metro config. Re-verify the `.env` pipeline works.

## Risk hotspots

- `apps/scaffald/app/_layout.tsx` — recently-added `SafeAreaProvider` from `react-native-safe-area-context`; bumping that lib may shift insets behavior.
- `apps/scaffald/babel.config.js` — `babel-preset-expo` major bump; verify `jsxRuntime: 'automatic'` is still respected.
- `apps/scaffald/metro.config.js` — uses `unstable_enablePackageExports` and `unstable_conditionNames`; these may be renamed or stabilized in SDK 56.
- `apps/scaffald/app.config.ts` — `expo-build-properties` plugin needs iOS deployment-target bump.
- `packages/scf-core/features/drawer/NativeBlurView.native.tsx` — uses `requireOptionalNativeModule` from `expo-modules-core`; API has been stable but re-verify.
- `packages/scf-core/features/drawer/CustomDrawer.tsx` — vanilla `Animated` drawer (worklet-free policy); make sure no transitive worklet import sneaks in via expo-router 56.
- `@sentry/react` 10.28.0 — verify it supports RN 0.85.
- `@rnmapbox/maps` 10.1.45 — known sensitivity to RN versions.
- Storybook native app — separate Expo project; must bump together.

## Execution sequence

### Step 0 — Pre-flight (no merges)

1. Close all 5 SDK-55 Dependabot PRs as "superseded by atomic SDK 56 PR".
2. Confirm Node version on local + CI + EAS images is ≥ 20.19.4. Update `engines` in root `package.json` if needed.
3. Confirm Xcode version on local + EAS images is ≥ 26.4.
4. Read [Expo SDK 56 changelog](https://expo.dev/changelog/sdk-56) end-to-end one more time.

### Step 1 — Single atomic branch

Branch name: `clay/expo-sdk-56`.

1. Update `pnpm-workspace.yaml` catalog: bump every `expo*` and `react-native*` entry per the tables above.
2. Update root `package.json` `pnpm.overrides`: `react-native`, `expo-modules-core`, `expo-modules-autolinking`, `@expo/dom-webview`, `react-native-svg`.
3. Update `apps/scaffald/package.json` non-catalog deps: `@expo/ui`, `@expo/dom-webview`.
4. Update `apps/ui-storybook-native/package.json` similarly.
5. Run `pnpm install`.
6. Run `npx expo install --fix` to align stragglers.
7. Run `npx expo-doctor`; resolve every warning.
8. Run the expo-router codemod across `apps/scaffald` and `packages/scf-core`.
9. Update `apps/scaffald/scripts/ios:check-xcode-version` for new Xcode minimum.
10. Bump iOS deployment target to 16.4 in `apps/scaffald/app.config.ts` (`expo-build-properties` plugin).

### Step 2 — Verify (blocking gates, in order)

| # | Gate | Command |
|---|---|---|
| 1 | TypeScript clean | `pnpm typecheck` |
| 2 | Lint clean | `pnpm lint` |
| 3 | Unit tests | `pnpm test:unit` |
| 4 | Web smoke | `pnpm web` → drawer / auth / routing |
| 5 | iOS simulator | `pnpm prebuild:clean` → `pnpm ios` → drawer + blur nav + fonts + document picker |
| 6 | Android | `pnpm android` → same flows |
| 7 | EAS dev build | `pnpm eas:build:dev:simulator:ios:local` |

Stop and diagnose at the first failing gate. Don't skip ahead.

### Step 3 — Reanimated/Worklets (conditional)

Only if `packages/ui` fails to build against expo-modules-core 56:
- Bump `react-native-reanimated` 4.2.2 → 4.3.1 in `packages/ui` lockfile.
- Bump `react-native-worklets` 0.7.4 → 0.8.3.
- Re-run gate 5 + 6.

### Step 4 — Storybook app

- Confirm `apps/ui-storybook-native` boots: `pnpm --filter ui-storybook-native start`.

### Step 5 — Land

- Open PR, link this doc.
- Use `--admin --squash` only if CI is still billing-blocked.
- Tag follow-up if any deferred gotchas (e.g., `@rnmapbox/maps` quirks) need cleanup.

## Decision log

- **Why single atomic PR, not incremental?** Peer-dep enforcement at install time blocks any partial-bump branch from even reaching CI. The 5 Dependabot PRs prove this — each is mergeable in isolation per GitHub's view but would break `pnpm install` post-merge.
- **Why defer reanimated bump unless forced?** The scaffald app holds a deliberate worklet-free policy (vanilla `Animated` drawer). Bumping reanimated proactively risks pulling worklet code into the app's bundle.
- **Why not also do dotenv-cli / moti in the same PR?** Different blast radius. Keep this PR focused so a roll-back is clean.

## Open questions for review

1. Are there EAS build credentials that need refresh for the new Xcode version?
2. Does anyone on the team still test with Expo Go? (If so, they'll need a dev build instead.)
3. Is `@rnmapbox/maps` 10.1.45 on the SDK 56 compatibility list, or do we need to bump it too?
4. Should we use this opportunity to bump TypeScript 5.9 → 6.0, or hold that for a separate sweep?
