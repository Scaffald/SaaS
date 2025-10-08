import { useQuery } from '@tanstack/react-query'
import { supabase } from '@app/core/utils/supabase/client'

// Type for job data on map
export interface JobMapPin {
  id: string
  title: string
  organization_name?: string
  organization_id?: string
  employment_type?: string
  remote_option?: string
  location?: string
  coordinates: [number, number] // [longitude, latitude]
  pay_range_min_cents?: number
  pay_range_max_cents?: number
  pay_range_type?: string
  status: string
  position_level?: string
}

// Type for the database response
interface JobWithCoords {
  id: string
  title: string
  organization_id: string
  employment_type: string | null
  remote_option: string | null
  location: string | null
  address: unknown
  pay_range_min_cents: number | null
  pay_range_max_cents: number | null
  pay_range_type: string | null
  status: string
  position_level: string | null
  organizations: {
    name: string
  } | null
}

export const useJobs = () => {
  return useQuery({
    queryKey: ['map-jobs'],
    queryFn: async (): Promise<JobMapPin[]> => {
      // Fetch jobs with coordinates from address JSONB field
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(
          `
          id,
          title,
          organization_id,
          employment_type,
          remote_option,
          location,
          address,
          pay_range_min_cents,
          pay_range_max_cents,
          pay_range_type,
          status,
          position_level,
          organizations (
            name
          )
        `
        )
        .eq('status', 'open') // Only show open jobs on map
        .returns<JobWithCoords[]>()

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError)
        throw new Error(`Failed to fetch jobs: ${jobsError.message}`)
      }

      if (!jobs || jobs.length === 0) {
        console.log('No jobs found in database')
        return []
      }

      console.log(`Found ${jobs.length} jobs from database`)

      // Transform to JobMapPin format
      return jobs
        .map((job): JobMapPin | null => {
          // Extract coordinates from address JSONB
          const address = job.address as
            | {
                latitude?: number
                longitude?: number
                city?: string
                state?: string
              }
            | null

          // Skip jobs without valid coordinates
          if (
            !address ||
            typeof address.latitude !== 'number' ||
            typeof address.longitude !== 'number'
          ) {
            return null
          }

          return {
            id: job.id,
            title: job.title || 'Untitled Job',
            organization_name: job.organizations?.name || undefined,
            organization_id: job.organization_id,
            employment_type: job.employment_type || undefined,
            remote_option: job.remote_option || undefined,
            location: job.location || undefined,
            coordinates: [address.longitude, address.latitude],
            pay_range_min_cents: job.pay_range_min_cents || undefined,
            pay_range_max_cents: job.pay_range_max_cents || undefined,
            pay_range_type: job.pay_range_type || undefined,
            status: job.status,
            position_level: job.position_level || undefined,
          }
        })
        .filter((job): job is JobMapPin => job !== null)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - jobs change frequently
  })
}
