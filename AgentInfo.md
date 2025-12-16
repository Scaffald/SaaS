# Agent Information

Guidelines and policies for AI agents working on this codebase.

## Testing Policy

**If we own it or write it, we test it directly - we do NOT mock it in tests.**

- Do NOT mock the database or the internal API
- Use a real database instance and real HTTP calls
- Mocks are only allowed for external third-party services
- Tables, code, configuration, and definitions that we own and that affect the code we own inside of 3rd party systems should be tested because we own it

### Why This Matters

Mocks can hide real bugs in infrastructure, configuration, and integration points. When mocks intercept failing requests, the tests "pass" but the actual functionality is broken. This creates a false sense of security and delays discovery of real issues.

### What To Test Directly

- Database schemas and migrations
- Supabase configuration (exposed schemas, RLS policies)
- tRPC endpoints and routers
- Internal API calls
- Environment variable loading
- Authentication flows

### What Can Be Mocked

- External third-party APIs (Stripe, SendGrid, etc.)
- OAuth providers during unit tests
- External webhooks
- Services we don't control
