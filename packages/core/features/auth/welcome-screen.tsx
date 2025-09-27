import { Onboarding, OnboardingStepInfo, StepContent } from '@app/ui'
import { ArrowUp, Rocket, Sparkles } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/router'
import { AUTH_ROUTES } from '@app/core/constants/routes'

const steps: OnboardingStepInfo[] = [
  {
    theme: 'orange',
    backgroundImage: 'https://images.pexels.com/photos/271667/pexels-photo-271667.jpeg',
    Content: () => (
      <StepContent
        title="Kickstart"
        icon={Sparkles}
        description="Auth, profile, settings, adaptive layouts and many more ready for you to build on top of"
      />
    ),
  },
  {
    theme: 'green',
    backgroundImage: 'https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg',
    Content: () => (
      <StepContent
        title="Updates"
        icon={ArrowUp}
        description="As we make the starter better, we'll keep sending PRs with our GitHub app so your app keeps improving"
      />
    ),
  },
  {
    theme: 'blue',
    backgroundImage:
      'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg',
    Content: () => (
      <StepContent
        title="Deploy"
        icon={Rocket}
        description="The Takeout starter is the best way to go from zero to deploy and target all platforms at the same time."
      />
    ),
  },
]

/**
 * note: this screen is used as a standalone page on native and as a sidebar on auth layout on web
 */
export const WelcomeScreen = () => {
  const router = useRouter()
  return (
    <Onboarding
      autoSwipe
      onOnboarded={() => router.push(AUTH_ROUTES.INDEX?.fullPath || '/auth')}
      steps={steps}
    />
  )
}
