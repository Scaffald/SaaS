/**
 * UserTypeCard - User type selection card using Tamagui
 */
import React from 'react';
import { YStack, XStack, Text, Button, styled } from '@unicornlove/ui';
import { Loader2 } from 'lucide-react';

interface UserTypeCardProps {
  type: 'gc' | 'contractor';
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  loading?: boolean;
}

const CardButton = styled(Button, {
  name: 'UserTypeCard',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '$2',
  padding: '$4',
  backgroundColor: '$background',
  borderWidth: 2,
  borderColor: 'transparent',
  borderRadius: '$md',
  
  variants: {
    selected: {
      true: {
        borderColor: '$blue9',
        backgroundColor: '$blue2',
      },
      false: {
        hoverStyle: {
          borderColor: '$borderColorHover',
          backgroundColor: '$backgroundHover',
        },
      },
    },
  } as const,
});

function UserTypeCard({
  type,
  title,
  description,
  icon,
  selected,
  onSelect,
  loading = false
}: UserTypeCardProps) {
  return (
    <CardButton
      onPress={onSelect}
      disabled={loading}
      selected={selected}
      aria-pressed={selected}
    >
      <YStack alignItems="center" gap="$2">
        <YStack>{icon}</YStack>
        <Text fontSize="$5" fontWeight="600">
          {title}
        </Text>
        <Text fontSize="$2" color="$color10" textAlign="center">
          {description}
        </Text>
        <YStack marginTop="$2">
          {loading ? (
            <XStack alignItems="center" gap="$2">
              <Loader2 size={16} className="animate-spin" />
              <Text fontSize="$2">Loading...</Text>
            </XStack>
          ) : (
            <Text fontSize="$2" color="$blue9">
              Select {title.split(' ')[0]}
            </Text>
          )}
        </YStack>
      </YStack>
    </CardButton>
  );
}

export default UserTypeCard;
