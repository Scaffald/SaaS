# AWS CloudFront CNAME Conflict Resolution

## Problem

The canonical subdomains (`app.scaffald.com`, `preview.scaffald.com`, `dev.scaffald.com`) are
held by CloudFront distributions in AWS account `******017471` (625030017471). We do not have
access to this account. Our current account (827046730742) cannot attach these CNAMEs, and
both `associate-alias` and `update-domain-association` fail because the source distributions
cannot be disabled from our account.

## Conflicting Distributions (from `list-conflicting-aliases`)

| CNAME | Conflicting Distribution | Account |
|---|---|---|
| `app.scaffald.com` | `******1JW8O8H` | `******017471` |
| `preview.scaffald.com` | `*******707V33O` | `******017471` |
| `dev.scaffald.com` | `*******4O5M1RZ` | `******017471` |

## Current Workaround

Interim subdomains are in use:

| Environment | Canonical (blocked) | Interim (working) | CloudFront Distribution |
|---|---|---|---|
| Production | `app.scaffald.com` | `beta.scaffald.com` | `E22499AF1OBX1Y` |
| Preview | `preview.scaffald.com` | `prev.scaffald.com` | `E1YYVZYC1XER5O` |
| Dev | `dev.scaffald.com` | `sandbox.scaffald.com` | `E1LG9TCV0OTUY1` |

## Escalation to AWS Support

Reply to the existing support chat with this message:

```
We followed your steps and ran list-conflicting-aliases. The results show the CNAMEs are held
by distributions in account ******017471 (625030017471), which we do not have access to and
cannot disable.

Conflicting distributions:
- app.scaffald.com → distribution ******1JW8O8H in account ******017471
- preview.scaffald.com → distribution *******707V33O in account ******017471
- dev.scaffald.com → distribution *******4O5M1RZ in account ******017471

We attempted both associate-alias and update-domain-association — both fail because the source
distributions in account 625030017471 are still enabled and we cannot disable them.

We have verified domain ownership:
- Route53 hosted zone: Z03807932GT9W30LQ0T67 (scaffald.com)
- _cf-custom-hostname TXT records for all 3 domains (verified via dig)
- ACM wildcard certificate: arn:aws:acm:us-east-1:827046730742:certificate/4e2b56a9-6b19-4ea8-aa2c-47781b65678e
- A records in Route53 pointing to our target distributions

Our account: 827046730742
Target distributions:
- app.scaffald.com → E22499AF1OBX1Y
- preview.scaffald.com → E1YYVZYC1XER5O
- dev.scaffald.com → E3J4DOM99FE5N

Please either disable the source distributions in account 625030017471 or manually release
these CNAME aliases so we can attach them to our distributions.
```

4. AWS Support will verify domain ownership and release the CNAMEs (typically 1-3 business days)

## After CNAMEs Are Released

Run these commands to attach the canonical aliases:

```bash
# Attach canonical aliases to distributions
./scripts/attach-cf-alias.sh E22499AF1OBX1Y app.scaffald.com
./scripts/attach-cf-alias.sh E1YYVZYC1XER5O preview.scaffald.com
./scripts/attach-cf-alias.sh E3J4DOM99FE5N dev.scaffald.com

# Update .env files
# .env.preview: EXPO_PUBLIC_URL=https://preview.scaffald.com
# .env.dev: EXPO_PUBLIC_URL=https://dev.scaffald.com
# .env.production: EXPO_PUBLIC_URL=https://app.scaffald.com (already correct)

# Update CI/CD workflow (already done in deploy-web.yml)

# Delete interim DNS records
# beta.scaffald.com, prev.scaffald.com, sandbox.scaffald.com

# Remove interim aliases from distributions
# Then delete E1LG9TCV0OTUY1 (duplicate sandbox dev distribution)
```

## Google OAuth Updates

After CNAME reclaim, update the Google Cloud Console OAuth settings:

**Remove** from Authorized JavaScript Origins:
- `https://beta.scaffald.com`
- `https://prev.scaffald.com`
- `https://sandbox.scaffald.com`

**Add** to Authorized JavaScript Origins:
- `https://app.scaffald.com`
- `https://preview.scaffald.com`
- `https://dev.scaffald.com`

Same changes for Authorized Redirect URIs (append `/auth/callback`).

## Supabase Auth Updates

After CNAME reclaim, push the updated `config.toml` to all Supabase projects:

```bash
pnpm supa:config:push:prod
pnpm supa:config:push:preview
pnpm supa:config:push:dev
```

The config.toml has already been updated to use only the canonical domains.
