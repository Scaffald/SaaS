import { useFormState } from 'react-hook-form'
import { AnimatePresence, Button, ButtonProps, Spinner, styled } from 'tamagui'

// hack to prevent it from breaking on the server
const useIsSubmitting = () => {
  try {
    return useFormState().isSubmitting
  } catch (error) {
    console.error(error)
    return false
  }
}

/**
 * Animated button with pulse effect and loading state
 * Combines smooth press animations with loading spinner functionality
 * Uses primary theme colors that work in both light and dark modes
 *
 * @param props - Button props from Tamagui
 * @returns Animated button component
 */
export const AnimatedButton = styled(Button, {
  name: 'AnimatedButton',
  elevation: '$4',
  borderRadius: '$4',
  fontWeight: '600',
  pressStyle: {
    elevation: '$1',
    scale: 0.95,
  },
  animation: '100ms',
  variants: {
    variant: {
      primary: {
        backgroundColor: '$blue9',
        borderColor: '$blue9',
        color: 'white',
        pressStyle: {
          backgroundColor: '$blue10',
          borderColor: '$blue10',
          elevation: '$1',
          scale: 0.95,
        },
        hoverStyle: {
          backgroundColor: '$blue8',
          borderColor: '$blue8',
        },
      },
      secondary: {
        backgroundColor: '$gray4',
        borderColor: '$gray6',
        color: '$gray12',
        pressStyle: {
          backgroundColor: '$gray5',
          borderColor: '$gray7',
          elevation: '$2',
          scale: 0.9,
        },
        hoverStyle: {
          backgroundColor: '$gray3',
          borderColor: '$gray5',
        },
      },
    },
  } as const,
  defaultVariants: {
    variant: 'primary',
  },
})

/**
 * Enhanced submit button with loading animation and pulse effect
 * Automatically detects form submission state and shows loading spinner
 *
 * @param props - Button props
 * @returns Animated submit button with loading state
 */
export const AnimatedSubmitButton = (
  props: ButtonProps & { variant?: 'primary' | 'secondary' }
) => {
  const isSubmitting = useIsSubmitting()

  return (
    <AnimatedButton
      iconAfter={
        <AnimatePresence>
          {isSubmitting && (
            <Spinner
              color="$color"
              key="loading-spinner"
              o={1}
              y={0}
              animation="quick"
              enterStyle={{
                o: 0,
                y: 4,
              }}
              exitStyle={{
                o: 0,
                y: 4,
              }}
            />
          )}
        </AnimatePresence>
      }
      disabled={isSubmitting}
      {...props}
    />
  )
}
