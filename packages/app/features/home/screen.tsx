import { Button, FullscreenSpinner, ScrollView, View, XStack, YStack, isWeb } from '@app/ui'
import { ArrowRight, Handshake, Megaphone } from '@tamagui/lucide-icons'

import { useUser } from '@app/utils/useUser'

import {
  AfterProfileSummaryCard,
  CareerInsightCard,
  CertificationSpotlightCard,
  ConcreteCalculatorCard,
  DashboardHero,
  NewsFeedCard,
  OpportunitySection,
  ProfileProgressSection,
  ResourceListCard,
  type OpportunityItem,
  type ResourceItem,
} from './components/dashboard'
import { useAffiliateResources } from './hooks/useAffiliateResources'

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

const PROFILE_CHECKLIST = [
  { id: 'photo', label: 'Upload your profile photo', completed: true, points: 10 },
  { id: 'basic-info', label: 'Basic information', completed: true, points: 10 },
  { id: 'roles', label: 'Roles and skills', completed: true, points: 10 },
  { id: 'education', label: 'Education and preferences', completed: false, points: 10 },
]

const ADVANCED_TASKS = [
  {
    id: 'projects',
    label: 'Projects & Teams',
    description: 'Describe the teams, roles, and responsibilities that highlight your strengths.',
    points: 10,
    ctaLabel: 'Add projects',
  },
  {
    id: 'certifications',
    label: 'Certifications',
    description: 'Add OSHA, ACI, or other certificates you have earned throughout your career.',
    points: 10,
    ctaLabel: 'Add certificate',
  },
  {
    id: 'identity',
    label: 'Identity verification',
    description: 'Verify your identity with a government-issued ID to build trust with employers.',
    points: 5,
    paid: true,
    ctaLabel: 'Verify identity',
  },
  {
    id: 'background',
    label: 'Background check',
    description: 'Run a background check to confirm your record and qualify for premium postings.',
    points: 10,
    paid: true,
    ctaLabel: 'Perform check',
  },
]

const AFTER_PROFILE_STEPS = [
  {
    id: 'visibility',
    title: 'Get noticed',
    description:
      'Once your profile is visible, companies can discover you while searching for workers.',
    icon: <Megaphone size={28} color="var(--color-gray11)" />,
  },
  {
    id: 'hiring',
    title: 'Hiring request',
    description:
      'When a company finds a good fit, they can reach out and invite you to join their project.',
    icon: <Handshake size={28} color="var(--color-gray11)" />,
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

const RESOURCE_FALLBACK: ResourceItem[] = [
  {
    id: 'resource-1',
    title: 'How To Get Into The Construction Industry',
    description:
      'Practical steps to prepare for your first job on site and stand out in interviews.',
  },
  {
    id: 'resource-2',
    title: 'Entry-Level Jobs That Require No Experience',
    description: 'Discover companies willing to train motivated candidates from day one.',
  },
  {
    id: 'resource-3',
    title: 'Skills You Need and Where to Start',
    description: 'Build a learning plan to gain high-demand skills across craft and safety roles.',
  },
]

export function HomeScreen() {
  const { user, profile, isPending } = useUser()
  const { data: affiliateOffers = [] } = useAffiliateResources()

  if (isPending)
    return (
      <View flex={1} height={'80vh' as any} ai="center" jc="center">
        <FullscreenSpinner />
      </View>
    )

  if (!user) return null

  const firstName = extractFirstName(profile?.name, user.email)

  const affiliateResources: ResourceItem[] = affiliateOffers.map((offer) => ({
    id: offer.id,
    title: offer.name,
    description: offer.description ?? '',
    href: offer.affiliate_url,
    ctaLabel: offer.cta_label ?? undefined,
  }))

  const rightRail = (
    <YStack gap="$5">
      <NewsFeedCard />
      <ConcreteCalculatorCard />
      <ResourceListCard
        title="New to construction?"
        subtitle="Start building experience with curated resources."
        resources={affiliateResources.length > 0 ? affiliateResources : RESOURCE_FALLBACK}
      />
    </YStack>
  )

  return (
    <XStack
      w="100%"
      gap="$6"
      mx="auto"
      px="$4"
      py="$6"
      maw={1440}
      f={1}
      $md={{ fd: 'column', gap: '$5' }}
    >
      <ScrollView f={1} showsVerticalScrollIndicator contentContainerStyle={{ gap: 24 }}>
        <YStack gap="$5" pb="$8" pr="$2">
          <DashboardHero name={firstName} score={60} />

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

          <ProfileProgressSection checklist={PROFILE_CHECKLIST} advanced={ADVANCED_TASKS} />

          <AfterProfileSummaryCard steps={AFTER_PROFILE_STEPS} />

          <CertificationSpotlightCard certifications={CERTIFICATIONS} />

          <YStack $md={{ dsp: 'flex' }} $gtMd={{ dsp: 'none' }} gap="$5">
            {rightRail}
          </YStack>
        </YStack>
      </ScrollView>

      {isWeb ? (
        <YStack w={340} gap="$5" $md={{ dsp: 'none' }}>
          {rightRail}
        </YStack>
      ) : null}
    </XStack>
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
