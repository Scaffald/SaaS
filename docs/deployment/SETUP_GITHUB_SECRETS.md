# GitHub Secrets Setup Guide

Complete guide for connecting GitHub Actions to AWS and Supabase for automatic deployments.

## 🎯 Overview

To enable automatic deployments, you need to configure secrets in your GitHub repository. These secrets allow GitHub Actions to:
- Deploy your web app to AWS S3 + CloudFront
- Deploy Edge Functions to Supabase
- Access environment variables during build

## 📋 Required Secrets

### 1. AWS Secrets

#### `AWS_ACCESS_KEY_ID`
**Purpose:** Allows GitHub Actions to deploy to your AWS S3 bucket and CloudFront

**How to get it:**
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Navigate to **Users** → Select your deployment user
3. Go to **Security credentials** tab
4. Click **Create access key**
5. Select **Application running outside AWS**
6. Copy the **Access key ID** and **Secret access key**

#### `AWS_SECRET_ACCESS_KEY`
**Purpose:** Secret key paired with the access key ID

**How to get it:**
- Generated together with `AWS_ACCESS_KEY_ID` (see above)
- Copy immediately - you won't see it again!

#### `AWS_REGION`
**Purpose:** AWS region where your S3 bucket and CloudFront are located

**Example:** `us-east-1`

#### `AWS_S3_BUCKET_PROD`
**Purpose:** S3 bucket name for production deployments

**Example:** `scaffald-app-prod`

#### `AWS_CLOUDFRONT_DISTRIBUTION_ID_PROD`
**Purpose:** CloudFront distribution ID for production

