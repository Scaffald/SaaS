import { Row, Text } from '@scaffald/ui'
import { View } from 'react-native'
import { brand } from '../theme'
import { ArrowRightIcon } from './FeatureIcons'
import { MarketingLink } from './MarketingLink'
import { useHover } from './useHover'

export type CtaVariant = 'primary' | 'ghost' | 'dark'

export type CtaLinkProps = {
  href: string
  label: string
  variant?: CtaVariant
  fullWidth?: boolean
  withArrow?: boolean
}

const PALETTE: Record<CtaVariant, { bg: string; bgHover: string; border?: string; fg: string }> = {
  primary: { bg: brand.teal, bgHover: brand.tealHover, fg: '#ffffff' },
  ghost: {
    bg: 'rgba(255,255,255,0.1)',
    bgHover: 'rgba(255,255,255,0.2)',
    border: 'rgba(255,255,255,0.2)',
    fg: '#ffffff',
  },
  dark: { bg: brand.deep, bgHover: brand.deeper, fg: '#ffffff' },
}

/** Call-to-action rendered as a real anchor so it is crawlable and cmd-clickable. */
export function CtaLink({ href, label, variant = 'primary', fullWidth, withArrow }: CtaLinkProps) {
  const { hovered, hoverProps } = useHover()
  const palette = PALETTE[variant]

  return (
    <View {...hoverProps} style={{ width: fullWidth ? '100%' : undefined }}>
      <MarketingLink
        href={href}
        style={{
          backgroundColor: hovered ? palette.bgHover : palette.bg,
          borderRadius: 12,
          paddingHorizontal: 32,
          paddingVertical: 16,
          textAlign: 'center',
          ...(palette.border ? { borderWidth: 1, borderColor: palette.border } : {}),
        }}
      >
        <Row align="center" justify="center" gap={8}>
          <Text weight="semibold" color={palette.fg}>
            {label}
          </Text>
          {withArrow ? <ArrowRightIcon color={palette.fg} /> : null}
        </Row>
      </MarketingLink>
    </View>
  )
}
