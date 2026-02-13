# Forsured Inbound Email Setup - Status Report

## ✅ Completed (Automated)

### 1. App Environment Variable
- **File**: `apps/forsured-web/.env.production`
- **Variable**: `INBOUND_EMAIL_BASE_DOMAIN=inbound.mx.forsured.com`
- **Status**: ✅ DONE

### 2. Supabase Edge Function Secret
- **Secret Name**: `INBOUND_EMAIL_BASE_DOMAIN`
- **Value**: `inbound.mx.forsured.com`
- **Project**: `qmfmpcyxsihhfttvqpbw`
- **Status**: ✅ DONE (verified in secrets list)

### 3. Database Migration Created
- **File**: `packages/supabase/migrations/302_forsured_inbound_email_settings.sql`
- **Status**: ✅ Created, ready to apply

### 4. Documentation
- **File**: `docs/FORSURED_INBOUND_EMAIL_SETUP.md`
- **Status**: ✅ Complete setup guide created

---

## ⚠️ Manual Steps Required

### Step 1: Apply Database Migration

**Issue Found**: There's a migration ordering problem (migration 206 references table from migration 255).

**Quick Solution**: Apply just the inbound email migration manually:

```bash
# Run the script I created for you
./apply-inbound-email-migration.sh
```

**Or manually**:
```bash
psql "postgresql://postgres:8xmbGpzwoQT5pvIl@db.qmfmpcyxsihhfttvqpbw.supabase.co:5432/postgres" \
  -f packages/supabase/migrations/302_forsured_inbound_email_settings.sql
```

**Verify**:
```sql
-- Check the setting was created
SELECT * FROM forsured.app_settings WHERE key = 'inbound_email_base_domain';

-- Or use the helper function
SELECT forsured.get_setting('inbound_email_base_domain');
```

---

### Step 2: Configure SendGrid Inbound Parse

1. **Login to SendGrid**
   - Go to: https://app.sendgrid.com
   - Navigate to: **Settings** → **Inbound Parse**

2. **Add New Host & URL**
   - Click **Add Host & URL**

3. **Configure the Webhook**
   ```
   Hostname: inbound.mx.forsured.com
   URL: https://auth.scaffald.com/functions/v1/email-inbound-parse
   ☑ Check spam
   ☑ Send raw (recommended for full email content)
   ```

4. **Save the Configuration**

---

### Step 3: Configure DNS (MX Record)

You need to add an MX record to point your inbound email domain to SendGrid.

#### If using Cloudflare:
1. Go to your Cloudflare dashboard
2. Select your domain (forsured.com)
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Configure:
   ```
   Type: MX
   Name: inbound.mx
   Mail server: mx.sendgrid.net
   Priority: 10
   TTL: Auto
   Proxy status: DNS only (gray cloud)
   ```
6. Click **Save**

#### If using Route53 (AWS):
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "inbound.mx.forsured.com",
        "Type": "MX",
        "TTL": 3600,
        "ResourceRecords": [{"Value": "10 mx.sendgrid.net"}]
      }
    }]
  }'
```

#### Verify DNS Configuration:
```bash
# Wait 5-10 minutes for DNS propagation, then test:
dig MX inbound.mx.forsured.com

# Should return:
# inbound.mx.forsured.com. 3600 IN MX 10 mx.sendgrid.net.
```

---

### Step 4: Create the Edge Function (If Not Exists)

Check if the edge function exists:

```bash
cd packages/supabase
ls -la functions/ | grep email-inbound-parse
```

**If it doesn't exist**, create it:

```bash
supabase functions new email-inbound-parse
```

Then implement the function using the example in `docs/FORSURED_INBOUND_EMAIL_SETUP.md` (Section 5).

**Deploy the function**:
```bash
supabase functions deploy email-inbound-parse \
  --project-ref qmfmpcyxsihhfttvqpbw \
  --no-verify-jwt
```

Note: `--no-verify-jwt` is required because SendGrid doesn't send JWT tokens.

---

### Step 5: Test the Setup

1. **Send a test email**:
   ```bash
   echo "Test email body" | mail -s "Test Subject" test@inbound.mx.forsured.com
   ```

2. **Check Edge Function logs**:
   ```bash
   supabase functions logs email-inbound-parse --project-ref qmfmpcyxsihhfttvqpbw
   ```

3. **Or view logs in dashboard**:
   - https://supabase.com/dashboard/project/qmfmpcyxsihhfttvqpbw/logs/edge-functions

---

## Summary

### ✅ Already Done (No action needed)
- App environment variables
- Edge Function secrets
- Migration files created
- Documentation created

### 📋 You Need To Do
1. **Apply database migration** (5 minutes) - Run `./apply-inbound-email-migration.sh`
2. **Configure SendGrid** (5 minutes) - Add webhook in SendGrid dashboard
3. **Configure DNS** (5 minutes + wait for propagation) - Add MX record
4. **Create/Deploy Edge Function** (10 minutes) - If not already exists
5. **Test** (5 minutes) - Send test email and verify

**Total Estimated Time**: ~30 minutes + DNS propagation time

---

## Quick Reference

| Item | Value |
|------|-------|
| **Project Ref** | `qmfmpcyxsihhfttvqpbw` |
| **Inbound Domain** | `inbound.mx.forsured.com` |
| **Webhook URL** | `https://auth.scaffald.com/functions/v1/email-inbound-parse` |
| **MX Record** | `10 mx.sendgrid.net` |
| **Database URL** | `postgresql://postgres:8xmbGpzwoQT5pvIl@db.qmfmpcyxsihhfttvqpbw.supabase.co:5432/postgres` |

---

## Need Help?

- **Full Setup Guide**: See `docs/FORSURED_INBOUND_EMAIL_SETUP.md`
- **SendGrid Docs**: https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

---

**Last Updated**: February 12, 2026
