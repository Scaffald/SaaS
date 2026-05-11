/**
 * Office Storage REST API
 * Office role required. Storage analytics for admin dashboard.
 */

import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth.ts'

const app = new Hono()
app.use('*', authMiddleware)
app.use('*', requireRole('office', 'platform'))

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

/**
 * GET /v1/office/storage/analytics
 * Get storage usage analytics across all users
 */
app.get('/analytics', async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  if (!supabaseAdmin) return c.json({ error: 'Service role required' }, 500)

  const { data: usageData, error: usageError } = await supabaseAdmin
    .schema('core')
    .from('user_storage_usage')
    .select(
      'user_id, total_bytes, work_log_photos_bytes, portfolio_photos_bytes, certification_files_bytes, storage_limit_bytes, updated_at'
    )
    .order('total_bytes', { ascending: false })

  if (usageError) {
    return c.json({ error: 'Failed to load storage usage', message: usageError.message }, 500)
  }

  const usageRows = (usageData ?? []) as Array<{
    user_id: string
    total_bytes: number | null
    work_log_photos_bytes: number | null
    portfolio_photos_bytes: number | null
    certification_files_bytes: number | null
    storage_limit_bytes: number | null
    updated_at: string | null
  }>

  let totalBytes = 0
  let workLogBytes = 0
  let portfolioBytes = 0
  let certificationBytes = 0
  let totalLimitBytes = 0
  let overLimitCount = 0
  let limitsConfiguredCount = 0
  let lastUpdatedAt: string | null = null

  for (const row of usageRows) {
    const total = toNumber(row.total_bytes)
    const workLogs = toNumber(row.work_log_photos_bytes)
    const portfolios = toNumber(row.portfolio_photos_bytes)
    const certifications = toNumber(row.certification_files_bytes)
    const limit = toNumber(row.storage_limit_bytes)

    totalBytes += total
    workLogBytes += workLogs
    portfolioBytes += portfolios
    certificationBytes += certifications

    if (limit > 0) {
      limitsConfiguredCount += 1
      totalLimitBytes += limit
      if (total > limit) overLimitCount += 1
    }

    if (row.updated_at) {
      if (!lastUpdatedAt || row.updated_at > lastUpdatedAt) lastUpdatedAt = row.updated_at
    }
  }

  const userCount = usageRows.length
  const averageBytes = userCount > 0 ? Math.round(totalBytes / userCount) : 0
  const utilizationPercent =
    totalLimitBytes > 0 ? Number(((totalBytes / totalLimitBytes) * 100).toFixed(1)) : null

  const topUsersSource = usageRows.slice(0, 50)
  const topUserIds = topUsersSource
    .map((row) => row.user_id)
    .filter((id, index, array) => Boolean(id) && array.indexOf(id) === index)

  // deno-lint-ignore no-explicit-any
  // biome-ignore lint/suspicious/noExplicitAny: Complex Supabase type inference
  let usersLookup = new Map<string, any>()

  if (topUserIds.length > 0) {
    const { data: usersData, error: usersError } = await supabaseAdmin
      .schema('core')
      .from('users')
      .select('id, display_name, username')
      .in('id', topUserIds)

    if (usersError) {
      return c.json({ error: 'Failed to load user profiles', message: usersError.message }, 500)
    }

    // deno-lint-ignore no-explicit-any
    // biome-ignore lint/suspicious/noExplicitAny: User row type mismatch
    usersLookup = new Map((usersData ?? []).map((user: any) => [user.id, user]))
  }

  const topUsers = topUsersSource.map((row) => {
    // deno-lint-ignore no-explicit-any
    // biome-ignore lint/suspicious/noExplicitAny: User lookup type
    const profile = usersLookup.get(row.user_id) as any
    const total = toNumber(row.total_bytes)
    const limit = toNumber(row.storage_limit_bytes)
    const usagePercentOfLimit = limit > 0 ? Number(((total / limit) * 100).toFixed(1)) : null

    return {
      userId: row.user_id,
      displayName: profile?.display_name ?? null,
      username: profile?.username ?? null,
      totalBytes: total,
      workLogBytes: toNumber(row.work_log_photos_bytes),
      portfolioBytes: toNumber(row.portfolio_photos_bytes),
      certificationBytes: toNumber(row.certification_files_bytes),
      storageLimitBytes: limit > 0 ? limit : null,
      usagePercentOfLimit,
      updatedAt: row.updated_at,
    }
  })

  const breakdownTotals = [
    { key: 'Work log photos', bytes: workLogBytes },
    { key: 'Portfolio media', bytes: portfolioBytes },
    { key: 'Certification files', bytes: certificationBytes },
  ]

  const knownBytes = workLogBytes + portfolioBytes + certificationBytes
  const otherBytes = Math.max(totalBytes - knownBytes, 0)
  if (otherBytes > 0) breakdownTotals.push({ key: 'Unattributed', bytes: otherBytes })

  const breakdown = breakdownTotals.map((entry) => ({
    label: entry.key,
    bytes: entry.bytes,
    percent: totalBytes > 0 ? Number(((entry.bytes / totalBytes) * 100).toFixed(1)) : 0,
  }))

  return c.json({
    totals: {
      totalBytes,
      workLogBytes,
      portfolioBytes,
      certificationBytes,
      userCount,
      averageBytes,
      totalLimitBytes,
      utilizationPercent,
      overLimitCount,
      limitsConfiguredCount,
      lastUpdatedAt,
    },
    topUsers,
    breakdown,
  })
})

export default app
