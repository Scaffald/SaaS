import type { ReactNode } from 'react'
import { vi } from 'vitest'

const tamagui = await vi.importActual<typeof import('tamagui')>('tamagui')

const basicDiv = ({ testID, children, ...rest }: { testID?: string; children?: ReactNode }) => (
  <div data-testid={testID} {...rest}>
    {children}
  </div>
)

const Image = (props: any) => <img {...props} alt="" />

const View = basicDiv

export const styled = (Component: React.ComponentType) => {
  return (props: any) => {
    return <Component {...props} />
  }
}

export const createStyledContext = () => ({})
export const withStaticProperties = (Component: React.ComponentType, _: any) => Component

export const useWindowDimensions = () => ({ width: 1024, height: 768 })
export const useMedia = () => ({ sm: false })

export const Button = ({
  onPress,
  children,
  ...rest
}: {
  onPress?: () => void
  children?: ReactNode
}) => (
  <button type="button" onClick={onPress} {...rest}>
    {children}
  </button>
)

export const Dialog = tamagui.Dialog
export const Sheet = tamagui.Sheet
export const ScrollView = tamagui.ScrollView
export const XStack = tamagui.XStack
export const YStack = tamagui.YStack
export const Text = tamagui.Text
export const Adapt = tamagui.Adapt
export const Select = tamagui.Select
export const Input = tamagui.Input
export { Image, View }
