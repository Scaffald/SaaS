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
  ListWelcomeSlidesParams,
  CreateWelcomeSlideParams,
  UpdateWelcomeSlideParams,
} from './resources/cms.js'

export type {
  Job,
  JobListParams,
  JobListResponse,
  CreateJobParams,
  ExternalJob,
  ExternalJobFilterOptions,
  OfficeJob,
  OfficeListJobsParams,
  OfficeListJobsResponse,
  OfficeCreateJobParams,
  OfficeUpdateJobParams,
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
  CurrentUser,
  GeneralInfo,
  UpdateGeneralInfoParams,
  ProfileBySlug,
  SlugAvailability,
  UpdateSlugResponse,
  SlugHistoryEntry,
  SlugHistory,
  UploadAvatarParams,
  UploadAvatarResponse,
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
  SuccessResponse,
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
  OrganizationInvitation,
  InviteStatus,
  DocumentVersion,
  CommitDocumentVersionParams,
  DocumentShare,
  ShareDocumentParams,
  UpdateDocumentShareParams,
  OrganizationFolder,
  FolderUpsertParams,
  OrganizationLocation,
  LocationUpsertParams,
  AuditLogListParams,
  ExportAuditLogParams,
  AuditLogExportResponse,
  StorageUsageSummary,
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
  TeamDailyMetric,
  GetTeamAnalyticsOverviewParams,
  TeamAnalyticsOverviewResponse,
  TeamWorkloadSnapshot,
  GetTeamWorkloadParams,
  TeamWorkloadResponse,
  TeamActivityEvent,
  GetTeamActivityFeedParams,
  TeamActivityFeedResponse,
  TeamComment,
  GetTeamCommentsParams,
  TeamCommentsResponse,
  PostTeamCommentParams,
  TransferTeamOwnershipParams,
  SelfRemoveFromTeamParams,
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
  CCPARequestType,
  CCPAOptOutCategory,
  CCPADataCategory,
  CCPADataSummaryResponse,
  CCPAUserRequest,
  CCPAMyRequestsResponse,
  CCPAOptOutStatus,
  CCPAOptOutsResponse,
  CCPASubmitRequestParams,
  CCPASubmitRequestResponse,
  CCPASetOptOutParams,
  CCPASetOptOutResponse,
  CCPAComplianceMetrics,
  AdminCCPARequest,
  CCPAAdminRequestsParams,
  CCPAAdminRequestsResponse,
  CCPAProcessRequestResponse,
} from './types/ccpa.js'

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
  RequestDeletionResponse,
  RequestWorkerDeletionParams,
  RequestOrganizationDeletionParams,
} from './resources/account-deletion.js'

export type {
  LocationCounts,
  NearestResult,
  GetLocationCountsParams,
  FindNearestResultsParams,
} from './resources/map.js'

export type {
  ViolationReport,
  ListViolationReportsParams,
  ListViolationReportsResponse,
  UpdateViolationReportParams,
  UpdateViolationReportResponse,
} from './resources/legal-agreements.js'

export type {
  NotificationDelivery,
  DigestQueueItem,
  AdminListDeliveriesParams,
  AdminListDigestQueueParams,
} from './resources/notifications-admin.js'

export type {
  NewsArticle,
  GetNewsByIndustryParams,
} from './resources/news.js'

export type {
  StorageBackend,
  StoragePreferenceResponse,
  SetStoragePreferenceParams,
  SetStoragePreferenceResponse,
} from './resources/documents-storage.js'

export type {
  StripeSettings,
  UpdatePublishableKeyParams,
  UpdateTestModeParams,
  UpdateStripeApiKeyParams,
  UpdateWebhookSecretParams,
} from './resources/stripe-settings.js'

export type {
  PaymentAnalytics,
  FailedTransactionRow,
  PaymentTransaction,
  TransactionsListParams,
  TransactionsListResponse,
  TransactionExportResponse,
  PaymentMethod,
  SetupIntentResponse,
  SavePaymentMethodParams,
  TransactionReceipt,
  AccountCredits,
  DepositCreditsParams,
  DepositCreditsResponse,
  CreditLedgerEntry,
  CreditLedgerResponse,
} from './types/payments.js'

export type {
  SuccessFeeSchedule,
  SuccessFeeStatus,
  CreateSuccessFeeParams,
  CreateSuccessFeeResponse,
  GetStatusByApplicationParams,
  ConfirmUpfrontPaymentParams,
} from './resources/success-fees.js'

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
  SearchOccupationsParams,
  SearchOccupationsResponse,
  GetOccupationParams,
  OccupationData,
  CareerAssessmentStatus,
  RIASECStatus,
  OccupationStatus,
  SaveCareerAssessmentParams,
  SaveCareerAssessmentResponse,
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
  GetReviewSoftSkillsParams,
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
  OfficeUser,
  OfficeListUsersResponse,
  OfficeUpdateUserParams,
  OfficeUserGeneral,
  OfficeUpdateUserGeneralParams,
  OfficeUserEmployment,
  OfficeUpdateUserEmploymentParams,
} from './resources/office-users.js'

export type {
  University,
  UniversityListResponse,
  UniversityListParams,
  UniversitySearchParams,
  UniversitySearchResponse,
  CreateUniversityParams,
  UpdateUniversityParams,
} from './resources/office-universities.js'

