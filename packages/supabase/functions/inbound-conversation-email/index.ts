/**
 * Inbound Conversation Email Edge Function (no-op)
 * Forsured app removed; this function is retained for deployment compatibility but does not process emails.
 */
import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'
import { createCorsResponse } from '../_shared/cors'

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, 500)
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // SendGrid sends multipart form data
    const formData = await req.formData()

    const to = formData.get('to') as string
    const from = formData.get('from') as string
    const subject = formData.get('subject') as string
    const text = formData.get('text') as string
    const html = formData.get('html') as string
    const attachmentCountRaw = formData.get('attachments') as string | null

    if (!to || !from) {
      console.error('Missing required fields: to or from')
      return jsonResponse({ status: 'error', reason: 'missing_fields' })
    }

    // Extract email addresses from "Name <email>" format
    const senderEmail = extractEmail(from)
    const recipientEmail = extractEmail(to)
    const attachmentCount = parseInt(attachmentCountRaw || '0', 10)

    // 1. Look up conversation by inbound email address
    const { data: conversation, error: convError } = await supabase
      .schema('forsured')
      .from('conversations')
      .select('id, status, task_id, organization_id')
      .eq('inbound_email_address', recipientEmail)
      .single()

    if (convError || !conversation) {
      // Log rejection and return 200 (non-200 causes SendGrid retries)
      await supabase
        .schema('forsured')
        .from('email_rejection_log')
        .insert({
          sender_email: senderEmail,
          recipient_email: recipientEmail,
          rejection_reason: 'conversation_not_found',
          subject: subject,
          attachment_count: attachmentCount,
        })

      console.log(`Rejected inbound email: conversation not found for ${recipientEmail}`)
      return jsonResponse({ status: 'rejected', reason: 'conversation_not_found' })
    }

    // 2. Check conversation is active
    if (conversation.status !== 'active') {
      await supabase
        .schema('forsured')
        .from('email_rejection_log')
        .insert({
          sender_email: senderEmail,
          recipient_email: recipientEmail,
          rejection_reason: 'conversation_archived',
          subject: subject,
          attachment_count: attachmentCount,
        })

      console.log(`Rejected inbound email: conversation ${conversation.id} is archived`)
      return jsonResponse({ status: 'rejected', reason: 'conversation_archived' })
    }

    // 3. Verify sender is a participant
    const { data: senderParticipant } = await supabase
      .schema('forsured')
      .rpc('verify_conversation_email_sender', {
        p_conversation_id: conversation.id,
        p_sender_email: senderEmail,
      })

    if (!senderParticipant || senderParticipant.length === 0) {
      await supabase
        .schema('forsured')
        .from('email_rejection_log')
        .insert({
          sender_email: senderEmail,
          recipient_email: recipientEmail,
          rejection_reason: 'sender_not_participant',
          subject: subject,
          attachment_count: attachmentCount,
        })

      console.log(`Rejected inbound email: sender ${senderEmail} not a participant in ${conversation.id}`)
      return jsonResponse({ status: 'rejected', reason: 'sender_not_participant' })
    }

    const senderId = senderParticipant[0].user_id

    // 4. Extract and clean message body
    // Prefer plain text, fall back to stripped HTML
    const messageBody = cleanEmailBody(text || stripHtml(html || ''))

    if (!messageBody.trim()) {
      console.log(`Rejected inbound email: empty message body from ${senderEmail}`)
      return jsonResponse({ status: 'rejected', reason: 'empty_message' })
    }

    // 5. Store message
    // Content stored as { plaintext_pending_encryption: messageBody } since
    // the edge function does not have access to the encryption key vault.
    // The application layer will encrypt on first read.
    const { data: message, error: msgError } = await supabase
      .schema('forsured')
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        sender_user_id: senderId,
        encrypted_content: { plaintext_pending_encryption: messageBody },
        source: 'email',
        email_metadata: {
          subject,
          from: senderEmail,
          message_id: formData.get('Message-Id'),
          in_reply_to: formData.get('In-Reply-To'),
        },
      })
      .select()
      .single()

    if (msgError || !message) {
      console.error('Failed to insert message:', msgError)
      return jsonResponse({ status: 'error', reason: 'insert_failed' })
    }

    // 6. Process attachments
    const attachmentNames: string[] = []

    for (let i = 1; i <= attachmentCount; i++) {
      const file = formData.get(`attachment${i}`) as File | null
      if (!file) continue

      const storagePath = `${conversation.id}/${message.id}/${file.name}`

      // Upload to conversation-attachments bucket
      const { error: uploadError } = await supabase.storage
        .from('conversation-attachments')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error(`Failed to upload attachment ${file.name}:`, uploadError)
        continue
      }

      // Record attachment in database
      const { error: attachError } = await supabase
        .schema('forsured')
        .from('conversation_attachments')
        .insert({
          message_id: message.id,
          conversation_id: conversation.id,
          storage_path: storagePath,
          original_filename: file.name,
          mime_type: file.type,
          file_size_bytes: file.size,
        })

      if (attachError) {
        console.error(`Failed to record attachment ${file.name}:`, attachError)
        continue
      }

      attachmentNames.push(file.name)
    }

    // 7. Trigger async notification processing via pg_notify
    await supabase
      .schema('forsured')
      .rpc('notify_conversation_message', {
        p_conversation_id: conversation.id,
        p_message_id: message.id,
        p_sender_user_id: senderId,
      })

    console.log(
      `Accepted inbound email: message ${message.id} in conversation ${conversation.id}, ` +
        `${attachmentNames.length} attachments`
    )

    return jsonResponse({
      status: 'accepted',
      messageId: message.id,
      attachments: attachmentNames.length,
    })
  } catch (error) {
    console.error('Inbound email processing error:', error)
    // Always return 200 to prevent SendGrid retries
    return jsonResponse({ status: 'error', reason: 'processing_failed' })
  }
})
