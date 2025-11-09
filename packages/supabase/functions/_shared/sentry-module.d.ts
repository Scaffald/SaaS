declare module '@sentry/deno' {
  type JsonValue = unknown

  interface Hub {
    getClient(): { flush(timeout?: number): Promise<boolean> } | null
    getScope(): Scope
    bindClient(client: unknown): void
  }

  interface Scope {
    setUser(user: Record<string, unknown> | null): void
    setContext(name: string, context: JsonValue): void
    setTag(key: string, value: string): void
  }

  interface Transaction {
    setStatus(status: string): void
    setContext(name: string, context: JsonValue): void
    finish(): void
  }

  interface TransactionContext {
    name: string
    op?: string
    [key: string]: JsonValue
  }

  interface CaptureOptions {
    level?: string
    contexts?: Record<string, JsonValue>
    user?: Record<string, unknown>
  }

  interface InitOptions {
    dsn?: string
    environment?: string
    enableTracing?: boolean
    tracesSampleRate?: number
    release?: string
    beforeSend?(event: import('@sentry/types').Event): import('@sentry/types').Event | null
  }

  export function init(options?: InitOptions): void
  export function captureException(
    error: unknown,
    options?: CaptureOptions,
  ): string | undefined
  export function configureScope(callback: (scope: Scope) => void): void
  export function setContext(name: string, context: JsonValue): void
  export function setUser(user: Record<string, unknown> | null): void
  export function getCurrentHub(): Hub
  export function startTransaction(context: TransactionContext): Transaction
}


