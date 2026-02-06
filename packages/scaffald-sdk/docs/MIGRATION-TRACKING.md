# tRPC to REST Migration Tracking

**Migration Start Date**: 2025-12-31
**Current Phase**: Phase 1 - Foundation Setup
**Last Updated**: 2025-12-31

---

## Progress Dashboard

**Overall Progress**: 5/58 routers (8.6%)
**Current Week**: Week 1 of 22
**Status**: 🟡 In Progress

### Phase Completion

| Phase | Status | Start Date | End Date | Progress |
|-------|--------|------------|----------|----------|
| Phase 0 - Existing REST | ✅ Complete | - | - | 5/5 routers |
| Phase 1 - Foundation | 🟡 In Progress | 2025-12-31 | - | 0% |
| Phase 2 - Testing Infrastructure | ⏳ Pending | - | - | 0% |
| Phase 3 - P1 Migration | ⏳ Pending | - | - | 0/6 routers |
| Phase 4 - Client Migration | ⏳ Pending | - | - | 0/3 clients |
| Phase 5 - P2 Migration | ⏳ Pending | - | - | 0/10 routers |
| Phase 6 - P3 Migration | ⏳ Pending | - | - | 0/15 routers |
| Phase 7 - P4 Migration | ⏳ Pending | - | - | 0/12 routers |
| Phase 8 - P5 Migration | ⏳ Pending | - | - | 0/10 routers |
| Phase 9 - tRPC Deprecation | ⏳ Pending | - | - | 0% |
| Phase 10 - Documentation | ⏳ Pending | - | - | 0% |

---

## Completion Metrics

### REST API Development
- **Endpoints Implemented**: 21/~400 (5.2%)
- **Routes with 100% Test Coverage**: 0/21 endpoints (0%) ⚠️ CRITICAL GAP
- **Integration Tests**: 0/21 endpoints (0%)
- **Performance Benchmarks**: 0/5 modules (0%)

### SDK Development
- **SDK Resource Modules**: 4/58 (6.9%)
- **React Hooks**: 4/58 modules (6.9%)
- **SDK Tests**: 1/58 modules (1.7%)
- **API Documentation**: 0/58 modules (0%)

### Client Migration
- **Scaffald App**: 0% migrated (⏳ Pending)
- **Expo/React Native**: 0% migrated (⏳ Pending)
- **Forsured Web**: 0% migrated (⏳ Pending)

### Code Cleanup
- **tRPC Routers Deprecated**: 0/58 (0%)
- **tRPC Code Deleted**: 0/58 (0%)

---

## Router Migration Status

### Legend
- ✅ **Complete**: REST endpoints + tests + SDK + client migration all done
- 🟢 **SDK Ready**: REST + tests done, SDK implemented, awaiting client migration
- 🟡 **Testing**: REST endpoints implemented, tests in progress
- 🔵 **Development**: REST endpoints in development
- ⏳ **Planned**: Not started yet
- 🔴 **Blocked**: Blocked by dependencies or issues

---

### P0 - Already Migrated (5 routers)

| Module | Router File | Endpoints | REST | Tests | SDK | Clients | Notes |
|--------|-------------|-----------|------|-------|-----|---------|-------|
| Jobs | (removed) | - | ✅ | 🔴 No tests | ✅ | ✅ SDK | packages/supabase/functions/api/routes/jobs.ts; tRPC removed, clients use @scaffald/sdk |
| Applications | applications.router.ts | 4 | ✅ | 🔴 No tests | ✅ | ⏳ | packages/supabase/functions/api/routes/applications.ts |
| Profiles | profile/general.router.ts | 3 | ✅ | 🔴 No tests | ✅ | ⏳ | packages/supabase/functions/api/routes/profiles.ts |
| OAuth | oauth.router.ts | 5 | ✅ | 🔴 No tests | ✅ | ⏳ | packages/supabase/functions/api/routes/oauth.ts |
| API Keys | (new feature) | 5 | ✅ | 🔴 No tests | ✅ | ⏳ | packages/supabase/functions/api/routes/api-keys.ts |

