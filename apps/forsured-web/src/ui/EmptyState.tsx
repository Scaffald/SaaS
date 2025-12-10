import React, { ReactNode } from 'react';
import { Button } from '@unicornlove/ui';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';
import type { ButtonProps } from '@unicornlove/ui';

export interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  } & Partial<ButtonProps>;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  } & Partial<ButtonProps>;
  children?: ReactNode;
  className?: string;
}

const EmptyStateContainer = styled(YStack, {
  name: 'EmptyStateContainer',
  textAlign: 'center',
  paddingVertical: '$12',
  paddingHorizontal: '$4',
});

const IconContainer = styled(XStack, {
  name: 'EmptyStateIconContainer',
  justifyContent: 'center',
  marginBottom: '$4',
});

const IconCircle = styled(XStack, {
  name: 'EmptyStateIconCircle',
  width: 64, // w-16
  height: 64, // h-16
  borderRadius: '$full',
  backgroundColor: '$gray3',
  alignItems: 'center',
  justifyContent: 'center',
});

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className = '',
}: EmptyStateProps) {
  return (
    <EmptyStateContainer className={className}>
      {Icon && (
        <IconContainer>
          <IconCircle>
            <Icon size={32} color="$gray9" />
          </IconCircle>
        </IconContainer>
      )}
      <Text fontSize="$4" fontWeight="600" color="$color11" marginBottom="$2">
        {title}
      </Text>
      {description && (
        <Text color="$color10" maxWidth={448} marginHorizontal="auto" marginBottom="$6">
          {description}
        </Text>
      )}
      {children}
      {(action || secondaryAction) && (
        <XStack alignItems="center" justifyContent="center" gap="$3" marginTop="$6">
          {action && (
            <Button
              onPress={action.onClick}
              variant={action.variant || 'primary'}
              size={action.size || 'md'}
              {...action}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onPress={secondaryAction.onClick}
              variant={secondaryAction.variant || 'outlined'}
              size={secondaryAction.size || 'md'}
              {...secondaryAction}
            >
              {secondaryAction.label}
            </Button>
          )}
        </XStack>
      )}
    </EmptyStateContainer>
  );
}
