import type { CommunityMember } from '@scaffald/sdk/resources/communities'

/** The picker shows a short list; search narrows it rather than scrolling. */
export const GIFT_RECIPIENT_LIMIT = 20

/**
 * Members the viewer can gift karma to, narrowed by a name/headline search.
 *
 * The viewer is a member of their own community, so the unfiltered list put
 * them first — offering a gift the api refuses with "Cannot gift karma to
 * yourself" (#1176). Member `id` is the user id (the members route flattens
 * memberships to the user), so it compares directly with the session user.
 */
export function giftRecipients(
  members: readonly CommunityMember[],
  viewerId: string | null | undefined,
  search: string,
  limit = GIFT_RECIPIENT_LIMIT
): CommunityMember[] {
  const others = viewerId ? members.filter((m) => m.id !== viewerId) : [...members]
  const q = search.trim().toLowerCase()
  const matched = q
    ? others.filter(
        (m) =>
          (m.display_name ?? '').toLowerCase().includes(q) ||
          (m.headline ?? '').toLowerCase().includes(q)
      )
    : others
  return matched.slice(0, limit)
}
