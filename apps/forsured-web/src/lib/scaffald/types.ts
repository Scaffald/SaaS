// src/lib/scaffald/types.ts

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface ScaffaldUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  companies: ScaffaldCompanyMembership[];
  created_at: string;
}

export interface ScaffaldCompanyMembership {
  company_id: string;
  company_name: string;
  role: 'owner' | 'admin' | 'member';
}

export interface ScaffaldCompany {
  id: string;
  name: string;
  address: Address;
  phone?: string;
  website?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ScaffaldProject {
  id: string;
  company_id: string;
  name: string;
  address: Address;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyInput {
  name: string;
  address: Address;
  phone?: string;
  website?: string;
}

export interface UpdateCompanyInput extends Partial<CreateCompanyInput> {}

export interface CreateProjectInput {
  company_id: string;
  name: string;
  address: Address;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

export interface Invitation {
  id: string;
  company_id: string;
  email: string;
}

// =============================================================================
// CCPA INTEGRATION TYPES
// =============================================================================

/**
 * CCPA request types from Scaffald
 */
export type CCPARequestType =
  | 'access'
  | 'deletion'
  | 'correction'
  | 'opt_out'
  | 'opt_in'
  | 'portability';

/**
 * CCPA webhook event types
 */
export type CCPAWebhookEventType =
  | 'ccpa.export_requested'
  | 'ccpa.deletion_requested'
  | 'ccpa.correction_requested'
  | 'ccpa.opt_out_requested'
  | 'ccpa.opt_in_requested';

/**
 * CCPA webhook payload from Scaffald
 */
export interface CCPAWebhookPayload {
  event: CCPAWebhookEventType;
  request_id: string;
  user_id: string;
  timestamp: string;
  data?: {
    request_type?: CCPARequestType;
    categories?: string[];
    deadline?: string;
  };
}

/**
 * Data categories that Forsured handles
 */
export type ForsuredDataCategory =
  | 'insurance_policies'
  | 'compliance_records'
  | 'documents'
  | 'tasks'
  | 'projects'
  | 'broker_acknowledgements';

/**
 * Data contribution for CCPA export
 */
export interface CCPADataContribution {
  app_id: string;
  app_name: string;
  exported_at: string;
  categories: Array<{
    category: string;
    data_type: string;
    records: Array<Record<string, unknown>>;
    record_count: number;
    collection_source: string;
    business_purpose: string;
    retention_period: string;
  }>;
  total_records: number;
}

/**
 * Deletion confirmation to send to Scaffald
 */
export interface CCPADeletionConfirmation {
  app_id: string;
  app_name: string;
  request_id: string;
  user_id: string;
  processed_at: string;
  deletion_summary: {
    deleted_records: Record<string, number>;
    anonymized_records: Record<string, number>;
    retained_records: Array<{
      table: string;
      count: number;
      reason: string;
      retention_until: string;
    }>;
  };
  errors: string[];
  success: boolean;
}

/**
 * OAuth app registration for CCPA
 */
export interface CCPAAppRegistration {
  app_id: string;
  app_name: string;
  data_categories: ForsuredDataCategory[];
  webhook_url: string;
  webhook_secret: string;
}

/**
 * Opt-out status from Scaffald
 */
export interface CCPAOptOutStatus {
  user_id: string;
  categories: Array<{
    category: string;
    opted_out: boolean;
    source: string;
    opted_out_at?: string;
  }>;
}
