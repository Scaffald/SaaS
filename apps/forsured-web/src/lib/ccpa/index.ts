/**
 * CCPA Compliance Module - Main Entry Point
 * REQ-131: CCPA Compliance Implementation (USA-Only Scope)
 *
 * This module implements CCPA compliance features including:
 * - Data export (Right to Know)
 * - Data deletion (Right to Delete) with 90-day soft delete
 * - Consent management with audit trail
 * - Breach notification workflow (72-hour requirement)
 */

// Export types
export * from './types';

// Export services
export * from './dataExport';
export * from './dataDeletion';
export * from './consent';
export * from './breachNotification';

// Re-export initialization functions
export { initializeDataExportService } from './dataExport';
export { initializeDataDeletionService } from './dataDeletion';
export { initializeConsentService } from './consent';
export { initializeBreachNotificationService } from './breachNotification';

/**
 * Initialize all CCPA services with Supabase client
 *
 * @param supabaseClient - Supabase client instance
 */
export function initializeCCPAServices(supabaseClient: any) {
  const { initializeDataExportService } = require('./dataExport');
  const { initializeDataDeletionService } = require('./dataDeletion');
  const { initializeConsentService } = require('./consent');
  const { initializeBreachNotificationService } = require('./breachNotification');

  initializeDataExportService(supabaseClient);
  initializeDataDeletionService(supabaseClient);
  initializeConsentService(supabaseClient);
  initializeBreachNotificationService(supabaseClient);
}
