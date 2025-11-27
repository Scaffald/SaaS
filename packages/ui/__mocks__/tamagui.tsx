import type { ReactNode } from 'react'

export const dialogProps = {
  content: null as Record<string, unknown> | null,
}
export const sheetProps = {
  frame: null as Record<string, unknown> | null,
  sheet: null as Record<string, unknown> | null,
}
export const windowDimensions = { width: 1024 }

const basicDiv = ({ testID, children, ...rest }: { testID?: string; children?: ReactNode }) => (
  <div data-testid={testID} {...rest}>
    {children}
  </div>
)

const Dialog = ({ children, ...rest }: { children?: ReactNode }) => (
  <div data-testid="dialog" {...rest}>
    {children}
  </div>
)

Dialog.Portal = ({ children }: { children?: ReactNode }) => (
  <div data-testid="dialog-portal">{children}</div>
)

Dialog.Overlay = (props: Record<string, unknown>) => <div data-testid="dialog-overlay" {...props} />

Dialog.Content = (props: Record<string, unknown>) => {
  dialogProps.content = props
  return (
    <div data-testid="dialog-content" {...props}>
      {props.children as ReactNode}
    </div>
  )
}

Dialog.Title = ({ children, ...rest }: { children?: ReactNode }) => (
  <h2 data-testid="dialog-title" {...rest}>
    {children}
  </h2>
)

Dialog.Close = ({ asChild, children }: { asChild?: boolean; children?: ReactNode }) => (
  <div data-testid="dialog-close">{asChild ? children : <button>{children}</button>}</div>
)

const Sheet = ({ children, ...rest }: { children?: ReactNode }) => {
  sheetProps.sheet = rest
  return (
    <div data-testid="sheet" {...rest}>
      {children}
    </div>
  )
}

Sheet.Overlay = (props: Record<string, unknown>) => <div data-testid="sheet-overlay" {...props} />

Sheet.Frame = (props: Record<string, unknown>) => {
  sheetProps.frame = props
  return (
    <div data-testid="sheet-frame" {...props}>
      {props.children as ReactNode}
    </div>
  )
}

Sheet.Handle = () => <div data-testid="sheet-handle" />

const Button = ({
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

const Input = (props: any) => <input {...props} />

const Select = (props: any) => <div {...props} />
Select.Trigger = (props: any) => <button type="button" {...props} />
Select.Value = (props: any) => <span {...props} />
Select.Content = (props: any) => <div {...props} />
Select.ScrollUpButton = (props: any) => <div {...props} />
Select.ScrollDownButton = (props: any) => <div {...props} />
Select.Viewport = (props: any) => <div {...props} />
Select.Item = (props: any) => <div {...props} />
Select.ItemText = (props: any) => <span {...props} />

const ScrollView = ({ children }: { children?: ReactNode }) => (
  <div data-testid="scroll-view">{children}</div>
)

const Image = (props: any) => <img {...props} />

const View = basicDiv

const Paragraph = (props: any) => <p {...props} />

const Accordion = (props: any) => <div {...props} />
Accordion.Item = (props: any) => <div {...props} />
Accordion.Trigger = ({
  children,
  ...rest
}: {
  children?: (props: { open: boolean }) => React.ReactNode
} & Record<string, unknown>) => (
  <button {...rest} data-testid="accordion-trigger">
    {typeof children === 'function' ? children({ open: false }) : children}
  </button>
)
Accordion.Content = (props: any) => <div {...props} />

const XStack = basicDiv
const YStack = basicDiv
const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>

const useWindowDimensions = () => ({ width: windowDimensions.width })

const useMedia = () => ({
  sm: windowDimensions.width <= 800,
  gtSm: windowDimensions.width > 800,
})

export const styled = (Component: React.ComponentType) => {
  return (props: any) => {
    return <Component {...props} />
  }
}

export const createStyledContext = () => ({})
export const withStaticProperties = (Component: React.ComponentType, _: any) => Component

const Adapt = ({ children }: { children?: ReactNode }) => <>{children}</>
Adapt.Contents = ({ children }: { children?: ReactNode }) => <>{children}</>

export {
  Dialog,
  Sheet,
  Button,
  Input,
  Select,
  ScrollView,
  Image,
  View,
  XStack,
  YStack,
  Text,
  useWindowDimensions,
  useMedia,
  Adapt,
  Accordion,
  Paragraph,
}
