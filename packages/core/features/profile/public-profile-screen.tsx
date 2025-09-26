import {
  Avatar,
  Button,
  Paragraph,
  ScrollView,
  Separator,
  SizableText,
  XStack,
  YStack,
  useToastController,
} from '@app/ui'
import {
  Award,
  BadgeCheck,
  Briefcase,
  Clock4,
  Compass,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Users,
} from '@tamagui/lucide-icons'
import { useEffect, useState } from 'react'
import { Dialog } from 'tamagui'

import {
  DashboardCard,
  SectionHeading,
} from '@app/core/features/home/components/dashboard/primitives'

type SimilarUser = {
  name: string
  role: string
  distance: string
  matchReason: string
  skills: string[]
  certifications: string[]
}
import { PublicProfileReviewSummary, usePublicProfile } from './hooks/use-public-profile'
import { useReviewReaction } from './hooks/use-review-reaction'

const similarUsers: SimilarUser[] = [
  {
    name: 'Marcus Chen',
    role: 'Electrical General Foreman',
    distance: '18 miles away',
    matchReason: 'High hire score · Industrial turnarounds',
    skills: ['Switchgear installs', 'Crew mentoring'],
    certifications: ['OSHA 30', 'NCCER Electrical Lv.4'],
  },
  {
    name: 'Serena Boyd',
    role: 'Instrumentation & Controls Lead',
    distance: '32 miles away',
    matchReason: 'Shared certifications · TWIC cleared',
    skills: ['PLC upgrades', 'Loop checks'],
    certifications: ['TWIC', 'ISA CCST II'],
  },
  {
    name: 'Luis Ortega',
    role: 'Electrical Superintendent',
    distance: '48 miles away',
    matchReason: 'Leads similar crew sizes · Spanish/English bilingual',
    skills: ['Medium voltage testing', 'Crew scheduling'],
    certifications: ['OSHA 30', 'NFPA 70E'],
  },
]

const initialsFromName = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

const InfoChip = ({ label }: { label: string }) => (
  <YStack px="$3" py="$1" br="$4" backgroundColor="$color3" borderWidth={1} borderColor="$color4">
    <Paragraph size="$2" color="$gray11">
      {label}
    </Paragraph>
  </YStack>
)

type PublicProfileScreenProps = {
  username: string
}

type FeedbackSelection = 'positive' | 'negative'

type ReviewCounts = {
  positive: number
  negative: number
}

const deriveReactionCounts = (summary: PublicProfileReviewSummary): ReviewCounts => {
  const total = Math.max(summary.totalReviews, 0)
  if (total === 0) {
    return { positive: 0, negative: 0 }
  }

  let positive = Math.round((summary.positivePercent / 100) * total)
  let negative = Math.round((summary.negativePercent / 100) * total)

  const difference = total - (positive + negative)
  if (difference > 0) {
    positive += difference
  } else if (difference < 0) {
    const adjustment = Math.min(positive, Math.abs(difference))
    positive -= adjustment
  }

  return {
    positive: Math.max(positive, 0),
    negative: Math.max(negative, 0),
  }
}

const applyReactionToSummary = (
  summary: PublicProfileReviewSummary,
  nextSelection: FeedbackSelection,
  previousSelection: FeedbackSelection | null
) => {
  const counts = deriveReactionCounts(summary)
  let positive = counts.positive
  let negative = counts.negative

  if (previousSelection === 'positive' && positive > 0) {
    positive -= 1
  }

  if (previousSelection === 'negative' && negative > 0) {
    negative -= 1
  }

  if (nextSelection === 'positive') {
    positive += 1
  } else {
    negative += 1
  }

  const total = Math.max(positive + negative, 0)

  return {
    ...summary,
    totalReviews: total,
    positivePercent: total === 0 ? 0 : Math.round((positive / total) * 100),
    negativePercent: total === 0 ? 0 : Math.round((negative / total) * 100),
    lastUpdated: 'Updated moments ago',
  }
}

