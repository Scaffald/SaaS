import type { HttpClient } from '../http/client.js'

export abstract class Resource {
  protected client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  protected get<T>(path: string, query?: Record<string, any>): Promise<T> {
    return this.client.get<T>(path, query)
  }

  protected post<T>(path: string, body?: any, idempotencyKey?: string): Promise<T> {
    return this.client.post<T>(path, body, undefined, idempotencyKey)
  }

  protected put<T>(path: string, body?: any): Promise<T> {
    return this.client.put<T>(path, body)
  }

  protected patch<T>(path: string, body?: any): Promise<T> {
    return this.client.patch<T>(path, body)
  }

  protected del<T>(path: string): Promise<T> {
    return this.client.delete<T>(path)
  }
}
