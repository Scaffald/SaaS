import { setupServer } from 'msw/node'
import { handlers } from './handlers.js'

/**
 * Mock Service Worker server for integration tests
 *
 * This intercepts HTTP requests during tests and returns mock responses,
 * allowing us to test the SDK without a live API server.
 */
export const server = setupServer(...handlers)
