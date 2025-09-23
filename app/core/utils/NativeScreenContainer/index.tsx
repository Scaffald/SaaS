import { ScrollView } from '@app/ui'
import { useScrollToTop } from '@react-navigation/native'
import { useRef } from 'react'
import type { ComponentProps } from 'react'
import type { ScrollView as RNScrollView } from 'react-native'

type ScrollToTopTabBarContainerProps = ComponentProps<typeof ScrollView>

const ScrollToTopTabBarContainer = ({ children, ...props }: ScrollToTopTabBarContainerProps) => {
  const ref = useRef<RNScrollView>(null)
  useScrollToTop(ref as any)

  return (
    <ScrollView {...props} ref={ref}>
      {children}
    </ScrollView>
  )
}

export default ScrollToTopTabBarContainer
