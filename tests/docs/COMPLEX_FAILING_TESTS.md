# Complex Failing Tests

> **⚠️ This document has been consolidated into [TODO.md](./TODO.md)**
> 
> See TODO.md for the current prioritized list of test work including:
> - Deno Edge Functions type checking (Priority 1)
> - Vitest unit test fixes (Priority 2)
> - E2E test re-enablement (Priority 3)

## Quick Reference

**Current Test Status:** ~290 failing | ~410 passing (705 total)

### Main Blockers

1. **Deno Types:** 460 errors - See `packages/supabase/functions/DENO_TYPE_CHECKING.md`
2. **Vitest `typeof` Error:** Blocks tests importing `routes.ts` 
3. **Empty Body Rendering:** ~150 component tests render empty body

See [TODO.md](./TODO.md) for full details and action items.
