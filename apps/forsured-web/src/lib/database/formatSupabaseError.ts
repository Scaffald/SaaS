/**
 * Supabase Error Formatting Utility
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * Formats Supabase errors into user-friendly error messages
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * Formats a Supabase error into a user-friendly error message
 * @param error - The Supabase/Postgrest error object
 * @param operation - Description of the operation that failed (e.g., 'fetching relationships')
 * @returns A formatted Error object with a descriptive message
 */
export function formatSupabaseError(
  error: PostgrestError,
  operation: string
): Error {
  // Extract meaningful error details
  const code = error.code || 'UNKNOWN';
  const message = error.message || 'Unknown error occurred';
  const details = error.details || '';
  const hint = error.hint || '';

  // Build a comprehensive error message
  let formattedMessage = `Error ${operation}: ${message}`;

  if (details) {
    formattedMessage += `\nDetails: ${details}`;
  }

  if (hint) {
    formattedMessage += `\nHint: ${hint}`;
  }

  formattedMessage += `\nError Code: ${code}`;

  // Create and return a new Error object with the formatted message
  const formattedError = new Error(formattedMessage);
  formattedError.name = 'SupabaseError';

  // Preserve the original error for debugging
  (formattedError as any).originalError = error;

  return formattedError;
}
