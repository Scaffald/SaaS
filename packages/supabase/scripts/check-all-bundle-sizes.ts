#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Bundle size checker for all Supabase Edge Functions
 * Uses deno compile to measure bundle size for each function
 */

interface FunctionInfo {
  name: string
  path: string
  configPath?: string
  size?: number
  error?: string
}

const FUNCTIONS: FunctionInfo[] = [
  {
    name: 'trpc',
    path: 'packages/supabase/functions/trpc/index.ts',
    configPath: 'packages/supabase/functions/trpc/deno.json',
  },
  {
    name: 'background-check-webhook',
    path: 'packages/supabase/functions/background-check-webhook/index.ts',
  },
  {
    name: 'feedback-sync-retry',
    path: 'packages/supabase/functions/feedback-sync-retry/index.ts',
  },
  {
    name: 'feedback-to-braingrid',
    path: 'packages/supabase/functions/feedback-to-braingrid/index.ts',
  },
  {
    name: 'job-import',
    path: 'packages/supabase/functions/job-import/index.ts',
  },
  {
    name: 'news',
    path: 'packages/supabase/functions/news/index.ts',
  },
  {
    name: 'news-import',
    path: 'packages/supabase/functions/news-import/index.ts',
    configPath: 'packages/supabase/functions/news-import/deno.json',
  },
  {
    name: 'notify-background-check-expiration',
    path: 'packages/supabase/functions/notify-background-check-expiration/index.ts',
  },
  {
    name: 'notify-check-receipts',
    path: 'packages/supabase/functions/notify-check-receipts/index.ts',
  },
  {
    name: 'notify-digest-daily',
    path: 'packages/supabase/functions/notify-digest-daily/index.ts',
  },
  {
    name: 'notify-digest-weekly',
    path: 'packages/supabase/functions/notify-digest-weekly/index.ts',
  },
  {
    name: 'notify-id-verification-expiration',
    path: 'packages/supabase/functions/notify-id-verification-expiration/index.ts',
  },
  {
    name: 'notify-publish',
    path: 'packages/supabase/functions/notify-publish/index.ts',
  },
  {
    name: 'notify-send-worker',
    path: 'packages/supabase/functions/notify-send-worker/index.ts',
  },
  {
    name: 'persona-webhook',
    path: 'packages/supabase/functions/persona-webhook/index.ts',
  },
  {
    name: 'send-team-invitation',
    path: 'packages/supabase/functions/send-team-invitation/index.ts',
  },
  {
    name: 'stripe-webhook',
    path: 'packages/supabase/functions/stripe-webhook/index.ts',
    configPath: 'packages/supabase/functions/stripe-webhook/deno.json',
  },
  {
    name: 'webhooks-email',
    path: 'packages/supabase/functions/webhooks/email/index.ts',
  },
  {
    name: 'webhooks-push',
    path: 'packages/supabase/functions/webhooks/push/index.ts',
  },
  {
    name: 'webhooks-sms',
    path: 'packages/supabase/functions/webhooks/sms/index.ts',
  },
]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function compileAndMeasure(func: FunctionInfo): Promise<number> {
  const outputBinary = `/tmp/${func.name}-bundle`
  
  const args = [
    'compile',
    '--no-check',
    '--output',
    outputBinary,
  ]
  
  if (func.configPath) {
    args.push('--config', func.configPath)
  }
  
  args.push(func.path)
  
  const command = new Deno.Command('deno', {
    args,
    stdout: 'piped',
    stderr: 'piped',
  })

  const { code, stderr } = await command.output()

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr)
    throw new Error(errorText)
  }

  try {
    const stat = await Deno.stat(outputBinary)
    const size = stat.size
    return size
  } catch {
    throw new Error('Compiled binary not found')
  } finally {
    // Clean up
    try {
      await Deno.remove(outputBinary)
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function main() {
  console.log('Checking bundle sizes for all Supabase Edge Functions...\n')
  
  const results: Array<FunctionInfo & { size: number }> = []
  const errors: Array<FunctionInfo & { error: string }> = []
  
  for (const func of FUNCTIONS) {
    try {
      console.log(`Compiling ${func.name}...`)
      const size = await compileAndMeasure(func)
      results.push({ ...func, size })
      console.log(`  ✅ ${func.name}: ${formatSize(size)}\n`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      errors.push({ ...func, error: errorMsg })
      console.log(`  ❌ ${func.name}: ${errorMsg}\n`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60) + '\n')
  
  if (results.length > 0) {
    // Sort by size descending
    results.sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
    
    console.log('Successful builds:')
    let totalSize = 0
    for (const result of results) {
      console.log(`  ${result.name.padEnd(35)} ${formatSize(result.size).padStart(12)}`)
      totalSize += result.size
    }
    console.log(`  ${'TOTAL'.padEnd(35)} ${formatSize(totalSize).padStart(12)}`)
  }
  
  if (errors.length > 0) {
    console.log('\nFailed builds:')
    for (const error of errors) {
      console.log(`  ${error.name}: ${error.error}`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
}

main().catch((error) => {
  console.error('Error:', error.message)
  Deno.exit(1)
})

