/**
 * EmptyState - Tamagui-based empty state component
 */
import React from 'react';
import { YStack, XStack, Text, Button } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  helpLinks?: Array<{
    label: string;
    href: string;
  }>;
}

function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryActions,
  helpLinks
}: EmptyStateProps) {
  return (
    <YStack
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      paddingVertical="$8"
      paddingHorizontal="$4"
    >
      <YStack marginBottom="$4" color="$color8">
        {icon}
      </YStack>
      <Text fontSize="$6" fontWeight="600" marginBottom="$2">
        {title}
      </Text>
      <Text
        color="$color10"
        textAlign="center"
        maxWidth={448}
        marginBottom="$6"
      >
        {description}
      </Text>

      {primaryAction && (
        <CoreButton onClick={primaryAction.onClick}>
          {primaryAction.label}
        </CoreButton>
      )}

      {secondaryActions && secondaryActions.length > 0 && (
        <XStack gap="$4" marginTop="$4">
          {secondaryActions.map((action, i) => (
            <CoreButton
              key={i}
              variant="outlined"
              onClick={action.onClick}
            >
              {action.label}
            </CoreButton>
          ))}
        </XStack>
      )}

      {helpLinks && helpLinks.length > 0 && (
        <YStack marginTop="$8" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
          <Text fontSize="$2" color="$color10" marginBottom="$2">
            Need help getting started?
          </Text>
          <XStack gap="$4">
            {helpLinks.map((link, i) => (
              <Text
                key={i}
                as="a"
                href={link.href}
                fontSize="$2"
                color="$blue9"
                textDecorationLine="underline"
              >
                {link.label}
              </Text>
            ))}
          </XStack>
        </YStack>
      )}
    </YStack>
  );
}

export default EmptyState;
