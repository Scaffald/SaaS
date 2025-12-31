#!/usr/bin/env tsx

import openapiTS from 'openapi-typescript'
import fs from 'node:fs/promises'
import path from 'node:path'

const OPENAPI_URL =
  process.env.OPENAPI_URL || process.env.SUPABASE_URL
    ? `${process.env.SUPABASE_URL}/functions/v1/api/openapi.json`
    : 'http://localhost:54321/functions/v1/api/openapi.json'

const OUTPUT_PATH = path.join(process.cwd(), 'src/types/api.ts')

async function generateTypes() {
  console.log(`📡 Fetching OpenAPI spec from: ${OPENAPI_URL}`)

  try {
    const output = await openapiTS(OPENAPI_URL, {
      exportType: true,
      pathParamsAsTypes: true,
    })

    // Ensure directory exists
    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })

    // Write types file
    await fs.writeFile(OUTPUT_PATH, output)

    console.log(`✅ Types generated successfully at: ${OUTPUT_PATH}`)
  } catch (error) {
    console.error('❌ Failed to generate types:', error)
    process.exit(1)
  }
}

generateTypes()
