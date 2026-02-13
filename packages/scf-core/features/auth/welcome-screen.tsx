import { api } from '@scf/core/utils/api'
import { useTranslation } from '@scf/core/utils/useTranslation'
import type { WelcomeSlide } from '@scf/schemas'
import {
  Onboarding,
  OnboardingStepContent,
  Stack,
  Spinner,
  ThemeProvider,
  type OnboardingStepInfo,
} from '@unicornlove/beyond-ui'
import { UserSearch, Share2, Sprout } from 'lucide-react-native'
import type { ComponentType } from 'react'

interface WelcomeScreenProps {
  onOnboarded?: () => void
}

const createDefaultSlides = (
  t: (key: string, params?: Record<string, unknown>) => string
): OnboardingStepInfo[] => [
  {
    backgroundImage: 'https://images.pexels.com/photos/271667/pexels-photo-271667.jpeg',
    Content: () => (
      <OnboardingStepContent
        title={t('auth.welcome.steps.discover.title')}
        icon={UserSearch}
        description={t('auth.welcome.steps.discover.description')}
      />
    ),
  },
  {
    backgroundImage: 'https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg',
    Content: () => (
      <OnboardingStepContent
        title={t('auth.welcome.steps.connect.title')}
        icon={Share2}
        description={t('auth.welcome.steps.connect.description')}
      />
    ),
  },
  {
    backgroundImage:
      'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg',
    Content: () => (
      <OnboardingStepContent
        title={t('auth.welcome.steps.grow.title')}
        icon={Sprout}
        description={t('auth.welcome.steps.grow.description')}
      />
    ),
  },
]

export const WelcomeScreen = ({ onOnboarded }: WelcomeScreenProps = {}) => {
  const { data, isLoading } = api.cms.getActiveWelcomeSlides.useQuery()
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <ThemeProvider>
        <Stack flex={1} align="center" justify="center">
          <Spinner size="lg" />
        </Stack>
      </ThemeProvider>
    )
  }

  const steps: OnboardingStepInfo[] =
    data?.slides && data.slides.length > 0
      ? data.slides.map((slide: WelcomeSlide) => {
          const icons: Record<string, ComponentType<{ size?: number; color?: string }>> = {
            UserSearch,
            Share2,
            Sprout,
          }
          const IconComponent = icons[slide.icon_name] ?? UserSearch

          return {
            backgroundImage: slide.background_image_url,
            Content: () => (
              <OnboardingStepContent
                title={slide.title}
                icon={IconComponent}
                description={slide.description}
              />
            ),
          }
        })
      : createDefaultSlides(t)

  return (
    <ThemeProvider>
      <Onboarding autoSwipe onOnboarded={onOnboarded} steps={steps} />
    </ThemeProvider>
  )
}
