# Sentry Notifications Setup

This guide explains how to configure Sentry to send notifications to Slack and email when errors occur in your application.

## Overview

Sentry is already integrated into the app and captures errors automatically. This guide covers setting up **Alert Rules** to receive notifications through:
- **Slack** - Real-time alerts in team channels
- **Email** - Email notifications for critical errors

## Prerequisites

- Access to your Sentry project dashboard
- Admin permissions in your Sentry organization
- Slack workspace (for Slack notifications)

## 1. Slack Notifications

### Step 1: Install Sentry Slack Integration

1. Go to your Sentry organization settings
2. Navigate to **Settings** → **Integrations**
3. Find and click on **Slack**
4. Click **Add to Slack** and authorize the integration
5. Select the Slack workspace you want to connect

### Step 2: Create Slack Alert Rules

1. Go to your Sentry project (e.g., `scaffald-web` or `scaffald-native`)
2. Navigate to **Alerts** → **Create Alert**
3. Choose **Issues** as the alert type
4. Configure the alert:

   **When:**
   ```
   An issue is first seen
   OR
   An issue changes state from resolved to unresolved
   OR
   The issue has happened at least [X] times in [Y] minutes
   ```

   **If:**
   ```
   The issue's environment equals [production]
   AND
   The issue's level equals [error] or [fatal]
   ```

   **Then:**
   ```
   Send a notification via Slack
   Choose your Slack workspace and channel (#alerts, #errors, etc.)
   ```

5. Name your alert (e.g., "Production Errors - Slack")
6. Click **Save Rule**

### Recommended Slack Alert Rules

**Critical Errors (Immediate)**
- Environment: Production
- Level: error, fatal
- Frequency: First seen OR state change
- Channel: `#critical-alerts`

**High Frequency Errors (Aggregated)**
- Environment: Production
- Level: error
- Frequency: > 10 times in 5 minutes
- Channel: `#error-spikes`

**New Release Errors**
- Environment: Production
- Level: error, fatal
- Frequency: First seen after new release
- Channel: `#releases`

## 2. Email Notifications

### Step 1: Configure Email Settings

1. Go to **Settings** → **Account** → **Notifications**
2. Under **Email**, configure your preferences:
   - ✅ Issues
   - ✅ Workflow (resolved, assigned, etc.)
   - ✅ Deploys
   - ✅ Quota & Billing

### Step 2: Create Email Alert Rules

1. Go to your Sentry project
2. Navigate to **Alerts** → **Create Alert**
3. Choose **Issues** as the alert type
4. Configure the alert:

   **When:**
   ```
   An issue is first seen
   OR
   The issue has happened at least 50 times in 1 hour
   ```

   **If:**
   ```
   The issue's environment equals [production]
   AND
   The issue's level equals [error] or [fatal]
   ```

   **Then:**
   ```
   Send a notification to [email]
   Add team members or specific email addresses
   ```

5. Name your alert (e.g., "Production Errors - Email")
6. Click **Save Rule**

### Step 3: Configure Team Email Distribution

For team-wide notifications:

1. Go to **Settings** → **Teams**
2. Select your team
3. Add team members who should receive alerts
4. In alert rules, select "Send to Team" instead of individual emails

## 3. Advanced Alert Rules

### Performance Issues

Monitor slow transactions and API calls:

1. **Alert Type**: Metric Alert
2. **Metric**: Transaction Duration (p95)
3. **Threshold**: > 2 seconds for 5 minutes
4. **Action**: Send to Slack `#performance`

### Error Rate Spikes

Detect sudden increases in error rates:

1. **Alert Type**: Metric Alert
2. **Metric**: Error Rate
3. **Threshold**: Increases by 50% compared to previous period
4. **Action**: Send to Slack `#critical-alerts` and Email

### Custom Filters

Create targeted alerts for specific errors:

```javascript
// In alert conditions, use filters like:
message contains "API timeout"
OR
exception.type equals "DatabaseError"
OR
user.segment equals "premium"
```

## 4. Alert Best Practices

### Reduce Noise

1. **Use Issue Grouping** - Configure fingerprinting to group similar errors
2. **Set Thresholds** - Don't alert on every error; use frequency thresholds
3. **Environment Filtering** - Separate production and staging alerts
4. **Mute Resolved Issues** - Only alert when issues reopen

