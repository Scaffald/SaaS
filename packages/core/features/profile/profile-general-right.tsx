import { YStack, Text, H3 } from 'tamagui'
import { DashboardWidget, StackedCards } from '@app/ui'

/**
 * Profile General Right Component
 * Navigation and overview for general profile settings with animated tips
 */
export function ProfileGeneralRight() {
  // Profile improvement tip cards
  const profileTipCards = [
    {
      title: '📸 Add a Profile Photo',
      subtitle: 'Did you know that profiles with a photo are dramatically more visible?',
      cardholderName:
        'Members with a profile picture receive up to 21× more profile views and as many as 36× more messages. A simple upload could make the difference between getting passed over or getting noticed.',
      expiryDate: 'The Social Feeds – LinkedIn Profile Picture Stats',
      showInverseSection: false,
      children: (
        <Text fontSize="$2" color="$color10" textAlign="center" fontStyle="italic">
          Boost your visibility with a professional photo
        </Text>
      ),
    },
    {
      title: '⏱ First Impressions',
      subtitle: 'Make Every Second Count',
      cardholderName:
        "Recruiters skim profiles and resumes quickly — often giving just 6 seconds in an initial scan. Having your basic details like name, email, and phone filled out ensures they don't miss something important about you in those crucial first moments.",
      expiryDate: 'Great Resumes Fast – Recruiter Eye-Tracking Study',
      showInverseSection: false,
      children: (
        <Text fontSize="$2" color="$color10" textAlign="center" fontStyle="italic">
          Complete your basic information for maximum impact
        </Text>
      ),
    },
    {
      title: '🎖 Verified Credentials',
      subtitle: 'Verified Details Build Trust',
      cardholderName:
        "Sharing verified information builds credibility with employers. In one large-scale study, workers who displayed credentials publicly increased their likelihood of gaining new employment by about 6 percentage points compared to those who didn't. Trust really does make a measurable difference.",
      expiryDate: 'arXiv – The Signaling Value of Credentials in Online Labor Markets (2024)',
      showInverseSection: false,
      children: (
        <Text fontSize="$2" color="$color10" textAlign="center" fontStyle="italic">
          Build trust through verified information
        </Text>
      ),
    },
  ]

  return (
    <YStack gap="$4">
      <DashboardWidget>
        <H3>General Information</H3>
        <Text color="$gray11" fontSize="$3">
          Update your basic profile information including your name, photo, and contact details.
        </Text>
      </DashboardWidget>

      <StackedCards
        cards={profileTipCards}
        interval={4000}
        autoPlay={true}
        width="100%"
        maxStackSize={2}
        wrapperComponent={DashboardWidget}
      />
    </YStack>
  )
}
