import { AlertTriangle, ChevronRight } from 'lucide-react';
import { YStack, XStack, Text, Card } from '@unicornlove/ui';

interface WarningsCardProps {
  count: number;
  onClick?: () => void;
}

export default function WarningsCard({ count, onClick }: WarningsCardProps) {
  return (
    <Card
      backgroundColor="$yellow2"
      borderRadius="$4"
      borderWidth={2}
      borderColor="$yellow6"
      padding="$6"
      cursor="pointer"
      hoverStyle={{ elevation: 2 }}
      onClick={onClick}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$3">
          <YStack padding="$3" borderRadius="$4" backgroundColor="$yellow3">
            <AlertTriangle color="$yellow10" size={24} />
          </YStack>
          <YStack>
            <Text fontSize="$3" fontWeight="500" color="$color11">
              Warnings
            </Text>
            <XStack alignItems="center" gap="$2" mt="$1">
              <Text fontSize="$9" fontWeight="bold" color="$yellow10">
                {count}
              </Text>
            </XStack>
          </YStack>
        </XStack>
        <ChevronRight color="$color10" size={20} />
      </XStack>
      <YStack mt="$4">
        <Text fontSize="$1" color="$color11">Suggestions and warnings</Text>
      </YStack>
    </Card>
  );
}