**P0 Status**: REST implementation complete, but **ZERO TESTS** - Phase 2 critical priority!

---

### P1 - Core Auth & User (6 routers, Est. 2 weeks)

| Module | Router File | LOC | Est. Endpoints | REST | Tests | SDK | Clients | Priority |
|--------|-------------|-----|----------------|------|-------|-----|---------|----------|
| Auth | auth.router.ts | 137 | ~5 | ⏳ | ⏳ | ⏳ | ⏳ | P1 - Critical |
| User Profile | user-profile.router.ts | 449 | ~6 | ⏳ | ⏳ | ⏳ | ⏳ | P1 - Critical |
| Employment | profile/employment.router.ts | 145 | ~8 | ⏳ | ⏳ | ⏳ | ⏳ | P1 - High |
| Skills | profile/skills.router.ts | 959 | ~12 | ⏳ | ⏳ | ⏳ | ⏳ | P1 - High (Complex!) |
| Education | profile/education.router.ts | 455 | ~8 | ⏳ | ⏳ | ⏳ | ⏳ | P1 - High |
| Notifications | notifications.router.ts | 470 | ~8 | ⏳ | ⏳ | ⏳ | ⏳ | P1 - High |

**P1 Total**: ~47 endpoints | 2,615 lines of tRPC code

---

### P2 - Job Discovery & Core Features (10 routers, Est. 4 weeks)

| Module | Router File | LOC | Est. Endpoints | REST | Tests | SDK | Clients | Priority |
|--------|-------------|-----|----------------|------|-------|-----|---------|----------|
| Organizations | organizations.router.ts | 2,368 | ~22 | ⏳ | ⏳ | ⏳ | ⏳ | P2 - High ⚠️ LARGE |
| Background Checks | background-checks.router.ts | 3,943 | ~18 | ⏳ | ⏳ | ⏳ | ⏳ | P2 - Critical ⚠️ LARGE |
| Work Logs | work-logs.router.ts | 4,743 | ~24 | ⏳ | ⏳ | ⏳ | ⏳ | P2 - High ⚠️ LARGE |
| Teams | teams.router.ts | 4,093 | ~20 | ⏳ | ⏳ | ⏳ | ⏳ | P2 - High ⚠️ LARGE |
| Employers | employers.router.ts | 496 | ~10 | ⏳ | ⏳ | ⏳ | ⏳ | P2 - Medium |
| Documents | documents.router.ts | 1,017 | ~12 | ⏳ | ⏳ | ⏳ | ⏳ | P2 - Medium |
| Resume | resume.router.ts | 1,486 | ~10 | ⏳ | ⏳ | ⏳ | ⏳ | P2 - Medium |
| Certifications | profile/certifications.router.ts | 1,204 | ~8 | ⏳ | ⏳ | ⏳ | ⏳ | P2 - Medium |
| Experience | profile/experience.router.ts | 339 | ~6 | ⏳ | ⏳ | ⏳ | ⏳ | P2 - Medium |
| Reviews | reviews.router.ts | 895 | ~8 | ⏳ | ⏳ | ⏳ | ⏳ | P2 - Medium |

**P2 Total**: ~138 endpoints | 20,584 lines of tRPC code

---

### P3 - Extended Features (15 routers, Est. 4 weeks)

| Module | Router File | LOC | Est. Endpoints | REST | Tests | SDK | Clients | Priority |
|--------|-------------|-----|----------------|------|-------|-----|---------|----------|
| Payments | payments.router.ts | 1,904 | ~12 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - High (Stripe) |
| CCPA | ccpa.router.ts | 2,542 | ~15 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - Critical (Legal) |
| Compliance Req. | compliance/requirements.router.ts | ~500 | ~8 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - High |
| Compliance Deps | compliance/dependencies.router.ts | ~400 | ~6 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - High |
| ID Verification | id-verification.router.ts | 791 | ~8 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - High |
| Legal Agreements | legal-agreements.router.ts | 511 | ~6 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - Medium |
| Account Deletion | account-deletion.router.ts | 665 | ~5 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - Medium |
| Inquiries | inquiries.router.ts | 2,519 | ~12 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - Medium ⚠️ LARGE |
| Connections | connections.router.ts | 563 | ~8 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - Low |
| Follows | follows.router.ts | 337 | ~6 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - Low |
| Feedback | feedback.router.ts | 306 | ~5 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - Low |
| Engagement | engagement.router.ts | 167 | ~4 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - Low |
| Profile Views | profileViews.router.ts | 400 | ~5 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - Low |
| Profile Completion | profile/completion.router.ts | 949 | ~6 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - Medium |
| Profile Import | profile/import.router.ts | 558 | ~5 | ⏳ | ⏳ | ⏳ | ⏳ | P3 - Medium |

