import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import type { TalentProfile } from '../types'
import { mockTalentProfiles } from '../data/mockProfiles'

// Define the database row type for the profile search view
type ProfileSearchRow = {
  id: string
  name: string | null
  headline: string | null
  years_of_experience: number | null
  avatar_url: string | null
  industry_name: string | null
  gamified_score: number | null
  skills_summary: {
    primary?: string[]
  } | null
}

export const useTalentProfiles = () => {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['talent-profiles'],
    queryFn: async (): Promise<TalentProfile[]> => {
      const { data, error } = await supabase
        .from('v_profile_search')
        .select(`
          id,
          name,
          headline,
          years_of_experience,
          avatar_url,
          industry_name,
          gamified_score,
          skills_summary
        `)
        .eq('open_to_work', true)
        .order('gamified_score', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching talent profiles:', error)
        console.log('Falling back to mock data')
        return mockTalentProfiles
      }

      // If no data returned, fallback to mock data
      if (!data || data.length === 0) {
        console.log('No data returned, falling back to mock data')
        return mockTalentProfiles
      }

      // Transform database data to TalentProfile format
      return (data as ProfileSearchRow[]).map((profile): TalentProfile => {
        const skills = profile.skills_summary?.primary || []
        const certifications: string[] = [] // TODO: Add certifications when available
        const badges = [
          ...skills.map((skill) => ({
            id: skill.toLowerCase().replace(/\s+/g, '-'),
            label: skill,
            tone: 'success' as const,
          })),
        ]

        return {
          id: profile.id,
          name: profile.name || 'Anonymous',
          title: profile.headline || `${profile.industry_name || 'Professional'}`,
          experienceYears: profile.years_of_experience || 0,
          hourlyRate: 0, // TODO: Add hourly rate when available
          score: Math.min(profile.gamified_score || 0, 100),
          scoreLabel:
            profile.gamified_score && profile.gamified_score > 80 ? 'Best match' : undefined,
          badges,
          certifications,
          skills,
          locationLabel: 'Location TBD', // TODO: Add location when available
          coordinates: [-72.6734, 41.55], // TODO: Add real coordinates
          avatarUrl: profile.avatar_url,
        }
      })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
