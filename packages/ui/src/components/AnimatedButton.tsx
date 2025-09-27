import { forwardRef, useState } from 'react'
import { useFormState } from 'react-hook-form'
import {
  AnimatePresence,
  Button,
  ButtonProps,
  Spinner,
  styled,
  View,
  type ThemeName,
  type AnimationProp,
} from 'tamagui'

// hack to prevent it from breaking on the server
const useIsSubmitting = () => {
  try {
    return useFormState().isSubmitting
  } catch (error) {
    console.error(error)
    return false
  }
}

export type AnimatedButtonVariant =
  | 'primary'
  | 'secondary'
  | 'pulse'
  | 'bouncy'
  | 'lazy'
  | 'bump'
  | 'success'
  | 'loading'
export type AnimatedButtonAnimation = 'quick' | 'medium' | 'slow' | 'bouncy' | '100ms'

export interface AnimatedButtonProps extends Omit<ButtonProps, 'variant'> {
  /** Button style variant with animation presets */
  variant?: AnimatedButtonVariant
  /** Animation timing/style */
  animationPreset?: AnimatedButtonAnimation
  /** Loading state (overrides form submission detection) */
  loading?: boolean
  /** Loading text to show when loading */
  loadingText?: string
  /** Icon that moves to center on success/completion */
  successIcon?: React.ReactNode
  /** Whether to show success animation */
  showSuccess?: boolean
  /** Disable all animations */
  disableAnimations?: boolean
}

/**
 * Enhanced animated button with multiple animation presets and loading states
 * Combines smooth press animations, loading spinners, and success animations
 * Supports all Tamagui themes and custom animation patterns from bento
 *
 * Features:
 * - Multiple animation variants (pulse, bouncy, lazy, bump)
 * - Loading states with spinner animations
 * - Success animations with icon centering
 * - Form submission state detection
 * - Cross-platform compatibility
 * - Theme-aware styling
 *
 * @param props - Enhanced button props
 * @returns Animated button component
 */
export const AnimatedButton = styled(Button, {
  name: 'AnimatedButton',
  elevation: '$4',
  borderRadius: '$4',
  fontWeight: '600',
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
      pulse: {
        elevation: '$6',
        pressStyle: {
          elevation: '$2',
          scale: 0.95,
        },
      },
      bouncy: {
        theme: 'alt1',
        elevation: '$6',
        pressStyle: {
          elevation: '$3',
          scale: 0.9,
        },
      },
      lazy: {
        theme: 'active',
        elevation: '$6',
        pressStyle: {
          elevation: '$3',
          scale: 0.9,
        },
      },
      bump: {
        theme: 'surface1',
        elevation: '$6',
        pressStyle: {
          elevation: '$3',
          scale: 1.1,
        },
      },
      success: {
        backgroundColor: '$green9',
        borderColor: '$green9',
        color: 'white',
        pressStyle: {
          backgroundColor: '$green10',
          borderColor: '$green10',
          elevation: '$1',
          scale: 0.95,
        },
        hoverStyle: {
          backgroundColor: '$green8',
          borderColor: '$green8',
        },
      },
      loading: {
        opacity: 0.8,
        pressStyle: {
          opacity: 0.8,
          scale: 1,
        },
      },
    },
    animationPreset: {
      quick: {
        animation: 'quick',
      },
      medium: {
        animation: 'medium',
      },
      slow: {
        animation: 'slow',
      },
      bouncy: {
        animation: 'bouncy',
      },
      '100ms': {
        animation: '100ms',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    animationPreset: '100ms',
  },
})

/**
 * Enhanced button component with loading, success, and animation capabilities
 * Combines the best patterns from bento animation components
 */
