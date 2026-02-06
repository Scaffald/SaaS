import { View, Text } from 'react-native'
import { Stack } from '../Layout'
import { Spinner } from '../Spinner'
import { ChecklistHeader } from './ChecklistHeader'
import { ChecklistProgress } from './ChecklistProgress'
import { ChecklistList } from './ChecklistList'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import type { ChecklistProps } from './Checklist.types'

export function Checklist({
  title,
  subtitle,
  items,
  completionPercentage,
  onItemPress,
  isLoading = false,
  showProgress = true,
}: ChecklistProps) {
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          padding: spacing[4],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Spinner size="lg" />
        <Text style={{ marginTop: spacing[3], color: colors.text.light.secondary }}>
          Loading...
        </Text>
      </View>
    )
  }

  return (
    <Stack gap={spacing[4]} style={{ padding: spacing[4] }}>
      {(title || subtitle) && <ChecklistHeader title={title} subtitle={subtitle} />}
      {showProgress && <ChecklistProgress completionPercentage={completionPercentage} />}
      <ChecklistList items={items} onItemPress={onItemPress} />
    </Stack>
  )
}
