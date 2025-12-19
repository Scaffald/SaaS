// src/api/webhooks/scaffald.ts
// Placeholder for Scaffald webhook handler
import { syncCompany, syncProject, handleProjectDeleted, handleUserRemoved } from '../../services/scaffaldSync';
import { logWebhookEvent } from '../../services/webhookLogService';

interface WebhookEvent {
  type: string;
  data: any;
}

// Mock verifySignature function
function verifySignature(body: any, signature: string | null): boolean {
  console.log('Verifying webhook signature:', signature);
  // In a real application, you would implement actual cryptographic verification
  // using a shared secret. For now, we'll just return true to simulate success.
  return true;
}

export async function handleScaffaldWebhook(req: Request): Promise<Response> {
  const signature = req.headers.get('x-scaffald-signature');
  let requestBody: any;
  try {
    requestBody = await req.json(); // Read body once
  } catch (error) {
    console.error('Failed to parse webhook body:', error);
    await logWebhookEvent({
      direction: 'inbound',
      action: 'PARSE_ERROR',
      result: 'error',
      error_message: `Failed to parse body: ${error}`,
      entity_data: req.body,
    });
    return new Response('Invalid JSON body', { status: 400 });
  }


  if (!verifySignature(requestBody, signature)) {
    await logWebhookEvent({
      direction: 'inbound',
      action: 'SIGNATURE_VERIFICATION',
      result: 'error',
      error_message: 'Invalid signature',
      entity_data: requestBody,
    });
    return new Response('Invalid signature', { status: 401 });
  }

  const event: WebhookEvent = requestBody;

  try {
    switch (event.type) {
      case 'company.updated':
        await syncCompany(event.data.company_id);
        await logWebhookEvent({
          direction: 'inbound',
          action: 'COMPANY_UPDATED',
          result: 'success',
          entity_data: event.data,
        });
        console.log('Webhook: company.updated', event.data);
        break;

      case 'project.created':
      case 'project.updated':
        await syncProject(event.data.project_id);
        await logWebhookEvent({
          direction: 'inbound',
          action: event.type.toUpperCase(),
          result: 'success',
          entity_data: event.data,
        });
        console.log('Webhook: project created/updated', event.data);
        break;

      case 'project.deleted':
        await handleProjectDeleted(event.data.project_id);
        await logWebhookEvent({
          direction: 'inbound',
          action: 'PROJECT_DELETED',
          result: 'success',
          entity_data: event.data,
        });
        console.log('Webhook: project.deleted', event.data);
        break;

      case 'user.removed_from_company':
        await handleUserRemoved(event.data.user_id, event.data.company_id);
        await logWebhookEvent({
          direction: 'inbound',
          action: 'USER_REMOVED_FROM_COMPANY',
          result: 'success',
          entity_data: event.data,
        });
        console.log('Webhook: user.removed_from_company', event.data);
        break;

      default:
        console.log('Unknown webhook event:', event.type);
        await logWebhookEvent({
          direction: 'inbound',
          action: event.type,
          result: 'skipped',
          error_message: 'Unknown event type',
          entity_data: event,
        });
    }
  } catch (err: any) {
    console.error('Error handling webhook event:', event.type, err);
    await logWebhookEvent({
      direction: 'inbound',
      action: event.type,
      result: 'error',
      error_message: err.message,
      entity_data: event,
    });
    return new Response(`Error processing webhook: ${err.message}`, { status: 500 });
  }


  return new Response('OK', { status: 200 });
}
