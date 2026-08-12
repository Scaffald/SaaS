import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { profileQueryKeys } from '@scf/core/utils/profile-query-keys'
import { invalidateProfileQueries } from '../profile-sync'

/**
 * Every query key a profile hook actually registers, spelled the way the hook
 * spells it. If a hook's key changes and the invalidator's does not, one of
 * these stops being invalidated and this file goes red.
 *
 * The previous version of this test asserted `toHaveBeenCalledTimes(11)` against
 * a bare mock. Nine of those eleven keys matched no query in the app, and the
 * test passed anyway — it never checked that a key corresponded to anything
 * real (#581). Hence a real QueryClient here.
 */
const REGISTERED_KEYS: ReadonlyArray<readonly unknown[]> = [
  profileQueryKeys.general(),
  profileQueryKeys.current(),
  profileQueryKeys.employment(),
  profileQueryKeys.education(),
  profileQueryKeys.educationLevel(),
  profileQueryKeys.experience(),
  profileQueryKeys.experienceSummary(),
  profileQueryKeys.certifications(),
  profileQueryKeys.certificationsTree(),
  profileQueryKeys.certificationsTopLevel({ limit: 10 }),
  profileQueryKeys.certificationsChildren('parent-1'),
  profileQueryKeys.slugHistory(),
  profileQueryKeys.slugCheck('marcus-rivera'),
  profileQueryKeys.widget('general', 'user-1'),
  profileQueryKeys.widget('experience', 'user-1'),
  profileQueryKeys.widget('skills', 'user-1'),
  ['user-profiles', 'detail', 'user-1'],
  ['scaffald', 'skills', 'multi-taxonomy'],
  ['scaffald', 'skills', 'soft'],
  ['scaffald', 'profiles', 'completion', 'status'],
  ['scaffald', 'profiles', 'import', 'data'],
]

function seed(): QueryClient {
  const queryClient = new QueryClient()
  for (const key of REGISTERED_KEYS) {
    queryClient.setQueryData(key, { seeded: true })
  }
  return queryClient
}

describe('invalidateProfileQueries', () => {
  it('invalidates every query a profile hook registers', async () => {
    const queryClient = seed()

    await invalidateProfileQueries(queryClient)

    const missed = REGISTERED_KEYS.filter(
      (key) => queryClient.getQueryState(key)?.isInvalidated !== true
    )

    expect(missed).toEqual([])
  })

  // The specific regression: keys were namespaced under 'scaffald' by the
  // invalidator but not by the hooks, so saving a section left the Profile
  // Overview widgets showing pre-save data until staleTime lapsed.
  it('invalidates the widget queries the Profile Overview renders', async () => {
    const queryClient = seed()

    await invalidateProfileQueries(queryClient)

    expect(
      queryClient.getQueryState(profileQueryKeys.widget('general', 'user-1'))?.isInvalidated
    ).toBe(true)
  })

  it('leaves unrelated queries alone', async () => {
    const queryClient = seed()
    queryClient.setQueryData(['jobs', 'list'], { seeded: true })
    queryClient.setQueryData(['communities', 'my'], { seeded: true })

    await invalidateProfileQueries(queryClient)

    expect(queryClient.getQueryState(['jobs', 'list'])?.isInvalidated).toBe(false)
    expect(queryClient.getQueryState(['communities', 'my'])?.isInvalidated).toBe(false)
  })

  it('resolves even when one invalidation rejects', async () => {
    const queryClient = seed()
    let calls = 0
    const original = queryClient.invalidateQueries.bind(queryClient)
    queryClient.invalidateQueries = ((filters?: Parameters<typeof original>[0]) => {
      calls += 1
      if (calls === 2) return Promise.reject(new Error('network'))
      return original(filters)
    }) as typeof queryClient.invalidateQueries

    await expect(invalidateProfileQueries(queryClient)).resolves.toBeUndefined()
  })
})
