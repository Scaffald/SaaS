/**
 * Barrel export for all scf-core SDK hooks.
 *
 * Import from '@scf/core/sdk-hooks' instead of individual hook files:
 *
 * @example
 * import { useTeam, useJobDetails, useConnections } from '@scf/core/sdk-hooks'
 *
 * NOTE: A handful of hook names appear in multiple files with different semantics
 * (e.g. `useFollowStatus` in employers vs. follows, `useSoftSkills` in profile-skills vs. reviews).
 * In those cases the barrel exports the most general version. Import from the specific
 * file directly when you need the other variant.
 */

// No conflicts — export everything
export * from '../account-deletion-sdk-hooks'
export * from '../api-keys-sdk-hooks'
export * from '../applications-sdk-hooks'
export * from '../auth-sdk-hooks'
export * from '../background-checks-sdk-hooks'
export * from '../ccpa-sdk-hooks'
export * from '../cms-sdk-hooks'
export * from '../connections-sdk-hooks'
export * from '../documents-storage-sdk-hooks'
export * from '../employers-sdk-hooks'

// engagement-sdk-hooks: only export the 3 unique tracking hooks.
// Connection hooks live in connections-sdk-hooks; follow hooks live in follows-sdk-hooks.
// useFollowStatus (user-follow variant) is also skipped — employers-sdk-hooks (org-follow) wins in the barrel.
export {
  useTrackEngagementMutation,
  useRecentActivity,
  useEngagementMetrics,
} from '../engagement-sdk-hooks'

export * from '../feedback-sdk-hooks'

// follows-sdk-hooks: export user-follow hooks.
// useFollowStatus (org-follow) is already exported from employers-sdk-hooks above.
export {
  useFollowing,
  useFollowers,
  useFollowUserMutation,
  useUnfollowUserMutation,
} from '../follows-sdk-hooks'

export * from '../id-verification-sdk-hooks'
export * from '../industries-sdk-hooks'
export * from '../inquiries-sdk-hooks'

// jobs-sdk-hooks: skip hooks already exported from applications-sdk-hooks above.
export {
  useOfficeListJobs,
  useJobDetails,
  useExternalJobs,
  usePublishedJobs,
  useFilterOptions,
  useJobsWithSoftSkillsMatch,
  useCalculateSoftSkillsMatch,
  useCreateJobApplicationMutation,
  useUpdateJobApplicationMutation,
  useUserApplications,
  useApplicationById,
  useSendApplicationMessageMutation,
  useOfficeCreateJobMutation,
  useOfficeDeleteJobMutation,
  useOfficeDuplicateJobMutation,
  useOfficeUpdateJobMutation,
} from '../jobs-sdk-hooks'

export * from '../legal-agreements-sdk-hooks'
export * from '../map-sdk-hooks'
export * from '../news-sdk-hooks'
export * from '../notifications-admin-sdk-hooks'
export * from '../notifications-sdk-hooks'
export * from '../oauth-sdk-hooks'
export * from '../office-certifications-sdk-hooks'
export * from '../office-organizations-sdk-hooks'
export * from '../office-storage-sdk-hooks'
export * from '../office-universities-sdk-hooks'
export * from '../office-users-sdk-hooks'
export * from '../onet-sdk-hooks'
export * from '../organizations-sdk-hooks'
export * from '../payments-sdk-hooks'
export * from '../personality-assessment-sdk-hooks'
export * from '../portfolio-sdk-hooks'
export * from '../prerequisites-sdk-hooks'
export * from '../profile-certifications-sdk-hooks'
export * from '../profile-completion-sdk-hooks'
export * from '../profile-education-sdk-hooks'
export * from '../profile-employment-sdk-hooks'
export * from '../profile-experience-sdk-hooks'
export * from '../profile-general-sdk-hooks'
export * from '../profile-import-sdk-hooks'

// profile-skills-sdk-hooks: skip useIndustries (already exported from industries-sdk-hooks above).
export {
  useSoftSkills,
  useSoftSkillsHistory,
  useSoftSkillsComparison,
  useUpdateSoftSkillsMutation,
  useSkillChildren,
  useSkillDetails,
  useUserSkills,
  useSearchParentSkillsMutation,
  useAddUserSkillMutation,
  useUpdateUserSkillMutation,
  useRemoveUserSkillMutation,
  useUserSkillsMultiTaxonomy,
  usePrimaryIndustry,
  useAddSkillMultiTaxonomyMutation,
  useUpdateSkillMultiTaxonomyMutation,
  useRemoveSkillMultiTaxonomyMutation,
  useUpdatePrimaryIndustryMutation,
  useSkillsLegacy,
  useUpdateSkillsLegacyMutation,
} from '../profile-skills-sdk-hooks'

export * from '../profile-views-sdk-hooks'
export * from '../profile-widgets-sdk-hooks'
export * from '../profile-wizard-sdk-hooks'

// profiles-sdk-hooks: skip hooks already exported from profile-general-sdk-hooks above.
export {
  useUserProfile,
  useOrganizationProfile,
  useEmployerProfile,
  useSlugAvailability,
} from '../profiles-sdk-hooks'

export * from '../projects-sdk-hooks'
export * from '../resume-sdk-hooks'

// reviews-sdk-hooks: skip useSoftSkills (already exported from profile-skills-sdk-hooks above).
export {
  useSoftSkillsByCategory,
  useReviewDraft,
  useReviewsBySubject,
  useMyReviews,
  useReviewAnalytics,
  useCreateReviewDraftMutation,
  useSaveDraftMutation,
  useUpdateStepMutation,
  useUpdateSkillRatingsMutation,
  useUpdateCategoryRatingMutation,
  useUpdateSoftSkillVotesMutation,
  useUpdateCommentMutation,
  useSubmitReviewMutation,
  useDeleteDraftMutation,
} from '../reviews-sdk-hooks'

// stripe-settings-sdk-hooks: skip useUpdateApiKeyMutation (already in api-keys-sdk-hooks above).
export {
  useStripeSettings,
  useUpdatePublishableKeyMutation,
  useUpdateTestModeMutation,
  useUpdateWebhookSecretMutation,
  useTestConnectionMutation,
} from '../stripe-settings-sdk-hooks'

export * from '../success-fees-sdk-hooks'
export * from '../teams-sdk-hooks'

// user-profiles-sdk-hooks: skip useUserProfile (profiles-sdk-hooks) and useUserSkills (profile-skills-sdk-hooks).
export {
  useUserProfilePreview,
  useUserCertifications,
  useUserExperience,
  useUserEducation,
  useReviewsSummary,
  useContactInfo,
} from '../user-profiles-sdk-hooks'

export * from '../webhooks-sdk-hooks'
export * from '../work-logs-sdk-hooks'
export * from '../workers-sdk-hooks'
