/**
 * Who may act on an application from the hiring side.
 *
 * Extracted from the two message handlers in routes/applications.ts, which were
 * the only place in the applications surface that got employer-side access
 * right. Every other handler (`GET /`, `GET /{id}`, `PATCH /{id}`,
 * `GET /{id}/activity`) compared `application.user_id === user.id` and 403'd a
 * recruiter looking at their own organisation's pipeline.
 *
 * ─── On the role allow-list ────────────────────────────────────────────────
 *
 * The original block accepted *any* `role_assignments` row scoped to the org,
 * with no role filter. Today that is equivalent to "org admin", because `admin`
 * is the only organisation-scoped role with assignments. But `member` exists in
 * core.roles, and the day someone assigns it, that check silently widens.
 *
 * Reading a message thread you are already party to is a narrow grant. Listing
 * every applicant's profile, screening answers and contact details is not. So
 * this helper makes the requirement explicit per call site rather than
 * inheriting a permissive default:
 *
 *   - `allowedRoles: undefined` reproduces the original behaviour (any
 *     org-scoped assignment). Used by the message handlers so extracting this
 *     changes nothing about who can read a thread.
 *   - `allowedRoles: ["admin"]` is what the pipeline endpoints pass.
 *
 * If recruiters are meant to hold `member` rather than `admin`, widening is a
 * one-line change at the call site — but it should be a decision, not a
 * default.
 */

export interface ApplicationAccess {
  /** The row exists. When false, the caller should 404. */
  found: boolean;
  /** The authenticated user submitted this application. */
  isApplicant: boolean;
  /** The user owns, or holds an accepted role in, the hiring organisation. */
  hasOrgAccess: boolean;
  /** Organisation that posted the job, when resolvable. */
  organizationId: string | null;
  /**
   * Who submitted the application. Handlers need this beyond the access
   * decision — the message thread labels each author applicant vs recruiter by
   * comparing against it — so returning it here saves a second read.
   */
  applicantUserId: string | null;
}

export interface ResolveAccessOptions {
  /**
   * Organisation role names that grant access. Omit to accept any
   * organisation-scoped role assignment — only appropriate for grants that are
   * already narrow. Pass an explicit list for anything touching applicant PII.
   */
  allowedRoles?: string[];
  /**
   * Client used to *look up* the application row, when that differs from the
   * one used for the caller's own reads.
   *
   * The lookup exists only to answer "who is this application's applicant, and
   * which organisation posted the job" so the decision below can be made. Doing
   * it through the request's RLS client conflates two questions: RLS on
   * `core.applications` recognises the organisation *owner*, so an org `admin`
   * — exactly who PIPELINE_ROLES admits — found no row and every caller
   * reported 404. Measured on dev: an application visible in
   * `GET /v1/employer/applications` returned 404 from
   * `GET /v1/employer/applications/{id}` for the same user.
   *
   * Passing a service-role client here does not widen access. The decision is
   * unchanged — `isApplicant` and `hasOrgAccess` are computed exactly as
   * before, and callers still choose what to return. It only stops RLS
   * silently answering a question it was not asked (#544).
   */
  readClient?: SupabaseLike;
}

/** Shape the access query needs. Kept loose: this runs under Deno with an
 *  untyped Supabase client (see #477). */
// deno-lint-ignore no-explicit-any
type SupabaseLike = any;

const ACCESS_SELECT =
  "id, user_id, job_id, job:jobs!job_id(organization_id, organization:organizations!organization_id(owner_user_id))";

/**
 * Resolve what the user may do with a single application.
 *
 * Never throws on a missing row — returns `found: false` so the caller decides
 * between 404 and 403. Handlers should 404 rather than 403 on a missing row, so
 * that a stranger cannot probe which application IDs exist.
 */
