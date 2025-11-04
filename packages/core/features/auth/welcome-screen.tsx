import type { ComponentType } from 'react'
import { Onboarding, type OnboardingStepInfo, StepContent, Spinner, YStack } from '@app/ui'
import * as LucideIcons from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import type { WelcomeSlide } from '@app/schemas'

interface WelcomeScreenProps {
  onOnboarded?: () => void
}

// Default fallback slides in case API fails or returns empty
const DEFAULT_SLIDES: OnboardingStepInfo[] = [
  {
    backgroundImage: 'https://images.pexels.com/photos/271667/pexels-photo-271667.jpeg',
    Content: () => (
      <StepContent
        title="Discover"
        icon={LucideIcons.UserSearch}
        description="Explore tailored content that matches your interests and goals."
      />
    ),
  },
  {
    backgroundImage: 'https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg',
    Content: () => (
      <StepContent
        title="Connect"
        icon={LucideIcons.Share2}
        description="Engage with experts and peers to grow your knowledge and network."
      />
    ),
  },
  {
    backgroundImage:
      'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg',
    Content: () => (
      <StepContent
        title="Grow"
        icon={LucideIcons.Sprout}
        description="Track your progress and unlock new opportunities as you learn."
      />
    ),
  },
]

/**
 * note: this screen is used as a standalone page on native and as a sidebar on auth layout on web
 */
export const WelcomeScreen = ({ onOnboarded }: WelcomeScreenProps = {}) => {
  const { data, isLoading } = api.cms.getActiveWelcomeSlides.useQuery()

  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  // Map database slides to onboarding format
  const steps: OnboardingStepInfo[] =
    data?.slides && data.slides.length > 0
      ? data.slides.map((slide: WelcomeSlide) => {
          // Dynamically resolve the icon component
          const IconComponent = (LucideIcons as Record<string, ComponentType<{ size?: number }>>)[
            slide.icon_name
          ]

          return {
            backgroundImage: slide.background_image_url,
            Content: () => (
              <StepContent
                title={slide.title}
                icon={IconComponent as ComponentType<{ size?: number }>}
                description={slide.description}
              />
            ),
          }
        })
      : DEFAULT_SLIDES

  return <Onboarding autoSwipe onOnboarded={onOnboarded} steps={steps} />
}
