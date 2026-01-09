# Changelog

All notable changes to the Scaffald SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/Unicorn/UNI-Construct/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Unicorn/UNI-Construct/releases/tag/v0.1.0
