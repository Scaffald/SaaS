import type { User } from '@supabase/supabase-js'

import type { ProfileVerificationState } from '@app/core/utils/useProfileVerifications'
import type { Database } from '@app/supabase/types'

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

export type ProfileRow =
  Database['public']['Tables']['profiles']['Row'] &
    Partial<Record<'name' | 'about', string | null>>

export type HireScoreContext = {
  user: User | null | undefined
  profile: ProfileRow | null | undefined
  verifications?: Pick<ProfileVerificationState, 'isVerified'>
}

export type HireScoreBreakdownEntry = {
  id: string
  label: string
  points: number
  achieved: boolean
  impact: number
  title: string
  description: string
}

export type HireScoreResult = {
  total: number
  max: number
  percentage: number
  label: string
  message: string
  tone: 'positive' | 'caution' | 'critical'
  breakdown: HireScoreBreakdownEntry[]
  activities: HireScoreBreakdownEntry[]
  nextSteps: HireScoreBreakdownEntry[]
}

type HireScoreFactor = {
  id: string
  label: string
  points: number
  evaluate: (context: HireScoreContext) => boolean
  successTitle: string
  successDescription: string
  failureTitle: string
  failureDescription: string
}

type ScoreBand = {
  min: number
  label: string
  message: string
  tone: HireScoreResult['tone']
}

const SCORE_FACTORS: readonly HireScoreFactor[] = [
  {
    id: 'profile-name',
    label: 'Profile name',
    points: 20,
    evaluate: ({ profile, verifications }) => {
      const name = profile?.name
      if (isNonEmptyString(name)) return true
      return verifications?.isVerified(['basic.full_name', 'basic.display_name']) ?? false
    },
    successTitle: 'Name added to profile',
    successDescription: 'Your preferred full name is visible to hiring teams.',
    failureTitle: 'Add your name',
    failureDescription: 'Introduce yourself by adding your full name to your profile.',
  },
  {
    id: 'profile-summary',
    label: 'Profile summary',
    points: 20,
    evaluate: ({ profile, verifications }) => {
      const about = profile?.about
      if (isNonEmptyString(about) && about.trim().length >= 40) return true
      return verifications?.isVerified('basic.about') ?? false
    },
    successTitle: 'Summary tells your story',
    successDescription: 'You shared enough about your background and goals.',
    failureTitle: 'Tell your story',
    failureDescription: 'Add a few sentences about your experience to stand out.',
  },
  {
    id: 'profile-photo',
    label: 'Profile photo',
    points: 15,
    evaluate: ({ profile, user, verifications }) => {
      const avatarOverride = profile?.avatar_url
      const metadata = user?.user_metadata as Record<string, unknown> | undefined
      const metadataAvatar =
        metadata && typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null

      if (isNonEmptyString(avatarOverride) || isNonEmptyString(metadataAvatar)) return true
      return verifications?.isVerified('basic.avatar') ?? false
    },
    successTitle: 'Profile photo uploaded',
    successDescription: 'Employers can put a face to your name.',
    failureTitle: 'Upload a profile photo',
    failureDescription: 'Adding a recent photo builds trust with hiring teams.',
  },
  {
    id: 'email-confirmed',
    label: 'Email confirmed',
    points: 20,
    evaluate: ({ user, verifications }) =>
      Boolean(
        (isNonEmptyString(user?.email_confirmed_at) ||
          verifications?.isVerified('contact.email')) ?? false
      ),
    successTitle: 'Email confirmed',
    successDescription: 'We can reach you quickly with new opportunities.',
    failureTitle: 'Confirm your email',
    failureDescription: 'Verify your email address so you never miss an invitation.',
  },
  {
    id: 'phone-on-file',
    label: 'Phone number available',
    points: 10,
    evaluate: ({ user, verifications }) =>
      Boolean(
        (isNonEmptyString(user?.phone) || verifications?.isVerified('contact.phone')) ?? false
      ),
    successTitle: 'Phone number ready',
    successDescription: 'Recruiters have a direct way to contact you.',
    failureTitle: 'Add a phone number',
    failureDescription: 'Include a phone number so recruiters can reach you quickly.',
  },
  {
    id: 'profile-refresh',
    label: 'Recent profile update',
    points: 15,
    evaluate: ({ profile }) => {
      const updatedAt = profile?.updated_at
      if (!isNonEmptyString(updatedAt)) return false

      const updated = new Date(updatedAt)
      if (Number.isNaN(updated.getTime())) return false

      const daysSinceUpdate = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceUpdate <= 30
    },
    successTitle: 'Profile updated recently',
    successDescription: 'Your details were refreshed within the last month.',
    failureTitle: 'Refresh your profile',
    failureDescription: 'Update your experience or preferences to keep information current.',
  },
] as const

const SCORE_BANDS: readonly ScoreBand[] = [
  {
    min: 80,
    label: 'Excellent',
    message: 'Employers see you as a top candidate — keep the momentum going.',
    tone: 'positive',
  },
  {
    min: 60,
    label: 'Strong',
    message: 'You are in great shape. A few more updates can unlock even more visibility.',
    tone: 'positive',
  },
  {
    min: 40,
    label: 'Building',
    message: 'Complete more profile basics to improve how you show up in searches.',
    tone: 'caution',
  },
  {
    min: 0,
    label: 'Getting started',
    message: 'Add more information so companies can get to know you.',
    tone: 'critical',
  },
] as const

export const calculateHireScore = (context: HireScoreContext): HireScoreResult => {
  const breakdown: HireScoreBreakdownEntry[] = SCORE_FACTORS.map((factor) => {
    const achieved = factor.evaluate(context)
    const impact = achieved ? factor.points : -factor.points

    return {
      id: factor.id,
      label: factor.label,
      points: factor.points,
      achieved,
      impact,
      title: achieved ? factor.successTitle : factor.failureTitle,
      description: achieved ? factor.successDescription : factor.failureDescription,
    }
  })

  const max = SCORE_FACTORS.reduce((total, factor) => total + factor.points, 0)
  const rawTotal = breakdown.reduce(
    (total, entry) => total + (entry.achieved ? entry.points : 0),
    0
  )
  const total = Math.max(0, Math.min(rawTotal, max))
  const percentage = max > 0 ? Math.round((total / max) * 100) : 0

  const band = SCORE_BANDS.find((threshold) => percentage >= threshold.min) ?? SCORE_BANDS.at(-1)!

  const positiveHighlights = breakdown
    .filter((entry) => entry.impact > 0)
    .sort((a, b) => b.impact - a.impact)
  const negativeHighlights = breakdown
    .filter((entry) => entry.impact < 0)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

  const activities: HireScoreBreakdownEntry[] = []
  const seen = new Set<string>()
  const pushActivity = (entry: HireScoreBreakdownEntry) => {
    if (seen.has(entry.id) || activities.length >= 4) return
    seen.add(entry.id)
    activities.push(entry)
  }

  positiveHighlights.slice(0, 2).forEach(pushActivity)
  negativeHighlights.slice(0, 2).forEach(pushActivity)

  if (activities.length < 4) {
    positiveHighlights.forEach(pushActivity)
  }

  if (activities.length < 4) {
    negativeHighlights.forEach(pushActivity)
  }

  const nextSteps = negativeHighlights

  return {
    total,
    max,
    percentage,
    label: band.label,
    message: band.message,
    tone: band.tone,
    breakdown,
    activities,
    nextSteps,
  }
}
