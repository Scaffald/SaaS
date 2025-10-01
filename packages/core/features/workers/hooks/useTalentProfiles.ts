import { useQuery } from '@tanstack/react-query'
import { supabase } from '@app/core/utils/supabase/client'
import type { TalentProfile } from '../types'
import { mockTalentProfiles } from '../data/mockProfiles'

// Define types for database responses
type ProfileRow = {
  id: string
  name: string | null
  headline: string | null
  years_of_experience: number | null
  avatar_url: string | null
  industry_name: string | null
  gamified_score: number | null
  skills_summary: {
    skills?: string[]
  } | null
}

export const useTalentProfiles = () => {
  return useQuery({
    queryKey: ['talent-profiles'],
    queryFn: async (): Promise<TalentProfile[]> => {
      // Try to get profiles from the accessible view
      const { data: profiles, error: profilesError } = await supabase
        .from('v_profile_search')
        .select('*')
        .eq('open_to_work', true)
        .order('gamified_score', { ascending: false })
        .limit(50)

      if (profilesError) {
        console.error('Error fetching profiles from v_profile_search:', profilesError)
        console.log('Falling back to mock data')
        return mockTalentProfiles
      }

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found, falling back to mock data')
        return mockTalentProfiles
      }

      console.log(`Found ${profiles.length} profiles from database`)

      // Great Lakes region coordinates for distributing workers
      const greatLakesLocations = [
        { city: 'Detroit, MI', coords: [-83.0458, 42.3314] as [number, number] },
        { city: 'Grand Rapids, MI', coords: [-85.6681, 42.9634] as [number, number] },
        { city: 'Lansing, MI', coords: [-84.5555, 42.7325] as [number, number] },
        { city: 'Cleveland, OH', coords: [-81.6944, 41.4993] as [number, number] },
        { city: 'Columbus, OH', coords: [-82.9988, 39.9612] as [number, number] },
        { city: 'Cincinnati, OH', coords: [-84.512, 39.1031] as [number, number] },
        { city: 'Indianapolis, IN', coords: [-86.1581, 39.7684] as [number, number] },
        { city: 'Chicago, IL', coords: [-87.6298, 41.8781] as [number, number] },
        { city: 'Milwaukee, WI', coords: [-87.9065, 43.0389] as [number, number] },
        { city: 'Minneapolis, MN', coords: [-93.265, 44.9778] as [number, number] },
      ]

      // Transform to TalentProfile format
      return (profiles as ProfileRow[]).map((profile, index): TalentProfile => {
        const skills = profile.skills_summary?.skills || []

        // Generate realistic certifications based on skills
        const certifications: string[] = []
        if (skills.includes('osha-30') || skills.includes('osha-10')) {
          certifications.push('OSHA 30', 'OSHA 10')
        }
        if (skills.includes('first-aid') || skills.includes('cpr')) {
          certifications.push('First Aid / CPR')
        }
        if (skills.includes('cdl')) {
          certifications.push('CDL Medical Card')
        }

        // Assign location based on index to distribute across Great Lakes region
        const locationIndex = index % greatLakesLocations.length
        const location = greatLakesLocations[locationIndex]

        // Add some random offset to coordinates for variety
        const coordinates: [number, number] = [
          location.coords[0] + (Math.random() - 0.5) * 0.3,
          location.coords[1] + (Math.random() - 0.5) * 0.3,
        ]

        const badges = [
          ...skills.slice(0, 4).map((skill: string) => ({
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

        // Generate realistic hourly rate based on experience and skills
        const baseRate = 25 + (profile.years_of_experience || 0) * 2
        const skillsMultiplier = Math.min(skills.length * 0.5, 3)
        const hourlyRate = Math.round(baseRate + skillsMultiplier + Math.random() * 10)

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
          locationLabel: location.city,
          coordinates,
          avatarUrl: profile.avatar_url,
        }
      })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
