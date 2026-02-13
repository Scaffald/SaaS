#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  'packages/scf-core/features/office/office-storage-dashboard.tsx',
  'packages/scf-core/features/office/office-ccpa-dashboard.tsx',
  'packages/scf-core/features/office/legal/OfficeViolationReports.tsx',
  'packages/scf-core/features/office/office-notifications-console.tsx',
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Replace all remaining color tokens
  content = content.replace(/backgroundColor=\{percent > 100 \? '\$red10' : '\$green10'\}/g, 'style={{ backgroundColor: percent > 100 ? colors.text[theme].error : colors.text[theme].success }}');
  content = content.replace(/backgroundColor="\$blue10"/g, 'style={{ backgroundColor: colors.text[theme].info }}');
  content = content.replace(/processing: \{ bg: '\$blue3', text: '\$blue11' \}/g, 'processing: { bg: colors.bg[theme].info, text: colors.text[theme].info }');
  content = content.replace(/color = '\$color12'/g, 'color = colors.text[theme].primary');
  content = content.replace(/backgroundColor=\{request\.is_overdue \? '\$red2' : '\$color2'\}/g, 'style={{ backgroundColor: request.is_overdue ? colors.bg[theme].errorSubtle : colors.bg[theme].subtle }}');
  content = content.replace(/borderColor=\{request\.is_overdue \? '\$red6' : '\$borderColor'\}/g, 'borderColor={request.is_overdue ? colors.border[theme].error : colors.border[theme].default}');
  content = content.replace(/request\.is_overdue \? '\$red10' : request\.days_elapsed > 30 \? '\$orange10' : '\$color12'/g, 'request.is_overdue ? colors.text[theme].error : request.days_elapsed > 30 ? colors.text[theme].warning : colors.text[theme].primary');
  content = content.replace(/color=\{metrics\?\.pending_requests \? '\$orange10' : '\$color12'\}/g, 'style={{ color: metrics?.pending_requests ? colors.text[theme].warning : colors.text[theme].primary }}');
  content = content.replace(/color=\{\(metrics\?\.average_processing_days \|\| 0\) > 30 \? '\$orange10' : '\$green10'\}/g, 'style={{ color: (metrics?.average_processing_days || 0) > 30 ? colors.text[theme].warning : colors.text[theme].success }}');
  content = content.replace(/\? '\$green10'\s*:\s*'\$red10'/g, '? colors.text[theme].success : colors.text[theme].error');
  content = content.replace(/color=\{metrics\?\.overdue_count \? '\$red10' : '\$green10'\}/g, 'style={{ color: metrics?.overdue_count ? colors.text[theme].error : colors.text[theme].success }}');
  content = content.replace(/return '\$blue11' as const/g, 'return colors.text[theme].info');
  content = content.replace(/return '\$color11' as const/g, 'return colors.text[theme].secondary');
  content = content.replace(/backgroundColor=\{index % 2 === 0 \? '\$color1' : '\$color2'\}/g, 'style={{ backgroundColor: index % 2 === 0 ? colors.bg[theme].onPrimary : colors.bg[theme].subtle }}');
  content = content.replace(/textColorToken="\$color12"/g, 'textColorToken={colors.text[theme].primary}');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Updated ${file}`);
  } else {
    console.log(`- No changes ${file}`);
  }
}

console.log('\nDone!');
