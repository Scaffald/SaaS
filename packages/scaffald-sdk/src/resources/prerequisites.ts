import { Resource } from './base.js'
import type {
  PrerequisitesCheckResponse,
  CompletePrerequisitesParams,
  CompletePrerequisitesResponse,
} from '../types/prerequisites.js'

/**
 * Prerequisites resource for managing user onboarding requirements
 *
 * @remarks
 * All methods require authentication
 * Prerequisites must be completed before accessing main application features
 */
export class Prerequisites extends Resource {
  /**
   * Check prerequisites completion status
   *
   * @returns Current status and data of user prerequisites
   *
   * @example
   * ```typescript
   * const status = await client.prerequisites.check()
   * if (!status.isComplete) {
   *   // Redirect to onboarding
   *   console.log('Missing:', {
   *     name: !status.hasName,
   *     address: !status.hasAddress,
   *     userTypes: !status.hasUserTypes,
   *     industry: !status.hasIndustry,
   *   })
   * }
   * ```
   */
  async check(): Promise<PrerequisitesCheckResponse> {
    return this.get<PrerequisitesCheckResponse>('/v1/prerequisites/check')
  }

  /**
   * Complete prerequisites
   *
   * @param params - All required prerequisite data
   * @returns Success status
   *
   * @remarks
   * This endpoint updates multiple tables atomically:
   * - profile: first_name, last_name, address
   * - users: industry_id
   * - preferences: user_types, legal acceptance, completion timestamp
   *
   * @example
   * ```typescript
   * const result = await client.prerequisites.complete({
   *   first_name: 'John',
   *   last_name: 'Doe',
   *   address: {
   *     street: '123 Main St',
   *     city: 'San Francisco',
   *     state: 'CA',
   *     zip: '94102',
   *     country: 'US'
   *   },
   *   user_types: ['worker'],
   *   industry_id: 'ind_123',
   *   accepts_privacy_policy: true,
   *   accepts_terms_of_service: true
   * })
   *
   * if (result.success) {
   *   // Prerequisites completed, redirect to dashboard
   * }
   * ```
   */
  async complete(params: CompletePrerequisitesParams): Promise<CompletePrerequisitesResponse> {
    return this.post<CompletePrerequisitesResponse>('/v1/prerequisites/complete', params)
  }
}
