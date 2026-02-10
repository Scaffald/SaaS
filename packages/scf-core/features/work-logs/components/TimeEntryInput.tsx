import { MinusCircle } from '@tamagui/lucide-icons'
import { memo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Platform } from 'react-native'
import { Button, Input, Text, Row, Stack } from '@unicornlove/beyond-ui'

import type { CreateWorkLogInput } from '@scf/schemas'

export interface TimeEntryInputProps {
  index: number
  onRemove?: () => void
  disableRemove?: boolean
}

const getInputPropsForPlatform = () => {
  if (Platform.OS === 'web') {
    return {
      type: 'time' as const,
      step: 300,
    }
  }

  return {
    inputMode: 'numeric' as const,
    keyboardType: 'numbers-and-punctuation' as const,
  }
}

export const TimeEntryInput = memo(function TimeEntryInput({
  index,
  onRemove,
  disableRemove = false,
}: TimeEntryInputProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateWorkLogInput>()

  const rowError = errors.timeEntries?.[index]

  return (
    <Stack
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$4"
      padding="$3"
      gap="$2"
      backgroundColor="$background"
    >
      <Row gap="$3" alignItems="center">
        <Stack flex={1} gap="$1">
          <Text fontWeight="600" fontSize="$3">
            Start Time
          </Text>
          <Controller
            control={control}
            name={`timeEntries.${index}.start`}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="08:00"
                autoCapitalize="none"
                autoCorrect={false}
                {...getInputPropsForPlatform()}
              />
            )}
          />
          {rowError?.start?.message && (
            <Text fontSize="$2" color="$red10">
              {rowError.start.message}
            </Text>
          )}
        </Stack>

        <Stack flex={1} gap="$1">
          <Text fontWeight="600" fontSize="$3">
            End Time
          </Text>
          <Controller
            control={control}
            name={`timeEntries.${index}.end`}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="16:30"
                autoCapitalize="none"
                autoCorrect={false}
                {...getInputPropsForPlatform()}
              />
            )}
          />
          {rowError?.end?.message && (
            <Text fontSize="$2" color="$red10">
              {rowError.end.message}
            </Text>
          )}
        </Stack>

        <Button
          size="$3"
          chromeless
          onPress={onRemove}
          disabled={disableRemove}
          icon={MinusCircle}
          accessibilityLabel="Remove time entry"
          style={{ alignSelf: 'flex-end' }}
        />
      </Row>

      {typeof rowError?.message === 'string' && (
        <Text fontSize="$2" color="$red10">
          {rowError.message}
        </Text>
      )}
    </Stack>
  )
})
