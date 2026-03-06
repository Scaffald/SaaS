# Console Audit – 2026-03-06

- **Total routes audited:** 34
- **Routes with console errors:** 2
- **Total console errors:** 3
- **Total console warnings:** 28

## Per-route summary

| Route | Group | Errors | Warnings | Network 4xx/5xx | OK |
|-------|-------|--------|----------|----------------|----|
| / | public | 0 | 0 | 0 | Yes |
| /auth | public | 0 | 0 | 0 | Yes |
| /auth/verify | public | 0 | 1 | 0 | Yes |
| /auth/success | public | 0 | 0 | 0 | Yes |
| /dashboard | dashboard | 1 | 0 | 1 | No |
| /dashboard/map | dashboard | 2 | 0 | 0 | No |
| /dashboard/profile | dashboard | 0 | 1 | 0 | Yes |
| /dashboard/profile/general | dashboard | 0 | 1 | 0 | Yes |
| /dashboard/profile/education | dashboard | 0 | 1 | 6 | Yes |
| /dashboard/profile/experience | dashboard | 0 | 1 | 5 | Yes |
| /dashboard/profile/employment | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/profile/skills | dashboard | 0 | 1 | 7 | Yes |
| /dashboard/profile/certifications | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/profile/resume | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/profile/background-check | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/workers | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/jobs | dashboard | 0 | 1 | 11 | Yes |
| /dashboard/employers | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/work-logs | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/work-logs/create | dashboard | 0 | 1 | 6 | Yes |
| /dashboard/assessments | dashboard | 0 | 1 | 3 | Yes |
| /dashboard/assessments/pulse | dashboard | 0 | 1 | 5 | Yes |
| /dashboard/assessments/ipip | dashboard | 0 | 1 | 0 | Yes |
| /dashboard/assessments/riasec | dashboard | 0 | 1 | 0 | Yes |
| /dashboard/assessments/occupation | dashboard | 0 | 1 | 0 | Yes |
| /dashboard/settings | dashboard | 0 | 1 | 0 | Yes |
| /dashboard/organizations | dashboard | 0 | 1 | 8 | Yes |
| /dashboard/teams | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/news | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/connections | dashboard | 0 | 1 | 5 | Yes |
| /office | office | 0 | 1 | 0 | Yes |
| /office/jobs | office | 0 | 0 | 0 | Yes |
| /office/applications | office | 0 | 1 | 0 | Yes |
| /office/cms | office | 0 | 1 | 0 | Yes |

## Errors by route

### /dashboard

- **error:** Refused to execute script from 'http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=app&unstable_transfor
  - `http://localhost:8081/dashboard:0:0`

### /dashboard/map

- **error:** %o  %s  %s  ReferenceError: useActiveWelcomeSlides is not defined     at Screen (http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=
  - `http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable:880:26`
- **error:** [ERROR] ErrorBoundary caught error ReferenceError: useActiveWelcomeSlides is not defined     at DashboardLayout (http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=f
  - `http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable:880:26`


## Warnings by route

### /auth/verify

- %s  %s  An error occurred in the <ScaffaldProvider> component. Consider adding an error boundary to your tree to customize error handling behavior. Visit https://react.dev/link/error-boundaries to lea

### /dashboard/profile

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/profile/general

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/profile/education

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/profile/experience

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/profile/employment

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/profile/skills

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/profile/certifications

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/profile/resume

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/profile/background-check

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/workers

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/jobs

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/employers

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/work-logs

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/work-logs/create

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/assessments

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/assessments/pulse

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/assessments/ipip

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/assessments/riasec

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/assessments/occupation

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/settings

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/organizations

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/teams

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/news

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/connections

- "textShadow*" style props are deprecated. Use "textShadow".

### /office

- "textShadow*" style props are deprecated. Use "textShadow".

### /office/applications

- "textShadow*" style props are deprecated. Use "textShadow".

### /office/cms

- "textShadow*" style props are deprecated. Use "textShadow".



## Triage and allowlist

- **Allowlisted (not reported as errors):** Failed to load resource (browser network errors), Sentry DSN not configured, useNativeDriver on web, Route missing default export, shadow*/pointerEvents/resizeMode deprecations, PGRST002 schema cache errors.
- **Fixes applied:** Expo route default exports (`_FloatingToggles.tsx`, `_LegalDocumentLayout.tsx`); Lucide icon size tokens replaced with `getIconSize('md'|'lg')` in discover (InternalJobCard, EmployerCard, discover-workers-right, OrganizationCard, JobCard, AddOrganizationWidget). Dashboard audit 2026-03-06: profile education tRPC → `useSearchUniversities` (office-universities-sdk-hooks); profile skills SVG size → `getIconSize('lg')` in SkillCompletionProgress.
