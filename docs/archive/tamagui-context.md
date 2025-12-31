Tamagui Migration Context

  Where to Find Information

  1. Already-migrated examples in this codebase:
    - apps/forsured-web/src/components/Dashboard/EnhancedManagerDashboard.tsx
    - apps/forsured-web/src/components/Dashboard/EnhancedBrokerDashboard.tsx
    - apps/forsured-web/src/components/Dashboard/EnhancedSubcontractorDashboard.tsx
    - packages/ui/src/components/ - All shared components use Tamagui patterns
  2. Tamagui imports - Always import from tamagui or @unicornlove/ui:
  import { XStack, YStack, Text, Button, Card, Spinner, H1, H2, H3, SizableText } from 'tamagui'
  import { Alert, EmptyState, TabsCustom } from '@unicornlove/ui'

  Token Reference

  Spacing tokens (use $1 through $12):
  - $1 = 4px, $2 = 8px, $3 = 12px, $4 = 16px, $5 = 20px, $6 = 24px, $8 = 32px, $10 = 40px, $12 = 48px

  Font size tokens:
  - $1 = 11px, $2 = 12px, $3 = 13px, $4 = 14px, $5 = 16px, $6 = 18px, $7 = 20px, $8 = 24px, $9 = 32px, $10 = 48px

  Color tokens (Tamagui uses a 1-12 scale, higher = more contrast):
  - Text primary: $color12
  - Text secondary: $color11
  - Text muted: $color10
  - Background: $background
  - Background hover: $backgroundHover
  - Border: $borderColor
  - Semantic colors: $red10, $green10, $blue10, $orange10, $yellow10 (use 2-4 for backgrounds, 10-11 for text)

  Common Conversions

  | Tailwind/CSS                 | Tamagui                                              |
  |------------------------------|------------------------------------------------------|
  | <div>                        | <YStack> (vertical) or <XStack> (horizontal)         |
  | <span>                       | <Text> or <SizableText>                              |
  | <h1>                         | <H1> or <Text fontSize="$9">                         |
  | <p>                          | <Text>                                               |
  | <button>                     | <Button>                                             |
  | className="flex"             | (default on Stack)                                   |
  | className="flex-col"         | <YStack>                                             |
  | className="items-center"     | alignItems="center"                                  |
  | className="justify-between"  | justifyContent="space-between"                       |
  | className="gap-4"            | gap="$4"                                             |
  | className="p-4"              | padding="$4"                                         |
  | className="px-4"             | paddingHorizontal="$4"                               |
  | className="py-2"             | paddingVertical="$2"                                 |
  | className="mt-2"             | marginTop="$2"                                       |
  | className="w-full"           | width="100%"                                         |
  | className="rounded-lg"       | borderRadius="$4"                                    |
  | className="rounded-full"     | borderRadius={9999}                                  |
  | className="border"           | borderWidth={1}                                      |
  | className="shadow-sm"        | elevation={1}                                        |
  | className="hover:bg-gray-50" | hoverStyle={{ backgroundColor: "$backgroundHover" }} |
  | className="cursor-pointer"   | cursor="pointer"                                     |
  | className="truncate"         | numberOfLines={1} on Text                            |
  | className="grid grid-cols-3" | <XStack flexWrap="wrap"> + children with width="33%" |

  Responsive Design

  Use media query props instead of md:, lg: prefixes:
  <YStack
    width="100%"
    $gtMd={{ width: '50%' }}
    $gtLg={{ width: '33%' }}
  >

  Important Rules

  1. Never mix className with Tamagui props for the same styling concern
  2. Keep className only for third-party library requirements (e.g., chart libraries)
  3. Use tokens, not hardcoded values - padding="$4" not padding={16}
  4. Test build after each file: pnpm --filter @unicornlove/forsured-app build