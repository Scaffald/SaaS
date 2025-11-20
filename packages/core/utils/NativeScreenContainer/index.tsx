/* c8 ignore file */

import { useScrollToTop } from '@react-navigation/native'
import { type ComponentProps, type RefObject, useRef } from 'react'
import { ScrollView } from 'tamagui'

type ScrollToTopTabBarContainerProps = ComponentProps<typeof ScrollView>

const ScrollToTopTabBarContainer = ({ children, ...props }: ScrollToTopTabBarContainerProps) => {
  const ref = useRef<ScrollView>(null)
  useScrollToTop(
    ref as RefObject<{ scrollTo: (options: { y: number; animated: boolean }) => void }>
  )

  return (
    <ScrollView {...props} ref={ref}>
      {children}
    </ScrollView>
  )
}

export default ScrollToTopTabBarContainer
