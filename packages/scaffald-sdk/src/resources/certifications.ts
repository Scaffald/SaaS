import { Resource } from './base'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CertificationCatalog {
  id: string
  title: string
  slug: string
  depth: number
  parent_id: string | null
  hierarchy_path: string
  sort_order: number
  description?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  parent_title?: string | null
  parent_slug?: string | null
}

export interface UserCertification {
  id: string
  user_id: string
  certification_id: string
  issue_date?: string | null
  expiration_date?: string | null
  credential_id?: string | null
  credential_url?: string | null
  certificate_file_path?: string | null
  description?: string | null
  is_active: boolean
  verification_status: string
  created_at?: string
  updated_at?: string
  catalog?: CertificationCatalog
}

export interface GetTopLevelCertificationsParams {
  search?: string
  limit?: number
}

export interface GetTopLevelCertificationsResponse {
  certifications: CertificationCatalog[]
}

export interface GetCertificationChildrenParams {
  parent_id: string
}

export interface GetCertificationChildrenResponse {
  certifications: CertificationCatalog[]
}

export interface UserCertificationTree {
  depth0: UserCertification[]
  depth1ByParent: Record<string, UserCertification[]>
  depth2ByParent: Record<string, UserCertification[]>
}

export interface AddCertificationParams {
  certification_id: string
}

export interface AddCertificationResponse {
  success: boolean
  certification: UserCertification
}

export interface AddCategoryCertificationParams {
  category_id: string
  parent_id: string
}

export interface AddCategoryCertificationResponse {
  success: boolean
  certification: UserCertification
  alreadyExists?: boolean
}

export interface ToggleSpecificCertificationParams {
  certification_id: string
  parent_id: string
  checked: boolean
}

export interface ToggleSpecificCertificationResponse {
  success: boolean
  certification: UserCertification | null
}

export interface RemoveTopLevelCertificationParams {
  top_level_id: string
  confirmed?: boolean
}

export interface RemoveTopLevelCertificationResponse {
  success: boolean
  needsConfirmation?: boolean
  affectedCount?: number
  message?: string
  removedCount?: number
}

export interface UpdateCertificationProofParams {
  user_certification_id: string
  proof_type: 'url' | 'file'
  credential_url?: string
  certificate_file?: string
  file_name?: string
  content_type?: string
}

export interface UpdateCertificationProofResponse {
  success: boolean
  proofType: 'url' | 'file'
  url?: string
  filePath?: string
}

// Legacy types for backwards compatibility
export interface LegacyCertification {
  id: string
  user_id: string
  name: string
  issuing_organization: string
  issue_date?: string | null
  expiration_date?: string | null
  credential_id?: string | null
  credential_url?: string | null
  certificate_file_path?: string | null
  description?: string | null
  is_active: boolean
  verification_status: string
  created_at?: string
  updated_at?: string
}

export interface SaveCertificationsParams {
  certifications: LegacyCertification[]
}

export interface SaveCertificationsResponse {
  success: boolean
  certifications: LegacyCertification[]
}

export interface UploadCertificationFileParams {
  certificationId: string
  file: string
  fileName: string
  contentType: string
}

export interface UploadCertificationFileResponse {
  success: boolean
  filePath: string
}

export interface DeleteCertificationFileParams {
  certificationId: string
  filePath: string
}

export interface DeleteCertificationFileResponse {
  success: boolean
}

export interface DeleteCertificationParams {
  certificationId: string
}

export interface DeleteCertificationResponse {
  success: boolean
}

// ============================================================================
// CERTIFICATIONS RESOURCE
// ============================================================================

export class Certifications extends Resource {
  /**
   * Get top-level certifications with search
   * Returns certifications at all depth levels (0, 1, 2) for search
   * Excludes certifications the user already has
   *
   * @param params - Search and limit parameters
   * @returns Array of certifications with parent hierarchy information
   *
   * @example
   * ```typescript
   * const result = await client.certifications.getTopLevelCertifications({
   *   search: 'AWS',
   *   limit: 20
   * })
   * console.log(`Found ${result.certifications.length} certifications`)
   * ```
   */
  async getTopLevelCertifications(
    params?: GetTopLevelCertificationsParams
  ): Promise<GetTopLevelCertificationsResponse> {
    return this.get<GetTopLevelCertificationsResponse>('/v1/profiles/certifications/top-level', params)
  }

