import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { Database } from '@app/supabase/types'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { useUser } from '@app/core/utils/useUser'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type UserRow = Database['public']['Tables']['users']['Row']
type PrivateProfileRow = Database['public']['Tables']['user_private']['Row']

type HireScoreContext = {
  sessionUser: ReturnType<typeof useUser>['user']
  profile: ProfileRow | null
  userRow: UserRow | null
  privateProfile: PrivateProfileRow | null
}

type HireScoreFactorDefinition = {
  id: string
  title: string
  points: number
  successMessage: string
  actionMessage: string
  evaluate: (context: HireScoreContext) => number
}

type HireScoreFactorResult = {
  id: string
  title: string
  points: number
  earnedPoints: number
  progress: number
  completed: boolean
  successMessage: string
  actionMessage: string
}

export type HireScoreActivity = {
  id: string
  title: string
  impact: number
  message: string
  status: 'positive' | 'negative' | 'neutral'
  points: number
  earnedPoints: number
}

export type HireScoreLevel = {
  min: number
  label: string
  tone: string
  caption: string
}

type HireScoreViewer = {
  user: UserRow | null
  privateProfile: PrivateProfileRow | null
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const hasContent = (value: unknown) =>
  typeof value === 'string' ? value.trim().length > 0 : Boolean(value)

const hasSkills = (summary: UserRow['skills_summary']) => {
  if (!summary) return false
  if (Array.isArray(summary)) {
    return summary.some((value) => typeof value === 'string' && value.trim().length > 0)
  }
  if (typeof summary === 'object') {
    const maybeObject = summary as { primary?: unknown }
    if (Array.isArray(maybeObject.primary)) {
      return maybeObject.primary.some(
        (value) => typeof value === 'string' && value.trim().length > 0
      )
    }
  }
  return false
}

const HIRE_SCORE_FACTORS: HireScoreFactorDefinition[] = [
  {
    id: 'profile-basics',
    title: 'Profile basics',
    points: 10,
    successMessage: 'Profile basics completed',
    actionMessage: 'Add your name to finish the basics',
    evaluate: ({ profile, sessionUser, userRow }) =>
      hasContent(profile?.name) ||
      hasContent(sessionUser?.user_metadata?.full_name) ||
      hasContent(userRow?.display_name)
        ? 1
        : 0,
  },
  {
    id: 'professional-summary',
    title: 'Professional summary',
    points: 15,
    successMessage: 'Summary tells your story',
    actionMessage: 'Write a short summary to highlight your experience',
    evaluate: ({ profile, userRow }) =>
      hasContent(profile?.about) || hasContent(userRow?.bio) ? 1 : 0,
  },
  {
    id: 'profile-photo',
    title: 'Profile photo',
    points: 12,
    successMessage: 'Photo makes you recognizable',
    actionMessage: 'Upload a clear photo to build trust with employers',
    evaluate: ({ profile, sessionUser, userRow }) =>
      hasContent(profile?.avatar_url) ||
      hasContent(sessionUser?.user_metadata?.avatar_url) ||
      hasContent(userRow?.avatar_url)
        ? 1
        : 0,
  },
  {
    id: 'headline',
    title: 'Headline',
    points: 10,
    successMessage: 'Headline showcases your role',
    actionMessage: 'Add a headline so employers know what you do',
    evaluate: ({ userRow }) => (hasContent(userRow?.headline) ? 1 : 0),
  },
  {
    id: 'experience',
    title: 'Experience',
    points: 10,
    successMessage: 'Experience added to your profile',
    actionMessage: 'Share how many years of experience you have',
    evaluate: ({ userRow }) =>
      typeof userRow?.years_of_experience === 'number' && userRow.years_of_experience > 0 ? 1 : 0,
  },
  {
    id: 'skills',
    title: 'Primary skills',
    points: 12,
    successMessage: 'Skills help match you with jobs',
    actionMessage: 'List the skills you want to be found for',
    evaluate: ({ userRow }) => (hasSkills(userRow?.skills_summary) ? 1 : 0),
  },
  {
    id: 'location',
    title: 'Location',
    points: 10,
    successMessage: 'Location helps target roles near you',
    actionMessage: 'Add where you are based to refine matches',
    evaluate: ({ privateProfile }) => (hasContent(privateProfile?.location) ? 1 : 0),
  },
  {
    id: 'phone',
    title: 'Phone number',
    points: 8,
    successMessage: 'Phone number confirmed',
    actionMessage: 'Add a phone number for time-sensitive outreach',
    evaluate: ({ privateProfile }) => (hasContent(privateProfile?.phone) ? 1 : 0),
  },
  {
    id: 'contact-preferences',
    title: 'Contact preferences',
    points: 6,
    successMessage: 'Contact preferences saved',
    actionMessage: 'Tell us how employers should reach you',
    evaluate: ({ privateProfile }) =>
      Array.isArray(privateProfile?.contact_prefs) && privateProfile.contact_prefs.length > 0
        ? 1
        : 0,
  },
  {
    id: 'availability',
    title: 'Availability',
    points: 7,
    successMessage: 'Availability published',
    actionMessage: 'Share when you are available to take work',
    evaluate: ({ privateProfile }) =>
      Array.isArray(privateProfile?.availability) && privateProfile.availability.length > 0 ? 1 : 0,
  },
]

const SCORE_LEVELS: HireScoreLevel[] = [
  {
    min: 85,
    label: 'Excellent',
    tone: '$green10',
    caption: 'Your profile is in great shape. Keep responding quickly to maintain momentum.',
  },
  {
    min: 70,
    label: 'Strong',
    tone: '$green9',
    caption: 'You are ready to be matched with top opportunities.',
  },
  {
    min: 55,
    label: 'Good',
    tone: '$yellow10',
    caption: 'A few quick updates will make your profile shine.',
  },
  {
    min: 40,
    label: 'Fair',
    tone: '$orange9',
    caption: 'Complete the suggestions below to boost your visibility.',
  },
  {
    min: 0,
    label: 'Getting started',
    tone: '$red10',
    caption: 'Start completing profile tasks to raise your Hire Score.',
  },
]

export const resolveHireScoreLevel = (score: number): HireScoreLevel => {
  const normalized = clamp(Math.round(score), 0, 100)
  return (
    SCORE_LEVELS.find((level) => normalized >= level.min) ?? SCORE_LEVELS[SCORE_LEVELS.length - 1]
  )
}

export const useHireScore = () => {
  const { user, profile, isPending: isUserPending } = useUser()
  const supabase = useSupabase()

  const { data: viewer, isPending: isViewerPending } = useQuery<HireScoreViewer>({
    queryKey: ['hire-score', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return { user: null, privateProfile: null }
      }

      const [{ data: userRow, error: userError }, { data: privateProfile, error: privateError }] =
        await Promise.all([
          supabase.from('users').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('user_private').select('*').eq('user_id', user.id).maybeSingle(),
        ])

      if (userError) throw new Error(userError.message)
      if (privateError) throw new Error(privateError.message)

      return { user: userRow ?? null, privateProfile: privateProfile ?? null }
    },
  })

  const context = useMemo<HireScoreContext>(
    () => ({
      sessionUser: user,
      profile: (profile as ProfileRow | null) ?? null,
      userRow: viewer?.user ?? null,
      privateProfile: viewer?.privateProfile ?? null,
    }),
    [profile, user, viewer?.privateProfile, viewer?.user]
  )

  const factors = useMemo<HireScoreFactorResult[]>(() => {
    return HIRE_SCORE_FACTORS.map((factor) => {
      const progress = clamp(factor.evaluate(context), 0, 1)
      const earnedPoints = Math.round(factor.points * progress)
      return {
        id: factor.id,
        title: factor.title,
        points: factor.points,
        earnedPoints,
        progress,
        completed: progress >= 1,
        successMessage: factor.successMessage,
        actionMessage: factor.actionMessage,
      }
    })
  }, [context])

  const totalPoints = useMemo(
    () => factors.reduce((sum, factor) => sum + factor.earnedPoints, 0),
    [factors]
  )

  const maxScore = useMemo(
    () => HIRE_SCORE_FACTORS.reduce((sum, factor) => sum + factor.points, 0),
    []
  )

  const score = clamp(Math.round(totalPoints), 0, maxScore)
  const level = useMemo(() => resolveHireScoreLevel(score), [score])

  const activities: HireScoreActivity[] = useMemo(() => {
    return [...factors]
      .sort((a, b) => {
        const impactA = a.completed ? a.points : -a.points
        const impactB = b.completed ? b.points : -b.points
        return Math.abs(impactB) - Math.abs(impactA)
      })
      .map((factor) => {
        const impact = factor.completed ? factor.points : -factor.points
        let status: HireScoreActivity['status'] = 'neutral'
        if (impact > 0) status = 'positive'
        if (impact < 0) status = 'negative'
        return {
          id: factor.id,
          title: factor.title,
          impact,
          points: factor.points,
          earnedPoints: factor.earnedPoints,
          message: impact >= 0 ? factor.successMessage : factor.actionMessage,
          status,
        }
      })
  }, [factors])

  const completedCount = useMemo(
    () => factors.filter((factor) => factor.completed).length,
    [factors]
  )
  const pendingCount = factors.length - completedCount

  return {
    score,
    maxScore,
    level,
    activities,
    factors,
    completedCount,
    pendingCount,
    isLoading: isUserPending || isViewerPending,
  }
}
