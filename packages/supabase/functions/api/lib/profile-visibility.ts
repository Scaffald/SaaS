/**
 * Which sections of someone else's profile a viewer may read.
 *
 * The public profile page already works this way: GET /v1/profiles/slug/{slug}
 * serves anonymously and returns a `visibility` object saying which sections to
 * render. The page then fetches each permitted section — and those endpoints
 * answered 401 to anonymous callers, so every public profile rendered "No
 * profile data available" for a profile that had data (#732).
 *
 * So the product decision is not open: it is encoded in
 * core.preferences.profile_visibility, with the defaults below. This module is
 * that rule, in one place, rather than copied into each section handler.
 */

export interface ProfileVisibility {
  work_experience: boolean;
  education: boolean;
  skills: boolean;
  certifications: boolean;
  reviews: boolean;
  contact_info: boolean;
}

/**
 * What a viewer sees when the owner has expressed no preference.
 *
 * Matches the defaults in profiles.ts GET /slug/{slug} exactly — if these two
 * ever disagree, the page renders a section the data endpoint then refuses, or
 * hides one it would have served.
 */
export const DEFAULT_PROFILE_VISIBILITY: ProfileVisibility = {
  work_experience: true,
  education: true,
  skills: true,
  certifications: true,
  reviews: true,
  contact_info: false,
};

export type ProfileSection = keyof ProfileVisibility;

// deno-lint-ignore no-explicit-any
type SupabaseLike = any;

/**
 * Read a user's section visibility.
 *
 * core.preferences is RLS-scoped to its owner (preferences_own_all), so a
 * viewer's own client reads nothing and every section would silently fall back
 * to the permissive default — which would leak a section the owner had hidden.
 * The service client is therefore required for correctness here, not for
 * convenience. profiles.ts reads it the same way, for the same reason.
 */
export async function loadProfileVisibility(
  serviceClient: SupabaseLike,
  userId: string,
): Promise<ProfileVisibility> {
  const { data } = await serviceClient
    .schema("core")
    .from("preferences")
    .select("profile_visibility")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data?.profile_visibility) return { ...DEFAULT_PROFILE_VISIBILITY };
  return { ...DEFAULT_PROFILE_VISIBILITY, ...data.profile_visibility };
}

export interface AudienceRequest {
  /** The profile being asked about, if the caller named one. */
  requestedUserId?: string;
  /** The signed-in caller, if there is one. */
  viewerId?: string;
}

export type Audience =
  /** No target can be resolved — "me" was meant, and nobody is signed in. */
  | { kind: "unauthenticated" }
  /** The caller is reading their own profile; no section gating applies. */
  | { kind: "self"; userId: string }
  /** Somebody else's profile; section visibility decides what is returned. */
  | { kind: "other"; userId: string };

/**
 * Decide whose profile is being requested, and on what footing.
 *
 * The section endpoints take an optional `userId` and fall back to the caller's
 * own id. That fallback is why they required auth at all — without a caller
 * there is no "me" to default to. An explicit `userId` needs no such fallback,
 * which is what makes anonymous reads of a public profile possible.
 */
export function resolveAudience(
  { requestedUserId, viewerId }: AudienceRequest,
): Audience {
  const target = requestedUserId ?? viewerId;
  if (!target) return { kind: "unauthenticated" };
  if (viewerId && target === viewerId) return { kind: "self", userId: target };
  return { kind: "other", userId: target };
}

/** Whether `audience` may read `section`. Own profile is always readable. */
export function canViewSection(
  audience: Audience,
  section: ProfileSection,
  visibility: ProfileVisibility,
): boolean {
  if (audience.kind === "unauthenticated") return false;
  if (audience.kind === "self") return true;
  return visibility[section] === true;
}
