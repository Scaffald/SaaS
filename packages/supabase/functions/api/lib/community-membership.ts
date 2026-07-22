/**
 * Pure helper for merging per-viewer membership state onto a page of
 * communities. Extracted so the list route's membership logic (#383) can be
 * unit tested without a live database.
 */

export interface CommunityLike {
  id: string;
}

/**
 * Returns a shallow copy of each community with `is_member` set based on
 * whether its id is present in `memberCommunityIds`.
 */
export function mergeMembership<T extends CommunityLike>(
  communities: T[],
  memberCommunityIds: Iterable<string>,
): (T & { is_member: boolean })[] {
  const ids = memberCommunityIds instanceof Set
    ? memberCommunityIds
    : new Set(memberCommunityIds);

  return communities.map((community) => ({
    ...community,
    is_member: ids.has(community.id),
  }));
}
