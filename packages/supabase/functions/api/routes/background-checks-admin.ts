/**
 * Background Checks Admin REST API
 * Office role required. Migrated from tRPC backgroundChecks.admin* procedures.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../middleware/auth.ts'

const app = new Hono()
app.use('*', authMiddleware)
app.use('*', requireRole('office', 'platform'))

// Admin check-type schema (matches tRPC)
const adminCheckTypeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  display_name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  provider_check_code: z.string().nullable(),
  validity_days: z.number().nullable(),
  platform_cost_cents: z.number(),
  retail_cost_cents: z.number().nullable(),
  estimated_completion_days: z.number().nullable(),
  required_documents: z.array(z.string()),
  provider_configuration: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

type AdminCheckType = z.infer<typeof adminCheckTypeSchema>

const adminPackageSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  display_name: z.string(),
  description: z.string().nullable(),
  provider_package_code: z.string().nullable(),
  check_type_ids: z.array(z.string().uuid()),
  component_overrides: z.array(z.record(z.string(), z.unknown())).default([]),
  platform_cost_cents: z.number(),
  retail_cost_cents: z.number(),
  estimated_completion_days: z.number().nullable(),
  is_active: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
  components: z.array(
    adminCheckTypeSchema.pick({
      id: true,
      slug: true,
      display_name: true,
      category: true,
      validity_days: true,
      estimated_completion_days: true,
      platform_cost_cents: true,
      retail_cost_cents: true,
      is_active: true,
    })
  ),
})

function mapAdminCheckType(row: Record<string, unknown>): AdminCheckType {
  const requiredDocuments = Array.isArray(row.required_documents)
    ? row.required_documents.filter((d: unknown): d is string => typeof d === 'string')
    : []
  const providerConfiguration =
    row.provider_configuration && typeof row.provider_configuration === 'object' && !Array.isArray(row.provider_configuration)
      ? (row.provider_configuration as Record<string, unknown>)
      : {}
  const metadata =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {}
  return adminCheckTypeSchema.parse({
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    description: row.description ?? null,
    category: row.category ?? null,
    provider_check_code: row.provider_check_code ?? null,
    validity_days: row.validity_days ?? null,
    platform_cost_cents: row.platform_cost_cents,
    retail_cost_cents: row.retail_cost_cents ?? null,
    estimated_completion_days: row.estimated_completion_days ?? null,
    required_documents: requiredDocuments,
    provider_configuration: providerConfiguration,
    metadata,
    is_active: Boolean(row.is_active ?? true),
    created_at: row.created_at,
    updated_at: row.updated_at,
  })
}

function mapAdminPackage(row: Record<string, unknown>, typeMap: Map<string, AdminCheckType>) {
  const metadata =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {}
  const componentOverrides = Array.isArray(row.component_overrides) ? row.component_overrides : []
  const checkTypeIds = (row.check_type_ids ?? []).filter((v: unknown): v is string => typeof v === 'string')
  const components = checkTypeIds.map((id) => typeMap.get(id)).filter(Boolean) as AdminCheckType[]
  return adminPackageSchema.parse({
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    description: row.description ?? null,
    provider_package_code: row.provider_package_code ?? null,
    check_type_ids: checkTypeIds,
    component_overrides: componentOverrides,
    platform_cost_cents: row.platform_cost_cents,
    retail_cost_cents: row.retail_cost_cents,
    estimated_completion_days: row.estimated_completion_days ?? null,
    is_active: Boolean(row.is_active ?? true),
    metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
    components,
  })
}

// GET /admin/packages
app.get('/packages', async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  if (!supabaseAdmin) return c.json({ error: 'Admin client not available' }, 500)

  const { data: packageRows, error: pkgError } = await supabaseAdmin
    .schema('core')
    .from('background_check_packages')
    .select(
      'id, slug, display_name, description, provider_package_code, check_type_ids, component_overrides, platform_cost_cents, retail_cost_cents, estimated_completion_days, is_active, metadata, created_at, updated_at'
    )
    .order('display_name', { ascending: true })

  if (pkgError) return c.json({ error: 'Failed to fetch packages', message: pkgError.message }, 500)

  const rows = packageRows ?? []
  if (rows.length === 0) return c.json({ data: [] })

  const typeIds = new Set<string>()
  for (const pkg of rows) {
    for (const id of pkg.check_type_ids ?? []) {
      if (typeof id === 'string') typeIds.add(id)
    }
  }

  let typeMap = new Map<string, AdminCheckType>()
  if (typeIds.size > 0) {
    const { data: typeRows, error: typeError } = await supabaseAdmin
      .schema('core')
      .from('background_check_types')
      .select(
        'id, slug, display_name, description, category, provider_check_code, validity_days, platform_cost_cents, retail_cost_cents, estimated_completion_days, required_documents, provider_configuration, metadata, is_active, created_at, updated_at'
      )
      .in('id', Array.from(typeIds))

    if (typeError) return c.json({ error: 'Failed to fetch check types', message: typeError.message }, 500)
    typeMap = new Map(
      (typeRows ?? []).map((r) => [r.id, mapAdminCheckType(r as Record<string, unknown>)] as [string, AdminCheckType])
    )
  }

  const packages = rows.map((r) => mapAdminPackage(r as Record<string, unknown>, typeMap))

  return c.json({ data: packages })
})

// GET /admin/check-types
app.get('/check-types', async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  if (!supabaseAdmin) return c.json({ error: 'Admin client not available' }, 500)

  const { data, error } = await supabaseAdmin
    .schema('core')
    .from('background_check_types')
    .select(
      'id, slug, display_name, description, category, provider_check_code, validity_days, platform_cost_cents, retail_cost_cents, estimated_completion_days, required_documents, provider_configuration, metadata, is_active, created_at, updated_at'
    )
    .order('display_name', { ascending: true })

  if (error) return c.json({ error: 'Failed to fetch check types', message: error.message }, 500)

  const types = (data ?? []).map((r) => mapAdminCheckType(r as Record<string, unknown>))
  return c.json({ data: types })
})

const upsertCheckTypeSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  display_name: z.string().min(1).max(180),
  description: z.string().max(2000).nullable().optional(),
  category: z.string().max(120).nullable().optional(),
  provider_check_code: z.string().max(120).nullable().optional(),
  validity_days: z.number().int().positive().nullable().optional(),
  platform_cost_cents: z.number().int().min(0),
  retail_cost_cents: z.number().int().min(0).nullable().optional(),
  estimated_completion_days: z.number().int().min(0).nullable().optional(),
  required_documents: z.array(z.string().min(1)).optional(),
  provider_configuration: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
})

const upsertPackageSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  display_name: z.string().min(1).max(180),
  description: z.string().max(2000).nullable().optional(),
  provider_package_code: z.string().max(120).nullable().optional(),
  check_type_ids: z.array(z.string().uuid()).min(1),
  platform_cost_cents: z.number().int().min(0),
  retail_cost_cents: z.number().int().min(0),
  estimated_completion_days: z.number().int().min(0).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  component_overrides: z.array(z.record(z.string(), z.unknown())).optional(),
  is_active: z.boolean().optional(),
})

// POST /admin/check-types (upsert)
app.post('/check-types', zValidator('json', upsertCheckTypeSchema), async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  if (!supabaseAdmin) return c.json({ error: 'Admin client not available' }, 500)

  const input = c.req.valid('json')
  const payload = {
    slug: input.slug,
    display_name: input.display_name,
    description: input.description ?? null,
    category: input.category ?? null,
    provider_check_code: input.provider_check_code ?? null,
    validity_days: input.validity_days ?? null,
    platform_cost_cents: input.platform_cost_cents,
    retail_cost_cents: input.retail_cost_cents ?? null,
    estimated_completion_days: input.estimated_completion_days ?? null,
    required_documents: input.required_documents?.filter((d) => d.trim().length > 0) ?? [],
    provider_configuration: input.provider_configuration ?? {},
    metadata: input.metadata ?? {},
    is_active: input.is_active ?? true,
  }

  const cols =
    'id, slug, display_name, description, category, provider_check_code, validity_days, platform_cost_cents, retail_cost_cents, estimated_completion_days, required_documents, provider_configuration, metadata, is_active, created_at, updated_at'

  let result: { data: unknown; error: { message?: string } | null }
  if (input.id) {
    result = await supabaseAdmin
      .schema('core')
      .from('background_check_types')
      .update(payload)
      .eq('id', input.id)
      .select(cols)
      .maybeSingle()
  } else {
    result = await supabaseAdmin
      .schema('core')
      .from('background_check_types')
      .insert(payload)
      .select(cols)
      .maybeSingle()
  }

  if (result.error || !result.data) {
    return c.json({ error: 'Failed to save check type', message: result.error?.message }, 500)
  }

  const mapped = mapAdminCheckType(result.data as Record<string, unknown>)
  return c.json({ data: mapped }, input.id ? 200 : 201)
})

// POST /admin/packages (upsert)
app.post('/packages', zValidator('json', upsertPackageSchema), async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  if (!supabaseAdmin) return c.json({ error: 'Admin client not available' }, 500)

  const input = c.req.valid('json')
  const payload = {
    slug: input.slug,
    display_name: input.display_name,
    description: input.description ?? null,
    provider_package_code: input.provider_package_code ?? null,
    check_type_ids: input.check_type_ids,
    component_overrides: Array.isArray(input.component_overrides) ? input.component_overrides : [],
    platform_cost_cents: input.platform_cost_cents,
    retail_cost_cents: input.retail_cost_cents,
    estimated_completion_days: input.estimated_completion_days ?? null,
    metadata: input.metadata ?? {},
    is_active: input.is_active ?? true,
  }

  const cols =
    'id, slug, display_name, description, provider_package_code, check_type_ids, component_overrides, platform_cost_cents, retail_cost_cents, estimated_completion_days, is_active, metadata, created_at, updated_at'

  let result: { data: unknown; error: { message?: string } | null }
  if (input.id) {
    result = await supabaseAdmin
      .schema('core')
      .from('background_check_packages')
      .update(payload)
      .eq('id', input.id)
      .select(cols)
      .maybeSingle()
  } else {
    result = await supabaseAdmin
      .schema('core')
      .from('background_check_packages')
      .insert(payload)
      .select(cols)
      .maybeSingle()
  }

  if (result.error || !result.data) {
    return c.json({ error: 'Failed to save package', message: result.error?.message }, 500)
  }

  const row = result.data as Record<string, unknown>
  const checkTypeIds = (row.check_type_ids ?? []).filter((v: unknown): v is string => typeof v === 'string')
  const { data: typeRows } = await supabaseAdmin
    .schema('core')
    .from('background_check_types')
    .select(
      'id, slug, display_name, description, category, provider_check_code, validity_days, platform_cost_cents, retail_cost_cents, estimated_completion_days, required_documents, provider_configuration, metadata, is_active, created_at, updated_at'
    )
    .in('id', checkTypeIds.length > 0 ? checkTypeIds : ['00000000-0000-0000-0000-000000000000'])

  const typeMap = new Map(
    (typeRows ?? []).map((r) => [r.id, mapAdminCheckType(r as Record<string, unknown>)] as [string, AdminCheckType])
  )
  const mapped = mapAdminPackage(row, typeMap)

  return c.json({ data: mapped }, input.id ? 200 : 201)
})

// PATCH /admin/check-types/:id/active
app.patch(
  '/check-types/:id/active',
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', z.object({ is_active: z.boolean() })),
  async (c) => {
    const supabaseAdmin = c.get('supabaseAdmin')
    if (!supabaseAdmin) return c.json({ error: 'Admin client not available' }, 500)

    const { id } = c.req.valid('param')
    const { is_active } = c.req.valid('json')

    const { error } = await supabaseAdmin
      .schema('core')
      .from('background_check_types')
      .update({ is_active })
      .eq('id', id)

    if (error) return c.json({ error: 'Failed to update', message: error.message }, 500)
    return c.json({ data: { success: true } })
  }
)

// PATCH /admin/packages/:id/active
app.patch(
  '/packages/:id/active',
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', z.object({ is_active: z.boolean() })),
  async (c) => {
    const supabaseAdmin = c.get('supabaseAdmin')
    if (!supabaseAdmin) return c.json({ error: 'Admin client not available' }, 500)

    const { id } = c.req.valid('param')
    const { is_active } = c.req.valid('json')

    const { error } = await supabaseAdmin
      .schema('core')
      .from('background_check_packages')
      .update({ is_active })
      .eq('id', id)

    if (error) return c.json({ error: 'Failed to update', message: error.message }, 500)
    return c.json({ data: { success: true } })
  }
)

export default app
