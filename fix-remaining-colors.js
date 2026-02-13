#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ADDITIONAL_REPLACEMENTS = [
  // Additional color tokens
  { from: /color="\$gray10"/g, to: 'style={{ color: colors.text[theme].tertiary }}' },
  { from: /color="\$yellow11"/g, to: 'style={{ color: colors.text[theme].warning }}' },
  { from: /color="\$yellow10"/g, to: 'style={{ color: colors.text[theme].warning }}' },

  // Icon colors (need conditional handling)
  { from: /color={\s*isSelected\s*\?\s*'\$yellow10'\s*:\s*'\$color10'\s*}/g, to: 'color={isSelected ? colors.text[theme].warning : colors.text[theme].tertiary}' },
  { from: /color={\s*isSelected\s*\?\s*'\$yellow11'\s*:\s*'\$color12'\s*}/g, to: 'style={{ color: isSelected ? colors.text[theme].warning : colors.text[theme].primary }}' },

  // Border colors
  { from: /borderColor="\$blue7"/g, to: 'borderColor={colors.border[theme].info}' },
  { from: /borderColor="\$blue8"/g, to: 'borderColor={colors.border[theme].info}' },
  { from: /borderColor="\$color8"/g, to: 'borderColor={colors.border[theme].default}' },
  { from: /borderTopColor="\$borderColor"/g, to: 'borderTopColor={colors.border[theme].default}' },

  // Background colors
  { from: /backgroundColor="\$gray2"/g, to: 'style={{ backgroundColor: colors.bg[theme].subtle }}' },
  { from: /backgroundColor="\$gray3"/g, to: 'style={{ backgroundColor: colors.bg[theme].muted }}' },
  { from: /backgroundColor="\$blue3"/g, to: 'style={{ backgroundColor: colors.bg[theme].info }}' },
  { from: /backgroundColor="\$blue4"/g, to: 'style={{ backgroundColor: colors.bg[theme].info }}' },
  { from: /backgroundColor="\$green3"/g, to: 'style={{ backgroundColor: colors.bg[theme].successSubtle }}' },
  { from: /backgroundColor="\$yellow2"/g, to: 'style={{ backgroundColor: colors.bg[theme].warningSubtle }}' },
  { from: /backgroundColor="\$yellow3"/g, to: 'style={{ backgroundColor: colors.bg[theme].warningSubtle }}' },
  { from: /backgroundColor="\$red3"/g, to: 'style={{ backgroundColor: colors.bg[theme].errorSubtle }}' },

  // Conditional expressions
  { from: /'\$green3'/g, to: 'colors.bg[theme].successSubtle' },
  { from: /'\$gray3'/g, to: 'colors.bg[theme].muted' },
  { from: /'\$yellow3'/g, to: 'colors.bg[theme].warningSubtle' },
  { from: /'\$red3'/g, to: 'colors.bg[theme].errorSubtle' },
  { from: /'\$green11'/g, to: 'colors.text[theme].success' },
  { from: /'\$gray11'/g, to: 'colors.text[theme].secondary' },
  { from: /'\$yellow11'/g, to: 'colors.text[theme].warning' },
  { from: /'\$red11'/g, to: 'colors.text[theme].error' },

  // Hover styles
  { from: /hoverStyle=\{\{\s*backgroundColor:\s*'\$gray2'\s*\}\}/g, to: 'hoverStyle={{ backgroundColor: colors.bg[theme].subtle }}' },

  // Const assignments
  { from: /=\s*'\$red10'\s*:/g, to: '= colors.text[theme].error :' },
  { from: /=\s*'\$green10'\s*:/g, to: '= colors.text[theme].success :' },
  { from: /:\s*'\$color11'/g, to: ': colors.text[theme].secondary' },
];

function processFile(filePath) {
  console.log(`Processing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Apply additional color replacements
  for (const { from, to } of ADDITIONAL_REPLACEMENTS) {
    content = content.replace(from, to);
  }

  // Write back if changed
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ Updated`);
    return true;
  } else {
    console.log(`  - No changes needed`);
    return false;
  }
}

// Get all TypeScript files in office directory
const officeDir = path.join(__dirname, 'packages/scf-core/features/office');

function getAllTsxFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        // Check if file contains any remaining Tamagui color tokens
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (/\$color|\$red|\$blue|\$green|\$yellow|\$borderColor|\$background|\$gray/.test(content)) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dir);
  return files;
}

const files = getAllTsxFiles(officeDir);
console.log(`Found ${files.length} files with remaining Tamagui color tokens\n`);

let updatedCount = 0;
for (const file of files) {
  if (processFile(file)) {
    updatedCount++;
  }
}

console.log(`\n✓ Updated ${updatedCount} of ${files.length} files`);
