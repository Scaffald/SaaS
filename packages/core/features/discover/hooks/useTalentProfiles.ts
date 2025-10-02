import { useQuery } from '@tanstack/react-query'
import { supabase } from '@app/core/utils/supabase/client'
import type { TalentProfile } from '../types'

// Define types for database responses
type ProfileRow = {
  id: string
  name: string | null
  headline: string | null
  years_of_experience: number | null
  avatar_url: string | null
  industry_name: string | null
  gamified_score: number | null
  longitude: number | null
  latitude: number | null
  location: string | null
  hourly_rate_cents: number | null
  certifications: string[] | null
  availability: string[] | null
  skills_summary: {
    skills?: string[]
  } | null
}

export const useTalentProfiles = () => {
  return useQuery({
    queryKey: ['talent-profiles'],
    queryFn: async (): Promise<TalentProfile[]> => {
      // Get profiles from the v_profile_search view
      const { data: profiles, error: profilesError } = await supabase
        .from('v_profile_search')
        .select('*')
        .order('gamified_score', { ascending: false })
        .limit(50)

      if (profilesError) {
        console.error('Error fetching profiles from v_profile_search:', profilesError)
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`)
      }

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found in database')
        return []
      }

      console.log(`Found ${profiles.length} profiles from database`)

      // Transform to TalentProfile format
      return (profiles as ProfileRow[]).map((profile): TalentProfile => {
        const skills = profile.skills_summary?.skills || []
        const certifications = profile.certifications || []

        // Create badges from skills and certifications
        const badges = [
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
        const hourlyRate = profile.hourly_rate_cents
          ? Math.round(profile.hourly_rate_cents / 100)
          : 0

        // Use coordinates from database (already jittered for privacy)
        // Note: Coordinates may be null if user hasn't set location
        const coordinates: [number, number] = [
          profile.longitude || -84.5555, // Default to Lansing, MI if no coords
          profile.latitude || 42.7325,
        ]

        return {
          id: profile.id,
          name: profile.name || 'Anonymous Worker',
          title: profile.headline || 'Skilled Trades Professional',
          experienceYears: profile.years_of_experience || 0,
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
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
