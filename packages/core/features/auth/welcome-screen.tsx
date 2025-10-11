import { Onboarding, type OnboardingStepInfo, StepContent } from '@app/ui'
import { ArrowUp, Rocket, Sparkles } from '@tamagui/lucide-icons'

const steps: OnboardingStepInfo[] = [
  {
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

interface WelcomeScreenProps {
  onOnboarded?: () => void
}

/**
 * note: this screen is used as a standalone page on native and as a sidebar on auth layout on web
 */
export const WelcomeScreen = ({ onOnboarded }: WelcomeScreenProps = {}) => {
  return <Onboarding autoSwipe onOnboarded={onOnboarded} steps={steps} />
}
