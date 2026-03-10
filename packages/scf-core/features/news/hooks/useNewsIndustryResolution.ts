/**
 * Shared hook: resolve industry IDs for news fetching.
 * Ensures we never pass empty string to the news API (query is disabled for invalid UUID).
 * Returns primary industry (user's or slug) and construction fallback; supports env fallback for dev.
 */

import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { useCurrentUser } from '@scf/core/utils/profile-general-sdk-hooks'
import { supabase } from '@scf/core/utils/supabase/client'
import { useEffect, useState } from 'react'

const CONSTRUCTION_SLUG = 'construction'
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(value: string): boolean {
  return value.length > 0 && UUID_REGEX.test(value)
}

export interface UseNewsIndustryResolutionOptions {
  /** Slug for primary industry when user has no profile industry (default: 'construction') */
  industrySlug?: string
  /** When true, use current user's profile industry as primary (default: true in widget context) */
  useUserIndustry?: boolean
}

export interface NewsIndustryResolution {
  /** Primary industry UUID (user's or slug lookup); null until resolved or unavailable */
  industryId: string | null
  /** Construction industry UUID for fallback fetch; null until resolved or env fallback */
  constructionId: string | null
  /** True while the first resolution is in flight */
  isResolving: boolean
  /** A valid UUID to use for fetching: industryId ?? constructionId (never empty string) */
  effectiveIndustryId: string | null
}

/**
 * Resolve industry IDs for news. Use in NewsWidget and dashboard news page.
 * - Primary: user's profile industry (if useUserIndustry and available) or slug lookup.
 * - Construction: always resolved from DB (slug 'construction'); if missing, env EXPO_PUBLIC_NEWS_CONSTRUCTION_INDUSTRY_ID used in dev.
 * Never pass '' to useAggregatedNews: use effectiveIndustryId and enabled: !!effectiveIndustryId.
 */
export function useNewsIndustryResolution(
  options: UseNewsIndustryResolutionOptions = {}
): NewsIndustryResolution {
  const { industrySlug = CONSTRUCTION_SLUG, useUserIndustry = true } = options

  const { data: user } = useCurrentUser()
  const { data: generalInfo } = useGeneralInfoWidget(
    { userId: user?.id },
    { enabled: useUserIndustry && !!user?.id, staleTime: 5 * 60 * 1000 }
  )

  const [industryId, setIndustryId] = useState<string | null>(null)
  const [constructionId, setConstructionId] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      setIsResolving(true)

      // 1) Resolve construction ID (for fallback and default)
      const { data: constructionData } = await supabase
        .schema('core')
        .from('industries')
        .select('id')
        .eq('slug', CONSTRUCTION_SLUG)
        .single()

      if (cancelled) return

      const resolvedConstructionId = constructionData?.id ?? null

      // Env fallback so dev works without industries table
      const envFallback =
        typeof process !== 'undefined' &&
        process.env?.EXPO_PUBLIC_NEWS_CONSTRUCTION_INDUSTRY_ID?.trim()
      const constructionIdFinal =
        resolvedConstructionId ??
        (envFallback && isValidUUID(envFallback) ? envFallback : null)

      setConstructionId(constructionIdFinal)

      // 2) Primary: user's profile industry or slug lookup
      if (useUserIndustry && generalInfo?.industries?.id) {
        setIndustryId(generalInfo.industries.id)
        setIsResolving(false)
        return
      }

      const slug = industrySlug || CONSTRUCTION_SLUG
      const { data: slugData } = await supabase
        .schema('core')
        .from('industries')
        .select('id')
        .eq('slug', slug)
        .single()

      if (cancelled) return

      if (slugData?.id) {
        setIndustryId(slugData.id)
      } else {
        setIndustryId(constructionIdFinal)
      }

      setIsResolving(false)
    }

    void resolve()
    return () => {
      cancelled = true
    }
  }, [industrySlug, useUserIndustry, generalInfo?.industries?.id])

  const effectiveIndustryId = industryId ?? constructionId

  return {
    industryId,
    constructionId,
    isResolving,
    effectiveIndustryId,
  }
}
