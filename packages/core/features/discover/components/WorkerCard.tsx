import { Card, XStack, YStack, Text, Button, Avatar } from 'tamagui'
import { User, MapPin, Briefcase, Award } from '@tamagui/lucide-icons'

export interface Worker {
  id: string
  name: string | null
  first_name: string | null
  last_name: string | null
  about: string | null
  avatar_path: string | null
  created_at: string
  updated_at: string
}

interface WorkerCardProps {
  worker: Worker
  onViewDetails: (worker: Worker) => void
}

/**
 * Worker Card Component
 * Displays worker profile information in a card format
 */
export function WorkerCard({ worker, onViewDetails }: WorkerCardProps) {
  const displayName =
    worker.name || `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || 'Anonymous'

  return (
    <Card
      elevate
      bordered
      p="$4"
      bg="$background"
      hoverStyle={{ bg: '$backgroundHover', borderColor: '$borderColorHover' }}
      pressStyle={{ bg: '$backgroundPress' }}
      cursor="pointer"
      onPress={() => onViewDetails(worker)}
    >
      <YStack gap="$3">
        {/* Header */}
        <XStack gap="$3" items="flex-start">
          <Avatar circular size="$6" bg="$blue3">
            {worker.avatar_path ? (
              <Avatar.Image src={worker.avatar_path} />
            ) : (
              <Avatar.Fallback>
                <User size={24} color="$blue10" />
              </Avatar.Fallback>
            )}
          </Avatar>

          <YStack flex={1} gap="$2">
            <Text fontSize="$6" fontWeight="700" color="$color12">
              {displayName}
            </Text>
          </YStack>
        </XStack>

        {/* About */}
        {worker.about && (
          <Text fontSize="$4" color="$color11" numberOfLines={2}>
            {worker.about}
          </Text>
        )}

        {/* Actions */}
        <XStack gap="$2" pt="$2">
          <Button flex={1} size="$3" theme="blue" onPress={() => onViewDetails(worker)}>
            View Profile
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
