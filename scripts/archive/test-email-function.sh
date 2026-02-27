#!/bin/bash
# Test the email-inbound-parse Edge Function

echo "Testing email-inbound-parse function..."
echo ""

curl -X POST 'https://auth.scaffald.com/functions/v1/email-inbound-parse' \
  -H 'Content-Type: multipart/form-data' \
  -F to='test-123@inbound.mx.forsured.com' \
  -F from='test@example.com' \
  -F subject='Test Email from Setup' \
  -F text='This is a test email to verify the inbound parse function works correctly.' \
  -F html='<p>This is a test email to verify the inbound parse function works correctly.</p>' \
  -F attachments='0'

echo ""
echo ""
echo "Test complete!"
