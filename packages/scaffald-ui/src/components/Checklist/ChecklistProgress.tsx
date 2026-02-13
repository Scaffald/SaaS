import { View, Text } from 'react-native'
import { Stack } from '../Layout'
import { ProgressBarBase } from '../ProgressBar'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import type { ChecklistProgressProps } from './Checklist.types'

export function ChecklistProgress({ completionPercentage }: ChecklistProgressProps) {
  return (
    <Stack gap={spacing[2]}>
      <View style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text.light.primary,
          }}
        >
          {Math.round(completionPercentage)}% Complete
        </Text>
      </View>
      <ProgressBarBase
        value={completionPercentage}
        color="success"
        style={{ height: 8, borderRadius: 8 }}
      />
    </Stack>
  )
}
