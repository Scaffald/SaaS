import type { HireScoreFactorDefinition } from './hooks/useHireScore'
import { HIRE_SCORE_FACTORS } from './hooks/useHireScore'
import { ROUTES } from '@app/core/constants/routes'

export type ProgressivePromptSurface = 'dialog' | 'inline-card' | 'banner'

export type ProgressivePromptComponentId = 'review-peer'

export type ProgressivePromptDefinition = {
  id: string
  title: string
  description: string
  priority: number
  cooldownDays: number
  surfaces: ProgressivePromptSurface[]
  ctaLabel?: string
  ctaRoute?: string
  componentId?: ProgressivePromptComponentId
  factorId?: HireScoreFactorDefinition['id']
  points?: number
  tags?: string[]
}

const PROFILE_EDIT_ROUTE = ROUTES.PROFILE

const profilePrompts: ProgressivePromptDefinition[] = HIRE_SCORE_FACTORS.map((factor, index) => ({
  id: factor.id,
  factorId: factor.id,
  title: factor.title,
  description: factor.actionMessage,
  priority: 100 - index,
  cooldownDays: 7,
  surfaces: ['dialog', 'inline-card'],
  ctaLabel: 'Update profile',
  ctaRoute: PROFILE_EDIT_ROUTE,
  points: factor.points,
  tags: ['profile'],
}))

export const PROGRESSIVE_PROMPT_REGISTRY: ProgressivePromptDefinition[] = [
  ...profilePrompts,
  {
    id: 'engagement-review-peer',
    title: 'Review a peer',
    description: 'Share feedback with a teammate to build credibility and earn recognition.',
    priority: 60,
    cooldownDays: 14,
    surfaces: ['dialog', 'inline-card', 'banner'],
    ctaLabel: 'Review a peer',
    ctaRoute: '/community/reviews',
    componentId: 'review-peer',
    points: 5,
    tags: ['engagement'],
  },
]

export type ProgressivePromptRegistry = typeof PROGRESSIVE_PROMPT_REGISTRY
