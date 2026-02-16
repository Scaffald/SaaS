/**
 * TypeScript types for Procore REST API responses.
 *
 * These interfaces mirror the JSON shapes returned by the Procore API.
 * See https://developers.procore.com/reference/rest/v1
 */

export interface ProcoreTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  created_at: number;
}

export interface ProcoreCompany {
  id: number;
  name: string;
  is_active: boolean;
}

export interface ProcoreProject {
  id: number;
  name: string;
  display_name?: string;
  project_number?: string;
  address?: string;
  city?: string;
  state_code?: string;
  zip?: string;
  country_code?: string;
  start_date?: string;
  projected_finish_date?: string;
  total_value?: number;
  stage?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProcoreVendor {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state_code?: string;
  zip?: string;
  phone_number?: string;
  email_address?: string;
  website?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProcoreUser {
  id: number;
  login: string;
  name: string;
  email_address?: string;
}
