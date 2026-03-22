import { useProfileCompletion } from '@scf/core/features/dashboard/completion/useProfileCompletion'
import { Row, Stack, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { ChevronRight, CircleDot } from 'lucide-react-native'
import { Pressable, View } from 'react-native'

function getStrengthLabel(pct: number): string {
  if (pct >= 80) return 'Strong'
  if (pct >= 50) return 'Intermediate'
  if (pct >= 25) return 'Getting Started'
  return 'Beginner'
}

export function MobileProfileStrength() {
  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const { completionData, isLoading } = useProfileCompletion()
  const router = useRouter()

  if (!isMobile || isLoading || !completionData) return null

  const { completionPercentage, items } = completionData
  const incompleteItems = items.filter((item) => !item.complete).slice(0, 3)

  if (incompleteItems.length === 0) return null

  const strengthLabel = getStrengthLabel(completionPercentage)

  return (
    <View
      style={{
        backgroundColor: colors.bg[theme].subtle,
        borderRadius: 16,
        padding: 20,
      }}
    >
      {/* Header */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Stack gap={2}>
          <Text
            size="xs"
            weight="semibold"
            style={{
              color: colors.text[theme].tertiary,
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontSize: 10,
            }}
          >
            Profile Strength
          </Text>
          <Text size="lg" weight="bold" style={{ color: colors.primary[600] }}>
            {strengthLabel}
          </Text>
        </Stack>
        <Text size="sm" weight="semibold" style={{ color: colors.primary[600] }}>
          {completionPercentage}%
        </Text>
      </Row>

      {/* Progress bar */}
      <View
        style={{
          height: 6,
          backgroundColor: colors.bg[theme].muted,
          borderRadius: 3,
          overflow: 'hidden',
          marginTop: 12,
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${completionPercentage}%`,
            backgroundColor: colors.primary[500],
            borderRadius: 3,
          }}
        />
      </View>

      {/* Action items */}
      <Stack gap={8} style={{ marginTop: 16 }}>
        {incompleteItems.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (item.actionRoute) router.push(item.actionRoute)
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              backgroundColor: colors.bg[theme].default,
              borderRadius: 12,
            }}
          >
            <CircleDot size={18} color={colors.primary[500]} />
            <Text
              size="sm"
              weight="medium"
              style={{ color: colors.text[theme].primary, flex: 1 }}
            >
              {item.title}
            </Text>
            <ChevronRight size={16} color={colors.icon[theme].muted} />
          </Pressable>
        ))}
      </Stack>
    </View>
  )
}
