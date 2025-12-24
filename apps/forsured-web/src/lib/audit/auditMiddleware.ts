/**
 * Audit Middleware for tRPC
 *
 * REQ-130: Comprehensive Audit Logging with 7-Year Retention
 *
 * This middleware automatically logs all tRPC procedure calls with:
 * - Request timing and duration
 * - User context (id, email, organization)
 * - Procedure path and input (sanitized)
 * - Success/failure status
 * - Error details on failure
 *
 * Usage:
 * ```typescript
 * import { auditMiddleware } from '../lib/audit/auditMiddleware';
 *
 * // Apply to all procedures
 * const auditedProcedure = baseProcedure.use(auditMiddleware);
 *
 * // Or apply selectively
 * export const sensitiveRouter = router({
 *   deleteUser: auditedProcedure
 *     .input(z.object({ userId: z.string() }))
 *     .mutation(async ({ input }) => { ... })
 * });
 * ```
 */

import { auditService } from './AuditService';
import type { AuditCategory, AuditSeverity, AuditOperation } from './types';

/**
 * Map tRPC operation types to AuditOperation types
 */
function mapOperationType(type: 'query' | 'mutation' | 'subscription'): AuditOperation {
  switch (type) {
    case 'query':
      return 'SELECT';
    case 'mutation':
      return 'EXECUTE';
    case 'subscription':
      return 'EXECUTE';
  }
}

// Fields that should never be logged (PII, credentials, etc.)
// All entries must be lowercase for case-insensitive matching
const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'ssn',
  'social_security',
  'creditcard',
  'credit_card',
  'cvv',
  'pin',
  'privatekey',
  'private_key',
]);

/**
 * Sanitize input by removing sensitive fields
 * Creates a deep copy and redacts sensitive values
 */
