import { View, Text, Pressable } from 'react-native'
import { Row } from '../Layout'
import { Stack } from '../Layout'
import { Paragraph } from '../Typography'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import type { ChecklistItemProps } from './Checklist.types'

export function ChecklistItem({ item, onPress }: ChecklistItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          paddingVertical: spacing[4],
          paddingHorizontal: spacing[3],
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border.light.default,
          backgroundColor: colors.bg.light.default,
        },
        pressed && onPress && {
          backgroundColor: colors.gray[50],
          borderColor: colors.gray[200],
        },
      ]}
    >
      <Row gap={spacing[3]} align="flex-start" style={{ flex: 1 }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 100,
            backgroundColor: item.complete ? colors.success[500] : colors.gray[200],
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
        >
          {item.complete ? (
            <Text style={{ fontSize: 12, color: '#fff', fontWeight: '700' }}>✓</Text>
          ) : null}
        </View>
        <Stack gap={spacing[2]} style={{ flex: 1 }}>
          <Paragraph
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: item.complete ? colors.text.light.secondary : colors.text.light.primary,
              textAlign: 'left',
            }}
          >
            {item.title}
          </Paragraph>
          <Paragraph
            style={{
              fontSize: 14,
              color: colors.text.light.secondary,
              lineHeight: 20,
              textAlign: 'left',
            }}
          >
            {item.description}
          </Paragraph>
        </Stack>
      </Row>
    </Pressable>
  )
}
