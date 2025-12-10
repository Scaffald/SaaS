/**
 * Error Formatter for tRPC
 * REQ-292: Configure tRPC for production deployment
 * TASK-4: Configure environment-based error handling and sanitization
 *
 * Provides environment-aware error formatting:
 * - Development: Full error details with stack traces
 * - Production: Sanitized errors with sensitive information removed
 */

import { TRPCError } from '@trpc/server';
import type { DefaultErrorShape } from '@trpc/server';
import { env, isProduction } from '../../env';

/**
 * Error codes that are safe to expose in production
 * These contain client-friendly messages without sensitive information
 */
const SAFE_ERROR_CODES = new Set([
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'METHOD_NOT_SUPPORTED',
  'TIMEOUT',
  'CONFLICT',
  'PRECONDITION_FAILED',
  'PAYLOAD_TOO_LARGE',
  'TOO_MANY_REQUESTS',
  'CLIENT_CLOSED_REQUEST',
]);

/**
 * Generic error message for production internal errors
 */
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again later.';

/**
 * Format error based on environment
 *
 * Development: Return full error with stack trace
 * Production: Sanitize error message and remove stack traces
 */
export function formatError({ error, shape }: {
  error: TRPCError;
  shape: DefaultErrorShape;
}): DefaultErrorShape {
  // Development: Return full error details
  if (!isProduction()) {
    return shape;
  }

  // Production: Sanitize error

  // Check if error code is safe to expose
  const isSafeError = SAFE_ERROR_CODES.has(error.code);

  // For unsafe errors, use generic message
  const message = isSafeError ? shape.message : GENERIC_ERROR_MESSAGE;

  // Remove stack trace in production
  const { stack, ...shapeWithoutStack } = shape;

  // Sanitize error data (remove any file paths or system info)
  const sanitizedData = shape.data
    ? {
        ...shape.data,
        // Remove stack trace from data as well
        stack: undefined,
        // Remove any cause information that might leak internals
        cause: undefined,
      }
    : shape.data;

  return {
    ...shapeWithoutStack,
    message,
    data: sanitizedData,
  };
}

/**
 * Sanitize error message to remove file paths and system information
 */
function sanitizeMessage(message: string): string {
  // Remove file paths (e.g., /Users/..., C:\Users\..., /var/www/...)
  let sanitized = message.replace(/[A-Za-z]:\\[\w\\/.-]+/g, '[PATH]');
  sanitized = sanitized.replace(/\/[\w\\/.-]+\.ts/g, '[FILE]');
  sanitized = sanitized.replace(/\/[\w\\/.-]+\.js/g, '[FILE]');

  // Remove line and column numbers (e.g., :123:45)
  sanitized = sanitized.replace(/:\d+:\d+/g, '');

  return sanitized;
}
