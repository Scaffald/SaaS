/**
 * ResponsiveModal – Modal with open/onOpenChange API
 * Wraps Modal for consistent API with dialog libraries
 */

import type React from 'react'
import { Modal } from './Modal'
import { ModalHeader } from './ModalHeader'
import { ModalContent } from './ModalContent'
import type { ModalProps } from './Modal.types'

export interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  style?: ModalProps['style']
  testID?: string
}

const sizeToWidth: Record<NonNullable<ResponsiveModalProps['size']>, number> = {
  sm: 400,
  md: 520,
  lg: 640,
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  size = 'md',
  children,
  style,
  testID,
}: ResponsiveModalProps): React.ReactElement {
  return (
    <Modal
      visible={open}
      onClose={() => onOpenChange(false)}
      width={sizeToWidth[size]}
      style={style}
      testID={testID}
    >
      {title ? <ModalHeader title={title} onClose={() => onOpenChange(false)} /> : null}
      <ModalContent>{children}</ModalContent>
    </Modal>
  )
}
