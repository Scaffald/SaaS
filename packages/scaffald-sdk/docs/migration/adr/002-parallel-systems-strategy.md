# ADR-002: Parallel Systems Strategy

**Status**: Accepted
**Date**: 2025-12-31
**Decision Makers**: Backend Team, DevOps Team, Product Team
**Consulted**: Frontend Team, QA Team

---

## Context

We are migrating from tRPC to RESTful API across 58 routers (~400 endpoints). Scaffald is the supported client app; Forsured Web is deprecated/archived.

**Challenges**:
1. **Zero Downtime**: Cannot afford service interruption
2. **Risk Management**: Need ability to rollback instantly
3. **Large User Base**: Expo app has the most users
4. **Uncertain Performance**: Don't know if REST will match tRPC performance
5. **Complex Migration**: ~400 endpoints across multiple domains

**Question**: Should we migrate all at once (big bang) or gradually (parallel systems)?

---

## Decision

We will adopt a **Parallel Systems Strategy** where both tRPC and REST APIs run simultaneously during the migration period.

### Core Principles

1. **Both Systems Operational**: tRPC and REST APIs run concurrently
2. **Feature Flag Routing**: Per-module flags route requests to REST or tRPC
3. **Gradual User Migration**: 5% → 25% → 50% → 100% rollout
4. **Instant Rollback**: Flip feature flag to revert to tRPC
5. **Independent Deletion**: Only delete tRPC after 2+ weeks of stable REST-only operation

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────┐
│         Client Applications         │
│  (Expo, Scaffald, Forsured Web)    │
└────────────────┬────────────────────┘
                 │
                 │ Hybrid API Client
                 │ (Feature Flag Router)
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
┌──────────────┐    ┌──────────────┐
│  REST API    │    │  tRPC API    │
│  /v1/*       │    │  (existing)  │
│              │    │              │
│ - Hono       │    │ - 58 routers │
│ - New code   │    │ - Proven     │
└──────┬───────┘    └──────┬───────┘
       │                   │
       └─────────┬─────────┘
                 ▼
        ┌────────────────┐
        │  PostgreSQL    │
        │  (Supabase)    │
        └────────────────┘
```

### Feature Flag Routing

**Implementation**:
```typescript
// Feature flags configuration
const FEATURE_FLAGS = {
  USE_REST_API: {
    auth: false,      // false = tRPC, true = REST
    profile: false,
    jobs: false,
    applications: false,
    // ... more modules
  }
}

// Client-side routing
const api = useFeatureFlag('auth')
  ? restClient.auth        // Route to REST
  : trpcClient.auth        // Route to tRPC
```

**Granularity**:
- Per-module flags (auth, profile, jobs, etc.)
- NOT per-endpoint (too granular)
- Master kill switch to disable all REST

---

## Migration Phases

### Phase 1: Module Migration (Sequential)

**Order**: P0 → P1 → P2 → P3 → P4 → P5 (see Router Inventory)

**Per Module**:
1. Implement REST endpoints
2. Achieve 100% test coverage
3. Performance benchmark vs tRPC
4. Deploy to staging
5. Enable flag for internal testing (0% users)

### Phase 2: Gradual Rollout (Per Module)

**Week 1: Canary (5%)**:
```typescript
// Remote config (Firebase/LaunchDarkly)
if (userId % 20 === 0) {
  enableRESTForUser('auth', userId)
}
```

**Monitoring**:
- Error rate (REST vs tRPC)
- Latency (p50, p95, p99)
- Crash reports
- User engagement

**Rollback Criteria**:
- Error rate >1% higher than tRPC
- p95 latency >50ms higher
- Crash rate increase >10%

**Week 2: 25%**:
```typescript
if (userId % 4 === 0) {
  enableRESTForUser('auth', userId)
}
```

**Week 3: 50%**:
```typescript
if (userId % 2 === 0) {
  enableRESTForUser('auth', userId)
}
```

**Week 4: 100%**:
```typescript
enableRESTForAllUsers('auth')
```

### Phase 3: Stabilization (2+ weeks)

**Observe**:
- 100% of users on REST for module
- Error rates stable
- Performance acceptable
- No user complaints

**Criteria for tRPC Deprecation**:
- ALL modules 100% migrated
- 2+ weeks stable REST-only
- Performance metrics acceptable
- Team consensus

### Phase 4: tRPC Deprecation

**Week 1: Mark Deprecated**:
- Add deprecation headers: `X-API-Deprecated: true`
- Add console warnings in tRPC client
- Monitor for unexpected tRPC usage

**Week 2: Delete tRPC Code**:
- Delete tRPC routers
- Delete tRPC middleware
- Delete tRPC client imports
- Update documentation

---

## Implementation Details

### Client-Side: Hybrid API Client

**Expo/React Native**:
```typescript
// packages/scf-core/utils/api-hybrid.ts
class HybridAPIClient {
  private rest: Scaffald
  private trpc: typeof trpcClient

  get auth() {
    return useFeatureFlag('auth') ? this.rest.auth : this.trpc.auth
  }
}

export const api = new HybridAPIClient()
```

**Scaffald/Forsured Web**:
```typescript
// Similar hybrid client pattern
export class APIClient {
  route(module, restFn, trpcFn) {
    return useFeatureFlag(module) ? restFn() : trpcFn()
  }
}
```

### Server-Side: Dual Deployment

**Both APIs deployed**:
```
/functions/v1/trpc    # Existing tRPC edge function
/functions/v1/api     # New REST edge function
```

**Independent Scaling**:
- Both can scale independently
- Load balancer routes based on path
- No shared state (except database)

### Feature Flag Infrastructure

**Storage**:
- **Local**: `config/feature-flags.ts` (for development)
- **Remote**: Firebase Remote Config or LaunchDarkly (for production)

**Evaluation**:
```typescript
// Evaluated per-request on client
function useFeatureFlag(module: string): boolean {
  // 1. Check remote config (if available)
  const remote = await remoteConfig.get(`rest_api_${module}`)
  if (remote !== undefined) return remote

  // 2. Fall back to local config
  return FEATURE_FLAGS.USE_REST_API[module]
}
```

**User Targeting**:
```typescript
// Percentage rollout
if (hash(userId) % 100 < rolloutPercentage) {
  return true // Use REST
}

// A/B testing
if (experimentBucket === 'rest_api_experiment') {
  return true
}

// Internal users always get latest
if (isInternalUser(userId)) {
  return true
}
```

---

## Rollback Procedures

### Instant Rollback (Feature Flag)

**Scenario**: Error rate spike, performance issue

**Action**:
```typescript
// Remote config update (takes effect immediately)
setFeatureFlag('auth', false)  // Switch back to tRPC
```

**Recovery Time**: <5 minutes

**Impact**: Users transparently switched to tRPC

### Deployment Rollback (Fast)

**Scenario**: REST edge function deployment failure

**Action**:
```bash
# Revert Supabase edge function deployment
supabase functions deploy api --revert
```

**Recovery Time**: <15 minutes

### Full Rollback (Emergency)

**Scenario**: Data corruption, security issue

**Action**:
1. Disable all REST feature flags
2. Revert edge function deployment
3. Rollback database migrations (if any)
4. Communicate incident to users

**Recovery Time**: <30 minutes

**Post-Mortem**: Required for all full rollbacks

---

## Monitoring & Observability

### Metrics to Track

**Error Rates**:
```
rest_api_error_rate (by module, endpoint)
trpc_api_error_rate (by router, procedure)
error_rate_diff = rest - trpc  // Alert if >1%
```

**Latency**:
```
rest_api_latency_p50, p95, p99 (by endpoint)
trpc_api_latency_p50, p95, p99 (by procedure)
latency_diff_p95 = rest - trpc  // Alert if >50ms
```

**Traffic**:
```
rest_api_requests_total (by module)
trpc_api_requests_total (by router)
rest_adoption_percentage = rest / (rest + trpc)
```

**User Impact**:
```
app_crash_rate
user_engagement_metrics
conversion_rates
```

### Alerts

**Critical**:
- REST error rate >5%
- REST p95 latency >1000ms
- Crash rate increase >20%

**Warning**:
- REST error rate >1% higher than tRPC
- REST p95 latency >50ms higher than tRPC
- Unexpected tRPC usage after full migration

### Dashboards

**Grafana/DataDog**:
- REST vs tRPC comparison dashboard
- Per-module adoption dashboard
- Error rates and latency trends
- User impact metrics

---

## Cost Considerations

### Additional Costs

**Dual Infrastructure**:
- 2x edge function deployments (tRPC + REST)
- Additional database queries (both systems running)
- Monitoring and logging costs

**Estimated Cost Increase**: 20-30% during migration period

**Cost Savings Post-Migration**:
- Smaller bundle sizes (SDK < tRPC client)
- Better caching (reduced server requests)
- Simpler infrastructure (REST only)

**Estimated Savings**: 10-15% after tRPC deletion

### Infrastructure Timeline

```
Current:  [=== tRPC ===]
Month 1:  [=== tRPC ===][== REST ==]  (30% increase)
Month 2:  [=== tRPC ===][====== REST ======]  (40% increase)
Month 3:  [== tRPC ==][========== REST ==========]  (30% increase)
Month 4:  [= tRPC =][============ REST ============]  (20% increase)
Month 5:  [============= REST =============]  (Back to baseline)
Month 6:  [========= REST =========]  (15% reduction via caching)
```

---

## Alternatives Considered

### Alternative 1: Big Bang Migration

**Description**: Migrate all endpoints and clients at once

**Pros**:
- Faster timeline (weeks instead of months)
- No dual infrastructure costs
- Simpler codebase (no feature flags)

**Cons**:
- **High Risk**: All users affected if issues arise
- **No Rollback**: Can't revert easily
- **Difficult Testing**: Hard to test all 400 endpoints thoroughly
- **User Impact**: Any bugs affect 100% of users

**Why Rejected**: Too risky for user-facing application

### Alternative 2: Shadow Mode

**Description**: Run REST in "shadow mode" (log results but don't return to users)

**Pros**:
- Test REST without user impact
- Compare results with tRPC

**Cons**:
- Doubles infrastructure load (both APIs called)
- Doesn't test client integration
- Delays actual migration

**Why Rejected**: Inefficient, doesn't test real user flows

### Alternative 3: Service-by-Service Migration

**Description**: Migrate entire client apps sequentially (Scaffald → Expo → Forsured)

**Pros**:
- Clear boundaries (one app at a time)
- Easier to isolate issues

**Cons**:
- Longer timeline (apps must wait for previous to complete)
- All users of an app affected simultaneously
- Less flexibility in rollback

**Why Rejected**: Module-based migration more granular and safer

---

## Consequences

### Positive

- **Zero Downtime**: Users unaffected during migration
- **Risk Mitigation**: Instant rollback via feature flags
- **Gradual Validation**: Test with 5% before 100%
- **Data-Driven**: Metrics guide migration decisions
- **Confidence**: 2-week stabilization before tRPC deletion

### Negative

- **Infrastructure Costs**: 20-40% increase during migration
- **Code Complexity**: Feature flags add code branches
- **Longer Timeline**: 22 weeks vs big bang (4-6 weeks)
- **Dual Maintenance**: Must support both systems temporarily

### Neutral

- **Team Learning**: Parallel systems require coordination
- **Monitoring Overhead**: Must track both systems
- **Testing Complexity**: E2E tests must cover both paths

---

## Success Criteria

**Migration Successful If**:
- ✅ All 58 routers migrated to REST
- ✅ All 3 client apps using REST
- ✅ 100% of users on REST for 2+ weeks
- ✅ Error rate ≤ tRPC baseline
- ✅ Performance ≥ tRPC baseline
- ✅ Zero rollback events (or <3 total)
- ✅ User metrics stable or improved
- ✅ tRPC code safely deleted

---

## References

- [Feature Toggles (Martin Fowler)](https://martinfowler.com/articles/feature-toggles.html)
- [Strangler Fig Pattern (Martin Fowler)](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Blue-Green Deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)

---

## Amendments

*None yet*

---

**Document Owner**: Migration Lead
**Review Cadence**: Monthly during migration, Quarterly after completion
**Last Reviewed**: 2025-12-31
**Next Review**: 2026-01-31
