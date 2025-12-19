/**
 * Error Monitoring Integration
 * REQ-292: Configure tRPC for production deployment
 * TASK-5: Integrate error monitoring with metadata logging
 *
 * Captures critical errors in production with sanitized metadata.
 * Future: Can be extended with Sentry SDK integration.
 */

import { TRPCError } from '@trpc/server';
import { env, isProduction } from '../../env';

/**
 * PII-sensitive field patterns to redact
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /auth/i,
  /credit[_-]?card/i,
  /ssn/i,
  /social[_-]?security/i,
];

/**
 * Sanitize input object by redacting sensitive fields
 * Recursively traverses object and arrays
 */
export function sanitizeInput(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item));
  }

  if (typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      // Check if key matches sensitive pattern
      const isSensitive = SENSITIVE_PATTERNS.some((pattern) =>
        pattern.test(key)
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  return input;
}

/**
 * Error metadata for logging
 */
interface ErrorMetadata {
  timestamp: string;
  path: string;
  type: 'query' | 'mutation' | 'subscription' | 'unknown';
  userId?: string;
  organizationId?: string;
  input: unknown;
  error: {
    code: string;
    message: string;
    stack?: string;
  };
}

/**
 * Log error with sanitized metadata
 * In production, this would integrate with Sentry or similar service
 */
export function logError(metadata: ErrorMetadata): void {
  // Only log in production or when explicitly enabled
  if (!isProduction() && !env.ERROR_REPORTING_ENABLED) {
    return;
  }

  // Format as JSON for log aggregation tools
  const logEntry = JSON.stringify(
    {
      level: 'error',
      ...metadata,
      // Add environment info
      environment: env.NODE_ENV,
      vercelEnv: env.VERCEL_ENV,
    },
    null,
    2
  );

  // For now, log to console
  // Future: Send to Sentry or error tracking service
  console.error('🚨 API Error:', logEntry);

  // TODO: Integrate with Sentry
  // if (env.SENTRY_DSN && env.ENABLE_SENTRY) {
  //   Sentry.captureException(metadata.error, {
  //     user: metadata.userId ? { id: metadata.userId } : undefined,
  //     tags: {
  //       path: metadata.path,
  //       type: metadata.type,
  //       errorCode: metadata.error.code,
  //     },
  //     extra: {
  //       input: metadata.input,
  //       organizationId: metadata.organizationId,
  //     },
  //   });
  // }
}

/**
 * Create onError callback for tRPC router
 * Logs errors with sanitized metadata in production
 */
export function createErrorLogger() {
  return ({ error, path, input, ctx, type }: {
    error: TRPCError;
    path: string | undefined;
    input: unknown;
    ctx: {
      session?: { id: string } | null;
      organizationId?: string | null;
    };
    type: 'query' | 'mutation' | 'subscription' | 'unknown';
  }) => {
    // Sanitize input to remove PII
    const sanitizedInput = sanitizeInput(input);

    // Create error metadata
    const metadata: ErrorMetadata = {
      timestamp: new Date().toISOString(),
      path: path || 'unknown',
      type,
      userId: ctx.session?.id,
      organizationId: ctx.organizationId || undefined,
      input: sanitizedInput,
      error: {
        code: error.code,
        message: error.message,
        stack: isProduction() ? undefined : error.stack,
      },
    };

    // Log error
    logError(metadata);
  };
}
