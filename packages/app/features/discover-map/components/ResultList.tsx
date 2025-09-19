import { ScrollView, Separator, Text, XStack, YStack } from '@my/ui'

import type { TalentProfile } from '../types'
import { ResultCard } from './ResultCard'

type ResultListProps = {
  profiles: TalentProfile[]
  selectedId: string | null
  onSelect: (profileId: string) => void
}

export const ResultList = ({ profiles, selectedId, onSelect }: ResultListProps) => {
  return (
    <YStack flex={1} gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontWeight="700" fontSize="$5">
          {profiles.length} results
        </Text>
        <Text color="$color10" fontSize="$3">
          Worker · Organization legend
        </Text>
      </XStack>
      <ScrollView flex={1} showsVerticalScrollIndicator renderToHardwareTextureAndroid>
        <YStack gap="$3" paddingBottom="$6">
          {profiles.map((profile, index) => (
            <YStack key={profile.id} gap="$3">
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
