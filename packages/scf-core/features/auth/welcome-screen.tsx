import {
  Onboarding,
  Box,
  Stack,
  Text,
  type OnboardingStepInfo,
} from '@scaffald/ui'
import { ScaffaldLogo } from '@scf/core/assets'
import type { FC } from 'react'

interface WelcomeScreenProps {
  onOnboarded?: () => void
  /** When true, shows dark branded panel with testimonial carousel (no onboarding controls). Use in auth split layout. */
  brandedPanel?: boolean
}

interface TestimonialSlide {
  backgroundImage: string
  quote: string
  author: string
  role: string
  initials: string
}

const AUTH_TESTIMONIALS: TestimonialSlide[] = [
  {
    backgroundImage: 'https://images.pexels.com/photos/271667/pexels-photo-271667.jpeg',
    quote: '"We\'re based in a rural area, two hours from the nearest city. Finding certified electricians or licensed plumbers used to mean cold calls and word-of-mouth — half the time they\'d show up unvetted. Scaffald changed that. Within a week we had three qualified candidates for a role we\'d been trying to fill for two months."',
    author: 'Brian Carter',
    role: 'Owner, Wizard Construction',
    initials: 'BC',
  },
  {
    backgroundImage: 'https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg',
    quote: '"Running multiple crews means sifting through a flood of applicants who don\'t have the certifications the job requires. Scaffald filters that noise instantly. Every profile we see is verified. We\'ve cut our sourcing time by more than half and our supervisors spend less time in HR and more time on site."',
    author: 'Steve Stoddard',
    role: 'Principal, Lighthouse Construction',
    initials: 'SS',
  },
  {
    backgroundImage: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg',
    quote: '"Before Scaffald, hiring for a mid-size project took three to four weeks of back-and-forth, credential checks, and paperwork. Now we\'re putting people to work in under a week. Faster hiring means less project downtime, and less downtime means better margins — it compounds quickly."',
    author: 'Stephanie Massei',
    role: 'Owner, Massei Construction',
    initials: 'SM',
  },
  {
    backgroundImage: 'https://images.pexels.com/photos/159306/construction-site-build-construction-work-159306.jpeg',
    quote: '"What struck me most is what this means for the workers themselves. These are skilled people — ironworkers, masons, certified welders — who had no way to properly market themselves. Scaffald gives them a real professional presence. They\'re not just a phone number in someone\'s contact list anymore."',
    author: 'Anthony Bango',
    role: 'Project Executive, Christman Construction',
    initials: 'AB',
  },
  {
    backgroundImage: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg',
    quote: '"Construction labor has been a black box for decades — job boards from the early internet era, informal networks that excluded outsiders. Scaffald is doing what LinkedIn did for white-collar professionals, but for an industry that represents a far larger share of the economy. This is a genuine category creator."',
    author: 'Zach Servideo',
    role: 'Managing Partner, Value Creation Labs',
    initials: 'ZS',
  },
]

const textShadow = {
  textShadowColor: 'rgba(0, 0, 0, 0.75)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
}

function AuthTestimonialContent({ quote, author, role }: Omit<TestimonialSlide, 'initials'>) {
  return (
    <Stack
      flex={1}
      justify="center"
      align="center"
      style={{ paddingHorizontal: 28, paddingVertical: 24 }}
    >
      {/* Logo + tagline */}
      <Stack gap={10} align="center" style={{ marginBottom: 32 }}>
        <ScaffaldLogo
          width={160}
          height={26}
          primaryColor="#ffffff"
          secondaryColor="rgba(255,255,255,0.7)"
          gradientStart="#ffffff"
          gradientEnd="rgba(255,255,255,0.85)"
        />
        <Text
          style={{
            color: 'rgba(255,255,255,0.72)',
            fontSize: 15,
            textAlign: 'center',
            lineHeight: 22,
            letterSpacing: 0.2,
            ...textShadow,
          }}
        >
          {'Find, hire, and manage skilled tradespeople.\nBuilt for skilled professionals.'}
        </Text>
      </Stack>

      {/* Quote */}
      <Text
        style={{
          color: '#ffffff',
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 24,
          textAlign: 'center',
          marginBottom: 24,
          ...textShadow,
        }}
      >
        {quote}
      </Text>

      {/* Author */}
      <Stack gap={2} align="center">
        <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13, textAlign: 'center', ...textShadow }}>
          {author}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center', ...textShadow }}>
          {role}
        </Text>
      </Stack>
    </Stack>
  )
}

/** Mobile slides reuse the same testimonial content as the desktop branded panel. */
const createMobileSlides = (): OnboardingStepInfo[] =>
  AUTH_TESTIMONIALS.slice(0, 3).map((slide) => ({
    backgroundImage: slide.backgroundImage,
    Content: (() => {
      const s = slide
      const ContentComponent: FC = () => <AuthTestimonialContent {...s} />
      return ContentComponent
    })(),
  }))

export const WelcomeScreen = ({ onOnboarded, brandedPanel = false }: WelcomeScreenProps = {}) => {

  // Branded auth panel: dark testimonial carousel
  if (brandedPanel) {
    const testimonialSlides: OnboardingStepInfo[] = AUTH_TESTIMONIALS.map((slide) => ({
      backgroundImage: slide.backgroundImage,
      Content: (() => {
        const s = slide
        const ContentComponent: FC = () => <AuthTestimonialContent {...s} />
        return ContentComponent
      })(),
    }))

    return (
      <Box flex={1}>
        <Onboarding overlay="dark" autoSwipe showControls={false} steps={testimonialSlides} paginationStyle={{ marginBottom: 32 }} />
      </Box>
    )
  }

  // Standard onboarding flow (mobile) — same testimonial content as desktop
  const steps: OnboardingStepInfo[] = createMobileSlides()

  return (
    <Box flex={1}>
      <Onboarding overlay="dark" autoSwipe={true} onOnboarded={onOnboarded} steps={steps} />
    </Box>
  )
}
