import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from '@app/core/utils/usePathname'

export interface OfficeFlyoutMenuState {
  isOpen: boolean
  hoveredItem: string | null
  activeRoute: string
}

export interface OfficeFlyoutMenuActions {
  setIsOpen: (open: boolean) => void
  setHoveredItem: (item: string | null) => void
  handleMouseEnter: () => void
  handleMouseLeave: () => void
  cancelHoverDelay: () => void
  toggleMenu: () => void
  triggerRef: React.RefObject<HTMLElement | null>
}

export const useOfficeFlyoutMenu = (): OfficeFlyoutMenuState & OfficeFlyoutMenuActions => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const triggerRef = useRef<HTMLElement>(null)

  // Active route detection
  const activeRoute = pathname || ''

  // Hover delay logic
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true)
    }, 200) // 200ms delay
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setHoveredItem(null)
    }, 150) // Slight delay before closing
  }, [])

  const cancelHoverDelay = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }, [])

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
        setHoveredItem(null)
        // Return focus to trigger
        triggerRef.current?.focus?.()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return {
    isOpen,
    setIsOpen,
    hoveredItem,
    setHoveredItem,
    activeRoute,
    handleMouseEnter,
    handleMouseLeave,
    cancelHoverDelay,
    toggleMenu,
    triggerRef,
  }
}

