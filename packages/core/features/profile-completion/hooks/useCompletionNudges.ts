import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@app/core/utils/api'

export interface PersonalizedBenefit {
  id: string
  title: string
  description: string
  relatedSection: string
  userType: 'worker' | 'employer' | 'customer' | 'general'
  opportunityCount: number
}

interface UseCompletionNudgesReturn {
  currentBenefit: PersonalizedBenefit | null
  advanceMessage: () => void
  hasMultiple: boolean
  isLoading: boolean
  refetch: () => Promise<unknown>
}

const SESSION_STORAGE_KEY = 'profile_completion_last_benefit_id'

export function useCompletionNudges(): UseCompletionNudgesReturn {
  const { data, isLoading, refetch } = api.profile.getPersonalizedBenefits.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
  })
  const benefits = useMemo<PersonalizedBenefit[]>(() => data?.benefits ?? [], [data?.benefits])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const storedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      storedIdRef.current = sessionStorage.getItem(SESSION_STORAGE_KEY)
    }

    if (benefits.length === 0) {
      setCurrentIndex(0)
      return
    }

    const storedId = storedIdRef.current
    if (storedId) {
      const storedIndex = benefits.findIndex((benefit) => benefit.id === storedId)
      if (storedIndex >= 0) {
        setCurrentIndex(storedIndex)
        return
      }
    }

    setCurrentIndex(0)
  }, [benefits])

  const advanceMessage = useCallback(() => {
    if (benefits.length === 0) return
    setCurrentIndex((previous) => (previous + 1) % benefits.length)
  }, [benefits])

  const currentBenefit = benefits.length > 0 ? benefits[currentIndex] : null

  useEffect(() => {
    if (!currentBenefit) return
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, currentBenefit.id)
    }
  }, [currentBenefit])

  return {
    currentBenefit,
    advanceMessage,
    hasMultiple: benefits.length > 1,
    isLoading,
    refetch,
  }
}

