import { ScrollView } from '@app/ui'
import { useScrollToTop } from '@react-navigation/native'
import { useRef } from 'react'
import type { ComponentProps } from 'react'

type ScrollToTopTabBarContainerProps = ComponentProps<typeof ScrollView>

const ScrollToTopTabBarContainer = ({ children, ...props }: ScrollToTopTabBarContainerProps) => {
  const ref = useRef<any>(null)
  useScrollToTop(ref as Parameters<typeof useScrollToTop>[0])

  return (
    <ScrollView {...props} ref={ref}>
      {children}
    </ScrollView>
  )
}

export default ScrollToTopTabBarContainer
