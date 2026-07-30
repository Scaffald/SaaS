#!/usr/bin/env node
/**
 * Fix for Expo autolinking issues with nested node_modules
 *
 * Expo's autolinking expects package.json to exist in nested node_modules,
 * but pnpm hoisting may not always create it. This script ensures they exist.
 *
 * Was `fix-tailwindcss-sucrase.mjs`. It carried a hardcoded list of two
 * packages to repair — sucrase under tailwindcss, and moti under
 * @unicornlove/ui — and by 2026-07-30 neither parent existed: tailwindcss left
 * with the Next.js marketing site, and @unicornlove/ui was renamed
 * @scaffald/ui long before that. Neither is declared in any package.json in
 * the workspace. The list was removed and the file renamed for what it
 * actually does, because a postinstall script named after two packages that
 * are not installed is worse than no script — it looks load-bearing.
 *
 * The generic scan below is the part that still earns its place: it walks
 * nested node_modules and copies in any missing package.json. It repairs
 * nothing on a healthy tree, which is the point.
 */

import { existsSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

let fixedCount = 0;

// Scan for nested node_modules that are missing a package.json.
try {
  const rootNodeModules = join('node_modules');
  if (existsSync(rootNodeModules)) {
    const packages = readdirSync(rootNodeModules);
    for (const pkg of packages) {
      const pkgPath = join(rootNodeModules, pkg);
      if (statSync(pkgPath).isDirectory()) {
        // Handle scoped packages (e.g., @tiptap/react)
        let actualPkgPath = pkgPath;
        if (pkg.startsWith('@')) {
          const scopedDir = pkgPath;
          if (existsSync(scopedDir)) {
            const scopedPackages = readdirSync(scopedDir);
            for (const scopedPkg of scopedPackages) {
              actualPkgPath = join(scopedDir, scopedPkg);
              if (statSync(actualPkgPath).isDirectory()) {
                scanNestedNodeModules(actualPkgPath, `${pkg}/${scopedPkg}`);
              }
            }
          }
        } else {
          scanNestedNodeModules(actualPkgPath, pkg);
        }
      }
    }
  }
} catch (error) {
  // Silently fail - this is a best-effort fix
}

function scanNestedNodeModules(pkgPath, pkgName) {
  const nestedNodeModules = join(pkgPath, 'node_modules');
  if (existsSync(nestedNodeModules)) {
    const nestedPackages = readdirSync(nestedNodeModules);
    for (const nestedPkg of nestedPackages) {
      const nestedPkgPath = join(nestedNodeModules, nestedPkg);
      if (statSync(nestedPkgPath).isDirectory()) {
        const nestedPkgJson = join(nestedPkgPath, 'package.json');
        // Check both root and scoped locations for the package
        const rootPkgJson = join('node_modules', nestedPkg, 'package.json');
        const scopedPkgJson = nestedPkg.startsWith('@') 
          ? join('node_modules', nestedPkg.split('/')[0], nestedPkg.split('/')[1], 'package.json')
          : null;
        
        if (!existsSync(nestedPkgJson)) {
          if (existsSync(rootPkgJson)) {
            copyFileSync(rootPkgJson, nestedPkgJson);
            console.log(`✅ Fixed ${pkgName}/${nestedPkg} package.json for Expo autolinking`);
            fixedCount++;
          } else if (scopedPkgJson && existsSync(scopedPkgJson)) {
            copyFileSync(scopedPkgJson, nestedPkgJson);
            console.log(`✅ Fixed ${pkgName}/${nestedPkg} package.json for Expo autolinking`);
            fixedCount++;
          }
        }
      }
    }
  }
}

if (fixedCount === 0) {
  // Don't log anything if nothing was fixed - keeps output clean
}
