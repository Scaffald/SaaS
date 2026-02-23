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
  RequestMagicLinkParams,
  RequestMagicLinkResponse,
  GetUserRolesResponse,
} from './resources/auth.js'

export type {
  WelcomeSlide,
  GetActiveWelcomeSlidesResponse,
} from './resources/cms.js'

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

export type {
  SoftSkillCategory,
  SoftSkillCatalogEntry,
  SoftSkillView,
  CategoryAverages,
  GetSoftSkillsParams,
  GetSoftSkillsResponse,
  SoftSkillRating,
  UpdateSoftSkillsParams,
  UpdateSoftSkillsResponse,
  SoftSkillsHistoryVersion,
  GetSoftSkillsHistoryResponse,
  GetSoftSkillsComparisonResponse,
  Industry as SkillIndustry,
  GetIndustriesResponse as GetSkillIndustriesResponse,
  SearchParentSkillsParams,
  ParentSkill,
  SearchParentSkillsResponse,
  GetSkillChildrenParams,
  SkillChild,
  GetSkillChildrenResponse,
  GetSkillDetailsParams,
  SkillDetails,
  GetSkillDetailsResponse,
  UserSkill,
  GetUserSkillsResponse,
  AddUserSkillParams,
  UpdateUserSkillParams,
  RemoveUserSkillParams,
  SkillTaxonomy,
  SkillDetailsMT,
  UserSkillMT,
  GetUserSkillsMTResponse,
  AddSkillMTParams,
  UpdateSkillMTParams,
  RemoveSkillMTParams,
  GetPrimaryIndustryResponse,
  UpdatePrimaryIndustryParams,
  LegacySkill,
  GetSkillsLegacyResponse,
  UpdateSkillsLegacyParams,
} from './resources/skills.js'

export type {
  Address,
  ExperienceEntry,
  GetExperienceResponse,
  ExperienceSummary,
  SaveExperienceParams,
  SaveExperienceResponse,
  DeleteExperienceParams,
  DeleteExperienceResponse,
} from './resources/experience.js'

export type {
  EmploymentPreferences,
  UpdateEmploymentParams,
  UpdateEmploymentResponse,
} from './resources/employment.js'

export type {
  EducationEntry,
  EducationLevel,
  SaveEducationParams,
  SaveEducationResponse,
  DeleteEducationParams,
  DeleteEducationResponse,
} from './resources/education.js'

export type {
  CertificationCatalog,
  UserCertification,
  GetTopLevelCertificationsParams,
  GetTopLevelCertificationsResponse,
  GetCertificationChildrenParams,
  GetCertificationChildrenResponse,
  UserCertificationTree,
  AddCertificationParams,
  AddCertificationResponse,
  AddCategoryCertificationParams,
  AddCategoryCertificationResponse,
  ToggleSpecificCertificationParams,
  ToggleSpecificCertificationResponse,
  RemoveTopLevelCertificationParams,
  RemoveTopLevelCertificationResponse,
  UpdateCertificationProofParams,
  UpdateCertificationProofResponse,
  LegacyCertification,
  SaveCertificationsParams,
  SaveCertificationsResponse,
  UploadCertificationFileParams,
  UploadCertificationFileResponse,
  DeleteCertificationFileParams,
  DeleteCertificationFileResponse,
  DeleteCertificationParams,
  DeleteCertificationResponse,
} from './resources/certifications.js'

export type {
  GeneralInfoWidgetParams,
  GeneralInfoWidgetResponse,
  ExperienceWidgetParams,
  ExperienceWidgetEntry,
  EducationWidgetParams,
  EducationWidgetEntry,
  SkillsWidgetParams,
  SkillWidgetEntry,
  CertificationsWidgetParams,
  CertificationWidgetEntry,
  PreferencesWidgetResponse,
} from './resources/profile-widgets.js'

export type {
  ProfileWizardStepId,
  CompletionMilestoneThreshold,
  SectionStatus,
  CompletionStatusPayload,
  DismissNudgeParams,
  DismissNudgeResponse,
  PersonalizedBenefit,
  PersonalizedBenefitsResponse,
} from './resources/profile-completion.js'

export type {
  GeneralImportEntry,
  ExperienceImportEntry,
  EducationImportEntry,
  SkillImportEntry,
  CertificationImportEntry,
  ImportPayload,
  ImportMetadata,
  SaveImportDataParams,
  SaveImportDataResponse,
  ClearImportDataResponse,
} from './resources/profile-import.js'

export type {
  NotificationType,
  Notification,
  ListNotificationsParams,
  NotificationsListResponse,
  NotificationResponse,
  UnreadCountResponse,
  MarkAllAsReadResponse,
  DeleteAllResponse,
  QuietHours,
  NotificationTypeSettings,
  NotificationPreferences,
  UpdatePreferencesParams,
  PreferencesResponse,
} from './resources/notifications.js'

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

export type {
  Connection,
  ConnectionRequest,
  SendConnectionRequestParams,
  ConnectionsListResponse,
  PendingRequestsResponse,
  ConnectionStatusResponse,
} from './resources/connections.js'

export type {
  Follow,
  FollowUserParams,
  FollowsListResponse,
  FollowStatusResponse,
} from './resources/follows.js'

export type {
  EngagementEventType,
  EngagementTargetType,
  TrackEventParams,
  EngagementEvent,
  GetRecentActivityParams,
  GetEngagementMetricsParams,
  EngagementMetrics,
  RecentActivityResponse,
} from './resources/engagement.js'

