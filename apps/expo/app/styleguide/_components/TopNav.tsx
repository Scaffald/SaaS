// @ts-nocheck
import React, { useCallback, useEffect, useRef } from 'react'
import { Link } from 'expo-router'
import { Button, Input, Text, Theme, View, XStack, YStack, isWeb } from '@app/ui'
import { Github, Search } from '@tamagui/lucide-icons'
import { ScaffaldLogo } from '@app/core/assets/ScaffaldLogo'

type StyleguideTopNavProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  approvalCount: number
}

export function StyleguideTopNav({
  searchQuery,
  onSearchChange,
  approvalCount,
}: StyleguideTopNavProps) {
  const inputRef = useRef<unknown>(null)

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return
    const handler = (event: KeyboardEvent) => {
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        ;(inputRef.current as { focus?: () => void } | null)?.focus?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleChange = useCallback(
    (value: string) => {
      onSearchChange(value)
    },
    [onSearchChange]
  )

  return (
    <Theme name="light">
      <YStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        backgroundColor="$color2"
        borderBottomWidth={1}
        borderColor="$color6"
        zIndex={10}
      >
        <XStack
          gap="$4"
          alignItems="center"
          justifyContent="space-between"
          $sm={{ flexDirection: 'column', alignItems: 'stretch', gap: '$3' }}
        >
          <XStack alignItems="center" gap="$3">
            <Link href="/styleguide" asChild>
              <Button
                unstyled
                aria-label="Scaffald Styleguide home"
                pressStyle={{ opacity: 0.85 }}
                padding={0}
              >
                <XStack alignItems="center" gap="$2">
                  <View width={96} height={24} accessibilityRole="image">
                    <ScaffaldLogo width={96} height={24} />
                  </View>
                  <Text fontSize={14} fontWeight="500" color="$color11">
                    Component Showcase
                  </Text>
                </XStack>
              </Button>
            </Link>
            <View
              backgroundColor="$color8"
              borderRadius="$3"
              paddingHorizontal="$2"
              paddingVertical="$1"
            >
              <Text fontSize={11} color="$color1" fontWeight="600">
                BETA
              </Text>
            </View>
          </XStack>
          <XStack flex={1} gap="$3" alignItems="center">
            <View flex={1} minWidth={160}>
              <SearchField
                ref={inputRef}
                value={searchQuery}
                onValueChange={handleChange}
                placeholder="Search components, tokens, or pages"
              />
            </View>
            <Link href="/styleguide/approval-queue" asChild>
              <Button
                size="$3"
                iconAfter={() => (
                  <View
                    backgroundColor="$color9"
                    paddingHorizontal={8}
                    paddingVertical={2}
                    borderRadius={999}
                  >
                    <Text fontSize={11} color="$color1" fontWeight="700">
                      {approvalCount}
                    </Text>
                  </View>
                )}
              >
                Approvals
              </Button>
            </Link>
            <Button
              size="$3"
              icon={Github}
              onPress={() => {
                if (isWeb && typeof window !== 'undefined') {
                  window.open('https://github.com/Scaffald/scf-neue', '_blank', 'noopener')
                }
              }}
              accessibilityLabel="Open repository on GitHub"
            >
              GitHub
            </Button>
          </XStack>
        </XStack>
      </YStack>
    </Theme>
  )
}

type SearchFieldProps = {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

const SearchField = React.forwardRef<unknown, SearchFieldProps>(
  ({ value, onValueChange, placeholder }, ref) => (
    <XStack
      alignItems="center"
      backgroundColor="$color3"
      borderRadius="$4"
      paddingHorizontal="$3"
      borderWidth={1}
      borderColor="$color6"
      focusStyle={{ borderColor: '$color9', shadowColor: '$color9', shadowRadius: 6 }}
      gap="$2"
    >
      <Search size={16} color="var(--color10)" />
      <Input
        ref={ref as never}
        flex={1}
        unstyled
        value={value}
        onChangeText={onValueChange}
        placeholder={placeholder}
        fontSize={14}
        backgroundColor="transparent"
        color="$color11"
        accessibilityLabel="Search the styleguide"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {isWeb ? (
        <View backgroundColor="$color5" paddingHorizontal={8} paddingVertical={2} borderRadius={6}>
          <Text fontSize={11} color="$color10">
            /
          </Text>
        </View>
      ) : null}
    </XStack>
  )
)

SearchField.displayName = 'StyleguideSearchField'
