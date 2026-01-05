# tRPC Router Inventory

**Last Updated**: 2025-12-31
**Total Routers**: 58
**Total Estimated Endpoints**: ~400
**Total Lines of Code**: ~44,000

---

## Inventory Summary

| Priority | Routers | Lines of Code | Est. Endpoints | Duration |
|----------|---------|---------------|----------------|----------|
| P0 (Done) | 5 | ~1,000 | 21 | Complete |
| P1 | 6 | ~2,615 | ~47 | 2 weeks |
| P2 | 10 | ~20,584 | ~138 | 4 weeks |
| P3 | 15 | ~13,112 | ~111 | 4 weeks |
| P4 | 12 | ~8,172 | ~84 | 3 weeks |
| P5 | 10+ | ~4,340+ | ~66+ | 2 weeks |
| **TOTAL** | **58** | **~49,823** | **~467** | **22 weeks** |

---

## Complexity Scoring System

Each router is scored based on:

**Lines of Code (LOC)**:
- Small: <500 lines (1 point)
- Medium: 500-1,500 lines (2 points)
- Large: 1,500-3,000 lines (3 points)
- Very Large: >3,000 lines (4 points)

**Dependencies**:
- Standalone: No complex dependencies (0 points)
- Moderate: 1-3 external services (1 point)
- High: 4+ external services or complex integrations (2 points)

**Business Criticality**:
- Low: Optional features (0 points)
- Medium: Important features (1 point)
- High: Core features (2 points)
- Critical: Auth, payments, compliance (3 points)

**Complexity Score** = LOC + Dependencies + Business Criticality
- 1-2: Simple
- 3-4: Moderate
- 5-6: Complex
- 7+: Very Complex

---

## P0 - Already Migrated (REST Implemented, Needs Tests)

### 1. Jobs Router
- **File**: `packages/supabase/functions/trpc/routers/jobs.router.ts`
- **LOC**: ~200
- **Estimated Endpoints**: 4
- **REST File**: `packages/supabase/functions/api/routes/jobs.ts`
- **Complexity Score**: 3 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 0 (Standalone)
  - Criticality: 2 (High - job listings)
- **Status**: ✅ REST implemented, 🔴 No tests
- **Notes**: Core job discovery feature

### 2. Applications Router
- **File**: `packages/supabase/functions/trpc/routers/applications.router.ts`
- **LOC**: ~250
- **Estimated Endpoints**: 4
- **REST File**: `packages/supabase/functions/api/routes/applications.ts`
- **Complexity Score**: 4 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 1 (Webhooks)
  - Criticality: 2 (High - job applications)
- **Status**: ✅ REST implemented, 🔴 No tests
- **Notes**: Webhook integration for application events

### 3. Profiles Router
- **File**: `packages/supabase/functions/trpc/routers/profile/general.router.ts`
- **LOC**: ~180
- **Estimated Endpoints**: 3
- **REST File**: `packages/supabase/functions/api/routes/profiles.ts`
- **Complexity Score**: 3 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 0
  - Criticality: 2 (High - user profiles)
- **Status**: ✅ REST implemented, 🔴 No tests
- **Notes**: Public profile discovery

### 4. OAuth Router
- **File**: `packages/supabase/functions/trpc/routers/oauth.router.ts`
- **LOC**: ~300
- **Estimated Endpoints**: 5
- **REST File**: `packages/supabase/functions/api/routes/oauth.ts`
- **Complexity Score**: 5 (Complex)
  - LOC: 1 (Small)
  - Dependencies: 1 (OAuth 2.0 spec)
  - Criticality: 3 (Critical - authentication)
- **Status**: ✅ REST implemented, 🔴 No tests
- **Notes**: OAuth 2.0 + PKCE implementation

### 5. API Keys Router
- **File**: (New feature, no tRPC equivalent)
- **LOC**: ~250
- **Estimated Endpoints**: 5
- **REST File**: `packages/supabase/functions/api/routes/api-keys.ts`
- **Complexity Score**: 4 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 1 (Rate limiting)
  - Criticality: 2 (High - API access management)
