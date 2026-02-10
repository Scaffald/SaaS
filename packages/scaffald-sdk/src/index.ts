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
  ExternalJob,
  ExternalJobFilterOptions,
} from './resources/jobs.js'

export type {
  Application,
  CustomQuestionAnswer,
  AttachmentMetadata,
  CreateApplicationParams,
  UpdateApplicationParams,
  WithdrawApplicationParams,
  ListApplicationsParams,
  ListApplicationsResponse,
  GetUploadUrlParams,
  GetUploadUrlResponse,
  ConfirmUploadParams,
  ApplicationMessage,
  GetMessagesResponse,
  SendMessageParams,
} from './resources/applications.js'

export type {
  UserProfile,
  OrganizationProfile,
  EmployerProfile,
  Certification,
} from './resources/profiles.js'

export type { Industry, IndustryListResponse } from './resources/industries.js'

export type {
  Organization,
  OrganizationMember,
  OrganizationDocument,
  OrganizationSettings,
  ListMembersParams,
  InviteMemberParams,
  RemoveMemberParams,
  ListDocumentsParams,
  CreateDocumentUploadParams,
  DocumentUploadSession,
  DocumentDownloadUrl,
  UpdateSettingsParams,
  OpenJobsCountResponse,
  MembersListResponse,
  DocumentsListResponse,
  InvitationResponse,
} from './types/organizations.js'

export type {
  Team,
  TeamMember,
  TeamInvitation,
  TeamJobAssignment,
  TeamRole,
  TeamUserProfile,
  ListTeamsParams,
  CreateTeamParams,
  UpdateTeamParams,
  ArchiveTeamParams,
  AddTeamMemberParams,
  UpdateTeamMemberParams,
  RemoveTeamMemberParams,
  InviteTeamMemberParams,
  CreateJobAssignmentParams,
  ListMyInvitationsParams,
  RespondToInvitationParams,
  RespondToInvitationWithTokenParams,
  RespondToInvitationWithTokenResponse,
  TeamsListResponse,
  TeamResponse,
  TeamMembersListResponse,
  TeamMemberResponse,
  TeamInvitationsListResponse,
  TeamInvitationResponse,
  TeamJobAssignmentsListResponse,
  TeamJobAssignmentResponse,
  DeleteResponse,
  RolesListResponse,
} from './types/teams.js'

export type {
  PrerequisiteAddress,
  UserType,
  PrerequisitesData,
  PrerequisitesCheckResponse,
  CompletePrerequisitesParams,
  CompletePrerequisitesResponse,
} from './types/prerequisites.js'

export type {
  ApiKey,
  ApiKeyCreated,
  ApiKeyScope,
  ApiKeyEnvironment,
  RateLimitTier,
  ApiKeyUsageRecord,
  ApiKeyUsageStats,
  CreateApiKeyParams,
  UpdateApiKeyParams,
  GetUsageParams,
  ApiKeysListResponse,
  ApiKeyResponse,
  ApiKeyCreatedResponse,
  RevokeApiKeyResponse,
  ApiKeyUsageResponse,
} from './types/api-keys.js'

export type {
  Webhook,
  WebhookWithSecret,
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEventType,
  WebhookEventTypeInfo,
  CreateWebhookParams,
  UpdateWebhookParams,
  ListDeliveriesParams,
  WebhooksListResponse,
  WebhookResponse,
  WebhookCreatedResponse,
  WebhookUpdatedResponse,
  DeleteWebhookResponse,
  DeliveriesListResponse,
  RetryDeliveryResponse,
  EventTypesResponse,
} from './types/webhooks-management.js'

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
