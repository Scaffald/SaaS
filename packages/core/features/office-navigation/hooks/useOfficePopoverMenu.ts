import { usePathname } from '@app/core/utils/usePathname'
import type { ElementRef } from 'react'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import type { Button } from 'tamagui'

type ButtonRef = ElementRef<typeof Button>

export interface OfficePopoverMenuState {
  isOpen: boolean
  activeRoute: string
}

export interface OfficePopoverMenuActions {
  setIsOpen: (open: boolean) => void
  toggleMenu: () => void
  triggerRef: RefObject<ButtonRef>
}

export const useOfficePopoverMenu = (): OfficePopoverMenuState & OfficePopoverMenuActions => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<ButtonRef>(null)

  // Active route detection
  const activeRoute = pathname || ''

  // Toggle for click behavior
  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  // Keyboard navigation (Escape key)
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        // Return focus to trigger
        triggerRef.current?.focus?.()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return {
    isOpen,
    setIsOpen,
    activeRoute,
    toggleMenu,
    triggerRef,
  }
}

