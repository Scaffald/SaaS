import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import SuperJSON from 'superjson'
import { Platform } from 'react-native'
import type { AppRouter } from '@app/supabase/functions/_shared/client-types'

import { getBaseUrl } from './getBaseUrl'
import { supabase } from './supabase/client'

// Create tRPC React client with proper typing from shared supabase package
export const api = createTRPCReact<AppRouter>()

export const createTrpcClient = () =>
  api.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/trpc`,
        // Remove SuperJSON transformer since server doesn't use it
        async headers() {
          const headers = new Map<string, string>()

          // Set platform-specific source header
          headers.set('x-trpc-source', Platform.OS === 'web' ? 'expo-web' : 'expo-react')

          const session = (await supabase.auth.getSession()).data.session

          // Add auth header for Supabase authentication
          if (session?.access_token) {
            headers.set('Authorization', `Bearer ${session.access_token}`)
          }

          return Object.fromEntries(headers)
        },
      }),
    ],
  })

// Type definitions for inputs and outputs (can be improved later with proper type generation)
export type RouterInputs = {
  'profile.getGeneral': void
  'profile.updateGeneral': {
    first_name: string
    last_name: string
    avatar_url?: string
    email: string
    phone?: string
    about?: string
  }
  'profile.getEmployment': void
  'profile.updateEmployment': {
    address?: {
      street?: string
      city?: string
      state?: string
      zip?: string
      country?: string
    }
    preferred_work_locations?: string[]
    willing_to_travel?: boolean
    travel_distance_miles?: number
    us_resident?: boolean
    residency_countries?: string[]
    us_passport?: boolean
    drivers_license_classes?: string[]
    military_status?: string[]
    availability?: string[]
    hourly_rate?: number
  }
  'profile.getSkills': void
  'profile.updateSkills': {
    skills?: {
      skill_id: string
      skill_name: string
      proficiency: number
      years_experience?: number
      is_primary: boolean
      endorsed_count?: number
    }[]
    primary_industry_id?: string
    secondary_industries?: string[]
    skill_categories?: string[]
  }
}

export type RouterOutputs = {
  'profile.getGeneral': {
    first_name: string
    last_name: string
    avatar_url: string
    email: string
    phone: string
    about: string
  }
  'profile.updateGeneral': { success: boolean }
  'profile.getEmployment': {
    address: {
      street: string
      city: string
      state: string
      zip: string
      country: string
    } | null
    preferred_work_locations: string[]
    willing_to_travel: boolean
    travel_distance_miles: number
    us_resident: boolean
    residency_countries: string[]
    us_passport: boolean
    drivers_license_classes: string[]
    military_status: string[]
    availability: string[]
    hourly_rate: number | null
  }
  'profile.updateEmployment': { success: boolean }
  'profile.getSkills': {
    skills: {
      skill_id: string
      skill_name: string
      proficiency: number
      years_experience: number | null
      is_primary: boolean
      endorsed_count: number
    }[]
    primary_industry_id: string | null
    secondary_industries: string[]
    skill_categories: string[]
  }
  'profile.updateSkills': { success: boolean }
}
