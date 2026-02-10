/**
 * Type definitions for auth edge functions
 * Authentication flow - shared types
 */

// Token response from Scaffald OAuth
export interface ScaffaldTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

// User info from Scaffald
export interface ScaffaldUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
}

// Request body for token exchange
export interface TokenExchangeRequest {
  code: string;
  code_verifier?: string;
  redirect_uri: string;
}

// Response from auth-token-exchange
export interface TokenExchangeResponse {
  success: boolean;
  user?: ScaffaldUser;
  access_token?: string;
  expires_at?: string;
  error?: string;
}

// Response from auth-session
export interface SessionResponse {
  valid: boolean;
  user?: ScaffaldUser;
  access_token?: string;
  expires_at?: string;
  error?: string;
}

// Response from auth-refresh
export interface RefreshResponse {
  success: boolean;
  access_token?: string;
  expires_at?: string;
  error?: string;
}

// Response from auth-logout
export interface LogoutResponse {
  success: boolean;
  error?: string;
}

// CORS origins configuration
export type CorsOrigin = string | string[] | "*";
