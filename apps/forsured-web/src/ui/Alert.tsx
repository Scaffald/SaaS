import React, { ReactNode } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { YStack, XStack, Text, Button, styled, useTheme } from '@unicornlove/ui';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  closable?: boolean;
  icon?: boolean;
  className?: string;
}

const AlertContainer = styled(YStack, {
  name: 'AlertContainer',
  borderRadius: '$lg',
  borderWidth: 1,
  padding: '$4',
  variants: {
    variant: {
      info: {
        backgroundColor: '$blue2',
        borderColor: '$blue4',
      },
      success: {
        backgroundColor: '$green2',
        borderColor: '$green4',
      },
      warning: {
        backgroundColor: '$orange2',
        borderColor: '$orange4',
      },
      error: {
        backgroundColor: '$red2',
        borderColor: '$red4',
      },
    },
  } as const,
});

const CloseButton = styled(Button, {
  name: 'AlertCloseButton',
  padding: '$1.5',
  borderRadius: '$md',
  backgroundColor: 'transparent',
  hoverStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  pressStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  closable = false,
  icon = true,
  className = '',
}: AlertProps) {
  const theme = useTheme();
  
  const variantConfig = {
    info: {
      icon: Info,
      iconColor: theme.blue9.val,
      titleColor: '$blue11',
      textColor: '$blue10',
    },
    success: {
      icon: CheckCircle,
      iconColor: theme.green9.val,
      titleColor: '$green11',
      textColor: '$green10',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: theme.orange9.val,
      titleColor: '$orange11',
      textColor: '$orange10',
    },
    error: {
      icon: XCircle,
      iconColor: theme.red9.val,
      titleColor: '$red11',
      textColor: '$red10',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AlertContainer variant={variant} className={className}>
      <XStack>
        {icon && (
          <XStack flexShrink={0}>
            <Icon color={config.iconColor} size={20} />
          </XStack>
        )}
        <YStack flex={1} marginLeft={icon ? '$3' : '$0'}>
          {title && (
            <Text fontSize="$2" fontWeight="600" marginBottom="$1" color={config.titleColor}>
              {title}
            </Text>
          )}
          <Text fontSize="$2" color={config.textColor}>
            {children}
          </Text>
        </YStack>
        {closable && onClose && (
          <XStack flexShrink={0} marginLeft="$3">
            <CloseButton onPress={onClose} aria-label="Dismiss">
              <X size={16} color={config.iconColor} />
            </CloseButton>
          </XStack>
        )}
      </XStack>
    </AlertContainer>
  );
}
