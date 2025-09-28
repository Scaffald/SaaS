import { useMemo } from 'react'
import { Button, ScrollView, YStack } from '@app/ui'
import { ArrowRight, Handshake, Megaphone } from '@tamagui/lucide-icons'

import { useUser } from '@app/core/utils/useUser'

import { useHireScore } from './hooks/useHireScore'
import { useProgressiveProfilePrompt } from './hooks/useProgressiveProfilePrompt'
import { CertificationSpotlightCard } from './components/dashboard/certifications'
import { DashboardHero } from './components/dashboard/hero/dashboard-hero'
import { HireScoreCard } from './components/dashboard/hire-score'
import { CareerInsightCard, AfterProfileSummaryCard } from './components/dashboard/insights'
import { OpportunityItem, OpportunitySection } from './components/dashboard/opportunities'
import { ProfileProgressSection } from './components/dashboard/profile'

const INQUIRIES: OpportunityItem[] = [
  {
    id: 'inquiry-1',
    title: 'Assistant Construction Manager',
    company: 'Gridworks Construction',
    location: 'Houston, Texas',
    meta: 'Direct inquiry · Posted today',
    statusLabel: 'New',
    statusTone: 'warning',
    actions: [
      {
        id: 'view',
        label: 'View',
        intent: 'outline',
      },
    ],
  },
]

const HIRING_REQUESTS: OpportunityItem[] = [
  {
    id: 'request-1',
    title: 'JSC Construction Laborer-2',
    company: 'Layered Infrastructure',
    location: 'La Porte, Texas',
    meta: 'Respond requested · 4 days remaining',
    statusLabel: 'Awaiting reply',
    statusTone: 'warning',
    actions: [
      { id: 'accept', label: 'Accept' },
      { id: 'ignore', label: 'Ignore', intent: 'ghost' },
      { id: 'view', label: 'View inquiry', intent: 'outline' },
    ],
  },
]

const JOBS_FOR_YOU: OpportunityItem[] = [
  {
    id: 'job-1',
    title: 'JSC Construction Laborer-2',
    company: 'Layered Infrastructure',
    location: 'La Porte, Texas',
    meta: 'Today · Applied',
    statusLabel: 'Matching skills',
    statusTone: 'success',
    actions: [{ id: 'details', label: 'Details', intent: 'outline' }],
  },
  {
    id: 'job-2',
    title: 'Construction Assistant',
    company: 'Nexus Infrastructure',
    location: 'Houston, Texas',
    meta: 'Today · Recommended',
    actions: [{ id: 'save', label: 'Save', intent: 'ghost' }],
  },
  {
    id: 'job-3',
    title: 'Assistant Construction Manager',
    company: 'Gridworks Construction',
    location: 'Houston, Texas',
    meta: '2 days ago · New posting',
    actions: [{ id: 'view', label: 'View role', intent: 'outline' }],
  },
]

const AFTER_PROFILE_STEPS = [
  {
    id: 'visibility',
    title: 'Get noticed',
    description:
      'Once your profile is visible, companies can discover you while searching for workers.',
    icon: <Megaphone size={28} color="$gray11" />,
  },
  {
    id: 'hiring',
    title: 'Hiring request',
    description:
      'When a company finds a good fit, they can reach out and invite you to join their project.',
    icon: <Handshake size={28} color="$gray11" />,
  },
]

const CERTIFICATIONS = [
  {
    id: 'osha-30',
    title: 'OSHA 30-Hour Construction Training',
    issuer: 'The Occupational Safety and Health Administration',
    status: 'Coming soon',
  },
  {
    id: 'hazwoper',
    title: 'HAZWOPER OSHA 40-Hour',
    issuer: 'Hazardous Waste Operations and Emergency Response',
    status: 'Coming soon',
  },
]

export function DashboardIndexLeft() {
  const { user, profile } = useUser()
  const hireScore = useHireScore()
  const inlinePrompts = useProgressiveProfilePrompt({ surface: 'inline-card' })

  const checklist = useMemo(
    () =>
      inlinePrompts.prompts
        .filter((prompt) => Boolean(prompt.factorId))
        .map((prompt) => ({
          id: prompt.id,
          label: prompt.title,
          completed: prompt.completed,
          points: prompt.points ?? prompt.factor?.points,
        })),
    [inlinePrompts.prompts]
  )

  const advancedTasks = useMemo(
    () =>
      inlinePrompts.prompts
        .filter((prompt) => !prompt.factorId && !prompt.completed)
        .map((prompt) => ({
          id: prompt.id,
          label: prompt.title,
          description: prompt.description,
          points: prompt.points,
          ctaLabel: prompt.ctaLabel ?? 'View task',
          ctaRoute: prompt.ctaRoute,
        })),
    [inlinePrompts.prompts]
  )

  if (!user) return null

  const firstName = extractFirstName(profile?.name, user.email)

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack py="$4" $sm={{ padding: '0' }}>
        <DashboardHero name={firstName} score={hireScore.score} />

        <HireScoreCard
          score={hireScore.score}
          level={hireScore.level}
          activities={hireScore.activities}
          completedCount={hireScore.completedCount}
          pendingCount={hireScore.pendingCount}
          isLoading={hireScore.isLoading}
        />

        <OpportunitySection
          title="Inquiries"
          subtitle="Opportunities that landed directly in your inbox."
          items={INQUIRIES}
        />

        <OpportunitySection
          title="Hiring requests"
          subtitle="Companies that requested to connect with you."
          items={HIRING_REQUESTS}
          headerAction={
            <Button size="$2" chromeless iconAfter={ArrowRight}>
              Manage availability
            </Button>
          }
        />

        <OpportunitySection
          title="Jobs for you"
          subtitle="Based on your skills, applications, and saves."
          items={JOBS_FOR_YOU}
          footerAction={{ label: 'View all jobs', onPress: () => undefined }}
        />

        <CareerInsightCard
          insight={{
            id: 'insight-1',
            title: 'Increase chances of being hired',
            description:
              'There are several steps you can take to increase the likelihood of receiving an offer for a new position.',
            actionLabel: 'Find out more',
          }}
        />

        <ProfileProgressSection checklist={checklist} advanced={advancedTasks} />

        <AfterProfileSummaryCard steps={AFTER_PROFILE_STEPS} />

        <CertificationSpotlightCard certifications={CERTIFICATIONS} />
      </YStack>
    </ScrollView>
  )
}

const extractFirstName = (displayName?: string | null, fallbackEmail?: string | null) => {
  if (displayName) {
    const [first] = displayName.trim().split(' ')
    if (first) return first
  }

  if (fallbackEmail) {
    const [handle] = fallbackEmail.split('@')
    if (handle) return handle
  }

  return 'there'
}
