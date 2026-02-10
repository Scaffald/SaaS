/**
 * Divider wrapper Separator
 * Provides backwards-compatible API for existing code
 */
import React, { ReactNode } from 'react'
import { Separator, Row, Text } from '@unicornlove/beyond-ui'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  label?: ReactNode
  className?: string
}

export default function Divider({
  orientation = 'horizontal',
  label,
  className = '',
}: DividerProps) {
  // Beyond UI Separator uses 'horizontal' | 'vertical' orientation, same as this wrapper
  if (orientation === 'vertical') {
    return <Separator orientation="vertical" />
  }

  // For labeled dividers, we need a custom implementation
  // Beyond UI Separator doesn't support labels directly
  if (label) {
    return (
      <Row alignItems="center" gap={16}>
        <Separator orientation="horizontal" style={{ flex: 1 }} />
        <Text size="sm" color="secondary">
          {label}
        </Text>
        <Separator orientation="horizontal" style={{ flex: 1 }} />
      </Row>
    )
  }

  return <Separator orientation="horizontal" />
}
