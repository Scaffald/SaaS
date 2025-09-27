import { useEffect, useState } from 'react'
import { AnimatePresence, Button, Spinner, Theme, View } from 'tamagui'

/**
 * Props for ButtonLoading component
 */
interface ButtonLoadingProps {
  /** Required text to display in the button */
  text: string
  /** Button size - defaults to '$5' */
  size?: string
  /** Loading state - defaults to false */
  loading?: boolean
  /** Button press handler */
  onPress?: () => void
}

/** ------ EXAMPLE ------ */
export function ButtonLoadingExample() {
  const [demoLoading, setDemoLoading] = useState(true)

  useEffect(() => {
    // Demo: toggle loading state every 3 seconds for preview purposes
    const interval = setInterval(() => {
      setDemoLoading(!demoLoading)
    }, 3000)
    return () => clearInterval(interval)
  }, [demoLoading])

  return (
    <View
      flexDirection="row"
      gap="$4"
      flexWrap="wrap"
      alignItems="center"
      justifyContent="center"
      maxWidth={400}
    >
      <ButtonLoading
        text="Click Me"
        loading={demoLoading}
        onPress={() => setDemoLoading(!demoLoading)}
      />

      <Theme name="blue">
        <ButtonLoading
          text="Blue Button"
          loading={demoLoading}
          onPress={() => setDemoLoading(!demoLoading)}
        />
      </Theme>
      <Theme name="purple">
        <ButtonLoading
          text="Purple Button"
          loading={demoLoading}
          onPress={() => setDemoLoading(!demoLoading)}
        />
      </Theme>
      <Theme name="pink">
        <ButtonLoading
          text="Pink Button"
          loading={demoLoading}
          onPress={() => setDemoLoading(!demoLoading)}
        />
      </Theme>
      <Theme name="red">
        <ButtonLoading
          text="Red Button"
          loading={demoLoading}
          onPress={() => setDemoLoading(!demoLoading)}
        />
      </Theme>
      <Theme name="orange">
        <ButtonLoading
          text="Orange Button"
          loading={demoLoading}
          onPress={() => setDemoLoading(!demoLoading)}
        />
      </Theme>
      <Theme name="yellow">
        <ButtonLoading
          text="Yellow Button"
          loading={demoLoading}
          onPress={() => setDemoLoading(!demoLoading)}
        />
      </Theme>
      <Theme name="green">
        <ButtonLoading
          text="Green Button"
          loading={demoLoading}
          onPress={() => setDemoLoading(!demoLoading)}
        />
      </Theme>
    </View>
  )
}

/**
 * A button component that displays a loading spinner with customizable text and behavior.
 * The loading state is controlled via the loading prop.
 *
 * @param props - ButtonLoading component props
 * @returns JSX element
 */
export function ButtonLoading({ text, size = '$5', loading = false, onPress }: ButtonLoadingProps) {
  return (
    <Button onPress={onPress} size={size}>
      <View
        animation="bouncy"
        flexDirection="row"
        x={loading ? 0 : -15}
        gap="$3"
        alignItems="center"
        justifyContent="center"
      >
        <Button.Icon>
          <Spinner
            animation="slow"
            enterStyle={{
              scale: 0,
            }}
            exitStyle={{
              scale: 0,
            }}
            opacity={loading ? 1 : 0}
          />
        </Button.Icon>
        <Button.Text>{text}</Button.Text>
      </View>
    </Button>
  )
}
