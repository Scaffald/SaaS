#!/usr/bin/env tsx
/**
 * Test Script: Send real emails via SendGrid
 *
 * REQ-130: Email Communication Auditability - Phase 2 Testing
 *
 * Usage: pnpm tsx scripts/test-email-sending.ts
 *
 * This sends real emails to mkbernier@gmail.com to:
 * 1. Verify email delivery works
 * 2. Capture webhook payloads for mock creation
 * 3. Test ForSured-specific metadata tracking
 *
 * Prerequisites:
 * - SENDGRID_API_KEY in .env file
 * - SENDGRID_FROM_EMAIL in .env file (verified sender)
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from root .env (repo root is ../../.. from scripts/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

// Verify API key is loaded
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not found in environment')
  console.error('   Make sure it is set in the root .env file')
  process.exit(1)
}

if (!process.env.SENDGRID_FROM_EMAIL) {
  console.error('❌ SENDGRID_FROM_EMAIL not found in environment')
  console.error('   Make sure it is set in the root .env file')
  process.exit(1)
}

console.log('✅ SENDGRID_API_KEY loaded (starts with:', process.env.SENDGRID_API_KEY?.substring(0, 10) + '...)')
console.log('✅ SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL)

// Import email function after env is loaded
import { sendEmail } from '../src/lib/email/emailConfig'

const TEST_RECIPIENT = 'mkbernier@gmail.com'

interface TestEmailResult {
  testName: string
  success: boolean
  messageId?: string
  error?: string
  timestamp: Date
}

const results: TestEmailResult[] = []

/**
 * Test 1: Simple HTML email
 */
async function testSimpleEmail(): Promise<TestEmailResult> {
  const testName = 'Simple HTML Email'
  console.log(`\n📧 Test 1: ${testName}`)

  try {
    const result = await sendEmail({
      to: TEST_RECIPIENT,
      subject: `[ForSured Test] Simple Email - ${new Date().toISOString()}`,
      html: `
        <h1>ForSured Email Test</h1>
        <p>This is a test email from the ForSured application.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p><a href="https://forsured.com/test-link">Click here to test link tracking</a></p>
      `,
      metadata: {
        testType: 'simple',
        timestamp: new Date().toISOString(),
      },
    })

    if (result.success) {
      console.log('   ✅ Email sent successfully')
      console.log('   Message ID:', result.messageId || 'N/A')
      return {
        testName,
        success: true,
        messageId: result.messageId,
        timestamp: new Date(),
      }
    } else {
      console.error('   ❌ Failed:', result.error)
      return {
        testName,
        success: false,
        error: result.error,
        timestamp: new Date(),
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('   ❌ Exception:', errorMessage)
    return {
      testName,
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    }
  }
}

/**
 * Test 2: Email with ForSured context (project, task, etc.)
 */
async function testForSuredContextEmail(): Promise<TestEmailResult> {
  const testName = 'ForSured Context Email'
  console.log(`\n📧 Test 2: ${testName}`)

  try {
    const result = await sendEmail({
      to: TEST_RECIPIENT,
      subject: `[ForSured Test] Context Email - ${new Date().toISOString()}`,
      html: `
        <h1>ForSured Context Test</h1>
        <p>This email includes ForSured-specific context for webhook filtering.</p>
        <h2>Context Data:</h2>
        <ul>
          <li>Project ID: proj-test-123</li>
          <li>Task ID: task-test-456</li>
          <li>Subcontractor ID: sub-test-789</li>
        </ul>
        <p><a href="https://forsured.com/projects/proj-test-123">View Project</a></p>
      `,
      metadata: {
        testType: 'context',
        projectId: 'proj-test-123',
        taskId: 'task-test-456',
        subcontractorId: 'sub-test-789',
        organizationId: 'org-test-000',
        timestamp: new Date().toISOString(),
      },
    })

    if (result.success) {
      console.log('   ✅ Email sent successfully')
      console.log('   Message ID:', result.messageId || 'N/A')
      return {
        testName,
        success: true,
        messageId: result.messageId,
        timestamp: new Date(),
      }
    } else {
      console.error('   ❌ Failed:', result.error)
      return {
        testName,
        success: false,
        error: result.error,
        timestamp: new Date(),
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('   ❌ Exception:', errorMessage)
    return {
      testName,
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    }
  }
}

/**
 * Test 3: Invitation email simulation
 */
async function testInvitationEmail(): Promise<TestEmailResult> {
  const testName = 'Invitation Email'
  console.log(`\n📧 Test 3: ${testName}`)

  try {
    const result = await sendEmail({
      to: TEST_RECIPIENT,
      subject: `[ForSured Test] You're invited to join a project - ${new Date().toISOString()}`,
      html: `
        <h1>You've Been Invited!</h1>
        <p>ABC Construction has invited you to join the "Main Street Renovation" project.</p>
        <p>
          <a href="https://forsured.com/invite/test-invite-code-123"
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Accept Invitation
          </a>
        </p>
        <p>This invitation expires in 7 days.</p>
      `,
      metadata: {
        testType: 'invitation',
        invitationType: 'project',
        invitationId: 'inv-test-123',
        invitationCode: 'test-invite-code-123',
        inviterId: 'user-inviter-456',
        projectId: 'proj-main-street',
        timestamp: new Date().toISOString(),
      },
    })

    if (result.success) {
      console.log('   ✅ Email sent successfully')
      console.log('   Message ID:', result.messageId || 'N/A')
      return {
        testName,
        success: true,
        messageId: result.messageId,
        timestamp: new Date(),
      }
    } else {
      console.error('   ❌ Failed:', result.error)
      return {
        testName,
        success: false,
        error: result.error,
        timestamp: new Date(),
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('   ❌ Exception:', errorMessage)
    return {
      testName,
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    }
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  ForSured Email Sending Test Suite')
  console.log('  Recipient:', TEST_RECIPIENT)
  console.log('  Started:', new Date().toISOString())
  console.log('═══════════════════════════════════════════════════════════')

  // Run all tests with small delays between them
  results.push(await testSimpleEmail())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  results.push(await testForSuredContextEmail())
  await new Promise((resolve) => setTimeout(resolve, 1000))

  results.push(await testInvitationEmail())

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  TEST SUMMARY')
  console.log('═══════════════════════════════════════════════════════════\n')

  const passed = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  results.forEach((result) => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${result.testName}`)
    if (result.messageId) {
      console.log(`   Message ID: ${result.messageId}`)
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
  console.log('\n📬 Next Steps:')
  console.log('   1. Check mkbernier@gmail.com for test emails')
  console.log('   2. Open emails to trigger "opened" webhook events')
  console.log('   3. Click links to trigger "clicked" webhook events')
  console.log('   4. Check webhook capture endpoint for payloads')

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
