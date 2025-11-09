import { Text, YStack } from 'tamagui'

interface MergeComparisonViewProps {
  existingData: unknown
  newData: unknown
}

/**
 * Placeholder merge comparison view.
 * Future iterations will provide a side-by-side diff for resume re-uploads.
 */
export function MergeComparisonView({ existingData, newData }: MergeComparisonViewProps) {
  return (
    <YStack gap="$2" bg="$backgroundStrong" p="$4" rounded="$4">
      <Text fontWeight="700" fontSize="$4">
        Merge Mode Preview
      </Text>
      <Text color="$color11">
        Existing profile data and newly parsed resume details will appear here for side-by-side comparison.
      </Text>
      <Text color="$color10">
        Existing data snapshot: {JSON.stringify(existingData, null, 2).slice(0, 160)}...
      </Text>
      <Text color="$color10">
        New resume data snapshot: {JSON.stringify(newData, null, 2).slice(0, 160)}...
      </Text>
    </YStack>
  )
}

