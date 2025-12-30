import type { ReactNode } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { Text, useTheme, Button } from 'tamagui'
import { YStack, XStack } from '@tamagui/stacks'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  onClose?: () => void
  closable?: boolean
  icon?: boolean
}

const variantStyles = {
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
} as const

const closeButtonStyle = {
  padding: '$1.5',
  borderRadius: '$3',
  backgroundColor: 'transparent',
  borderWidth: 0,
  hoverStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  pressStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
} as const

/**
 * Alert component for displaying contextual feedback messages
 * @param variant - The visual style: 'info' | 'success' | 'warning' | 'error'
 * @param title - Optional title text
 * @param children - Alert content/message
 * @param onClose - Callback when close button is clicked
 * @param closable - Whether to show close button
 * @param icon - Whether to show variant icon
 * @example
 * <Alert variant="success" title="Success!">Operation completed</Alert>
 */
export default function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  closable = false,
  icon = true,
}: AlertProps) {
  const theme = useTheme()

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
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <YStack borderRadius="$4" borderWidth={1} padding="$4" {...variantStyles[variant]}>
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
            <Button {...closeButtonStyle} onPress={onClose} aria-label="Dismiss">
              <X size={16} color={config.iconColor} />
            </Button>
          </XStack>
        )}
      </XStack>
    </YStack>
  )
}
