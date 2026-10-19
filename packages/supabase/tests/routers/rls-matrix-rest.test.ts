/**
 * RLS persona matrix (#1147) — what each kind of caller can see, straight
 * through PostgREST, for the relations an access change is most likely to
 * break or open.
 *
 * Every tightening in #1155 risks the failure that shipped as #755, #654, #856
 * and #481: a legitimate caller quietly gets an empty list or a 403. Catalog
 * checks (security-fingerprint.mjs) prove what the grants are; this proves
 * what a request returns.
 *
 * Outcomes, for a GET with `limit=1` and `Prefer: count=exact`:
 *   rows    200 and at least one row
 *   none    200 and zero rows (RLS filtered everything)
 *   denied  401/403 — no grant, or EXECUTE revoked
 *
 * `{self}` in a filter becomes the persona's auth.uid().
 *
 * Adding a migration that changes access? Add its rows here FIRST, with the
 * outcome you intend, and watch them go red→green. To see what every persona
 * gets today:
 *
 *   RLS_MATRIX_RECORD=1 deno test --allow-all --no-check --config tests/deno.json \
 *     tests/routers/rls-matrix-rest.test.ts
 */

import { assertEquals } from '../shared/assert.ts'
import { type PersonaName, type Personas, disposePersonas, getPersonas } from '../shared/personas.ts'
import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, createAdminClient } from '../shared/setup.ts'

type Outcome = 'rows' | 'none' | 'denied'

interface Row {
  /** schema.relation, or schema.rpc/fn?args */
  target: string
  /** optional PostgREST filter, e.g. `user_id=neq.{self}` */
  filter?: string
  expect: Partial<Record<PersonaName, Outcome>>
  why: string
}

const Z = '00000000-0000-0000-0000-000000000000'
const SERVICE_ONLY: Row['expect'] = { anon: 'denied', userA: 'denied', orgAdmin: 'denied', office: 'denied', service: 'rows' }

