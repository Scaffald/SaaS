import { X } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import { Button, ScrollView, Text, useWindowDimensions, XStack, YStack } from 'tamagui'
import { Dialog } from './dialog/Dialog'
import { Sheet } from './sheets/Sheet'

/**
 * Size presets for ResponsiveModal
 */
const MODAL_SIZES = {
  small: { maxW: 500, maxH: 600 },
  medium: { maxW: 700, maxH: 700 },
  large: { maxW: 900, maxH: 800 },
  full: { maxW: 1200, maxH: 900 },
} as const

export interface ResponsiveModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Modal title displayed in header */
  title: string
  /** Modal content */
  children: ReactNode
  /** Size variant - affects width/height on desktop */
  size?: 'small' | 'medium' | 'large' | 'full'
  /** Whether to show header with title and close button */
  showHeader?: boolean
  /** Whether to show close button in header */
  showCloseButton?: boolean
  /** Custom dialog width (overrides size preset) */
  dialogWidth?: number
  /** Custom dialog height (overrides size preset) */
  dialogHeight?: number
  /** Custom sheet snap points for mobile */
  sheetSnapPoints?: number[]
}

/**
 * ResponsiveModal Component
 *
 * A cross-platform modal component that automatically adapts to viewport size:
 * - Desktop (>800px, $md): Renders as centered Dialog with configurable size
 * - Mobile (≤800px, $sm): Renders as full-screen Sheet
 *
 * Features:
 * - Automatic responsive behavior based on Tamagui breakpoints
 * - Consistent header with title and close button
 * - ScrollView wrapper for content overflow
 * - Size presets (small, medium, large, full)
 * - Smooth animations and transitions
 *
 * @example
 * ```tsx
 * <ResponsiveModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Edit Profile"
 *   size="medium"
 * >
 *   <YourContent />
 * </ResponsiveModal>
 * ```
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  children,
  size = 'medium',
  showHeader = true,
  showCloseButton = true,
  dialogWidth,
  dialogHeight,
  sheetSnapPoints = [90],
}: ResponsiveModalProps) {
  // Use window dimensions for conditional rendering
  // Breakpoint: 800px (matches Tamagui $sm/$md breakpoint)
  const { width } = useWindowDimensions()
  const isMobile = width <= 800

  // Get size configuration
  const sizeConfig = MODAL_SIZES[size]
  const finalWidth = dialogWidth ?? sizeConfig.maxW
  const finalHeight = dialogHeight ?? sizeConfig.maxH

  // Mobile: Render as Sheet
  if (isMobile) {
    return (
      <Sheet
        modal
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={sheetSnapPoints}
        dismissOnSnapToBottom
        zIndex={100000}
        animation="medium"
      >
        <Sheet.Overlay />
        <Sheet.Frame>
          <Sheet.Handle />

          {showHeader && (
            <XStack
              px="$4"
              pt="$3"
              pb="$2"
              justify="space-between"
              items="center"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
            >
              <Text fontSize="$6" fontWeight="700" flex={1}>
                {title}
              </Text>
              {showCloseButton && (
                <Button
                  size="$3"
                  circular
                  chromeless
                  icon={X}
                  onPress={() => onOpenChange(false)}
                />
              )}
            </XStack>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack p="$4" gap="$4">
              {children}
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    )
  }

  // Desktop: Render as Dialog
  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" />
        <Dialog.Content key="content" width={finalWidth} height={finalHeight} gap="$0">
          {showHeader && (
            <XStack
              p="$4"
              justify="space-between"
              items="center"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
            >
              <Dialog.Title fontSize="$6" fontWeight="700" flex={1}>
                {title}
              </Dialog.Title>
              {showCloseButton && (
                <Dialog.Close asChild>
                  <Button size="$3" circular chromeless icon={X} />
                </Dialog.Close>
              )}
            </XStack>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack p="$4" gap="$4">
              {children}
            </YStack>
          </ScrollView>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
