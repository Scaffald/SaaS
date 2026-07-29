import { Row, Stack, Text, useResponsive } from '@scaffald/ui'
import { View } from 'react-native'
import { brand, layout, MARKETING_LINKS } from '../theme'
import { MarketingLink } from './MarketingLink'
import { useHover } from './useHover'

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Support', href: '/support' },
] as const

function FooterLink({
  href,
  label,
  external,
  size = 'xs',
}: {
  href: string
  label: string
  external?: boolean
  size?: 'xs' | 'sm'
}) {
  const { hovered, hoverProps } = useHover()

  return (
    <View {...hoverProps}>
      <MarketingLink href={href} external={external}>
        <Text
          size={size}
          color={hovered ? brand.tealSoft : brand.onDarkMuted}
          style={hovered ? { textDecorationLine: 'underline' } : undefined}
        >
          {label}
        </Text>
      </MarketingLink>
    </View>
  )
}

export function MarketingFooter() {
  const { isMobile } = useResponsive()
  const year = new Date().getFullYear()

  return (
    <View
      style={{
        backgroundColor: brand.deeper,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 48,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: layout.maxWidth,
          marginHorizontal: 'auto',
          paddingHorizontal: layout.gutter,
        }}
      >
        <Stack gap={32} style={{ flexDirection: isMobile ? 'column' : 'row', marginBottom: 40 }}>
          <Stack gap={16} style={{ flex: isMobile ? undefined : 2 }}>
            <Text size="xl" weight="bold" color="#ffffff">
              Scaffald
            </Text>
            <Text size="sm" color={brand.tealSoft} style={{ lineHeight: 21, maxWidth: 512 }}>
              Scaffald is a unique platform that allows skilled tradespeople to connect with top
              general contractors and construction management firms by giving them a place to
              highlight their skills and find a place to apply their talent. Scaffald is positioned
              to allow top talent to meet top firms in a singular point of intersection that
              currently does not exist in the trades.
            </Text>
          </Stack>

          <Stack gap={12} style={{ flex: isMobile ? undefined : 1 }}>
            <Text size="sm" weight="semibold" color="#ffffff">
              Connect with us
            </Text>
            <FooterLink
              href={`mailto:${MARKETING_LINKS.email}`}
              label={MARKETING_LINKS.email}
              size="sm"
              external
            />
            <FooterLink href={MARKETING_LINKS.linkedin} label="LinkedIn" size="sm" external />
          </Stack>
        </Stack>

        <Stack
          gap={16}
          style={{
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.1)',
            paddingTop: 24,
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
          }}
        >
          <Row gap={4} align="center" style={{ flexWrap: 'wrap' }}>
            <Text size="xs" color={brand.onDarkMuted}>
              © {year} Scaffald — a
            </Text>
            <FooterLink href={MARKETING_LINKS.unicorn} label="Unicorn" external />
            <Text size="xs" color={brand.onDarkMuted}>
              company
            </Text>
          </Row>

          <Row gap={24}>
            {LEGAL_LINKS.map((link) => (
              <FooterLink key={link.href} href={link.href} label={link.label} />
            ))}
          </Row>
        </Stack>
      </View>
    </View>
  )
}
