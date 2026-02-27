# Forsured Inbound Email Setup Guide

This document explains how to configure SendGrid inbound email parsing for Forsured, including environment variables, Supabase Edge Functions, and database settings.

## Overview

Forsured uses SendGrid's Inbound Parse Webhook to receive and process incoming emails. The setup requires configuration in three places:

1. **Application Environment Variables** - For local development and production apps
2. **Supabase Edge Function Secrets** - For the email parsing Edge Function
3. **Supabase Database Settings** - For runtime configuration accessible via SQL

## Supabase Project Information

| Property | Value |
|----------|-------|
| **Project Ref** | `qmfmpcyxsihhfttvqpbw` |
| **Custom Domain** | `auth.scaffald.com` |
| **Database Host** | `db.qmfmpcyxsihhfttvqpbw.supabase.co` |
| **Functions URL (project ref)** | `https://qmfmpcyxsihhfttvqpbw.supabase.co/functions/v1` |
| **Functions URL (custom domain)** | `https://auth.scaffald.com/functions/v1` |

## Configuration Details

### Inbound Email Domain

**Domain**: `inbound.mx.forsured.com`

This domain is used as the base for all inbound email addresses. For example:
- `project-12345@inbound.mx.forsured.com`
- `document-67890@inbound.mx.forsured.com`

---

## 1. Application Environment Variables

### Production Environment (`apps/forsured-web/.env.production`)

```bash
# Supabase Configuration for Production
VITE_SUPABASE_URL=https://auth.scaffald.com
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtZm1wY3l4c2loaGZ0dHZxcGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzM0NDgsImV4cCI6MjA3Mzg0OTQ0OH0.yOcIfcYXm2TvHI0cGJaEH45etEQ0iceqTfC4nat_pKs

# Inbound Email Configuration
INBOUND_EMAIL_BASE_DOMAIN=inbound.mx.forsured.com
```

### Local Development Environment (`.env`)

For local development, you may want to use a different domain or testing service like Mailpit:

```bash
INBOUND_EMAIL_BASE_DOMAIN=localhost:54324
# or
INBOUND_EMAIL_BASE_DOMAIN=inbound.dev.forsured.com
```

---

## 2. Supabase Edge Function Secrets

The `email-inbound-parse` Edge Function needs access to the inbound email domain.

### Option A: Using Supabase CLI

```bash
# Navigate to supabase directory
cd packages/supabase

# Set the secret for production
supabase secrets set INBOUND_EMAIL_BASE_DOMAIN=inbound.mx.forsured.com \
  --project-ref qmfmpcyxsihhfttvqpbw

# Verify the secret was set
supabase secrets list --project-ref qmfmpcyxsihhfttvqpbw
```

### Option B: Using Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qmfmpcyxsihhfttvqpbw)
2. Navigate to **Edge Functions** in the left sidebar
3. Select the `email-inbound-parse` function
4. Go to **Settings** tab
5. Under **Secrets**, add:
   - **Name**: `INBOUND_EMAIL_BASE_DOMAIN`
   - **Value**: `inbound.mx.forsured.com`
6. Click **Add Secret**

### Using the Secret in Edge Functions

```typescript
// In your Edge Function (packages/supabase/functions/email-inbound-parse/index.ts)
const inboundDomain = Deno.env.get('INBOUND_EMAIL_BASE_DOMAIN');

if (!inboundDomain) {
  throw new Error('INBOUND_EMAIL_BASE_DOMAIN is not configured');
}

// Use the domain to validate or parse incoming email addresses
const recipientEmail = `project-${projectId}@${inboundDomain}`;
```

---

## 3. Supabase Database Settings

The inbound email domain is also stored in the database via the `forsured.app_settings` table, created by migration `302_forsured_inbound_email_settings.sql`.

### Running the Migration

```bash
# Navigate to supabase directory
cd packages/supabase

# Apply the migration locally
supabase db reset

# Apply to production (after testing locally)
supabase db push --project-ref qmfmpcyxsihhfttvqpbw
```

