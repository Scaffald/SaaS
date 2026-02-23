import { Resource } from './base.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BackgroundCheckPackage {
  id: string
  slug: string
  display_name: string
  description?: string
  retail_cost_cents: number
  check_types: string[]
  turnaround_days?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BackgroundCheck {
  id: string
  user_id: string
  organization_id?: string
  package_id: string
  tier: string
  status: string
  paid_by: 'worker' | 'employer'
  cost_cents: number
  consent_signature?: string
  consent_given_at?: string
  initiated_at: string
  completed_at?: string
  expires_at?: string
  privacy_level?: string
  results?: Record<string, any>
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ConsentDetails {
  consent_signature: string
  consent_given_at: string
  consent_ip_address?: string
  consent_user_agent?: string
  disclosure_provided_at: string
  summary_of_rights_provided_at: string
}

export interface RequestCheckParams {
  package_id: string
  tier: string
  paid_by: 'worker' | 'employer'
  consent: ConsentDetails
  metadata?: Record<string, any>
}

export interface RequestCheckResponse {
  backgroundCheckId: string
  paymentIntentId: string
  clientSecret: string
  amountCents: number
}

export interface ConfirmCheckPaymentParams {
  background_check_id: string
  payment_intent_id: string
}

export interface CreateUploadUrlParams {
  background_check_id: string
  document_type: string
  file_name: string
  mime_type: string
  file_size: number
}

export interface CreateUploadUrlResponse {
  uploadUrl: string
  storagePath: string
  expiresAt: string
}

export interface AddDocumentMetadataParams {
  background_check_id: string
  storage_path: string
  document_type: string
  file_name: string
  mime_type: string
  file_size: number
}

export interface BackgroundCheckDocument {
  id: string
  background_check_id: string
  storage_path: string
  document_type: string
  file_name: string
  mime_type: string
  file_size: number
  uploaded_at: string
}

export interface UpdatePrivacyParams {
  background_check_id: string
  privacy_level: 'public' | 'connections_only' | 'private'
}

export interface SubmitDisputeParams {
  background_check_id: string
  reason: string
  details?: string
  supporting_documents?: string[]
}

export interface Dispute {
  id: string
  background_check_id: string
  user_id: string
  reason: string
  details?: string
  status: 'pending' | 'under_review' | 'resolved' | 'rejected'
  resolution?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

// Admin catalog types (office/platform role)
export interface AdminCheckTypeComponent {
  id: string
  slug: string
  display_name: string
  category: string | null
  validity_days: number | null
  estimated_completion_days: number | null
  platform_cost_cents: number
  retail_cost_cents: number | null
  is_active: boolean
}

export interface AdminCheckType {
  id: string
  slug: string
  display_name: string
  description: string | null
  category: string | null
  provider_check_code: string | null
  validity_days: number | null
  platform_cost_cents: number
  retail_cost_cents: number | null
  estimated_completion_days: number | null
  required_documents: string[]
  provider_configuration: Record<string, unknown>
  metadata: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdminPackage {
  id: string
  slug: string
  display_name: string
  description: string | null
  provider_package_code: string | null
  check_type_ids: string[]
  component_overrides: Record<string, unknown>[]
  platform_cost_cents: number
  retail_cost_cents: number
  estimated_completion_days: number | null
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  components: AdminCheckTypeComponent[]
}

export interface AdminUpsertCheckTypeParams {
  id?: string
  slug: string
  display_name: string
  description?: string | null
  category?: string | null
  provider_check_code?: string | null
  validity_days?: number | null
  platform_cost_cents: number
  retail_cost_cents?: number | null
  estimated_completion_days?: number | null
  required_documents?: string[]
  provider_configuration?: Record<string, unknown>
  metadata?: Record<string, unknown>
  is_active?: boolean
}

export interface AdminUpsertPackageParams {
  id?: string
  slug: string
  display_name: string
  description?: string | null
  provider_package_code?: string | null
  check_type_ids: string[]
  platform_cost_cents: number
  retail_cost_cents: number
  estimated_completion_days?: number | null
  metadata?: Record<string, unknown>
  component_overrides?: Record<string, unknown>[]
  is_active?: boolean
}

// ============================================================================
// BACKGROUND CHECKS RESOURCE
// ============================================================================

/**
 * Background Checks resource for managing background checks, packages, and disputes
 *
 * @remarks
 * Handles background check workflows including:
 * - Package selection and pricing
 * - Check initiation and payment
 * - Document uploads
 * - Privacy controls
 * - Dispute resolution
 */
export class BackgroundChecks extends Resource {
  // ===== Package Management =====

  /**
   * List available background check packages
   *
   * @returns Array of available packages
   *
   * @example
   * ```typescript
   * const packages = await client.backgroundChecks.listPackages()
   * console.log(`${packages.length} packages available`)
   * ```
   */
  async listPackages(): Promise<BackgroundCheckPackage[]> {
    return this.get<BackgroundCheckPackage[]>('/v1/background-checks/packages')
  }

  // ===== Check Management =====

  /**
   * Request a new background check
   *
   * @param params - Check request parameters including package, consent, and payment info
   * @returns Payment session details for completing the check
   *
   * @example
   * ```typescript
   * const session = await client.backgroundChecks.requestCheck({
   *   package_id: 'pkg_123',
   *   tier: 'standard',
   *   paid_by: 'worker',
   *   consent: {
   *     consent_signature: 'John Doe',
   *     consent_given_at: new Date().toISOString(),
   *     disclosure_provided_at: new Date().toISOString(),
   *     summary_of_rights_provided_at: new Date().toISOString()
   *   }
   * })
   * // Use session.clientSecret with Stripe to complete payment
   * ```
   */
  async requestCheck(params: RequestCheckParams): Promise<RequestCheckResponse> {
    return this.post<RequestCheckResponse>('/v1/background-checks/request', params)
  }

  /**
   * Confirm payment for a background check
   *
   * @param params - Background check ID and payment intent ID
   * @returns Updated background check record
   *
   * @example
   * ```typescript
   * const check = await client.backgroundChecks.confirmCheckPayment({
   *   background_check_id: 'bc_123',
   *   payment_intent_id: 'pi_456'
   * })
   * ```
   */
  async confirmCheckPayment(params: ConfirmCheckPaymentParams): Promise<BackgroundCheck> {
    return this.post<BackgroundCheck>('/v1/background-checks/confirm-payment', params)
  }

  /**
   * List all background checks for the current user
   *
   * @returns Array of background checks
   *
   * @example
   * ```typescript
   * const checks = await client.backgroundChecks.listChecks()
   * const active = checks.filter(c => c.status === 'in_progress')
   * ```
   */
  async listChecks(): Promise<BackgroundCheck[]> {
    return this.get<BackgroundCheck[]>('/v1/background-checks')
  }

  /**
   * Get a specific background check by ID
   *
   * @param checkId - Background check ID
   * @returns Background check details
   *
   * @example
   * ```typescript
   * const check = await client.backgroundChecks.getCheck('bc_123')
   * console.log(`Status: ${check.status}`)
   * ```
   */
  async getCheck(checkId: string): Promise<BackgroundCheck> {
    return this.get<BackgroundCheck>(`/v1/background-checks/${checkId}`)
  }

  // ===== Document Management =====

  /**
   * Create a pre-signed upload URL for a background check document
   *
   * @param params - Document upload parameters
   * @returns Upload URL and storage path
   *
   * @example
   * ```typescript
   * const { uploadUrl, storagePath } = await client.backgroundChecks.createUploadUrl({
   *   background_check_id: 'bc_123',
   *   document_type: 'drivers_license',
   *   file_name: 'license.pdf',
   *   mime_type: 'application/pdf',
   *   file_size: 524288
   * })
   * // Upload file to uploadUrl, then call addDocumentMetadata with storagePath
   * ```
   */
  async createUploadUrl(params: CreateUploadUrlParams): Promise<CreateUploadUrlResponse> {
    return this.post<CreateUploadUrlResponse>('/v1/background-checks/documents/upload-url', params)
  }

  /**
   * Record metadata for an uploaded document
   *
   * @param params - Document metadata
   * @returns Document record
   *
   * @example
   * ```typescript
   * const doc = await client.backgroundChecks.addDocumentMetadata({
   *   background_check_id: 'bc_123',
   *   storage_path: 'path/to/file.pdf',
   *   document_type: 'drivers_license',
   *   file_name: 'license.pdf',
   *   mime_type: 'application/pdf',
   *   file_size: 524288
   * })
   * ```
   */
  async addDocumentMetadata(params: AddDocumentMetadataParams): Promise<BackgroundCheckDocument> {
    return this.post<BackgroundCheckDocument>('/v1/background-checks/documents', params)
  }

  // ===== Privacy & Settings =====

  /**
   * Update privacy settings for a background check
   *
   * @param params - Privacy update parameters
   * @returns Updated background check
   *
   * @example
   * ```typescript
   * const check = await client.backgroundChecks.updatePrivacy({
   *   background_check_id: 'bc_123',
   *   privacy_level: 'connections_only'
   * })
   * ```
   */
  async updatePrivacy(params: UpdatePrivacyParams): Promise<BackgroundCheck> {
    return this.patch<BackgroundCheck>(
      `/v1/background-checks/${params.background_check_id}/privacy`,
      { privacy_level: params.privacy_level }
    )
  }

  // ===== Disputes =====

  /**
   * Submit a dispute for a background check
   *
   * @param params - Dispute details
   * @returns Created dispute record
   *
   * @example
   * ```typescript
   * const dispute = await client.backgroundChecks.submitDispute({
   *   background_check_id: 'bc_123',
   *   reason: 'inaccurate_information',
   *   details: 'The employment dates are incorrect',
   *   supporting_documents: ['path/to/doc1.pdf']
   * })
   * ```
   */
  async submitDispute(params: SubmitDisputeParams): Promise<Dispute> {
    return this.post<Dispute>('/v1/background-checks/disputes', params)
  }

  /**
   * List disputes for a specific background check
   *
   * @param checkId - Background check ID
   * @returns Array of disputes
   *
   * @example
   * ```typescript
   * const disputes = await client.backgroundChecks.listDisputesForCheck('bc_123')
   * const pending = disputes.filter(d => d.status === 'pending')
   * ```
   */
  async listDisputesForCheck(checkId: string): Promise<Dispute[]> {
    return this.get<Dispute[]>(`/v1/background-checks/${checkId}/disputes`)
  }

  // ===== Organization Methods =====

  /**
   * List background checks for an organization
   *
   * @param organizationId - Organization ID
   * @returns Array of background checks
   *
   * @example
   * ```typescript
   * const checks = await client.backgroundChecks.organizationListChecks('org_123')
   * ```
   */
  async organizationListChecks(organizationId: string): Promise<BackgroundCheck[]> {
    return this.get<BackgroundCheck[]>(`/v1/organizations/${organizationId}/background-checks`)
  }

  /**
   * Get organization's background check details
   *
   * @param organizationId - Organization ID
   * @param checkId - Background check ID
   * @returns Background check details
   *
   * @example
   * ```typescript
   * const check = await client.backgroundChecks.organizationGet('org_123', 'bc_456')
   * ```
   */
  async organizationGet(organizationId: string, checkId: string): Promise<BackgroundCheck> {
    return this.get<BackgroundCheck>(`/v1/organizations/${organizationId}/background-checks/${checkId}`)
  }

  // ===== Admin Catalog (office/platform role) =====

  /**
   * List admin packages (office/platform role)
   */
  async adminListPackages(): Promise<AdminPackage[]> {
    const response = (await this.get<{ data: AdminPackage[] }>(
      '/v1/background-checks/admin/packages'
    )) as { data: AdminPackage[] }
    return response.data
  }

  /**
   * List admin check types (office/platform role)
   */
  async adminListCheckTypes(): Promise<AdminCheckType[]> {
    const response = (await this.get<{ data: AdminCheckType[] }>(
      '/v1/background-checks/admin/check-types'
    )) as { data: AdminCheckType[] }
    return response.data
  }

  /**
   * Upsert check type (office/platform role)
   */
  async adminUpsertCheckType(params: AdminUpsertCheckTypeParams): Promise<AdminCheckType> {
    const response = (await this.post<{ data: AdminCheckType }>(
      '/v1/background-checks/admin/check-types',
      params
    )) as { data: AdminCheckType }
    return response.data
  }

  /**
   * Upsert package (office/platform role)
   */
  async adminUpsertPackage(params: AdminUpsertPackageParams): Promise<AdminPackage> {
    const response = (await this.post<{ data: AdminPackage }>(
      '/v1/background-checks/admin/packages',
      params
    )) as { data: AdminPackage }
    return response.data
  }

  /**
   * Set check type active status (office/platform role)
   */
  async adminSetCheckTypeActive(id: string, is_active: boolean): Promise<{ success: boolean }> {
    const response = (await this.patch<{ data: { success: boolean } }>(
      `/v1/background-checks/admin/check-types/${id}/active`,
      { is_active }
    )) as { data: { success: boolean } }
    return response.data
  }

  /**
   * Set package active status (office/platform role)
   */
  async adminSetPackageActive(id: string, is_active: boolean): Promise<{ success: boolean }> {
    const response = (await this.patch<{ data: { success: boolean } }>(
      `/v1/background-checks/admin/packages/${id}/active`,
      { is_active }
    )) as { data: { success: boolean } }
    return response.data
  }
}
