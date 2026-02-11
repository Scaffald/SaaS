# Scaffald API Architecture

## Overview

Scaffald uses a **hybrid architecture** combining REST SDK and tRPC to balance public API requirements, developer experience, and architectural flexibility.

- **SDK (REST API)**: User-facing data operations, public-ready endpoints
- **tRPC**: Complex workflows, file operations, admin tools, provider integrations

This hybrid approach allows us to:
- Expose a clean, versioned REST API to external developers via the SDK
- Maintain internal flexibility with tRPC for complex, server-side operations
- Optimize each API style for its specific use cases

## When to Use SDK (REST API)

✅ **Use SDK for:**

### User-Facing Data Operations
- Profile data (skills, experience, education, certifications)
- Job listings and applications
- Reviews and ratings
- Portfolio items and projects
- Social features (connections, follows, engagement)
- User search and discovery

### Characteristics:
- Read-heavy operations
- Standard CRUD patterns
- Simple filtering and pagination
- Public API candidates
- Standard HTTP semantics (GET, POST, PATCH, DELETE)
- Stateless operations

### Examples:
```typescript
// Good SDK candidates
await client.jobs.list({ status: 'published', limit: 20 })
await client.profiles.get({ userId: 'user_123' })
await client.applications.submit({ jobId: 'job_456' })
await client.skills.getUserSkills({ userId: 'user_123' })
```

## When to Use tRPC

✅ **Use tRPC for:**

### Complex Server-Side Workflows
- Multi-step operations with state
- Complex business logic with server-side validation
- Operations requiring server context

### File Operations
- File uploads with streaming
- Document generation (PDF, CSV exports)
- Resume parsing and format conversion
- Image processing and optimization

### External Provider Integration
- Payment processing (Stripe)
- Background check services
- ID verification APIs
- OAuth provider flows
- Operations requiring API secrets

### Admin Operations
- Super-admin only endpoints
- Office management tools
- Analytics dashboards
- System configuration

### Compliance Workflows
- CCPA data requests
- Account deletion with audit trails
- Legal and compliance-critical operations

### Examples:
```typescript
// Good tRPC candidates
api.payments.createPaymentIntent.useMutation()
api.resume.upload.useMutation()
api.backgroundChecks.initiateCheck.useMutation()
api.office.adminUpdateUser.useMutation()
api.ccpa.exportUserData.useMutation()
```

## Architecture Decision Records

### ADR-001: Why Hybrid Architecture?

**Context**:
- Need for public REST API to enable SDK and external developer access
- Internal operations require flexibility and server-side context
- Want to maintain fast iteration speed for complex features

**Decision**:
Use SDK (REST) for user-facing operations and tRPC for internal/complex operations

**Consequences**:
- ✅ Clean public API surface via SDK
- ✅ Internal flexibility maintained with tRPC
- ✅ Each tool optimized for its use case
- ⚠️ Dual maintenance required (but clear separation)
- ⚠️ Developers must understand when to use each

**Status**: Accepted

### ADR-002: File Operations Stay in tRPC

**Context**:
File uploads require:
- Streaming support
- Signed URLs
- Server-side processing
- Storage backend abstraction

**Decision**:
Keep work-logs, documents, resume, CMS file operations in tRPC

**Consequences**:
- ✅ Simplified file handling with server context
- ✅ Security through signed URLs
- ✅ Flexible storage backend (Supabase/S3)
- ⚠️ Cannot expose directly via public SDK without proxy layer
- ⚠️ SDK users must use separate file upload flow

**Status**: Accepted

### ADR-003: Payment & Provider Integrations Stay in tRPC

**Context**:
External provider APIs require:
- API keys and secrets (server-side only)
- Webhook handling
- Complex error handling and retries
- State management across async operations

**Decision**:
Keep payments, background checks, ID verification in tRPC

**Consequences**:
- ✅ Secrets never exposed to client
- ✅ Webhook handling on server
- ✅ Complex retry logic centralized
- ⚠️ Cannot expose via public SDK
- ⚠️ Requires tRPC client for these operations

**Status**: Accepted

### ADR-004: Admin Operations Stay in tRPC

**Context**:
Admin operations:
- Require organization-level access control
- Often operate across multiple users
- Need complex authorization logic
- Are not suitable for public API

**Decision**:
Keep office admin, super-admin tools in tRPC

**Consequences**:
- ✅ Flexible authorization without API key constraints
- ✅ Can use nested routers for organization
- ✅ Server-side session management
- ⚠️ Admin UI tied to tRPC client
- ⚠️ Cannot expose to external developers

**Status**: Accepted

### ADR-005: Social Features in SDK

**Context**:
Social features (connections, follows, engagement tracking):
- Simple CRUD operations
- Read-heavy with caching
- Valuable for external integrations
- Standard REST patterns work well

**Decision**:
Migrate all social features to SDK

**Consequences**:
- ✅ External developers can build social features
- ✅ Clean REST patterns for follows/connections
- ✅ Better caching with React Query
- ✅ Public API for engagement tracking
- ✅ Mobile apps can use REST directly

**Status**: Accepted

## API Coverage

### SDK Resources (31 Resources)

**Core Data (8)**:
- jobs, applications, profiles, user-profiles
- industries, organizations, teams, api-keys

