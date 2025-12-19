/**
 * CORS Middleware for tRPC
 * REQ-292: Configure tRPC for production deployment
 *
 * Implements environment-aware CORS policy:
 * - Development: Allow localhost and local network
 * - Production: Strict allowlist for Vercel domains and custom domain
 */

import { TRPCError } from '@trpc/server';
import { env, isProduction, isDevelopment } from '../../env';

/**
 * Get allowed origins based on environment
 */
export function getAllowedOrigins(): string[] {
  if (isDevelopment()) {
    // Development: Allow localhost and common local development ports
    return [
      'http://localhost:3000',
      'http://localhost:5173', // Vite default
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      // Allow any localhost port for development
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
    ];
  }

  // Production: Parse CORS_ORIGIN environment variable
  // Can be comma-separated list: "https://app.forsured.com,https://forsured.vercel.app"
  const origins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  return [
    ...origins,
    // Allow all Vercel preview deployments for the project
    /^https:\/\/.*\.vercel\.app$/,
  ];
}

/**
 * Check if origin is allowed based on CORS policy
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    // No origin header (e.g., same-origin requests, Postman, curl)
    // Allow in development, deny in production for security
    return isDevelopment();
  }

  const allowedOrigins = getAllowedOrigins();

  return allowedOrigins.some((allowed) => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    }
    // RegExp pattern
    return allowed.test(origin);
  });
}

/**
 * CORS headers for tRPC responses
 */
export function getCorsHeaders(origin: string | undefined): Record<string, string> {
  const allowed = isOriginAllowed(origin);

  if (!allowed) {
    // Don't set CORS headers for disallowed origins
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Validate CORS and throw error if origin not allowed
 */
export function validateCors(origin: string | undefined): void {
  if (!isOriginAllowed(origin)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Origin ${origin || 'unknown'} is not allowed`,
    });
  }
}
