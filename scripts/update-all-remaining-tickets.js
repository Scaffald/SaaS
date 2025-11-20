#!/usr/bin/env node
/**
 * Script to update all remaining route-explore tickets
 * Reads from /tmp/final-updates.json and updates each ticket via MCP
 */

const fs = require('fs')
const { execSync } = require('child_process')

const updatesFilePath = '/tmp/final-updates.json'

try {
  const updates = JSON.parse(fs.readFileSync(updatesFilePath, 'utf8'))

  // Skip first 3 (already processed)
  const remaining = updates.slice(3)

  console.log(`📋 Processing ${remaining.length} remaining tickets...\n`)

  remaining.forEach((ticket, index) => {
    const ticketNum = index + 4
    const descFile = `/tmp/ticket-update-${ticket.id}.md`

    try {
      // Write description to temp file
      fs.writeFileSync(descFile, ticket.description)

      console.log(
        `[${ticketNum}/${remaining.length}] Updating ticket ${ticket.id.substring(0, 8)}...`
      )

      // Note: This would need to be done via MCP, not command line
      // This script just prepares the files
      console.log(`   ✅ Description saved to ${descFile}`)
    } catch (error) {
      console.error(`   ❌ Failed to process ticket ${ticket.id}: ${error.message}`)
    }
  })

  console.log(`\n✅ Prepared ${remaining.length} ticket descriptions`)
  console.log(`📝 Ready to update via MCP update_task tool`)
} catch (error) {
  console.error(`Error: ${error.message}`)
  process.exit(1)
}