**Profile Extensions (8)**:
- skills, experience, employment, education
- certifications, portfolio, reviews, projects

**Social/Engagement (4)**:
- connections, follows, engagement, profile-views

**Supporting (7)**:
- prerequisites, profile-completion, profile-import
- employers, onet, inquiries, notifications

**Operations (4)**:
- work-logs, profile-widgets, webhooks-management, background-checks

### tRPC Routers Staying (18 Routers)

**File Operations (5)**:
- work-logs (photos, GPS, exports)
- documents (multi-file, integrations)
- resume (parsing, conversions)
- cms (images, storage)
- background-checks (document uploads)

**Provider Integration (4)**:
- oauth (secrets)
- payments (Stripe)
- stripe-settings (admin config)
- id-verification (third-party APIs)

**Compliance (3)**:
- ccpa (data rights, PDF generation)
- account-deletion (cascading, audit)
- success-fees (payment gating)

**Admin Tools (4)**:
- office (super-admin, nested routers)
- auth (session management)
- map (specialized geocoding)
- notifications (real-time subscriptions)

**Low Usage (2)**:
- feedback (2 uses)
- news (1 use)

## Migration History

### Phases 1-17: Foundation & Core (Complete)

**Result**: 30 SDK resources, ~170 files migrated
- ✅ Teams, Prerequisites, Applications, Jobs
- ✅ Engagement, Social features
- ✅ Profile Extensions
- ✅ Organizations, Employers, ONET

### Phase 18: tRPC Cleanup (Complete)

**Result**: Cleaned up all tRPC utility patterns
- ✅ Replaced `api.useUtils()` with `useQueryClient()`
- ✅ Migrated API keys to SDK
- ✅ Refactored cache invalidation patterns

### Phase 19: SDK Test Coverage (Complete)

**Result**: 93% resource coverage (28/30 resources)
- ✅ Created 19 new test files
- ✅ 31 total test files (including infrastructure)
- ✅ Comprehensive coverage of all priority resources

### Phase 20: Strategic Migrations (Complete)

**Result**: User-profiles migrated
- ✅ user-profiles: 8 methods, 8 files migrated, 16 queries
- ⏭️ addresses, workers, personality-assessment: 0 uses (not exposed in router)

### Phase 21: Architecture Documentation (Complete)

**Result**: Comprehensive documentation
- ✅ This ARCHITECTURE.md document
- ✅ Migration guidelines
- ✅ API coverage matrix
- ✅ Updated README

## Guidelines for Future Development

### Adding New Endpoints

1. **Is it user-facing data?** → Use SDK
2. **Does it require file uploads?** → Use tRPC
3. **Does it integrate with external APIs?** → Use tRPC
4. **Is it admin-only?** → Use tRPC
5. **Is it compliance-critical?** → Use tRPC
6. **Otherwise** → Default to SDK

### SDK Development Workflow

1. Define types in `/packages/scaffald-sdk/src/resources/[name].ts`
2. Implement resource class extending `Resource`
3. Add to SDK client constructor
4. Export types from SDK index
5. Create React hooks in `/packages/scf-core/utils/[name]-sdk-hooks.ts`
6. Write comprehensive tests in `/packages/scaffald-sdk/src/__tests__/[name].test.ts`
7. Add mock handlers to MSW server
8. Document in this file

### tRPC Development Workflow

1. Define router in `/packages/supabase/functions/trpc/routers/[name].router.ts`
2. Add to main router exports
3. Create hooks in feature directory
4. Document why it stays in tRPC (reference ADR)
5. Add to "Routers Staying in tRPC" list in this file

## Performance Considerations

### SDK (REST)
- **Caching**: React Query manages caching automatically
- **Batching**: Not supported (separate HTTP requests)
- **Network**: More requests but simpler infrastructure
- **Best for**: Independent queries, cacheable data

### tRPC
- **Caching**: React Query integration
- **Batching**: Supported via links
- **Network**: Fewer requests with batching
- **Best for**: Related queries, real-time subscriptions

## Security Considerations

### SDK (REST)
- API keys or OAuth tokens required
- Rate limiting per key
- Public endpoints must be secured
- Validate all inputs server-side

### tRPC
- Supabase session-based auth
- Server context available
- Can access secrets safely
- Flexible authorization logic

## Future Considerations

### Potential Future Changes

1. **GraphQL Layer**: Could add GraphQL over SDK resources for flexibility
2. **SDK Mobile**: Native SDKs (Swift, Kotlin) wrapping REST API
3. **Webhooks SDK**: SDK resource for webhook management (already exists)
4. **Real-time**: Consider WebSocket/SSE layer for real-time features
5. **API Versioning**: Plan for v2 endpoints as needed

### Deprecation Strategy

When deprecating tRPC routers:
1. Mark as deprecated in code with comments
2. Add warning logs when used
3. Provide migration guide to SDK equivalent
4. Keep for 2-3 releases minimum
5. Remove only after confirming zero usage

## Conclusion

The hybrid SDK/tRPC architecture provides the best of both worlds:
- **Public REST API** for external developers and mobile apps
- **Internal tRPC** for complex operations and flexibility
- **Clear separation** of concerns and use cases

This architecture is production-ready with 93% SDK test coverage, comprehensive documentation, and clear guidelines for future development.
