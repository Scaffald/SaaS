# AWS Infrastructure

## 1. AWS Accounts & Credentials

### Scaffald AWS Account

- **Purpose**: scaffald.com app hosting, SES/SNS alerts, Lambda dispatchers, Route53
- **IAM user**: `clay-cursor` with AdministratorAccess
- **CLI profile**: `scaffald`
- **Setup**: `aws configure --profile scaffald`
- **Verify**: `aws sts get-caller-identity --profile scaffald`

## 2. Web Hosting (EAS Hosting + CloudFront)

**As-built since 2026-07-28** — the web app is the Expo SSR export served from
**EAS Hosting**, with CloudFront in front for DNS/TLS. There is no S3 bucket in
the serving path for the app itself. Full runbook: `docs/agents/SSR-DEPLOY.md`.

| Environment | Branch | EAS target | CloudFront | Domain |
|------------|--------|------------|------------|--------|
| Development | `main` | alias `scf-scaffald--dev.expo.app` | `E3J4DOM99FE5N` | `dev.scaffald.com` |
| Preview | `preview` | alias `scf-scaffald--preview.expo.app` | `E1YYVZYC1XER5O` | `preview.scaffald.com` |
| Production | `prod` | production `scf-scaffald.expo.app` | `E1JU35IZ18YNEL` | `scaffald.com` + `www` |

- **Deploys**: CI via `.github/workflows/deploy-web.yml` (push to the mapped
  branch), or locally via `pnpm deploy:web:{dev,preview,prod}`
  (`scripts/deploy-web-eas.sh`). Both pass `--environment` to `eas deploy` —
  required, or the worker starts with no env vars.
- **`app.scaffald.com`** is a **301 redirect to the apex**, served by the old
  production stack (`app-scaffald-com` bucket behind `E22499AF1OBX1Y`).
  **Never sync a build into that bucket** — it would silently replace the
  redirect for every old bookmark and OAuth callback.
- CloudFront origin config that matters (prod): origin request policy must be
  `Managed-AllViewerExceptHostHeader`, HTML cached by the custom
  `scaffald-ssr-html` policy (60s default). See `docs/agents/SSR-DEPLOY.md`.

### History

The pre-SSR static pipeline (S3 + OAC + CloudFront per environment, synced by
`deploy-aws.sh` / `deploy-web.sh`, provisioned by `setup-aws-infra.sh` /
`provision-app-infra.sh` / `attach-cf-alias.sh`) was retired 2026-07-28 and the
scripts were deleted 2026-08-03; recover them from git history if needed. The
dev/preview distributions above were kept but their origins now point at EAS.

## 3. Route53 Hosted Zone

- Hosted zone: `scaffald.com` (`Id=Z03807932GT9W30LQ0T67`)
- AWS nameservers to delegate at your registrar:
  - `ns-1505.awsdns-60.org`
  - `ns-1590.awsdns-06.co.uk`
  - `ns-556.awsdns-05.net`
  - `ns-84.awsdns-10.com`

### DNS Migration from CloudFlare to Route53

All DNS records from CloudFlare have been exported and are ready for migration to Route53.

**Complete DNS Records File**: `infra/aws/route53/scaffald-complete-records.json`

This file contains all DNS records currently configured in CloudFlare:
- **A record**: Root domain (`scaffald.com`) pointing to `185.230.63.107` (Wix — updated 2026-04-02)
- **MX records**: Google Workspace email (5 MX records with priorities)
- **TXT records**: 
  - SPF record for email authentication
  - Google site verification records (2)
- **CNAME records**:
  - `www.scaffald.com` → `pointing.wixdns.net` (Wix — updated 2026-04-02)
  - `staging.scaffald.com` → `dec60148739e932d.vercel-dns-016.com`
- **A records for subdomains**:
  - `app.scaffald.com` → CloudFlare IPs (104.21.90.219, 172.67.205.140)
- **DMARC**: `_dmarc.scaffald.com` TXT record
- **SES records**: AWS SES verification and DKIM records for `alerts.scaffald.com`

**Note on DMARC**: CloudFlare had both a CNAME and TXT record for `_dmarc.scaffald.com`. Route53 doesn't allow both record types for the same name, so only the TXT record (standard DMARC format) is included in the migration.

**Legacy alerts-only file**: `infra/aws/route53/scaffald-alerts-records.json` (superseded by complete records file)

### Applying DNS Migration

**Option 1: Using the migration script (recommended)**
```bash
cd infra/aws/route53
./apply-dns-migration.sh --dry-run  # Preview changes
./apply-dns-migration.sh             # Apply changes
```

**Option 2: Using AWS CLI directly**
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id Z03807932GT9W30LQ0T67 \
  --change-batch file://infra/aws/route53/scaffald-complete-records.json \
  --profile scaffald
```

**Verification**
```bash
# List all records in Route53
aws route53 list-resource-record-sets \
  --hosted-zone-id Z03807932GT9W30LQ0T67 \
  --profile scaffald

