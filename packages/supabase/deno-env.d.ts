/**
 * Minimal Deno namespace shim for Node.js TypeScript compilation.
 * The actual Deno runtime provides the full implementation.
 */
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined
    set(key: string, value: string): void
    delete(key: string): void
    has(key: string): boolean
    toObject(): Record<string, string>
  }
  const env: Env
}
