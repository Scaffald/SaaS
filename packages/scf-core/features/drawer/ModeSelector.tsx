/**
 * Workers/Employers mode switch (v1.12.0 / SC-136). A segmented control in the
 * mobile drawer. Switching to Employer persists the mode + active org and routes
 * to that org's home (the office/employer experience, now reachable on mobile);
 * Worker routes back to the dashboard. Only shown to users with an employer
 * context (office role or an org membership).
 */
import { useCallback } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Briefcase, HardHat } from 'lucide-react-native'
import { Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ROUTES } from '@scf/core/constants/routes'
import { useAppMode } from '@scf/core/utils/useAppMode'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'

export interface ModeSelectorProps {
  /** Called after navigating, so the drawer can close. */
  onNavigate?: (href: string) => void
}

export function ModeSelector({ onNavigate }: ModeSelectorProps) {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { mode, orgSlug, setAppMode } = useAppMode()
  const { data: organizations } = useOrganizations()
  const { hasOfficeRole } = useUserRoles()

  const memberships = organizations ?? []
  const hasEmployerContext = hasOfficeRole || memberships.length > 0

  const navigate = useCallback(
    (href: string) => {
      router.push(href as never)
      onNavigate?.(href)
    },
    [router, onNavigate],
  )

  const selectWorker = useCallback(() => {
    void setAppMode('worker')
    navigate(ROUTES.DASHBOARD.path)
  }, [setAppMode, navigate])

  const selectEmployer = useCallback(() => {
    // Prefer the remembered org, else the first membership.
    const slug =
      memberships.find((m) => m.organization_slug === orgSlug)?.organization_slug ??
      memberships[0]?.organization_slug ??
      null
    if (slug) {
      void setAppMode('employer', slug)
      navigate(ROUTES.EMPLOYERS.ORG.DETAIL.path.replace(':slug', slug))
    } else {
      // Office role but no org yet → create one.
      void setAppMode('employer')
      navigate(ROUTES.EMPLOYERS.CREATE.path)
    }
  }, [memberships, orgSlug, setAppMode, navigate])

  if (!hasEmployerContext) return null

  const options: { key: 'worker' | 'employer'; label: string; icon: typeof Briefcase; onPress: () => void }[] = [
    { key: 'worker', label: 'Worker', icon: HardHat, onPress: selectWorker },
    { key: 'employer', label: 'Employer', icon: Briefcase, onPress: selectEmployer },
  ]

  return (
    <Stack gap={6} testID="mode-selector">
      <Text
        style={{
          color: colors.text[theme].tertiary,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          paddingHorizontal: 4,
        }}
      >
        Mode
      </Text>
      <Row
        gap={4}
        style={{
          backgroundColor: colors.bg[theme].subtle,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border[theme].subtle,
          padding: 4,
        }}
      >
        {options.map((opt) => {
          const active = mode === opt.key
          const Icon = opt.icon
          return (
            <Pressable
              key={opt.key}
              onPress={opt.onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${opt.label} mode`}
              style={{ flex: 1 }}
            >
              <Row
                align="center"
                justify="center"
                gap={6}
                style={{
                  minHeight: 44,
                  borderRadius: 999,
                  backgroundColor: active ? colors.primary[500] : 'transparent',
                }}
              >
                <Icon size={16} color={active ? '#fff' : colors.icon[theme].muted} />
                <Text
                  size="sm"
                  weight={active ? 'semibold' : 'medium'}
                  style={{ color: active ? '#fff' : colors.text[theme].secondary }}
                >
                  {opt.label}
                </Text>
              </Row>
            </Pressable>
          )
        })}
      </Row>
      <View style={{ height: 0 }} />
    </Stack>
  )
}
