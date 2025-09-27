import {
  Avatar,
  Button,
  Paragraph,
  ScrollView,
  Separator,
  SizableText,
  XStack,
  YStack,
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
  Star,
  Sparkles,
  Users,
} from '@tamagui/lucide-icons'
import { useState } from 'react'
import { useLink } from 'solito/link'
import { Dialog, Spinner } from 'tamagui'

import {
  DashboardCard,
  SectionHeading,
} from '@app/core/features/dashboard/components/dashboard/primitives'

type SimilarUser = {
  name: string
  role: string
  distance: string
  matchReason: string
  skills: string[]
  certifications: string[]
}
import { PublicProfileReviewSummary, usePublicProfile } from './hooks/use-public-profile'
import { ReviewFeedItem, useReviewFeed } from './hooks/use-review-feed'
import { ReviewSummaryPayload, useReviewSummary } from './hooks/use-review-summary'

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

type ProfileReviewSummary = {
  averageRating: number
  totalReviews: number
  strengths: string[]
  improvements: string[]
  viewerDraft?: ReviewSummaryPayload['viewerDraft']
}

const mapToProfileReviewSummary = (
  summary?: ReviewSummaryPayload | null,
  fallback?: PublicProfileReviewSummary | null
): ProfileReviewSummary | null => {
  if (summary) {
    return {
      averageRating: summary.averageRating,
      totalReviews: summary.totalReviews,
      strengths: summary.strengths ?? [],
      improvements: summary.improvements ?? [],
      viewerDraft: summary.viewerDraft,
    }
  }

  if (fallback) {
    return {
      averageRating: fallback.averageRating,
      totalReviews: fallback.totalReviews,
      strengths: fallback.strengths ?? [],
      improvements: fallback.improvements ?? [],
      viewerDraft: fallback.viewerDraft,
    }
  }

  return null
}

const ReviewSkeletonBlock = ({
  width,
  height = 16,
}: {
  width: number | string
  height?: number
}) => <YStack w={width} h={height} br="$4" backgroundColor="$color4" opacity={0.4} />

const StarRating = ({ rating }: { rating: number }) => (
  <XStack gap="$1">
    {Array.from({ length: 5 }).map((_, index) => {
      const filled = rating >= index + 1
      const partial = !filled && rating > index
      const color = filled || partial ? '$yellow9' : '$gray7'
      const fill = filled ? '$yellow9' : partial ? '$yellow6' : 'none'

      return <Star key={index} size={18} color={color} fill={fill} />
    })}
  </XStack>
)

const ReviewChipRow = ({
  label,
  items,
  isLoading,
}: {
  label: string
  items: string[]
  isLoading: boolean
}) => (
  <YStack gap="$2">
    <Paragraph size="$2" color="$gray11">
      {label}
    </Paragraph>
    <XStack gap="$2" flexWrap="wrap">
      {isLoading && items.length === 0 ? (
        Array.from({ length: 3 }).map((_, index) => (
          <ReviewSkeletonBlock key={`skeleton-${label}-${index}`} width={120} height={28} />
        ))
      ) : items.length > 0 ? (
        items.map((item) => <InfoChip key={`${label}-${item}`} label={item} />)
      ) : (
        <Paragraph size="$2" color="$gray10">
          No feedback recorded yet.
        </Paragraph>
      )}
    </XStack>
  </YStack>
)

const ReviewOverviewCard = ({
  summary,
  isPending,
  onGiveReview,
  profileName,
}: {
  summary: ProfileReviewSummary | null
  isPending: boolean
  onGiveReview: () => void
  profileName: string
}) => {
  const firstName = profileName.split(' ')[0] ?? profileName
  const rating = summary?.averageRating ?? 0
  const totalReviews = summary?.totalReviews ?? 0
  const strengths = summary?.strengths ?? []
  const improvements = summary?.improvements ?? []

  return (
    <DashboardCard gap="$4">
      <SectionHeading
        title="Crew review snapshot"
        subtitle={`Highlights from people who worked with ${firstName}`}
        icon={<Star size={20} color="$yellow9" />}
        action={
          <Button size="$2" onPress={onGiveReview} disabled={isPending && !summary}>
            Give review
          </Button>
        }
      />

      {isPending && !summary ? (
        <YStack ai="center" py="$4">
          <Spinner size="small" color="$gray10" />
        </YStack>
      ) : (
        <YStack gap="$4">
          <YStack gap="$1">
            <SizableText size="$7" fontWeight="700">
              {rating.toFixed(1)} / 5
            </SizableText>
            <StarRating rating={rating} />
            <Paragraph size="$2" color="$gray11">
              Based on {totalReviews} crew reviews
            </Paragraph>
          </YStack>

          <ReviewChipRow label="Top strengths" items={strengths} isLoading={isPending} />
          <ReviewChipRow
            label="Opportunities teammates noted"
            items={improvements}
            isLoading={isPending}
          />
        </YStack>
      )}
    </DashboardCard>
  )
}

