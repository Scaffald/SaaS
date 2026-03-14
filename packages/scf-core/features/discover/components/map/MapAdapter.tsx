/**
 * MapAdapter base file — Metro resolves to .web.tsx or .native.tsx at runtime.
 * This file exists for TypeScript to resolve the import.
 * At runtime on web, MapAdapter.web.tsx is used.
 * At runtime on native, MapAdapter.native.tsx is used.
 */
export { MapAdapter } from './MapAdapter.web'
