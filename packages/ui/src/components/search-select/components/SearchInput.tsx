import { forwardRef } from 'react'
import type { ComponentProps } from 'react'
import type { TextInput } from 'react-native'
import { Button, Input, Spinner, XStack } from 'tamagui'
import { Search, X } from '@tamagui/lucide-icons'

interface SearchInputProps
  extends Omit<ComponentProps<typeof Input>, 'value' | 'defaultValue' | 'onChangeText'> {
  value: string
  onChangeText: (value: string) => void
  loading?: boolean
  showClear?: boolean
  onClear?: () => void
  isInvalid?: boolean
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
      ...inputProps
    },
    ref
  ) => {
    const shouldShowClear = showClear && Boolean(value) && !loading && !disabled

    return (
      <XStack
        borderWidth={1}
        borderColor={isInvalid ? '$red8' : '$borderColor'}
        rounded="$4"
        bg="$background"
        pr="$2"
        items="center"
        focusStyle={{ borderColor: '$color8' }}
        opacity={disabled ? 0.75 : 1}
      >
        <Search size={16} color="$color10" style={{ marginLeft: 12 }} aria-hidden={true} />
        <Input
          ref={ref}
          flex={1}
          bg="transparent"
          borderWidth={0}
          px="$3"
          py="$3"
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          disabled={disabled}
          color="$color12"
          fontSize="$4"
          {...inputProps}
        />

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
    )
  }
)

SearchInput.displayName = 'SearchInput'
