/**
 * SendGrid Inbound Parse Webhook (no-op)
 * Forsured app removed; this function is retained for deployment compatibility but does not process emails.
 */
import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'

import { createCorsResponse } from '../_shared/cors.ts'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return createCorsResponse('ok')
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }
<<<<<<< HEAD
  // No-op: accept and acknowledge without processing (forsured schema removed)
  return jsonResponse({ received: true })
=======

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
>>>>>>> bcccec207 (chore: SDK integration tests, supabase config, forsured-web updates, and infra cleanup)
})
