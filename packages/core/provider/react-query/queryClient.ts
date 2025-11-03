import type { QueryClient } from "@tanstack/react-query";

// Global query client instance accessible throughout the app
let globalQueryClient: QueryClient | null = null;

/**
 * Set the global query client instance
 * Called by QueryProvider during initialization
 */
export function setGlobalQueryClient(client: QueryClient): void {
  globalQueryClient = client;
}

/**
 * Get the global query client instance
 * This allows accessing the query client outside of React components
 * Useful for clearing cache during auth cleanup
 */
export function getGlobalQueryClient(): QueryClient | null {
  return globalQueryClient;
}
