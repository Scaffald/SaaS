# Worker-flow status matrix

> **SC-22 deliverable.** Master input for mobile MVP implementation prioritization.  
> **Generated:** 2026-06-10 · refresh raw tables via [`generate-status-matrix.mjs`](generate-status-matrix.mjs)

---

## TL;DR

The four worker-flow audits (SC-18, SC-19, SC-20, SC-21) plus the v1.7.0
profile-API repair pass produced **35 fix tickets** between 2026-05-26 and
2026-06-09. **All 35 have shipped to TestFlight**; three were closed Done
on the web side before they ever needed mobile QA. **Zero are still
upstream of TestFlight.**

The signal this gives mobile work is **"the API surface is now real"** —
the per-flow REST endpoints exist, return the right shapes, and handle
errors. What's *not yet signal* is whether they hold up under mobile QA on
the v1.9.0 TestFlight build — that validation is still in flight.

**For v1.10.0 planning:** stop chasing API bugs in these four flows. They've
been audit-swept. New scope should be (a) mobile screen builds against the
now-stable APIs, and (b) the next audit pass for any flow we *haven't*
covered yet (notifications, employer admin, search/discovery, payments).

---

## Status legend

| State | Meaning |
|---|---|
| **In Github** | PR merged to main. Code is there but no TF build has carried it through QA. *(Empty at the time of this audit — we just flushed the 33-ticket backlog.)* |
| **In TestFlight** | TF build containing the fix exists. QA can validate. **Most v1.7.0/v1.8.0/v1.9.0 tickets are here right now** — this is the QA queue. |
| **Done** | QA validated against TF. Safe to consider production-ready. |

When a row below says **In TestFlight**, the code shipped but a human hasn't
hit the path in the app yet. Treat as "merged, unvalidated."

---

## 1. Create job post (employer/admin) — SC-18

