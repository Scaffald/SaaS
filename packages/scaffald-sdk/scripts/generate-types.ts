#!/usr/bin/env tsx

import openapiTS from 'openapi-typescript'
import fs from 'node:fs/promises'
import path from 'node:path'

// Type generation sources (in priority order)
const SOURCES = [
  // 1. Custom URL from environment
  process.env.OPENAPI_URL,
  // 2. Production Supabase URL
  process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL}/functions/v1/api/openapi.json` : null,
  // 3. Local development instance
  'http://localhost:54321/functions/v1/api/openapi.json',
  // 4. Fallback to saved spec file
  path.join(process.cwd(), 'openapi-spec.json'),
].filter(Boolean) as string[]

const OUTPUT_PATH = path.join(process.cwd(), 'src/types/api.ts')
const SPEC_CACHE_PATH = path.join(process.cwd(), 'openapi-spec.json')

async function tryGenerateFromSource(source: string): Promise<string | null> {
  try {
    console.log(`📡 Attempting to fetch from: ${source}`)

    const output = await openapiTS(source, {
      exportType: true,
      pathParamsAsTypes: true,
    })

    return output
  } catch (error) {
    console.log(`   ⚠️  Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return null
  }
}

async function saveOpenAPISpec(url: string): Promise<void> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const spec = await response.json()
    await fs.writeFile(SPEC_CACHE_PATH, JSON.stringify(spec, null, 2))
    console.log(`💾 Cached OpenAPI spec to: ${SPEC_CACHE_PATH}`)
  } catch (error) {
    console.log(`   ⚠️  Could not cache spec: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function generateTypes() {
  console.log('🚀 Starting OpenAPI type generation...\n')

  let generatedTypes: string | null = null
  let successfulSource: string | null = null

  // Try each source in order
  for (const source of SOURCES) {
    generatedTypes = await tryGenerateFromSource(source)

    if (generatedTypes) {
      successfulSource = source
      break
    }
  }

  if (!generatedTypes) {
    console.error('\n❌ Failed to generate types from any source.')
    console.error('\nAvailable options:')
    console.error('1. Start Supabase locally: pnpm supa start')
    console.error('2. Set OPENAPI_URL environment variable to production API')
    console.error('3. Save OpenAPI spec to openapi-spec.json manually')
    console.error('\nNote: The SDK uses hand-crafted types that are kept in sync with the API.')
    console.error('Type generation is optional but helps catch API changes automatically.\n')
    process.exit(1)
  }

  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })

    // Write types file
    await fs.writeFile(OUTPUT_PATH, generatedTypes)

    console.log(`\n✅ Types generated successfully!`)
    console.log(`   Source: ${successfulSource}`)
    console.log(`   Output: ${OUTPUT_PATH}`)

    // Cache the OpenAPI spec if we got it from a URL
    if (successfulSource && (successfulSource.startsWith('http://') || successfulSource.startsWith('https://'))) {
      await saveOpenAPISpec(successfulSource)
    }

    console.log('\n💡 Tip: Commit the generated types to version control to ensure consistency.')
  } catch (error) {
    console.error('\n❌ Failed to write types file:', error)
    process.exit(1)
  }
}

// Handle command line args
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
OpenAPI Type Generator for Scaffald SDK

Usage:
  tsx scripts/generate-types.ts [options]

Options:
  --help, -h     Show this help message

Environment Variables:
  OPENAPI_URL    Custom OpenAPI spec URL (highest priority)
  SUPABASE_URL   Production Supabase URL (will use /functions/v1/api/openapi.json)

Type Generation Sources (in order):
  1. OPENAPI_URL environment variable
  2. SUPABASE_URL/functions/v1/api/openapi.json
  3. http://localhost:54321/functions/v1/api/openapi.json (local dev)
  4. ./openapi-spec.json (cached fallback)

Examples:
  # Generate from local development server
  tsx scripts/generate-types.ts

  # Generate from production
  SUPABASE_URL=https://your-project.supabase.co tsx scripts/generate-types.ts

  # Generate from custom URL
  OPENAPI_URL=https://api.scaffald.com/openapi.json tsx scripts/generate-types.ts
`)
  process.exit(0)
}

generateTypes()