const partiallyRedactComment = (comment: string) => {
  const trimmed = comment.trim()

  if (!trimmed) {
    return 'Feedback is available to crew members only.'
  }

  const words = trimmed.split(/\s+/)
  if (words.length <= 4) {
    return '•••'
  }

  const visible = Math.min(words.length - 1, Math.max(3, Math.round(words.length * 0.4)))
  return `${words.slice(0, visible).join(' ')} •••`
}

const ReviewListItemSkeleton = () => (
  <YStack gap="$3">
    <XStack gap="$3" ai="center">
      <ReviewSkeletonBlock width={120} />
      <ReviewSkeletonBlock width={80} />
    </XStack>
    <ReviewSkeletonBlock width="100%" height={48} />
  </YStack>
)

const ReviewListItem = ({
  review,
  showDivider,
}: {
  review: ReviewFeedItem
  showDivider: boolean
}) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(review.createdAt))

  const displayComment = review.isPublic ? review.comment : partiallyRedactComment(review.comment)

  return (
    <YStack gap="$2">
      <XStack
        jc="space-between"
        ai="flex-start"
        gap="$3"
        $sm={{ flexDirection: 'column', gap: '$2' }}
      >
        <YStack gap="$1">
          <SizableText size="$4" fontWeight="600">
            {review.reviewer.name}
          </SizableText>
          <Paragraph size="$2" color="$gray11">
            {review.reviewer.role}
          </Paragraph>
        </YStack>
        <YStack ai="flex-end" gap="$1" $sm={{ ai: 'flex-start' }}>
          <StarRating rating={review.rating} />
          <Paragraph size="$2" color="$gray11">
            {formattedDate}
          </Paragraph>
        </YStack>
      </XStack>

      <Paragraph size="$3">{displayComment}</Paragraph>
      {!review.isPublic ? (
        <Paragraph size="$2" color="$gray11">
          Private feedback — details hidden for public viewers.
        </Paragraph>
      ) : null}

      {showDivider ? <Separator borderColor="$color4" /> : null}
    </YStack>
  )
}

type ReviewFeedCardProps = {
  query: ReturnType<typeof useReviewFeed>
  viewerDraftHref: string | null
  profileName: string
}

const ReviewFeedCard = ({ query, viewerDraftHref, profileName }: ReviewFeedCardProps) => {
  const firstName = profileName.split(' ')[0] ?? profileName
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } = query
  const reviews = data?.pages.flatMap((page) => page.items) ?? []

  const continueHref = viewerDraftHref ?? '#'
  const continueLink = useLink({ href: continueHref })

  return (
    <DashboardCard gap="$4">
      <SectionHeading
        title="Crew reviews"
        subtitle={`Stories from people who have worked with ${firstName}`}
        icon={<Users size={20} color="$purple10" />}
        action={
          viewerDraftHref ? (
            <Button size="$2" chromeless {...continueLink}>
              Continue your review
            </Button>
          ) : undefined
        }
      />

      {isPending && reviews.length === 0 ? (
        <YStack gap="$4">
          {Array.from({ length: 2 }).map((_, index) => (
            <ReviewListItemSkeleton key={`review-skeleton-${index}`} />
          ))}
        </YStack>
      ) : reviews.length === 0 ? (
        <Paragraph size="$2" color="$gray11">
          No reviews yet. Be the first to share feedback.
        </Paragraph>
      ) : (
        <YStack gap="$4">
          {reviews.map((review, index) => (
            <ReviewListItem
              key={review.id}
              review={review}
              showDivider={index < reviews.length - 1}
            />
          ))}

          {hasNextPage ? (
            <Button size="$3" onPress={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Loading more…' : 'Load more reviews'}
            </Button>
          ) : null}
        </YStack>
      )}
    </DashboardCard>
  )
}

export const PublicProfileScreen = ({ username }: PublicProfileScreenProps) => {
  const [isReviewModalOpen, setReviewModalOpen] = useState(false)
  const { data: profile } = usePublicProfile(username)
  const reviewSummaryQuery = useReviewSummary(username)
  const reviewFeedQuery = useReviewFeed(username)

  if (!profile) {
    return null
  }

  const combinedSummary = mapToProfileReviewSummary(reviewSummaryQuery.data, profile.reviewSummary)

  const viewerDraft = combinedSummary?.viewerDraft ?? null
  const viewerDraftHref = viewerDraft
    ? (viewerDraft.href ?? `/reviews/${viewerDraft.reviewId}`)
    : null

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
            </DashboardCard>

            <ReviewOverviewCard
              summary={combinedSummary}
              isPending={reviewSummaryQuery.isPending}
              onGiveReview={() => setReviewModalOpen(true)}
              profileName={profile.name}
            />

            <ReviewFeedCard
              query={reviewFeedQuery}
              viewerDraftHref={viewerDraftHref}
              profileName={profile.name}
            />

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
