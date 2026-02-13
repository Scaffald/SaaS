#!/usr/bin/env node
/**
 * Fix Duplicate Style Props
 *
 * Merges duplicate style props into single style objects
 * Example: style={{ backgroundColor: 'red' }} style={{ borderColor: 'blue' }}
 * Becomes: style={{ backgroundColor: 'red', borderColor: 'blue' }}
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Pattern to match JSX elements with duplicate style props
// This regex finds elements with two style={{ ... }} props
const DUPLICATE_STYLE_PATTERN = /(\s+style=\{\{[^}]+\}\})(\s+[^s][^>]*?)(\s+style=\{\{[^}]+\}\})/g;

function extractStyleObject(styleAttr) {
  // Extract the object content from style={{ ... }}
  const match = styleAttr.match(/style=\{\{(.+?)\}\}/);
  return match ? match[1].trim() : '';
}

function fixDuplicateStyles(content) {
  let fixed = content;
  let changes = 0;

  // Find all instances of duplicate style props
  fixed = fixed.replace(DUPLICATE_STYLE_PATTERN, (match, style1, middle, style2) => {
    const obj1 = extractStyleObject(style1);
    const obj2 = extractStyleObject(style2);

    if (obj1 && obj2) {
      // Merge the two style objects
      const merged = `${obj1}, ${obj2}`;
      changes++;
      return ` style={{ ${merged} }}${middle}`;
    }

    return match;
  });

  return { content: fixed, changes };
}

async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { content: fixed, changes } = fixDuplicateStyles(content);

  if (changes > 0) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`✓ ${filePath}: Fixed ${changes} duplicate style prop(s)`);
    return changes;
  }

  return 0;
}

async function main() {
  console.log('🔍 Scanning for files with duplicate style props...\n');

  const patterns = [
    'packages/scf-core/**/*.{ts,tsx}',
    'apps/scaffald/app/**/*.{ts,tsx}',
  ];

  let totalFiles = 0;
  let totalChanges = 0;

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
    });

    for (const file of files) {
      const changes = await processFile(file);
      if (changes > 0) {
        totalFiles++;
        totalChanges += changes;
      }
    }
  }

  console.log(`\n✅ Done! Fixed ${totalChanges} duplicate style props in ${totalFiles} files.`);
}

main().catch(console.error);
