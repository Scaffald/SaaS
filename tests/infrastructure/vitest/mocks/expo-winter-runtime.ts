/**
 * No-op stand-in for `expo/src/winter` (whose index is only `import './runtime'`).
 *
 * The real runtime is Metro-only wiring. It installs Fast Refresh, HMR and the
 * Metro message socket, and defines `globalThis.__ExpoImportMetaRegistry` —
 * each via a bare CommonJS `require('./x')` on a `.ts` sibling. Vitest
 * transforms the surrounding module to ESM but leaves those requires intact,
 * and Node cannot resolve an extensionless `.ts` file at runtime. Every test
 * importing `expo` therefore aborted before a single test ran, with
 * `Error: Cannot find module './setupFastRefresh'`.
 *
 * Nothing under test wants Fast Refresh, HMR or a Metro socket. The winter
 * *polyfills* (FormData, TextDecoder, URL, AbortSignal, DOMException, fetch)
 * are separate modules imported from elsewhere and are unaffected — the index
 * pulls in the runtime alone.
 *
 * `__ExpoImportMetaRegistry` is still defined, because code reading
 * `import.meta.url` should get a defined value rather than a TypeError. Its
 * real implementation resolves the Metro bundle URL, which does not exist here,
 * so an empty string is the honest answer.
 *
 * Aliased in the root vitest.config.ts.
 */

Object.defineProperty(globalThis, "__ExpoImportMetaRegistry", {
  value: {
    get url() {
      return "";
    },
  },
  enumerable: false,
  writable: true,
  configurable: true,
});

export {};
