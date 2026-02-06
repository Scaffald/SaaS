import type { ReactNode } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import type { GetThemeValueForKey } from '@tamagui/core'
import { useTheme } from '@tamagui/core'
import { Text } from 'tamagui'
import { YStack, XStack } from '@tamagui/stacks'
import { Button } from '../buttons/Button'

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
    background: '$blue2',
    borderColor: '$blue4',
  },
  success: {
    background: '$green2',
    borderColor: '$green4',
  },
  warning: {
    background: '$orange2',
    borderColor: '$orange4',
  },
  error: {
    background: '$red2',
    borderColor: '$red4',
  },
} as const

const closeButtonStyle = {
  padding: '$1.5',
  borderRadius: '$3',
  background: 'transparent',
  borderWidth: 0,
  hoverStyle: {
    background: 'rgba(0, 0, 0, 0.05)',
  },
  pressStyle: {
    background: 'rgba(0, 0, 0, 0.1)',
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
    <YStack {...(variantStyles[variant] as Record<string, unknown>)} style={{ borderRadius: 16 }} borderWidth={1} p="$4">
      <XStack>
        {icon && (
          <XStack style={{ flexShrink: 0 }}>
            <Icon color={config.iconColor} size={20} />
          </XStack>
        )}
        <YStack flex={1} style={{ marginLeft: icon ? 12 : 0 }}>
          {title && (
            <Text
              fontSize="$2"
              fontWeight="600"
              style={{ marginBottom: 4 }}
              color={config.titleColor as GetThemeValueForKey<'color'>}
            >
              {title}
            </Text>
          )}
          <Text fontSize="$2" color={config.textColor as GetThemeValueForKey<'color'>}>
            {children}
          </Text>
        </YStack>
        {closable && onClose && (
          <XStack style={{ flexShrink: 0, marginLeft: 12 }}>
            <Button {...(closeButtonStyle as Record<string, unknown>)} onPress={onClose} aria-label="Dismiss">
              <X size={16} color={config.iconColor} />
            </Button>
          </XStack>
        )}
      </XStack>
    </YStack>
  )
}
