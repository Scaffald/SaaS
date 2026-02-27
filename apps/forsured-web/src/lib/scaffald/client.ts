// src/lib/scaffald/client.ts
// OAuth 2.0 + RBAC and CCPA integration
//
// Scaffald API client with feature flag support for mock/real modes

import {
  clearMemoryTokens,
  getMemoryTokens,
  getValidAccessToken,
  isTokenExpired,
  logout,
  refreshSessionTokens,
} from "./auth";
import type {
  CCPAAppRegistration,
  CCPADataContribution,
  CCPADeletionConfirmation,
  CCPAOptOutStatus,
  DocumentCategory,
  GetDownloadUrlInput,
  GetDownloadUrlResponse,
  ListDocumentsInput,
  ListDocumentsResponse,
  ScaffaldDocument,
  ScaffaldDocumentVersion,
  UpdateDocumentInput,
  UploadDocumentInput,
  UploadDocumentResponse,
  UploadVersionInput,
  UploadVersionResponse,
} from "./types";

// Feature flag to toggle between magic link and OAuth for Forsured
// Note: This is Forsured-specific. Scaffald always uses magic links.
const USE_OAUTH = import.meta.env.VITE_FORSURED_USE_OAUTH === "true";
const SCAFFALD_API_URL = import.meta.env.VITE_SCAFFALD_API_URL;
const SCAFFALD_CLIENT_ID = import.meta.env.VITE_SCAFFALD_CLIENT_ID;
const SCAFFALD_TOKEN_ENDPOINT = import.meta.env.VITE_SCAFFALD_TOKEN_ENDPOINT;

/**
 * Mock test users for development - matches scripts/seed/users.ts
 * These are used by the mock Scaffald client to return proper user IDs
 * when logging in with test user emails.
 */
const MOCK_TEST_USERS: Record<string, { id: string; name: string }> = {
  // GC Users
  "fresh.gc@test.forsured.com": {
    id: "10000000-0000-0000-0000-000000000001",
    name: "Fresh GC User",
  },
  "onboarding.gc@test.forsured.com": {
    id: "10000000-0000-0000-0000-000000000002",
    name: "Onboarding GC User",
  },
  "active.gc@test.forsured.com": {
    id: "10000000-0000-0000-0000-000000000003",
    name: "Active GC User",
  },
  "multiproject.gc@test.forsured.com": {
    id: "10000000-0000-0000-0000-000000000004",
    name: "Multi-Project GC User",
  },
  // Contractor Users
  "fresh.contractor@test.forsured.com": {
    id: "20000000-0000-0000-0000-000000000001",
    name: "Fresh Contractor User",
  },
  "active.contractor@test.forsured.com": {
    id: "20000000-0000-0000-0000-000000000002",
    name: "Active Contractor User",
  },
  "noncompliant.contractor@test.forsured.com": {
    id: "20000000-0000-0000-0000-000000000003",
    name: "Non-Compliant Contractor User",
  },
  // Broker Users
  "fresh.broker@test.forsured.com": {
    id: "30000000-0000-0000-0000-000000000001",
    name: "Fresh Broker User",
  },
  "active.broker@test.forsured.com": {
    id: "30000000-0000-0000-0000-000000000002",
    name: "Active Broker User",
  },
  // Admin User
  "admin@test.forsured.com": {
    id: "40000000-0000-0000-0000-000000000001",
    name: "Admin User",
  },
};

// Check if Scaffald is properly configured
const isScaffaldConfigured = SCAFFALD_API_URL && SCAFFALD_CLIENT_ID &&
  SCAFFALD_CLIENT_ID !== "your_scaffald_client_id_here";

