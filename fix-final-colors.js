#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const FINAL_REPLACEMENTS = [
  // Kanban status colors (object values)
  { from: /draft:\s*'\$gray9'/g, to: 'draft: colors.bg[theme].muted' },
  { from: /open:\s*'\$green9'/g, to: 'open: colors.bg[theme].success' },
  { from: /paused:\s*'\$yellow9'/g, to: 'paused: colors.bg[theme].warning' },
  { from: /closed:\s*'\$red9'/g, to: 'closed: colors.bg[theme].error' },
  { from: /new:\s*'\$blue9'/g, to: 'new: colors.bg[theme].primary' },
  { from: /screen:\s*'\$yellow9'/g, to: 'screen: colors.bg[theme].warning' },
  { from: /interview:\s*'\$red9'/g, to: 'interview: colors.bg[theme].error' },
  { from: /offer:\s*'\$green9'/g, to: 'offer: colors.bg[theme].success' },
  { from: /rejected:\s*'\$red9'/g, to: 'rejected: colors.bg[theme].error' },

  // Status colors for invitations
  { from: /accepted:\s*'\$green10'/g, to: 'accepted: colors.text[theme].success' },
  { from: /declined:\s*'\$red10'/g, to: 'declined: colors.text[theme].error' },

  // Conditional border colors
  { from: /borderColor=\{errors\.name\s*\?\s*'\$red8'\s*:\s*'\$borderColor'\}/g, to: 'borderColor={errors.name ? colors.border[theme].error : colors.border[theme].default}' },
  { from: /borderColor=\{slugHasAvailabilityError\s*\|\|\s*errors\.slug\s*\?\s*'\$red8'\s*:\s*'\$borderColor'\}/g, to: 'borderColor={slugHasAvailabilityError || errors.slug ? colors.border[theme].error : colors.border[theme].default}' },
  { from: /borderColor=\{errors\.slug\s*\?\s*'\$red8'\s*:\s*'\$borderColor'\}/g, to: 'borderColor={errors.slug ? colors.border[theme].error : colors.border[theme].default}' },
  { from: /borderColor=\{errors\.logo_url\s*\?\s*'\$red8'\s*:\s*'\$borderColor'\}/g, to: 'borderColor={errors.logo_url ? colors.border[theme].error : colors.border[theme].default}' },

  // Shadow colors
  { from: /shadowColor="\$color10"/g, to: 'shadowColor={colors.text[theme].tertiary}' },

  // Conditional backgrounds and borders
  { from: /const background = isOpen \? '\$green4' : '\$color3'/g, to: 'const background = isOpen ? colors.bg[theme].successSubtle : colors.bg[theme].muted' },
  { from: /const border = isOpen \? '\$green8' : '\$borderColor'/g, to: 'const border = isOpen ? colors.border[theme].success : colors.border[theme].default' },
  { from: /const background = isPrimary \? '\$blue4' : '\$color3'/g, to: 'const background = isPrimary ? colors.bg[theme].info : colors.bg[theme].muted' },
  { from: /const border = isPrimary \? '\$blue8' : '\$borderColor'/g, to: 'const border = isPrimary ? colors.border[theme].info : colors.border[theme].default' },
  { from: /const background = tone === 'warning' \? '\$yellow4' : '\$color3'/g, to: 'const background = tone === \'warning\' ? colors.bg[theme].warningSubtle : colors.bg[theme].muted' },
  { from: /const border = tone === 'warning' \? '\$yellow8' : '\$borderColor'/g, to: 'const border = tone === \'warning\' ? colors.border[theme].warning : colors.border[theme].default' },

  // Additional backgrounds
  { from: /backgroundColor="\$color1"/g, to: 'style={{ backgroundColor: colors.bg[theme].onPrimary }}' },
  { from: /backgroundColor="\$color9"/g, to: 'style={{ backgroundColor: colors.bg[theme].primary }}' },
  { from: /backgroundColor="\$red9"/g, to: 'style={{ backgroundColor: colors.bg[theme].error }}' },
  { from: /backgroundColor="\$green2"/g, to: 'style={{ backgroundColor: colors.bg[theme].successSubtle }}' },
  { from: /backgroundColor="\$green6"/g, to: 'borderColor={colors.border[theme].success}' },
  { from: /backgroundColor="\$green9"/g, to: 'style={{ backgroundColor: colors.bg[theme].success }}' },
  { from: /backgroundColor="\$green10"/g, to: 'style={{ backgroundColor: colors.text[theme].success }}' },
  { from: /backgroundColor="\$red10"/g, to: 'style={{ backgroundColor: colors.text[theme].error }}' },

  // Conditional inline expressions
  { from: /backgroundColor=\{message\.sender === 'recruiter' \? '\$blue3' : '\$color2'\}/g, to: 'style={{ backgroundColor: message.sender === \'recruiter\' ? colors.bg[theme].info : colors.bg[theme].subtle }}' },
  { from: /backgroundColor=\{isRejection \? '\$red9' : '\$green9'\}/g, to: 'style={{ backgroundColor: isRejection ? colors.bg[theme].error : colors.bg[theme].success }}' },
  { from: /backgroundColor:\s*isRejection \? '\$red10' : '\$green10'/g, to: 'backgroundColor: isRejection ? colors.text[theme].error : colors.text[theme].success' },
  { from: /\? '\$blue3'\s*:\s*'\$color3'/g, to: '? colors.bg[theme].info : colors.bg[theme].muted' },

  // Ternary color expressions
  { from: /application\.score >= 80 \? '\$green10' : application\.score >= 60 \? '\$blue10' : '\$red10'/g, to: 'application.score >= 80 ? colors.text[theme].success : application.score >= 60 ? colors.text[theme].info : colors.text[theme].error' },
  { from: /const statusColor = STATUS_COLORS\[invitation\.status as InvitationStatus\] \?\? '\$color11'/g, to: 'const statusColor = STATUS_COLORS[invitation.status as InvitationStatus] ?? colors.text[theme].secondary' },

  // Border bottom
  { from: /borderBottomColor="\$borderColor"/g, to: 'borderBottomColor={colors.border[theme].default}' },
];

function processFile(filePath) {
  console.log(`Processing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Apply final color replacements
  for (const { from, to } of FINAL_REPLACEMENTS) {
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