- **Status**: ✅ REST implemented, 🔴 No tests
- **Notes**: New REST-only feature for API key management

---

## P1 - Core Auth & User (Critical Path)

### 6. Auth Router
- **File**: `packages/supabase/functions/trpc/routers/auth.router.ts`
- **LOC**: 137
- **Estimated Endpoints**: 5
  - POST /v1/auth/magic-link
  - POST /v1/auth/verify
  - GET /v1/auth/session
  - DELETE /v1/auth/session
  - POST /v1/auth/refresh
- **Complexity Score**: 5 (Complex)
  - LOC: 1 (Small)
  - Dependencies: 1 (Mailpit/email)
  - Criticality: 3 (Critical - user authentication)
- **Dependencies**: Supabase Auth, Mailpit
- **Migration Priority**: 1st (Critical path)
- **Estimated Effort**: 2 days
- **Notes**: Core authentication flows, integrates with Supabase Auth

### 7. User Profile Router
- **File**: `packages/supabase/functions/trpc/routers/user-profile.router.ts`
- **LOC**: 449
- **Estimated Endpoints**: 6
  - GET /v1/user/profile
  - PATCH /v1/user/profile
  - GET /v1/user/settings
  - PATCH /v1/user/settings
  - DELETE /v1/user/account
  - POST /v1/user/avatar
- **Complexity Score**: 4 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 1 (Account deletion service)
  - Criticality: 2 (High)
- **Migration Priority**: 2nd
- **Estimated Effort**: 2 days
- **Notes**: User account management, links to account-deletion router

### 8. Profile - Employment Router
- **File**: `packages/supabase/functions/trpc/routers/profile/employment.router.ts`
- **LOC**: 145
- **Estimated Endpoints**: 8
  - GET /v1/profile/employment (list)
  - POST /v1/profile/employment (create)
  - PUT /v1/profile/employment/:id (update)
  - DELETE /v1/profile/employment/:id (delete)
  - GET /v1/profile/employment/:id (get one)
  - PATCH /v1/profile/employment/:id/verify
  - GET /v1/profile/employment/current
  - PATCH /v1/profile/employment/:id/end-date
- **Complexity Score**: 3 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 0
  - Criticality: 2 (High - profile completion)
- **Migration Priority**: 3rd
- **Estimated Effort**: 2 days

### 9. Profile - Skills Router ⚠️ COMPLEX
- **File**: `packages/supabase/functions/trpc/routers/profile/skills.router.ts`
- **LOC**: 959
- **Estimated Endpoints**: 12
  - GET /v1/profile/skills (list)
  - POST /v1/profile/skills (add)
  - DELETE /v1/profile/skills/:id (remove)
  - PATCH /v1/profile/skills/:id (update proficiency)
  - GET /v1/skills/search (taxonomy search)
  - GET /v1/skills/suggestions (AI-powered)
  - POST /v1/skills/import (from resume/LinkedIn)
  - GET /v1/skills/categories
  - POST /v1/skills/bulk-add
  - DELETE /v1/skills/bulk-remove
  - GET /v1/skills/analytics
  - POST /v1/skills/endorse
- **Complexity Score**: 5 (Complex)
  - LOC: 2 (Medium)
  - Dependencies: 1 (Skill taxonomy, LinkedIn integration)
  - Criticality: 2 (High)
- **Migration Priority**: 4th
- **Estimated Effort**: 4 days
- **Notes**: Largest P1 router, complex skill taxonomy, endorsements

### 10. Profile - Education Router
- **File**: `packages/supabase/functions/trpc/routers/profile/education.router.ts`
- **LOC**: 455
- **Estimated Endpoints**: 8
  - GET /v1/profile/education (list)
  - POST /v1/profile/education (create)
  - PUT /v1/profile/education/:id (update)
  - DELETE /v1/profile/education/:id (delete)
  - GET /v1/profile/education/:id (get one)
  - PATCH /v1/profile/education/:id/verify
  - GET /v1/schools/search
  - GET /v1/degrees/list
