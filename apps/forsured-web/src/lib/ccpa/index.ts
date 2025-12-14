/**
 * CCPA Compliance Module - Main Entry Point
 * REQ-131: CCPA Compliance Implementation (USA-Only Scope)
 * REQ-3: CCPA Compliance with Scaffald Integration
 *
 * This module implements CCPA compliance features including:
 * - Data export (Right to Know)
 * - Data deletion (Right to Delete) with 90-day soft delete
 * - Consent management with audit trail
 * - Breach notification workflow (72-hour requirement)
 * - Forsured data collector for Scaffald integration
 * - Forsured deletion handler with retention requirements
 */

// Export types
export * from './types';

// Export services
export * from './dataExport';
export * from './dataDeletion';
export * from './consent';
export * from './breachNotification';

// Export Forsured-specific CCPA integration (REQ-3)
export * from './forsured-data-collector';
export * from './forsured-deletion-handler';

// Re-export initialization functions
export { initializeDataExportService } from './dataExport';
export { initializeDataDeletionService } from './dataDeletion';
export { initializeConsentService } from './consent';
export { initializeBreachNotificationService } from './breachNotification';
export { initializeForsuredDataCollector } from './forsured-data-collector';
export { initializeForsuredDeletionHandler } from './forsured-deletion-handler';

/**
 * Initialize all CCPA services with Supabase client
 *
 * @param supabaseClient - Supabase client instance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeCCPAServices(supabaseClient: any) {
  const { initializeDataExportService } = require('./dataExport');
  const { initializeDataDeletionService } = require('./dataDeletion');
  const { initializeConsentService } = require('./consent');
  const { initializeBreachNotificationService } = require('./breachNotification');
  const { initializeForsuredDataCollector } = require('./forsured-data-collector');
  const { initializeForsuredDeletionHandler } = require('./forsured-deletion-handler');

  initializeDataExportService(supabaseClient);
  initializeDataDeletionService(supabaseClient);
  initializeConsentService(supabaseClient);
  initializeBreachNotificationService(supabaseClient);
  initializeForsuredDataCollector(supabaseClient);
  initializeForsuredDeletionHandler(supabaseClient);
}
