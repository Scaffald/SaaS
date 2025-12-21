/**
 * Shared utilities that are safe to use in both Node.js/React Native
 * and Deno environments.
 *
 * These utilities have no environment-specific dependencies (no dynamic imports,
 * no Node-specific APIs, no Deno-specific APIs).
 */

// Phone validation utilities - pure JavaScript + Zod, safe for all environments
export * from './phone.ts'
