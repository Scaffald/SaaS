#!/usr/bin/env node
/**
 * Script to update all remaining route-explore tickets via MCP
 * This script reads from /tmp/final-updates.json and processes all remaining tickets
 */

const fs = require('fs')

const updatesFilePath = '/tmp/final-updates.json'

try {
  const updates = JSON.parse(fs.readFileSync(updatesFilePath, 'utf8'))

  // Skip first 4 (already processed: 3 from earlier + 1 just now)
  const remaining = updates.slice(4)

  console.log(`📋 Processing ${remaining.length} remaining tickets...\n`)

  // Write all descriptions to individual files for easy access
  remaining.forEach((ticket, index) => {
    const ticketNum = index + 5
    const descFile = `/tmp/ticket-update-${ticket.id}.md`

    try {
      fs.writeFileSync(descFile, ticket.description)
      console.log(
        `[${ticketNum}/${remaining.length}] Prepared: ${ticket.id.substring(0, 8)}... -> ${descFile}`
      )
    } catch (error) {
      console.error(`   ❌ Failed to process ticket ${ticket.id}: ${error.message}`)
    }
  })

  console.log(`\n✅ Prepared ${remaining.length} ticket descriptions`)
  console.log(`📝 All descriptions ready in /tmp/ticket-update-*.md files`)
  console.log(`\nNext: Update each ticket via MCP update_task tool`)
} catch (error) {
  console.error(`Error: ${error.message}`)
  process.exit(1)
}