const MATRIX: Row[] = [
  // --- Wave 0: service-only tables and secret RPCs (#1143, #1145) ----------------
  { target: 'core.stripe_settings', expect: SERVICE_ONLY, why: 'holds Vault secret ids; read only by the api function (#1145)' },
  { target: 'core.system_config', expect: SERVICE_ONLY, why: 'platform config; office reads it through /v1/office/settings (#856)' },
  {
    target: 'public.rpc/get_webhooks_for_event',
    filter: `p_organization_id=${Z}&p_event_type=probe`,
    expect: { anon: 'denied', userA: 'denied', office: 'denied', service: 'none' },
    why: 'returns webhook signing secrets (#1143)',
  },

  // --- Wave 0: per-user notification rows (#1144) -----------------------------
  {
    target: 'core.notification_preferences',
    filter: 'user_id=neq.{self}',
    expect: { anon: 'denied', userA: 'none', userB: 'none', orgAdmin: 'none', service: 'rows' },
    why: "nobody reads another user's preferences",
  },
  {
    target: 'core.notification_devices',
    filter: 'user_id=neq.{self}',
    expect: { anon: 'denied', userA: 'none', orgAdmin: 'none' },
    why: "push tokens are per-user",
  },

  // --- 306 (via 367): views run as the caller --------------------------------
  {
    target: 'core.v_profile_search',
    expect: { anon: 'denied', userA: 'rows', orgAdmin: 'rows', service: 'rows' },
    why: 'signed-in talent search works; anon no longer reads coordinates and rates',
  },

  // --- 369: definer functions by class (#1148) ---------------------------------
  {
    target: 'core.rpc/process_notification_queue',
    expect: { anon: 'denied', userA: 'denied', orgAdmin: 'denied' },
    why: 'a job: pg_cron runs it as postgres; visitors must not fire it',
  },
  {
    target: 'core.rpc/import_external_jobs',
    expect: { anon: 'denied', userA: 'denied' },
    why: 'a job that makes outbound HTTP requests',
  },
  {
    target: 'core.rpc/auto_reject_application',
    filter: `p_application_id=${Z}`,
    expect: { anon: 'denied', userA: 'denied' },
    why: 'state change, called only by the api with the service role',
  },
  {
    // is_org_member would be the obvious row, but it raises 42702 today (#1231).
    target: 'core.rpc/user_has_role',
    filter: `p_user_id={self}&p_role_name=worker&p_org_id=${Z}`,
    expect: { anon: 'denied', userA: 'rows' },
    why: 'RLS helper; only policies TO authenticated call it',
  },
  {
    target: 'core.rpc/pin_review',
    filter: `p_review_id=${Z}&p_position=1`,
    expect: { anon: 'denied' },
    why: 'review pins are a signed-in action',
  },
  {
    target: 'public.rpc/get_organizations_with_coords',
    expect: { anon: 'rows', userA: 'rows' },
    why: 'discover map, signed-out included — stays public (allow-listed)',
  },
  {
    target: 'public.rpc/calculate_years_of_experience',
    filter: 'p_user_id={self}',
    expect: { anon: 'rows', userA: 'rows' },
    why: 'public profile pages call it with the visitor client — stays public',
  },

  // --- 370: is_org_member resolves (#1231) -----------------------------------
  {
    target: 'core.rpc/is_org_member',
    filter: `org_id=${Z}&target_user={self}`,
    expect: { anon: 'denied', userA: 'rows', orgAdmin: 'rows' },
    why: '39 policies call it; it raised 42702 for every signed-in caller',
  },
  {
    target: 'core.organization_folders',
    expect: { anon: 'denied', userA: 'none', orgAdmin: 'rows' },
    why: 'an org admin reads its own folders; an outsider sees none (not a 400)',
  },

  // --- 374: the last client-readable definer view (#1149) ---------------------
  {
    target: 'public.v_active_cron_jobs',
    expect: { anon: 'denied', userA: 'denied', office: 'denied' },
    why: 'every cron command; nothing in the app reads it',
  },

  // --- reference data stays public (#1151 must keep this) --------------------
  // The seeds load no O*NET rows and no certifications, so `none` is the
  // healthy outcome there; `denied` would mean the read grant was lost.
  { target: 'onet.occupation_data', expect: { anon: 'none', userA: 'none' }, why: 'onboarding occupation picker' },
  { target: 'data.trades', expect: { anon: 'rows', userA: 'rows' }, why: 'onboarding trade picker' },
  { target: 'data.certifications', expect: { anon: 'none', userA: 'none' }, why: 'certification picker' },
  { target: 'data.universities', expect: { anon: 'none', userA: 'none' }, why: 'education history picker (not seeded)' },
  { target: 'data.masterformat', expect: { anon: 'rows', userA: 'rows' }, why: 'CSI MasterFormat skill tree' },

  // --- app paths that must keep working ---------------------------------------
  { target: 'core.users', filter: 'id=eq.{self}', expect: { userA: 'rows', orgAdmin: 'rows' }, why: 'own account row' },
  {
    target: 'core.applications',
    filter: 'user_id=neq.{self}',
    expect: { anon: 'denied', userA: 'none', userB: 'none', orgAdmin: 'rows' },
    why: "a worker never sees another worker's applications; an employer sees applicants to its jobs",
  },
  { target: 'core.api_keys', expect: { anon: 'denied', userA: 'none' }, why: 'org API keys' },

  // --- 392: core.jobs (#1317) — full per-role cases in jobs-read-rls-rest ------
  {
    target: 'core.jobs',
    filter: 'status=eq.draft',
    expect: { anon: 'none', userA: 'none', userB: 'none', office: 'rows', service: 'rows' },
    why: 'drafts reach their organisation and platform staff, not the anon key',
  },
  {
    target: 'core.jobs',
    filter: 'status=eq.open',
    expect: { anon: 'rows', userA: 'rows', office: 'rows' },
    why: 'signed-out job browse',
  },
  { target: 'public.webhooks', expect: { anon: 'denied', userA: 'none', service: 'none' }, why: 'org webhooks and their secrets; prod had no grants at all until 373' },
]

