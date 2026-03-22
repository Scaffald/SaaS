import { Briefcase, ChevronRight, Star } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Card, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface OccupationCardProps {
  title: string
  onetCode: string
  onPress: () => void
  /** Show as a saved/target occupation (star icon on left, active border) */
  isSaved?: boolean
  /** Show a small star indicator (used in search results for saved items) */
  showSavedIndicator?: boolean
}

export function OccupationCard({
  title,
  onetCode,
  onPress,
  isSaved = false,
  showSavedIndicator = false,
}: OccupationCardProps) {
  const { theme } = useThemeContext()

  return (
    <Pressable onPress={onPress}>
      <Card
        padding="md"
        style={{
          backgroundColor: colors.bg[theme].default,
          borderWidth: 1,
          borderColor: isSaved || showSavedIndicator
            ? colors.border[theme].active
            : colors.border[theme].default,
        }}
      >
        <Row gap={12} align="center">
          {isSaved ? (
            <Star size={18} color={colors.warning[500]} fill={colors.warning[500]} />
          ) : (
            <Briefcase size={20} color={colors.icon[theme].default} />
          )}
          <Stack style={{ flex: 1 }}>
            <Text style={{ color: colors.text[theme].primary }}>{title}</Text>
            <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>{onetCode}</Text>
          </Stack>
          {showSavedIndicator && !isSaved && (
            <Star size={16} color={colors.warning[500]} fill={colors.warning[500]} />
          )}
          <ChevronRight size={16} color={colors.icon[theme].default} />
        </Row>
      </Card>
    </Pressable>
  )
}
