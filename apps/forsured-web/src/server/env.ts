/**
 * Environment Variable Validation
 * Configure tRPC for production deployment
 *
 * Validates all required environment variables at runtime using Zod.
 * Fails fast if any required variables are missing or invalid.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  // API Configuration
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL').optional(),

  // CORS Configuration
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),

  // Rate Limiting
  ENABLE_RATE_LIMITING: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1))
    .default('100'),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1000))
    .default('60000'), // 1 minute default

  // Monitoring & Observability
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),
  ENABLE_SENTRY: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns typed config
 * Throws error if validation fails
 */
export function validateEnv(): Env {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    SENTRY_DSN: process.env.SENTRY_DSN,
    ENABLE_SENTRY: process.env.ENABLE_SENTRY,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

/**
 * Validated and typed environment configuration
 * Available throughout the application
 */
export const env = validateEnv();

/**
 * Helper to check if running in production
 */
export const isProduction = () => env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production';

/**
 * Helper to check if running in development
 */
export const isDevelopment = () => env.NODE_ENV === 'development';
