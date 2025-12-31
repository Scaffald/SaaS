#!/usr/bin/env tsx
/**
 * Bundle size analysis script
 *
 * Analyzes the built bundle sizes and reports them in a readable format.
 * Run this after building the package.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

interface BundleInfo {
  name: string
  path: string
  size: number
  gzipped: number
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath: string): number {
  const stats = fs.statSync(filePath)
  return stats.size
}

/**
 * Get gzipped size
 */
function getGzippedSize(filePath: string): number {
  const content = fs.readFileSync(filePath)
  const compressed = zlib.gzipSync(content, { level: 9 })
  return compressed.length
}

/**
 * Format bytes to readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

/**
 * Find all bundle files
 */
function findBundles(dir: string, basePath = ''): BundleInfo[] {
  const bundles: BundleInfo[] = []

  if (!fs.existsSync(dir)) {
    console.warn(`⚠️  Directory not found: ${dir}`)
    return bundles
  }

  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      bundles.push(...findBundles(filePath, path.join(basePath, file)))
    } else if (file.endsWith('.mjs') || file.endsWith('.js')) {
      // Skip chunk files (they're part of the main bundle with splitting)
      if (file.includes('chunk-')) {
        continue
      }

      bundles.push({
        name: basePath ? `${basePath}/${file}` : file,
        path: filePath,
        size: getFileSize(filePath),
        gzipped: getGzippedSize(filePath),
      })
    }
  }

  return bundles
}

/**
 * Main function
 */
function main() {
  console.log('📊 Analyzing bundle sizes...\n')

  const bundles = findBundles(distDir)

  if (bundles.length === 0) {
    console.error('❌ No bundles found. Run `pnpm build` first.')
    process.exit(1)
  }

  // Sort by gzipped size (largest first)
  bundles.sort((a, b) => b.gzipped - a.gzipped)

  // Print table
  console.log('┌─────────────────────────────────────────┬────────────┬──────────────┐')
  console.log('│ Bundle                                  │ Size       │ Gzipped      │')
  console.log('├─────────────────────────────────────────┼────────────┼──────────────┤')

  for (const bundle of bundles) {
    const name = bundle.name.padEnd(39)
    const size = formatBytes(bundle.size).padStart(10)
    const gzipped = formatBytes(bundle.gzipped).padStart(12)

    console.log(`│ ${name} │ ${size} │ ${gzipped} │`)
  }

  console.log('└─────────────────────────────────────────┴────────────┴──────────────┘')

  // Calculate totals
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0)
  const totalGzipped = bundles.reduce((sum, b) => sum + b.gzipped, 0)

  console.log()
  console.log(`Total: ${formatBytes(totalSize)} (${formatBytes(totalGzipped)} gzipped)`)

  // Find main bundle (index.mjs)
  const mainBundle = bundles.find((b) => b.name === 'index.mjs')
  if (mainBundle) {
    console.log()
    console.log(`📦 Core SDK Bundle: ${formatBytes(mainBundle.gzipped)} gzipped`)

    // Check if under target
    const targetSize = 20 * 1024 // 20KB
    if (mainBundle.gzipped <= targetSize) {
      console.log('✅ Under 20KB target!')
    } else {
      const overBy = mainBundle.gzipped - targetSize
      console.log(
        `⚠️  Over 20KB target by ${formatBytes(overBy)} (${((overBy / targetSize) * 100).toFixed(1)}%)`
      )
    }
  }

  console.log()
}

main()
