# Environment Variables Security Audit

## Issues Found

### Critical Issues

1. **Non-public env vars exposed in `app.config.ts`**
   - `POSTHOG_KEY` and `POSTHOG_HOST` are exposed in the `extra` object (lines 185-186)
   - These values get bundled into the client and are accessible via `Constants.expoConfig.extra`
   - **Risk**: PostHog API keys (if non-public) are exposed to clients

2. **Hardcoded PostHog key in bundle**
   - Found hardcoded PostHog key: `phc_n7lQWdA1lVTU2WFxK8TvrcUoTP3Tud54GVjA1VIhxTy`
   - This appears to be a fallback value in the analytics client
   - **Risk**: If this is a real key, it's publicly accessible

3. **Babel config loads ALL env vars**
   - `react-native-dotenv` plugin loads from `.env` files with no filtering
   - `blocklist: null` and `allowlist: null` means ALL variables are accessible
   - **Risk**: Any secret in `.env` files could be bundled if referenced

4. **Analytics client reads non-public vars**
   - Client reads `POSTHOG_KEY`, `POSTHOG_KEY_DEV`, `POSTHOG_KEY_STAGING`, `POSTHOG_KEY_PROD` from `process.env`
   - These are not prefixed with `EXPO_PUBLIC_`
   - **Risk**: Server-side secrets could be exposed if present in build environment

### Current Behavior

- ✅ `EXPO_PUBLIC_*` variables are correctly treated as public
- ❌ Non-`EXPO_PUBLIC_*` variables can be exposed if:
  - They're in `app.config.ts` `extra` object
  - They're referenced in client code via `process.env`
  - They're loaded by babel plugin

## Recommended Fixes

1. **Remove non-public vars from `app.config.ts` extra**
   - Only include `EXPO_PUBLIC_*` variables in the `extra` object
   - Use `EXPO_PUBLIC_POSTHOG_API_KEY` instead of `POSTHOG_KEY`

2. **Update analytics client**
   - Only use `EXPO_PUBLIC_POSTHOG_API_KEY` and `EXPO_PUBLIC_POSTHOG_HOST`
   - Remove fallback to non-public env vars

3. **Update babel config**
   - Add allowlist to only include `EXPO_PUBLIC_*` variables
   - Or use blocklist to exclude non-public vars

4. **Update deployment scripts**
   - Only export `EXPO_PUBLIC_*` variables during build
   - Use explicit allowlist when sourcing `.env` files

## Security Best Practices

- ✅ **DO**: Use `EXPO_PUBLIC_*` prefix for any variable that needs to be in the client
- ❌ **DON'T**: Put secrets in `app.config.ts` `extra` object
- ❌ **DON'T**: Reference non-public env vars in client code
- ❌ **DON'T**: Hardcode API keys or secrets in source code
- ✅ **DO**: Use server-side APIs for operations requiring secrets
- ✅ **DO**: Validate that only `EXPO_PUBLIC_*` vars are in the bundle