export async function resolveApplicationOrgAccess(
  supabase: SupabaseLike,
  userId: string,
  applicationId: string,
  options: ResolveAccessOptions = {},
): Promise<ApplicationAccess> {
  const { data: application } = await (options.readClient ?? supabase)
    .schema("core")
    .from("applications")
    .select(ACCESS_SELECT)
    .eq("id", applicationId)
    .single();

  if (!application) {
    return {
      found: false,
      isApplicant: false,
      hasOrgAccess: false,
      organizationId: null,
      applicantUserId: null,
    };
  }

  const job = application.job as
    | {
      organization_id?: string;
      organization?: { owner_user_id?: string } | null;
    }
    | null;

  const organizationId = job?.organization_id ?? null;
  const applicantUserId = (application.user_id as string) ?? null;
  const isApplicant = applicantUserId === userId;

  if (isApplicant) {
    return {
      found: true,
      isApplicant: true,
      hasOrgAccess: false,
      organizationId,
      applicantUserId,
    };
  }

  const hasOrgAccess = await userHasOrgAccess(
    supabase,
    userId,
    organizationId,
    job?.organization?.owner_user_id ?? null,
    options,
  );

  return {
    found: true,
    isApplicant: false,
    hasOrgAccess,
    organizationId,
    applicantUserId,
  };
}

/**
 * Whether a user may act on behalf of an organisation.
 *
 * Owner short-circuits without a query. Otherwise a role assignment scoped to
 * the org must exist, and — when `allowedRoles` is given — must name one of
 * those roles.
 */
export async function userHasOrgAccess(
  supabase: SupabaseLike,
  userId: string,
  organizationId: string | null,
  ownerUserId: string | null,
  options: ResolveAccessOptions = {},
): Promise<boolean> {
  if (ownerUserId && ownerUserId === userId) return true;
  if (!organizationId) return false;

  const { allowedRoles } = options;

  // Without a role filter this is the original behaviour: membership of any
  // kind. With one, the join lets us name the roles that qualify.
  if (!allowedRoles) {
    const { data } = await supabase
      .schema("core")
      .from("role_assignments")
      .select("id")
      .eq("user_id", userId)
      .eq("scope_org_id", organizationId)
      .maybeSingle();

    return !!data;
  }

  if (allowedRoles.length === 0) return false;

  const { data } = await supabase
    .schema("core")
    .from("role_assignments")
    .select("id, role:roles!role_id(name)")
    .eq("user_id", userId)
    .eq("scope_org_id", organizationId);

  const rows = (data ?? []) as Array<{ role?: { name?: string } | null }>;

  return rows.some((row) => {
    const name = row.role?.name;
    return !!name && allowedRoles.includes(name);
  });
}

/**
 * Organisations the user may act for, as owner or via an accepted role.
 *
 * The pipeline list needs this up front: it filters jobs by organisation rather
 * than checking one application at a time.
 */
export async function listAccessibleOrganizationIds(
  supabase: SupabaseLike,
  userId: string,
  options: ResolveAccessOptions = {},
): Promise<string[]> {
  const ids = new Set<string>();

  const { data: owned } = await supabase
    .schema("core")
    .from("organizations")
    .select("id")
    .eq("owner_user_id", userId);

  for (const row of (owned ?? []) as Array<{ id: string }>) {
    ids.add(row.id);
  }

  const query = supabase
    .schema("core")
    .from("role_assignments")
    .select("scope_org_id, role:roles!role_id(name)")
    .eq("user_id", userId)
    .not("scope_org_id", "is", null);

  const { data: assignments } = await query;

  const { allowedRoles } = options;
  const rows = (assignments ?? []) as Array<
    { scope_org_id: string | null; role?: { name?: string } | null }
  >;

  for (const row of rows) {
    if (!row.scope_org_id) continue;
    if (allowedRoles && !allowedRoles.includes(row.role?.name ?? "")) continue;
    ids.add(row.scope_org_id);
  }

  return [...ids];
}

/**
 * Roles that may work an organisation's hiring pipeline.
 *
 * Named rather than inlined so there is one place to widen it if recruiters
 * turn out to hold `member`.
 */
export const PIPELINE_ROLES = ["admin"];
