/**
 * SocialLoginGroup - Stacked social login buttons with "or" divider
 * Renders full-width Google and Apple buttons for auth flows.
 * OAuth logic stays in the consumer; this component is pure UI.
 */

import { Caption } from '../Typography'
import { Row, Separator, Stack } from '../Layout'
import { SocialButton } from '../SocialButton'
import { colors } from '../../tokens/colors'
import { useThemeContext } from '../../theme'

export interface SocialLoginGroupProps {
  /** Handler for Google sign-in button press */
  onGooglePress: () => void | Promise<void>
  /** Handler for Apple sign-in button press */
  onApplePress: () => void | Promise<void>
  /** Label for "or" separator (default: "or") */
  orLabel?: string
  /** Google button text override (default: "Continue with Google") */
  googleText?: string
  /** Apple button text override (default: "Continue with Apple") */
  appleText?: string
  /** Show Apple button (default: true). Set false on Android where Apple Sign-In is not available. */
  showApple?: boolean
}

/**
 * Stacked social login buttons with or divider
 *
 * @example
 * <SocialLoginGroup
 *   onGooglePress={handleGoogleSignIn}
 *   onApplePress={handleAppleSignIn}
 *   orLabel={t('common.or')}
 * />
 */
export function SocialLoginGroup({
  onGooglePress,
  onApplePress,
  orLabel = 'or',
  googleText,
  appleText,
  showApple = true,
}: SocialLoginGroupProps) {
  const { theme } = useThemeContext()
  const textTertiary = colors.text[theme].tertiary

  return (
    <Stack gap={20}>
      <OrDivider label={orLabel} textColor={textTertiary} />
      <Stack gap={12} style={{ alignSelf: 'stretch', width: '100%' }}>
        <SocialButton
          brand="google"
          onPress={onGooglePress}
          text={googleText}
          style={{ alignSelf: 'stretch', width: '100%' }}
        />
        {showApple && (
          <SocialButton
            brand="apple"
            onPress={onApplePress}
            text={appleText}
            style={{ alignSelf: 'stretch', width: '100%' }}
          />
        )}
      </Stack>
    </Stack>
  )
}

interface OrDividerProps {
  label: string
  textColor: string
}

function OrDivider({ label, textColor }: OrDividerProps) {
  return (
    <Row align="center" gap={12} style={{ width: '100%' }}>
      <Separator style={{ flex: 1 }} />
      <Caption
        style={{
          backgroundColor: 'transparent',
          paddingHorizontal: 12,
          textTransform: 'uppercase',
          textAlign: 'center',
          color: textColor,
        }}
      >
        {label}
      </Caption>
      <Separator style={{ flex: 1 }} />
    </Row>
  )
}
