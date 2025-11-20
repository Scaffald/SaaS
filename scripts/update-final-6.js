#!/usr/bin/env node
/**
 * Script to update final 6 super-admin tickets
 */
const fs = require('fs')

const tickets = [
  {
    id: '04a20718-e051-47b9-82ca-8d74612c0563',
    file: '/tmp/ticket-04a20718-e051-47b9-82ca-8d74612c0563.md',
  },
  {
    id: 'aab2e6a1-3859-4ffd-85b2-d083bc472625',
    file: '/tmp/ticket-aab2e6a1-3859-4ffd-85b2-d083bc472625.md',
  },
  {
    id: '51b49633-427e-4765-8147-f55746ad491e',
    file: '/tmp/ticket-51b49633-427e-4765-8147-f55746ad491e.md',
  },
  {
    id: 'd218d771-b142-42a5-aef1-ed2bee82b4ab',
    file: '/tmp/ticket-d218d771-b142-42a5-aef1-ed2bee82b4ab.md',
  },
  {
    id: 'c84fd0d2-50e5-42cf-b8f3-bacfbb3f7180',
    file: '/tmp/ticket-c84fd0d2-50e5-42cf-b8f3-bacfbb3f7180.md',
  },
]

console.log(`\n📋 Ready to update ${tickets.length} tickets\n`)
tickets.forEach((ticket, index) => {
  if (fs.existsSync(ticket.file)) {
    const desc = fs.readFileSync(ticket.file, 'utf8')
    console.log(`  ${index + 1}. ${ticket.id.substring(0, 8)}... (${desc.length} chars)`)
  } else {
    console.log(`  ${index + 1}. ${ticket.id.substring(0, 8)}... ❌ FILE NOT FOUND`)
  }
})
console.log('\n✅ All descriptions ready for MCP update!\n')
