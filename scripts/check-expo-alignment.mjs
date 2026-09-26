#!/usr/bin/env node
// Fail when the installed Expo packages are out of step WITH EACH OTHER.
//
// Why (#683): Expo SDK packages ship prebuilt native frameworks compiled against
// one ExpoModulesCore API surface. Let them drift apart and the mismatch is
// invisible until Apple's Mac-compatibility check rejects the symbols at
// delivery — expo-image 56.0.9 against expo-modules-core 56.0.22 left two
// `(undefined) external` Swift symbols in the shipped binary. #689 realigned all
// 22. Dependabot moves one package at a time, which is exactly how that skew
// accumulates.
//
// Why not `expo install --check` (#907): that command resolves expected versions
// from Expo's LIVE REGISTRY, so it answers "are you on the newest patch set?"
// — currency — rather than "do your Expo packages agree with each other?" —
// skew. Those are different questions and only the second one ships bugs.
//
// The practical cost of conflating them: the moment Expo publishes an SDK patch
// set, the check goes red on every branch at once. Because the Monorepo
// integrity job is gated on `deps == 'true'`, only dependency PRs run it, so all
// five open Dependabot PRs failed simultaneously for a reason none of them
// introduced — a PR bumping only `adm-zip` failed identically to a
// twelve-package group (see #908, which realigned the catalog by hand).
//
// This check reads `node_modules/expo/bundledNativeModules.json`, which ships
// INSIDE the installed expo package and lists the versions that belong with
// THAT expo. So it is:
//
//   * offline      — no registry call, nothing to drift from a publish
//   * version-locked — the manifest for expo 56.0.21 describes 56.0.21
//   * about skew   — exactly the #683 failure, and nothing else
//
// Staying a patch behind is no longer a red build. Being internally
// inconsistent still is. Currency is tracked separately and non-blockingly by
// .github/workflows/expo-currency-audit.yml.
//
// Note `expo` itself is absent from the manifest — a package cannot declare its
// own version — so this deliberately says nothing about which expo you are on.
// That is the currency question, and it belongs to the scheduled audit.
//
// Runs from the Monorepo integrity job. No arguments. Exit 1 on any skew.

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import semver from 'semver'

const ROOT = process.cwd()
const MANIFEST = join(ROOT, 'node_modules/expo/bundledNativeModules.json')

if (!existsSync(MANIFEST)) {
  console.error(
    `✖ ${MANIFEST} not found.\n` +
      '  The expo package is not installed, so alignment cannot be checked.\n' +
      '  Run `pnpm install` first.'
  )
  process.exit(1)
}

const expected = JSON.parse(readFileSync(MANIFEST, 'utf8'))

// A pnpm override is an explicit human decision that outranks the catalog
// (#501), so skew it causes is acknowledged rather than accidental — reported,
// not vetoed. Unpinned skew is the accidental kind — Dependabot moving one
// package — and that still fails.
//
// Nothing is in this bucket today. The one case that was, `expo-modules-core`
// held at 56.0.22 while expo bundled ~56.0.26, turned out not to be a deliberate
// constraint at all: #689 had used that version as the reference point the other
// modules were aligned UP to, the satellites later moved on with the catalog, and
// the skew simply inverted. Moved to 56.0.26 in #916. The bucket stays because
// a real, reasoned pin is a legitimate thing to have — but the lesson from #916
// is to check WHY a pin exists before assuming it is load-bearing.
const overrides = (() => {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).pnpm?.overrides ?? {}
  } catch {
    return {}
  }
})()

/** Installed version of a package, or null when it is not in the tree. */
function installedVersion(name) {
  const pkg = join(ROOT, 'node_modules', name, 'package.json')
  if (!existsSync(pkg)) return null
  try {
    return JSON.parse(readFileSync(pkg, 'utf8')).version ?? null
  } catch {
    return null
  }
}

const skew = []
const pinned = []
const checked = []

for (const [name, range] of Object.entries(expected)) {
  // Only Expo's own packages. The manifest also pins third-party RN libraries
  // (react-native-svg and friends) that the app may hold at a deliberate
  // version for reasons unrelated to native-module ABI — @rnmapbox/maps is held
  // at 10.1.x because 10.3.x needs a Mapbox downloads token we do not have. The
  // #683 failure mode is Expo-internal, so keep the blast radius there.
  if (name !== 'expo' && !name.startsWith('expo-') && !name.startsWith('@expo/')) continue

  const actual = installedVersion(name)
  if (actual === null) continue // not a dependency of this workspace

  checked.push(name)
  if (typeof range !== 'string' || !semver.validRange(range)) continue
  if (!semver.satisfies(actual, range, { includePrerelease: true })) {
    ;(Object.hasOwn(overrides, name) ? pinned : skew).push({ name, actual, range })
  }
}

for (const { name, actual, range } of pinned) {
  console.log(
    `• ${name} is held at ${actual} by a pnpm override; expo bundles ${range}. ` +
      'Deliberate pin — not failing on it (#916).'
  )
}

if (skew.length > 0) {
  const expoVersion = installedVersion('expo') ?? 'unknown'
  console.error(`✖ ${skew.length} Expo package(s) do not match what expo@${expoVersion} bundles:\n`)
  for (const { name, actual, range } of skew) {
    console.error(`    ${name}  installed ${actual}  expected ${range}`)
  }
  console.error(
    '\n  These ship prebuilt native frameworks compiled against one\n' +
      '  ExpoModulesCore surface (#683). Realign them in one coordinated commit:\n' +
      '  versions live in the pnpm-workspace.yaml catalog, in `pnpm.overrides`,\n' +
      '  and in direct dependencies — only the installed tree sees all three.\n' +
      '\n  This is skew, not lag. Being a patch behind the registry is fine and is\n' +
      '  not what failed here; see scripts/check-expo-alignment.mjs.'
  )
  process.exit(1)
}

console.log(
  `✓ ${checked.length} Expo packages agree with expo@${installedVersion('expo')}'s bundled set`
)
