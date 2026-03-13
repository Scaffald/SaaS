# Console Audit – 2026-03-10

- **Total routes audited:** 34
- **Routes with console errors:** 0
- **Total console errors:** 0
- **Total console warnings:** 32

## Per-route summary

| Route | Group | Errors | Warnings | Network 4xx/5xx | OK |
|-------|-------|--------|----------|----------------|----|
| / | public | 0 | 1 | 0 | Yes |
| /auth | public | 0 | 1 | 0 | Yes |
| /auth/verify | public | 0 | 1 | 0 | Yes |
| /auth/success | public | 0 | 0 | 0 | Yes |
| /dashboard | dashboard | 0 | 1 | 17 | Yes |
| /dashboard/map | dashboard | 0 | 1 | 3 | Yes |
| /dashboard/profile | dashboard | 0 | 1 | 3 | Yes |
| /dashboard/profile/general | dashboard | 0 | 1 | 5 | Yes |
| /dashboard/profile/education | dashboard | 0 | 1 | 5 | Yes |
| /dashboard/profile/experience | dashboard | 0 | 1 | 5 | Yes |
| /dashboard/profile/employment | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/profile/skills | dashboard | 0 | 1 | 6 | Yes |
| /dashboard/profile/certifications | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/profile/resume | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/profile/background-check | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/workers | dashboard | 0 | 1 | 3 | Yes |
| /dashboard/jobs | dashboard | 0 | 1 | 8 | Yes |
| /dashboard/employers | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/work-logs | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/work-logs/create | dashboard | 0 | 1 | 5 | Yes |
| /dashboard/assessments | dashboard | 0 | 1 | 3 | Yes |
| /dashboard/assessments/pulse | dashboard | 0 | 1 | 5 | Yes |
| /dashboard/assessments/ipip | dashboard | 0 | 1 | 5 | Yes |
| /dashboard/assessments/riasec | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/assessments/occupation | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/settings | dashboard | 0 | 1 | 5 | Yes |
| /dashboard/organizations | dashboard | 0 | 1 | 3 | Yes |
| /dashboard/teams | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/news | dashboard | 0 | 1 | 4 | Yes |
| /dashboard/connections | dashboard | 0 | 1 | 5 | Yes |
| /office | office | 0 | 1 | 0 | Yes |
| /office/jobs | office | 0 | 0 | 0 | Yes |
| /office/applications | office | 0 | 1 | 0 | Yes |
| /office/cms | office | 0 | 1 | 0 | Yes |

## Errors by route


## Warnings by route

### /

- "textShadow*" style props are deprecated. Use "textShadow".

### /auth

- "textShadow*" style props are deprecated. Use "textShadow".

### /auth/verify

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard

- "textShadow*" style props are deprecated. Use "textShadow".

### /dashboard/map

- "textShadow*" style props are deprecated. Use "textShadow".

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
- **Fixes applied:** Expo route default exports (`_FloatingToggles.tsx`, `_LegalDocumentLayout.tsx`); Lucide icon size tokens replaced with `getIconSize('md'|'lg')` in discover (InternalJobCard, EmployerCard, discover-workers-right, OrganizationCard, JobCard, AddOrganizationWidget). Dashboard audit 2026-03-06: profile education tRPC → `useSearchUniversities` (office-universities-sdk-hooks); profile skills SVG size → `getIconSize('lg')` in SkillCompletionProgress. Console cleanup: Sentry no log when DSN not configured in `__DEV__`; Card/Chip/SaaSNavigation/SaaSSectionHeader use `boxShadow` only on web (no shadow*); `pointerEvents` moved to `style.pointerEvents` in Slider, DatePickerDay, NavIconButton, LoadingOverlay, ToastContainer, SliderTooltip, NotificationListItem, discover-worker-profile-screen.
