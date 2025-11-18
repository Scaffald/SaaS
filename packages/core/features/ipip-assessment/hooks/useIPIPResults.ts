import { useMemo } from 'react'
import { api } from '@app/core/utils/api'
import { getScore, getResults } from '@app/core/features/personality-assessment/lib/ipip'
import { normalizeScores } from '../utils/scoreNormalizer'
import type { IPIPAnswer, IPIPScores } from '@app/core/features/personality-assessment/lib/ipip'

export interface IPIPResultsData {
  scores: IPIPScores | null
  normalizedScores: ReturnType<typeof normalizeScores> | null
  narratives: ReturnType<typeof getResults> | null
  archetype: {
    name: string
    confidence: number
    details: {
      name: string
      description: string
      strengths: string[]
      work_styles: string
      team_dynamics: string
      growth_areas: string[]
    } | null
  } | null
  isComplete: boolean
  completedDomains: number
  nextAvailableAt: string | null | undefined
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to fetch and process IPIP assessment results
 */
export function useIPIPResults(): IPIPResultsData {
  const { data: assessment, isLoading: assessmentLoading, error: assessmentError } =
    api.personalityAssessment.getAssessmentStatus.useQuery()

  const { data: archetypeData, isLoading: archetypeLoading } =
    api.personalityAssessment.getArchetype.useQuery(undefined, {
      enabled: !!assessment?.ipip_completed_at,
    })

  const answers = (assessment?.ipip_answers as IPIPAnswer[]) || []
  const isComplete = answers.length >= 120
  const completedDomains = Math.floor(answers.length / 24)

  // Calculate scores if we have answers
  const scores = useMemo<IPIPScores | null>(() => {
    if (answers.length === 0) return null
    try {
      return getScore({ answers })
    } catch (error) {
      console.error('Error calculating IPIP scores:', error)
      return null
    }
  }, [answers])

  // Normalize scores to 0-100 scale
  const normalizedScores = useMemo(() => {
    if (!scores) return null
    try {
      return normalizeScores(scores)
    } catch (error) {
      console.error('Error normalizing scores:', error)
      return null
    }
  }, [scores])

  // Load narrative content
  const narratives = useMemo(() => {
    try {
      return getResults()
    } catch (error) {
      console.error('Error loading narratives:', error)
      return null
    }
  }, [])

  // Format archetype data
  const archetype = useMemo(() => {
    if (!archetypeData) return null

    return {
      name: archetypeData.archetype || '',
      confidence: archetypeData.confidence || 0,
      details: archetypeData.details,
    }
  }, [archetypeData])

  return {
    scores,
    normalizedScores,
    narratives,
    archetype,
    isComplete,
    completedDomains,
    nextAvailableAt: assessment?.next_available_at,
    isLoading: assessmentLoading || archetypeLoading,
    error: assessmentError as Error | null,
  }
}

