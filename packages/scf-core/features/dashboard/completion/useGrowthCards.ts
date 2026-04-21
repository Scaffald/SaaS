import { ROUTES } from '@scf/core/constants/routes'
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

  const cards = useMemo<GrowthCard[]>(() => {
    if (!completionData) return []

    const incomplete = completionData.items.filter((item) => !item.complete)

    if (incomplete.length > 0) {
      return incomplete.map((item) => ({
        id: `profile.${item.id}`,
        kind: 'profile' as const,
        eyebrow: 'Profile strength',
        title: item.title,
        body: item.description,
        ctaLabel: item.actionLabel ?? `Complete ${item.title}`,
        ctaRoute: item.actionRoute,
      }))
    }

    return engagementTips
  }, [completionData])

  return {
    cards,
    isLoading,
    completionData,
  }
}