  /**
   * Get certification children by parent ID
   * Returns all child certifications for a given parent
   *
   * @param params - Parent ID
   * @returns Array of child certifications
   *
   * @example
   * ```typescript
   * const result = await client.certifications.getCertificationChildren({
   *   parent_id: 'uuid-here'
   * })
   * console.log(`Found ${result.certifications.length} children`)
   * ```
   */
  async getCertificationChildren(
    params: GetCertificationChildrenParams
  ): Promise<GetCertificationChildrenResponse> {
    return this.get<GetCertificationChildrenResponse>(
      '/v1/profiles/certifications/children',
      params
    )
  }

  /**
   * Get user's certification tree
   * Returns full certification hierarchy organized by depth levels
   *
   * @returns Certification tree with depth0, depth1ByParent, and depth2ByParent
   *
   * @example
   * ```typescript
   * const tree = await client.certifications.getUserCertificationTree()
   * console.log(`Top-level: ${tree.depth0.length}`)
   * ```
   */
  async getUserCertificationTree(): Promise<UserCertificationTree> {
    return this.get<UserCertificationTree>('/v1/profiles/certifications/tree')
  }

  /**
   * Add certification at any depth level
   * Automatically creates parent certifications if needed
   *
   * @param params - Certification ID to add
   * @returns Success status with created certification
   *
   * @example
   * ```typescript
   * const result = await client.certifications.addCertification({
   *   certification_id: 'uuid-here'
   * })
   * console.log(`Added certification: ${result.certification.id}`)
   * ```
   */
  async addCertification(params: AddCertificationParams): Promise<AddCertificationResponse> {
    return this.post<AddCertificationResponse>('/v1/profiles/certifications/add', params)
  }

  /**
   * Add category certification (depth 1)
   * Creates when toggle is activated
   *
   * @param params - Category ID and parent ID
   * @returns Success status with created certification
   *
   * @example
   * ```typescript
   * const result = await client.certifications.addCategoryCertification({
   *   category_id: 'category-uuid',
   *   parent_id: 'parent-uuid'
   * })
   * console.log(`Added category: ${result.certification.id}`)
   * ```
   */
  async addCategoryCertification(
    params: AddCategoryCertificationParams
  ): Promise<AddCategoryCertificationResponse> {
    return this.post<AddCategoryCertificationResponse>(
      '/v1/profiles/certifications/add-category',
      params
    )
  }

  /**
   * Toggle specific certification (depth 2)
   * Creates or removes when checkbox changes
   *
   * @param params - Certification ID, parent ID, and checked state
   * @returns Success status with certification (or null if removed)
   *
   * @example
   * ```typescript
   * const result = await client.certifications.toggleSpecificCertification({
   *   certification_id: 'cert-uuid',
   *   parent_id: 'parent-uuid',
   *   checked: true
   * })
   * console.log(`Toggled certification: ${result.success}`)
   * ```
   */
  async toggleSpecificCertification(
    params: ToggleSpecificCertificationParams
  ): Promise<ToggleSpecificCertificationResponse> {
    return this.post<ToggleSpecificCertificationResponse>(
      '/v1/profiles/certifications/toggle-specific',
      params
    )
  }

  /**
   * Remove top-level certification with cascade warning
   * May require confirmation if multiple certifications will be affected
   *
   * @param params - Top-level ID and confirmation flag
   * @returns Success status with affected count and warning if needed
   *
   * @example
   * ```typescript
   * const result = await client.certifications.removeTopLevelCertification({
   *   top_level_id: 'uuid-here',
   *   confirmed: false
   * })
   * if (result.needsConfirmation) {
   *   console.log(`Warning: ${result.message}`)
   * }
   * ```
   */
  async removeTopLevelCertification(
    params: RemoveTopLevelCertificationParams
  ): Promise<RemoveTopLevelCertificationResponse> {
    return this.post<RemoveTopLevelCertificationResponse>(
      '/v1/profiles/certifications/remove-top-level',
      params
    )
  }