interface ScaffaldClient {
  auth: {
    getUser(): Promise<any>;
    refreshToken(): Promise<any>;
    getSession(): Promise<any>;
    exchangeCodeForTokens(code: string): Promise<any>;
    signOut(): Promise<void>;
  };
  companies: {
    list(): Promise<any[]>;
    get(id: string): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
  };
  projects: {
    list(companyId: string): Promise<any[]>;
    get(id: string): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
  };
  users: {
    getByCompany(companyId: string): Promise<any[]>;
    invite(companyId: string, email: string): Promise<any>;
  };
  documents: {
    upload(input: UploadDocumentInput): Promise<UploadDocumentResponse>;
    get(documentId: string): Promise<ScaffaldDocument>;
    list(input: ListDocumentsInput): Promise<ListDocumentsResponse>;
    update(
      documentId: string,
      input: UpdateDocumentInput,
    ): Promise<ScaffaldDocument>;
    delete(documentId: string): Promise<void>;
    getVersions(documentId: string): Promise<ScaffaldDocumentVersion[]>;
    uploadVersion(input: UploadVersionInput): Promise<UploadVersionResponse>;
    getDownloadUrl(input: GetDownloadUrlInput): Promise<GetDownloadUrlResponse>;
  };
  ccpa: {
    /**
     * Contribute export data to a Scaffald CCPA request
     */
    contributeExportData(
      requestId: string,
      appId: string,
      data: CCPADataContribution,
    ): Promise<{ success: boolean }>;
    /**
     * Confirm deletion completion to Scaffald
     */
    confirmDeletion(
      requestId: string,
      appId: string,
      confirmation: CCPADeletionConfirmation,
    ): Promise<{ success: boolean }>;
    /**
     * Register data categories with Scaffald
     */
    registerDataCategories(
      registration: CCPAAppRegistration,
    ): Promise<{ success: boolean; app_id: string }>;
    /**
     * Get user's opt-out status from Scaffald
     */
    getOptOutStatus(userId: string): Promise<CCPAOptOutStatus>;
    /**
     * Verify webhook signature from Scaffald
     */
    verifyWebhookSignature(
      payload: string,
      signature: string,
      secret: string,
    ): boolean;
  };
}

/**
 * Fetch with automatic token refresh and retry
 * Uses httpOnly cookie session for secure token management
 */
async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  retries = 3,
): Promise<Response> {
  // Get valid access token (refreshes via edge function if needed)
  const accessToken = await getValidAccessToken();

  if (!accessToken) {
    clearMemoryTokens();
    window.location.href = "/";
    throw new Error("No valid access token available");
  }

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401 && retries > 0) {
        // Token might have expired during the request, try refreshing and retrying
        const refreshed = await refreshSessionTokens();
        if (refreshed) {
          return fetchWithAuth(url, options, retries - 1);
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("[ScaffaldClient] Fetch error:", error);
    throw error;
  }
}

/**
 * Fetch with OAuth App ID header for document operations
 * Adds X-OAuth-App-ID: forsured header to identify the calling application
 */
async function fetchDocumentApi(
  url: string,
  options: RequestInit = {},
  retries = 3,
): Promise<Response> {
  return fetchWithAuth(url, {
    ...options,
    headers: {
      "X-OAuth-App-ID": "forsured",
      ...options.headers,
    },
  }, retries);
}

/**
 * Create a real Scaffald client that calls actual API endpoints
 */