export type {
  OfficeCertification,
  CreateOfficeCertificationParams,
  UpdateOfficeCertificationParams,
} from './resources/office-certifications.js'

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
  AdminCheckSummary,
  AdminCheckDetail,
  AdminCheckDocument,
  AdminCheckDispute,
  AdminDisputeSummary,
  AdminMetrics,
  AdminAccessLogEntry,
  AdminListChecksParams,
  AdminUpdateStatusParams,
  AdminUpdatePrivacyParams,
  AdminResolveDisputeParams,
} from './resources/background-checks.js'

export type {
  FeedbackType,
  FeedbackSubmitParams,
  FeedbackSubmitResponse,
  FeedbackGetUploadUrlParams,
  FeedbackGetUploadUrlResponse,
  FeedbackHistoryItem,
  GetUserFeedbackParams,
  GetUserFeedbackResponse,
} from './resources/feedback.js'

export type {
  WorkLogStatus,
  WorkLogEntryType,
  WorkLogVisibility,
  TimeEntry,
  WorkLog,
  WorkLogCollaborator,
  WorkLogComment,
  WorkLogListItem,
  WorkLogOverview,
  WorkLogPhoto,
  ProjectOption,
  StatusSummary,
  ProjectRollup,
  GetProjectOptionsParams,
  ListWorkLogsParams,
  GetOverviewParams,
  GetProjectRollupParams,
  PublicProfileFeedParams,
  CreateWorkLogParams,
  UpdateWorkLogParams,
  SubmitWorkLogParams,
  AddCollaboratorParams,
  UpdateCollaboratorParams,
  AddCommentParams,
  GetSuggestedSkillsParams,
  AddSkillToProfileParams,
  UploadPhotoParams,
  UpdatePhotoMetadataParams,
  UpdatePhotoVisibilityParams,
  UpdateProfileVisibilityParams,
  MoveToProjectParams,
  ApproveMoveRequestParams,
  DenyMoveRequestParams,
  CancelMoveRequestParams,
  ExportWorkLogParams,
  CheckTimeOverlapParams,
  WorkLogsListResponse,
  UploadPhotoResponse,
  ExportWorkLogResponse,
  CheckTimeOverlapResponse,
} from './resources/work-logs.js'

export type {
  InquiryStatus,
  InquiryType,
  Inquiry,
  InquiryTemplate,
  CreateInquiryParams,
  ListInquiriesParams,
  RespondToInquiryParams,
  TemplatesParams,
  InquiriesListResponse,
  InquiryResponse,
  TemplatesResponse,
  BulkMarkAsReadResponse,
  BulkArchiveResponse,
} from './resources/inquiries.js'

export type {
  IdVerificationPricingItem,
  RequestVerificationParams,
  RequestVerificationResponse,
  ConfirmVerificationParams,
  ConfirmVerificationResponse,
  CurrentVerificationResponse,
  VerificationStatusResponse,
  IdVerificationListItem,
  ListVerificationsParams,
  ListVerificationsResponse,
  RevokeVerificationParams,
} from './resources/id-verification.js'

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
  PersonalityArchetype,
  SharedPersonalityResults,
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

export type {
  ResumeSection,
  ResumeMergeStrategyMode,
  UploadResumeParams,
  UploadResumeResponse,
  ParseResumeParams,
  ParsedGeneralEntry,
  ParsedExperienceEntry,
  ParsedEducationEntry,
  ParsedCertificationEntry,
  ParsedSkillEntry,
  ParsedEmploymentEntry,
  ParsedResumeData,
  ResumeParseError,
  ParseResumeResponse,
  HasUploadedResumeResponse,
  ResumeWizardState,
  SaveResumeSectionParams,
  SaveResumeSectionResponse,
  UpdateResumeProgressParams,
  UpdateResumeProgressResponse,
} from './types/resume.js'

export type {
  OAuthAppDetails,
  RegisterAppParams,
  RegisterAppResponse,
  GrantConsentParams,
  GrantConsentResponse,
  UserConsent,
  ListUserConsentsResponse,
  OAuthAppAdmin,
  ListAppsParams,
  ListAppsResponse,
  OAuthScope,
  ListScopesResponse,
  ApproveAppParams,
} from './resources/oauth-management.js'

export type {
  OfficeOrganization,
  OfficeOrganizationSimple,
  GetOfficeOrganizationsResponse,
  ListOfficeOrganizationsParams,
  ListOfficeOrganizationsResponse,
  OfficeOrganizationRequest,
  ListOrganizationRequestsParams,
  ListOrganizationRequestsResponse,
  ReviewOrganizationRequestParams,
  CheckSlugResponse,
  CreateOfficeOrganizationParams,
  UpdateOfficeOrganizationParams,
} from './resources/office-organizations.js'

export type {
  StorageTotals,
  StorageTopUser,
  StorageBreakdownEntry,
  StorageAnalyticsResponse,
} from './resources/office-storage.js'

export type {
  ProfileWizardProgress,
  ProfileWizardSaveStepParams,
  ProfileWizardCompleteParams,
} from './resources/profile-wizard.js'

import { Scaffald } from './client.js'
export default Scaffald
