# AWS Notifications Bootstrap (SES + SNS/SMS)

## 1. Credentials

- IAM user `clay-cursor` has AdministratorAccess; credentials stored via `aws configure --profile scf-notify`.
- CLI verification: `aws sts get-caller-identity --profile scf-notify`.

## 2. Route53 Hosted Zone

- Hosted zone: `scaffald.com` (`Id=Z0610739109YR6SDKL45L`)
- AWS nameservers to delegate at your registrar:
  - `ns-1505.awsdns-60.org`
  - `ns-1590.awsdns-06.co.uk`
  - `ns-556.awsdns-05.net`
  - `ns-84.awsdns-10.com`
- Change batch stored at `infra/aws/route53/scaffald-alerts-records.json`
  - Contains SES TXT + DKIM CNAMEs for `alerts.scaffald.com`
  - Apply with: `aws route53 change-resource-record-sets --hosted-zone-id Z0610739109YR6SDKL45L --change-batch file://infra/aws/route53/scaffald-alerts-records.json`
- Until you repoint the registrar, Route53 records won’t take effect—update nameservers when ready to migrate DNS.

## 3. SES (Email)

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

## 4. SMS (SNS + Pinpoint)

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

## 5. Lambda Dispatchers

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

## 6. Monitoring

- CloudWatch Logs groups created automatically for each Lambda.
- Subscribe an email/SMS/Webhook endpoint to `ses-alerts-bounces` for bounce/complaint alerts.
- Consider enabling SNS delivery status logs (requires IAM role + CloudWatch log group).

## 7. Next Steps Checklist

1. Add DNS TXT + CNAME records and confirm verification.
2. Request SES production access and higher SMS spend limit via AWS Support.
3. Provision SMS origination numbers (toll-free, 10DLC, or short code) and associate with Pinpoint.
4. Restrict Lambda Function URLs or front them with API Gateway + IAM.
5. Integrate these endpoints with Supabase Edge Functions / backend workflows and add retries + DLQs as needed.

