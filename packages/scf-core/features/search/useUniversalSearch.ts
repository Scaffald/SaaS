import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useSearchParentSkillsMutation } from '@scf/core/utils/profile-skills-sdk-hooks'
import { usePublishedJobs } from '@scf/core/utils/jobs-sdk-hooks'
import { useEffect, useMemo, useState } from 'react'
import type { UniversalSearchGroup, UniversalSearchResult } from './types'

const PER_GROUP_LIMIT = 5

function formatJobSubtitle(job: {
  location?: string | { city?: string; state?: string } | null
  employment_type?: string | null
  remote_option?: string | null
}): string | undefined {
  const parts: string[] = []
  if (typeof job.location === 'string') {
    parts.push(job.location)
  } else if (job.location && (job.location.city || job.location.state)) {
    parts.push([job.location.city, job.location.state].filter(Boolean).join(', '))
  }
  if (job.remote_option && job.remote_option !== 'on_site') {
    parts.push(job.remote_option.replace('_', ' '))
  } else if (job.employment_type) {
    parts.push(job.employment_type.replace('_', ' '))
  }
  return parts.length > 0 ? parts.join(' · ') : undefined
}

export function useUniversalSearch(rawQuery: string): {
  query: string
  groups: UniversalSearchGroup[]
  isLoading: boolean
  isEmpty: boolean
} {
  const query = rawQuery.trim()
  const hasQuery = query.length >= 2

  const {
    data: jobsData,
    isFetching: jobsLoading,
  } = usePublishedJobs(
    { search: query, limit: PER_GROUP_LIMIT },
    { enabled: hasQuery }
  )

  const skillsMutation = useSearchParentSkillsMutation()
  const [skillResults, setSkillResults] = useState<UniversalSearchResult[]>([])
  const [skillsLoading, setSkillsLoading] = useState(false)

  useEffect(() => {
    if (!hasQuery) {
      setSkillResults([])
      setSkillsLoading(false)
      return
    }
    setSkillsLoading(true)
    let cancelled = false
    skillsMutation.mutate(
      { query, limit: PER_GROUP_LIMIT },
      {
        onSuccess: (resp) => {
          if (cancelled) return
          const skills = (resp as { skills?: { id: string; name: string; code?: string }[] })?.skills ?? []
          setSkillResults(
            skills.map((s) => ({
              id: s.id,
              type: 'skill' as const,
              title: s.name,
              subtitle: s.code,
              route: ROUTES.PROFILE.SKILLS.path,
            }))
          )
          setSkillsLoading(false)
        },
        onError: () => {
          if (cancelled) return
          setSkillResults([])
          setSkillsLoading(false)
        },
      }
    )
    return () => {
      cancelled = true
    }
    // Intentionally exclude skillsMutation to avoid re-fire on identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, hasQuery])

  const groups = useMemo<UniversalSearchGroup[]>(() => {
    const jobs = (jobsData as { jobs?: Record<string, unknown>[] } | undefined)?.jobs ?? []
    const jobResults: UniversalSearchResult[] = jobs.slice(0, PER_GROUP_LIMIT).map((job) => {
      const j = job as {
        id: string
        title: string
        location?: string | { city?: string; state?: string }
        employment_type?: string
        remote_option?: string
      }
      return {
        id: j.id,
        type: 'job' as const,
        title: j.title,
        subtitle: formatJobSubtitle(j),
        route: buildPath(ROUTES.JOBS.DETAIL, { id: j.id }),
      }
    })

    return [
      {
        type: 'job',
        label: 'Jobs',
        results: jobResults,
        isLoading: jobsLoading,
        seeAllRoute: jobResults.length > 0 ? `${ROUTES.JOBS.path}?search=${encodeURIComponent(query)}` : undefined,
      },
      {
        type: 'skill',
        label: 'Skills',
        results: skillResults,
        isLoading: skillsLoading,
      },
    ]
  }, [jobsData, jobsLoading, skillResults, skillsLoading, query])

  const isLoading = hasQuery && (jobsLoading || skillsLoading)
  const isEmpty =
    hasQuery && !isLoading && groups.every((g) => g.results.length === 0)

  return { query, groups, isLoading, isEmpty }
}
