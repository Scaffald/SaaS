import { ROUTES } from '@scf/core/constants/routes'
import { usePersonalizedBenefits } from '@scf/core/utils/profile-completion-sdk-hooks'
import { useMemo } from 'react'
import { useProfileCompletion } from './useProfileCompletion'

export type GrowthCardKind = 'profile' | 'engagement'

export interface GrowthCard {
  id: string
  kind: GrowthCardKind
  eyebrow: string
  title: string
  body: string
  ctaLabel: string
  ctaRoute?: string
}

const engagementTips: GrowthCard[] = [
  {
    id: 'engagement.community',
    kind: 'engagement',
    eyebrow: 'Weekly Growth Tip',
    title: 'Join a community in your field',
    body: 'Members who join at least one community are 3× more likely to be discovered by recruiters and peers. Pick one that matches your work.',
    ctaLabel: 'Browse communities',
    ctaRoute: ROUTES.COMMUNITIES.path,
  },
  {
    id: 'engagement.assessment',
    kind: 'engagement',
    eyebrow: 'Weekly Growth Tip',
    title: 'Take a career assessment',
    body: 'Assessments unlock personalized job matches and show employers how you work. Most take under 10 minutes.',
    ctaLabel: 'Start an assessment',
    ctaRoute: ROUTES.ASSESSMENTS.path,
  },
  {
    id: 'engagement.connect',
    kind: 'engagement',
    eyebrow: 'Weekly Growth Tip',
    title: 'Grow your network this week',
    body: 'Members who add 3+ connections per week see steadier inbound opportunities. Start with former coworkers and community members.',
    ctaLabel: 'Find people',
    ctaRoute: ROUTES.COMMUNITIES.CONNECTIONS.path,
  },
  {
    id: 'engagement.post',
    kind: 'engagement',
    eyebrow: 'Weekly Growth Tip',
    title: 'Share what you are working on',
    body: 'A short post each week keeps your profile visible in your communities — no portfolio polish required.',
    ctaLabel: 'Go to communities',
    ctaRoute: ROUTES.COMMUNITIES.path,
  },
  {
    id: 'engagement.jobs',
    kind: 'engagement',
    eyebrow: 'Weekly Growth Tip',
    title: 'Apply to one fresh role',
    body: 'Members who apply to at least one role a week are far more likely to land interviews — consistency matters more than volume.',
    ctaLabel: 'Browse jobs',
    ctaRoute: ROUTES.JOBS.path,
  },
]

export function useGrowthCards() {
  const { completionData, isLoading } = useProfileCompletion()
  // SC-39 Phase E: prefer personalized "why complete this?" copy when the
  // backend has it for a given section. Falls back to the static
  // sectionMetadata description when no matching benefit exists.
  const { data: benefitsData } = usePersonalizedBenefits()

  const benefitBySection = useMemo(() => {
    const map = new Map<string, { description: string; opportunityCount: number }>()
    for (const b of benefitsData?.benefits ?? []) {
      if (!map.has(b.relatedSection)) {
        map.set(b.relatedSection, {
          description: b.description,
          opportunityCount: b.opportunityCount,
        })
      }
    }
    return map
  }, [benefitsData])

  const cards = useMemo<GrowthCard[]>(() => {
    if (!completionData) return []

    // Highest-weight sections first — the most-impactful nudge leads.
    const incomplete = completionData.items
      .filter((item) => !item.complete)
      .sort((a, b) => b.weight - a.weight)

    if (incomplete.length > 0) {
      return incomplete.map((item) => {
        const benefit = benefitBySection.get(item.id)
        const eyebrow =
          benefit && benefit.opportunityCount > 0
            ? `+${benefit.opportunityCount} match${benefit.opportunityCount === 1 ? '' : 'es'}`
            : 'Profile strength'
        return {
          id: `profile.${item.id}`,
          kind: 'profile' as const,
          eyebrow,
          title: item.title,
          body: benefit?.description ?? item.description,
          ctaLabel: item.actionLabel ?? `Complete ${item.title}`,
          ctaRoute: item.actionRoute,
        }
      })
    }

    return engagementTips
  }, [completionData, benefitBySection])

  return {
    cards,
    isLoading,
    completionData,
  }
}
