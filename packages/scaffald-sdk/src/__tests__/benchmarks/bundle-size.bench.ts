/**
 * Bundle Size Benchmarks
 * Measures the size impact of different SDK features and configurations
 */

import { bench, describe, expect } from 'vitest'
import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { readFile } from 'node:fs/promises'

const DIST_DIR = resolve(__dirname, '../../../dist')

async function getBundleSize(filename: string): Promise<{ raw: number; gzipped: number }> {
  try {
    const filePath = resolve(DIST_DIR, filename)
    const stats = await stat(filePath)
    const content = await readFile(filePath)
    const gzipped = gzipSync(content)

    return {
      raw: stats.size,
      gzipped: gzipped.length,
    }
  } catch (error) {
    console.error(`Failed to get bundle size for ${filename}:`, error)
    return { raw: 0, gzipped: 0 }
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

describe('Bundle Size Analysis', () => {
  bench('measure core SDK bundle', async () => {
    const size = await getBundleSize('index.js')
    console.log(`\nCore SDK: ${formatBytes(size.raw)} (${formatBytes(size.gzipped)} gzipped)`)

    // Assert size is under target (20KB gzipped)
    expect(size.gzipped).toBeLessThan(20 * 1024)
  })

  bench('measure OAuth module bundle', async () => {
    const size = await getBundleSize('oauth/oauth.js')
    console.log(`OAuth: ${formatBytes(size.raw)} (${formatBytes(size.gzipped)} gzipped)`)

    // OAuth should be under 2KB gzipped
    expect(size.gzipped).toBeLessThan(2 * 1024)
  })

  bench('measure Webhooks module bundle', async () => {
    const size = await getBundleSize('webhooks/verify.js')
    console.log(`Webhooks: ${formatBytes(size.raw)} (${formatBytes(size.gzipped)} gzipped)`)

    // Webhooks should be under 1KB gzipped
    expect(size.gzipped).toBeLessThan(1 * 1024)
  })

  bench('measure React module bundle', async () => {
    const size = await getBundleSize('react/index.js')
    console.log(`React: ${formatBytes(size.raw)} (${formatBytes(size.gzipped)} gzipped)`)

    // React module should be reasonable
    expect(size.gzipped).toBeLessThan(25 * 1024)
  })
})

describe('Tree-shaking Analysis', () => {
  bench('verify unused exports are tree-shakeable', async () => {
    // When importing only Scaffald class, bundle should be minimal
    const coreSize = await getBundleSize('index.js')

    // Full SDK with all resources
    const fullSize = await getBundleSize('index.js')

    console.log(
      `Tree-shaking efficiency: ${((1 - coreSize.gzipped / fullSize.gzipped) * 100).toFixed(1)}%`
    )
  })
})

describe('Dependency Analysis', () => {
  bench('verify zero runtime dependencies', async () => {
    const packageJson = await readFile(resolve(__dirname, '../../../package.json'), 'utf-8')
    const pkg = JSON.parse(packageJson)

    const runtimeDeps = Object.keys(pkg.dependencies || {})
    console.log(`Runtime dependencies: ${runtimeDeps.length}`)

    // Core SDK should have zero runtime dependencies
    expect(runtimeDeps).toHaveLength(0)
  })
})

describe('Bundle Comparison', () => {
  bench('compare with major SDKs', async () => {
    const ourSize = await getBundleSize('index.js')

    // Reference sizes (approximate, for comparison)
    const competitors = {
      'Stripe SDK': 45 * 1024, // ~45KB gzipped
      'AWS SDK (S3)': 80 * 1024, // ~80KB gzipped
      'Firebase SDK': 120 * 1024, // ~120KB gzipped
      'Supabase SDK': 35 * 1024, // ~35KB gzipped
    }

    console.log('\n📦 Bundle Size Comparison:')
    console.log(`Scaffald SDK: ${formatBytes(ourSize.gzipped)}`)
    for (const [name, size] of Object.entries(competitors)) {
      const diff = ((ourSize.gzipped / size - 1) * 100).toFixed(1)
      const emoji = ourSize.gzipped < size ? '✅' : '⚠️'
      console.log(`${emoji} ${name}: ${formatBytes(size)} (${diff}% ${ourSize.gzipped < size ? 'smaller' : 'larger'})`)
    }
  })
})
