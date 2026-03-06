/**
 * SendGrid Inbound Parse Webhook
 * REQ-13: Receives forwarded insurance documents from contractors
 *
 * This webhook:
 * 1. Receives POST requests from SendGrid with email data
 * 2. Validates the sender matches the contractor's registered email
 * 3. Uploads attachments to storage
 * 4. Creates records in insurance_uploads table
 * 5. Sends notifications to contractor and manager
 */
import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

import { corsHeaders, createCorsResponse } from '../_shared/cors.ts'
import { insertNotification } from '../_shared/notifications/utils.ts'

// Types
interface ProcessedFile {
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
}

interface RejectedFile {
  fileName: string
  reason: string
}

// Constants
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
]

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

// Helper functions
function createServiceSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  }

  return createClient(supabaseUrl, serviceKey, {
    global: { headers: { 'X-Client-Info': 'email-inbound-parse' } },
    auth: { persistSession: false },
  })
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

/**
 * Extract contractor ID from inbound email address
 * Format: insurance-{uuid}@inbound.forsured.com
 */
function extractContractorId(recipientEmail: string): string | null {
  const match = recipientEmail.match(/insurance-([a-f0-9-]+)@inbound\.forsured\.com/i)
  return match ? match[1] : null
}

/**
 * Normalize email address for comparison (lowercase, trim)
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Validate file type and size
 */
function validateFile(
  mimeType: string,
  size: number,
  fileName: string
): { valid: boolean; reason?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      reason: `File type '${mimeType}' not allowed. Accepted: PDF, DOCX, JPEG, PNG, GIF`,
    }
  }

  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      reason: `File '${fileName}' exceeds 2MB limit (${(size / 1024 / 1024).toFixed(2)}MB)`,
    }
  }

  return { valid: true }
}

/**
 * Generate storage path for uploaded file
 */