- **Complexity Score**: 4 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 1 (School database)
  - Criticality: 2 (High)
- **Migration Priority**: 5th
- **Estimated Effort**: 2 days

### 11. Notifications Router
- **File**: `packages/supabase/functions/trpc/routers/notifications.router.ts`
- **LOC**: 470
- **Estimated Endpoints**: 8
  - GET /v1/notifications (list, paginated)
  - GET /v1/notifications/:id (get one)
  - PATCH /v1/notifications/:id/read (mark read)
  - PATCH /v1/notifications/read-all
  - DELETE /v1/notifications/:id
  - GET /v1/notifications/unread-count
  - GET /v1/notifications/preferences
  - PATCH /v1/notifications/preferences
- **Complexity Score**: 4 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 1 (Real-time subscriptions)
  - Criticality: 2 (High)
- **Migration Priority**: 6th
- **Estimated Effort**: 2 days
- **Notes**: Consider WebSocket support for real-time notifications

---

## P2 - Job Discovery & Core Features

### 12. Organizations Router ⚠️ LARGE
- **File**: `packages/supabase/functions/trpc/routers/organizations.router.ts`
- **LOC**: 2,368
- **Estimated Endpoints**: 22
- **Complexity Score**: 7 (Very Complex)
  - LOC: 3 (Large)
  - Dependencies: 2 (Stripe, Webhooks)
  - Criticality: 2 (High)
- **Estimated Effort**: 5 days
- **Notes**: Organization management, billing, members, settings

### 13. Background Checks Router ⚠️ VERY LARGE
- **File**: `packages/supabase/functions/trpc/routers/background-checks.router.ts`
- **LOC**: 3,943
- **Estimated Endpoints**: 18
- **Complexity Score**: 8 (Very Complex)
  - LOC: 4 (Very Large)
  - Dependencies: 2 (Third-party background check API)
  - Criticality: 3 (Critical - compliance)
- **Estimated Effort**: 6 days
- **Notes**: Compliance-critical, third-party integration

### 14. Work Logs Router ⚠️ VERY LARGE
- **File**: `packages/supabase/functions/trpc/routers/work-logs.router.ts`
- **LOC**: 4,743
- **Estimated Endpoints**: 24
- **Complexity Score**: 8 (Very Complex)
  - LOC: 4 (Very Large)
  - Dependencies: 1 (Time tracking)
  - Criticality: 2 (High)
- **Estimated Effort**: 7 days
- **Notes**: Largest router in P2, time tracking and logging

### 15. Teams Router ⚠️ VERY LARGE
- **File**: `packages/supabase/functions/trpc/routers/teams.router.ts`
- **LOC**: 4,093
- **Estimated Endpoints**: 20
- **Complexity Score**: 7 (Very Complex)
  - LOC: 4 (Very Large)
  - Dependencies: 1 (Team permissions)
  - Criticality: 2 (High)
- **Estimated Effort**: 6 days
- **Notes**: Team management, invitations, permissions, analytics

### 16. Employers Router
- **File**: `packages/supabase/functions/trpc/routers/employers.router.ts`
- **LOC**: 496
- **Estimated Endpoints**: 10
- **Complexity Score**: 4 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 0
  - Criticality: 2 (High)
- **Estimated Effort**: 2 days

### 17. Documents Router
- **File**: `packages/supabase/functions/trpc/routers/documents.router.ts`
- **LOC**: 1,017
- **Estimated Endpoints**: 12
- **Complexity Score**: 5 (Complex)
  - LOC: 2 (Medium)
  - Dependencies: 1 (File storage)
  - Criticality: 2 (High)
- **Estimated Effort**: 3 days
- **Notes**: File upload/download, document management

### 18. Resume Router
- **File**: `packages/supabase/functions/trpc/routers/resume.router.ts`
- **LOC**: 1,486
- **Estimated Endpoints**: 10
- **Complexity Score**: 5 (Complex)
  - LOC: 2 (Medium)
  - Dependencies: 1 (Resume parsing)
  - Criticality: 2 (High)
