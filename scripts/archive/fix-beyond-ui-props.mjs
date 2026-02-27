#!/usr/bin/env node

/**
 * Automated Beyond-UI Migration Script
 * Fixes common prop migration issues across TypeScript/TSX files
 */

import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

const fixes = [
  // Size prop fixes - convert numbers to semantic sizes
  {
    pattern: /size=\{8\}/g,
    replacement: 'size="xs"',
    description: 'size={8} → size="xs"'
  },
  {
    pattern: /size=\{12\}/g,
    replacement: 'size="sm"',
    description: 'size={12} → size="sm"'
  },
  {
    pattern: /size=\{16\}/g,
    replacement: 'size="md"',
    description: 'size={16} → size="md"'
  },
  {
    pattern: /size=\{20\}/g,
    replacement: 'size="lg"',
    description: 'size={20} → size="lg"'
  },

  // Padding prop fixes
  {
    pattern: /padding=\{8\}/g,
    replacement: 'padding="xs"',
    description: 'padding={8} → padding="xs"'
  },
  {
    pattern: /padding=\{12\}/g,
    replacement: 'padding="sm"',
    description: 'padding={12} → padding="sm"'
  },
  {
    pattern: /padding=\{16\}/g,
    replacement: 'padding="md"',
    description: 'padding={16} → padding="md"'
  },
  {
    pattern: /padding=\{20\}/g,
    replacement: 'padding="lg"',
    description: 'padding={20} → padding="lg"'
  },
  {
    pattern: /padding=\{24\}/g,
    replacement: 'padding="xl"',
    description: 'padding={24} → padding="xl"'
  },

  // Elevation fixes
  {
    pattern: /elevation=\{0\}/g,
    replacement: 'elevation="none"',
    description: 'elevation={0} → elevation="none"'
  },
  {
    pattern: /elevation=\{4\}/g,
    replacement: 'elevation="sm"',
    description: 'elevation={4} → elevation="sm"'
  },
  {
    pattern: /elevation=\{8\}/g,
    replacement: 'elevation="md"',
    description: 'elevation={8} → elevation="md"'
  },
  {
    pattern: /elevation=\{16\}/g,
    replacement: 'elevation="lg"',
    description: 'elevation={16} → elevation="lg"'
  },

  // Color prop fixes
  {
    pattern: /color="gray"/g,
    replacement: 'color="$gray11"',
    description: 'color="gray" → color="$gray11"'
  },
  {
    pattern: /theme="blue"/g,
    replacement: 'color="primary"',
    description: 'theme="blue" → color="primary"'
  },
  {
    pattern: /theme="red"/g,
    replacement: 'color="error"',
    description: 'theme="red" → color="error"'
  },
  {
    pattern: /theme="green"/g,
    replacement: 'color="success"',
    description: 'theme="green" → color="success"'
  },

  // Checkbox API change
  {
    pattern: /onCheckedChange=/g,
    replacement: 'onChange=',
    description: 'onCheckedChange → onChange'
  },
]

async function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf-8')
  let changeCount = 0
  const appliedFixes = []

  for (const fix of fixes) {
    const matches = content.match(fix.pattern)
    if (matches) {
      content = content.replace(fix.pattern, fix.replacement)
      changeCount += matches.length
      appliedFixes.push(`  ${fix.description} (${matches.length}x)`)
    }
  }

  if (changeCount > 0) {
    writeFileSync(filePath, content, 'utf-8')
    console.log(`✅ ${filePath}`)
    appliedFixes.forEach(fix => console.log(fix))
    console.log(`   Total: ${changeCount} changes\n`)
    return changeCount
  }

  return 0
}

async function main() {
  const args = process.argv.slice(2)
  const pattern = args[0] || 'packages/scf-core/**/*.{ts,tsx}'

  console.log('🔧 Beyond-UI Automated Migration Tool\n')
  console.log(`Scanning: ${pattern}\n`)

  const files = await glob(pattern, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
  })

  console.log(`Found ${files.length} files\n`)

  let totalChanges = 0
  let filesChanged = 0

  for (const file of files) {
    const changes = await fixFile(file)
    if (changes > 0) {
      totalChanges += changes
      filesChanged++
    }
  }

  console.log('\n📊 Summary')
  console.log(`Files scanned: ${files.length}`)
  console.log(`Files changed: ${filesChanged}`)
  console.log(`Total fixes applied: ${totalChanges}`)
}

main().catch(console.error)
