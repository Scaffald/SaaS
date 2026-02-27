/**
 * CCPA Compliance types for the Scaffald SDK
 */

export type CCPARequestType = 'export' | 'deletion' | 'correction'

export type CCPAOptOutCategory = 'sale' | 'sharing' | 'targeted_advertising' | 'sensitive_data'

export interface CCPADataCategory {
  id: string
  label: string
  description: string
  hasData: boolean
  itemCount?: number
}

export interface CCPADataSummaryResponse {
  categories: CCPADataCategory[]
}

export interface CCPAUserRequest {
  id: string
  type: string
  status: string
  created_at: string
  deadline_at: string | null
  extended_deadline_at?: string | null
  completed_at?: string | null
}

export interface CCPAMyRequestsResponse {
  requests: CCPAUserRequest[]
  total: number
}

export interface CCPAOptOutStatus {
  category: CCPAOptOutCategory
  opted_out: boolean
  opted_out_at: string | null
  source: 'user' | 'gpc' | 'default'
}

export interface CCPAOptOutsResponse {
  optOuts: CCPAOptOutStatus[]
  hasGPCOptOut: boolean
}

export interface CCPASubmitRequestParams {
  type: CCPARequestType
  categories?: string[]
  correctionDetails?: string
}

export interface CCPASubmitRequestResponse {
  id: string
  status: string
  deadline_at: string | null
  submitted_at: string
}

export interface CCPASetOptOutParams {
  category: CCPAOptOutCategory
  optOut: boolean
}

export interface CCPASetOptOutResponse {
  category: CCPAOptOutCategory
  opted_out: boolean
}

// Admin types

export interface CCPAComplianceMetrics {
  total_requests: number
  pending_requests: number
  processing_requests: number
  completed_requests: number
  average_processing_days: number
  compliance_rate: number
  overdue_count: number
}

export interface AdminCCPARequest {
  id: string
  user_id: string
  user_email: string
  user_name: string
  type: string
  status: string
  created_at: string
  updated_at: string
  completed_at?: string | null
  priority: string
  days_elapsed: number
  is_overdue: boolean
}

export interface CCPAAdminRequestsParams {
  status?: string
  type?: string
  priority?: string
  limit?: number
  offset?: number
}

export interface CCPAAdminRequestsResponse {
  requests: AdminCCPARequest[]
  total: number
}

export interface CCPAProcessRequestResponse {
  success: boolean
  requestId: string
  status: string
}
