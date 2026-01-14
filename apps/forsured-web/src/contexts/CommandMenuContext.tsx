/**
 * CommandMenu Context
 * Global state management for CommandMenu in Forsured app
 * Handles keyboard shortcuts (⌘K / Ctrl+K) and menu state
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { Platform } from 'react-native'

interface CommandMenuContextValue {
  isOpen: boolean
  openMenu: () => void
  closeMenu: () => void
  toggleMenu: () => void
}

const CommandMenuContext = createContext<CommandMenuContextValue | undefined>(undefined)

export function CommandMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openMenu = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  // Handle keyboard shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for ⌘K (Mac) or Ctrl+K (Windows/Linux)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierKey = isMac ? event.metaKey : event.ctrlKey
      const isK = event.key === 'k' || event.key === 'K'

      if (modifierKey && isK) {
        event.preventDefault()
        toggleMenu()
      }

      // Close on Escape
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        closeMenu()
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, toggleMenu, closeMenu])

  return (
    <CommandMenuContext.Provider value={{ isOpen, openMenu, closeMenu, toggleMenu }}>
      {children}
    </CommandMenuContext.Provider>
  )
}

export function useCommandMenu() {
  const context = useContext(CommandMenuContext)
  if (context === undefined) {
    throw new Error('useCommandMenu must be used within a CommandMenuProvider')
  }
  return context
}