### Manual Database Configuration

If you need to manually set or update the setting:

```sql
-- Insert or update the inbound email domain setting
INSERT INTO forsured.app_settings (key, value, description, is_public)
VALUES (
  'inbound_email_base_domain',
  'inbound.mx.forsured.com',
  'Base domain for SendGrid inbound email parsing',
  false
)
ON CONFLICT (key)
DO UPDATE SET
  value = 'inbound.mx.forsured.com',
  updated_at = NOW();
```

### Querying the Setting

```sql
-- Using the helper function
SELECT forsured.get_setting('inbound_email_base_domain');

-- Direct query
SELECT value
FROM forsured.app_settings
WHERE key = 'inbound_email_base_domain';
```

### Using in Application Code

```typescript
// Example: Querying from your application
const { data, error } = await supabase
  .from('forsured.app_settings')
  .select('value')
  .eq('key', 'inbound_email_base_domain')
  .single();

if (data) {
  const inboundDomain = data.value; // 'inbound.mx.forsured.com'
}

// Or using the RPC function
const { data, error } = await supabase
  .rpc('forsured.get_setting', { setting_key: 'inbound_email_base_domain' });

// data will be: 'inbound.mx.forsured.com'
```

---

## 4. SendGrid Configuration

### Setting Up Inbound Parse Webhook

1. **Log in to SendGrid Dashboard**
   - Go to https://app.sendgrid.com

2. **Navigate to Inbound Parse**
   - Settings → Inbound Parse → Add Host & URL

3. **Configure the Webhook**

   | Field | Value |
   |-------|-------|
   | **Hostname** | `inbound.mx.forsured.com` |
   | **URL** | `https://auth.scaffald.com/functions/v1/email-inbound-parse` |
   | **Spam Check** | ✓ Enabled (recommended) |
   | **Send Raw** | ✓ Enabled (to get full email content) |

4. **DNS Configuration**

   Add the following MX record to your DNS provider (e.g., Cloudflare, Route53):

   ```
   Type: MX
   Name: inbound.mx.forsured.com
   Value: mx.sendgrid.net
   Priority: 10
   TTL: Auto or 3600
   ```

5. **Verify DNS Configuration**

   Wait for DNS propagation (can take up to 48 hours but usually much faster), then verify:

   ```bash
   # Check MX records
   dig MX inbound.mx.forsured.com

   # Should return:
   # inbound.mx.forsured.com. 3600 IN MX 10 mx.sendgrid.net.
   ```

### Testing the Integration

1. **Send a Test Email**

   ```bash
   # Using mail command (macOS/Linux)
   echo "Test email body" | mail -s "Test Subject" test@inbound.mx.forsured.com
   ```

2. **Check Supabase Logs**

   ```bash
   # View Edge Function logs
   supabase functions logs email-inbound-parse --project-ref qmfmpcyxsihhfttvqpbw

   # Or via dashboard:
   # https://supabase.com/dashboard/project/qmfmpcyxsihhfttvqpbw/logs/edge-functions
   ```

3. **Verify in Database**

   Check your database for the parsed email data (table structure depends on your implementation).

---

## 5. Edge Function Implementation

### Creating the Edge Function

If the `email-inbound-parse` function doesn't exist yet, create it:

```bash
cd packages/supabase
supabase functions new email-inbound-parse
```

### Basic Implementation Example

