import { ScrollView, Separator, Text, XStack, YStack, Spinner } from '@app/ui'

import type { TalentProfile } from '../types'
import { ResultCard } from './ResultCard'

type ResultListProps = {
  profiles: TalentProfile[]
  selectedId: string | null
  onSelect: (profileId: string) => void
  isLoading?: boolean
}

export const ResultList = ({ profiles, selectedId, onSelect, isLoading }: ResultListProps) => {
  if (isLoading) {
    return (
      <YStack flex={1} gap="$3" alignItems="center" justifyContent="center">
        <Spinner size="large" />
        <Text color="$color10">Loading talent profiles...</Text>
      </YStack>
    )
  }

  return (
    <YStack flex={1} gap="$3" overflow="hidden">
      <XStack justifyContent="space-between" alignItems="center" flexShrink={0}>
        <Text fontWeight="700" fontSize="$5">
          {profiles.length} results
        </Text>
        <Text color="$color10" fontSize="$3">
          Worker · Organization legend
        </Text>
      </XStack>
      <ScrollView flex={1} showsVerticalScrollIndicator renderToHardwareTextureAndroid>
        <YStack gap="$2" paddingBottom="$6">
          {profiles.map((profile, index) => (
            <YStack key={profile.id} gap="$2">
              <ResultCard
                profile={profile}
                isSelected={profile.id === selectedId}
                onSelect={onSelect}
              />
              {index < profiles.length - 1 ? <Separator /> : null}
            </YStack>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  )
}
