/**
 * Dialog compound component - compatibility layer for Radix-style Dialog API.
 * Uses scaffald Modal underneath; Portal/Overlay/Content/Title/Close/Description
 * are pass-through components (Modal handles overlay and container internally).
 */

import { Modal, Button, Text } from '@scaffald/ui'
import type { ReactNode } from 'react'
import { cloneElement, Fragment, createContext, useContext, isValidElement } from 'react'
import { View } from 'react-native'

type DialogCompoundProps = {
  modal?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}

const DialogOnCloseContext = createContext<(() => void) | null>(null)

function DialogRoot({ open, onOpenChange, children }: DialogCompoundProps) {
  const handleClose = () => onOpenChange?.(false)
  return (
    <DialogOnCloseContext.Provider value={handleClose}>
      <Modal visible={open} onClose={handleClose} width="96%" style={{ maxWidth: 780, maxHeight: '85%' }}>
        {children}
      </Modal>
    </DialogOnCloseContext.Provider>
  )
}

function DialogPortal({ children }: { children: ReactNode }) {
  return <Fragment>{children}</Fragment>
}

function DialogOverlay(_props: Record<string, unknown>) {
  return null
}

function DialogContent({
  children,
  style,
  ..._rest
}: { children?: ReactNode; style?: object; [key: string]: unknown }) {
  return <View style={style as object}>{children}</View>
}

function DialogTitle({ children }: { children?: ReactNode }) {
  return (
    <Text color="$gray11" style={{ fontWeight: '600', fontSize: 18 }}>
      {children}
    </Text>
  )
}

function DialogDescription({ children }: { children?: ReactNode }) {
  return <Text color="$gray11">{children}</Text>
}

function DialogClose({
  children,
  asChild,
  disabled,
  ...rest
}: {
  children?: ReactNode
  asChild?: boolean
  disabled?: boolean
  [key: string]: unknown
}) {
  const onClose = useContext(DialogOnCloseContext)
  if (asChild && children && isValidElement(children)) {
    const child = children as React.ReactElement<{ onPress?: () => void }>
    return cloneElement(child, {
      onPress: onClose ?? child.props?.onPress,
    })
  }
  return (
    <Button
      size="sm"
      variant="outline"
      onPress={onClose ?? undefined}
      disabled={disabled}
      {...(rest as object)}
    >
      {children}
    </Button>
  )
}

export const DialogCompound = Object.assign(DialogRoot, {
  Portal: DialogPortal,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
})
