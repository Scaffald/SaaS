# DNS Migration Summary: CloudFlare → Route53

> **HISTORICAL — describes the April 2026 CloudFlare → Route53 move, not the
> current zone.** Most of the record values below are superseded. Read the
> "Current state" block first; treat everything after it as a record of how the
> zone looked in April, kept because the migration rationale and the exported
> change batches are still the reference for how the zone was assembled.
>
> ### Current state (verified against Route53 2026-07-30)
>
> Hosted zone `Z03807932GT9W30LQ0T67`. The apex left Wix on 2026-07-28 and now
> serves the Expo SSR app.
>
> | Name | Type | Target |
> |---|---|---|
> | `scaffald.com` | A (alias) | `d2i8qcnbvmj1ap.cloudfront.net` — CloudFront `E1JU35IZ18YNEL`, apex SSR app fronted from EAS Hosting |
> | `www.scaffald.com` | A (alias) | same distribution as the apex |
> | `app.scaffald.com` | A (alias) | `d1vkl7i37stb04.cloudfront.net` — CloudFront `E22499AF1OBX1Y`, now a **301 to the apex**, not an app origin |
> | `scaffald.com` | MX | Google Workspace (`aspmx.l.google.com` + 4) — unchanged throughout |
> | `scaffald.com` | TXT | `v=spf1 include:_spf.google.com ~all` |
>
> Changes since this document was written:
> - The Wix apex A record (`185.230.63.107`) and the `www` → `pointing.wixdns.net`
>   CNAME are **gone**, replaced by the aliases above.
> - `staging.scaffald.com` (Vercel CNAME) is **gone**.
> - `app.scaffald.com` no longer points at CloudFlare IPs, and its distribution
>   is a redirect. Do not deploy a web build into it — the legacy S3 sync
>   scripts that could were deleted 2026-08-03. It is kept until roughly
>   January 2027 so bookmarks, old emails and OAuth stragglers keep working.
> - Resend records were added for outbound mail: `resend._domainkey` (TXT) and
>   `send.scaffald.com` (MX → `feedback-smtp.us-east-1.amazonses.com`).
> - Four Wix/`ascendbywix` DKIM and sender CNAMEs are still present and pending
>   removal — see issue #435 and `remove-wix-email-records.sh` in this directory.

## Overview
All DNS records from CloudFlare for `scaffald.com` have been exported and prepared for migration to AWS Route53.

## DNS Records Inventory

### Root Domain Records
- **A Record**: `185.230.63.107` (Wix — updated 2026-04-02, previously `31.43.161.6`, `31.43.160.6` for Framer)
- **MX Records** (5): Google Workspace email servers
  - Priority 1: `aspmx.l.google.com`
  - Priority 5: `alt1.aspmx.l.google.com`, `alt2.aspmx.l.google.com`
  - Priority 10: `alt3.aspmx.l.google.com`, `alt4.aspmx.l.google.com`
- **TXT Records** (3):
  - SPF: `v=spf1 include:_spf.google.com -all`
  - Google Site Verification (2 records)

### Subdomain Records
- **www.scaffald.com**: CNAME → `pointing.wixdns.net` (updated 2026-04-02, previously `sites.framer.app`)
- **app.scaffald.com**: A records → `104.21.90.219`, `172.67.205.140` (CloudFlare IPs)
- **staging.scaffald.com**: CNAME → `dec60148739e932d.vercel-dns-016.com`

### Email Security Records
- **_dmarc.scaffald.com**: TXT → `v=DMARC1; p=none; rua=mailto:dmarc_agg@vali.email`
  - **Note**: CloudFlare had both CNAME and TXT. Only TXT is included (Route53 doesn't allow both)

### AWS SES Records (alerts.scaffald.com)
- **_amazonses.alerts.scaffald.com**: TXT → SES verification token
- **DKIM CNAMEs** (3): For email signing
  - `p6ieaar322qoeqp3pua7q7z2qx3g3igv._domainkey.alerts.scaffald.com`
  - `pe735hzppzgozimyzvbel5nihjqweggs._domainkey.alerts.scaffald.com`
  - `y5omsbta6szh56upw3hfpx3cpkev6hk4._domainkey.alerts.scaffald.com`

## Files Created

1. **scaffald-complete-records.json**: Complete Route53 change batch with all DNS records
2. **apply-dns-migration.sh**: Script to apply DNS changes with dry-run support
3. **DNS-MIGRATION-SUMMARY.md**: This summary document

## Migration Steps

### 1. Preview Changes (Dry Run)
```bash
cd infra/aws/route53
./apply-dns-migration.sh --dry-run
```

### 2. Apply DNS Records to Route53
```bash
./apply-dns-migration.sh
```

### 3. Verify Records in Route53
```bash
aws route53 list-resource-record-sets \
  --hosted-zone-id Z03807932GT9W30LQ0T67 \
  --profile scaffald
```

### 4. Update Nameservers at Registrar
Update your domain registrar to use these AWS nameservers:
- `ns-1505.awsdns-60.org`
- `ns-1590.awsdns-06.co.uk`
- `ns-556.awsdns-05.net`
- `ns-84.awsdns-10.com`

### 5. Wait for DNS Propagation
- Allow up to 48 hours for full propagation
- Use `dig` or online DNS checkers to verify

### 6. Verify DNS Resolution
```bash
dig scaffald.com A
dig www.scaffald.com CNAME
dig staging.scaffald.com CNAME
```

### 7. Remove Records from CloudFlare
After confirming everything works with Route53, remove DNS records from CloudFlare.

## Important Notes

1. **DMARC Record**: Only the TXT record is included (not the CNAME) as Route53 doesn't allow both record types for the same name.

2. **app.scaffald.com**: Currently points to CloudFlare IP addresses. These may need to be updated if the app is behind CloudFlare proxy. Consider:
   - If using CloudFlare proxy, you may need to update these to actual origin IPs
   - Or configure CloudFlare to work with Route53 nameservers

3. **TTL Values**: Set to reasonable defaults (300-3600 seconds). Adjust if needed for faster propagation during migration.

4. **SES Records**: Already configured in Route53, included in complete records for consistency.

## Rollback Plan

If issues occur after migration:
1. Revert nameservers at registrar back to CloudFlare
2. DNS will revert to CloudFlare records
3. Route53 records remain but won't be used until nameservers are switched back

## Verification Checklist

- [ ] All DNS records applied to Route53
- [ ] Records verified in Route53 console
- [ ] Nameservers updated at registrar
- [ ] DNS propagation confirmed (check from multiple locations)
- [ ] All subdomains resolving correctly
- [ ] Email (MX records) working
- [ ] Website (A/CNAME records) accessible
- [ ] SES verification still active
- [ ] CloudFlare records removed (after verification)

