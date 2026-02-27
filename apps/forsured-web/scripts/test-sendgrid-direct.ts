#!/usr/bin/env tsx
/**
 * Test Script: Send emails directly via SendGrid API
 *
 * Email Communication Auditability - Phase 2 Testing
 *
 * Usage: pnpm tsx scripts/test-sendgrid-direct.ts
 *
 * This bypasses the email-manager package and sends directly to SendGrid
 * to verify the API key and sender email work correctly.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@forsured.com'
const TEST_RECIPIENT = 'mkbernier@gmail.com'

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not found')
  process.exit(1)
}

console.log('✅ SENDGRID_API_KEY loaded')
console.log('✅ From email:', SENDGRID_FROM_EMAIL)
console.log('✅ To email:', TEST_RECIPIENT)

interface SendGridResponse {
  statusCode: number
  headers: Record<string, string>
}

async function sendEmail(options: {
  to: string
  subject: string
  html: string
  customArgs?: Record<string, string>
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const payload = {
    personalizations: [
      {
        to: [{ email: options.to }],
        custom_args: options.customArgs || {},
      },
    ],
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: 'ForSured Test',
    },
    subject: options.subject,
    content: [
      {
        type: 'text/html',
        value: options.html,
      },
    ],
    // Add categories for webhook filtering
    categories: ['forsured', 'test'],
    // Custom args are passed through to webhooks
    custom_args: {
      forsured: 'true',
      ...options.customArgs,
    },
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    // SendGrid returns 202 Accepted for successful sends
    if (response.status === 202) {
      const messageId = response.headers.get('x-message-id')
      return {
        success: true,
        messageId: messageId || undefined,
      }
    }

    const errorBody = await response.text()
    return {
      success: false,
      error: `HTTP ${response.status}: ${errorBody}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  SendGrid Direct API Test')
  console.log('  Recipient:', TEST_RECIPIENT)
  console.log('  Started:', new Date().toISOString())
  console.log('═══════════════════════════════════════════════════════════')

  const tests = [
    {
      name: 'Simple HTML Email',
      subject: `[ForSured Test] Simple Email - ${new Date().toISOString()}`,
      html: `
        <h1>ForSured Email Test</h1>
        <p>This is a test email from the ForSured application.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p><a href="https://forsured.com/test-link">Click here to test link tracking</a></p>
      `,
      customArgs: {
        testType: 'simple',
      },
    },
    {
      name: 'ForSured Context Email',
      subject: `[ForSured Test] Context Email - ${new Date().toISOString()}`,
      html: `
        <h1>ForSured Context Test</h1>
        <p>This email includes ForSured-specific context for webhook filtering.</p>
        <ul>
          <li>Project ID: proj-test-123</li>
          <li>Task ID: task-test-456</li>
        </ul>
        <p><a href="https://forsured.com/projects/proj-test-123">View Project</a></p>
      `,
      customArgs: {
        testType: 'context',
        projectId: 'proj-test-123',
        taskId: 'task-test-456',
      },
    },
    {
      name: 'Invitation Email',
      subject: `[ForSured Test] You're invited! - ${new Date().toISOString()}`,
      html: `
        <h1>You've Been Invited!</h1>
        <p>ABC Construction has invited you to join the "Main Street Renovation" project.</p>
        <p>
          <a href="https://forsured.com/invite/test-invite-code-123"
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
      `,
      customArgs: {
        testType: 'invitation',
        invitationType: 'project',
        invitationId: 'inv-test-123',
      },
    },
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    console.log(`\n📧 Testing: ${test.name}`)

    const result = await sendEmail({
      to: TEST_RECIPIENT,
      subject: test.subject,
      html: test.html,
      customArgs: test.customArgs,
    })

    if (result.success) {
      console.log('   ✅ Success!')
      console.log('   Message ID:', result.messageId || 'N/A')
      passed++
    } else {
      console.log('   ❌ Failed:', result.error)
      failed++
    }

    // Small delay between sends to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  TEST SUMMARY')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)

  if (passed > 0) {
    console.log('\n📬 Next Steps:')
    console.log('   1. Check mkbernier@gmail.com for test emails')
    console.log('   2. Open emails to trigger "opened" webhook events')
    console.log('   3. Click links to trigger "clicked" webhook events')
    console.log('   4. Start dev server and check webhook capture endpoint:')
    console.log('      GET http://localhost:3000/api/webhooks/sendgrid-capture')
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
