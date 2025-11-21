# Contract Test Suite

This directory captures contract fixtures for the third-party APIs the product depends on. The suite is implemented with `msw` so we can run the same HTTP flows our clients and hooks use while capturing a machine-readable contract payload under `contracts/generated/contracts.json`.

## Covered providers
- **Mapbox** via the `MapboxProvider` address hook.
- **OpenAI** via chat completions.
- **Stripe** via the account lookup used for connection testing.
- **SendGrid** via outbound invitation emails.

## Running locally

```
pnpm test:contracts
```

The command runs the contract-focused Vitest configuration and writes the generated contract interactions to `contracts/generated/contracts.json`. The CI workflow uploads the same file as an artifact and gates merges on the job status.
