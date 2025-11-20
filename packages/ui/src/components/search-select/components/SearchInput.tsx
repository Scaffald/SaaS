import { X } from '@tamagui/lucide-icons'
import type { ComponentProps } from 'react'
import { forwardRef } from 'react'
import type { TextInput } from 'react-native'
import { Button, Input, Spinner, XStack } from 'tamagui'

interface SearchInputProps
  extends Omit<ComponentProps<typeof Input>, 'value' | 'defaultValue' | 'onChangeText'> {
  value: string
  onChangeText: (value: string) => void
  loading?: boolean
  showClear?: boolean
  onClear?: () => void
  isInvalid?: boolean
  editable?: boolean
}

export const SearchInput = forwardRef<TextInput, SearchInputProps>(
  (
    {
      value,
      onChangeText,
      placeholder,
      loading = false,
      showClear = true,
      onClear,
      disabled,
      isInvalid,
      editable = true,
      ...inputProps
    },
    ref
  ) => {
    const shouldShowClear = showClear && Boolean(value) && !loading && !disabled

    return (
      <XStack position="relative" width="100%">
        <Input
          ref={ref}
          width="100%"
          borderWidth={1}
          borderColor={isInvalid ? '$red8' : '$borderColor'}
          rounded="$4"
          bg="$background"
          px="$4"
          py="$3"
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          disabled={disabled}
          color="$color12"
          fontSize="$4"
          editable={editable}
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="none"
          focusStyle={{ borderColor: '$color8' }}
          opacity={disabled ? 0.75 : 1}
          pr={shouldShowClear || loading ? '$10' : '$4'}
          {...inputProps}
        />

        {(loading || shouldShowClear) && (
          <XStack position="absolute" r="$3" t={0} b={0} items="center" gap="$2">
            {loading ? (
              <Spinner size="small" color="$color9" />
            ) : shouldShowClear ? (
              <Button
                variant="outlined"
                size="$2"
                borderWidth={0}
                circular
                onPress={onClear}
                disabled={disabled}
                aria-label="Clear search input"
              >
                <X size={14} color="$color10" />
              </Button>
            ) : null}
          </XStack>
        )}
      </XStack>
    )
  }
)

SearchInput.displayName = 'SearchInput'