**How to get it:**
1. Go to [AWS CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Select your distribution
3. Copy the **Distribution ID** (looks like: `E1234567890ABC`)

### 2. Supabase Secrets (Optional but Recommended)

#### `SUPABASE_ACCESS_TOKEN`
**Purpose:** Allows GitHub Actions to deploy Edge Functions

**How to get it:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click your profile icon (top right) → **Account Settings**
3. Navigate to **Access Tokens**
4. Click **Generate new token**
5. Name it: `GitHub Actions Deployment`
6. Copy the token immediately

#### `SUPABASE_PROJECT_ID`
**Purpose:** Identifies which Supabase project to deploy to

**How to get it:**
1. Go to your Supabase project
2. Click **Settings** (gear icon) → **General**
3. Copy the **Reference ID** (under "General settings")

### 3. Application Environment Variables

These are your actual app configuration values:

#### `EXPO_PUBLIC_SUPABASE_URL`
- Your Supabase project URL
- Format: `https://your-project-ref.supabase.co`
- Find in: Supabase Dashboard → Settings → API → Project URL

#### `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Your Supabase anonymous/public key
- Find in: Supabase Dashboard → Settings → API → anon/public key

#### `EXPO_PUBLIC_URL`
- Your production website URL
- Example: `https://your-domain.cloudfront.net` or your custom domain

#### Google OAuth (if using)
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_SCHEME`

#### Mapbox (if using)
- `EXPO_PUBLIC_MAPBOX_TOKEN`
- `EXPO_PUBLIC_MAPBOX_API_URL` (optional override)

### 4. Preview Environment Overrides

To keep the `preview` branch completely isolated from production, duplicate the required secrets with a `PREVIEW_` prefix. These values should point to your preview Supabase project, AWS resources, and any preview-specific OAuth/Mapbox credentials.

| Secret | Purpose |
| --- | --- |
| `PREVIEW_EXPO_PUBLIC_SUPABASE_URL` | Preview Supabase project URL |
| `PREVIEW_EXPO_PUBLIC_SUPABASE_ANON_KEY` | Preview Supabase anon key |
| `PREVIEW_EXPO_PUBLIC_URL` | Preview web base URL |
| `PREVIEW_EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Preview Google OAuth web client |
| `PREVIEW_EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Preview Google OAuth iOS client |
| `PREVIEW_EXPO_PUBLIC_GOOGLE_IOS_SCHEME` | Preview custom URL scheme |
| `PREVIEW_EXPO_PUBLIC_MAPBOX_TOKEN` | Preview Mapbox token |
| `PREVIEW_EXPO_PUBLIC_MAPBOX_API_URL` | Preview Mapbox API URL override |
| `PREVIEW_AWS_S3_BUCKET` | Preview S3 bucket name |
| `PREVIEW_AWS_CLOUDFRONT_DISTRIBUTION_ID` | Preview CloudFront distribution ID |
| `PREVIEW_SUPABASE_ACCESS_TOKEN` | Supabase access token for preview |
| `PREVIEW_SUPABASE_PROJECT_ID` | Preview Supabase project ref |

> ⚠️ The GitHub Action intentionally fails for the `preview` branch when Supabase/App secrets are missing. For AWS, you can use separate S3 buckets and CloudFront distributions for preview and production environments.

## 🔧 Adding Secrets to GitHub

### Via GitHub Web Interface

1. **Navigate to your repository** on GitHub
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Add each secret:
   - **Name:** Enter the secret name (e.g., `AWS_ACCESS_KEY_ID`)
   - **Value:** Paste the secret value
   - Click **Add secret**
6. Repeat for all secrets

### Via GitHub CLI (Alternative)

```bash
# AWS secrets
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set AWS_REGION
gh secret set AWS_S3_BUCKET_PROD
gh secret set AWS_CLOUDFRONT_DISTRIBUTION_ID_PROD
gh secret set PREVIEW_AWS_S3_BUCKET
gh secret set PREVIEW_AWS_CLOUDFRONT_DISTRIBUTION_ID

# Supabase secrets
gh secret set SUPABASE_ACCESS_TOKEN
gh secret set SUPABASE_PROJECT_ID
gh secret set PREVIEW_SUPABASE_ACCESS_TOKEN
gh secret set PREVIEW_SUPABASE_PROJECT_ID

# App environment variables
gh secret set EXPO_PUBLIC_SUPABASE_URL
gh secret set EXPO_PUBLIC_SUPABASE_ANON_KEY
gh secret set EXPO_PUBLIC_URL
gh secret set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
gh secret set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
gh secret set EXPO_PUBLIC_GOOGLE_IOS_SCHEME
gh secret set EXPO_PUBLIC_MAPBOX_TOKEN
gh secret set EXPO_PUBLIC_MAPBOX_API_URL

# Preview overrides
gh secret set PREVIEW_EXPO_PUBLIC_SUPABASE_URL
gh secret set PREVIEW_EXPO_PUBLIC_SUPABASE_ANON_KEY
gh secret set PREVIEW_EXPO_PUBLIC_URL
gh secret set PREVIEW_EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
gh secret set PREVIEW_EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
gh secret set PREVIEW_EXPO_PUBLIC_GOOGLE_IOS_SCHEME
gh secret set PREVIEW_EXPO_PUBLIC_MAPBOX_TOKEN
gh secret set PREVIEW_EXPO_PUBLIC_MAPBOX_API_URL
```

## 📝 AWS Setup

### 1. Create S3 Bucket

1. Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Click **Create bucket**
3. Configure:
   - **Bucket name**: e.g., `scaffald-app-prod`
   - **Region**: Choose your preferred region
   - **Block Public Access**: Uncheck (needed for static website hosting)
   - **Bucket Versioning**: Enable (recommended)
4. Click **Create bucket**

### 2. Configure S3 for Static Website Hosting

1. Select your bucket → **Properties** tab
2. Scroll to **Static website hosting**
3. Click **Edit** → Enable
4. Set **Index document**: `index.html`
5. Set **Error document**: `index.html` (for SPA routing)
6. Save and note the **Bucket website endpoint**

### 3. Create CloudFront Distribution

1. Go to [AWS CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Click **Create distribution**
3. Configure:
   - **Origin domain**: Select your S3 bucket
   - **Origin access**: Use website endpoint
   - **Viewer protocol policy**: Redirect HTTP to HTTPS
   - **Default root object**: `index.html`
4. Click **Create distribution**
5. Copy the **Distribution ID** for GitHub secrets

## 🗄️ Supabase Project Setup

### 1. Link Local Project to Production

```bash
cd packages/supabase
pnpx supabase link --project-ref YOUR-PROJECT-REF
pnpx supabase db remote --status
cd ../..
```

### 2. Create Production Environment File

Create `.env.production` in project root:

```bash
# Supabase Production
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET=your-service-role-key

# App URL
EXPO_PUBLIC_URL=https://your-production-domain.com

# OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_IOS_SCHEME=com.yourapp.scaffald

# Mapbox
EXPO_PUBLIC_MAPBOX_TOKEN=your-token

# Database (for local seeding scripts)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

**⚠️ Important:** Never commit `.env.production` to git!

## ✅ Verification Checklist

### GitHub Secrets
- [ ] `AWS_ACCESS_KEY_ID` set
- [ ] `AWS_SECRET_ACCESS_KEY` set
- [ ] `AWS_REGION` set
- [ ] `AWS_S3_BUCKET_PROD` set
- [ ] `AWS_CLOUDFRONT_DISTRIBUTION_ID_PROD` set
- [ ] `PREVIEW_AWS_S3_BUCKET` set (if using separate preview bucket)
- [ ] `PREVIEW_AWS_CLOUDFRONT_DISTRIBUTION_ID` set (if using separate preview distribution)
- [ ] `SUPABASE_ACCESS_TOKEN` set (optional)
- [ ] `SUPABASE_PROJECT_ID` set (optional)
- [ ] `PREVIEW_SUPABASE_PROJECT_ID` set (optional)
- [ ] All `EXPO_PUBLIC_*` variables set
- [ ] All `PREVIEW_EXPO_PUBLIC_*` variables set

### AWS
- [ ] S3 bucket created
- [ ] S3 bucket configured for static website hosting
- [ ] CloudFront distribution created
- [ ] IAM user created with S3 and CloudFront permissions
- [ ] Access keys generated

### Supabase
- [ ] Project created
- [ ] Local project linked
- [ ] `.env.production` created
- [ ] Access token generated (for Edge Functions)

## 🚀 Testing the Setup

### 1. Test GitHub Actions → AWS

```bash
# Make a small change
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: verify deployment pipeline"
git push origin main
```

Watch the GitHub Actions workflow:
```
https://github.com/YOUR-USERNAME/SCF-Neue/actions
```

### 2. Verify AWS Deployment

1. Check GitHub Actions logs for "Deploy to AWS S3 + CloudFront" step
2. Look for CloudFront distribution URL in logs
3. Visit your CloudFront distribution URL
4. Verify the site is live

### 3. Test Edge Functions Deployment

If you configured Supabase secrets:

1. Check GitHub Actions logs for "Deploy Edge Functions" step
2. Go to Supabase Dashboard → Edge Functions
3. Verify functions are deployed (trpc, job-import, news)

## 🔍 Troubleshooting

### "AWS deployment failed"

**Check:**
- `AWS_ACCESS_KEY_ID` is correct
- `AWS_SECRET_ACCESS_KEY` is correct
- IAM user has S3 and CloudFront permissions
- S3 bucket exists and is accessible
- CloudFront distribution exists

**Fix:**
1. Verify IAM user permissions
2. Check S3 bucket policy
3. Verify CloudFront distribution ID
4. Re-run workflow

### "Edge Functions deployment failed"

**Check:**
- `SUPABASE_ACCESS_TOKEN` is correct
- `SUPABASE_PROJECT_ID` is correct
- Token has function deployment permissions

**Fix:**
1. Ensure Supabase project is linked locally
2. Regenerate access token if needed
3. The workflow has `continue-on-error: true` so it won't fail the entire deployment

### "Missing environment variables"

**Check:**
- All required `EXPO_PUBLIC_*` secrets are set in GitHub
- Secret names match exactly (case-sensitive)
- No typos in secret names

**Fix:**
1. Review list of required secrets above
2. Add missing secrets to GitHub
3. Re-run workflow

## 📊 Deployment Flow Summary

```
Developer pushes to main branch
          ↓
GitHub Actions triggered
          ↓
Install dependencies & build packages
          ↓
Build web app (with secrets as env vars)
          ↓
Upload artifacts
          ↓
Deploy Edge Functions to Supabase (if configured)
          ↓
Deploy to AWS S3 + CloudFront (using access keys)
          ↓
✅ Production live!
```

## 🎉 Next Steps

After secrets are configured:

1. **Test the pipeline:**
   ```bash
   git push origin production
   ```

2. **Deploy database:**
   ```bash
   pnpm deploy:prod:db
   ```

3. **Verify everything:**
   ```bash
   pnpm deploy:verify:prod
   ```

4. **Monitor:**
   - GitHub Actions: Build logs
   - AWS CloudWatch: Deployment metrics
   - Supabase: Function logs

## 🔗 Quick Links

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Supabase Access Tokens](https://supabase.com/docs/guides/cli/managing-environments#access-tokens)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
