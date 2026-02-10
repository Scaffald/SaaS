/**
 * Prerequisites types for user onboarding
 */

/**
 * Address information for prerequisites
 */
export interface PrerequisiteAddress {
  street: string
  city: string
  state: string
  zip: string
  country: string
  latitude?: number
  longitude?: number
}

/**
 * User type options
 */
export type UserType = 'worker' | 'employer' | 'customer'

/**
 * Prerequisites data returned from check endpoint
 */
export interface PrerequisitesData {
  first_name: string
  last_name: string
  address: PrerequisiteAddress | null
  user_types: UserType[]
  industry_id: string
}

/**
 * Response from checking prerequisites status
 */
export interface PrerequisitesCheckResponse {
  isComplete: boolean
  hasName: boolean
  hasAddress: boolean
  hasUserTypes: boolean
  hasIndustry: boolean
  hasAcceptedPrivacy: boolean
  hasAcceptedTerms: boolean
  completedAt: string | null
  data: PrerequisitesData
}

/**
 * Parameters for completing prerequisites
 */
export interface CompletePrerequisitesParams {
  first_name: string
  last_name: string
  address: PrerequisiteAddress
  user_types: UserType[]
  industry_id: string
  accepts_privacy_policy: boolean
  accepts_terms_of_service: boolean
}

/**
 * Response from completing prerequisites
 */
export interface CompletePrerequisitesResponse {
  success: boolean
}
