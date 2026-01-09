export { Scaffald } from './client.js'
export type { ScaffaldConfig } from './config.js'
export type { RateLimitInfo } from './http/client.js'
export {
  ScaffaldError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  APIError,
} from './http/errors.js'

export type {
  Job,
  JobListParams,
  JobListResponse,
  CreateJobParams,
} from './resources/jobs.js'

export type {
  Application,
  CustomQuestionAnswer,
  AttachmentMetadata,
  CreateApplicationParams,
  UpdateApplicationParams,
  WithdrawApplicationParams,
} from './resources/applications.js'

export type {
  UserProfile,
  OrganizationProfile,
  EmployerProfile,
  Certification,
} from './resources/profiles.js'

export { Webhooks, type WebhookEvent, type WebhookPayload } from './webhooks/verify.js'

export {
  OAuthClient,
  type OAuthConfig,
  type AuthorizationUrlOptions,
  type AuthorizationUrlResult,
  type TokenResponse,
  type TokenExchangeOptions,
} from './auth/oauth.js'

export { generateCodeVerifier, generateCodeChallenge, generateState } from './auth/pkce.js'

import { Scaffald } from './client.js'
export default Scaffald
