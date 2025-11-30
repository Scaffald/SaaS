import { ProfileActivityWidget, TeamInvitationsWidget } from '@app/core/features/dashboard/components'
import { NewsWidget } from '@app/core/features/news'
import { DashboardWidget, StackedCards } from '@scaffald/tamagui-ui'
import { H4, Text, YStack } from 'tamagui'

const profileTipCards = [
  {
    children: (
      <YStack gap="$3">
        <H4 color="$color">📸 Add a Profile Photo</H4>
        <Text fontSize="$3" color="$color10" fontWeight="500" fontStyle="italic" lineHeight="$4">
          Did you know that profiles with a photo are dramatically more visible?
        </Text>
        <Text fontSize="$3" color="$color8" lineHeight="$4">
          Members with a profile picture receive up to 21× more profile views and as many as 36×
          more messages. A simple upload could make the difference between getting passed over or
          getting noticed.
        </Text>
      </YStack>
    ),
  },
  {
    children: (
      <YStack gap="$3">
        <H4 color="$color">⏱ First Impressions</H4>
        <Text fontSize="$3" color="$color10" fontWeight="500" fontStyle="italic" lineHeight="$4">
          Make Every Second Count
        </Text>
        <Text fontSize="$3" color="$color8" lineHeight="$4">
          Recruiters skim profiles and resumes quickly — often giving just 6 seconds in an initial
          scan. Having your basic details like name, email, and phone filled out ensures they don't
          miss something important about you in those crucial first moments.
        </Text>
      </YStack>
    ),
  },
  {
    children: (
      <YStack gap="$3">
        <H4 color="$color">🎖 Verified Credentials</H4>
        <Text fontSize="$3" color="$color10" fontWeight="500" fontStyle="italic" lineHeight="$4">
          Verified Details Build Trust
        </Text>
        <Text fontSize="$3" color="$color8" lineHeight="$4">
          Sharing verified information builds credibility with employers. In one large-scale study,
          discover who displayed credentials publicly increased their likelihood of gaining new
          employment by about 6 percentage points compared to those who didn't. Trust really does
          make a measurable difference.
        </Text>
      </YStack>
    ),
  },
]

export function DashboardIndexRight() {
  return (
    <YStack gap="$4">
      <ProfileActivityWidget />
      <StackedCards
        cards={profileTipCards}
        interval={8000}
        autoPlay={true}
        maxStackSize={2}
        wrapperComponent={DashboardWidget}
      />
      <TeamInvitationsWidget />
      <NewsWidget industry="construction" maxItems={10} />
    </YStack>
  )
}
