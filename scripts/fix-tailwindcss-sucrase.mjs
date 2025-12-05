#!/usr/bin/env node
/**
 * Fix for Expo autolinking issues with nested node_modules
 * 
 * Expo's autolinking expects package.json to exist in nested node_modules,
 * but pnpm hoisting may not always create it. This script ensures they exist.
 */

import { existsSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Fix missing package.json files in nested node_modules
 * @param {string} packageName - The package name to look for
 * @param {string} parentPath - The parent package path (e.g., 'tailwindcss' or '@unicornlove/ui')
 */
function fixNestedPackage(packageName, parentPath) {
  const src = join('node_modules', packageName, 'package.json');
  const dest = join('node_modules', parentPath, 'node_modules', packageName, 'package.json');
  
  if (existsSync(src) && existsSync(dirname(dest))) {
    if (!existsSync(dest)) {
      copyFileSync(src, dest);
      console.log(`✅ Fixed ${parentPath}/${packageName} package.json for Expo autolinking`);
      return true;
    }
  }
  return false;
}

// Fix known issues
const fixes = [
  ['sucrase', 'tailwindcss'],
  ['moti', '@unicornlove/ui'],
];

let fixedCount = 0;
for (const [pkg, parent] of fixes) {
  if (fixNestedPackage(pkg, parent)) {
    fixedCount++;
  }
}

// Also scan for any other nested node_modules that might be missing package.json
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