export const EnhancedAnimatedButton = forwardRef<any, AnimatedButtonProps>(
  (
    {
      variant = 'primary',
      animationPreset = '100ms',
      loading: loadingProp,
      loadingText,
      successIcon,
      showSuccess = false,
      disableAnimations = false,
      children,
      onPress,
      ...props
    },
    ref
  ) => {
    const isSubmitting = useIsSubmitting()
    const [buttonWidth, setButtonWidth] = useState(100)
    const [iconDim, setIconDim] = useState<{ width: number; height: number }>()

    const loading = loadingProp ?? isSubmitting
    const isSuccess = showSuccess && !loading

    // Determine which variant to use based on state
    const currentVariant = loading ? 'loading' : isSuccess ? 'success' : variant

    const iconScale = 1.8

    return (
      <AnimatedButton
        ref={ref}
        variant={currentVariant}
        animationPreset={disableAnimations ? undefined : animationPreset}
        disabled={loading}
        onPress={onPress}
        overflow={isSuccess ? 'hidden' : undefined}
        onLayout={(e) => setButtonWidth(e.nativeEvent.layout.width)}
        {...props}
      >
        {/* Loading state with spinner */}
        {loading && (
          <View
            animation={disableAnimations ? undefined : 'bouncy'}
            flexDirection="row"
            x={0}
            gap="$3"
            alignItems="center"
            justifyContent="center"
          >
            <Button.Icon>
              <Spinner
                animation={disableAnimations ? undefined : 'slow'}
                enterStyle={{
                  scale: 0,
                }}
                exitStyle={{
                  scale: 0,
                }}
                opacity={1}
              />
            </Button.Icon>
            <Button.Text>{loadingText || 'Loading...'}</Button.Text>
          </View>
        )}

        {/* Success state with centered icon */}
        {isSuccess && successIcon && (
          <>
            <View
              animation={disableAnimations ? undefined : 'quick'}
              x={buttonWidth / 2 - (iconDim?.width || 0) * iconScale}
              scale={iconScale}
              onLayout={(e) => setIconDim(e.nativeEvent.layout)}
            >
              <Button.Icon>{successIcon}</Button.Icon>
            </View>
            <Button.Text
              animation={disableAnimations ? undefined : 'medium'}
              x={buttonWidth}
              opacity={0}
            >
              {children}
            </Button.Text>
          </>
        )}

        {/* Normal state */}
        {!loading && !isSuccess && (
          <AnimatePresence>
            <View
              key="button-content"
              animation={disableAnimations ? undefined : 'quick'}
              opacity={1}
              scale={1}
              enterStyle={{
                opacity: 0,
                scale: 0.9,
              }}
              exitStyle={{
                opacity: 0,
                scale: 0.9,
              }}
            >
              {children}
            </View>
          </AnimatePresence>
        )}
      </AnimatedButton>
    )
  }
)

EnhancedAnimatedButton.displayName = 'EnhancedAnimatedButton'

/**
 * Enhanced submit button with loading animation and pulse effect
 * Automatically detects form submission state and shows loading spinner
 *
 * @deprecated Use EnhancedAnimatedButton instead for more features
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

/**
 * Loading button with smooth animations inspired by bento ButtonLoading
 * Provides a clean API for loading states with customizable text and animations
 */
export const LoadingButton = forwardRef<any, AnimatedButtonProps>(
  ({ loading = false, loadingText = 'Loading...', children, ...props }, ref) => {
    return (
      <EnhancedAnimatedButton ref={ref} loading={loading} loadingText={loadingText} {...props}>
        {children}
      </EnhancedAnimatedButton>
    )
  }
)

LoadingButton.displayName = 'LoadingButton'

/**
 * Success button with icon centering animation inspired by bento IconCenterButton
 * Shows success state with smooth icon transition to center
 */
export const SuccessButton = forwardRef<
  any,
  AnimatedButtonProps & {
    onSuccess?: () => void
  }
>(({ showSuccess = false, successIcon, onSuccess, onPress, children, ...props }, ref) => {
  const handlePress = (event: any) => {
    if (onPress) {
      onPress(event)
    }
    if (onSuccess) {
      onSuccess()
    }
  }

  return (
    <EnhancedAnimatedButton
      ref={ref}
      showSuccess={showSuccess}
      successIcon={successIcon}
      onPress={handlePress}
      {...props}
    >
      {children}
    </EnhancedAnimatedButton>
  )
})

SuccessButton.displayName = 'SuccessButton'