- **Estimated Effort**: 3 days
- **Notes**: Resume parsing, import to profile

### 19. Profile - Certifications Router
- **File**: `packages/supabase/functions/trpc/routers/profile/certifications.router.ts`
- **LOC**: 1,204
- **Estimated Endpoints**: 8
- **Complexity Score**: 4 (Moderate)
  - LOC: 2 (Medium)
  - Dependencies: 0
  - Criticality: 1 (Medium)
- **Estimated Effort**: 2 days

### 20. Profile - Experience Router
- **File**: `packages/supabase/functions/trpc/routers/profile/experience.router.ts`
- **LOC**: 339
- **Estimated Endpoints**: 6
- **Complexity Score**: 3 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 0
  - Criticality: 1 (Medium)
- **Estimated Effort**: 2 days

### 21. Reviews Router
- **File**: `packages/supabase/functions/trpc/routers/reviews.router.ts`
- **LOC**: 895
- **Estimated Endpoints**: 8
- **Complexity Score**: 4 (Moderate)
  - LOC: 2 (Medium)
  - Dependencies: 0
  - Criticality: 1 (Medium)
- **Estimated Effort**: 2 days
- **Notes**: User reviews and ratings

---

## P3 - Extended Features

### 22. Payments Router
- **File**: `packages/supabase/functions/trpc/routers/payments.router.ts`
- **LOC**: 1,904
- **Estimated Endpoints**: 12
- **Complexity Score**: 7 (Very Complex)
  - LOC: 3 (Large)
  - Dependencies: 2 (Stripe, Webhooks)
  - Criticality: 3 (Critical - revenue)
- **Estimated Effort**: 4 days
- **Notes**: Stripe integration, subscriptions, webhooks

### 23. CCPA Router ⚠️ COMPLEX
- **File**: `packages/supabase/functions/trpc/routers/ccpa.router.ts`
- **LOC**: 2,542
- **Estimated Endpoints**: 15
- **Complexity Score**: 8 (Very Complex)
  - LOC: 3 (Large)
  - Dependencies: 2 (Data export, Legal compliance)
  - Criticality: 3 (Critical - legal compliance)
- **Estimated Effort**: 5 days
- **Notes**: California Consumer Privacy Act compliance, data rights

### 24. Compliance - Requirements Router
- **File**: `packages/supabase/functions/trpc/routers/compliance/requirements.router.ts`
- **LOC**: ~500 (estimated)
- **Estimated Endpoints**: 8
- **Complexity Score**: 5 (Complex)
  - LOC: 1 (Small)
  - Dependencies: 1
  - Criticality: 2 (High)
- **Estimated Effort**: 2 days

### 25. Compliance - Dependencies Router
- **File**: `packages/supabase/functions/trpc/routers/compliance/dependencies.router.ts`
- **LOC**: ~400 (estimated)
- **Estimated Endpoints**: 6
- **Complexity Score**: 4 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 1
  - Criticality: 2 (High)
- **Estimated Effort**: 2 days

### 26. ID Verification Router
- **File**: `packages/supabase/functions/trpc/routers/id-verification.router.ts`
- **LOC**: 791
- **Estimated Endpoints**: 8
- **Complexity Score**: 6 (Complex)
  - LOC: 2 (Medium)
  - Dependencies: 2 (Third-party ID verification)
  - Criticality: 2 (High)
- **Estimated Effort**: 3 days
- **Notes**: Third-party integration for identity verification

### 27. Legal Agreements Router
- **File**: `packages/supabase/functions/trpc/routers/legal-agreements.router.ts`
- **LOC**: 511
- **Estimated Endpoints**: 6
- **Complexity Score**: 4 (Moderate)
  - LOC: 2 (Medium)
  - Dependencies: 0
  - Criticality: 2 (High)
- **Estimated Effort**: 2 days

