import { ScrollView } from '@app/ui'
import { useScrollToTop } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { useRef, type ComponentProps } from 'react'

type ScrollToTopTabBarContainerProps = ComponentProps<typeof ScrollView>

const ScrollToTopTabBarContainer = ({ children, ...props }: ScrollToTopTabBarContainerProps) => {
  const ref = useRef(null)
  useScrollToTop(ref)

  return (
    <ScrollView {...props} ref={ref}>
      {children}
    </ScrollView>
  )
}

export default ScrollToTopTabBarContainer
