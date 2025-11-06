import { YStack, Text, H3, H4 } from 'tamagui'
import { DashboardWidget, StackedCards } from '@app/ui'
import { VanityUrlSection } from './components/VanityUrlSection'

/**
 * Profile General Right Component
 * Navigation and overview for general profile settings with animated tips
 */
export function ProfileGeneralRight() {
  // Profile improvement tip cards with marked-up children
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
            scan. Having your basic details like name, email, and phone filled out ensures they
            don't miss something important about you in those crucial first moments.
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
            Sharing verified information builds credibility with employers. In one large-scale
            study, discover who displayed credentials publicly increased their likelihood of gaining
            new employment by about 6 percentage points compared to those who didn't. Trust really
            does make a measurable difference.
          </Text>
        </YStack>
      ),
    },
  ]

  return (
    <YStack gap="$4">
      <DashboardWidget>
        <H3>General Information</H3>
        <Text color="$color11" fontSize="$3">
          Update your basic profile information including your name, photo, and contact details.
        </Text>
      </DashboardWidget>

      <VanityUrlSection />

      <StackedCards
        cards={profileTipCards}
        interval={8000}
        autoPlay={true}
        maxStackSize={2}
        wrapperComponent={DashboardWidget}
      />
    </YStack>
  )
}