### 28. Account Deletion Router
- **File**: `packages/supabase/functions/trpc/routers/account-deletion.router.ts`
- **LOC**: 665
- **Estimated Endpoints**: 5
- **Complexity Score**: 5 (Complex)
  - LOC: 2 (Medium)
  - Dependencies: 1 (Data cleanup)
  - Criticality: 2 (High - GDPR/CCPA)
- **Estimated Effort**: 2 days
- **Notes**: GDPR/CCPA data deletion requirements

### 29. Inquiries Router ⚠️ LARGE
- **File**: `packages/supabase/functions/trpc/routers/inquiries.router.ts`
- **LOC**: 2,519
- **Estimated Endpoints**: 12
- **Complexity Score**: 6 (Complex)
  - LOC: 3 (Large)
  - Dependencies: 1
  - Criticality: 1 (Medium)
- **Estimated Effort**: 4 days

### 30. Connections Router
- **File**: `packages/supabase/functions/trpc/routers/connections.router.ts`
- **LOC**: 563
- **Estimated Endpoints**: 8
- **Complexity Score**: 3 (Moderate)
  - LOC: 2 (Medium)
  - Dependencies: 0
  - Criticality: 0 (Low - social feature)
- **Estimated Effort**: 2 days

### 31. Follows Router
- **File**: `packages/supabase/functions/trpc/routers/follows.router.ts`
- **LOC**: 337
- **Estimated Endpoints**: 6
- **Complexity Score**: 3 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 0
  - Criticality: 0 (Low - social feature)
- **Estimated Effort**: 1 day

### 32. Feedback Router
- **File**: `packages/supabase/functions/trpc/routers/feedback.router.ts`
- **LOC**: 306
- **Estimated Endpoints**: 5
- **Complexity Score**: 2 (Simple)
  - LOC: 1 (Small)
  - Dependencies: 0
  - Criticality: 0 (Low)
- **Estimated Effort**: 1 day

### 33. Engagement Router
- **File**: `packages/supabase/functions/trpc/routers/engagement.router.ts`
- **LOC**: 167
- **Estimated Endpoints**: 4
- **Complexity Score**: 2 (Simple)
  - LOC: 1 (Small)
  - Dependencies: 0
  - Criticality: 0 (Low - analytics)
- **Estimated Effort**: 1 day

### 34. Profile Views Router
- **File**: `packages/supabase/functions/trpc/routers/profileViews.router.ts`
- **LOC**: 400
- **Estimated Endpoints**: 5
- **Complexity Score**: 3 (Moderate)
  - LOC: 1 (Small)
  - Dependencies: 0
  - Criticality: 0 (Low - analytics)
- **Estimated Effort**: 1 day

### 35. Profile - Completion Router
- **File**: `packages/supabase/functions/trpc/routers/profile/completion.router.ts`
- **LOC**: 949
- **Estimated Endpoints**: 6
- **Complexity Score**: 4 (Moderate)
  - LOC: 2 (Medium)
  - Dependencies: 0
  - Criticality: 1 (Medium)
- **Estimated Effort**: 2 days

### 36. Profile - Import Router
- **File**: `packages/supabase/functions/trpc/routers/profile/import.router.ts`
- **LOC**: 558
- **Estimated Endpoints**: 5
- **Complexity Score**: 4 (Moderate)
  - LOC: 2 (Medium)
  - Dependencies: 1 (LinkedIn/resume parsing)
  - Criticality: 1 (Medium)
- **Estimated Effort**: 2 days

---

## P4 - Advanced/Specialized

### 37. Office Router ⚠️ VERY LARGE
- **File**: `packages/supabase/functions/trpc/routers/office.router.ts`
- **LOC**: 3,095
- **Estimated Endpoints**: 20
- **Complexity Score**: 7 (Very Complex)
  - LOC: 4 (Very Large)
  - Dependencies: 1
  - Criticality: 1 (Medium - specialized)
- **Estimated Effort**: 5 days
- **Notes**: University/office-specific features