const ReviewSummaryCard = ({
  summary,
  selectedFeedback,
  onSelectFeedback,
  disabled = false,
}: {
  summary: PublicProfileReviewSummary
  selectedFeedback: FeedbackSelection | null
  onSelectFeedback: (intent: FeedbackSelection) => void
  disabled?: boolean
}) => {
  return (
    <YStack
      gap="$3"
      borderWidth={1}
      borderColor="$color4"
      br="$4"
      px="$4"
      py="$3"
      backgroundColor="$color2"
    >
      <XStack jc="space-between" ai="center" flexWrap="wrap" gap="$3">
        <YStack gap="$1">
          <Paragraph size="$2" color="$gray11">
            Crew feedback snapshot
          </Paragraph>
          <SizableText size="$6" fontWeight="600">
            {summary.averageRating.toFixed(1)} / 5
          </SizableText>
          <Paragraph size="$2" color="$gray11">
            Based on {summary.totalReviews} reviews
          </Paragraph>
        </YStack>

        <YStack gap="$2" ai="flex-end">
          <XStack gap="$4">
            <YStack gap="$1" ai="flex-end">
              <Paragraph size="$2" color="$gray11">
                Positive
              </Paragraph>
              <SizableText size="$5" fontWeight="600">
                {summary.positivePercent}%
              </SizableText>
            </YStack>
            <YStack gap="$1" ai="flex-end">
              <Paragraph size="$2" color="$gray11">
                Needs improvement
              </Paragraph>
              <SizableText size="$5" fontWeight="600">
                {summary.negativePercent}%
              </SizableText>
            </YStack>
          </XStack>
          <Paragraph size="$1" color="$gray10">
            {summary.lastUpdated}
          </Paragraph>
        </YStack>
      </XStack>

      <Separator borderColor="$color4" />

      <XStack gap="$3" flexWrap="wrap">
        <Button
          size="$3"
          icon={<ThumbsUp size={16} />}
          backgroundColor={selectedFeedback === 'positive' ? '$green5' : '$color2'}
          color={selectedFeedback === 'positive' ? '$green11' : '$gray12'}
          borderColor={selectedFeedback === 'positive' ? '$green6' : '$color5'}
          borderWidth={1}
          onPress={() => onSelectFeedback('positive')}
          disabled={disabled}
          aria-pressed={selectedFeedback === 'positive'}
        >
          Looks like a good fit
        </Button>
        <Button
          size="$3"
          icon={<ThumbsDown size={16} />}
          backgroundColor={selectedFeedback === 'negative' ? '$red5' : '$color2'}
          color={selectedFeedback === 'negative' ? '$red11' : '$gray12'}
          borderColor={selectedFeedback === 'negative' ? '$red6' : '$color5'}
          borderWidth={1}
          onPress={() => onSelectFeedback('negative')}
          disabled={disabled}
          aria-pressed={selectedFeedback === 'negative'}
        >
          Need to learn more
        </Button>
      </XStack>
    </YStack>
  )
}

