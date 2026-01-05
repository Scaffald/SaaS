# tRPC to REST API Migration Strategy

**Version**: 1.0
**Last Updated**: 2025-12-31
**Status**: In Progress - Phase 1

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Migration Goals](#migration-goals)
3. [Architecture Overview](#architecture-overview)
4. [Migration Approach](#migration-approach)
5. [Timeline & Phases](#timeline--phases)
6. [Success Criteria](#success-criteria)
7. [Rollback Strategy](#rollback-strategy)
8. [Team & Communication](#team--communication)

---

## Executive Summary

This document outlines the strategy for migrating from tRPC to RESTful API across the UNI-Construct platform.

**Scope**:
- **58 tRPC routers** (~44,000 lines of code)
- **3 client applications** (Expo/React Native, Forsured Web, Scaffald)
- **~400 API endpoints** to be created
- **22-week timeline** (5.5 months)

**Strategy**: Parallel systems with gradual client migration, test-first approach, feature flag-based rollout.

**Current State** (as of 2025-12-31):
- ✅ 5 REST modules already implemented (21 endpoints)
- 🔴 Zero test coverage for existing REST endpoints
- ⏳ 53 routers remaining to migrate

---

## Migration Goals

### Primary Goals

1. **Modernize API Architecture**
   - Move from RPC-style to RESTful resource-based API
   - Improve API discoverability and standards compliance
   - Enable better caching and HTTP middleware

2. **Improve Developer Experience**
   - Provide official TypeScript SDK with React hooks
   - Auto-generate types from OpenAPI specifications
   - Simplify client-side API integration

3. **Enhance Performance**
   - Reduce bundle size (tRPC client ~150KB → REST SDK <100KB)
   - Enable better HTTP caching strategies
   - Optimize for mobile clients (Expo/React Native)

4. **Zero-Downtime Migration**
   - Run tRPC and REST in parallel during transition
   - Use feature flags for gradual rollout
   - Maintain instant rollback capability

### Secondary Goals

1. **Comprehensive Testing**
   - Achieve 100% test coverage for all REST endpoints
   - Create integration and E2E test suites
   - Establish performance benchmarking

2. **Documentation**
   - Generate OpenAPI 3.1 specifications
   - Create comprehensive SDK documentation
   - Provide migration guides for developers

3. **Monitoring & Observability**
   - Track API usage and performance metrics
   - Monitor error rates and user impact
   - Enable data-driven decision making

---

## Architecture Overview

### Current Architecture (tRPC)

```
┌─────────────────┐
│  Expo App       │
│  (React Native) │
└────────┬────────┘
         │
         │ tRPC Client
         │ (@trpc/react-query)
         ▼
┌─────────────────────────┐
│  Supabase Edge Function │
│  /functions/v1/trpc     │
│                         │
│  - 40+ routers          │
│  - Batching enabled     │
│  - SuperJSON transform  │
└─────────────────────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  (Supabase)     │
└─────────────────┘
```

**Challenges**:
- Custom tRPC client required
- Limited HTTP caching
- Larger bundle sizes
- Non-standard API patterns

### Target Architecture (REST + SDK)

```
┌─────────────────┐
│  Expo App       │
│  (React Native) │
└────────┬────────┘
         │
         │ @scaffald/sdk
         │ (REST client + React hooks)
         ▼
┌─────────────────────────┐
│  Supabase Edge Function │
│  /functions/v1/api      │
│                         │
│  - Hono framework       │
│  - OpenAPI/Swagger      │
│  - JWT + API key auth   │
│  - Rate limiting        │
└─────────────────────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  (Supabase)     │
└─────────────────┘
```

**Benefits**:
- Standard HTTP semantics
- Better caching (ETags, Cache-Control)
- Smaller bundle size
- OpenAPI documentation
- Easier third-party integration

### Hybrid Architecture (During Migration)

```
┌─────────────────┐
│  Client Apps    │
│                 │
│  Feature Flags  │
│  ┌───┬───┐      │
│  │REST│tRPC│     │
└──┴───┴───┴─────┘
    │    │
    │    └──────────┐
    │               │
    ▼               ▼
┌─────────┐   ┌──────────┐
│ REST API│   │ tRPC API │
└─────────┘   └──────────┘
    │               │
    └───────┬───────┘
            ▼
    ┌──────────────┐
    │  PostgreSQL  │
    └──────────────┘
```

**Key Points**:
- Both systems operational simultaneously
- Per-module feature flags route requests
- Instant rollback capability
- Gradual user migration (5% → 25% → 50% → 100%)

---

## Migration Approach

### Principles

1. **Test-First Development**
   - Write 100% test coverage BEFORE client migration
   - Integration tests for cross-endpoint flows
   - E2E tests for critical user journeys
   - Performance benchmarks at every phase

2. **Parallel Systems**
   - Keep tRPC operational throughout migration
   - Feature flags control routing per module
   - No hard cutover until fully verified

3. **Incremental Migration**
   - Migrate by priority (P0 → P1 → P2 → P3 → P4 → P5)
   - Start with simple routers, build to complex
   - Learn from each phase, improve process

4. **Safety & Monitoring**
   - Canary deployments for each module
   - Real-time error tracking and alerting
   - Performance monitoring (latency, throughput)
   - User metrics (engagement, conversion)

### Process Per Router

```
Step 1: Design REST Endpoints
  ↓
Step 2: Implement REST Route (Hono)
  ↓
Step 3: Write Unit Tests (100% coverage)
  ↓
Step 4: Write Integration Tests
  ↓
Step 5: Create SDK Resource Module
  ↓
Step 6: Create React Hooks
  ↓
Step 7: Write SDK Tests (MSW mocks)
  ↓
Step 8: Generate TypeScript Types (OpenAPI)
  ↓
Step 9: Write API Documentation
  ↓
Step 10: Performance Benchmark vs tRPC
  ↓
Step 11: Deploy to Staging
  ↓
Step 12: Run E2E Tests
  ↓
Step 13: Enable Feature Flag (5% users)
  ↓
Step 14: Monitor & Gradual Rollout
  ↓
Step 15: 100% Migration Complete
  ↓
Step 16: (After 2 weeks) Consider tRPC Deprecation
```

---

## Timeline & Phases

### Overview (22 Weeks)

| Phase | Duration | Focus | Deliverables |
|-------|----------|-------|--------------|
| **Phase 1** | Week 1 | Foundation | Documentation, inventory, ADRs |
| **Phase 2** | Week 2 | Testing | 100% coverage for existing 21 endpoints |
| **Phase 3** | Weeks 3-4 | P1 Migration | 6 routers (~50 endpoints) |
| **Phase 4** | Weeks 5-6 | Client Migration | All 3 apps for P1 modules |
| **Phase 5** | Weeks 7-10 | P2 Migration | 10 routers (~120 endpoints) |
| **Phase 6** | Weeks 11-14 | P3 Migration | 15 routers (~100 endpoints) |
| **Phase 7** | Weeks 15-17 | P4 Migration | 12 routers (~80 endpoints) |
| **Phase 8** | Weeks 18-20 | P5 Migration | 10 routers (~50 endpoints) |
| **Phase 9** | Weeks 21-22 | Deprecation | tRPC cleanup |
| **Phase 10** | Week 23 | Documentation | Final docs, training |

### Detailed Phase Breakdown

See [Migration Plan](/Users/clay/.claude/plans/transient-drifting-lollipop.md) for detailed phase descriptions.

### Router Prioritization

See [Router Inventory](router-inventory.md) for complete list with complexity scores.

**Priority Levels**:
- **P0** (5 routers): Already migrated - needs tests ⚠️
- **P1** (6 routers): Core auth & user features - critical path
- **P2** (10 routers): Job discovery & core features - high traffic
- **P3** (15 routers): Extended features - payments, compliance, social
- **P4** (12 routers): Advanced/specialized - lower traffic
- **P5** (10 routers): Low priority - optional/legacy

---

## Success Criteria

### Technical Metrics

**Test Coverage**:
- ✅ 100% statement, branch, function, line coverage for all REST endpoints
- ✅ Integration tests for all cross-endpoint flows
- ✅ E2E tests for critical user journeys

**Performance**:
- ✅ REST p95 latency ≤ tRPC p95 latency
- ✅ REST throughput ≥ tRPC throughput
- ✅ SDK bundle size <100KB gzipped
- ✅ Error rate <0.5% across all endpoints

**API Quality**:
- ✅ OpenAPI 3.1 specification complete
- ✅ All endpoints documented with examples
- ✅ Consistent error responses
- ✅ Proper HTTP status codes and headers

### Business Metrics

**User Impact**:
- ✅ Zero increase in app crash rate
- ✅ User engagement stable or improved
- ✅ Conversion rates maintained
- ✅ Customer satisfaction scores maintained

**Developer Experience**:
- ✅ SDK adoption >90% in new code
- ✅ Developer satisfaction survey >4/5
- ✅ API documentation rated "helpful" >80%

**Process Metrics**:
- ✅ Migration velocity on schedule (±1 week)
- ✅ Bug escape rate <5 bugs per phase
- ✅ Rollback events <3 during entire migration
- ✅ PR review time <2 days

### Gate Criteria

**Phase 2 → Phase 3**:
- [ ] 100% test coverage for all 21 existing REST endpoints
- [ ] CI/CD enforcing coverage requirements
- [ ] Performance baseline established

**Phase 3 → Phase 4**:
- [ ] All 6 P1 REST modules with 100% tests
- [ ] All 6 SDK modules complete with React hooks
- [ ] Performance benchmarks meet targets

**Phase 4 → Phase 5**:
- [ ] All 3 clients successfully migrated for P1
- [ ] Zero increase in production errors
- [ ] Performance maintained or improved

**Phase 9 (tRPC Deprecation)**:
- [ ] ALL clients 100% migrated
- [ ] tRPC usage <0.1% of traffic
- [ ] 2+ weeks stable with REST only
- [ ] Zero production errors
- [ ] Team consensus on deletion

---

## Rollback Strategy

### Feature Flag Rollback (Instant)

**Trigger**: Error rate spike, performance degradation, critical bugs

**Action**:
```typescript
// In feature flags config
FEATURE_FLAGS.USE_REST_API.auth = false  // Rollback auth to tRPC
```

**Recovery Time**: <5 minutes

**Impact**: Users transparently switched back to tRPC

### Deployment Rollback (Fast)

**Trigger**: Edge function deployment issues, database migration problems

**Action**:
```bash
# Revert to previous Supabase deployment
supabase functions deploy api --revert
```

**Recovery Time**: <15 minutes

### Full Rollback (Emergency)

**Trigger**: Catastrophic failure, data consistency issues

**Action**:
1. Disable all REST feature flags
2. Revert edge function deployments
3. Rollback database migrations (if any)
4. Communicate to users

**Recovery Time**: <30 minutes

**Post-Mortem**: Required for all full rollbacks

### Rollback Testing

**Requirements**:
- Test rollback procedures in staging every phase
- Document rollback steps in runbook
- Practice rollback drills quarterly
- Monitor rollback metrics (time, success rate)

---

## Team & Communication

### Roles & Responsibilities

**Migration Lead**: *TBD*
- Overall migration coordination
- Phase gate approvals
- Risk management

**Backend Engineers**: *TBD*
- REST endpoint implementation
- Database migrations
- Performance optimization

**Frontend Engineers**: *TBD*
- SDK development
- Client migration
- E2E testing

**QA Engineers**: *TBD*
- Test strategy
- Integration testing
- E2E test automation

**DevOps**: *TBD*
- CI/CD pipeline
- Deployment automation
- Monitoring setup

### Communication Plan

**Weekly Sync** (Mondays):
- Phase progress review
- Blocker discussion
- Next week planning

**Status Updates**:
- Update MIGRATION-TRACKING.md daily
- Slack updates on major milestones
- Email summary every Friday

**Decision Log**:
- Document all major decisions in ADRs
- Link to ADRs in pull requests
- Review ADRs quarterly

**Escalation Path**:
1. Team discussion (Slack)
2. Weekly sync meeting
3. Migration Lead decision
4. CTO escalation (if needed)

---

## Risk Management

See [MIGRATION-TRACKING.md](../MIGRATION-TRACKING.md#risks--issues) for live risk tracking.

### Top Risks

1. **Incomplete Testing** (High)
   - **Impact**: Production bugs, user impact
   - **Mitigation**: 100% coverage mandate, CI/CD enforcement
   - **Status**: In progress (Phase 2)

2. **Performance Regression** (High)
   - **Impact**: Slower API, poor user experience
   - **Mitigation**: Benchmarks at every phase, monitoring
   - **Status**: Monitoring setup in Phase 2

3. **Complex Router Migration Errors** (Medium)
   - **Impact**: Delays, bugs in large routers
   - **Mitigation**: Start simple, build to complex
   - **Status**: P1 routers are simpler

4. **Client Migration Breaking Changes** (High)
   - **Impact**: App crashes, user complaints
   - **Mitigation**: Feature flags, gradual rollout, E2E tests
   - **Status**: Infrastructure in Phase 4

5. **Team Bandwidth** (Medium)
   - **Impact**: Timeline delays
   - **Mitigation**: Clear phases, realistic estimates
   - **Status**: To be assessed

---

## Related Documentation

- [Migration Tracking](../MIGRATION-TRACKING.md) - Live progress dashboard
- [Router Inventory](router-inventory.md) - All 58 routers with details
- [Testing Checklist](testing-checklist.md) - Test requirements
- [Client Migration Guide](client-migration-guide.md) - Step-by-step client migration
- [ADR Index](adr/) - Architecture decision records
- [API Documentation](../api/) - Per-module API docs

---

## Appendices

### A. Technology Stack

**REST API**:
- Runtime: Deno
- Framework: Hono v4.0.2
- Validation: Zod with @hono/zod-openapi
- Database: Supabase (PostgreSQL)
- Auth: JWT tokens + API keys

**SDK**:
- Language: TypeScript
- Build: tsup
- Testing: Vitest + MSW
- React: React Query for data fetching

**Client Apps**:
- Expo/React Native: Metro bundler
- Forsured Web: Next.js
- Scaffald: Remix

### B. File Locations

**REST API**: `packages/supabase/functions/api/`
**tRPC**: `packages/supabase/functions/trpc/`
**SDK**: `packages/scaffald-sdk/`
**Expo App**: `packages/scf-core/`
**Forsured Web**: `apps/forsured-web/`
**Scaffald**: `apps/scaffald/`

### C. Glossary

- **ADR**: Architecture Decision Record
- **E2E**: End-to-End testing
- **LOC**: Lines of Code
- **MSW**: Mock Service Worker (testing library)
- **P0-P5**: Priority levels for router migration
- **RLS**: Row Level Security (Supabase)
- **tRPC**: TypeScript Remote Procedure Call

---

**Document Owner**: Migration Lead
**Review Cadence**: Weekly
**Last Reviewed**: 2025-12-31
