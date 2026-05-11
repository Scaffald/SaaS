/**
 * Test Client for REST API
 * Provides a clean interface for making HTTP requests during tests
 */

import {
  fetchWithTimeout,
  TEST_API_BASE_URL,
  TEST_SUPABASE_ANON_KEY,
} from "../setup.ts";

export interface TestClientOptions {
  authToken?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface TestResponse<T = unknown> {
  status: number;
  headers: Headers;
  body: T;
  raw: Response;
}

/**
 * Test HTTP Client for REST API
 */
export class TestClient {
  private baseUrl: string;
  private authToken?: string;
  private apiKey?: string;

  constructor(options: TestClientOptions = {}) {
    this.baseUrl = options.baseUrl || TEST_API_BASE_URL;
    this.authToken = options.authToken;
    this.apiKey = options.apiKey;
  }

  /**
   * Set auth token for subsequent requests
   */
  setAuthToken(token: string | null) {
    this.authToken = token || undefined;
  }

  /**
   * Set API key for subsequent requests
   */
  setApiKey(key: string | null) {
    this.apiKey = key || undefined;
  }

  /**
   * Build headers for request
   */
  private buildHeaders(
    customHeaders: Record<string, string> = {},
  ): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    // Add auth header (JWT takes precedence over API key)
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    } else if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    } else {
      // Use anon key as fallback
      headers["Authorization"] = `Bearer ${TEST_SUPABASE_ANON_KEY}`;
    }

    return headers;
  }

  /**
   * Make HTTP request
   */
  private async request<T = unknown>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      timeout?: number;
    } = {},
  ): Promise<TestResponse<T>> {
    // Build URL with query parameters
    let url = `${this.baseUrl}${path}`;
    if (options.query) {
      const queryParams = new URLSearchParams();
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Build request options
    const requestOptions: RequestInit = {
      method,
      headers: this.buildHeaders(options.headers),
    };

    // Add body for non-GET requests
    if (options.body && method !== "GET") {
      requestOptions.body = JSON.stringify(options.body);
    }

    // Make request with timeout
    const response = await fetchWithTimeout(
      url,
      requestOptions,
      options.timeout || 5000,
    );

    // Parse response body
    let body: T;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      body = await response.json();
    } else {
      body = (await response.text()) as T;
    }

    return {
      status: response.status,
      headers: response.headers,
      body,
      raw: response,
    };
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    path: string,
    options?: {
      query?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      timeout?: number;
    },
  ): Promise<TestResponse<T>> {
    return this.request<T>("GET", path, options);
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    path: string,
    body?: unknown,
    options?: {
      query?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      timeout?: number;
    },
  ): Promise<TestResponse<T>> {
    return this.request<T>("POST", path, { ...options, body });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    path: string,
    body?: unknown,
    options?: {
      query?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      timeout?: number;
    },
  ): Promise<TestResponse<T>> {
    return this.request<T>("PUT", path, { ...options, body });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: {
      query?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      timeout?: number;
    },
  ): Promise<TestResponse<T>> {
    return this.request<T>("PATCH", path, { ...options, body });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    path: string,
    options?: {
      query?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      timeout?: number;
    },
  ): Promise<TestResponse<T>> {
    return this.request<T>("DELETE", path, options);
  }
}

/**
 * Create a test client with optional auth token or API key
 */
export function createTestClient(options: TestClientOptions = {}): TestClient {
  return new TestClient(options);
}

/**
 * Create an authenticated test client
 */
export async function createAuthenticatedClient(
  token: string,
): Promise<TestClient> {
  return new TestClient({ authToken: token });
}

/**
 * Create an API key authenticated test client
 */
export function createApiKeyClient(apiKey: string): TestClient {
  return new TestClient({ apiKey });
}

/**
 * Type-safe response assertions
 */
export function assertStatus(response: TestResponse, expected: number) {
  if (response.status !== expected) {
    throw new Error(
      `Expected status ${expected}, got ${response.status}. Body: ${
        JSON.stringify(
          response.body,
          null,
          2,
        )
      }`,
    );
  }
}

export function assertSuccessResponse<T>(
  response: TestResponse,
): asserts response is TestResponse<{ data: T }> {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `Expected success status (2xx), got ${response.status}. Body: ${
        JSON.stringify(
          response.body,
          null,
          2,
        )
      }`,
    );
  }

  if (
    !response.body || typeof response.body !== "object" ||
    !("data" in response.body)
  ) {
    throw new Error(
      `Expected response body to have 'data' property. Got: ${
        JSON.stringify(
          response.body,
          null,
          2,
        )
      }`,
    );
  }
}

export function assertErrorResponse(
  response: TestResponse,
): asserts response is TestResponse<{ error: string }> {
  if (response.status >= 200 && response.status < 300) {
    throw new Error(
      `Expected error status (4xx or 5xx), got ${response.status}`,
    );
  }

  if (
    !response.body || typeof response.body !== "object" ||
    !("error" in response.body)
  ) {
    throw new Error(
      `Expected response body to have 'error' property. Got: ${
        JSON.stringify(
          response.body,
          null,
          2,
        )
      }`,
    );
  }
}

export function assertPaginatedResponse<T>(
  response: TestResponse,
): asserts response is TestResponse<{
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}> {
  assertSuccessResponse(response);

  if (
    !response.body ||
    typeof response.body !== "object" ||
    !("pagination" in response.body)
  ) {
    throw new Error(
      `Expected response body to have 'pagination' property. Got: ${
        JSON.stringify(
          response.body,
          null,
          2,
        )
      }`,
    );
  }
}