**Parent:** [SC-18](https://linear.app/scaffald/issue/SC-18) (Done) · **6 fix tickets, all In TestFlight**

| Ticket | Pri | State | Version | Ship | What it fixed |
|---|---|---|---|---|---|
| SC-120 | P2 | In TestFlight | v1.8.0 | [#329](https://github.com/Scaffald/UNI-Construct/pull/329) | PATCH /office-jobs allowed cross-org reassignment (privilege escalation) |
| SC-121 | P2 | In TestFlight | v1.9.0 | [#336](https://github.com/Scaffald/UNI-Construct/pull/336) | JobForm now surfaces `employment_type`, `remote_option`, `pay_range` |
| SC-122 | P3 | In TestFlight | v1.8.0 | [#334](https://github.com/Scaffald/UNI-Construct/pull/334) | Title/description length constraints now match REST + shared schemas |
| SC-123 | P3 | In TestFlight | v1.9.0 | [#334](https://github.com/Scaffald/UNI-Construct/pull/334) | "Save as draft" disable logic mirrors server validation |
| SC-124 | P3 | In TestFlight | v1.9.0 | [#336](https://github.com/Scaffald/UNI-Construct/pull/336) | JobForm submit uses typed `OfficeCreateJobParams` |
| SC-125 | P4 | In TestFlight | v1.8.0 | [#329](https://github.com/Scaffald/UNI-Construct/pull/329) | Debug `console.log` on location selection removed |

**Confirmed working in code** ([packages/supabase/functions/api/routes/office-jobs.ts](../../../packages/supabase/functions/api/routes/office-jobs.ts), [packages/sdk/src/resources/office-jobs.ts](../../../packages/sdk/src/resources/office-jobs.ts)):
- Owner check on PATCH route (org membership verified before reassignment)
- `OfficeCreateJobParams` exported with all enum fields
- Length constraints unified in `packages/supabase/_shared/schemas/`

**Mobile implications:** Per SC-34 design scope, "Create job" moves under
business context only on mobile (not in worker nav). So mobile-MVP work
here is **read-only** on the worker side. Job-creation UI is employer/admin
flow and doesn't need to be in v1.10/11 mobile builds. The API hardening
above remains useful for the web admin path.

---

## 2. Apply to job (worker) — SC-19

**Parent:** [SC-19](https://linear.app/scaffald/issue/SC-19) (Done) · **10 fix tickets — 9 In TestFlight, 1 Done**

| Ticket | Pri | State | Version | Ship | What it fixed |
|---|---|---|---|---|---|
| SC-100 | P2 | In TestFlight | v1.8.0 | [#328](https://github.com/Scaffald/UNI-Construct/pull/328) | POST /v1/applications no longer wraps response in `{ data }` |
| SC-101 | P2 | In TestFlight | v1.8.0 | [#328](https://github.com/Scaffald/UNI-Construct/pull/328) | upload-url, confirm-upload, GET/POST messages routes ported to REST |
| SC-102 | P2 | Done | — | [#328](https://github.com/Scaffald/UNI-Construct/pull/328) | QuickApplyModal can retry on submit failure |
| SC-103 | P2 | In TestFlight | v1.9.0 | [#335](https://github.com/Scaffald/UNI-Construct/pull/335) | ApplicationWizard reads `job.custom_application_questions` |
| SC-104 | P3 | In TestFlight | v1.9.0 | [#335](https://github.com/Scaffald/UNI-Construct/pull/335) | `getMyForJob()` distinguishes "no app" from "API down" |
| SC-105 | P3 | In TestFlight | v1.8.0 | [#329](https://github.com/Scaffald/UNI-Construct/pull/329) | ApplicationWizard halts on save failure (no silent data loss) |
| SC-106 | P3 | In TestFlight | v1.9.0 | [#335](https://github.com/Scaffald/UNI-Construct/pull/335) | HTTP client retries POST when `idempotencyKey` is set |
| SC-107 | P3 | In TestFlight | v1.9.0 | [#333](https://github.com/Scaffald/UNI-Construct/pull/333) | Exhaustive `STATUS_DB_TO_API` mapping |
| SC-108 | P4 | In TestFlight | v1.9.0 | [#333](https://github.com/Scaffald/UNI-Construct/pull/333) | Structured webhook delivery logging |
| SC-109 | P4 | In TestFlight | v1.9.0 | [#335](https://github.com/Scaffald/UNI-Construct/pull/335) | `applications.create` attaches per-call idempotency key |

**Confirmed working in code** ([packages/supabase/functions/api/routes/applications.ts](../../../packages/supabase/functions/api/routes/applications.ts)):
- `/upload-url` (line 1146), `/confirm-upload` (1228), `/:id/messages` GET (1318) + POST (1447) all present
- Exhaustive status map shipped in [#333](https://github.com/Scaffald/UNI-Construct/pull/333)
- `getMyForJob` non-404 error propagation in [packages/sdk/src/resources/applications.ts](../../../packages/sdk/src/resources/applications.ts)

**Mobile implications:** **This is the unblocked flow for mobile MVP.**
[SC-34](https://linear.app/scaffald/issue/SC-34) (Jobs screen design) targets
the worker browse-and-apply path; the API surface that backs it is now
complete. v1.10.0 design for SC-34 + v1.11.0 implementation can proceed
without waiting on more API repair. *Caveat:* idempotency-key retry
behavior (SC-106 + SC-109) is the highest-risk change in this set — worth
explicit mobile QA on flaky-network conditions before declaring "Done."

---

## 3. Profile / onboarding (worker) — SC-20

**Parent:** [SC-20](https://linear.app/scaffald/issue/SC-20) (Done) · **4 fix tickets, all In TestFlight**

| Ticket | Pri | State | Version | Ship | What it fixed |
|---|---|---|---|---|---|
| SC-110 | P2 | In TestFlight | v1.8.0 | [#327](https://github.com/Scaffald/UNI-Construct/pull/327) | Onboarding ToS / Privacy Policy now has UI gate |
| SC-111 | P3 | In TestFlight | v1.8.0 | [#327](https://github.com/Scaffald/UNI-Construct/pull/327) | Industries lookup surfaces real error state instead of "No industries available" |
| SC-112 | P3 | In TestFlight | v1.9.0 | [#334](https://github.com/Scaffald/UNI-Construct/pull/334) | onSubmit error path renders a user-visible toast |
| SC-113 | P4 | In TestFlight | v1.9.0 | [#335](https://github.com/Scaffald/UNI-Construct/pull/335) | `CompletePrerequisitesParams` declares legal-acceptance fields |

**Confirmed working in code** ([packages/sdk/src/resources/profiles.ts](../../../packages/sdk/src/resources/profiles.ts), [packages/supabase/functions/api/routes/industries.ts](../../../packages/supabase/functions/api/routes/industries.ts)):
- SDK `CompletePrerequisitesParams` includes ToS / PP fields (no silent strip)
- Industries endpoint distinguishes "empty result" from "fetch error"

**Mobile implications:** Onboarding flow is **API-ready for the mobile
profile-strength widget** ([SC-33](https://linear.app/scaffald/issue/SC-33)).
The legal-acceptance gap was a real compliance risk — important that it
shipped before any MAVA demo. Validate the mobile-side surface uses the
same SDK fields (don't reintroduce silent strip from RHF).

---

## 4. Certifications & licenses (worker) — SC-21

**Parent:** [SC-21](https://linear.app/scaffald/issue/SC-21) (Done) · **6 fix tickets — 4 In TestFlight, 2 Done**

| Ticket | Pri | State | Version | Ship | What it fixed |
|---|---|---|---|---|---|
| SC-114 | P2 | In TestFlight | v1.8.0 | [#326](https://github.com/Scaffald/UNI-Construct/pull/326) | 8 cert mutation routes ported to REST (no more 404s) |
| SC-115 | P2 | In TestFlight | v1.8.0 | [#326](https://github.com/Scaffald/UNI-Construct/pull/326) | `removeCert` sends parent_id, not cert_id |
| SC-116 | P2 | Done | — | [#326](https://github.com/Scaffald/UNI-Construct/pull/326) | Sync state no longer stuck "syncing" on custom-cert save error |
| SC-117 | P2 | In TestFlight | v1.8.0 | [#326](https://github.com/Scaffald/UNI-Construct/pull/326) | Proof update handlers surface errors via toast |
| SC-118 | P3 | In TestFlight | v1.8.0 | [#326](https://github.com/Scaffald/UNI-Construct/pull/326) | CertificationProofCard upload/save errors surfaced |
| SC-119 | P3 | Done | — | [#326](https://github.com/Scaffald/UNI-Construct/pull/326) | Cert toggle mutation handles 404 instead of silent failure |

**Confirmed working in code** ([packages/supabase/functions/api/routes/certifications.ts](../../../packages/supabase/functions/api/routes/certifications.ts)):
17 endpoints present across top-level/children/tree GETs and add /
add-category / toggle-specific / remove-top-level / update-proof / save /
upload-file / delete-file / delete mutations. Surface matches the UI's
expectations.

**Mobile implications:** Cert flow is **API-ready** but mobile UI for cert
add/proof/upload is not yet scoped (no design ticket). Treat as a
v1.11.0+ candidate after SC-33/SC-34 designs land.

---

## 5. Profile API surface (REST migration repair) — v1.7.0 sweep

**No parent ticket** — this was a discovery pass on a different shape of bug
(REST migration left the profile namespace half-broken). **9 fixes, all
In TestFlight from v1.7.0.**

| Ticket | Pri | State | Version | Ship | What it fixed |
|---|---|---|---|---|---|
| SC-90 | P1 | In TestFlight | v1.7.0 | [#315](https://github.com/Scaffald/UNI-Construct/pull/315) | `/v1/profiles/{username}` route ordering — no longer shadows base routes |
| SC-91 | P1 | In TestFlight | v1.7.0 | [#312](https://github.com/Scaffald/UNI-Construct/pull/312) | Skill search `/v1/profiles/skills/search-parents` ported |
| SC-92 | P1 | In TestFlight | v1.7.0 | [#311](https://github.com/Scaffald/UNI-Construct/pull/311) | Technical skills 500 — relation reference fixed |
| SC-93 | P1 | In TestFlight | v1.7.0 | [#311](https://github.com/Scaffald/UNI-Construct/pull/311) | Experience/education 500 — `core.user_profiles` reference fixed |
| SC-94 | P2 | In TestFlight | v1.7.0 | [#312](https://github.com/Scaffald/UNI-Construct/pull/312) | Vanity URL slug history endpoint implemented |
| SC-95 | P2 | In TestFlight | v1.7.0 | [#312](https://github.com/Scaffald/UNI-Construct/pull/312) | Profile shows real error/empty states instead of silent failure |
| SC-96 | P2 | In TestFlight | v1.7.0 | [#312](https://github.com/Scaffald/UNI-Construct/pull/312) | O*NET skill search branch wired up |
| SC-97 | P3 | In TestFlight | v1.7.0 | [#313](https://github.com/Scaffald/UNI-Construct/pull/313) | Connect/Follow buttons hidden on own profile |
| SC-99 | P4 | In TestFlight | v1.7.0 | [#313](https://github.com/Scaffald/UNI-Construct/pull/313) | Dev-env: reference seed folded into reset; seed creds updated |

**Mobile implications:** Profile read endpoints (the basis for the SC-33
profile-strength widget) are stable. Skill-search and O*NET branches are
new surface — if mobile MVP exposes skill picker, it now has a working
backend.

---

## Cross-cutting patterns

Recurring failure modes across all 5 flows. **These are the things to
watch for when reviewing any next-flow audit or designing new code.**

1. **REST migration left ports unported.** Half of the v1.7.0/v1.8.0 bugs
   were "UI calls endpoint X, REST doesn't implement endpoint X." The
   pattern: tRPC procedure existed, REST router missed it. **Mitigation
   for next audits:** before scoping UI work in a new flow, grep the UI
   for `client.<resource>.<method>` and verify each is present in
   `packages/supabase/functions/api/routes/<resource>.ts`. The certs flow
   alone had 8 missing routes.
2. **Silent failures > visible errors.** Many tickets were "swallows
   error, returns null/empty" rather than "throws or surfaces a toast."
   The pattern looks like:
   ```ts
   try { return await client.x.y() } catch { return null }
   ```
   Anywhere we see this shape now, treat as a tech-debt smell. The v1.10.0
   audit pass (whichever flow comes next) should explicitly grep for
   `catch.*return null` and `catch.*return \[\]` in SDK + UI.
3. **SDK params drift from form schema.** SC-113 (legal-acceptance fields
   missing from `CompletePrerequisitesParams`) and SC-124 (generic Record
   cast) are the same shape: RHF form contract diverges from SDK contract,
   field silently dropped. **Mitigation:** SDK should export Zod schemas
   per resource, and forms should bind to them. (Possible v1.11.0+
   architectural ticket.)
4. **Idempotency was missing.** SC-106 + SC-109 plug a real correctness
   hole for retries on flaky networks — mobile cares about this. New SDK
   mutations should attach an idempotency key by default unless the call
   is provably idempotent server-side.

---

## v1.10.0 prioritization input

Direct consequences for the v1.10.0 scope already labeled in Linear:

- **[SC-27](https://linear.app/scaffald/issue/SC-27) (UI kit refactor)** —
  Now unblocked by the verified API surface. Components can be built
  against real endpoints, not stubs. Recommend pairing the SDK-typed-params
  pattern (cross-cutting #3) into the refactor so the UI kit components
  consume `<Resource>Params` types directly, not loose `Record` props.
- **[SC-33](https://linear.app/scaffald/issue/SC-33) (Home screen design)** —
  Backed by stable profile/industry/skills endpoints. Design can assume
  data is available; design *should* explicitly include error/empty states
  (lesson from cross-cutting #2).
- **[SC-34](https://linear.app/scaffald/issue/SC-34) (Jobs screen design)** —
  Backed by complete applications API surface incl. upload/messages. Design
  should explicitly cover the apply-flow retry path (idempotency-key UX:
  what does the user see when a retry collapses to the same submission?).

**Out of v1.10.0 scope, suggested for v1.11.0:**

- Next flow audit. Candidates not yet audited: notifications & deep links,
  employer admin (post-acceptance), search/discovery, payments/payroll if
  any.
- The SDK schema unification work (cross-cutting #3) as an architectural
  ticket — too big for v1.10.0 alongside SC-22+SC-27+SC-33+SC-34.

---

## Status check before next release

Run before cutting v1.10.0 to confirm nothing regressed:

```bash
node --env-file=.env.production scripts/audit/2026-06-10/generate-status-matrix.mjs
```

Expect: 35 tickets, 100% In TestFlight or Done. **Any "Triage" / "Todo" /
"In Progress" appearing in the output means a regression filed against an
already-audited flow** — investigate before tagging v1.10.0.