export type {
  Employer,
  GetEmployersParams,
  GetEmployersResponse,
  GetEmployerByIdParams,
  EmploymentStatus,
  GetEmploymentStatusParams,
  ClaimEmploymentParams,
  ClaimEmploymentResponse,
  RemoveEmploymentParams,
  RemoveEmploymentResponse,
  FollowStatus,
  GetFollowStatusParams,
  FollowOrganizationParams,
  FollowOrganizationResponse,
  UnfollowOrganizationParams,
  UnfollowOrganizationResponse,
} from './resources/employers.js'

export type {
  Occupation,
  OccupationDetails,
  OccupationSkill,
  OccupationKnowledge,
  OccupationAbility,
  AutocompleteSuggestion,
  SearchParams,
  GetSkillsParams,
  GetRelatedParams,
  AutocompleteParams,
  OccupationsSearchResponse,
  OccupationDetailsResponse,
  SkillsResponse,
  RelatedOccupationsResponse,
  KnowledgeResponse,
  AbilitiesResponse,
  AutocompleteResponse,
} from './resources/onet.js'

export type {
  PortfolioItem,
  ListPortfolioItemsParams,
  CreatePortfolioItemParams,
  UpdatePortfolioItemParams,
  DeletePortfolioItemParams,
  DeletePortfolioItemResponse,
  ReorderPortfolioItemsParams,
  ReorderPortfolioItemsResponse,
  UploadPortfolioImageParams,
  UploadPortfolioImageResponse,
} from './resources/portfolio.js'

export type {
  SoftSkill,
  Review,
  ReviewWithRelations,
  ReviewCategoryRating,
  ReviewSkillRating,
  ReviewSoftSkillVote,
  GetSoftSkillsByCategoryResponse,
  CreateReviewDraftParams,
  SaveDraftParams,
  SaveDraftResponse,
  GetDraftParams,
  UpdateStepParams,
  UpdateStepResponse,
  UpdateSkillRatingsParams,
  UpdateSkillRatingsResponse,
  UpdateCategoryRatingParams,
  UpdateCategoryRatingResponse,
  UpdateSoftSkillVotesParams,
  UpdateSoftSkillVotesResponse,
  UpdateCommentParams,
  UpdateCommentResponse,
  SubmitReviewParams,
  SubmitReviewResponse,
  GetReviewsBySubjectParams,
  GetReviewsBySubjectResponse,
  GetMyReviewsResponse,
  GetReviewAnalyticsParams,
  ReviewAnalytics,
  DeleteDraftParams,
  DeleteDraftResponse,
} from './resources/reviews.js'

export type {
  ProjectStatus,
  LocationVisibility,
  WorkerStatus,
  Project,
  ProjectSite,
  ProjectAddress,
  ProjectWorker,
  ProjectWithRelations,
  CreateProjectParams,
  CreateProjectResponse,
  UpdateProjectParams,
  UpdateProjectResponse,
  GetProjectParams,
  GetProjectResponse,
  ListProjectsParams,
  ListProjectsResponse,
  AddSiteParams,
  AddSiteResponse,
  AddAddressParams,
  AddAddressResponse,
  AddWorkerParams,
  AddWorkerResponse,
  ClaimWorkParams,
  ClaimWorkResponse,
  ApproveWorkerParams,
  ApproveWorkerResponse,
  RejectWorkerParams,
  RejectWorkerResponse,
} from './resources/projects.js'

export type {
  ProfileViewViewer,
  ProfileView,
  ViewAnalytics,
  RecordViewParams,
  RecordViewResponse,
  GetProfileViewsParams,
  GetProfileViewsResponse,
} from './resources/profile-views.js'

export type {
  UserProfilePreview,
  UserProfileDetailed,
  UserExperience,
  UserEducation,
  ReviewsSummary,
  ContactInfo,
  GetPreviewParams,
  GetUserProfileParams,
  GetUserSkillsParams,
  GetUserCertificationsParams,
  GetUserExperienceParams,
  GetUserEducationParams,
  GetReviewsSummaryParams,
  GetContactInfoParams,
} from './resources/user-profiles.js'

export type {
  Worker,
  WorkerDetailed,
  GetWorkersParams,
  GetWorkersResponse,
  GetWorkerByIdParams,
} from './resources/workers.js'

export type {
  BackgroundCheckPackage,
  BackgroundCheck,
  ConsentDetails,
  RequestCheckParams,
  RequestCheckResponse,
  ConfirmCheckPaymentParams,
  CreateUploadUrlParams,
  CreateUploadUrlResponse,
  AddDocumentMetadataParams,
  BackgroundCheckDocument,
  UpdatePrivacyParams,
  SubmitDisputeParams,
  Dispute,
  AdminCheckType,
  AdminCheckTypeComponent,
  AdminPackage,
  AdminUpsertCheckTypeParams,
  AdminUpsertPackageParams,
} from './resources/background-checks.js'

export type {
  PersonalityAssessment,
  IPIPAnswer,
  AssessmentStatus,
  IPIPStatus,
  LuscherTest1Status,
  LuscherTest2Status,
  LuscherTestAvailability,
  SaveLuscher1Params,
  SaveLuscher2Params,
  SaveIPIPProgressParams,
  SaveLuscherTestSessionParams,
  UpdateCurrentStepParams,
  GenerateReportParams,
  GenerateShareTokenParams,
  RevokeShareTokenParams,
  SaveProgressResponse,
  GenerateReportResponse,
  GenerateShareTokenResponse,
  SaveLuscherTestSessionResponse,
  AwardResultsViewXPResponse,
} from './resources/personality-assessment.js'

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
