#!/usr/bin/env bash
#
# Remove the DNS records left behind by the Wix site.
#
# `scaffald.com` moved off Wix on 2026-07-28, but four records still delegate
# email authentication to Wix's SendGrid sub-account (`s019.ascendbywix.com`):
# three DKIM selectors and the `sg.` sending host.
#
# RUN THIS ONLY AFTER THE WIX SUBSCRIPTION IS CANCELLED. While the subscription
# is live these records are inert but harmless; deleting them early means any
# campaign still sent from Wix loses its DKIM signature and starts landing in
# spam. Cancelling first costs nothing, so there is no reason to reverse the
# order.
#
# Reversible: the exact prior values are in the change batch below, so
# re-creating them is a matter of flipping DELETE to CREATE.
#
# Deliberately NOT touched:
#   - google._domainkey  — Google Workspace DKIM, live and correct.
#   - _amazonses.alerts / *._domainkey.alerts — SES records for a
#     `alerts.scaffald.com` identity that does not exist in AWS account
#     827046730742 (checked us-east-1, us-west-2, us-east-2: zero identities).
#     They are either orphaned or the identity lives in an account this key
#     cannot see. Left in place because breaking a live sender to tidy up is a
#     bad trade; see infra/aws/README.md.

set -euo pipefail

HOSTED_ZONE_ID="Z03807932GT9W30LQ0T67"
AWS_PROFILE="${AWS_PROFILE:-scaffald}"

read -r -p "Has the Wix subscription been cancelled? [y/N] " confirm
[[ "$confirm" == "y" || "$confirm" == "Y" ]] || { echo "Aborted."; exit 1; }

aws route53 change-resource-record-sets \
  --hosted-zone-id "$HOSTED_ZONE_ID" \
  --profile "$AWS_PROFILE" \
  --change-batch '{
    "Comment": "Remove Wix/ascendbywix email records after Wix cancellation",
    "Changes": [
      {
        "Action": "DELETE",
        "ResourceRecordSet": {
          "Name": "s1._domainkey.scaffald.com.",
          "Type": "CNAME",
          "TTL": 300,
          "ResourceRecords": [{ "Value": "s1._domainkey.scaffald.com.s019.ascendbywix.com" }]
        }
      },
      {
        "Action": "DELETE",
        "ResourceRecordSet": {
          "Name": "s2._domainkey.scaffald.com.",
          "Type": "CNAME",
          "TTL": 300,
          "ResourceRecords": [{ "Value": "s2._domainkey.scaffald.com.s019.ascendbywix.com" }]
        }
      },
      {
        "Action": "DELETE",
        "ResourceRecordSet": {
          "Name": "sel1._domainkey.scaffald.com.",
          "Type": "CNAME",
          "TTL": 300,
          "ResourceRecords": [{ "Value": "sel1._domainkey.scaffald.com.s019.ascendbywix.com" }]
        }
      },
      {
        "Action": "DELETE",
        "ResourceRecordSet": {
          "Name": "sg.scaffald.com.",
          "Type": "CNAME",
          "TTL": 300,
          "ResourceRecords": [{ "Value": "sg.scaffald.com.s019.ascendbywix.com" }]
        }
      }
    ]
  }'

echo "Submitted. Verify with:"
echo "  dig +short CNAME s1._domainkey.scaffald.com   # expect empty"
echo "  dig +short CNAME sg.scaffald.com              # expect empty"
