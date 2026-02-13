# Dashboard Browser Test Results

**Date:** 2025-02-13  
**Apps tested:** Forsured (forsured-web), Scaffald (Expo Web)  
**Method:** Playwright E2E with console capture

---

## Summary

| App | Test Login | Dashboard Access | Console Errors | Critical Issues |
|-----|------------|------------------|----------------|-----------------|
| Forsured | Pass | Pass | 1 error, 1 warning | Minor (401 on some request) |
| Scaffald | N/A (magic link only) | Redirects to /auth when unauthenticated | Multiple errors | **ProfileSnapshotWidget crash** |

---

## Forsured (localhost:5173)

### Test Results
- **Test user login:** Pass. "Test as GC / Manager" correctly redirects to `/manager/dashboard`.
- **Auth flow:** Seeded test users work with `signInWithPassword`.

### Console Output

**Errors:**
- `Failed to load resource: the server responded with a status of 401 (Unauthorized)` – Some API or asset request returned 401. Worth investigating which URL fails.

**Warnings:**
- `"shadow*" style props are deprecated. Use "boxShadow".` – React Native Web deprecation; non-blocking.

### Recommendations
1. Identify the 401 request (check Network tab for failing URLs).
2. Replace deprecated `shadow*` props with `boxShadow` where used.

---

## Scaffald (localhost:8081)

### Test Results
- **Shared Supabase session:** Session from Forsured does **not** carry over to Scaffald (different origins: 5173 vs 8081). Navigating to Scaffald after Forsured login lands on `/auth`.
- **Direct /dashboard (unauthenticated):** Correctly redirects to `/auth`.
- **Dashboard with auth:** When the dashboard attempts to render (e.g., after auth), it crashes due to `ProfileSnapshotWidget`.

### Console Output

**Critical Error – ProfileSnapshotWidget:**
```
Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.

Check the render method of `ProfileSnapshotWidget`.
    at ProfileSnapshotWidget
    at DashboardIndexLeft
    at Layout
    ...
```

**Root cause:** A component used inside `ProfileSnapshotWidget` ([packages/scf-core/features/profile/widgets/ProfileSnapshotWidget.tsx](packages/scf-core/features/profile/widgets/ProfileSnapshotWidget.tsx)) or one of its dependencies is `undefined`. Likely candidates: `DashboardWidget`, `ProgressBarBase`, or `Spinner` from `@scaffald/ui` – one may be missing or incorrectly exported for web.

**SVG Errors (repeated):**
```
Error: <svg> attribute width: Expected length, "lg".
Error: <svg> attribute height: Expected length, "lg".
```
- `size="lg"` is being passed to an SVG (e.g., via `Spinner` or an icon). SVG `width`/`height` require numeric values (e.g., `24`, `"24px"`), not tokens like `"lg"`.

**Other errors:**
- `Failed to load resource: 401 (Unauthorized)` – API/auth request failing.
- `Failed to load resource: 404 (Not Found)` – Missing resource or endpoint.

**Warnings:**
- `"shadow*" style props are deprecated. Use "boxShadow".`
- `props.pointerEvents is deprecated. Use style.pointerEvents`
- `TouchableMixin is deprecated. Please use Pressable.`
- `[sentry] DSN not configured; Sentry disabled.` – Expected in local dev.

---

## Recommended Fixes

### High priority (Scaffald dashboard crash) – FIXED
1. **ProfileSnapshotWidget undefined component:** **Resolved.** `DashboardWidget` was missing from `@scaffald/ui`. Added [packages/scaffald-ui/src/components/Widgets/DashboardWidget](packages/scaffald-ui/src/components/Widgets/DashboardWidget) and exported it.
2. **SVG width/height "lg":** Find where `size="lg"` is passed to an icon/SVG and map it to a numeric value (e.g., `24` for `lg`) before rendering.

### Medium priority (deferred)
3. **401 Unauthorized (both apps):** Identify failing requests and fix auth or endpoint configuration. May be tRPC or Supabase requests requiring auth for protected routes.
4. **404 (Scaffald):** Fix the missing resource or route.

### Low priority (tech debt)
5. Replace deprecated `shadow*`, `pointerEvents`, and `TouchableMixin` usage.

---

## Test Artifacts

- Playwright spec: [apps/forsured-web/tests/e2e/dashboard-browser-check.spec.ts](apps/forsured-web/tests/e2e/dashboard-browser-check.spec.ts)
- Run with: `cd apps/forsured-web && pnpm exec playwright test tests/e2e/dashboard-browser-check.spec.ts`