export const PublicProfileScreen = ({ username }: PublicProfileScreenProps) => {
  const toast = useToastController()
  const reviewReaction = useReviewReaction()
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSelection | null>(null)
  const [reviewSummary, setReviewSummary] = useState<PublicProfileReviewSummary | null>(null)
  const [isReviewModalOpen, setReviewModalOpen] = useState(false)
  const { data: profile } = usePublicProfile(username)

  useEffect(() => {
    if (profile?.reviewSummary) {
      setReviewSummary(profile.reviewSummary)
    }
  }, [profile])

  if (!profile) {
    return null
  }

  const summary = reviewSummary ?? profile.reviewSummary

  const handleSelectFeedback = (intent: FeedbackSelection) => {
    if (reviewReaction.isPending) return

    const currentSummary = summary
    const previousSelection = selectedFeedback

    if (!currentSummary) return

    const isSameSelection = previousSelection === intent

    if (!isSameSelection) {
      const optimisticSummary = applyReactionToSummary(currentSummary, intent, previousSelection)
      setReviewSummary(optimisticSummary)
    }

    setSelectedFeedback(intent)

    const direction = intent === 'positive' ? 'up' : 'down'

    const run = async () => {
      try {
        await reviewReaction.react({ subjectId: username, direction })
        setReviewModalOpen(true)
      } catch (error) {
        if (!isSameSelection) {
          setReviewSummary(currentSummary)
          setSelectedFeedback(previousSelection)
        }

        console.error('Failed to record review reaction', error)
        toast.show('Unable to record your feedback', {
          message: error instanceof Error ? error.message : 'Please try again.',
        })
      }
    }

    void run()
  }

  return (
    <>
      <ReviewInviteDialog
        open={isReviewModalOpen}
        onOpenChange={setReviewModalOpen}
        profileName={profile.name}
      />
      <XStack
        w="100%"
        gap="$6"
        mx="auto"
        px="$4"
        py="$6"
        maw={1440}
        f={1}
        $md={{ flexDirection: 'column', gap: '$5' }}
      >
        <ScrollView
          f={1}
          showsVerticalScrollIndicator
          contentContainerStyle={{ gap: 24, paddingBottom: 32 }}
        >
          <YStack gap="$5" pb="$2" pr="$2">
            <DashboardCard gap="$5">
              <XStack gap="$4" $md={{ flexDirection: 'column', ai: 'flex-start' }}>
                <Avatar circular size="$6">
                  <Avatar.Fallback backgroundColor="$blue6">
                    <SizableText color="$color1" fontWeight="700">
                      {initialsFromName(profile.name)}
                    </SizableText>
                  </Avatar.Fallback>
                </Avatar>

                <YStack f={1} gap="$3">
                  <YStack gap="$1">
                    <SizableText size="$7" fontWeight="700">
                      {profile.name}
                    </SizableText>
                    <Paragraph size="$3" color="$gray11">
                      {profile.headline}
                    </Paragraph>
                  </YStack>

                  <XStack gap="$3" flexWrap="wrap">
                    <XStack ai="center" gap="$2">
                      <MapPin size={16} color="$gray11" />
                      <Paragraph size="$2" color="$gray11">
                        {profile.location}
                      </Paragraph>
                    </XStack>
                    <XStack ai="center" gap="$2">
                      <Clock4 size={16} color="$gray11" />
                      <Paragraph size="$2" color="$gray11">
                        {profile.availability}
                      </Paragraph>
                    </XStack>
                  </XStack>

                  <Paragraph size="$3">{profile.summary}</Paragraph>

                  <XStack gap="$3" flexWrap="wrap">
                    <InfoChip label={profile.travelRadius} />
                    <InfoChip label={profile.affiliations} />
                    <InfoChip label={`Languages: ${profile.languages.join(', ')}`} />
                  </XStack>

                  <XStack gap="$3" flexWrap="wrap">
                    <Button size="$3" icon={<Phone size={16} />} chromeless>
                      {profile.contact.phone}
                    </Button>
                    <Button size="$3" icon={<Briefcase size={16} />} chromeless>
                      Refer Alicia to a project
                    </Button>
                  </XStack>
                </YStack>
              </XStack>

              <Separator borderColor="$color4" />

              <XStack gap="$4" flexWrap="wrap">
                {profile.stats.map((stat) => (
                  <YStack key={stat.label} gap="$1" minWidth={180}>
                    <Paragraph size="$2" color="$gray11">
                      {stat.label}
                    </Paragraph>
                    <SizableText size="$6" fontWeight="600">
                      {stat.value}
                    </SizableText>
                  </YStack>
                ))}
              </XStack>

              <ReviewSummaryCard
                summary={summary}
                selectedFeedback={selectedFeedback}
                onSelectFeedback={handleSelectFeedback}
                disabled={reviewReaction.isPending}
              />
            </DashboardCard>

            <DashboardCard gap="$4">
              <SectionHeading
                title="Focus areas"
                subtitle="Where Alicia adds the most value on site"
                icon={<Sparkles size={20} color="$blue10" />}
              />
              <YStack gap="$3">
                {profile.focusAreas.map((area) => (
                  <XStack key={area} ai="center" gap="$3">
                    <BadgeCheck size={18} color="$green10" />
                    <Paragraph size="$3">{area}</Paragraph>
                  </XStack>
                ))}
              </YStack>
            </DashboardCard>

            <DashboardCard gap="$4">
              <SectionHeading
                title="Skills & toolset"
                subtitle="Hands-on strengths and platforms"
                icon={<Briefcase size={20} color="$orange10" />}
              />
              <YStack gap="$3">
                <YStack gap="$2">
                  <Paragraph size="$2" color="$gray11">
                    Field operations
                  </Paragraph>
                  <XStack gap="$2" flexWrap="wrap">
                    {profile.skills.core.map((skill) => (
                      <InfoChip key={skill} label={skill} />
                    ))}
                  </XStack>
                </YStack>

                <YStack gap="$2">
                  <Paragraph size="$2" color="$gray11">
                    Platforms & tooling
                  </Paragraph>
                  <XStack gap="$2" flexWrap="wrap">
                    {profile.skills.platforms.map((skill) => (
                      <InfoChip key={skill} label={skill} />
                    ))}
                  </XStack>
                </YStack>

                <YStack gap="$2">
                  <Paragraph size="$2" color="$gray11">
                    Leadership & coordination
                  </Paragraph>
                  <XStack gap="$2" flexWrap="wrap">
                    {profile.skills.leadership.map((skill) => (
                      <InfoChip key={skill} label={skill} />
                    ))}
                  </XStack>
                </YStack>
              </YStack>
            </DashboardCard>

            <DashboardCard gap="$4">
              <SectionHeading
                title="Project highlights"
                subtitle="Recent wins that teammates ask her back for"
                icon={<Compass size={20} color="$purple10" />}
              />
              <YStack gap="$4">
                {profile.projectHighlights.map((project) => (
                  <YStack key={project.name} gap="$2">
                    <XStack ai="center" gap="$2" flexWrap="wrap">
                      <SizableText size="$4" fontWeight="600">
                        {project.name}
                      </SizableText>
                      <Paragraph size="$2" color="$gray11">
                        {project.location}
                      </Paragraph>
                    </XStack>
                    <Paragraph size="$3">{project.description}</Paragraph>
                    <XStack ai="center" gap="$2">
                      <ShieldCheck size={16} color="$green10" />
                      <Paragraph size="$2" color="$gray11">
                        {project.impact}
                      </Paragraph>
                    </XStack>
                  </YStack>
                ))}
              </YStack>
            </DashboardCard>

            <DashboardCard gap="$4">
              <SectionHeading
                title="Work history"
                subtitle="A quick look at where Alicia has led crews"
                icon={<Award size={20} color="$amber10" />}
              />
              <YStack gap="$4">
                {profile.experience.map((job) => (
                  <YStack key={`${job.company}-${job.role}`} gap="$2">
                    <XStack
                      jc="space-between"
                      gap="$3"
                      $sm={{ flexDirection: 'column', gap: '$1' }}
                    >
                      <YStack gap="$1">
                        <SizableText size="$4" fontWeight="600">
                          {job.role}
                        </SizableText>
                        <Paragraph size="$2" color="$gray11">
                          {job.company}
                        </Paragraph>
                      </YStack>
                      <Paragraph size="$2" color="$gray11">
                        {job.period}
                      </Paragraph>
                    </XStack>
                    <YStack gap="$2">
                      {job.highlights.map((highlight) => (
                        <XStack key={highlight} ai="flex-start" gap="$2">
                          <Sparkles size={16} color="$blue10" style={{ marginTop: 2 }} />
                          <Paragraph size="$3" flex={1}>
                            {highlight}
                          </Paragraph>
                        </XStack>
                      ))}
                    </YStack>
                    <Separator borderColor="$color4" />
                  </YStack>
                ))}
              </YStack>
            </DashboardCard>

            <DashboardCard gap="$4">
              <SectionHeading
                title="Safety & certifications"
                subtitle="Credentials that keep teams compliant"
                icon={<ShieldCheck size={20} color="$green10" />}
              />
              <YStack gap="$3">
                {profile.certifications.map((cert) => (
                  <YStack key={cert.name} gap="$1">
                    <XStack ai="center" gap="$2" flexWrap="wrap">
                      <BadgeCheck size={18} color="$green10" />
                      <SizableText size="$3" fontWeight="600">
                        {cert.name}
                      </SizableText>
                    </XStack>
                    <Paragraph size="$2" color="$gray11">
                      {cert.issuer} · {cert.status}
                    </Paragraph>
                  </YStack>
                ))}
              </YStack>

              <Separator borderColor="$color4" />

              <YStack gap="$2">
                {profile.safetyHighlights.map((highlight) => (
                  <XStack key={highlight} ai="flex-start" gap="$2">
                    <ShieldCheck size={16} color="$green10" style={{ marginTop: 2 }} />
                    <Paragraph size="$3" flex={1}>
                      {highlight}
                    </Paragraph>
                  </XStack>
                ))}
              </YStack>
            </DashboardCard>
          </YStack>
        </ScrollView>

        <YStack width={360} gap="$4" flexShrink={0} $md={{ width: '100%' }}>
          <DashboardCard gap="$4">
            <SectionHeading
              title="Similar users"
              subtitle="People hiring managers also view"
              icon={<Users size={20} color="$purple10" />}
              action={<Button size="$2">View all</Button>}
            />
            <YStack gap="$4">
              {similarUsers.map((candidate, index) => (
                <YStack key={candidate.name} gap="$3">
                  <XStack ai="center" gap="$3">
                    <Avatar circular size="$3">
                      <Avatar.Fallback backgroundColor="$blue5">
                        <SizableText color="$color1" fontWeight="600">
                          {initialsFromName(candidate.name)}
                        </SizableText>
                      </Avatar.Fallback>
                    </Avatar>
                    <YStack f={1} gap="$1">
                      <SizableText size="$3" fontWeight="600">
                        {candidate.name}
                      </SizableText>
                      <Paragraph size="$2" color="$gray11">
                        {candidate.role}
                      </Paragraph>
                    </YStack>
                    <Paragraph size="$2" color="$gray11">
                      {candidate.distance}
                    </Paragraph>
                  </XStack>

                  <YStack gap="$2">
                    <Paragraph size="$2" color="$gray11">
                      {candidate.matchReason}
                    </Paragraph>
                    <XStack gap="$2" flexWrap="wrap">
                      {candidate.skills.map((skill) => (
                        <InfoChip key={`${candidate.name}-${skill}`} label={skill} />
                      ))}
                    </XStack>
                    <XStack gap="$2" flexWrap="wrap">
                      {candidate.certifications.map((cert) => (
                        <InfoChip key={`${candidate.name}-${cert}`} label={cert} />
                      ))}
                    </XStack>
                  </YStack>

                  {index < similarUsers.length - 1 ? <Separator borderColor="$color4" /> : null}
                </YStack>
              ))}
            </YStack>
          </DashboardCard>

          <DashboardCard gap="$3">
            <SectionHeading
              title="Ready to reach out?"
              subtitle="Send Alicia a note with project details"
              icon={<Phone size={20} color="$blue10" />}
            />
            <Paragraph size="$3">
              Share scope, schedule, and crew requirements to fast-track introductions. Alicia
              typically responds within one business day.
            </Paragraph>
            <Button size="$3" icon={<Mail size={16} />} iconAfter={<Compass size={16} />}>
              Message Alicia
            </Button>
          </DashboardCard>
        </YStack>
      </XStack>
    </>
  )
}

const ReviewInviteDialog = ({
  open,
  onOpenChange,
  profileName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileName: string
}) => {
  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay animation="medium" backgroundColor="rgba(0,0,0,0.6)" />
        <Dialog.Content
          animation="medium"
          backgroundColor="$color1"
          px="$5"
          py="$4"
          br="$6"
          maw={420}
          w="90%"
          gap="$4"
        >
          <YStack gap="$3">
            <SizableText size="$6" fontWeight="700">
              Ready to review {profileName}?
            </SizableText>
            <Paragraph size="$3" color="$gray11">
              We'll guide you through a quick form to share how it feels to work together.
            </Paragraph>
          </YStack>
          <XStack jc="flex-end" gap="$3">
            <Dialog.Close asChild>
              <Button size="$3" chromeless>
                Maybe later
              </Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button size="$3">Start review</Button>
            </Dialog.Close>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
