import { TRPCError } from '@trpc/server'

import { officeProcedure, t } from '../../middleware.ts'

type UsageRow = {
  user_id: string
  total_bytes: number | null
  work_log_photos_bytes: number | null
  portfolio_photos_bytes: number | null
  certification_files_bytes: number | null
  storage_limit_bytes: number | null
  updated_at: string | null
}

type UserRow = {
  id: string
  display_name: string | null
  username: string | null
}

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

export const officeStorageRouter = t.router({
  analytics: officeProcedure.query(async ({ ctx }) => {
    const { supabaseAdmin } = ctx

    const { data: usageData, error: usageError } = await supabaseAdmin
      .schema('core')
      .from('user_storage_usage')
      .select(
        'user_id, total_bytes, work_log_photos_bytes, portfolio_photos_bytes, certification_files_bytes, storage_limit_bytes, updated_at'
      )
      .order('total_bytes', { ascending: false })

    if (usageError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load storage usage: ${usageError.message}`,
      })
    }

    const usageRows: UsageRow[] = (usageData ?? []).map((row: { user_id: string; total_bytes: number; work_log_photos_bytes: number; portfolio_photos_bytes: number; certification_files_bytes: number; storage_limit_bytes: number; updated_at: string; [key: string]: unknown }) => ({
      user_id: row.user_id,
      total_bytes: row.total_bytes,
      work_log_photos_bytes: row.work_log_photos_bytes,
      portfolio_photos_bytes: row.portfolio_photos_bytes,
      certification_files_bytes: row.certification_files_bytes,
      storage_limit_bytes: row.storage_limit_bytes,
      updated_at: row.updated_at,
    }))

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
        if (total > limit) {
          overLimitCount += 1
        }
      }

      if (row.updated_at) {
        if (!lastUpdatedAt || row.updated_at > lastUpdatedAt) {
          lastUpdatedAt = row.updated_at
        }
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

    let usersLookup = new Map<string, UserRow>()

    if (topUserIds.length > 0) {
      const { data: usersData, error: usersError } = await supabaseAdmin
        .schema('core')
        .from('users')
        .select('id, display_name, username')
        .in('id', topUserIds)

      if (usersError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load user profiles: ${usersError.message}`,
        })
      }

      usersLookup = new Map((usersData ?? []).map((user: { id: string; display_name?: string | null; username?: string | null; [key: string]: unknown }) => [user.id, user]))
    }

    const topUsers = topUsersSource.map((row) => {
      const profile = usersLookup.get(row.user_id)
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
      {
        key: 'Work log photos',
        bytes: workLogBytes,
      },
      {
        key: 'Portfolio media',
        bytes: portfolioBytes,
      },
      {
        key: 'Certification files',
        bytes: certificationBytes,
      },
    ]

    const knownBytes = workLogBytes + portfolioBytes + certificationBytes
    const otherBytes = Math.max(totalBytes - knownBytes, 0)

    if (otherBytes > 0) {
      breakdownTotals.push({
        key: 'Unattributed',
        bytes: otherBytes,
      })
    }

    const breakdown = breakdownTotals.map((entry) => ({
      label: entry.key,
      bytes: entry.bytes,
      percent: totalBytes > 0 ? Number(((entry.bytes / totalBytes) * 100).toFixed(1)) : 0,
    }))

    return {
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
    }
  }),
})
