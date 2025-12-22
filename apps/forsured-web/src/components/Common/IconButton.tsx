/**
 * IconButton - Tamagui-based icon button component
 */
import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button, XStack, Text, styled } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonShape = 'square' | 'round';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  badge?: boolean;
  badgeContent?: string | number;
  tooltip?: string;
}

const IconButtonBase = styled(Button, {
  name: 'IconButton',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 0,
  backgroundColor: 'transparent',
  
  variants: {
    variant: {
      primary: {
        color: '$blue9',
        hoverStyle: { backgroundColor: '$blue3' },
        pressStyle: { backgroundColor: '$blue4', scale: 0.95 },
      },
      secondary: {
        color: '$orange9',
        hoverStyle: { backgroundColor: '$orange3' },
        pressStyle: { backgroundColor: '$orange4', scale: 0.95 },
      },
      ghost: {
        color: '$color11',
        hoverStyle: { backgroundColor: '$backgroundHover', color: '$blue9' },
        pressStyle: { backgroundColor: '$backgroundPress', scale: 0.95 },
      },
      danger: {
        color: '$red9',
        hoverStyle: { backgroundColor: '$red3' },
        pressStyle: { backgroundColor: '$red4', scale: 0.95 },
      },
    },
    size: {
      sm: {
        padding: '$1',
        minWidth: '$3',
        minHeight: '$3',
      },
      md: {
        padding: '$2',
        minWidth: '$4',
        minHeight: '$4',
      },
      lg: {
        padding: '$3',
        minWidth: '$5',
        minHeight: '$5',
      },
    },
    shape: {
      square: {
        borderRadius: '$3',
      },
      round: {
        borderRadius: '$10',
      },
    },
  } as const,
  
  defaultVariants: {
    variant: 'ghost',
    size: 'md',
    shape: 'square',
  },
});

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      variant = 'ghost',
      size = 'md',
      shape = 'square',
      badge = false,
      badgeContent,
      tooltip,
      disabled,
      ...props
    },
    ref
  ) => {
    const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;

    return (
      <XStack position="relative" alignItems="center" justifyContent="center">
        <IconButtonBase
          ref={ref}
          variant={variant}
          size={size}
          shape={shape}
          disabled={disabled}
          title={tooltip}
          aria-label={tooltip}
          {...props}
        >
          <Icon size={iconSize} />
        </IconButtonBase>
        {badge && (
          <XStack
            position="absolute"
            top={-4}
            right={-4}
            backgroundColor="$orange9"
            borderRadius="$10"
            minWidth={20}
            minHeight={20}
            alignItems="center"
            justifyContent="center"
            paddingHorizontal="$1"
            zIndex={10}
          >
            <Text fontSize="$1" color="$color1" fontWeight="600">
              {badgeContent || ''}
            </Text>
          </XStack>
        )}
      </XStack>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
