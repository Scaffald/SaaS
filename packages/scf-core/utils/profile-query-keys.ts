/**
 * Canonical react-query keys for every profile-backed query.
 *
 * There is exactly one reason this file exists: the hooks and the invalidator
 * used to spell the same query two different ways. `invalidateProfileQueries`
 * namespaced everything under `'scaffald'` while the hooks that registered the
 * queries did not, so nine of its eleven keys matched nothing and no profile
 * save revalidated anything (#581). Its test asserted `toHaveBeenCalledTimes(11)`
 * against a bare mock, so it could never fail on a wrong key.
 *
 * Import from here rather than writing a key literal. A literal is how the two
 * halves drifted apart in the first place.
 *
 * Note the two namespaces below are *both* real and both load-bearing — some
 * hooks were written against the SDK's `['scaffald', resource, …]` convention
 * and others against a bare `[resource, …]`. Unifying them is a separate,
 * larger change; what matters here is that one file is the source of truth.
 */

export const profileQueryKeys = {
  // --- bare-namespace keys -------------------------------------------------
  current: () => ['profiles', 'current'] as const,
  general: () => ['profiles', 'general'] as const,
  employment: () => ['profiles', 'employment'] as const,

  education: () => ['profiles', 'education'] as const,
  educationLevel: () => ['profiles', 'education', 'level'] as const,

  experience: () => ['profiles', 'experience'] as const,
  experienceSummary: () => ['profiles', 'experience', 'summary'] as const,

  certifications: () => ['profiles', 'certifications'] as const,
  certificationsTree: () => ['profiles', 'certifications', 'tree'] as const,
  certificationsTopLevel: (params?: unknown) =>
    ['profiles', 'certifications', 'top-level', params] as const,
  certificationsChildren: (parentId?: string) =>
    ['profiles', 'certifications', 'children', parentId] as const,

  slug: () => ['profiles', 'slug'] as const,
  slugFor: (slug?: string) => ['profiles', 'slug', slug] as const,
  slugCheck: (slug?: string) => ['profiles', 'slug', 'check', slug] as const,
  slugHistory: () => ['profiles', 'slug', 'history'] as const,

  widgets: () => ['profiles', 'widgets'] as const,
  widget: (name: string, userId?: string) => ['profiles', 'widgets', name, userId] as const,

  userProfiles: () => ['user-profiles'] as const,

  // --- 'scaffald'-namespace keys ------------------------------------------
  skills: () => ['scaffald', 'skills'] as const,
  completion: () => ['scaffald', 'profiles', 'completion'] as const,
  import: () => ['scaffald', 'profiles', 'import'] as const,
} as const

/**
 * Every root a profile edit can affect.
 *
 * Deliberately roots, not leaves: react-query matches by key prefix, so
 * `['profiles','certifications']` covers `tree`, `top-level` and `children`
 * without this list having to enumerate them.
 */
export const PROFILE_INVALIDATION_ROOTS: ReadonlyArray<readonly unknown[]> = [
  profileQueryKeys.general(),
  profileQueryKeys.current(),
  profileQueryKeys.employment(),
  profileQueryKeys.education(),
  profileQueryKeys.experience(),
  profileQueryKeys.certifications(),
  profileQueryKeys.slug(),
  profileQueryKeys.widgets(),
  profileQueryKeys.userProfiles(),
  profileQueryKeys.skills(),
  profileQueryKeys.completion(),
  profileQueryKeys.import(),
]
