#!/usr/bin/env node
/**
 * Script to update remaining route-explore tickets using descriptions from JSON
 * Reads /tmp/all-remaining-updates.json and outputs update commands
 */

const fs = require('fs');
const { buildDescription, parseTitle, getUserEmail } = require('./update-route-explore-tickets.js');

const updatesFile = '/tmp/all-remaining-updates.json';
const tickets = JSON.parse(fs.readFileSync(updatesFile, 'utf8')).tickets || JSON.parse(fs.readFileSync(updatesFile, 'utf8'));

console.log(`Processing ${tickets.length} tickets...\n`);

// Start from index 7 (tickets 018-014)
for (let i = 7; i < tickets.length; i++) {
  const ticket = tickets[i];
  console.log(`${i - 6}. ${ticket.title}`);
  console.log(`   ID: ${ticket.id}`);
  console.log(`   Description length: ${ticket.description.length} chars\n`);
}

console.log('\n✅ All tickets ready for update via MCP update_task tool');
console.log(`   Use tickets starting from index 7 (${tickets.length - 7} remaining)`);

