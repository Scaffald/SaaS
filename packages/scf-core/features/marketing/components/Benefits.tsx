import { Row, Stack, Text, useResponsive } from '@scaffald/ui'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { AUTH_ROUTES } from '../../../constants/routes'
import { brand, layout } from '../theme'
import { CtaLink } from './CtaLink'
import { MarketingHeading } from './MarketingHeading'
import { useHover } from './useHover'

type Feature = {
  title: string
  description: string
  stats: { value: string; label: string }[]
}

const ORG_FEATURES: Feature[] = [
  {
    title: 'Skilled talent',
    description:
      'Skills-based search and geolocation create a seamless experience for employers seeking skilled labor. Filter candidates based on certifications, skills, experience level, and more. By combining these filters with a search radius, Scaffald ensures you identify the best-matched professionals within your desired geographic area.',
    stats: [
      { value: '15 hrs', label: 'of time saved' },
      { value: '90%', label: 'retention rate' },
    ],
  },
  {
    title: 'Team building',
    description:
      'Manage teams with a hybrid of existing employees and potential new hires — particularly useful for pre-construction and project planning phases. Build actual and speculative teams to proactively plan out a project, building phase, or milestone based on anticipated resources. Essentially turning team building into a simple task list.',
    stats: [
      { value: '24%', label: 'increased efficiency' },
      { value: '2×', label: 'scalability' },
    ],
  },
  {
    title: 'Verified data',
    description:
      'Workers can upload and link their certifications (OSHA, CPR, etc.) to their profile, making it easy for an employer to reference and verify before onboarding. With a couple of clicks, you can also request a background search for criminal history, driving record, work history data, and certifications verified through our partner, NationSearch.',
    stats: [
      { value: '90%', label: 'profile accuracy' },
      { value: '1,000+', label: 'data points' },
    ],
  },
]

const WORKER_FEATURES: Feature[] = [
  {
    title: 'Shareable showcase',
    description:
      'Your profile on Scaffald is streamlined, professional, and importantly, shareable to recruiters, employers, or anyone you choose. You control how your experience, certifications, and skills are presented, making it easy to showcase your work and open new opportunities.',
    stats: [
      { value: '1-link', label: 'shareable profile' },
      { value: '100%', label: 'you in control' },
    ],
  },
  {
    title: 'Scaffald score',
    description:
      'A critical metric reflecting your skills, experience, and activity on the platform. A higher score boosts your chances of getting noticed and hired by employers. The more complete and active your profile, the more your score works for you.',
    stats: [
      { value: 'Algo', label: 'calculated score' },
      { value: 'Higher', label: 'visibility' },
    ],
  },
  {
    title: 'Two-way reviews',
    description:
      'You can review companies you have worked with and receive feedback from employers and colleagues, helping you build a stronger reputation over time. Transparent history benefits everyone.',
    stats: [
      { value: 'Both', label: 'sides reviewed' },
      { value: 'Trust', label: 'built over time' },
    ],
  },
]

function FeatureCard({
  feature,
  selected,
  onSelect,
}: {
  feature: Feature
  selected: boolean
  onSelect: () => void
}) {
  const { hovered, hoverProps } = useHover()

  return (
    <View {...hoverProps} style={{ height: '100%' }}>
      <Pressable
        onPress={onSelect}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={{
          padding: 24,
          borderRadius: 16,
          borderWidth: 1,
          height: '100%',
          backgroundColor: selected ? brand.deep : brand.surfaceAlt,
          borderColor: selected ? brand.deep : hovered ? brand.teal : brand.border,
        }}
      >
        <MarketingHeading
          level={3}
          color={selected ? '#ffffff' : brand.ink}
          style={{ fontSize: 16, lineHeight: 22, marginBottom: 12 }}
        >
          {feature.title}
        </MarketingHeading>
        <Row gap={16}>
          {feature.stats.map((stat) => (
            <Stack key={stat.label} gap={2}>
              <Text size="xl" weight="bold" color={selected ? brand.tealBright : brand.teal}>
                {stat.value}
              </Text>
              <Text
                size="xxs"
                // brand.faint fails contrast on the light card; muted passes.
                color={selected ? 'rgba(255,255,255,0.8)' : brand.muted}
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                {stat.label}
              </Text>
            </Stack>
          ))}
        </Row>
      </Pressable>
    </View>
  )
}

export function Benefits() {
  const { select, isMobile } = useResponsive()
  const [tab, setTab] = useState<'orgs' | 'workers'>('orgs')
  const [active, setActive] = useState(0)

  const features = tab === 'orgs' ? ORG_FEATURES : WORKER_FEATURES
  // Kit breakpoints: xs 660 / sm 800 / md 1020 / lg 1280.
  const columns = select({ base: 1, sm: 3 }) ?? 1
  const cardWidth = `${100 / columns}%` as const
  const titleSize = select({ base: 30, sm: 36, md: 40, lg: 44 }) ?? 30

  const selectTab = (next: 'orgs' | 'workers') => {
    setTab(next)
    setActive(0)
  }

  return (
    <View nativeID="benefits" style={{ backgroundColor: brand.surface, paddingVertical: 96 }}>
      <View
        style={{
          width: '100%',
          maxWidth: layout.maxWidth,
          marginHorizontal: 'auto',
          paddingHorizontal: layout.gutter,
        }}
      >
        <Stack align="center" gap={24} style={{ marginBottom: 40 }}>
          <MarketingHeading
            level={2}
            align="center"
            style={{ fontSize: titleSize, lineHeight: titleSize * 1.15, letterSpacing: -0.5 }}
          >
            {tab === 'orgs'
              ? 'Find skilled labor. Build better teams.'
              : 'Showcase Your Skills. Get Hired Faster.'}
          </MarketingHeading>

          <Row gap={4} style={{ backgroundColor: brand.surfaceSunk, borderRadius: 12, padding: 4 }}>
            {(['orgs', 'workers'] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => selectTab(value)}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === value }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: tab === value ? brand.deep : 'transparent',
                }}
              >
                <Text size="sm" weight="medium" color={tab === value ? '#ffffff' : brand.muted}>
                  {value === 'orgs' ? 'For Organizations' : 'For Workers'}
                </Text>
              </Pressable>
            ))}
          </Row>
        </Stack>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
          {features.map((feature, i) => (
            <View key={feature.title} style={{ width: cardWidth, padding: 8 }}>
              <FeatureCard
                feature={feature}
                selected={active === i}
                onSelect={() => setActive(i)}
              />
            </View>
          ))}
        </View>

        <Stack
          gap={32}
          style={{
            backgroundColor: brand.surfaceAlt,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: brand.border,
            padding: 32,
            marginTop: 32,
          }}
        >
          <Text color={brand.body} style={{ fontSize: 17, lineHeight: 28 }}>
            {features[active].description}
          </Text>
          <View style={{ alignSelf: isMobile ? 'stretch' : 'flex-start' }}>
            <CtaLink
              href={`${AUTH_ROUTES.LOGIN.path}?intent=${tab === 'orgs' ? 'org' : 'worker'}`}
              label={tab === 'orgs' ? 'Register your Organization' : 'Create your Profile'}
              variant="dark"
              fullWidth={isMobile}
              withArrow
            />
          </View>
        </Stack>
      </View>
    </View>
  )
}
