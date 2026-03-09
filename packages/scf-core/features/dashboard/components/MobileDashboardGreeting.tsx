import { Stack, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'

export function MobileDashboardGreeting() {
  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const { data } = useGeneralInfoWidget()

  if (!isMobile) return null

  const firstName = data?.privateData?.first_name ?? 'there'

  return (
    <Stack gap={4} style={{ paddingBottom: 4 }}>
      <Text size="2xl" weight="bold" style={{ color: colors.text[theme].primary }}>
        Welcome back, {firstName}
      </Text>
      <Text size="md" style={{ color: colors.text[theme].secondary }}>
        Your dashboard is ready.
      </Text>
    </Stack>
  )
}
