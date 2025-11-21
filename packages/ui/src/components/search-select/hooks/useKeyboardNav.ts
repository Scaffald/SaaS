import { useCallback, useState } from 'react'

interface KeyboardEventLike {
  key?: string
  nativeEvent?: {
    key?: string
  }
  preventDefault?: () => void
}

interface UseKeyboardNavConfig {
  optionCount: number
  isEnabled: boolean
  loop?: boolean
  onSelectActive?: (index: number) => void
  onEscape?: () => void
}

export interface UseKeyboardNavResult {
  activeIndex: number
  setActiveIndex: (index: number) => void
  reset: () => void
  handleKeyDown: (event: KeyboardEventLike) => void
}

const getEventKey = (event: KeyboardEventLike) => event.nativeEvent?.key ?? event.key ?? ''

export function useKeyboardNav(config: UseKeyboardNavConfig): UseKeyboardNavResult {
  const { optionCount, isEnabled, loop = true, onSelectActive, onEscape } = config
  const [activeIndex, setActiveIndex] = useState(-1)

  const reset = useCallback(() => {
    setActiveIndex(-1)
  }, [])

  const focusNext = useCallback(() => {
    setActiveIndex((prev) => {
      if (optionCount === 0) return -1
      const next = prev + 1
      if (next >= optionCount) {
        return loop ? 0 : prev
      }
      return next
    })
  }, [loop, optionCount])

  const focusPrev = useCallback(() => {
    setActiveIndex((prev) => {
      if (optionCount === 0) return -1
      if (prev <= 0) {
        return loop ? optionCount - 1 : -1
      }
      return prev - 1
    })
  }, [loop, optionCount])

  const handleKeyDown = useCallback(
    (event: KeyboardEventLike) => {
      if (!isEnabled) {
        return
      }

      const key = getEventKey(event)
      if (!key) {
        return
      }

      switch (key) {
        case 'ArrowDown':
          event.preventDefault?.()
          focusNext()
          break
        case 'ArrowUp':
          event.preventDefault?.()
          focusPrev()
          break
        case 'Enter':
          if (activeIndex >= 0 && activeIndex < optionCount) {
            event.preventDefault?.()
            onSelectActive?.(activeIndex)
          }
          break
        case 'Escape':
          event.preventDefault?.()
          onEscape?.()
          reset()
          break
        default:
          break
      }
    },
    [activeIndex, focusNext, focusPrev, isEnabled, onEscape, onSelectActive, optionCount, reset]
  )

  return {
    activeIndex,
    setActiveIndex,
    reset,
    handleKeyDown,
  }
}
