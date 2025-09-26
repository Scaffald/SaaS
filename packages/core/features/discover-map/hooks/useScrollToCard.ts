import { useRef, useCallback } from 'react'
import { Platform } from 'react-native'

export const useScrollToCard = () => {
  const scrollViewRef = useRef<unknown>(null)
  const cardRefs = useRef<Map<string, unknown>>(new Map())

  const registerCardRef = useCallback((profileId: string, ref: unknown) => {
    cardRefs.current.set(profileId, ref)
  }, [])

  const scrollToCard = useCallback((profileId: string) => {
    const cardRef = cardRefs.current.get(profileId)
    if (!cardRef || !scrollViewRef.current) return

    if (Platform.OS === 'web') {
      // Web implementation using scrollIntoView
      const element = cardRef as HTMLElement
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      })
    } else {
      // Native implementation using measureLayout and scrollTo
      const nativeCardRef = cardRef as { measureLayout: (container: unknown, onSuccess: (x: number, y: number, width: number, height: number) => void, onFail: () => void) => void }
      const nativeScrollView = scrollViewRef.current as { scrollTo: (options: { y: number; animated: boolean }) => void }
      
      nativeCardRef.measureLayout(
        scrollViewRef.current,
        (_x: number, y: number, _width: number, _height: number) => {
          nativeScrollView.scrollTo({
            y: y - 100, // Offset to center the card
            animated: true
          })
        },
        () => {} // Error callback
      )
    }
  }, [])

  return {
    scrollViewRef,
    registerCardRef,
    scrollToCard
  }
}
