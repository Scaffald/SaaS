import { Row, Stack, Text, useResponsive } from '@scaffald/ui'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { AUTH_ROUTES } from '../../../constants/routes'
import { brand, layout } from '../theme'
import { MarketingLink } from './MarketingLink'
import { useHover } from './useHover'

const SECTIONS = [
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Benefits', id: 'benefits' },
  { label: 'FAQs', id: 'faq' },
] as const

export type MarketingNavProps = {
  /**
   * Smooth-scrolls to a section on the landing page. The links are real
   * `#fragment` anchors regardless, so they still work without this (and
   * without JS).
   */
  onNavigate?: (id: string) => void
  /** Standalone pages link back to the landing page's sections. */
  sectionBasePath?: string
}

export function MarketingNav({ onNavigate, sectionBasePath = '' }: MarketingNavProps) {
  const { isMobile } = useResponsive()
  const [open, setOpen] = useState(false)

  const signInHref = AUTH_ROUTES.LOGIN.path
  const startHref = `${AUTH_ROUTES.LOGIN.path}?intent=worker`

  return (
    <View
      style={{
        backgroundColor: brand.deep,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <Row
        align="center"
        justify="space-between"
        style={{
          width: '100%',
          maxWidth: layout.maxWidth,
          marginHorizontal: 'auto',
          paddingHorizontal: layout.gutter,
          height: 64,
        }}
      >
        <MarketingLink href="/" accessibilityLabel="Scaffald home">
          <Text size="xl" weight="bold" color="#ffffff">
            Scaffald
          </Text>
        </MarketingLink>

        {!isMobile ? (
          <Row gap={32} align="center">
            {SECTIONS.map((section) => (
              <NavSectionLink
                key={section.id}
                href={`${sectionBasePath}#${section.id}`}
                label={section.label}
                onPress={onNavigate ? () => onNavigate(section.id) : undefined}
              />
            ))}
          </Row>
        ) : null}

        {isMobile ? (
          <Pressable
            onPress={() => setOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Toggle menu"
            accessibilityState={{ expanded: open }}
            style={{ padding: 8 }}
          >
            <Text size="lg" color="#ffffff">
              {open ? '✕' : '☰'}
            </Text>
          </Pressable>
        ) : (
          <Row gap={12} align="center">
            <NavSectionLink href={signInHref} label="Sign in" />
            <MarketingLink
              href={startHref}
              style={{
                backgroundColor: brand.teal,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text size="sm" weight="medium" color="#ffffff">
                Get started
              </Text>
            </MarketingLink>
          </Row>
        )}
      </Row>

      {isMobile && open ? (
        <Stack
          gap={16}
          style={{
            backgroundColor: brand.deeper,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.1)',
            paddingHorizontal: layout.gutter,
            paddingVertical: 16,
          }}
        >
          {SECTIONS.map((section) => (
            <NavSectionLink
              key={section.id}
              href={`${sectionBasePath}#${section.id}`}
              label={section.label}
              onPress={() => {
                setOpen(false)
                onNavigate?.(section.id)
              }}
            />
          ))}
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <NavSectionLink href={signInHref} label="Sign in" onPress={() => setOpen(false)} />
          <MarketingLink
            href={startHref}
            onPress={() => setOpen(false)}
            style={{
              backgroundColor: brand.teal,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <Text size="sm" weight="medium" color="#ffffff">
              Get started
            </Text>
          </MarketingLink>
        </Stack>
      ) : null}
    </View>
  )
}

function NavSectionLink({
  href,
  label,
  onPress,
}: {
  href: string
  label: string
  onPress?: () => void
}) {
  const { hovered, hoverProps } = useHover()

  return (
    <View {...hoverProps}>
      <MarketingLink href={href} onPress={onPress}>
        <Text size="sm" color={hovered ? '#ffffff' : 'rgba(255,255,255,0.7)'}>
          {label}
        </Text>
      </MarketingLink>
    </View>
  )
}
