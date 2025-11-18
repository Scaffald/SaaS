## IPIP Results – E2E & Manual Testing

### Playwright E2E

```bash
pnpm test:playwright tests/e2e/dashboard/test-req-227-ipip-results.spec.ts
```

What it covers:
- Authenticated navigation to `/dashboard/assessments/ipip/results`
- Presence of narrative / chart tabs and accessible text content
- Optional share card behavior when the assessment is complete

### Manual Regression Checklist

1. Complete the IPIP assessment (or seed data) and open the results page.
2. Verify:
   - Tabs switch with keyboard and screen readers announce selected state
   - Chart view renders radar + facet bars without layout shifts
   - Share card toggles are labeled and announce state changes
   - Cooldown banner communicates next-available date
3. Test partial-progress scenario (less than 5 domains):
   - Narrative view shows partial warning instead of blank sections
   - Chart view hides incomplete facet cards and announces requirements
4. Confirm share flow:
   - Generate link (with expiration)
   - Copy + revoke actions succeed, toast messages appear
   - Shared token route (`/dashboard/assessments/ipip/shared/:token`) loads narrative + chart tabs

### Performance Spot Checks

- With devtools open, reload `/dashboard/assessments/ipip/results` and ensure:
  - No duplicate TRPC requests for `getAssessmentStatus` or `getArchetype` while navigating tabs
  - React DevTools Profiler shows `DomainCard` renders only when props change
- Run Lighthouse on the results page and confirm score ≥ 90 for Performance + Accessibility.

