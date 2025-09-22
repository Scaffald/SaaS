import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import {
  Input,
  type InputProps,
  ListItem,
  Separator,
  Spinner,
  Theme,
  YStack,
} from 'tamagui'

type RawSuggestion = {
  place_id: number
  display_name: string
  address?: Record<string, string | undefined>
}

export type AddressSuggestion = {
  id: string
  street?: string
  city?: string
  state?: string
  zipCode?: string
  formatted: string
}

type AddressAutocompleteInputProps = Omit<
  InputProps,
  'value' | 'onChangeText' | 'onChange' | 'defaultValue'
> & {
  value: string
  onValueChange: (value: string) => void
  onSuggestionSelected: (suggestion: AddressSuggestion) => void
  minQueryLength?: number
  debounceMs?: number
}

const mapSuggestion = (suggestion: RawSuggestion): AddressSuggestion => {
  const address = suggestion.address ?? {}
  const houseNumber = address.house_number ?? ''
  const road = address.road ?? ''
  const streetParts = [houseNumber, road].filter(Boolean)
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.hamlet ??
    address.suburb ??
    undefined

  return {
    id: String(suggestion.place_id),
    street: streetParts.length > 0 ? streetParts.join(' ') : undefined,
    city,
    state: address.state ?? address.region ?? address.state_district ?? undefined,
    zipCode: address.postcode ?? undefined,
    formatted: suggestion.display_name,
  }
}

const fetchAddressSuggestions = async (
  query: string,
  signal: AbortSignal,
): Promise<AddressSuggestion[]> => {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '6')
  url.searchParams.set('countrycodes', 'us')
  url.searchParams.set('q', query)

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch address suggestions (${response.status})`)
  }

  const data = (await response.json()) as RawSuggestion[]
  return data.map(mapSuggestion)
}

export const AddressAutocompleteInput = forwardRef<Input, AddressAutocompleteInputProps>(
  (
    {
      value,
      onValueChange,
      onSuggestionSelected,
      minQueryLength = 3,
      debounceMs = 300,
      onFocus,
      onBlur,
      disabled,
      ...inputProps
    },
    ref,
  ) => {
    const [query, setQuery] = useState(value)
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const abortRef = useRef<AbortController | null>(null)
    const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
      setQuery(value)
    }, [value])

    useEffect(() => {
      if (!isOpen) {
        setSuggestions([])
        return
      }

      if (query.trim().length < minQueryLength) {
        setSuggestions([])
        setIsLoading(false)
        abortRef.current?.abort()
        abortRef.current = null
        return
      }

      const timeout = setTimeout(async () => {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        try {
          setIsLoading(true)
          const results = await fetchAddressSuggestions(query.trim(), controller.signal)
          setSuggestions(results)
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Address autocomplete failed', error)
          }
        } finally {
          setIsLoading(false)
        }
      }, debounceMs)

      return () => {
        clearTimeout(timeout)
      }
    }, [debounceMs, isOpen, minQueryLength, query])

    useEffect(
      () => () => {
        abortRef.current?.abort()
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current)
        }
      },
      [],
    )

    const hasResults = suggestions.length > 0

    const handleSuggestionPress = (suggestion: AddressSuggestion) => {
      onSuggestionSelected(suggestion)
      setQuery(suggestion.street ?? suggestion.formatted)
      onValueChange(suggestion.street ?? suggestion.formatted)
      setIsOpen(false)
      setSuggestions([])
    }

    const suggestionItems = useMemo(
      () =>
        suggestions.map((suggestion) => {
          const subtitleParts = [suggestion.city, suggestion.state, suggestion.zipCode]
            .filter(Boolean)
            .join(', ')

          return (
            <ListItem
              key={suggestion.id}
              hoverTheme
              pressTheme
              onPress={() => handleSuggestionPress(suggestion)}
              title={suggestion.street ?? suggestion.formatted}
              subTitle={subtitleParts.length > 0 ? subtitleParts : undefined}
            />
          )
        }),
      [suggestions],
    )

    const handleFocus: InputProps['onFocus'] = (event) => {
      setIsOpen(true)
      onFocus?.(event)
    }

    const handleBlur: InputProps['onBlur'] = (event) => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
      }

      blurTimeoutRef.current = setTimeout(() => {
        setIsOpen(false)
      }, 120)

      onBlur?.(event)
    }

    return (
      <YStack gap="$2" position="relative">
        <Input
          ref={ref}
          value={value}
          onChangeText={(text) => {
            setQuery(text)
            onValueChange(text)
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          disabled={disabled}
          {...inputProps}
        />

        {isOpen && (isLoading || hasResults) && (
          <Theme name="alt1">
            <YStack
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt="$1"
              br="$4"
              bw={1}
              bc="$color5"
              bg="$color1"
              zi={1}
              shadowColor="$shadowColor"
              shadowRadius={8}
              shadowOffset={{ width: 0, height: 4 }}
              maxHeight={260}
              overflow="hidden"
            >
              {isLoading && (
                <YStack ai="center" py="$3">
                  <Spinner size="small" />
                </YStack>
              )}

              {!isLoading && hasResults && (
                <>
                  {suggestionItems}
                  <Separator />
                  <ListItem
                    disabled
                    theme="alt2"
                    title="Powered by OpenStreetMap Nominatim"
                  />
                </>
              )}
            </YStack>
          </Theme>
        )}
      </YStack>
    )
  },
)

AddressAutocompleteInput.displayName = 'AddressAutocompleteInput'
