import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { UserConfig } from 'vite'
import { mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.config'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

const packageConfig = {
  root: workspaceRoot,
  test: {
    watchExclude: ['**/dist/**'],
    // The root config uses `pool: "threads"`, which shares one heap across every
    // file. Over this project's 333 test files nothing is reclaimed between them
    // and the run dies with a JS heap OOM (SIGABRT) at both 4 GB and 8 GB — no
    // assertion fails, the process simply runs out of memory. That is why
    // scf-core is excluded from every aggregate command: it could never finish.
    //
    // Forks give each file its own process, so its heap goes away when it exits.
    // Slower per file, but bounded. With this the full suite completes. See #504.
    pool: 'forks',
  },
  resolve: {
    alias: [
      { find: 'react-native', replacement: 'react-native-web' },
      {
        find: '@scf/core',
        replacement: resolve(workspaceRoot, 'packages/scf-core'),
      },
    ],
  },
}

// mergeConfig concatenates arrays, so we override include after merging to
// avoid picking up test files from every other package in the monorepo.
const merged = mergeConfig(baseConfig as UserConfig, packageConfig)
merged.test.include = ['packages/scf-core/**/*.{test,spec}.{ts,tsx}']
// Exclude stale tests that target old tRPC API or have outdated component assertions.
// TODO: Update these tests to match the current SDK-based implementation.
merged.test.exclude = [
  ...(merged.test.exclude ?? []),
  // Rewritten: mock auth-sdk-hooks (useRequestMagicLinkMutation).
  // 'packages/scf-core/features/auth/__tests__/login-screen.test.tsx',
  // Rewritten: added useThemeContext to local mock. 1 layout test skipped
  // (component no longer uses $md responsive prop the mock translated).
  // 'packages/scf-core/features/discover/components/__tests__/FilterBar.test.tsx',
  // Rewritten: needed glassVibrantColors added to tokens mock; 2 status-
  // text assertions skipped (component shows iconic chips now).
  // 'packages/scf-core/features/dashboard/components/__tests__/TeamInvitationList.test.tsx',
  // Rewritten to mock SDK hook (useOfficeOrganizations) instead of tRPC api.
  // 'packages/scf-core/utils/__tests__/useAllOrganizations.test.ts',
  // Rewritten: mock map-sdk-hooks; flat SDK call shape (no nested coordinates/bounds).
  // 'packages/scf-core/features/discover/hooks/__tests__/useLocationHooks.test.ts',
  // Tests that need tRPC-to-SDK migration (mock old API but implementation uses SDK hooks)
  // Rewritten: mock map-sdk-hooks.useFindNearestResults.
  // 'packages/scf-core/features/discover/hooks/__tests__/useFindNearestResults.test.ts',
  // Rewritten: mock map-sdk-hooks.useLocationCounts.
  // 'packages/scf-core/features/discover/hooks/__tests__/useLocationResultCounts.test.ts',
  // Rewritten: mock onet-sdk-hooks.useSearchOccupations + engagement-sdk-hooks.useTrackEngagementMutation.
  // 'packages/scf-core/features/career-assessment/components/OccupationSearch.test.tsx',
  // Rewritten: mock personality-assessment-sdk-hooks + react-query useQueryClient.
  // 'packages/scf-core/features/ipip-assessment/components/__tests__/IPIPResultsPage.test.tsx',
  // Rewritten: mock personality-assessment-sdk-hooks + react-query useQueryClient.
  // 'packages/scf-core/features/ipip-assessment/components/__tests__/ShareResults.test.tsx',
  // Re-enabled with all 5 tests skipped (TODOs inline). Mock-swap done;
  // scoring/normalization assertions need real rewrites against current
  // useIPIPResults algorithm.
  // 'packages/scf-core/features/ipip-assessment/hooks/__tests__/useIPIPResults.test.tsx',
  // Rewritten: mock background-checks-sdk-hooks + react-query.useQueryClient;
  // payload field rename (reason/details), toast shape (title/variant), and
  // queryKey shape (['backgroundChecks', 'list'|'detail'|'disputes', ...]).
  // 'packages/scf-core/features/background-check/hooks/__tests__/useDispute.test.tsx',
  // Rewritten: removed dead @scf/core/utils/api mock (SDK mock present).
  // 'packages/scf-core/features/inquiries/components/__tests__/InquiryCommentThread.test.tsx',
  // Rewritten to mock SDK hook (profile-import-sdk-hooks.useImportData) and
  // updated assertions for current positional-id normalization behavior.
  // 'packages/scf-core/features/profile-import/hooks/__tests__/useImportData.test.ts',
  // Rewritten: mock profile-completion-sdk-hooks; isPending replaces isLoading.
  // 'packages/scf-core/features/profile-completion/hooks/__tests__/useCompletionStatus.test.ts',
  // Re-enabled: tRPC→SDK mock swap (onet-sdk-hooks.useRIASECStatus +
  // useSaveCareerAssessmentMutation) + react-query useQueryClient +
  // toError null-passthrough. 3/8 pass, 5 skipped with TODOs for copy
  // drift, Button onPress wiring, scoped useToast mock.
  // 'packages/scf-core/features/riasec-assessment/RIASECAssessmentWizard.test.tsx',
  // Tests with complex component rendering differences needing individual updates
  // Re-enabled: needed violet + fontSize/lineHeight/fontWeight tokens. 1 test skipped (multiple Stack ancestors).
  // 'packages/scf-core/features/discover/components/__tests__/ResultsRail.test.tsx',
  // Re-enabled: mock user-profiles-sdk-hooks.useUserProfilePreview;
  // signature update from { userId } → positional userId. 18/25 pass,
  // 7 skipped with TODOs (Avatar shape, Button onPress wiring, X close).
  // 'packages/scf-core/features/discover/components/__tests__/UserProfilePanel.test.tsx',
  // Rewritten: modal data-testid changed from "worker-preview-modal" to
  // "responsive-modal" (matches the beyond-ui ResponsiveModal stub).
  // 'packages/scf-core/features/discover/components/__tests__/WorkerPreviewModal.enhanced.test.tsx',
  // Rewritten: removed dead @scf/core/utils/api mock (SDK mocks already
  // present via @scaffald/sdk/react).
  // 'packages/scf-core/features/office/teams/components/__tests__/TeamInviteModal.test.tsx',
  // Rewritten: mock '@scaffald/sdk/react' (useCreateTeam, useUpdateTeam).
  // 'packages/scf-core/features/office/teams/components/__tests__/TeamForm.test.tsx',
  // Rewritten: mock teams-sdk-hooks (useTeamMembers, useTeamWorkload, mutations).
  // 'packages/scf-core/features/office/teams/components/__tests__/TeamMembersList.test.tsx',
  // Re-enabled: no changes needed; base infra was sufficient. 11/11.
  // 'packages/scf-core/features/profile-wizard/components/steps/__tests__/ExperienceStep.test.tsx',
  // Rewritten: merged duplicate @scaffald/ui mock so ResponsiveSelect stub
  // wins. Second vi.mock for same module was overriding the first.
  // 'packages/scf-core/features/office/applications/components/__tests__/ApplicationsFilters.test.tsx',
  // The three duplicate vi.mock('@scaffald/ui') calls this exclusion used to
  // blame are merged into one factory (#566). Re-enabling it showed that was
  // not the only problem: the file still fails to transform, on an unrelated
  // unresolvable import — `expo-router/react-navigation` reached via
  // provider/theme/UniversalThemeProvider.tsx. So it stays excluded, for a
  // reason that is now accurate.
  'packages/scf-core/features/profile/widgets/__tests__/PortfolioManager.test.tsx',
  // Tests that mock old tRPC API but component uses SDK hooks directly
  // Re-enabled: mock onet-sdk-hooks.useOccupationStatus + getAllByText for
  // the duplicate "Loading..." rendered by both the Spinner stub and the
  // component's label span.
  // Re-enabled: toError mock was forcing AssessmentWizard into the
  // error branch for null inputs (new Error('null')). Fixed to mirror
  // the real toError null-passthrough. 2/6 pass, 4 skipped with TODOs
  // for copy drift, missing icon stub, and Button onPress wiring.
  // 'packages/scf-core/features/occupation-assessment/OccupationAssessmentWizard.test.tsx',
  // Rewritten: mock onet-sdk-hooks.useRIASECStatus.
  // 'packages/scf-core/features/riasec-assessment/RIASECAssessmentWidget.test.tsx',
  // Re-enabled: simple Slider component test. 2 tests skipped (slider mock
  // shape / duplicate text in DOM).
  // 'packages/scf-core/features/career-assessment/components/RiasecQuickAssessment.test.tsx',
  // TODO: SDK mocks done but render path hits an infinite loop (OOM
  // after 5min). Likely a hook chain that re-renders forever in the
  // mock-only environment. Needs targeted investigation.
  'packages/scf-core/features/office/components/__tests__/OrganizationForm.test.tsx',
  // Rewritten: mock personality-assessment-sdk-hooks + react-query useQueryClient.
  // 'packages/scf-core/features/ipip-assessment/__tests__/IPIPAssessmentWizard.test.tsx',
  // Rewritten: mock profile-import-sdk-hooks + react-query useQueryClient.
  // 'packages/scf-core/features/profile-import/components/__tests__/ImportReviewScreen.test.tsx',
  // Rewritten: merged duplicate @scaffald/ui mocks; SDK mock surface.
  // 'packages/scf-core/features/profile/widgets/__tests__/PortfolioGallery.test.tsx',
  // Rewritten: add resume-sdk-hooks.useHasUploadedResume mock.
  // 'packages/scf-core/features/resume/components/__tests__/ResumeImportWidget.test.tsx',
  // Tests with assertion mismatches requiring deeper implementation alignment
  // 'packages/scf-core/features/drawer/__tests__/DrawerLink.chevron.test.tsx',
  // Re-enabled: routeHierarchy + flattenRoutes now recurse into
  // navigable parents (e.g. /office) so descendants (/office/cms/...)
  // appear in the hierarchy. Dynamic paths resolve via stricter regex.
  // 'packages/scf-core/utils/navigation/__tests__/routeHierarchy.test.ts',
  // Rewritten: mock profile-wizard-sdk-hooks; 2 tests skipped pending
  // assertion rewrite (SDK internal invalidate not surfaced by test mock).
  // 'packages/scf-core/features/profile-wizard/hooks/__tests__/useProfileWizard.test.ts',
  // Rewritten: mock '@scf/core/utils/resume-sdk-hooks' (useResumeWizardState,
  // useSaveResumeSectionMutation, useUpdateResumeProgressMutation); isPending.
  // 'packages/scf-core/features/resume/hooks/__tests__/useResumeWizard.test.ts',
  // Rewritten: mock applications-sdk-hooks + react-query.useQueryClient;
  // updated assertions for nested mutation payload { id, params: { status } }.
  // 'packages/scf-core/features/office/applications/hooks/__tests__/useApplicationStatusChange.test.ts',
  // Rewritten: mock teams-sdk-hooks.{useTeamActivityFeed, usePostTeamCommentMutation}.
  // 'packages/scf-core/features/office/teams/components/__tests__/TeamActivityFeed.test.tsx',
  // Rewritten: mock teams-sdk-hooks.useTeamAnalyticsOverview (was tRPC api).
  // 'packages/scf-core/features/office/teams/components/__tests__/TeamAnalyticsSummary.test.tsx',
  // Rewritten: mock teams-sdk-hooks + merged duplicate @scaffald/ui mock.
  // 'packages/scf-core/features/office/teams/components/__tests__/TeamCommentThread.test.tsx',
]

export default merged
