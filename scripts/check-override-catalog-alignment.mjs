#!/usr/bin/env node
// Fail when a pnpm override contradicts the catalog entry for the same package.
//
// Why (#508): an entry in `pnpm.overrides` (root package.json) silently outranks
// the `pnpm-workspace.yaml` catalog entry of the same name. When they disagree,
// the catalog line is decorative — it reads like the version in use and isn't.
// That drift has shipped real breakage three times:
//   #453  @supabase/supabase-js  catalog ~2.100.1 ignored by override ~2.86.0
//   #501  expo-modules-autolinking  override pinned below what @expo/cli needs;
//         every web export died at Metro config time
//   #511  dependabot bumped the supabase-js catalog to ~2.110.9 while the
//         override still said ~2.86.0 — re-introducing #453 verbatim
//
// Rules:
//  * Override keys carrying a version selector (e.g. "esbuild@<=0.24.2",
//    "fast-xml-parser@>=4.0.0-beta.3 <=5.5.7") are CVE floors scoped to a
//    subrange. They intentionally differ from the catalog — skipped.
//  * An override that is a SUBSET of the catalog range is fine: pinning
//    react-dom to 19.2.3 inside catalog ^19.2.3 narrows, it does not lie.
//  * Everything else — override outside or contradicting the catalog — fails.
//    That is exactly the supabase-js and expo-modules-core shape.
//
// Runs from prepush and lint. No arguments. Exit 1 on any misalignment.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const semver = require('semver');

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const overrides = pkg.pnpm?.overrides ?? {};

const catalog = {};
let inCatalog = false;
for (const raw of readFileSync('pnpm-workspace.yaml', 'utf8').split('\n')) {
  if (/^catalog:\s*$/.test(raw)) {
    inCatalog = true;
    continue;
  }
  if (inCatalog && /^\S/.test(raw)) inCatalog = false; // left the block
  if (!inCatalog) continue;
  const m = raw.match(/^\s+'?([^':#]+?)'?\s*:\s*(\S+)\s*$/);
  if (m && !raw.trimStart().startsWith('#')) catalog[m[1]] = m[2];
}

const problems = [];
let checked = 0;

for (const [key, overrideRange] of Object.entries(overrides)) {
  // "pkg@selector" → scoped CVE-floor override; not comparable to the catalog.
  // The @ that starts a scope (@scope/name) is position 0, so look past it.
  if (key.indexOf('@', 1) !== -1) continue;

  const catalogRange = catalog[key];
  if (catalogRange === undefined) continue;

  // Non-semver values (workspace:, catalog:, npm: aliases) can't be compared.
  if (!semver.validRange(overrideRange) || !semver.validRange(catalogRange)) continue;

  checked += 1;
  let ok;
  try {
    ok = semver.subset(overrideRange, catalogRange);
  } catch {
    ok = overrideRange === catalogRange;
  }
  if (!ok) problems.push({ key, overrideRange, catalogRange });
}

if (problems.length > 0) {
  console.error('✗ pnpm override(s) contradict the catalog entry of the same name.');
  console.error('  The override WINS and the catalog line is silently ignored (#508).');
  console.error('  Either move both together, or delete the override if the pin is stale.\n');
  for (const p of problems) {
    console.error(`    ${p.key}`);
    console.error(`      override (package.json pnpm.overrides): ${p.overrideRange}   ← what actually installs`);
    console.error(`      catalog  (pnpm-workspace.yaml):         ${p.catalogRange}   ← ignored`);
  }
  process.exit(1);
}

console.log(`✓ overrides/catalog aligned (${checked} comparable pair${checked === 1 ? '' : 's'} checked)`);
