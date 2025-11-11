#!/usr/bin/env node
/**
 * Script to update all remaining tickets via MCP
 * Uses the generated descriptions from /tmp/all-remaining-updates.json
 */

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/all-remaining-updates.json', 'utf8'));

console.log(`\n📋 Ready to update ${data.total} tickets via MCP`);
console.log(`\nTickets to update:`);
data.tickets.forEach((ticket, idx) => {
  const match = ticket.title.match(/(admin|super-admin)-route-explore-(\d+)/);
  const num = match ? match[2] : '?';
  console.log(`  ${idx + 1}. ${ticket.title} (${ticket.description.length} chars)`);
});

console.log(`\n✅ All descriptions ready!`);
console.log(`\nNext step: Update each ticket via MCP update_task tool.`);

module.exports = { tickets: data.tickets };

