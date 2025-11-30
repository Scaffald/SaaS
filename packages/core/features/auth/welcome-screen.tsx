import { api } from '@app/core/utils/api'
import { useTranslation } from '@app/core/utils/useTranslation'
import type { WelcomeSlide } from '@app/schemas'
import { Onboarding, type OnboardingStepInfo, Spinner, StepContent, YStack } from '@scaffald/tamagui-ui'
import type { IconProps } from '@tamagui/helpers-icon'
import * as LucideIcons from '@tamagui/lucide-icons'
import type { ComponentType } from 'react'

interface WelcomeScreenProps {
  onOnboarded?: () => void
}

// Default fallback slides in case API fails or returns empty
const createDefaultSlides = (
  t: (key: string, params?: Record<string, unknown>) => string
): OnboardingStepInfo[] => [
  {
    backgroundImage: 'https://images.pexels.com/photos/271667/pexels-photo-271667.jpeg',
    Content: () => (
      <StepContent
        title={t('auth.welcome.steps.discover.title')}
        icon={LucideIcons.UserSearch}
        description={t('auth.welcome.steps.discover.description')}
      />
    ),
  },
  {
    backgroundImage: 'https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg',
    Content: () => (
      <StepContent
        title={t('auth.welcome.steps.connect.title')}
        icon={LucideIcons.Share2}
        description={t('auth.welcome.steps.connect.description')}
      />
    ),
  },
  {
    backgroundImage:
      'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg',
    Content: () => (
      <StepContent
        title={t('auth.welcome.steps.grow.title')}
        icon={LucideIcons.Sprout}
        description={t('auth.welcome.steps.grow.description')}
      />
    ),
  },
]

/**
 * note: this screen is used as a standalone page on native and as a sidebar on auth layout on web
 */
export const WelcomeScreen = ({ onOnboarded }: WelcomeScreenProps = {}) => {
  const { data, isLoading } = api.cms.getActiveWelcomeSlides.useQuery()
  const { t } = useTranslation()

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
          // Dynamically resolve the icon component with fallback to a known icon
          const icons = LucideIcons as Record<string, ComponentType<IconProps> | undefined>
          const IconComponent = icons[slide.icon_name] ?? LucideIcons.UserSearch

          return {
            backgroundImage: slide.background_image_url,
            Content: () => (
              <StepContent
                title={slide.title}
                icon={IconComponent}
                description={slide.description}
              />
            ),
          }
        })
      : createDefaultSlides(t)

  return <Onboarding autoSwipe onOnboarded={onOnboarded} steps={steps} />
}
