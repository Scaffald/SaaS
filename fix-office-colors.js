#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const COLOR_REPLACEMENTS = [
  { from: /color="\$gray11"/g, to: 'style={{ color: colors.text[theme].secondary }}' },
  { from: /color="\$color10"/g, to: 'style={{ color: colors.text[theme].tertiary }}' },
  { from: /color="\$color11"/g, to: 'style={{ color: colors.text[theme].secondary }}' },
  { from: /color="\$color12"/g, to: 'style={{ color: colors.text[theme].primary }}' },
  { from: /color="\$red10"/g, to: 'style={{ color: colors.text[theme].error }}' },
  { from: /color="\$red11"/g, to: 'style={{ color: colors.text[theme].error }}' },
  { from: /color="\$green10"/g, to: 'style={{ color: colors.text[theme].success }}' },
  { from: /color="\$green11"/g, to: 'style={{ color: colors.text[theme].success }}' },
  { from: /color="\$blue10"/g, to: 'style={{ color: colors.text[theme].info }}' },
  { from: /color="\$blue11"/g, to: 'style={{ color: colors.text[theme].info }}' },
  { from: /color="\$orange11"/g, to: 'style={{ color: colors.text[theme].warning }}' },

  { from: /backgroundColor="\$background"/g, to: 'style={{ backgroundColor: colors.bg[theme].default }}' },
  { from: /backgroundColor="\$color2"/g, to: 'style={{ backgroundColor: colors.bg[theme].subtle }}' },
  { from: /backgroundColor="\$color3"/g, to: 'style={{ backgroundColor: colors.bg[theme].muted }}' },
  { from: /backgroundColor="\$color4"/g, to: 'style={{ backgroundColor: colors.bg[theme].default }}' },
  { from: /backgroundColor="\$color5"/g, to: 'style={{ backgroundColor: colors.bg[theme].inactive }}' },
  { from: /backgroundColor="\$red2"/g, to: 'style={{ backgroundColor: colors.bg[theme].errorSubtle }}' },
  { from: /backgroundColor="\$blue2"/g, to: 'style={{ backgroundColor: colors.bg[theme].info }}' },
  { from: /backgroundColor="\$blue9"/g, to: 'style={{ backgroundColor: colors.bg[theme].primary }}' },
  { from: /backgroundColor="\$green9"/g, to: 'style={{ backgroundColor: colors.bg[theme].success }}' },

  { from: /borderColor="\$borderColor"/g, to: 'borderColor={colors.border[theme].default}' },
  { from: /borderColor="\$color6"/g, to: 'borderColor={colors.border[theme].default}' },
  { from: /borderColor="\$color7"/g, to: 'borderColor={colors.border[theme].subtle}' },
  { from: /borderColor="\$red6"/g, to: 'borderColor={colors.border[theme].error}' },
  { from: /borderColor="\$red8"/g, to: 'borderColor={colors.border[theme].error}' },
  { from: /borderColor="\$yellow8"/g, to: 'borderColor={colors.border[theme].warning}' },
];

function addImports(content, filePath) {
  let modified = content;

  // Check if useThemeContext is already imported
  const hasUseThemeContext = /useThemeContext/.test(content);
  const hasBeyondUIImport = /from ['"]@unicornlove\/beyond-ui['"]/.test(content);

  // Add useThemeContext if needed
  if (!hasUseThemeContext && hasBeyondUIImport) {
    // Find the first beyond-ui import and add useThemeContext
    const beyondUIMatch = content.match(/(import\s+{[^}]+})\s+from\s+['"]@unicornlove\/beyond-ui['"]/);
    if (beyondUIMatch) {
      const existingImports = beyondUIMatch[1];
      // Check if there's already an import statement with useThemeContext
      if (!existingImports.includes('useThemeContext')) {
        // Add useThemeContext to the imports
        modified = modified.replace(
          /(import\s+{)([^}]+)(}\s+from\s+['"]@unicornlove\/beyond-ui['"])/,
          '$1$2, useThemeContext$3'
        );
      }
    }
  }

  // Check if colors import exists
  const hasColorsImport = /from ['"]@unicornlove\/beyond-ui\/tokens['"]/.test(modified);

  // Add colors import if needed
  if (!hasColorsImport && hasBeyondUIImport) {
    // Find the last import statement
    const lastImportMatch = Array.from(modified.matchAll(/^import\s+.+$/gm)).pop();
    if (lastImportMatch) {
      const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
      modified = modified.slice(0, insertPosition) +
                 "\nimport { colors } from '@unicornlove/beyond-ui/tokens'" +
                 modified.slice(insertPosition);
    }
  }

  return modified;
}

function addThemeHook(content) {
  // Check if theme hook is already present
  if (/const\s+{\s*theme\s*}\s*=\s*useThemeContext\(\)/.test(content)) {
    return content;
  }

  // Find function component declarations and add theme hook
  const functionMatch = content.match(/(export\s+function\s+\w+\([^)]*\)\s*{)/);
  if (functionMatch) {
    const insertPosition = functionMatch.index + functionMatch[0].length;
    return content.slice(0, insertPosition) +
           '\n  const { theme } = useThemeContext()' +
           content.slice(insertPosition);
  }

  return content;
}

function processFile(filePath) {
  console.log(`Processing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Add imports
  content = addImports(content, filePath);

  // Add theme hook if needed
  if (content.includes('useThemeContext')) {
    content = addThemeHook(content);
  }

  // Apply color replacements
  for (const { from, to } of COLOR_REPLACEMENTS) {
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
        // Check if file contains Tamagui color tokens
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (/\$color|\$red|\$blue|\$green|\$yellow|\$borderColor|\$background|\$gray11/.test(content)) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dir);
  return files;
}

const files = getAllTsxFiles(officeDir);
console.log(`Found ${files.length} files with Tamagui color tokens\n`);

let updatedCount = 0;
for (const file of files) {
  if (processFile(file)) {
    updatedCount++;
  }
}

console.log(`\n✓ Updated ${updatedCount} of ${files.length} files`);