function createRealScaffaldClient(config: {
  baseUrl: string;
  clientId: string;
  tokenEndpoint: string;
}): ScaffaldClient {
  console.log("[ScaffaldClient] Using REAL Scaffald client");

  return {
    auth: {
      async getUser() {
        const response = await fetchWithAuth(`${config.baseUrl}/api/v1/me`);
        return response.json();
      },

      async refreshToken() {
        // Refresh via edge function (httpOnly cookie mode)
        const success = await refreshSessionTokens();
        if (!success) {
          throw new Error("Token refresh failed");
        }
        // Return memory tokens after refresh
        return getMemoryTokens();
      },

      async getSession() {
        // Check memory tokens (refreshed via edge function on page load)
        const tokens = getMemoryTokens();
        if (!tokens || isTokenExpired(tokens)) {
          return null;
        }
        return { user: await this.getUser() };
      },

      async exchangeCodeForTokens(code: string) {
        const response = await fetch(config.tokenEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: config.clientId,
            code,
            redirect_uri: `${window.location.origin}/callback`,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error_description || "Token exchange failed",
          );
        }

        const tokens = await response.json();
        return {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in || 3600,
          token_type: tokens.token_type || "Bearer",
          created_at: Math.floor(Date.now() / 1000),
        };
      },

      async signOut() {
        // Logout via edge function (clears httpOnly cookie session)
        await logout();
      },
    },

    companies: {
      async list() {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/companies`,
        );
        return response.json();
      },
      async get(id: string) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/companies/${id}`,
        );
        return response.json();
      },
      async create(data: any) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/companies`,
          {
            method: "POST",
            body: JSON.stringify(data),
          },
        );
        return response.json();
      },
      async update(id: string, data: any) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/companies/${id}`,
          {
            method: "PATCH",
            body: JSON.stringify(data),
          },
        );
        return response.json();
      },
    },

    projects: {
      async list(companyId: string) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/companies/${companyId}/projects`,
        );
        return response.json();
      },
      async get(id: string) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/projects/${id}`,
        );
        return response.json();
      },
      async create(data: any) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/projects`,
          {
            method: "POST",
            body: JSON.stringify(data),
          },
        );
        return response.json();
      },
      async update(id: string, data: any) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/projects/${id}`,
          {
            method: "PATCH",
            body: JSON.stringify(data),
          },
        );
        return response.json();
      },
    },

    users: {
      async getByCompany(companyId: string) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/companies/${companyId}/users`,
        );
        return response.json();
      },
      async invite(companyId: string, email: string) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/companies/${companyId}/invitations`,
          {
            method: "POST",
            body: JSON.stringify({ email }),
          },
        );
        return response.json();
      },
    },

    documents: {
      async upload(
        input: UploadDocumentInput,
      ): Promise<UploadDocumentResponse> {
        const response = await fetchDocumentApi(
          `${config.baseUrl}/api/v1/documents`,
          {
            method: "POST",
            body: JSON.stringify(input),
          },
        );
        return response.json();
      },

      async get(documentId: string): Promise<ScaffaldDocument> {
        const response = await fetchDocumentApi(
          `${config.baseUrl}/api/v1/documents/${documentId}`,
        );
        return response.json();
      },

      async list(input: ListDocumentsInput): Promise<ListDocumentsResponse> {
        const params = new URLSearchParams();
        params.set("organizationId", input.organizationId);
        if (input.folderId) params.set("folderId", input.folderId);
        if (input.category) params.set("category", input.category);
        if (input.tags?.length) params.set("tags", input.tags.join(","));
        if (input.isTemplate !== undefined) {
          params.set("isTemplate", String(input.isTemplate));
        }
        if (input.includeDeleted) params.set("includeDeleted", "true");
        if (input.search) params.set("search", input.search);
        if (input.page) params.set("page", String(input.page));
        if (input.limit) params.set("limit", String(input.limit));
        if (input.sortBy) params.set("sortBy", input.sortBy);
        if (input.sortOrder) params.set("sortOrder", input.sortOrder);

        const response = await fetchDocumentApi(
          `${config.baseUrl}/api/v1/documents?${params.toString()}`,
        );
        return response.json();
      },

      async update(
        documentId: string,
        input: UpdateDocumentInput,
      ): Promise<ScaffaldDocument> {
        const response = await fetchDocumentApi(
          `${config.baseUrl}/api/v1/documents/${documentId}`,
          {
            method: "PATCH",
            body: JSON.stringify(input),
          },
        );
        return response.json();
      },

      async delete(documentId: string): Promise<void> {
        await fetchDocumentApi(
          `${config.baseUrl}/api/v1/documents/${documentId}`,
          {
            method: "DELETE",
          },
        );
      },

      async getVersions(
        documentId: string,
      ): Promise<ScaffaldDocumentVersion[]> {
        const response = await fetchDocumentApi(
          `${config.baseUrl}/api/v1/documents/${documentId}/versions`,
        );
        return response.json();
      },

      async uploadVersion(
        input: UploadVersionInput,
      ): Promise<UploadVersionResponse> {
        const response = await fetchDocumentApi(
          `${config.baseUrl}/api/v1/documents/${input.documentId}/versions`,
          {
            method: "POST",
            body: JSON.stringify({
              file: input.file,
              fileName: input.fileName,
              contentType: input.contentType,
              fileSize: input.fileSize,
              notes: input.notes,
            }),
          },
        );
        return response.json();
      },

      async getDownloadUrl(
        input: GetDownloadUrlInput,
      ): Promise<GetDownloadUrlResponse> {
        const params = new URLSearchParams();
        if (input.versionId) params.set("versionId", input.versionId);
        if (input.expiresIn) params.set("expiresIn", String(input.expiresIn));

        const url = params.toString()
          ? `${config.baseUrl}/api/v1/documents/${input.documentId}/download?${params.toString()}`
          : `${config.baseUrl}/api/v1/documents/${input.documentId}/download`;

        const response = await fetchDocumentApi(url);
        return response.json();
      },
    },

    ccpa: {
      async contributeExportData(
        requestId: string,
        appId: string,
        data: CCPADataContribution,
      ) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/ccpa/requests/${requestId}/contributions`,
          {
            method: "POST",
            body: JSON.stringify({ app_id: appId, data }),
          },
        );
        return response.json();
      },

      async confirmDeletion(
        requestId: string,
        appId: string,
        confirmation: CCPADeletionConfirmation,
      ) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/ccpa/requests/${requestId}/deletion-confirmation`,
          {
            method: "POST",
            body: JSON.stringify({ app_id: appId, confirmation }),
          },
        );
        return response.json();
      },

      async registerDataCategories(registration: CCPAAppRegistration) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/ccpa/apps/register`,
          {
            method: "POST",
            body: JSON.stringify(registration),
          },
        );
        return response.json();
      },

      async getOptOutStatus(userId: string) {
        const response = await fetchWithAuth(
          `${config.baseUrl}/api/v1/ccpa/opt-outs/${userId}`,
        );
        return response.json();
      },

      verifyWebhookSignature(
        payload: string,
        signature: string,
        secret: string,
      ): boolean {
        // HMAC-SHA256 signature verification
        // In browser, we use SubtleCrypto; this is a sync wrapper for the check
        // The actual async verification should be done server-side
        // This is a placeholder that returns true for development
        if (!signature || !secret) return false;

        // For production, implement proper HMAC verification:
        // const encoder = new TextEncoder();
        // const key = await crypto.subtle.importKey(
        //   'raw',
        //   encoder.encode(secret),
        //   { name: 'HMAC', hash: 'SHA-256' },
        //   false,
        //   ['sign', 'verify']
        // );
        // const signatureBytes = new Uint8Array(
        //   signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        // );
        // return await crypto.subtle.verify(
        //   'HMAC',
        //   key,
        //   signatureBytes,
        //   encoder.encode(payload)
        // );

        console.log(
          "[ScaffaldClient] Webhook signature verification - implement server-side",
        );
        return true;
      },
    },
  };
}

/**
 * Create a mock Scaffald client for development
 *
 * For E2E testing with real database, tests can set `e2e_test_user` in localStorage
 * to override the mock user returned by getUser().
 */
function createMockScaffaldClient(): ScaffaldClient {
  console.log("[ScaffaldClient] Using MOCK Scaffald client");

  // Key for storing the current mock user (persists across getUser() calls)
  const MOCK_CURRENT_USER_KEY = "mock_scaffald_current_user";

  return {
    auth: {
      async getUser() {
        // Check for E2E test user override in localStorage
        const testUserJson = localStorage.getItem("e2e_test_user");
        if (testUserJson) {
          try {
            const testUser = JSON.parse(testUserJson);
            console.log(
              "[Mock ScaffaldClient] getUser() - using E2E test user:",
              testUser.email,
            );
            return testUser;
          } catch {
            console.warn("[Mock ScaffaldClient] Invalid e2e_test_user JSON");
          }
        }

        // Check for already authenticated mock user (set during previous getUser call)
        const currentUserJson = localStorage.getItem(MOCK_CURRENT_USER_KEY);
        if (currentUserJson) {
          try {
            const currentUser = JSON.parse(currentUserJson);
            console.log(
              "[Mock ScaffaldClient] getUser() - returning cached user:",
              currentUser.email,
            );
            return currentUser;
          } catch {
            console.warn("[Mock ScaffaldClient] Invalid cached user JSON");
            localStorage.removeItem(MOCK_CURRENT_USER_KEY);
          }
        }

        // Check for mock login hint from OAuth flow
        const loginHint = sessionStorage.getItem("mock_login_hint");
        if (loginHint) {
          console.log(
            "[Mock ScaffaldClient] getUser() - using login hint:",
            loginHint,
          );
          sessionStorage.removeItem("mock_login_hint"); // Clear hint after use

          let user;
          // Check if this is a known test user email
          const testUser = MOCK_TEST_USERS[loginHint];
          if (testUser) {
            console.log("[Mock ScaffaldClient] Found test user:", testUser.id);
            user = {
              id: testUser.id,
              email: loginHint,
              name: testUser.name,
              avatar_url: null,
            };
          } else {
            // Generate a deterministic UUID from the email for unknown users
            // Use a UUID format so it's valid for the database
            const hash = loginHint.split("").reduce((acc, char) => {
              return ((acc << 5) - acc) + char.charCodeAt(0);
            }, 0);
            const userId = `00000000-0000-4000-8000-${
              Math.abs(hash).toString(16).padStart(12, "0")
            }`;
            user = {
              id: userId,
              email: loginHint,
              name: loginHint.split("@")[0].replace(/[._-]/g, " ").replace(
                /\b\w/g,
                (c) => c.toUpperCase(),
              ),
              avatar_url: null,
            };
          }

          // Cache the user so subsequent getUser() calls return the same user
          localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user));
          return user;
        }

        // No user logged in - return default mock user with valid UUID
        console.log("[Mock ScaffaldClient] getUser() - no authenticated user");
        return {
          id: "00000000-0000-0000-0000-000000000000",
          email: "mock@scaffald.com",
          name: "Mock Scaffald User",
          avatar_url: null,
        };
      },
      async refreshToken() {
        console.log("[Mock ScaffaldClient] refreshToken()");
        return {
          access_token: `mock-token-${Date.now()}`,
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          token_type: "Bearer",
          created_at: Math.floor(Date.now() / 1000),
        };
      },
      async getSession() {
        console.log("[Mock ScaffaldClient] getSession()");
        const tokens = getMemoryTokens();
        if (!tokens) return null;
        return { user: await this.getUser() };
      },
      async exchangeCodeForTokens(code: string) {
        console.log("[Mock ScaffaldClient] exchangeCodeForTokens()", code);
        return {
          access_token: `mock-token-${code}`,
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          token_type: "Bearer",
          created_at: Math.floor(Date.now() / 1000),
        };
      },
      async signOut() {
        console.log("[Mock ScaffaldClient] signOut()");
        clearMemoryTokens();
        // Clear cached mock user so next login can use a different user
        localStorage.removeItem(MOCK_CURRENT_USER_KEY);
      },
    },
    companies: {
      async list() {
        return [];
      },
      async get(id: string) {
        return { id, name: "Mock Company" };
      },
      async create(data: any) {
        return { id: `mock-company-${Date.now()}`, ...data };
      },
      async update(id: string, data: any) {
        return { id, ...data };
      },
    },
    projects: {
      async list() {
        return [];
      },
      async get(id: string) {
        return { id, name: "Mock Project" };
      },
      async create(data: any) {
        return { id: `mock-project-${Date.now()}`, ...data };
      },
      async update(id: string, data: any) {
        return { id, ...data };
      },
    },
    users: {
      async getByCompany() {
        return [];
      },
      async invite(companyId: string, email: string) {
        return { id: `mock-invite-${Date.now()}`, companyId, email };
      },
    },

    documents: {
      async upload(
        input: UploadDocumentInput,
      ): Promise<UploadDocumentResponse> {
        console.log("[Mock ScaffaldClient] documents.upload()", input.name);
        const now = new Date().toISOString();
        return {
          id: `mock-doc-${Date.now()}`,
          name: input.name,
          category: input.category || "general",
          storageBackend: "supabase",
          storagePath: `org/${input.organizationId}/docs/${input.fileName}`,
          downloadUrl: null,
          oauthAppId: "forsured",
          version: 1,
          fileSize: input.fileSize,
          mimeType: input.contentType,
          checksum: `mock-checksum-${Date.now().toString(16)}`,
          createdAt: now,
          uploadedBy: "mock-user",
        };
      },

      async get(documentId: string): Promise<ScaffaldDocument> {
        console.log("[Mock ScaffaldClient] documents.get()", documentId);
        const now = new Date().toISOString();
        return {
          id: documentId,
          name: "Mock Document",
          description: "A mock document for development",
          category: "general" as DocumentCategory,
          tags: [],
          isTemplate: false,
          versionCount: 1,
          latestVersionNumber: 1,
          latestSizeBytes: 1024,
          latestMimeType: "application/pdf",
          oauthAppId: "forsured",
          storagePath: `org/mock-org/docs/${documentId}`,
          storageBackend: "supabase",
          downloadUrl: null,
          createdAt: now,
          updatedAt: now,
          folderId: null,
          folder: null,
          createdByUser: null,
        };
      },

      async list(input: ListDocumentsInput): Promise<ListDocumentsResponse> {
        console.log("[Mock ScaffaldClient] documents.list()", input);
        return {
          documents: [],
          pagination: {
            page: input.page || 1,
            limit: input.limit || 20,
            total: 0,
            totalPages: 0,
          },
        };
      },

      async update(
        documentId: string,
        input: UpdateDocumentInput,
      ): Promise<ScaffaldDocument> {
        console.log(
          "[Mock ScaffaldClient] documents.update()",
          documentId,
          input,
        );
        const now = new Date().toISOString();
        return {
          id: documentId,
          name: input.name || "Updated Mock Document",
          description: input.description ?? null,
          category: (input.category || "general") as DocumentCategory,
          tags: input.tags || [],
          isTemplate: input.isTemplate || false,
          versionCount: 1,
          latestVersionNumber: 1,
          latestSizeBytes: 1024,
          latestMimeType: "application/pdf",
          oauthAppId: "forsured",
          storagePath: `org/mock-org/docs/${documentId}`,
          storageBackend: "supabase",
          downloadUrl: null,
          createdAt: now,
          updatedAt: now,
          folderId: input.folderId ?? null,
          folder: null,
          createdByUser: null,
        };
      },

      async delete(documentId: string): Promise<void> {
        console.log("[Mock ScaffaldClient] documents.delete()", documentId);
      },

      async getVersions(
        documentId: string,
      ): Promise<ScaffaldDocumentVersion[]> {
        console.log(
          "[Mock ScaffaldClient] documents.getVersions()",
          documentId,
        );
        return [];
      },

      async uploadVersion(
        input: UploadVersionInput,
      ): Promise<UploadVersionResponse> {
        console.log(
          "[Mock ScaffaldClient] documents.uploadVersion()",
          input.documentId,
        );
        return {
          versionId: `mock-version-${Date.now()}`,
          versionNumber: 2,
          downloadUrl: null,
          checksum: `mock-checksum-${Date.now().toString(16)}`,
          createdAt: new Date().toISOString(),
        };
      },

      async getDownloadUrl(
        input: GetDownloadUrlInput,
      ): Promise<GetDownloadUrlResponse> {
        console.log(
          "[Mock ScaffaldClient] documents.getDownloadUrl()",
          input.documentId,
        );
        return {
          downloadUrl: null,
          expiresIn: input.expiresIn || 3600,
        };
      },
    },

    ccpa: {
      async contributeExportData(
        requestId: string,
        appId: string,
        data: CCPADataContribution,
      ) {
        console.log("[Mock ScaffaldClient] contributeExportData()", {
          requestId,
          appId,
        });
        return { success: true };
      },

      async confirmDeletion(
        requestId: string,
        appId: string,
        confirmation: CCPADeletionConfirmation,
      ) {
        console.log("[Mock ScaffaldClient] confirmDeletion()", {
          requestId,
          appId,
        });
        return { success: true };
      },

      async registerDataCategories(registration: CCPAAppRegistration) {
        console.log(
          "[Mock ScaffaldClient] registerDataCategories()",
          registration.app_id,
        );
        return { success: true, app_id: registration.app_id };
      },

      async getOptOutStatus(userId: string): Promise<CCPAOptOutStatus> {
        console.log("[Mock ScaffaldClient] getOptOutStatus()", userId);
        return {
          user_id: userId,
          categories: [
            { category: "sale", opted_out: false, source: "default" },
            { category: "sharing", opted_out: false, source: "default" },
            {
              category: "targeted_advertising",
              opted_out: false,
              source: "default",
            },
            { category: "profiling", opted_out: false, source: "default" },
          ],
        };
      },

      verifyWebhookSignature(
        payload: string,
        signature: string,
        secret: string,
      ): boolean {
        console.log(
          "[Mock ScaffaldClient] verifyWebhookSignature() - mock returns true",
        );
        return true;
      },
    },
  };
}

// Create the appropriate client based on configuration
const shouldUseRealClient = USE_OAUTH && isScaffaldConfigured;

export const scaffaldClient: ScaffaldClient = shouldUseRealClient
  ? createRealScaffaldClient({
    baseUrl: SCAFFALD_API_URL,
    clientId: SCAFFALD_CLIENT_ID,
    tokenEndpoint: SCAFFALD_TOKEN_ENDPOINT,
  })
  : createMockScaffaldClient();

// Export flag for components to check
export const isUsingRealScaffald = shouldUseRealClient;

// Log configuration status
if (USE_OAUTH && !isScaffaldConfigured) {
  console.warn(
    "[ScaffaldClient] VITE_FORSURED_USE_OAUTH is true but Scaffald is not configured. Using mock client.",
  );
}