**P3 Total**: ~111 endpoints | ~13,112 lines of tRPC code

---

### P4 - Advanced/Specialized (12 routers, Est. 3 weeks)

| Module | Router File | LOC | Est. Endpoints | REST | Tests | SDK | Clients | Priority |
|--------|-------------|-----|----------------|------|-------|-----|---------|----------|
| Office | office.router.ts | 3,095 | ~20 | ⏳ | ⏳ | ⏳ | ⏳ | P4 - Medium ⚠️ LARGE |
| Personality | personality-assessment.router.ts | 1,385 | ~10 | ⏳ | ⏳ | ⏳ | ⏳ | P4 - Medium |
| Projects | projects.router.ts | 645 | ~8 | ⏳ | ⏳ | ⏳ | ⏳ | P4 - Low |
| Portfolio | portfolio.router.ts | 267 | ~5 | ⏳ | ⏳ | ⏳ | ⏳ | P4 - Low |
| Sites | sites.router.ts | 241 | ~5 | ⏳ | ⏳ | ⏳ | ⏳ | P4 - Low |
| Addresses | addresses.router.ts | 318 | ~6 | ⏳ | ⏳ | ⏳ | ⏳ | P4 - Low |
| News | news.router.ts | 151 | ~4 | ⏳ | ⏳ | ⏳ | ⏳ | P4 - Low |
| O*NET | onet.router.ts | 397 | ~6 | ⏳ | ⏳ | ⏳ | ⏳ | P4 - Low |
| Map | map.router.ts | 387 | ~5 | ⏳ | ⏳ | ⏳ | ⏳ | P4 - Low |
| Prerequisites | prerequisites.router.ts | 192 | ~4 | ⏳ | ⏳ | ⏳ | ⏳ | P4 - Low |
| Stripe Settings | stripe-settings.router.ts | 285 | ~5 | ⏳ | ⏳ | ⏳ | ⏳ | P4 - Low |
| Success Fees | success-fees.router.ts | 809 | ~6 | ⏳ | ⏳ | ⏳ | ⏳ | P4 - Low |

**P4 Total**: ~84 endpoints | ~8,172 lines of tRPC code

---

### P5 - Low Priority (10+ routers, Est. 2 weeks)

| Module | Router File | LOC | Est. Endpoints | REST | Tests | SDK | Clients | Priority |
|--------|-------------|-----|----------------|------|-------|-----|---------|----------|
| Workers | workers.router.ts | 98 | ~3 | ⏳ | ⏳ | ⏳ | ⏳ | P5 - Low |
| Profile Widgets | profile/widgets.router.ts | 269 | ~4 | ⏳ | ⏳ | ⏳ | ⏳ | P5 - Low |
| Vanity URLs | profile/vanity.router.ts | 289 | ~5 | ⏳ | ⏳ | ⏳ | ⏳ | P5 - Low |
| Avatar | profile/avatar.router.ts | 83 | ~3 | ⏳ | ⏳ | ⏳ | ⏳ | P5 - Low |
| Skills Multi-Tax | profile/skills-multi-taxonomy.router.ts | 354 | ~6 | ⏳ | ⏳ | ⏳ | ⏳ | P5 - Low |
| Profile Wizard | profile/profileWizard.router.ts | 247 | ~5 | ⏳ | ⏳ | ⏳ | ⏳ | P5 - Low |
| Forsured (17 routers) | apps/forsured-web/src/server/api/routers/ | ~3,000 | ~40 | ⏳ | ⏳ | ⏳ | ⏳ | P5 - TBD (Reassess) |

