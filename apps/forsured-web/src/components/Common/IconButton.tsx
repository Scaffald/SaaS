/**
 * IconButton - Icon button component using Beyond UI

 */
import React, { forwardRef } from 'react'
import { LucideIcon } from 'lucide-react'
import { Button, Row, Text } from '@scaffald/ui'

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type IconButtonSize = 'sm' | 'md' | 'lg'
export type IconButtonShape = 'square' | 'round'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  variant?: IconButtonVariant
  size?: IconButtonSize
  shape?: IconButtonShape
  badge?: boolean
  badgeContent?: string | number
  tooltip?: string
}

const variantStyles: Record<IconButtonVariant, React.CSSProperties> = {
  primary: { color: 'var(--color-blue-9)' },
  secondary: { color: 'var(--color-orange-9)' },
  ghost: { color: 'var(--color-text)' },
  danger: { color: 'var(--color-red-9)' },
}

const sizeStyles: Record<IconButtonSize, { padding: number; minSize: number }> = {
  sm: { padding: 4, minSize: 24 },
  md: { padding: 8, minSize: 32 },
  lg: { padding: 12, minSize: 40 },
}

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
    const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24
    const { padding, minSize } = sizeStyles[size]

    return (
      <Row style={{ position: 'relative' }} alignItems="center" justifyContent="center">
        <Button
          ref={ref}
          variant="ghost"
          disabled={disabled}
          title={tooltip}
          aria-label={tooltip}
          style={{
            padding,
            minWidth: minSize,
            minHeight: minSize,
            borderRadius: shape === 'round' ? '50%' : 8,
            ...variantStyles[variant],
          }}
          {...props}
        >
          <Icon size={iconSize} />
        </Button>
        {badge && (
          <Row
            alignItems="center"
            justifyContent="center"
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: 'var(--color-orange-9)',
              borderRadius: 10,
              minWidth: 20,
              minHeight: 20,
              paddingLeft: 4,
              paddingRight: 4,
              zIndex: 10,
            }}
          >
            <Text size="xs" style={{ color: 'white', fontWeight: 600 }}>
              {badgeContent || ''}
            </Text>
          </Row>
        )}
      </Row>
    )
  }
)

IconButton.displayName = 'IconButton'

export default IconButton
