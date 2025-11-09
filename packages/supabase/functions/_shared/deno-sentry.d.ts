declare module 'https://deno.land/x/sentry@8.55.0/types.ts' {
  export interface Event {
    contexts?: Record<string, unknown> & {
      trace?: Record<string, unknown> & {
        duration?: number
      }
    }
    tags?: Record<string, string>
    user?: Record<string, unknown>
    level?: string
    [key: string]: unknown
  }
}

declare module 'https://deno.land/x/sentry@8.55.0/mod.ts' {
  import type { Event } from 'https://deno.land/x/sentry@8.55.0/types.ts'

  export interface Transaction {
    setStatus(status: string): void
    finish(): void
  }

  export interface TransactionOptions {
    name: string
    op?: string
  }

  export function init(options: {
    dsn?: string
    environment?: string
    enableTracing?: boolean
    tracesSampleRate?: number
    release?: string
    beforeSend?: (event: Event) => Event | null
  }): void

  export function captureException(
    error: unknown,
    context?: {
      level?: string
      contexts?: Record<string, unknown>
      user?: { id?: string; email?: string }
    },
  ): void

  export function startTransaction(options: TransactionOptions): Transaction

  export function getCurrentHub(): {
    getClient(): unknown
  }
}

declare module 'npm:@sentry/deno@7.120.3' {
  export * from 'https://deno.land/x/sentry@8.55.0/mod.ts'
  export type { Event } from 'https://deno.land/x/sentry@8.55.0/types.ts'
}

declare module 'jsr:@sentry/deno@7.120.3' {
  export * from 'https://deno.land/x/sentry@8.55.0/mod.ts'
  export type { Event } from 'https://deno.land/x/sentry@8.55.0/types.ts'
}


