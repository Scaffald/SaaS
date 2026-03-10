import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { Row, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { Briefcase, FileText } from 'lucide-react-native'
import { Pressable } from 'react-native'

export function MobileQuickActions() {
  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const router = useRouter()

  if (!isMobile) return null

  return (
    <Row gap={12}>
      {/* Find Jobs — dark accent tile */}
      <Pressable
        onPress={() => router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.JOBS, {}))}
        style={{
          flex: 1,
          backgroundColor: colors.fg[theme].default,
          borderRadius: 16,
          padding: 16,
          height: 88,
          justifyContent: 'space-between',
        }}
      >
        <Briefcase size={22} color={colors.primary[400]} />
        <Text size="md" weight="semibold" style={{ color: '#ffffff' }}>
          Find Jobs
        </Text>
      </Pressable>

      {/* My Resume — surface tile */}
      <Pressable
        onPress={() => router.push(buildPath(ROUTES.DASHBOARD.PROFILE.RESUME, {}))}
        style={{
          flex: 1,
          backgroundColor: colors.bg[theme].default,
          borderRadius: 16,
          padding: 16,
          height: 88,
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.border[theme].default,
        }}
      >
        <FileText size={22} color={colors.icon[theme].default} />
        <Text size="md" weight="semibold" style={{ color: colors.text[theme].primary }}>
          My Resume
        </Text>
      </Pressable>
    </Row>
  )
}