# Test DNS resolution (after nameserver switch)
dig scaffald.com A
dig www.scaffald.com CNAME
```

### Migration Checklist

1. ✅ **DNS records exported** from CloudFlare
2. ✅ **Route53 change batch created** with all records
3. ⏳ **Apply DNS records to Route53** (use script above)
4. ⏳ **Verify all records** in Route53 console
5. ⏳ **Update nameservers at registrar** to point to AWS nameservers
6. ⏳ **Wait for DNS propagation** (up to 48 hours)
7. ⏳ **Verify DNS resolution** from multiple locations
8. ⏳ **Remove DNS records from CloudFlare** (after verification)

**Important**: Until you repoint the registrar to AWS nameservers, Route53 records won't take effect. The current DNS is still served by CloudFlare.

## 4. SES (Email)

> **SES lives in a different AWS account from everything else here.** The
> config set's SNS topic is `arn:aws:sns:us-east-1:625030017471:...`, whereas
> Route53, S3 and CloudFront are in **827046730742** — the account the
> `scaffald` profile and the CI deploy keys authenticate to. Listing SES
> identities with those credentials returns zero in every region, which looks
> like the domain was never verified. It was verified, just elsewhere. Use the
> right credentials before concluding SES is broken, and do not delete the
> `alerts.scaffald.com` records in Route53 on the strength of an empty listing.
>
> **Nothing in the application sends through SES.** Notification email goes
> through SendGrid (`packages/supabase/functions/_shared/notifications/adapters/email.ts`),
> as does the marketing contact form. SES is provisioned but unused; the "next
> steps" below were never completed.

- Domain verified: `alerts.scaffald.com` (in account 625030017471)
  - TXT: `_amazonses.alerts.scaffald.com = mJgyMJb0eMplU6Dsb5lngH6cr7HNCWwkWfHncACUq/c=`
  - DKIM CNAMEs:
    - `p6ieaar322qoeqp3pua7q7z2qx3g3igv._domainkey` → `p6ieaar322qoeqp3pua7q7z2qx3g3igv.dkim.amazonses.com`
    - `pe735hzppzgozimyzvbel5nihjqweggs._domainkey` → `pe735hzppzgozimyzvbel5nihjqweggs.dkim.amazonses.com`
    - `y5omsbta6szh56upw3hfpx3cpkev6hk4._domainkey` → `y5omsbta6szh56upw3hfpx3cpkev6hk4.dkim.amazonses.com`
- Configuration set: `scf-alerts`
- Event destination: SNS topic `arn:aws:sns:us-east-1:625030017471:ses-alerts-bounces`
- Next steps:
  - Publish DNS records in Route53 (or current DNS host) and wait for verification.
  - Submit AWS support ticket to move SES us-east-1 out of sandbox (include sending volumes + use case).

### Sample email send (SES)

```bash
aws ses send-email \
  --profile scaffald \
  --from no-reply@alerts.scaffald.com \
  --destination ToAddresses=test@example.com \
  --message 'Subject={Data=Test},Body={Text={Data=hello}}' \
  --configuration-set-name scf-alerts
```

## 5. SMS (SNS + Pinpoint)

- SNS SMS defaults: `DefaultSMSType=Transactional`, `MonthlySpendLimit=1` (raise via support).
- SNS topics:
  - `arn:aws:sns:us-east-1:625030017471:sms-alerts-transactional`
- Pinpoint project: `alerts-barebones` (`Id=af3ac37cc65942ef849b3aca8f0cf671`)
- To send SMS directly:

```bash
aws sns publish \
  --profile scaffald \
  --phone-number +15555550100 \
  --message "Test SMS from SCF" \
  --message-attributes '{"AWS.SNS.SMS.SMSType":{"DataType":"String","StringValue":"Transactional"}}'
```

> Request dedicated long code/short code in SNS/Pinpoint before production (console → SMS and voice → phone numbers).

## 6. Lambda Dispatchers

| Function | Purpose | URL |
| --- | --- | --- |
| `alerts-email-dispatcher` | wraps SES send | `https://x4zwumwj7zgxixhilu4igrtsny0thaxh.lambda-url.us-east-1.on.aws/` |
| `alerts-sms-dispatcher` | wraps SNS publish | `https://hyqcev7h5au2csgzusj4deiemq0uerpd.lambda-url.us-east-1.on.aws/` |

- IAM role `alerts-lambda-notifications` with SES + SNS permissions and CloudWatch logging.
- Code lives in `infra/aws/lambda/{email,sms}/index.mjs`.

### Example payloads

```bash
curl -X POST https://x4zw...on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"from":"no-reply@alerts.scaffald.com","to":["test@example.com"],"subject":"Hello","text":"Testing"}'

curl -X POST https://hyqc...on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15555550100","message":"Testing SMS"}'
```

> Function URLs are unauthenticated for now; lock behind IAM auth or API Gateway once upstream services are ready.

## 7. Monitoring

- CloudWatch Logs groups created automatically for each Lambda.
- Subscribe an email/SMS/Webhook endpoint to `ses-alerts-bounces` for bounce/complaint alerts.
- Consider enabling SNS delivery status logs (requires IAM role + CloudWatch log group).

## 8. Next Steps Checklist

1. Add DNS TXT + CNAME records and confirm verification.
2. Request SES production access and higher SMS spend limit via AWS Support.
3. Provision SMS origination numbers (toll-free, 10DLC, or short code) and associate with Pinpoint.
4. Restrict Lambda Function URLs or front them with API Gateway + IAM.
5. Integrate these endpoints with Supabase Edge Functions / backend workflows and add retries + DLQs as needed.

