/**
 * Analytics Client - Platform-Agnostic Export
 * 
 * This file provides a unified export for the analytics client that works
 * across all platforms (web and native). The actual implementation is in
 * platform-specific files that are resolved at build time:
 * 
 * - client.web.ts - For web platforms (uses posthog-js)
 * - client.native.ts - For React Native platforms (uses posthog-react-native)
 * 
 * TypeScript will see this file during type-checking, while bundlers (Metro, Webpack)
 * will resolve the correct platform-specific file at build time using platform extensions.
 */

// Export all analytics client functionality
// The actual exports will be resolved from platform-specific files at build time
export * from './client.web';

// Re-export types for convenience
export type { EventProperties, InitAnalyticsOptions } from './types';