/**
 * Rows some matrix entries need and the seeds do not carry. Created with the
 * service role before the run, removed after it.
 */
async function fixtures(personas: Personas): Promise<() => Promise<void>> {
  const admin = createAdminClient()
  const { data: ra } = await admin
    .schema('core')
    .from('role_assignments')
    .select('scope_org_id')
    .eq('user_id', personas.orgAdmin.id)
    .not('scope_org_id', 'is', null)
    .limit(1)
    .single()
  if (!ra?.scope_org_id) throw new Error('orgAdmin persona has no organization (seeds/010)')
  const { data: folder, error } = await admin
    .schema('core')
    .from('organization_folders')
    // Unique per run: suites from parallel sessions share one local database.
    .insert({ organization_id: ra.scope_org_id, name: `rls-matrix-${crypto.randomUUID().slice(0, 8)}`, created_by: personas.orgAdmin.id })
    .select('id')
    .single()
  if (error) throw new Error(`fixture folder: ${error.message}`)
  return async () => {
    await admin.schema('core').from('organization_folders').delete().eq('id', folder.id)
  }
}

function url(target: string, filter: string | undefined, self: string) {
  const [schema, rest] = [target.slice(0, target.indexOf('.')), target.slice(target.indexOf('.') + 1)]
  const query = [filter?.replaceAll('{self}', self || Z), 'limit=1'].filter(Boolean).join('&')
  return { schema, href: `${TEST_SUPABASE_URL}/rest/v1/${rest}?${query}` }
}

async function outcome(row: Row, personas: Personas, who: PersonaName): Promise<string> {
  const p = personas[who]
  const { schema, href } = url(row.target, row.filter, p.id)
  const res = await fetch(href, {
    headers: {
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${p.token}`,
      'Accept-Profile': schema,
      Prefer: 'count=exact',
    },
  })
  const body = await res.text()
  if (res.status === 401 || res.status === 403) return 'denied'
  if (res.status !== 200 && res.status !== 206) return `error ${res.status} ${body.slice(0, 100)}`
  const total = Number(res.headers.get('content-range')?.split('/')[1])
  if (!Number.isNaN(total)) return total > 0 ? 'rows' : 'none'
  const parsed = JSON.parse(body)
  return (Array.isArray(parsed) ? parsed.length : parsed === null ? 0 : 1) > 0 ? 'rows' : 'none'
}

Deno.test({
  name: 'RLS matrix - each persona sees exactly what it should (#1147)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const personas = await getPersonas()
    const cleanup = await fixtures(personas)
    try {
      const record = Deno.env.get('RLS_MATRIX_RECORD') === '1'
      const all: PersonaName[] = ['anon', 'userA', 'userB', 'orgAdmin', 'office', 'service']
      const failures: string[] = []
      for (const row of MATRIX) {
        const label = `${row.target}${row.filter ? `?${row.filter}` : ''}`
        if (record) {
          const seen = await Promise.all(all.map(async (who) => `${who}=${await outcome(row, personas, who)}`))
          console.log(`${label.padEnd(60)} ${seen.join('  ')}`)
          continue
        }
        for (const [who, want] of Object.entries(row.expect) as [PersonaName, Outcome][]) {
          const got = await outcome(row, personas, who)
          if (got !== want) failures.push(`${label} as ${who}: expected ${want}, got ${got} — ${row.why}`)
        }
      }
      assertEquals(failures.join('\n'), '', 'persona matrix mismatches')
    } finally {
      await cleanup()
      await disposePersonas()
    }
  },
})