  /**
   * Update certification proof (file or URL)
   * Allows adding credential URL or uploading certificate file
   *
   * @param params - User certification ID, proof type, and file/URL data
   * @returns Success status with proof type and URL/file path
   *
   * @example
   * ```typescript
   * const result = await client.certifications.updateCertificationProof({
   *   user_certification_id: 'uuid-here',
   *   proof_type: 'url',
   *   credential_url: 'https://example.com/cert'
   * })
   * console.log(`Updated proof: ${result.proofType}`)
   * ```
   */
  async updateCertificationProof(
    params: UpdateCertificationProofParams
  ): Promise<UpdateCertificationProofResponse> {
    return this.post<UpdateCertificationProofResponse>(
      '/v1/profiles/certifications/update-proof',
      params
    )
  }

  // ============================================================================
  // LEGACY ENDPOINTS (for backwards compatibility)
  // ============================================================================

  /**
   * Get user's certifications (legacy)
   * Returns all active certifications for the authenticated user
   *
   * @returns Array of certifications
   *
   * @example
   * ```typescript
   * const certs = await client.certifications.getCertifications()
   * console.log(`${certs.length} certifications found`)
   * ```
   */
  async getCertifications(): Promise<LegacyCertification[]> {
    return this.get<LegacyCertification[]>('/v1/profiles/certifications')
  }

  /**
   * Save certifications (legacy)
   * Creates or updates multiple certifications in bulk
   *
   * @param params - Certifications to save
   * @returns Success status with saved certifications
   *
   * @example
   * ```typescript
   * const result = await client.certifications.saveCertifications({
   *   certifications: [
   *     {
   *       name: 'AWS Certified',
   *       issuing_organization: 'Amazon',
   *       issue_date: '2022-01-15',
   *       is_active: true,
   *       verification_status: 'unverified'
   *     }
   *   ]
   * })
   * console.log(`Saved ${result.certifications.length} certifications`)
   * ```
   */
  async saveCertifications(params: SaveCertificationsParams): Promise<SaveCertificationsResponse> {
    return this.post<SaveCertificationsResponse>('/v1/profiles/certifications/save', params)
  }

  /**
   * Upload certification file (legacy)
   * Uploads a PDF or image file for a certification
   *
   * @param params - Certification ID, file data, and metadata
   * @returns Success status with file path
   *
   * @example
   * ```typescript
   * const result = await client.certifications.uploadCertificationFile({
   *   certificationId: 'uuid-here',
   *   file: 'base64-encoded-file-data',
   *   fileName: 'certificate.pdf',
   *   contentType: 'application/pdf'
   * })
   * console.log(`Uploaded file: ${result.filePath}`)
   * ```
   */
  async uploadCertificationFile(
    params: UploadCertificationFileParams
  ): Promise<UploadCertificationFileResponse> {
    return this.post<UploadCertificationFileResponse>(
      '/v1/profiles/certifications/upload-file',
      params
    )
  }

  /**
   * Delete certification file (legacy)
   * Removes a file from a certification
   *
   * @param params - Certification ID and file path
   * @returns Success status
   *
   * @example
   * ```typescript
   * await client.certifications.deleteCertificationFile({
   *   certificationId: 'uuid-here',
   *   filePath: 'path/to/file.pdf'
   * })
   * console.log('File deleted')
   * ```
   */
  async deleteCertificationFile(
    params: DeleteCertificationFileParams
  ): Promise<DeleteCertificationFileResponse> {
    return this.post<DeleteCertificationFileResponse>(
      '/v1/profiles/certifications/delete-file',
      params
    )
  }

  /**
   * Delete certification (legacy)
   * Removes a certification and its associated file if present
   *
   * @param params - Certification ID to delete
   * @returns Success status
   *
   * @example
   * ```typescript
   * await client.certifications.deleteCertification({
   *   certificationId: 'uuid-here'
   * })
   * console.log('Certification deleted')
   * ```
   */
  async deleteCertification(params: DeleteCertificationParams): Promise<DeleteCertificationResponse> {
    return this.post<DeleteCertificationResponse>(
      '/v1/profiles/certifications/delete',
      params
    )
  }
}
