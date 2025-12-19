import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '../database.types';

type SupabaseAdminClient = SupabaseClient<Database>

interface RefreshTeamMetricsOptions {
  supabaseAdmin: SupabaseAdminClient
  teamId: string
  metricDate?: string
  captureWorkloads?: boolean
}

export async function refreshTeamMetricsSnapshot({
  supabaseAdmin,
  teamId,
  metricDate,
  captureWorkloads = true,
}: RefreshTeamMetricsOptions) {
  const admin = supabaseAdmin as SupabaseClient<Database>
  const { data, error } = await admin.rpc('refresh_team_daily_metrics', {
    p_team_id: teamId,
    p_metric_date: metricDate ?? null,
    p_capture_workloads: captureWorkloads,
  })

  if (error) {
    console.error('[team-metrics] Failed to refresh team metrics', {
      teamId,
      metricDate,
      message: error.message,
    })
    throw error
  }

  return data
}

export async function refreshAllTeamMetrics({
  supabaseAdmin,
  metricDate,
}: {
  supabaseAdmin: SupabaseAdminClient
  metricDate?: string
}) {
  const admin = supabaseAdmin as SupabaseClient<Database>
  const { data, error } = await admin.rpc('refresh_all_team_metrics', {
    p_metric_date: metricDate ?? null,
  })

  if (error) {
    console.error('[team-metrics] Failed to refresh all team metrics', {
      metricDate,
      message: error.message,
    })
    throw error
  }

  return data
}
