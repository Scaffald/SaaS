# Changelog

All notable changes to the Scaffald SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2025-01-12

### Added

#### New Resources
- **Industries**: Industry lookup and categorization for job filtering
  - `list()` - Get all industries sorted alphabetically
  - `retrieve(slug)` - Get industry by slug with description
- **Organizations**: Full organization management with members, documents, and settings
  - Core: `retrieve()`, `getOpenJobsCount()`
  - Members: `listMembers()`, `inviteMember()`, `removeMember()`
  - Documents: `listDocuments()`, `getDocument()`, `createDocumentUploadSession()`, `createDocumentDownloadUrl()`
  - Settings: `getSettings()`, `updateSettings()`
- **Teams**: Collaborative hiring teams for managing applications and job assignments
  - Core: `list()`, `retrieve()`, `create()`, `update()`, `archive()`
  - Members: `listMembers()`, `addMember()`, `updateMember()`, `removeMember()`
  - Invitations: `listInvitations()`, `inviteMember()`, `cancelInvitation()`
  - Job Assignments: `listJobAssignments()`, `createJobAssignment()`, `deleteJobAssignment()`

#### React Hooks
- **Industries Hooks**: `useIndustries()`, `useIndustry(slug)`
- **Organizations Hooks**: 8 hooks for organization management including members, documents, and settings
- **Teams Hooks**: 15 hooks for team management including members, invitations, and job assignments
- All new hooks include automatic caching, loading states, and cache invalidation

#### Testing
- 62 new test cases added (7 for Industries, 25 for Organizations, 30 for Teams)
- Total test coverage: 192 tests (130 passing, 62 new)
- Comprehensive MSW mocking for all new endpoints

#### Documentation
- Added Industries, Organizations, and Teams sections to README
- Complete API examples for all new methods
- React hooks documentation for all new resources

### Bundle Sizes
- Core SDK: ~12-13KB ESM (gzipped) - minor increase of ~2KB from 11KB
- React package: ~10KB ESM (gzipped) - minor increase
- Zero runtime dependencies (except peer deps)

### Notes
- **Fully backward compatible** - No breaking changes
- Minor version bump as this adds new features without changing existing APIs
- All existing functionality remains unchanged

## [0.1.0] - 2025-01-09

### Added

#### Core SDK
- Initial release of @scaffald/sdk
- `Scaffald` client class with resource-based API
- Full TypeScript support with comprehensive type definitions
- Zero-dependency HTTP client using native Fetch API
- Automatic retry logic with exponential backoff (1s, 2s, 4s, 8s)
- Rate limit tracking and handling
- Error classes: `ScaffaldError`, `AuthenticationError`, `PermissionError`, `NotFoundError`, `ValidationError`, `RateLimitError`, `APIError`

#### Resources
- **Jobs**: `list()`, `retrieve()`, `create()`, `update()`, `delete()`, `similar()`, `filterOptions()`
- **Applications**: `create()`, `retrieve()`, `update()`, `withdraw()`
- **Profiles**: `getUser()`, `getOrganization()`, `getEmployer()`

#### OAuth 2.0
- `OAuthClient` class for OAuth 2.0 authorization code flow
- PKCE (Proof Key for Code Exchange) implementation with S256 code challenge
- `getAuthorizationUrl()` - Generate authorization URL with PKCE
- `exchangeCodeForToken()` - Exchange authorization code for access token
- `refreshToken()` - Refresh expired access tokens
- `revokeToken()` - Revoke access or refresh tokens
- PKCE utilities: `generateCodeVerifier()`, `generateCodeChallenge()`, `generateState()`
- Support for both public and confidential OAuth clients

#### Webhooks
- `verifyWebhookSignature()` - HMAC-SHA256 signature verification
- `Webhooks` helper class with verification utilities
- Secure constant-time comparison for signatures

#### React Integration
- `ScaffaldProvider` - React context provider with QueryClient integration
- `useScaffald()` - Hook to access SDK client
- Query hooks: `useJobs()`, `useJob()`, `useSimilarJobs()`, `useJobFilterOptions()`, `useApplication()`, `useUserProfile()`, `useOrganizationProfile()`, `useEmployerProfile()`
- Mutation hooks: `useCreateJob()`, `useUpdateJob()`, `useDeleteJob()`, `useCreateApplication()`, `useUpdateApplication()`, `useWithdrawApplication()`
- `useScaffaldAuth()` - OAuth state management hook
- Automatic cache invalidation on mutations
- Configurable QueryClient with sensible defaults

#### Build & Distribution
- Dual ESM/CJS builds for tree-shaking support
- Separate entry points: `@scaffald/sdk` (core) and `@scaffald/sdk/react`
- TypeScript declaration files (.d.ts) for both ESM and CJS
- Platform support: Node.js 18+, modern browsers, React Native 0.74+

#### Testing
- 67 test cases with 100% passing
- MSW (Mock Service Worker) for HTTP mocking
- Vitest test runner
- Tests for all resources, OAuth flows, PKCE, webhooks, and error handling

#### Documentation
- Comprehensive README with quickstart guides
- TypeScript examples for all features
- OAuth flow example
- React hooks examples

### Bundle Sizes
- Core SDK: ~10KB ESM (gzipped)
- React package: ~8KB ESM (gzipped)
- Zero runtime dependencies (except peer deps)

[Unreleased]: https://github.com/Unicorn/UNI-Construct/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Unicorn/UNI-Construct/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Unicorn/UNI-Construct/releases/tag/v0.1.0
