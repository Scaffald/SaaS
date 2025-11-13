import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from '@app/core/utils/usePathname'

export interface OfficeFlyoutMenuState {
  isOpen: boolean
  activeRoute: string
}

export interface OfficeFlyoutMenuActions {
  setIsOpen: (open: boolean) => void
  toggleMenu: () => void
  triggerRef: React.RefObject<HTMLElement | null>
}

export const useOfficeFlyoutMenu = (): OfficeFlyoutMenuState & OfficeFlyoutMenuActions => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLElement>(null)

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

