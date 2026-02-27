import { supabase } from '@scf/core/utils/supabase/client'
import type { Database } from '@scf/supabase/types'
import type { ViewportBounds } from '@scaffald/ui'
import { useQuery } from '@tanstack/react-query'
import type { TalentProfile } from '../types'

// Type for the v_profile_search view with additional fields we select
type ProfileSearchRow = Database['core']['Views']['v_profile_search']['Row'] & {
  certifications?: string[] | null
  hourly_rate_cents?: number | null
  longitude?: number | null
  latitude?: number | null
  location?: string | null
  calculatedYearsOfExperience?: number | null
}

type VerificationBadgeRow = Database['core']['Views']['v_id_verification_latest']['Row']

function buildVerificationBadge(row: VerificationBadgeRow | undefined) {
  if (!row?.badge_status) {
    return null
  }

  const formatDate = (value: string | null | undefined) => {
    if (!value) return null
    try {
      return new Date(value).toLocaleDateString()
    } catch {
      return null
    }
  }

  const expiresOn = formatDate(row.badge_expires_at ?? undefined)

  if (row.badge_status === 'active') {
    return {
      id: `id-verification-${row.worker_user_id}`,
      label: expiresOn ? `ID Verified · exp ${expiresOn}` : 'ID Verified',
      tone: 'success' as const,
    }
  }

  if (row.badge_status === 'expired') {
    return {
      id: `id-verification-${row.worker_user_id}`,
      label: 'ID badge expired',
      tone: 'warning' as const,
    }
  }

  if (row.badge_status === 'revoked') {
    return {
      id: `id-verification-${row.worker_user_id}`,
      label: 'ID badge revoked',
      tone: 'danger' as const,
    }
  }

  return null
}

interface UseTalentProfilesOptions {
  bounds?: ViewportBounds | null
  limit?: number
  enabled?: boolean
}

type TalentProfilesQueryOptions = Pick<UseTalentProfilesOptions, 'bounds' | 'limit'>

export const buildTalentProfilesQuery = (options: TalentProfilesQueryOptions = {}) => {
  const { bounds = null, limit = 500 } = options

  return async (): Promise<TalentProfile[]> => {
    // Get profiles from the v_profile_search view
    let query = supabase
      .schema('core')
      .from('v_profile_search')
      .select('*')
      .order('gamified_score', { ascending: false })

    // Apply viewport bounds filtering if provided
    if (bounds) {
      query = query
        .gte('longitude', bounds.west)
        .lte('longitude', bounds.east)
        .gte('latitude', bounds.south)
        .lte('latitude', bounds.north)
    }

    // Apply limit (max 500 workers per viewport)
    query = query.limit(Math.min(limit, 500))

    const { data: profiles, error: profilesError } = await query

    if (profilesError) {
      console.error('Error fetching profiles from v_profile_search:', profilesError)
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      return []
    }

    const profileIds = profiles
      .map((profile: { id: string | null }) => profile.id)
      .filter((id: string | null): id is string => typeof id === 'string' && id.length > 0)

    let badgeMap = new Map<string, VerificationBadgeRow>()
    if (profileIds.length > 0) {
      const { data: badgeRows, error: badgeError } = await supabase
        .schema('core')
        .from('v_id_verification_latest')
        .select('worker_user_id, badge_status, badge_expires_at')
        .in('worker_user_id', profileIds)

      if (badgeError) {
        console.warn('[useTalentProfiles] Failed to load ID verification badges', badgeError)
      } else if (badgeRows) {
        type PartialBadgeRow = { worker_user_id: string | null; badge_status: string | null; badge_expires_at: string | null }
        const rowsWithId = badgeRows.filter(
            (row: PartialBadgeRow): row is PartialBadgeRow & { worker_user_id: string } =>
              typeof row.worker_user_id === 'string' && row.worker_user_id.length > 0
          )
          badgeMap = new Map(
            rowsWithId.map((row: PartialBadgeRow & { worker_user_id: string }): [string, VerificationBadgeRow] => [
              row.worker_user_id,
              row as unknown as VerificationBadgeRow,
            ])
          )
      }
    }

    // Transform to TalentProfile format
    return profiles.map((profile: ProfileSearchRow): TalentProfile => {
      const skills = (profile.skills_summary as { skills?: string[] } | null)?.skills || []
      const certifications = profile.certifications || []

      // Create badges from skills and certifications
      const verificationBadge = profile.id ? buildVerificationBadge(badgeMap.get(profile.id)) : null

      const badges = [
        ...(verificationBadge ? [verificationBadge] : []),
        ...skills.slice(0, 3).map((skill: string) => ({
          id: skill.toLowerCase().replace(/\s+/g, '-'),
          label: skill,
          tone: 'success' as const,
        })),
        ...certifications.slice(0, 2).map((cert: string) => ({
          id: cert.toLowerCase().replace(/\s+/g, '-'),
          label: cert,
          tone: 'success' as const,
        })),
      ]

      // Convert hourly rate from cents to dollars
      const hourlyRate = profile.hourly_rate_cents ? Math.round(profile.hourly_rate_cents / 100) : 0

      // Use coordinates from database (already jittered for privacy)
      // Note: Coordinates may be null if user hasn't set location
      const coordinates: [number, number] = [
        profile.longitude || -84.5555, // Default to Lansing, MI if no coords
        profile.latitude || 42.7325,
      ]

      const yearsOfExperience =
        typeof profile.calculatedYearsOfExperience === 'number'
          ? profile.calculatedYearsOfExperience
          : profile.years_of_experience || 0

      return {
        id: profile.id || '',
        name: profile.name || 'Anonymous Worker',
        title: profile.headline || 'Skilled Trades Professional',
        experienceYears: yearsOfExperience,
        hourlyRate,
        score: Math.min(profile.gamified_score || 0, 100),
        scoreLabel:
          profile.gamified_score && profile.gamified_score > 80
            ? 'Best match'
            : profile.gamified_score && profile.gamified_score > 60
              ? 'Good match'
              : undefined,
        badges,
        certifications,
        skills,
        locationLabel: profile.location || 'Location not set',
        coordinates,
        avatarUrl: profile.avatar_url,
      }
    })
  }
}

export const useTalentProfiles = (options: UseTalentProfilesOptions = {}) => {
  const { bounds = null, limit = 500, enabled = true } = options
  const fetchTalentProfiles = buildTalentProfilesQuery({ bounds, limit })

  return useQuery({
    queryKey: ['talent-profiles', bounds],
    enabled,
    queryFn: fetchTalentProfiles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