```typescript
// packages/supabase/functions/email-inbound-parse/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const INBOUND_DOMAIN = Deno.env.get('INBOUND_EMAIL_BASE_DOMAIN');

serve(async (req) => {
  try {
    // Verify request is from SendGrid
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response('Invalid content type', { status: 400 });
    }

    // Parse the multipart form data from SendGrid
    const formData = await req.formData();

    const to = formData.get('to') as string;
    const from = formData.get('from') as string;
    const subject = formData.get('subject') as string;
    const text = formData.get('text') as string;
    const html = formData.get('html') as string;

    // Validate the recipient domain
    if (!to.endsWith(`@${INBOUND_DOMAIN}`)) {
      console.error('Invalid recipient domain:', to);
      return new Response('Invalid recipient', { status: 400 });
    }

    // Extract identifier from email (e.g., project-12345@...)
    const [localPart] = to.split('@');
    const [entityType, entityId] = localPart.split('-');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process the email based on entity type
    switch (entityType) {
      case 'project':
        // Handle project-related email
        await handleProjectEmail(supabase, entityId, { from, subject, text, html });
        break;

      case 'document':
        // Handle document-related email
        await handleDocumentEmail(supabase, entityId, { from, subject, text, html });
        break;

      default:
        console.error('Unknown entity type:', entityType);
        return new Response('Unknown entity type', { status: 400 });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing inbound email:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});
```

### Deploying the Edge Function

```bash
# Deploy to production
supabase functions deploy email-inbound-parse \
  --project-ref qmfmpcyxsihhfttvqpbw \
  --no-verify-jwt
```

**Note**: `--no-verify-jwt` is required because SendGrid won't send a JWT token.

---

## 6. Security Considerations

### IP Whitelisting

SendGrid sends requests from specific IP addresses. Consider adding IP validation:

```typescript
const SENDGRID_IPS = [
  '167.89.118.50',
  '167.89.118.51',
  // Add all SendGrid IPs
];

const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0];
if (!SENDGRID_IPS.includes(clientIP)) {
  return new Response('Forbidden', { status: 403 });
}
```

### Request Validation

Verify the webhook signature if SendGrid provides one, or implement your own validation mechanism.

### Rate Limiting

Consider implementing rate limiting to prevent abuse:

```typescript
// Use Supabase or Redis to track request counts
const requestCount = await incrementRequestCount(senderEmail);
if (requestCount > 100) { // per hour, for example
  return new Response('Too Many Requests', { status: 429 });
}
```

---

## 7. Monitoring and Troubleshooting

### Common Issues

1. **Emails not being received**
   - Verify DNS MX records are correctly configured
   - Check SendGrid dashboard for delivery logs
   - Verify the webhook URL is accessible (test with curl)

2. **Edge Function errors**
   - Check Supabase Edge Function logs
   - Verify environment variables are set correctly
   - Test the function locally with `supabase functions serve`

3. **Database errors**
   - Verify RLS policies allow the service role to write
   - Check for missing columns or tables
   - Review migration status

### Useful Commands

```bash
# Test Edge Function locally
supabase functions serve email-inbound-parse --env-file .env.local

# View logs in real-time
supabase functions logs email-inbound-parse --project-ref qmfmpcyxsihhfttvqpbw --tail

# Check database settings
supabase db execute "SELECT * FROM forsured.app_settings WHERE key = 'inbound_email_base_domain'" \
  --project-ref qmfmpcyxsihhfttvqpbw
```

---

## Summary

Your inbound email configuration should now be set up across all three required locations:

✅ **App Environment** (`apps/forsured-web/.env.production`)
```bash
INBOUND_EMAIL_BASE_DOMAIN=inbound.mx.forsured.com
```

✅ **Supabase Edge Function Secrets**
```bash
supabase secrets set INBOUND_EMAIL_BASE_DOMAIN=inbound.mx.forsured.com
```

✅ **Supabase Database** (`forsured.app_settings` table)
```sql
SELECT forsured.get_setting('inbound_email_base_domain');
-- Returns: 'inbound.mx.forsured.com'
```

✅ **SendGrid Webhook**
```
https://auth.scaffald.com/functions/v1/email-inbound-parse
```

---

## Related Documentation

- [SendGrid Inbound Parse Documentation](https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Forsured Email Processing Workflow](./FORSURED_EMAIL_WORKFLOW.md) *(create if needed)*

---

**Last Updated**: February 12, 2026
**Migration Version**: 302_forsured_inbound_email_settings.sql
