#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Bundle size checker for Supabase Edge Functions
 * Uses deno compile to measure bundle size and compare against baseline
 */

const BASELINE_FILE = '.bundle-size-baseline.json'
const THRESHOLD_PERCENT = 5
const FUNCTION_PATH = 'packages/supabase/functions/trpc/index.ts'
const DENO_CONFIG = 'packages/supabase/functions/trpc/deno.json'
const OUTPUT_BINARY = 'packages/supabase/functions/trpc/trpc-bundle'

interface BundleSizeBaseline {
  size: number
  timestamp: string
  functionPath: string
}

async function getBaseline(): Promise<BundleSizeBaseline | null> {
  try {
    const content = await Deno.readTextFile(BASELINE_FILE)
    return JSON.parse(content) as BundleSizeBaseline
  } catch {
    return null
  }
}

async function saveBaseline(size: number): Promise<void> {
  const baseline: BundleSizeBaseline = {
    size,
    timestamp: new Date().toISOString(),
    functionPath: FUNCTION_PATH,
  }
  await Deno.writeTextFile(BASELINE_FILE, JSON.stringify(baseline, null, 2))
}

async function compileAndMeasure(): Promise<number> {
  console.log('Compiling edge function to measure bundle size...')
  
  const command = new Deno.Command('deno', {
    args: [
      'compile',
      '--no-check',
      '--output',
      OUTPUT_BINARY,
      '--config',
      DENO_CONFIG,
      FUNCTION_PATH,
    ],
    stdout: 'piped',
    stderr: 'piped',
  })

  const { code, stdout, stderr } = await command.output()

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr)
    throw new Error(`Compilation failed: ${errorText}`)
  }

  try {
    const stat = await Deno.stat(OUTPUT_BINARY)
    const size = stat.size
    console.log(`Bundle size: ${(size / 1024).toFixed(2)} KB (${size} bytes)`)
    return size
  } catch {
    throw new Error('Compiled binary not found')
  } finally {
    // Clean up
    try {
      await Deno.remove(OUTPUT_BINARY)
    } catch {
      // Ignore cleanup errors
    }
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function main() {
  const currentSize = await compileAndMeasure()
  const baseline = await getBaseline()

  if (!baseline) {
    console.log('No baseline found. Saving current size as baseline.')
    await saveBaseline(currentSize)
    console.log(`✅ Baseline saved: ${formatSize(currentSize)}`)
    Deno.exit(0)
  }

  const diff = currentSize - baseline.size
  const diffPercent = (diff / baseline.size) * 100

  console.log(`\nBaseline: ${formatSize(baseline.size)} (from ${baseline.timestamp})`)
  console.log(`Current:  ${formatSize(currentSize)}`)
  console.log(`Change:   ${diff >= 0 ? '+' : ''}${formatSize(diff)} (${diffPercent >= 0 ? '+' : ''}${diffPercent.toFixed(2)}%)`)

  if (diffPercent > THRESHOLD_PERCENT) {
    console.error(`\n❌ Bundle size increased by ${diffPercent.toFixed(2)}%, exceeding threshold of ${THRESHOLD_PERCENT}%`)
    Deno.exit(1)
  }

  if (diffPercent < -THRESHOLD_PERCENT) {
    console.log(`\n✅ Bundle size decreased by ${Math.abs(diffPercent).toFixed(2)}%`)
    console.log('Updating baseline...')
    await saveBaseline(currentSize)
  } else {
    console.log(`\n✅ Bundle size change (${diffPercent.toFixed(2)}%) is within threshold`)
  }

  Deno.exit(0)
}

main().catch((error) => {
  console.error('Error:', error.message)
  Deno.exit(1)
})

