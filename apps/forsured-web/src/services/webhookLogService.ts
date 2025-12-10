// src/services/webhookLogService.ts

interface WebhookLogEntry {
  sync_id?: string;
  direction: 'inbound' | 'outbound';
  action: string;
  entity_data?: any;
  result: 'success' | 'error' | 'skipped';
  error_message?: string;
}

export async function logWebhookEvent(entry: WebhookLogEntry) {
  console.log('Mock Webhook Log:', entry);
  // In a real application, this would send data to the backend API to be stored in forsured.scaffald_sync_log
  return Promise.resolve();
}