### 38. Personality Assessment Router
- **File**: `packages/supabase/functions/trpc/routers/personality-assessment.router.ts`
- **LOC**: 1,385
- **Estimated Endpoints**: 10
- **Complexity Score**: 5 (Complex)
  - LOC: 2 (Medium)
  - Dependencies: 1 (Assessment scoring)
  - Criticality: 1 (Medium)
- **Estimated Effort**: 3 days

### 39-50. Additional P4 Routers
*(Full details similar to above)*

- Projects (645 LOC, ~8 endpoints)
- Portfolio (267 LOC, ~5 endpoints)
- Sites (241 LOC, ~5 endpoints)
- Addresses (318 LOC, ~6 endpoints)
- News (151 LOC, ~4 endpoints)
- O*NET (397 LOC, ~6 endpoints)
- Map (387 LOC, ~5 endpoints)
- Prerequisites (192 LOC, ~4 endpoints)
- Stripe Settings (285 LOC, ~5 endpoints)
- Success Fees (809 LOC, ~6 endpoints)

---

## P5 - Low Priority

### 51-58. Additional P5 Routers
*(Full details similar to above)*

- Workers (98 LOC, ~3 endpoints)
- Profile Widgets (269 LOC, ~4 endpoints)
- Vanity URLs (289 LOC, ~5 endpoints)
- Avatar (83 LOC, ~3 endpoints)
- Skills Multi-Taxonomy (354 LOC, ~6 endpoints)
- Profile Wizard (247 LOC, ~5 endpoints)

### Forsured-Specific Routers (Decision Pending)
- 17 routers in `apps/forsured-web/src/server/api/routers/`
- ~3,000 LOC total
- ~40 endpoints estimated
- **Decision**: Migrate to shared REST or keep as tRPC?

---

## Migration Effort Estimates

### By Priority

| Priority | Routers | Days (Optimistic) | Days (Realistic) | Days (Pessimistic) |
|----------|---------|-------------------|------------------|--------------------|
| P0 | 5 | 0 (done) | 5 (tests only) | 10 |
| P1 | 6 | 8 | 14 | 20 |
| P2 | 10 | 18 | 28 | 38 |
| P3 | 15 | 22 | 32 | 44 |
| P4 | 12 | 15 | 22 | 30 |
| P5 | 10+ | 10 | 14 | 20 |
| **TOTAL** | **58** | **73** | **115** | **162** |

**Working days per week**: 5
**Realistic timeline**: 115 days / 5 = **23 weeks** (close to planned 22 weeks)

---

## Router Dependencies

### High-Dependency Routers

**Organizations** →
- Employers
- Teams
- Stripe Settings
- Success Fees

**Auth** →
- User Profile
- All profile routers
- Notifications

**Background Checks** →
- Compliance Requirements
- ID Verification

**Jobs** →
- Applications
- Employers

### Migration Order Recommendation

1. **Auth** (P1) - Foundation for all user features
2. **User Profile** (P1) - Depends on Auth
3. **Profile sub-routers** (P1) - Depend on User Profile
4. **Notifications** (P1) - Independent, can parallelize
5. **Organizations** (P2) - Foundation for P2 features
6. **Teams, Employers** (P2) - Depend on Organizations
7. **Background Checks** (P2) - Complex, tackle mid-phase
8. **Remaining P2** - Based on business priority
9. **P3-P5** - Sequential by priority

---

## Notes & Considerations

1. **Large Routers**: 6 routers >3,000 LOC require extra time and testing
2. **Third-Party Integrations**: Stripe, background checks, ID verification need thorough testing
3. **Compliance-Critical**: CCPA, background checks, account deletion require legal review
4. **Forsured-Specific**: Decision needed on whether to migrate or keep tRPC
5. **Real-Time Features**: Notifications may benefit from WebSocket support in REST
6. **SDK Enhancements**: Complex routers may require specialized SDK methods

---

**Document Owner**: Migration Lead
**Review Cadence**: Weekly
**Last Reviewed**: 2025-12-31
