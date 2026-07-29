import { Stack, Text, useResponsive } from '@scaffald/ui'
import type { ComponentType } from 'react'
import { View } from 'react-native'
import { brand, layout } from '../theme'
import { ProfileIcon, ReviewIcon, SearchIcon, VerifiedIcon } from './FeatureIcons'
import { MarketingHeading } from './MarketingHeading'
import { SectionHeading } from './SectionHeading'
import { useHover } from './useHover'

type Feature = {
  Icon: ComponentType<{ color: string; size?: number }>
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    Icon: ProfileIcon,
    title: 'Digital resumés',
    description:
      'Explore or create in-depth, skills-based profiles with project photos and detailed capability descriptions.',
  },
  {
    Icon: SearchIcon,
    title: 'Skills-based search & geolocation',
    description:
      'Filter candidates based on search radius, certifications, skills, experience level, and more.',
  },
  {
    Icon: ReviewIcon,
    title: 'Two-way reviews',
    description:
      'Provide and read feedback from both workers and employers to build a trusted reputation on both sides.',
  },
  {
    Icon: VerifiedIcon,
    title: 'Verified certifications',
    description:
      'Upload and confirm certifications like OSHA, CPR, and more so employers can verify before onboarding.',
  },
]

function FeatureCard({ feature }: { feature: Feature }) {
  const { hovered, hoverProps } = useHover()
  const { Icon } = feature

  return (
    <View {...hoverProps} style={{ height: '100%' }}>
      <Stack
        gap={16}
        style={{
          backgroundColor: brand.surface,
          borderRadius: 16,
          padding: 24,
          borderWidth: 1,
          borderColor: hovered ? brand.teal : brand.border,
          height: '100%',
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: brand.tealWash,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon color={brand.teal} />
        </View>
        <MarketingHeading level={3} style={{ fontSize: 16, lineHeight: 22 }}>
          {feature.title}
        </MarketingHeading>
        <Text size="sm" color={brand.muted} style={{ lineHeight: 21 }}>
          {feature.description}
        </Text>
      </Stack>
    </View>
  )
}

export function HowItWorks() {
  const { select } = useResponsive()
  // Kit breakpoints are xs 660 / sm 800 / md 1020 / lg 1280 — not Tailwind's.
  const columns = select({ base: 1, xs: 2, md: 4 }) ?? 1
  const widthPercent = `${100 / columns}%` as const

  return (
    <View
      nativeID="how-it-works"
      style={{ backgroundColor: brand.surfaceAlt, paddingVertical: 96 }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: layout.maxWidth,
          marginHorizontal: 'auto',
          paddingHorizontal: layout.gutter,
        }}
      >
        <SectionHeading
          eyebrow="Tools to hire & get hired"
          title="Built to meet the needs of the Trades"
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -12 }}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={{ width: widthPercent, padding: 12 }}>
              <FeatureCard feature={feature} />
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
