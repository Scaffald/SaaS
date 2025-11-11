# Analytics Validation & Rollout Checklist

## Automated Tests

Run locally before opening a PR:

```bash
pnpm --filter @app/core test:unit    # Vitest analytics suite
pnpm check                           # Lint + typecheck
pnpm --filter @app/supabase check:type # Validate edge function types
```

CI mirrors this sequence, so aim for a clean run locally first.

## Manual QA

1. **Consent gating**
   - Launch the app, deny analytics consent, and confirm no events appear in the project.
   - Accept consent, refresh, and verify events resume.
2. **Auth flows**
   - Request a magic link and observe `auth_magic_link_requested`.
   - Complete login (email or SSO) and confirm `user_signed_in`.
   - Sign out and ensure `user_signed_out` fires.
3. **Applications**
   - Submit an application in staging. Check PostHog for `application_submitted` with job metadata.
4. **Offline queue**
   - Disable networking, trigger a critical event (e.g., request a magic link), re-enable networking, and ensure the queued event flushes.

## Staging → Production Rollout

1. Deploy to staging (`pnpm --filter expo-app web:build` + staging release).
2. Verify dashboards/detections in the staging PostHog project.
3. Enable 10 % production rollout via EAS update, monitor alerts for 24 h.
4. Promote to 100 % once metrics look healthy.

Record outcomes for each run in Notion or the release tracker so we maintain an audit trail.

