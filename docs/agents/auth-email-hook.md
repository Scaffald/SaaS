# Auth email through NevarMail (Supabase Send Email hook)

Supabase normally sends sign-in, signup, recovery and email-change mail itself
over SMTP. On 2026-11-17 dev and preview could not send at all ("Error sending
magic link email"), while prod's SendGrid SMTP still worked. The fix is to send
auth mail through NevarMail, the same way everything else should send.

## How it works

1. Supabase Auth calls `auth-email-hook` (an HTTPS **Send Email** hook) with
   the token instead of mailing it.
2. The function verifies the Standard Webhooks signature (fails closed),
   renders the branded template for that action from
   `functions/_shared/auth-email-templates.ts`, and POSTs it to NevarMail
   `/api/v1/email/send`.
3. NevarMail sends it as the **Scaffald sign-in** use case
   (`fc1f51bc-25f3-4201-8cfa-57025af1bd92`, Unicorn org, Unicorn project) from
   `Scaffald <signin@mail.scaffald.com>`. `mail.scaffald.com` is verified
   (SendGrid CNAMEs in Route53, added 2026-11-17).

Links point at the environment's own `site_url` (`/auth/confirm?token_hash=…`),
which is what Supabase's mailer used, so nothing changes in the app.

`auth.scaffald.com` is NOT the mail domain: it is prod Supabase's custom domain.

## Templates

`packages/supabase/email-templates/*.html` and the `[auth.email.template.*]`
subjects in `config.toml` stay the source of truth. After changing either:

    node scripts/generate-auth-email-templates.mjs

`functions/api/__tests__/lib/auth-email-hook.test.ts` fails if the generated
module is stale.

## Turning it on for an environment

Do this per project (dev `pmtdqrfpumqwkdhpgwcz`, preview `uhjkipdwayqfihkanabk`,
prod `qmfmpcyxsihhfttvqpbw`):

1. Deploy functions (`./scripts/deploy-functions.sh <env>`). Inert so far.
2. Dashboard → Authentication → Hooks → **Send Email** → HTTPS →
   URL `https://<ref>.supabase.co/functions/v1/auth-email-hook`. Generate the
   secret (`v1,whsec_…`); do not enable yet.
3. Set the function secrets:

       pnpm exec supabase secrets set --project-ref <ref> \
         AUTH_EMAIL_HOOK_SECRET='v1,whsec_…' \
         NEVARMAIL_API_KEY='nvm_…' \
         NEVARMAIL_USE_CASE_ID=fc1f51bc-25f3-4201-8cfa-57025af1bd92 \
         AUTH_SITE_URL=https://dev.scaffald.com   # the env's app origin

   `AUTH_SITE_URL` matters: the hook payload's `site_url` is the auth server
   (`https://<ref>.supabase.co/auth/v1`), not the app, so without it links
   fall back to `redirect_to`'s origin and then to that auth-server URL.

4. Enable the hook. Request a magic link for a real inbox and confirm it
   arrives from `signin@mail.scaffald.com` and the link signs in.

To roll back, disable the hook: Supabase goes back to its SMTP settings.

## NevarMail prerequisites

- The Unicorn org must be in **live** mode (or the recipient on its test
  allow-list): in test mode NevarMail holds mail to anyone not on the list.
- The API key is an org API key (NevarMail → Developer → API Keys).
