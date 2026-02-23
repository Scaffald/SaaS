import { useActiveWelcomeSlides } from '@scf/core/utils/cms-sdk-hooks'
import { useTranslation } from '@scf/core/utils/useTranslation'
import type { WelcomeSlide } from '@scf/schemas'
import {
  Onboarding,
  OnboardingStepContent,
  Stack,
  Spinner,
  ThemeProvider,
  type OnboardingStepInfo,
} from '@scaffald/ui'
import { UserSearch, Share2, Sprout } from 'lucide-react-native'
import type { ComponentType } from 'react'

interface WelcomeScreenProps {
  onOnboarded?: () => void
  /** When true, shows single static branded panel (no carousel). Use in auth split layout. */
  brandedPanel?: boolean
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

export const WelcomeScreen = ({ onOnboarded, brandedPanel = false }: WelcomeScreenProps = {}) => {
  const { data, isLoading } = useActiveWelcomeSlides()
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

  const stepsToShow = brandedPanel ? steps.slice(0, 1) : steps

  return (
    <ThemeProvider>
      <Onboarding
        autoSwipe={!brandedPanel}
        onOnboarded={onOnboarded}
        steps={stepsToShow}
        staticMode={brandedPanel}
      />
    </ThemeProvider>
  )
}
