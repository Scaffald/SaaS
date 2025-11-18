# AWS Notifications Bootstrap (SES + SNS/SMS)

## 1. Credentials

- IAM user `clay-cursor` has AdministratorAccess; credentials stored via `aws configure --profile scf-notify`.
- CLI verification: `aws sts get-caller-identity --profile scf-notify`.

## 2. Static Frontend Hosting (S3 + CloudFront)

The static web application is hosted on AWS using S3 for storage and CloudFront for CDN distribution. The infrastructure supports multiple environments mapped to git branches.

### Environments

| Environment | Branch | Bucket | Domain | DNS Setup |
|------------|--------|--------|--------|-----------|
| **Development** | `dev` | `scaffald-app-dev` | `dev.scaffald.com` | Yes (pending cert validation) |
| **Preview** | `preview` | `scaffald-app-preview` | `preview.scaffald.com` | Yes (pending cert validation) |
| **Production** | `main` | `scaffald-app-prod` | `app.scaffald.com` | Yes (pending cert validation) |

### Infrastructure Components

Each environment has:
- **S3 Bucket**: Stores static files with versioning enabled
- **CloudFront Distribution**: Serves content via CDN
- **Origin Access Control**: Secures S3 bucket access
- **Route53 DNS** (preview/prod): Custom domain pointing to CloudFront
- **SSL Certificate** (preview/prod): ACM certificate for HTTPS

### Initial Setup

Run the infrastructure setup script for each environment:

```bash
# Development environment
pnpm deploy:aws:setup:dev

# Preview environment
pnpm deploy:aws:setup:preview

# Production environment
pnpm deploy:aws:setup:prod
```

Or use the script directly:

```bash
./scripts/setup-aws-infra.sh [dev|preview|production]
```

This script will:
1. Create S3 bucket with versioning and public access block
2. Request/verify SSL certificate (preview/prod only)
3. Create Origin Access Control for S3
4. Create CloudFront distribution with optimized cache behaviors
5. Update S3 bucket policy to allow CloudFront access
6. Update Route53 DNS record (preview/prod only)

**Note**: CloudFront distribution deployment takes 15-20 minutes. SSL certificate validation may require DNS record updates.

### Deployment

#### Local CLI Deployment

The deployment script automatically detects the environment from your git branch, or you can specify it:

```bash
# Auto-detect from git branch
pnpm deploy:aws

# Explicitly specify environment
pnpm deploy:aws:dev
pnpm deploy:aws:preview
pnpm deploy:aws:prod
```

Or use the script directly:

```bash
./scripts/deploy-aws.sh [dev|preview|production]
```

The deployment script will:
1. Detect or use specified environment
2. Build the application (if not already built)
3. Upload files to S3 with appropriate cache headers
4. Invalidate CloudFront cache

#### Environment Variables

Set these environment variables for deployment:

```bash
export AWS_PROFILE=scf-notify
export AWS_ENV=dev  # or preview, production
export AWS_S3_BUCKET=scaffald-app-dev  # Optional, auto-detected from ENV
export AWS_CLOUDFRONT_DISTRIBUTION_ID=<distribution-id>  # Optional, auto-detected
export AWS_REGION=us-east-1
```

The script will auto-detect bucket and distribution ID if not set, based on the environment.

#### CI/CD Deployment

GitHub Actions automatically deploys to the correct environment based on branch:

- **`dev` branch** → Development environment
- **`preview` branch** → Preview environment  
- **`main` branch** → Production environment

Required GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (optional, defaults to us-east-1)
- `AWS_S3_BUCKET_DEV` (optional, defaults to scaffald-app-dev)
- `AWS_S3_BUCKET_PREVIEW` (optional, defaults to scaffald-app-preview)
- `AWS_S3_BUCKET_PROD` (optional, defaults to scaffald-app-prod)
- `AWS_CLOUDFRONT_DISTRIBUTION_ID_DEV` (optional)
- `AWS_CLOUDFRONT_DISTRIBUTION_ID_PREVIEW` (optional)
- `AWS_CLOUDFRONT_DISTRIBUTION_ID_PROD` (optional)

### Updating DNS

To update the Route53 DNS record for preview/production:

```bash
export AWS_CLOUDFRONT_DISTRIBUTION_ID=<distribution-id>
./scripts/update-route53-dns.sh
```

### IAM Permissions

The deployment requires IAM permissions defined in `infra/aws/iam/deploy-policy.json`:

- S3: PutObject, DeleteObject, ListBucket
- CloudFront: CreateInvalidation, GetDistribution
- Route53: ChangeResourceRecordSets (for DNS updates)
- ACM: ListCertificates, DescribeCertificate

### Cache Configuration

- **HTML files**: No cache (max-age=0, must-revalidate)
- **Static assets** (JS/CSS/images): Long cache (1 year, immutable)
- **404 errors**: Redirect to index.html for SPA routing

### Security

- S3 bucket is private (no public access)
- CloudFront Origin Access Control restricts S3 access
- HTTPS only (HTTP redirects to HTTPS)
- Security headers via CloudFront response headers policy

### Monitoring

- CloudFront metrics available in AWS Console
- S3 access logs can be enabled for detailed analytics
- CloudWatch alarms can be set up for distribution errors

### Troubleshooting

**Certificate not issued**: Verify DNS validation records in Route53 and wait for ACM validation.

**CloudFront not updating**: Check cache invalidation status and wait 5-15 minutes for propagation.

**DNS not resolving**: Verify Route53 record points to CloudFront distribution and wait for DNS propagation.

## 3. Route53 Hosted Zone

- Hosted zone: `scaffald.com` (`Id=Z0610739109YR6SDKL45L`)
- AWS nameservers to delegate at your registrar:
  - `ns-1505.awsdns-60.org`
  - `ns-1590.awsdns-06.co.uk`
  - `ns-556.awsdns-05.net`
  - `ns-84.awsdns-10.com`

### DNS Migration from CloudFlare to Route53

All DNS records from CloudFlare have been exported and are ready for migration to Route53.

**Complete DNS Records File**: `infra/aws/route53/scaffald-complete-records.json`

This file contains all DNS records currently configured in CloudFlare:
- **A records**: Root domain (`scaffald.com`) pointing to `31.43.161.6` and `31.43.160.6`
- **MX records**: Google Workspace email (5 MX records with priorities)
- **TXT records**: 
  - SPF record for email authentication
  - Google site verification records (2)
- **CNAME records**:
  - `www.scaffald.com` → `sites.framer.app`
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
  --hosted-zone-id Z0610739109YR6SDKL45L \
  --change-batch file://infra/aws/route53/scaffald-complete-records.json \
  --profile scf-notify
```

**Verification**
```bash
# List all records in Route53
aws route53 list-resource-record-sets \
  --hosted-zone-id Z0610739109YR6SDKL45L \
  --profile scf-notify

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

- Domain verified: `alerts.scaffald.com`
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
  --profile scf-notify \
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
  --profile scf-notify \
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