### Priority Levels

**P0 - Critical (Immediate Slack + Email)**
- Payment processing failures
- Authentication system down
- Database connection failures
- > 100 errors in 5 minutes

**P1 - High (Slack)**
- API endpoint failures
- Data validation errors
- Third-party integration failures
- 10-100 errors in 5 minutes

**P2 - Medium (Daily Digest Email)**
- UI rendering errors
- Non-critical feature failures
- < 10 errors per day

**P3 - Low (Weekly Report)**
- Deprecation warnings
- Non-blocking errors
- Development environment issues

### Alert Fatigue Prevention

1. **Use Digests** - Group low-priority alerts into daily/weekly summaries
2. **Set Up On-Call** - Rotate who receives alerts during off-hours
3. **Regular Review** - Audit alerts quarterly and adjust thresholds
4. **Auto-Resolve** - Configure auto-resolution for transient errors

## 5. Testing Your Setup

### Test Slack Notifications

Use the test buttons in the app (development only):

```typescript
// packages/scf-core/components/SentryTestButtons.tsx
import { captureException, captureMessage } from '@scf/core/utils/sentry'

// Trigger test error
captureException(new Error('Test Error for Slack Notification'))

// Trigger test message
captureMessage('Test message for Slack', 'error')
```

### Test Email Notifications

1. Go to Sentry project → **Alerts** → Select your email rule
2. Click **Test** in the top-right corner
3. This will send a test notification to configured recipients

### Verify Integration

After setting up alerts:

1. Trigger a test error in production (or staging)
2. Check Slack channel for notification (usually arrives within 30 seconds)
3. Check email inbox for notification (usually arrives within 1-2 minutes)
4. Verify the notification contains:
   - Error message and type
   - Link to Sentry issue
   - Environment and release info
   - User context (if available)

## 6. Maintenance

### Regular Tasks

**Weekly:**
- Review unresolved issues
- Check alert effectiveness
- Update alert thresholds if needed

**Monthly:**
- Review alert rules and remove duplicates
- Analyze alert volume and adjust priorities
- Update team notification lists

**Quarterly:**
- Audit all alert rules
- Review and improve error grouping
- Optimize notification channels

### Metrics to Monitor

- Alert volume per day/week
- Time to acknowledge alerts
- False positive rate
- Alert rule coverage (% of errors with alerts)

## 7. Example Alert Rule Configurations

### Production Error Alert (Slack)

```yaml
Name: Production Errors - Critical
Type: Issue Alert
Conditions:
  - Environment: production
  - Level: error OR fatal
  - First seen OR reopened
Actions:
  - Send Slack notification to #critical-alerts
  - Tag: @oncall
```

### High Frequency Error (Email + Slack)

```yaml
Name: Error Spike Detection
Type: Issue Alert
Conditions:
  - Environment: production
  - Happened at least 25 times in 5 minutes
Actions:
  - Send Slack notification to #error-spikes
  - Send email to team@scaffald.com
  - Create PagerDuty incident (if integrated)
```

### New User Impacting Error (Slack)

```yaml
Name: User-Facing Errors
Type: Issue Alert
Conditions:
  - Environment: production
  - Tags: component contains "ui" OR "api"
  - First seen in last 10 minutes
  - Affected users >= 5
Actions:
  - Send Slack notification to #user-experience
  - Assign to: Frontend Team
```

## Resources

- [Sentry Alerts Documentation](https://docs.sentry.io/product/alerts/)
- [Sentry Slack Integration](https://docs.sentry.io/product/integrations/notification-incidents/slack/)
- [Alert Best Practices](https://docs.sentry.io/product/alerts/best-practices/)
- [Notification Settings](https://docs.sentry.io/product/alerts/notifications/)

## Support

For issues with Sentry notifications:

1. Check Sentry status page: https://status.sentry.io
2. Verify integration is active in Sentry settings
3. Check Slack webhook configuration
4. Review email spam/filter settings
5. Contact Sentry support if issues persist

---

**Last Updated**: February 2026
**Maintained By**: Engineering Team
