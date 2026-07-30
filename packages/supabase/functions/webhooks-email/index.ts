/**
 * Deployable entry point for the Resend delivery-event webhook.
 *
 * The implementation lives at webhooks/email/index.ts, but `supabase functions
 * deploy` only treats top-level directories as functions — a nested path is
 * not a slug. Importing the module runs its serve() call, so this wrapper is
 * the entire deployment shim.
 *
 * Auth is the Svix signature check inside the handler (RESEND_WEBHOOK_SECRET),
 * not verify_jwt — Resend cannot present a Supabase JWT.
 */
import '../webhooks/email/index.ts'
