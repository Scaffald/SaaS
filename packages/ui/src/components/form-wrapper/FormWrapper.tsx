import { forwardRef } from 'react'
import {
  ScrollView,
  type TamaguiElement,
  withStaticProperties,
  YStack,
  type YStackProps,
} from 'tamagui'

/**
 * this is pretty straightforward on web - check FormWrapper.native
 */
const Wrapper = forwardRef<TamaguiElement, YStackProps>(function Wrapper(props, ref) {
  return <YStack ref={ref} gap="$4" flex={1} justifyContent="center" {...props} />
})

const Body = forwardRef<TamaguiElement, YStackProps>(function Body(props, ref) {
  return (
    <ScrollView>
      <YStack padding="$4" ref={ref} gap="$2" paddingBottom="$8" {...props} />
    </ScrollView>
  )
})

const Footer = forwardRef<TamaguiElement, YStackProps>(function Footer(props, ref) {
  return <YStack ref={ref} paddingBottom="$4" paddingHorizontal="$4" gap="$4" {...props} />
})

export const FormWrapper = withStaticProperties(Wrapper, {
  Body,
  Footer,
})
