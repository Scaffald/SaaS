/**
 * Node.js Example - Server-side SDK usage
 *
 * This example demonstrates:
 * - API key authentication
 * - Listing jobs with filters
 * - Creating applications
 * - Webhook signature verification
 */

import Scaffald, { verifyWebhookSignature } from '@scaffald/sdk'

// Initialize client with API key
const client = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY || 'sk_test_your_api_key',
})

async function main() {
  try {
    console.log('📋 Fetching jobs...\n')

    // List published jobs
    const jobs = await client.jobs.list({
      status: 'published',
      limit: 5,
      remoteOption: 'remote',
    })

    console.log(`Found ${jobs.pagination.total} total jobs`)
    console.log(`Showing ${jobs.data.length} jobs:\n`)

    jobs.data.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title}`)
      console.log(`   Location: ${job.location || 'Remote'}`)
      console.log(`   Type: ${job.employment_type || 'N/A'}`)
      console.log(`   Created: ${new Date(job.created_at).toLocaleDateString()}\n`)
    })

    // Get similar jobs for the first one
    if (jobs.data.length > 0) {
      const firstJob = jobs.data[0]
      console.log(`\n🔍 Finding jobs similar to "${firstJob.title}"...\n`)

      const similar = await client.jobs.similar(firstJob.id, { limit: 3 })

      similar.data.forEach((job, index) => {
        console.log(`${index + 1}. ${job.title} - ${job.location || 'Remote'}`)
      })
    }

    // Monitor rate limits
    const rateLimitInfo = client.getRateLimitInfo()
    if (rateLimitInfo) {
      console.log(`\n⏱️  Rate Limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining`)
      if (client.isRateLimitApproaching()) {
        console.log('⚠️  Warning: Approaching rate limit!')
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

/**
 * Webhook handler example
 * Use with Express, Fastify, or any Node.js HTTP server
 */
async function handleWebhook(request) {
  const signature = request.headers['x-webhook-signature']
  const payload = request.body

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(
    payload,
    signature,
    process.env.SCAFFALD_WEBHOOK_SECRET
  )

  if (!isValid) {
    throw new Error('Invalid webhook signature')
  }

  // Process webhook
  console.log('✅ Webhook verified!')
  console.log('Event:', payload.event)
  console.log('Data:', payload.data)

  return { success: true }
}

// Run the example
main()

export { handleWebhook }
