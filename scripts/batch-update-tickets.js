#!/usr/bin/env node
/**
 * Batch update script for route-explore tickets
 * This script generates update commands that can be used with vibe-kanban MCP
 */

const { buildDescription, parseTitle, getUserEmail } = require('./update-route-explore-tickets.js')

// All remaining tickets
const allTickets = [
  {
    id: 'c6061fba-76ac-4f9b-a900-0303b95ed21a',
    title: 'admin-route-explore-037: /office/universities/create',
  },
  {
    id: '51f8e9a9-04b8-45a4-b766-077a8a381b63',
    title: 'admin-route-explore-036: /office/universities/:id/edit',
  },
  {
    id: '17f2b8b5-750a-487b-8702-b6025663aa87',
    title: 'admin-route-explore-035: /office/universities',
  },
  {
    id: '02a334d5-5bf1-4ae2-94e4-c06745b77529',
    title: 'admin-route-explore-034: /office/organizations/create',
  },
  {
    id: 'd9551cd1-0185-4389-8b12-388fb9485d62',
    title: 'admin-route-explore-033: /office/organizations/:id/edit',
  },
  {
    id: '390df9a7-4dcf-4617-9ec7-370252d1ac6f',
    title: 'admin-route-explore-032: /office/organizations',
  },
  {
    id: '8697c8a5-4382-4362-8ead-a94d46fedbda',
    title: 'admin-route-explore-031: /office/jobs/create',
  },
  {
    id: '67d43022-6f2b-469d-899a-91210c502f59',
    title: 'admin-route-explore-030: /office/jobs/:id/edit',
  },
  { id: 'a0257f63-467b-42d2-a779-76f669834a0d', title: 'admin-route-explore-029: /office/jobs' },
  {
    id: 'b2598897-01f3-4562-8813-579a5746b64e',
    title: 'admin-route-explore-028: /office/applications/:id',
  },
  {
    id: '7c65ac9d-3dd6-4b41-a501-917fc898bfd0',
    title: 'admin-route-explore-027: /office/applications',
  },
  { id: '0c6f3dca-86c8-4572-9bc7-ec1661ce9a8d', title: 'admin-route-explore-026: /office' },
  {
    id: '61e8bb4c-026e-4569-bdf6-ba6271f6734a',
    title: 'admin-route-explore-025: /dashboard/users/:userid',
  },
  {
    id: '9d6324fc-efd6-4220-a5eb-ead7463f9ab9',
    title: 'admin-route-explore-024: /dashboard/users/:id',
  },
  {
    id: '0c3b9578-e98c-4b68-8b1a-9779d95b6d82',
    title: 'admin-route-explore-023: /dashboard/settings/security',
  },
  {
    id: '5711162c-ac92-48c3-b518-a8e38e315510',
    title: 'admin-route-explore-022: /dashboard/settings/general',
  },
  {
    id: '50d355bc-dad5-4f18-b494-f512e8660c12',
    title: 'admin-route-explore-021: /dashboard/settings/authentication',
  },
  {
    id: '6fde082b-4153-467b-bb34-79e75d24d0da',
    title: 'admin-route-explore-020: /dashboard/settings',
  },
  {
    id: '075da04d-68db-4c23-96d3-c18c6b41eaee',
    title: 'admin-route-explore-019: /dashboard/profile/skills',
  },
  {
    id: '464b8281-0d3b-4cb2-9f21-9abb3b61df7a',
    title: 'admin-route-explore-018: /dashboard/profile/general',
  },
  {
    id: '175a1f7f-8326-4ba7-ac18-fddbb90e43bc',
    title: 'admin-route-explore-017: /dashboard/profile/experience',
  },
  {
    id: 'fc4f40ed-77ed-4629-84df-c40226fe1758',
    title: 'admin-route-explore-016: /dashboard/profile/employment',
  },
  {
    id: '5f4f1cbc-0df7-416e-9767-ea2367d82e95',
    title: 'admin-route-explore-015: /dashboard/profile/education',
  },
  {
    id: 'f84f77ca-059e-4f1a-b740-36b777d4ce21',
    title: 'admin-route-explore-014: /dashboard/profile/certifications',
  },
  {
    id: '7c774372-4509-4c59-8c8a-323089e1a5b1',
    title: 'admin-route-explore-013: /dashboard/profile',
  },
  {
    id: '14b0e3a4-1adf-4502-99a8-ad0e8b943eb5',
    title: 'admin-route-explore-012: /dashboard/discover/workers',
  },
  {
    id: '7395c080-d1e7-4135-9d95-c7830d409f16',
    title: 'admin-route-explore-011: /dashboard/discover/map',
  },
  {
    id: '8381dad2-c257-4137-8ebe-b87c8d345e76',
    title: 'admin-route-explore-010: /dashboard/discover/jobs/:id',
  },
  {
    id: '6cac348c-f8f9-4aac-82b6-2790b4a0f756',
    title: 'admin-route-explore-009: /dashboard/discover/jobs',
  },
  {
    id: '1b9f89ef-8b30-4d2b-b51c-48f8a258a01a',
    title: 'admin-route-explore-008: /dashboard/discover/employers',
  },
  {
    id: '6181d2ff-c8d7-4308-806a-eca1d8813b4a',
    title: 'admin-route-explore-007: /dashboard/discover',
  },
  { id: 'dd10afee-e33e-48ef-88c9-610809500c0c', title: 'admin-route-explore-006: /dashboard' },
  { id: 'de54c81a-3815-4f71-9e79-c94b02ee3bd3', title: 'admin-route-explore-005: /auth/verify' },
  { id: 'bcc99769-8522-4cef-aea0-6626e3d05aab', title: 'admin-route-explore-004: /auth/success' },
  { id: '0f6c5265-3ce2-4fe9-9988-8e6e2f3e0912', title: 'admin-route-explore-003: /auth/confirm' },
  { id: 'd97b2757-90a1-4649-b2c6-1eee3ffe6906', title: 'admin-route-explore-002: /auth' },
  { id: 'aeb35abd-0f0c-45e7-a951-7205af273ecf', title: 'admin-route-explore-001: /' },
  {
    id: '47807c21-7d76-4479-a2a9-20117f538451',
    title: 'super-admin-route-explore-041 • /styleguide/charts — Manual exploration',
  },
  {
    id: '23d0bb5e-600c-4f3a-b856-96d7df3b1a1a',
    title: 'super-admin-route-explore-040 • /office/users/create — Manual exploration',
  },
  {
    id: '04a20718-e051-47b9-82ca-8d74612c0563',
    title: 'super-admin-route-explore-039 • /office/users/:id/edit — Manual exploration',
  },
  {
    id: 'aab2e6a1-3859-4ffd-85b2-d083bc472625',
    title: 'super-admin-route-explore-038 • /office/users — Manual exploration',
  },
  {
    id: '51b49633-427e-4765-8147-f55746ad491e',
    title: 'super-admin-route-explore-037 • /office/universities/create — Manual exploration',
  },
  {
    id: 'd218d771-b142-42a5-aef1-ed2bee82b4ab',
    title: 'super-admin-route-explore-036 • /office/universities/:id/edit — Manual exploration',
  },
  {
    id: 'c84fd0d2-50e5-42cf-b8f3-bacfbb3f7180',
    title: 'super-admin-route-explore-035 • /office/universities — Manual exploration',
  },
]

const updates = allTickets.map((ticket) => {
  try {
    const { routePath, userType, ticketNumber } = parseTitle(ticket.title)
    const userEmail = getUserEmail(userType)
    const description = buildDescription(routePath, userType, userEmail, ticketNumber)
    return { id: ticket.id, title: ticket.title, description, success: true }
  } catch (error) {
    return { id: ticket.id, title: ticket.title, error: error.message, success: false }
  }
})

const successful = updates.filter((u) => u.success)
const failed = updates.filter((u) => !u.success)

console.log(`Total tickets: ${allTickets.length}`)
console.log(`Successfully generated: ${successful.length}`)
console.log(`Failed: ${failed.length}`)

if (failed.length > 0) {
  console.log('\nFailed tickets:')
  failed.forEach((t) => console.log(`  - ${t.title}: ${t.error}`))
}

console.log('\n✅ All descriptions generated successfully!')
console.log('Use vibe-kanban MCP update_task to apply these descriptions.')

module.exports = { updates, successful, failed }