**P5 Total**: ~66 endpoints | ~4,340 lines of tRPC code

---

## Performance Benchmarks

### REST vs tRPC Comparison

| Metric | tRPC Baseline | REST Current | Target | Status |
|--------|---------------|--------------|--------|--------|
| p50 Latency | TBD | TBD | ≤ tRPC | ⏳ Not measured |
| p95 Latency | TBD | TBD | ≤ tRPC | ⏳ Not measured |
| p99 Latency | TBD | TBD | ≤ tRPC | ⏳ Not measured |
| Throughput (req/s) | TBD | TBD | ≥ tRPC | ⏳ Not measured |
| Error Rate | TBD | TBD | <0.5% | ⏳ Not measured |
| SDK Bundle Size | ~150KB | ~80KB (est.) | <100KB | 🟢 On track |

**Note**: Performance benchmarks will be measured in Phase 2.

---

## Risks & Issues

### Active Blockers
*No active blockers at this time*

### High Risks
1. **Zero test coverage for existing REST endpoints** - Phase 2 priority ⚠️
2. **Large routers (4,000+ LOC)** - May require extra time (organizations, background-checks, work-logs, teams, office)
3. **Third-party integrations** - Stripe, O*NET need thorough testing
4. **Client migration complexity** - 3 apps with different architectures

### Mitigation Status
- ✅ Parallel systems strategy documented (ADR-002)
- ✅ 100% test coverage mandate documented (ADR-003)
- ⏳ Feature flag infrastructure (Phase 4)
- ⏳ Performance monitoring (Phase 2)

---

## Typing Strategy

- **REST**: Zod schemas in Hono routes; OpenAPI spec at `/openapi.json` (see `packages/supabase/functions/api/openapi.ts`).
- **SDK**: Types are hand-maintained in `packages/scaffald-sdk/src/types/` and resource files. Optional codegen from OpenAPI is documented in `packages/scaffald-sdk/docs/type-generation.md`.
- **When changing REST**: Sync SDK types manually or run `pnpm generate:types` from the SDK package (see type-generation.md). Checklist: after adding or changing a REST endpoint, update the corresponding SDK resource types and re-export in `src/index.ts` if needed.

---

## Team & Resources

### Team Assignments
*To be assigned*

### Support & Documentation
- **Migration Plan**: `/Users/clay/.claude/plans/transient-drifting-lollipop.md`
- **Migration Docs**: `packages/scaffald-sdk/docs/migration/`
- **ADRs**: `packages/scaffald-sdk/docs/migration/adr/`
- **API Docs**: `packages/scaffald-sdk/docs/api/`

---

## Next Actions

### Immediate (This Week)
- [ ] Complete Phase 1 documentation setup
- [ ] Review and approve router inventory
- [ ] Set up testing infrastructure (Phase 2 prep)

### This Month
- [ ] Complete Phase 2: 100% test coverage for existing 21 endpoints
- [ ] Start Phase 3: Begin P1 router migration (auth, profiles)

### This Quarter
- [ ] Complete Phases 3-4: P1 routers + client migration
- [ ] Start Phase 5: P2 router migration

---

## Change Log

| Date | Phase | Change | Updated By |
|------|-------|--------|------------|
| 2025-12-31 | Phase 1 | Initial migration tracking document created | Claude |
| 2025-12-31 | Phase 1 | Router inventory populated with 58 routers | Claude |

---

## Quick Links

- [Migration Strategy](migration/README.md)
- [Router Inventory](migration/router-inventory.md)
- [Testing Checklist](migration/testing-checklist.md)
- [Client Migration Guide](migration/client-migration-guide.md)
- [ADR Index](migration/adr/)
- [API Documentation](api/)

---

**Last sync with codebase**: 2025-12-31
**Next review date**: Weekly on Mondays
