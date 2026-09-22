import { Row, Stack, Text, useResponsive } from '@scaffald/ui'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { AUTH_ROUTES, ROUTES } from '../../../constants/routes'
import { useHydrated } from '../../../hooks/useHydrated'
import { useAuthStatus } from '../../../provider/auth/useAuth'
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

/**
 * The signed-out site header, and the only navigation on public pages (#762).
 *
 * Every public route renders it from `app/(public)/_layout.tsx`; the landing
 * page renders it itself so it can wire smooth-scrolling. It links to the
 * public surfaces that exist — the jobs listing and the landing sections — and
 * carries the account area: Sign in / Get started for a visitor, a Dashboard
 * link for someone who is already signed in.
 *
 * The account area is deliberately rendered signed-out on the server AND on
 * the first client render, even when a session is already in localStorage.
 * The server cannot see the session, so this is the only way the two trees
 * agree; see `useHydrated`. A signed-in user therefore sees Sign in for one
 * frame before it becomes Dashboard, which is the cheaper of the two flashes —
 * the alternative hides the sign-in CTA from every anonymous visitor for the
 * whole of hydration, and anonymous visitors are who this header is for.
 */
export function MarketingNav({ onNavigate, sectionBasePath = '' }: MarketingNavProps) {
  const { isMobile } = useResponsive()
  const [open, setOpen] = useState(false)
  const hydrated = useHydrated()
  const { isAuthenticated } = useAuthStatus()
  const showSignedIn = hydrated && isAuthenticated

  const signInHref = AUTH_ROUTES.LOGIN.path
  const startHref = `${AUTH_ROUTES.LOGIN.path}?intent=worker`
  const dashboardHref = ROUTES.DASHBOARD.path

  const primaryLinks = [
    { key: 'jobs', href: ROUTES.JOBS.path, label: 'Jobs', onPress: undefined },
    ...SECTIONS.map((section) => ({
      key: section.id,
      href: `${sectionBasePath}#${section.id}`,
      label: section.label,
      onPress: onNavigate ? () => onNavigate(section.id) : undefined,
    })),
  ]

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
            {primaryLinks.map((link) => (
              <NavSectionLink
                key={link.key}
                href={link.href}
                label={link.label}
                onPress={link.onPress}
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
            {showSignedIn ? (
              <MarketingLink href={dashboardHref} style={ctaStyle}>
                <Text size="sm" weight="medium" color="#ffffff">
                  Dashboard
                </Text>
              </MarketingLink>
            ) : (
              <>
                <NavSectionLink href={signInHref} label="Sign in" />
                <MarketingLink href={startHref} style={ctaStyle}>
                  <Text size="sm" weight="medium" color="#ffffff">
                    Get started
                  </Text>
                </MarketingLink>
              </>
            )}
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
          {primaryLinks.map((link) => (
            <NavSectionLink
              key={link.key}
              href={link.href}
              label={link.label}
              onPress={() => {
                setOpen(false)
                link.onPress?.()
              }}
            />
          ))}
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          {showSignedIn ? (
            <MarketingLink
              href={dashboardHref}
              onPress={() => setOpen(false)}
              style={mobileCtaStyle}
            >
              <Text size="sm" weight="medium" color="#ffffff">
                Dashboard
              </Text>
            </MarketingLink>
          ) : (
            <>
              <NavSectionLink href={signInHref} label="Sign in" onPress={() => setOpen(false)} />
              <MarketingLink href={startHref} onPress={() => setOpen(false)} style={mobileCtaStyle}>
                <Text size="sm" weight="medium" color="#ffffff">
                  Get started
                </Text>
              </MarketingLink>
            </>
          )}
        </Stack>
      ) : null}
    </View>
  )
}

const ctaStyle = {
  backgroundColor: brand.teal,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 7,
} as const

const mobileCtaStyle = {
  backgroundColor: brand.teal,
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 7,
  textAlign: 'center',
} as const

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
