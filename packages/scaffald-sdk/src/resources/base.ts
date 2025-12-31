import type { HttpClient } from '../http/client.js'

/**
 * Base resource class
 * All API resources extend this class
 */
export abstract class BaseResource {
  protected client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Get the HTTP client instance
   */
  protected getClient(): HttpClient {
    return this.client
  }
}
