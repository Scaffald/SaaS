// Forsured Inbound Email Parse Edge Function
// Receives and processes emails from SendGrid Inbound Parse webhook

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const INBOUND_DOMAIN = Deno.env.get('INBOUND_EMAIL_BASE_DOMAIN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface EmailData {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  attachments?: number;
}

console.log('Email Inbound Parse Function initialized');
console.log('Inbound Domain:', INBOUND_DOMAIN);

Deno.serve(async (req) => {
  try {
    // Log the request for debugging
    console.log('Received request:', {
      method: req.method,
      contentType: req.headers.get('content-type'),
    });

    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Verify request is from SendGrid (multipart/form-data)
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType);
      return new Response('Invalid content type', { status: 400 });
    }

    // Parse the multipart form data from SendGrid
    const formData = await req.formData();

    // Extract email fields
    const to = formData.get('to') as string;
    const from = formData.get('from') as string;
    const subject = formData.get('subject') as string;
    const text = formData.get('text') as string;
    const html = formData.get('html') as string;
    const attachments = formData.get('attachments') as string;

    const emailData: EmailData = {
      to,
      from,
      subject,
      text,
      html,
      attachments: attachments ? parseInt(attachments) : 0,
    };

    console.log('Parsed email:', {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      attachments: emailData.attachments,
    });

    // Validate the recipient domain
    if (!to || !INBOUND_DOMAIN) {
      console.error('Missing recipient or inbound domain');
      return new Response('Configuration error', { status: 500 });
    }

    if (!to.endsWith(`@${INBOUND_DOMAIN}`)) {
      console.error('Invalid recipient domain:', to, 'Expected:', INBOUND_DOMAIN);
      return new Response('Invalid recipient', { status: 400 });
    }

    // Extract identifier from email (e.g., project-12345@inbound.mx.forsured.com)
    const [localPart] = to.split('@');
    const parts = localPart.split('-');

    if (parts.length < 2) {
      console.error('Invalid email format:', localPart);
      return new Response('Invalid email format', { status: 400 });
    }

    const entityType = parts[0]; // e.g., "project", "document", "task"
    const entityId = parts.slice(1).join('-'); // Handle UUIDs with dashes

    console.log('Parsed entity:', { entityType, entityId });

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Log the inbound email to audit_log table for tracking
    const { error: logError } = await supabase
      .from('forsured.audit_log')
      .insert({
        table_name: `email_inbound_${entityType}`,
        action: 'email_received',
        row_id: entityId,
        new_data: {
          from: emailData.from,
          subject: emailData.subject,
          to: emailData.to,
          text_length: emailData.text?.length || 0,
          html_length: emailData.html?.length || 0,
          attachments: emailData.attachments || 0,
        },
        metadata: {
          entity_type: entityType,
          entity_id: entityId,
          processed_at: new Date().toISOString(),
        }
      });

    if (logError) {
      console.error('Error logging email:', logError);
      // Continue processing even if logging fails
    }

    // Process the email based on entity type
    switch (entityType) {
      case 'project':
        await handleProjectEmail(supabase, entityId, emailData);
        break;

      case 'document':
        await handleDocumentEmail(supabase, entityId, emailData);
        break;

      case 'task':
        await handleTaskEmail(supabase, entityId, emailData);
        break;

      case 'test':
        // Test emails - just log and return success
        console.log('Test email received successfully');
        break;

      default:
        console.warn('Unknown entity type:', entityType);
        return new Response(JSON.stringify({
          message: 'Unknown entity type',
          entityType,
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    // Return success response to SendGrid
    return new Response(JSON.stringify({
      success: true,
      message: 'Email processed successfully',
      entityType,
      entityId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing inbound email:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Handler for project-related emails
async function handleProjectEmail(supabase: SupabaseClient, projectId: string, email: EmailData) {
  console.log('Processing project email:', projectId);

  // Example: Create a comment on the project
  const { error } = await supabase
    .from('forsured.project_comments')
    .insert({
      project_id: projectId,
      content: email.text || email.html,
      created_via: 'email',
      metadata: {
        from: email.from,
        subject: email.subject,
        original_to: email.to,
      }
    });

  if (error) {
    console.error('Error creating project comment:', error);
    throw error;
  }

  console.log('Project email processed successfully');
}

// Handler for document-related emails
async function handleDocumentEmail(supabase: SupabaseClient, documentId: string, email: EmailData) {
  console.log('Processing document email:', documentId);

  // Example: Update document with email content or create a note
  const { error } = await supabase
    .from('forsured.document_notes')
    .insert({
      document_id: documentId,
      note: `Email from ${email.from}: ${email.subject}\n\n${email.text}`,
      created_via: 'email',
      metadata: {
        from: email.from,
        subject: email.subject,
      }
    });

  if (error) {
    console.error('Error creating document note:', error);
    throw error;
  }

  console.log('Document email processed successfully');
}

// Handler for task-related emails
async function handleTaskEmail(supabase: SupabaseClient, taskId: string, email: EmailData) {
  console.log('Processing task email:', taskId);

  // Example: Add a comment to the task
  const { error } = await supabase
    .from('forsured.task_comments')
    .insert({
      task_id: taskId,
      comment: email.text || email.html,
      created_via: 'email',
      metadata: {
        from: email.from,
        subject: email.subject,
      }
    });

  if (error) {
    console.error('Error creating task comment:', error);
    throw error;
  }

  console.log('Task email processed successfully');
}

/* Testing:

1. Local testing:
   supabase functions serve email-inbound-parse

2. Send test email using curl:
   curl -X POST 'http://127.0.0.1:54321/functions/v1/email-inbound-parse' \
     -H 'Content-Type: multipart/form-data' \
     -F 'to=test-123@inbound.mx.forsured.com' \
     -F 'from=sender@example.com' \
     -F 'subject=Test Email' \
     -F 'text=This is a test email body' \
     -F 'html=<p>This is a test email body</p>' \
     -F 'attachments=0'

3. Check logs:
   supabase functions logs email-inbound-parse --project-ref qmfmpcyxsihhfttvqpbw

*/