function sanitizeInput(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
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
 * Determine audit category based on procedure path
 */
function inferCategory(path: string, type: 'query' | 'mutation' | 'subscription'): AuditCategory {
  const lowerPath = path.toLowerCase();

  // Authentication-related
  if (lowerPath.includes('auth') || lowerPath.includes('login') || lowerPath.includes('logout')) {
    return 'authentication';
  }

  // Authorization/permissions
  if (lowerPath.includes('role') || lowerPath.includes('permission') || lowerPath.includes('access')) {
    return 'authorization';
  }

  // Admin operations
  if (lowerPath.includes('admin') || lowerPath.includes('office')) {
    return 'admin';
  }

  // Compliance operations
  if (lowerPath.includes('compliance') || lowerPath.includes('audit') || lowerPath.includes('policy')) {
    return 'compliance';
  }

  // Security operations
  if (lowerPath.includes('security') || lowerPath.includes('breach')) {
    return 'security';
  }

  // Data operations based on type
  if (type === 'mutation') {
    return 'data_modification';
  }

  return 'data_access';
}

/**
 * Determine severity based on operation type and path
 */
function inferSeverity(
  path: string,
  type: 'query' | 'mutation' | 'subscription',
  success: boolean
): AuditSeverity {
  const lowerPath = path.toLowerCase();

  // Failed operations are higher severity
  if (!success) {
    if (lowerPath.includes('auth') || lowerPath.includes('security')) {
      return 'high';
    }
    return 'medium';
  }

  // Delete operations are high severity
  if (lowerPath.includes('delete') || lowerPath.includes('remove')) {
    return 'high';
  }

  // Admin operations are medium severity
  if (lowerPath.includes('admin') || lowerPath.includes('office')) {
    return 'medium';
  }

  // Mutations are medium, queries are low
  if (type === 'mutation') {
    return 'medium';
  }

  return 'low';
}

/**
 * Audit context passed to middleware
 */
export interface AuditContext {
  user?: {
    id: string;
    email?: string;
  };
  organizationId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Options for audit middleware
 */
export interface AuditMiddlewareOptions {
  /**
   * Skip audit logging for certain paths (e.g., health checks)
   */
  skipPaths?: string[];

  /**
   * Override category for specific paths
   */
  categoryOverrides?: Record<string, AuditCategory>;

  /**
   * Override severity for specific paths
   */
  severityOverrides?: Record<string, AuditSeverity>;

  /**
   * Log input data (default: true, sanitized)
   */
  logInput?: boolean;

  /**
   * Log output data (default: false, can be large)
   */
  logOutput?: boolean;
}

const defaultOptions: AuditMiddlewareOptions = {
  skipPaths: ['healthcheck', 'ping'],
  logInput: true,
  logOutput: false,
};

/**
 * Create audit middleware for tRPC
 *
 * This is a factory function that returns a middleware compatible with tRPC.
 * The returned middleware logs all procedure calls to the audit log.
 *
 * @param options - Configuration options
 * @returns tRPC middleware function
 */
export function createAuditMiddleware(options: AuditMiddlewareOptions = {}) {
  const config = { ...defaultOptions, ...options };

  /**
   * The actual middleware function
   * Compatible with tRPC middleware signature
   */
  return async function auditMiddleware<TContext extends AuditContext>({
    ctx,
    path,
    type,
    input,
    next,
  }: {
    ctx: TContext;
    path: string;
    type: 'query' | 'mutation' | 'subscription';
    input: unknown;
    next: () => Promise<{ ok: true; data: unknown } | { ok: false; error: Error }>;
  }) {
    // Skip paths that shouldn't be logged
    if (config.skipPaths?.some((skip) => path.toLowerCase().includes(skip.toLowerCase()))) {
      return next();
    }

    const startTime = performance.now();
    const requestId = ctx.requestId || crypto.randomUUID();

    // Prepare base audit data
    const baseAuditData = {
      category: config.categoryOverrides?.[path] || inferCategory(path, type),
      action: `trpc.${path}`,
      user_id: ctx.user?.id,
      organization_id: ctx.organizationId,
      ip_address: ctx.ipAddress,
      user_agent: ctx.userAgent,
      request_id: requestId,
      resource_type: 'trpc_procedure',
      resource_name: path,
      operation: mapOperationType(type),
      metadata: {
        procedure_path: path,
        procedure_type: type,
        ...(config.logInput && input ? { input: sanitizeInput(input) } : {}),
      },
    };

    try {
      // Execute the procedure
      const result = await next();

      // Calculate duration
      const durationMs = Math.round(performance.now() - startTime);

      // Log success
      await auditService.log({
        ...baseAuditData,
        severity: inferSeverity(path, type, true),
        status: 'success',
        metadata: {
          ...baseAuditData.metadata,
          duration_ms: durationMs,
          ...(config.logOutput && result.ok ? { output_preview: truncateOutput(result.data) } : {}),
        },
      });

      return result;
    } catch (error) {
      // Calculate duration
      const durationMs = Math.round(performance.now() - startTime);

      // Extract error details
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code || 'UNKNOWN';

      // Log failure
      await auditService.log({
        ...baseAuditData,
        severity: inferSeverity(path, type, false),
        status: 'failure',
        error_message: errorMessage,
        metadata: {
          ...baseAuditData.metadata,
          duration_ms: durationMs,
          error_code: errorCode,
          error_message: errorMessage,
        },
      });

      // Re-throw the error
      throw error;
    }
  };
}

/**
 * Truncate output for logging (prevent huge data in logs)
 */
function truncateOutput(output: unknown, maxLength = 500): unknown {
  if (output === null || output === undefined) {
    return output;
  }

  const str = typeof output === 'string' ? output : JSON.stringify(output);
  if (str.length <= maxLength) {
    return output;
  }

  return `[Truncated: ${str.length} chars] ${str.substring(0, maxLength)}...`;
}

/**
 * Pre-configured audit middleware with default options
 *
 * Usage:
 * ```typescript
 * const auditedProcedure = baseProcedure.use(auditMiddleware);
 * ```
 */
export const auditMiddleware = createAuditMiddleware();

/**
 * Audit middleware for sensitive operations
 * Logs input and uses higher severity
 */
export const sensitiveAuditMiddleware = createAuditMiddleware({
  logInput: true,
  logOutput: true,
  severityOverrides: {
    '*': 'high',
  },
});

/**
 * Type-safe wrapper for using audit middleware with tRPC's middleware system
 *
 * Example usage with tRPC:
 * ```typescript
 * import { t } from './trpc';
 * import { createTRPCAuditMiddleware } from '../lib/audit/auditMiddleware';
 *
 * const auditMiddleware = createTRPCAuditMiddleware(t);
 * const auditedProcedure = t.procedure.use(auditMiddleware);
 * ```
 */
export function createTRPCAuditMiddleware<T extends { middleware: (fn: unknown) => unknown }>(
  t: T,
  options: AuditMiddlewareOptions = {}
): ReturnType<T['middleware']> {
  const config = { ...defaultOptions, ...options };

  return t.middleware(async ({ ctx, path, type, input, next }) => {
    // Skip paths that shouldn't be logged
    if (config.skipPaths?.some((skip) => path.toLowerCase().includes(skip.toLowerCase()))) {
      return next();
    }

    const startTime = performance.now();
    const auditCtx = ctx as AuditContext;
    const requestId = auditCtx.requestId || crypto.randomUUID();

    // Prepare base audit data
    const baseAuditData = {
      category: config.categoryOverrides?.[path] || inferCategory(path, type),
      action: `trpc.${path}`,
      user_id: auditCtx.user?.id,
      organization_id: auditCtx.organizationId,
      ip_address: auditCtx.ipAddress,
      user_agent: auditCtx.userAgent,
      request_id: requestId,
      resource_type: 'trpc_procedure',
      resource_name: path,
      operation: mapOperationType(type),
      metadata: {
        procedure_path: path,
        procedure_type: type,
        ...(config.logInput && input ? { input: sanitizeInput(input) } : {}),
      },
    };

    try {
      const result = await next();
      const durationMs = Math.round(performance.now() - startTime);

      // Log success (fire and forget)
      auditService.log({
        ...baseAuditData,
        severity: inferSeverity(path, type, true),
        status: 'success',
        metadata: {
          ...baseAuditData.metadata,
          duration_ms: durationMs,
        },
      }).catch((err) => console.error('[auditMiddleware] Failed to log success:', err));

      return result;
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code || 'UNKNOWN';

      // Log failure (fire and forget)
      auditService.log({
        ...baseAuditData,
        severity: inferSeverity(path, type, false),
        status: 'failure',
        error_message: errorMessage,
        metadata: {
          ...baseAuditData.metadata,
          duration_ms: durationMs,
          error_code: errorCode,
        },
      }).catch((err) => console.error('[auditMiddleware] Failed to log error:', err));

      throw error;
    }
  }) as ReturnType<T['middleware']>;
}
