import { ScrollView } from '@app/ui'
import { useScrollToTop } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { useRef, type ComponentProps, RefObject } from 'react'

type ScrollToTopTabBarContainerProps = ComponentProps<typeof ScrollView>

const ScrollToTopTabBarContainer = ({ children, ...props }: ScrollToTopTabBarContainerProps) => {
  const ref = useRef<ScrollView>(null)
  useScrollToTop(
    ref as RefObject<{ scrollTo: (options: { y: number; animated: boolean }) => void }>
  )

  return (
    <ScrollView {...props} reflex={ref}>
      {children}
    </ScrollView>
  )
}

export default ScrollToTopTabBarContainer