function generateStoragePath(contractorId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${contractorId}/${timestamp}-${sanitizedName}`
}

/**
 * Send rejection email via SendGrid
 */
async function sendRejectionEmail(senderEmail: string): Promise<void> {
  const apiKey = Deno.env.get('SENDGRID_API_KEY')
  if (!apiKey) {
    console.error('SENDGRID_API_KEY not set, cannot send rejection email')
    return
  }

  const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'notifications@forsured.com'
  const fromName = Deno.env.get('SENDGRID_FROM_NAME') ?? 'ForSured'

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: senderEmail }] }],
        from: { email: fromEmail, name: fromName },
        subject: 'ForSured: Unable to Process Your Email',
        content: [
          {
            type: 'text/plain',
            value:
              'This email address is reserved for a specific user. Please contact the person who shared this email address with you and ask them to invite you to ForSured.',
          },
          {
            type: 'text/html',
            value: `
              <p>This email address is reserved for a specific user.</p>
              <p>Please contact the person who shared this email address with you and ask them to invite you to ForSured.</p>
              <p>If you believe this is an error, please contact our support team.</p>
            `,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('Failed to send rejection email:', await response.text())
    }
  } catch (error) {
    console.error('Error sending rejection email:', error)
  }
}

/**
 * Send confirmation email to contractor
 */
async function sendConfirmationEmail(
  contractorEmail: string,
  contractorName: string | null,
  uploadedFiles: ProcessedFile[],
  rejectedFiles: RejectedFile[],
  managerName: string | null
): Promise<void> {
  const apiKey = Deno.env.get('SENDGRID_API_KEY')
  if (!apiKey) {
    console.error('SENDGRID_API_KEY not set, cannot send confirmation email')
    return
  }

  const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'notifications@forsured.com'
  const fromName = Deno.env.get('SENDGRID_FROM_NAME') ?? 'ForSured'
  const appUrl = Deno.env.get('FORSURED_APP_URL') ?? 'https://app.forsured.com'

  const greeting = contractorName ? `Hi ${contractorName},` : 'Hello,'
  const managerText = managerName ? `${managerName}` : 'your manager'

  const uploadedList = uploadedFiles
    .map((f) => `<li>${f.fileName} (${(f.fileSize / 1024).toFixed(1)} KB)</li>`)
    .join('')

  const rejectedList = rejectedFiles.map((f) => `<li>${f.fileName}: ${f.reason}</li>`).join('')

  const rejectedSection = rejectedFiles.length
    ? `
      <p><strong>The following files could not be processed:</strong></p>
      <ul>${rejectedList}</ul>
    `
    : ''

  try {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: contractorEmail }] }],
        from: { email: fromEmail, name: fromName },
        subject: 'ForSured: Insurance Documents Received',
        content: [
          {
            type: 'text/html',
            value: `
              <p>${greeting}</p>
              <p>We received ${uploadedFiles.length} insurance document(s) from you:</p>
              <ul>${uploadedList}</ul>
              <p>These documents are now shared with ${managerText}.</p>
              ${rejectedSection}
              <p><a href="${appUrl}/dashboard">View your documents on ForSured</a></p>
            `,
          },
        ],
      }),
    })
  } catch (error) {
    console.error('Error sending confirmation email:', error)
  }
}

/**
 * Create in-app notification for managers/brokers with relationships to this contractor
 * REQ-13 Task 6: Notification system integration
 */
async function notifyRelatedUsers(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  contractorId: string,
  contractorName: string | null,
  filesCount: number
): Promise<void> {
  const displayName = contractorName ?? 'A contractor'

  console.log(
    `[Notification] ${displayName} uploaded ${filesCount} insurance document(s) via email`
  )

  try {
    // Find all brokers with active relationships to this contractor
    const { data: brokerRelationships, error: brokerError } = await supabase
      .schema('forsured')
      .from('broker_contractor_relationships')
      .select('broker_id, brokers:user_profiles!broker_contractor_relationships_broker_id_fkey(scaffald_user_id)')
      .eq('contractor_id', contractorId)
      .eq('status', 'active')

    if (brokerError) {
      console.error('[Notification] Failed to fetch broker relationships:', brokerError)
    }

    // Get unique user IDs to notify (brokers with scaffald_user_id)
    const userIdsToNotify: string[] = []

    if (brokerRelationships) {
      for (const rel of brokerRelationships) {
        const broker = rel.brokers as { scaffald_user_id: string | null } | null
        if (broker?.scaffald_user_id) {
          userIdsToNotify.push(broker.scaffald_user_id)
        }
      }
    }

    // TODO: Also find managers (GCs) who have this contractor assigned to their projects
    // This will require querying project_subcontractors and getting manager user IDs

    // Create notification for each user
    for (const userId of userIdsToNotify) {
      const notification = await insertNotification(
        supabase,
        {
          user_id: userId,
          title: 'Insurance Documents Received',
          message: `${displayName} has uploaded ${filesCount} insurance document(s) via email.`,
          type: 'insurance_upload',
          severity: 'info',
          preview: `${filesCount} document(s) uploaded`,
          body: {
            contractor_id: contractorId,
            contractor_name: displayName,
            files_count: filesCount,
            upload_method: 'email_forward',
          },
          metadata: {
            contractor_id: contractorId,
          },
          cta_label: 'View Documents',
          cta_url: `/clients/${contractorId}?tab=documents`,
          routed_channels: ['in_app'],
        },
        `insurance_upload_${contractorId}_${Date.now()}` // Unique dedupe key
      )

      if (notification) {
        console.log(`[Notification] Created notification ${notification.id} for user ${userId}`)
      }
    }

    console.log(`[Notification] Notified ${userIdsToNotify.length} users about document uploads`)
  } catch (error) {
    console.error('[Notification] Failed to create notifications:', error)
    // Don't throw - notification failure shouldn't fail the upload
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return createCorsResponse('ok')
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabase = createServiceSupabaseClient()

  try {
    // Parse multipart form data from SendGrid
    const formData = await req.formData()

    // Extract email metadata
    const from = formData.get('from') as string
    const to = formData.get('to') as string
    const subject = formData.get('subject') as string
    const attachmentCountStr = formData.get('attachments') as string
    const attachmentCount = parseInt(attachmentCountStr || '0', 10)

    console.log(`[Inbound Parse] Received email from: ${from}, to: ${to}, attachments: ${attachmentCount}`)

    // Validate required fields
    if (!from || !to) {
      return jsonResponse({ error: 'Missing required fields (from, to)' }, 400)
    }

    // Extract contractor ID from recipient email
    const contractorId = extractContractorId(to)
    if (!contractorId) {
      console.error(`[Inbound Parse] Invalid recipient email format: ${to}`)
      return jsonResponse({ error: 'Invalid recipient email format' }, 400)
    }

    // Look up contractor profile
    const { data: contractor, error: contractorError } = await supabase
      .schema('forsured')
      .from('user_profiles')
      .select('id, email, name, scaffald_user_id')
      .eq('id', contractorId)
      .maybeSingle()

    if (contractorError || !contractor) {
      console.error(`[Inbound Parse] Contractor not found: ${contractorId}`, contractorError)
      return jsonResponse({ error: 'Contractor not found' }, 404)
    }

    // Extract sender email from "Name <email>" format
    const senderEmailMatch = from.match(/<([^>]+)>/) || [null, from]
    const senderEmail = normalizeEmail(senderEmailMatch[1] || from)
    const contractorEmail = contractor.email ? normalizeEmail(contractor.email) : null

    // Validate sender email matches contractor's email
    if (!contractorEmail || senderEmail !== contractorEmail) {
      console.warn(
        `[Inbound Parse] Sender mismatch - expected: ${contractorEmail}, got: ${senderEmail}`
      )

      // Log rejection
      await supabase.schema('forsured').from('email_rejection_log').insert({
        contractor_id: contractorId,
        sender_email: senderEmail,
        recipient_email: to,
        subject: subject || null,
        attachment_count: attachmentCount,
        rejection_reason: 'sender_email_mismatch',
        email_metadata: {
          original_from: from,
          timestamp: new Date().toISOString(),
        },
      })

      // Send rejection email
      await sendRejectionEmail(senderEmail)

      return jsonResponse({ error: 'Unauthorized sender' }, 403)
    }

    // Process attachments
    const uploadedFiles: ProcessedFile[] = []
    const rejectedFiles: RejectedFile[] = []

    // SendGrid sends attachments as attachment1, attachment2, etc.
    for (let i = 1; i <= attachmentCount; i++) {
      const attachment = formData.get(`attachment${i}`) as File | null
      if (!attachment) continue

      const fileName = attachment.name
      const mimeType = attachment.type
      const fileSize = attachment.size

      // Validate file
      const validation = validateFile(mimeType, fileSize, fileName)
      if (!validation.valid) {
        rejectedFiles.push({ fileName, reason: validation.reason ?? 'Invalid file' })
        continue
      }

      // Generate storage path
      const storagePath = generateStoragePath(contractorId, fileName)

      // Upload to storage
      const fileBuffer = await attachment.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('insurance-uploads')
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        })

      if (uploadError) {
        console.error(`[Inbound Parse] Upload error for ${fileName}:`, uploadError)
        rejectedFiles.push({ fileName, reason: 'Upload failed' })
        continue
      }

      // Create record in insurance_uploads table
      const { error: insertError } = await supabase.schema('forsured').from('insurance_uploads').insert({
        contractor_id: contractorId,
        uploaded_by_user_id: contractorId, // Self-upload via email
        upload_method: 'email_forward',
        file_name: fileName,
        file_path: storagePath,
        file_size: fileSize,
        mime_type: mimeType,
        status: 'uploaded',
        email_metadata: {
          sender: from,
          subject: subject || null,
          received_at: new Date().toISOString(),
        },
      })

      if (insertError) {
        console.error(`[Inbound Parse] Insert error for ${fileName}:`, insertError)
        rejectedFiles.push({ fileName, reason: 'Database error' })
        // Try to clean up uploaded file
        await supabase.storage.from('insurance-uploads').remove([storagePath])
        continue
      }

      uploadedFiles.push({
        fileName,
        filePath: storagePath,
        fileSize,
        mimeType,
      })
    }

    // Send confirmation email if any files were uploaded
    if (uploadedFiles.length > 0 && contractor.email) {
      await sendConfirmationEmail(
        contractor.email,
        contractor.name,
        uploadedFiles,
        rejectedFiles,
        null // TODO: Get manager name from relationship
      )

      // Notify manager
      await notifyRelatedUsers(supabase, contractorId, contractor.name, uploadedFiles.length)
    }

    return jsonResponse({
      success: true,
      filesUploaded: uploadedFiles.length,
      filesRejected: rejectedFiles.length,
      uploaded: uploadedFiles.map((f) => f.fileName),
      rejected: rejectedFiles,
    })
  } catch (error) {
    console.error('[Inbound Parse] Unexpected error:', error)
    return jsonResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})
