import { PROFILE_INVALIDATION_ROOTS } from '@scf/core/utils/profile-query-keys'
import type { QueryClient } from '@tanstack/react-query'

/**
 * Invalidate everything a profile edit can affect.
 *
 * The roots come from the same factory the hooks register their queries with —
 * see profile-query-keys.ts for why that indirection is not ceremony. This
 * helper previously listed its own `['scaffald', 'profiles', …]` literals while
 * the hooks used `['profiles', …]`, so nine of eleven keys matched no query at
 * all and saving a profile section revalidated nothing (#581).
 */
export async function invalidateProfileQueries(queryClient: QueryClient): Promise<void> {
  await Promise.allSettled(
    PROFILE_INVALIDATION_ROOTS.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  )
}
