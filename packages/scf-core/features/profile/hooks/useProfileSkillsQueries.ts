import {
  useIndustries,
  usePrimaryIndustry,
  useUserSkillsMultiTaxonomy,
} from '@scf/core/utils/profile-skills-sdk-hooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ProfileIndustry } from '../types/profile-skills-types'

/**
 * Hook for managing profile skills queries
 * Handles fetching industries, user skills, and primary industry
 */
export function useProfileSkillsQueries() {
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>('')
  const hasInitializedRef = useRef(false)

  const { data: industriesData, isLoading: isLoadingIndustries } = useIndustries()
  const { data: primaryIndustryData } = usePrimaryIndustry()
  const userSkillsQuery = useUserSkillsMultiTaxonomy()

  // Set selected industry from primary industry data - use stable ID reference
  // Use ref to prevent infinite loops from re-running when state updates
  // Only depend on primaryIndustryId to avoid loops when selectedIndustryId changes
  const primaryIndustryId = primaryIndustryData?.primary_industry_id
  useEffect(() => {
    // Only set once when we first get the primary industry ID
    if (primaryIndustryId && !selectedIndustryId && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      setSelectedIndustryId(primaryIndustryId)
    }
    // Reset ref if primaryIndustryId is cleared (but don't clear selectedIndustryId)
    // We don't want to reset the ref when selectedIndustryId changes from user action
    if (!primaryIndustryId && hasInitializedRef.current) {
      hasInitializedRef.current = false
    }
  }, [primaryIndustryId, selectedIndustryId]) // Include selectedIndustryId to satisfy exhaustive deps

  // Process industries data
  const industries: ProfileIndustry[] = useMemo(() => {
    if (!industriesData?.industries) {
      return []
    }

    return industriesData.industries
      .filter((industry: unknown): industry is ProfileIndustry => {
        if (!industry || typeof industry !== 'object') {
          return false
        }
        const candidate = industry as {
          id?: unknown
          name?: unknown
          slug?: unknown
        }
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.name === 'string' &&
          typeof candidate.slug === 'string'
        )
      })
      .map((industry: ProfileIndustry) => ({
        id: industry.id,
        name: industry.name,
        slug: industry.slug,
      }))
  }, [industriesData])

  // Get selected industry slug
  const selectedIndustrySlug = useMemo(() => {
    const matchingIndustry = industries.find(
      (industry: ProfileIndustry) => industry.id === selectedIndustryId
    )
    return matchingIndustry?.slug ?? 'construction'
  }, [industries, selectedIndustryId])

  // Get existing skill IDs - use stable data reference with memoization
  const userSkills = useMemo(() => {
    const skills = userSkillsQuery.data?.skills || []
    // Create a new array reference only when the data actually changes
    return skills
  }, [userSkillsQuery.data?.skills])

  const existingSkillIds = useMemo(
    () =>
      userSkills
        .map(
          (skill: {
            csi_skill_id?: string | null
            onet_occupation_id?: string | null
            id?: string
          }) => {
            const id =
              (
                skill as {
                  csi_skill_id?: string | null
                  onet_occupation_id?: string | null
                  id?: string
                }
              ).csi_skill_id ||
              (
                skill as {
                  csi_skill_id?: string | null
                  onet_occupation_id?: string | null
                  id?: string
                }
              ).onet_occupation_id ||
              (
                skill as {
                  csi_skill_id?: string | null
                  onet_occupation_id?: string | null
                  id?: string
                }
              ).id
            return id || ''
          }
        )
        .filter(Boolean),
    [userSkills]
  )

  // Derived skill statistics
  const skillCount = userSkills.length
  const hasMinimumSkills = skillCount >= 5
  const completionPercent = Math.min(Math.round((skillCount / 5) * 100), 100)

  // Primary industry ID already extracted above for useEffect

  return useMemo(
    () => ({
      isLoadingIndustries,
      industries,
      selectedIndustryId,
      setSelectedIndustryId,
      selectedIndustrySlug,
      existingSkillIds,
      skillCount,
      hasMinimumSkills,
      completionPercent,
      // Expose data directly, not query objects
      primaryIndustryId,
      userSkills,
    }),
    [
      isLoadingIndustries,
      industries,
      selectedIndustryId,
      selectedIndustrySlug,
      primaryIndustryId,
      existingSkillIds,
      skillCount,
      hasMinimumSkills,
      completionPercent,
      userSkills,
    ]
  )
}
