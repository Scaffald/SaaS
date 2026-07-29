import { Stack, Text, useResponsive } from '@scaffald/ui'
import { brand } from '../theme'
import { MarketingHeading } from './MarketingHeading'

export type SectionHeadingProps = {
  /** Small uppercase kicker above the title. */
  eyebrow?: string
  title: string
}

export function SectionHeading({ eyebrow, title }: SectionHeadingProps) {
  const { select } = useResponsive()
  const size = select({ base: 30, sm: 36, md: 40, lg: 44 }) ?? 30

  return (
    <Stack align="center" gap={12} style={{ marginBottom: 48 }}>
      {eyebrow ? (
        <Text
          size="sm"
          weight="semibold"
          color={brand.teal}
          align="center"
          style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}
        >
          {eyebrow}
        </Text>
      ) : null}
      <MarketingHeading
        level={2}
        align="center"
        style={{ fontSize: size, lineHeight: size * 1.15, letterSpacing: -0.5 }}
      >
        {title}
      </MarketingHeading>
    </Stack>
  )
}
