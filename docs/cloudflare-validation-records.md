# Cloudflare DNS Validation Records

**IMPORTANT:** Add these CNAME records to Cloudflare DNS so AWS can validate the SSL certificates.

Since your nameservers are currently pointing to Cloudflare (not Route53), AWS cannot see the validation records that were added to Route53. You need to add these same records to Cloudflare.

## Records to Add in Cloudflare

### 1. dev.scaffald.com Validation

**Type:** CNAME  
**Name:** `_ec678c4deed11d0830a16703dbd7a799.dev`  
**Target:** `_e77584c3b5d53f647b339913f59e5011.jkddzztszm.acm-validations.aws.`  
**TTL:** Auto (or 300)

**Full record name:** `_ec678c4deed11d0830a16703dbd7a799.dev.scaffald.com`

---

### 2. preview.scaffald.com Validation

**Type:** CNAME  
**Name:** `_b21515b8ab33a64f4852aecf4dc7bc46.preview`  
**Target:** `_693a4ae86fd1cfa951e5560dab1f52fc.jkddzztszm.acm-validations.aws.`  
**TTL:** Auto (or 300)

**Full record name:** `_b21515b8ab33a64f4852aecf4dc7bc46.preview.scaffald.com`

---

### 3. app.scaffald.com Validation

**Type:** CNAME  
**Name:** `_b37a94914260595d389d0c2617209cda.app`  
**Target:** `_d1a82395f8a1e326044e78e9fafd8d3e.jkddzztszm.acm-validations.aws.`  
**TTL:** Auto (or 300)

**Full record name:** `_b37a94914260595d389d0c2617209cda.app.scaffald.com`

---

## How to Add in Cloudflare

1. Go to Cloudflare Dashboard → DNS → Records
2. Click "Add record"
3. For each record above:
   - Select **Type:** CNAME
   - **Name:** Use the "Name" value (Cloudflare will auto-append the domain)
   - **Target:** Use the "Target" value (include the trailing dot)
   - **Proxy status:** DNS only (gray cloud, not orange)
   - Click Save

## After Adding Records

1. Wait 2-5 minutes for DNS propagation
2. Run: `./scripts/check-and-complete-domains.sh`
3. The script will detect when certificates are validated and complete setup automatically

## Why This is Needed

- Your nameservers are currently at Cloudflare
- Validation records were added to Route53
- AWS can't see Route53 records when nameservers point to Cloudflare
- Adding these records to Cloudflare allows AWS to validate the certificates
- Once validated, you can complete the domain setup
- Then update nameservers to Route53 when ready

