/**
 * Request interceptor
 */
export type RequestInterceptor = (
  url: string,
  init: RequestInit
) => Promise<{ url: string; init: RequestInit }> | { url: string; init: RequestInit }

/**
 * Response interceptor
 */
export type ResponseInterceptor = (response: Response) => Promise<Response> | Response

/**
 * Error interceptor
 */
export type ErrorInterceptor = (error: Error) => Promise<Error | Response> | Error | Response

/**
 * Interceptor manager for handling request/response transformations
 */
export class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private errorInterceptors: ErrorInterceptor[] = []

  /**
   * Add a request interceptor
   * Returns an ID that can be used to remove the interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): number {
    this.requestInterceptors.push(interceptor)
    return this.requestInterceptors.length - 1
  }

  /**
   * Add a response interceptor
   * Returns an ID that can be used to remove the interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): number {
    this.responseInterceptors.push(interceptor)
    return this.responseInterceptors.length - 1
  }

  /**
   * Add an error interceptor
   * Returns an ID that can be used to remove the interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): number {
    this.errorInterceptors.push(interceptor)
    return this.errorInterceptors.length - 1
  }

  /**
   * Remove a request interceptor by ID
   */
  removeRequestInterceptor(id: number): void {
    delete this.requestInterceptors[id]
  }

  /**
   * Remove a response interceptor by ID
   */
  removeResponseInterceptor(id: number): void {
    delete this.responseInterceptors[id]
  }

  /**
   * Remove an error interceptor by ID
   */
  removeErrorInterceptor(id: number): void {
    delete this.errorInterceptors[id]
  }

  /**
   * Execute request interceptors
   */
  async executeRequestInterceptors(
    url: string,
    init: RequestInit
  ): Promise<{ url: string; init: RequestInit }> {
    let currentUrl = url
    let currentInit = init

    for (const interceptor of this.requestInterceptors) {
      if (interceptor) {
        const result = await interceptor(currentUrl, currentInit)
        currentUrl = result.url
        currentInit = result.init
      }
    }

    return { url: currentUrl, init: currentInit }
  }

  /**
   * Execute response interceptors
   */
  async executeResponseInterceptors(response: Response): Promise<Response> {
    let currentResponse = response

    for (const interceptor of this.responseInterceptors) {
      if (interceptor) {
        currentResponse = await interceptor(currentResponse)
      }
    }

    return currentResponse
  }

  /**
   * Execute error interceptors
   */
  async executeErrorInterceptors(error: Error): Promise<Error | Response> {
    let currentError: Error | Response = error

    for (const interceptor of this.errorInterceptors) {
      if (interceptor) {
        currentError = await interceptor(currentError as Error)
      }
    }

    return currentError
  }

  /**
   * Clear all interceptors
   */
  clear(): void {
    this.requestInterceptors = []
    this.responseInterceptors = []
    this.errorInterceptors = []
  }
}
