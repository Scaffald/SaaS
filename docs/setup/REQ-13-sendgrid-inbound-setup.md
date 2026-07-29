# REQ-13: SendGrid Inbound Parse & Email Template Setup

> **Outbound email is no longer SendGrid.** Every sender moved to Resend on
> 2026-07-29 — see [RESEND.md](./RESEND.md). The `SENDGRID_API_KEY`,
> `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` and template variables described
> in §4 below are no longer read by any code, and the SendGrid transactional
> template in §1 is unused: the app builds its own HTML.
>
> What remains valid here is **inbound parse** — receiving mail at
> `INBOUND_EMAIL_BASE_DOMAIN` and posting it to a webhook — which was never
> migrated. Read the rest of this document for inbound only.

This guide covers the manual configuration steps required to complete the Contractor Invitation Email with Insurance Document Upload feature.

## Table of Contents
1. [SendGrid Email Template Setup](#1-sendgrid-email-template-setup)
2. [DNS Configuration for Inbound Parse](#2-dns-configuration-for-inbound-parse)
3. [SendGrid Inbound Parse Configuration](#3-sendgrid-inbound-parse-configuration)
4. [Environment Variables](#4-environment-variables)
5. [Testing the Setup](#5-testing-the-setup)

---

## 1. SendGrid Email Template Setup

### Template: Contractor Invitation with Insurance Upload

Create a new **Dynamic Template** in SendGrid with the following configuration:

#### Template Settings
- **Template Name:** `contractor-invitation-with-insurance-upload`
- **Template ID:** Save this ID for environment variables

#### Subject Line
```
{{manager_name}} invited you to share insurance documents on ForSured
```

#### Email Body (HTML)

Copy the following HTML into the SendGrid template editor:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ForSured Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <img src="https://app.forsured.com/logo.png" alt="ForSured" width="150" style="max-width: 150px;">
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1a1a1a;">
                You're invited to ForSured
              </h1>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                <strong>{{manager_name}}</strong> from <strong>{{manager_company}}</strong> has invited you to share your insurance documents through ForSured.
              </p>

              <!-- Section 1: Create Account -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                  Option 1: Create Your Account
                </h2>
                <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: #4a4a4a;">
                  Get full access to manage your insurance documents, track expiration dates, and share with multiple managers.
                </p>
                <a href="{{invitation_link}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                  Create Account
                </a>
              </div>

              <!-- Section 2: Forward by Email -->
              <div style="background-color: #fefce8; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #fef08a;">
                <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                  Option 2: Forward Your Insurance Documents
                </h2>
                <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.5; color: #4a4a4a;">
                  Simply forward your insurance certificates to this email address:
                </p>
                <div style="background-color: #ffffff; border: 2px dashed #d4d4d4; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 12px;">
                  <code style="font-size: 16px; color: #2563eb; font-weight: 500;">{{inbound_email_address}}</code>
                </div>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">
                  <strong>Important:</strong> Forward from <strong>{{contractor_email}}</strong> only. Emails from other addresses will be rejected for security.
                </p>
                <p style="margin: 8px 0 0; font-size: 13px; color: #6b7280;">
                  Accepted formats: PDF, DOCX, JPEG, PNG, GIF (max 2MB each)
                </p>
              </div>

              <!-- Section 3: Broker Upload Link -->
              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; border: 1px solid #bbf7d0;">
                <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                  Option 3: Have Your Broker Upload
                </h2>
                <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.5; color: #4a4a4a;">
                  Share this link with your insurance broker so they can upload documents on your behalf:
                </p>
                <div style="background-color: #ffffff; border: 2px dashed #d4d4d4; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 12px;">
                  <a href="{{broker_invitation_link}}" style="font-size: 14px; color: #2563eb; word-break: break-all;">{{broker_invitation_link}}</a>
                </div>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">
                  Your broker won't need an account to upload documents for you.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-align: center;">
                This invitation was sent by {{manager_name}} from {{manager_company}}.
              </p>
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">
                Questions? Reply to this email or contact <a href="mailto:support@forsured.com" style="color: #2563eb;">support@forsured.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

#### Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{manager_name}}` | Name of the manager sending invitation | "John Smith" |
| `{{manager_company}}` | Manager's company name | "ABC Construction" |
| `{{contractor_email}}` | Contractor's registered email | "contractor@example.com" |
| `{{invitation_link}}` | Link to create ForSured account | "https://app.forsured.com/invite/abc123" |
| `{{inbound_email_address}}` | Unique email for forwarding docs | "insurance-uuid@inbound.forsured.com" |
| `{{broker_invitation_link}}` | Link for broker to upload docs | "https://app.forsured.com/broker/invite/uuid" |

#### Steps to Create in SendGrid

1. Log into [SendGrid Dashboard](https://app.sendgrid.com)
2. Navigate to **Email API** > **Dynamic Templates**
3. Click **Create a Dynamic Template**
4. Name it: `contractor-invitation-with-insurance-upload`
5. Click **Add Version** > **Code Editor**
6. Paste the HTML above into the editor
7. Set the subject line as shown above
8. Click **Save**
9. Copy the **Template ID** (starts with `d-`)
10. Add to environment variables as `SENDGRID_CONTRACTOR_INVITATION_TEMPLATE_ID`

---

## 2. DNS Configuration for Inbound Parse

### Overview

To receive forwarded emails at `insurance-{id}@inbound.forsured.com`, you need to configure DNS records to route emails to SendGrid.

### Required DNS Records

Add the following records to your DNS provider (Route53, Cloudflare, etc.):

#### MX Record
| Type | Name | Value | Priority | TTL |
|------|------|-------|----------|-----|
| MX | `inbound` | `mx.sendgrid.net` | 10 | 3600 |

This creates: `inbound.forsured.com` pointing to SendGrid's mail servers.

### Steps for AWS Route53

1. Log into AWS Console > Route53
2. Select the `forsured.com` hosted zone
3. Click **Create Record**
4. Configure:
   - **Record name:** `inbound`
   - **Record type:** MX
   - **Value:** `10 mx.sendgrid.net`
   - **TTL:** 3600
5. Click **Create records**
6. Wait for DNS propagation (up to 48 hours, usually faster)

### Steps for Cloudflare

1. Log into Cloudflare Dashboard
2. Select `forsured.com` domain
3. Go to **DNS** > **Records**
4. Click **Add record**
5. Configure:
   - **Type:** MX
   - **Name:** `inbound`
   - **Mail server:** `mx.sendgrid.net`
   - **Priority:** 10
   - **TTL:** Auto
6. Click **Save**

### Verify DNS Configuration

```bash
# Check MX record
dig MX inbound.forsured.com

# Expected output should include:
# inbound.forsured.com.  3600  IN  MX  10 mx.sendgrid.net.
```

---

## 3. SendGrid Inbound Parse Configuration

### Configure Inbound Parse Webhook

1. Log into [SendGrid Dashboard](https://app.sendgrid.com)
2. Navigate to **Settings** > **Inbound Parse**
3. Click **Add Host & URL**
4. Configure:
   - **Receiving Domain:** `inbound.forsured.com`
   - **Destination URL:** `https://<PROJECT_REF>.supabase.co/functions/v1/email-inbound-parse`
   - **Spam Check:** ✅ Enabled
   - **Send Raw:** ❌ Disabled (use parsed format)
5. Click **Add**

### Webhook URL Format

Replace `<PROJECT_REF>` with your Supabase project reference:

| Environment | Webhook URL |
|-------------|-------------|
| Production | `https://your-project.supabase.co/functions/v1/email-inbound-parse` |
| Staging | `https://your-staging-project.supabase.co/functions/v1/email-inbound-parse` |

### Security: Webhook Authentication

The webhook validates requests using the Supabase function's built-in authentication. Ensure your Edge Function is deployed and accessible.

---

## 4. Environment Variables

Add these environment variables to your deployment:

### Application Environment (.env)

```bash
# SendGrid Email Template
SENDGRID_CONTRACTOR_INVITATION_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Inbound Parse Domain (example - use your app's domain)
INBOUND_PARSE_DOMAIN=inbound.example.com

# App URL for email links
APP_URL=https://app.example.com
```

### Supabase Edge Function Secrets

Set these in Supabase Dashboard > Edge Functions > Secrets:

```bash
# SendGrid API Key (already configured)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx

# SendGrid From Email
SENDGRID_FROM_EMAIL=notifications@example.com
SENDGRID_FROM_NAME=My App
```

---

## 5. Testing the Setup

### Test Email Template

1. In SendGrid, go to **Email API** > **Dynamic Templates**
2. Click on your template > **Preview**
3. Enter test data for all variables
4. Verify the email renders correctly
5. Send a test email to yourself

### Test Inbound Parse

1. Verify DNS propagation:
   ```bash
   dig MX inbound.forsured.com
   ```

2. Send a test email:
   - From: Your test contractor email
   - To: `insurance-test@inbound.forsured.com`
   - Attach: A small PDF file

3. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs email-inbound-parse
   ```

4. Expected behavior:
   - Email received by webhook
   - Validation checks run
   - If sender doesn't match contractor: rejection email sent
   - If valid: files uploaded to storage

### Test Broker Invitation Link

1. Navigate to: `https://app.forsured.com/broker/invite/<contractor-id>`
2. Verify the page loads with contractor information
3. Test file upload with a small PDF
4. Verify success message appears

---

## Checklist

- [ ] SendGrid dynamic template created
- [ ] Template ID added to environment variables
- [ ] MX record added for `inbound.forsured.com`
- [ ] DNS propagation verified
- [ ] SendGrid Inbound Parse webhook configured
- [ ] Webhook URL points to correct Supabase function
- [ ] Test email sent and received by webhook
- [ ] Test broker invitation page works
- [ ] Environment variables set in all environments

---

## Troubleshooting

### Emails not reaching webhook

1. Verify MX record: `dig MX inbound.forsured.com`
2. Check SendGrid Inbound Parse settings
3. Ensure webhook URL is correct and accessible
4. Check Supabase Edge Function logs for errors

### Template not rendering variables

1. Verify variable names match exactly (case-sensitive)
2. Check that all variables are passed in the API call
3. Use SendGrid's preview feature to test with sample data

### Broker invitation page shows "Not Found"

1. Verify the contractor ID exists in the database
2. Check that the contractor has `user_type = 'contractor'` or `user_type = 'manual'`
3. Check browser console for API errors

---

## Support

For issues with this setup, check:
- SendGrid documentation: https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
