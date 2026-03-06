/**
 * Input component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { shadows, boxShadows } from '../../tokens/shadows'
import type { InputState, InputType, InputStyleConfig } from './Input.types'

/**
 * Get input styles based on state, type, disabled status, and theme
 */
export function getInputStyles(
  state: InputState,
  type: InputType,
  disabled: boolean,
  hasExternalAddon: boolean,
  theme: ThemeMode = 'light'
): InputStyleConfig {
  const resolvedTheme = theme === 'system' ? 'light' : theme
  const isError = state === 'error'
  const isFocused = state === 'focused'
  const isFilled = state === 'filled'
  const isHover = state === 'hover'

  // Base container styles
  const baseContainer: ViewStyle = {
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    flexDirection: 'column',
    gap: spacing[4],
    flexShrink: 0,
  }

  // Base input container styles
  // Dark mode: use bg.dark.subtle (#1e1914), one shade darker than card (bg.dark.muted #2f2820),
  // so inputs read as inset. Social/outline buttons use the same token for consistent treatment.
  const inputDefaultBg = resolvedTheme === 'dark' ? colors.bg.dark.subtle : colors.bg.light.default
  const baseInputContainer: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44, // Standard input height from Figma
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: borderRadius.m,
    backgroundColor: inputDefaultBg,
    borderWidth: 1,
    gap: spacing[8],
  }

  // Base input text styles
  const baseInputText: TextStyle = {
    ...typography.body,
    flex: 1,
    color: colors.text[resolvedTheme].primary,
    padding: 0, // Remove default padding
    margin: 0,
    letterSpacing: 0, // Convert string to number for React Native
  }

  // Base label styles
  const baseLabel: TextStyle = {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
    letterSpacing: 0,
    color: colors.text[resolvedTheme].primary,
  }

  // Base helper text styles
  const baseHelperText: TextStyle = {
    ...typography.small,
    letterSpacing: 0, // Convert string to number for React Native
    color: colors.text[resolvedTheme].tertiary,
  }

  // Get state-specific styles
  let borderColor: string = colors.border[resolvedTheme].default // border-200
  let backgroundColor: string = inputDefaultBg
  let iconColor: string = colors.icon[resolvedTheme].muted // icon-500
  let textColor: string = colors.text[resolvedTheme].primary
  let shadowStyle: ViewStyle = {}
  const externalAddonBg: string = colors.bg[resolvedTheme].subtle // bg-50

  if (disabled) {
    borderColor = colors.border[resolvedTheme].disabled
    backgroundColor = colors.bg[resolvedTheme].disabled
    iconColor = colors.icon[resolvedTheme].disabled
    textColor = colors.text[resolvedTheme].disabled
  } else if (isError) {
    borderColor = colors.border[resolvedTheme].error
    iconColor = colors.error[500]
  } else if (isFocused) {
    borderColor = colors.primary[600] // Focus border color
    // Focus state uses focus shadow (web only, handled in component)
  } else if (isHover) {
    borderColor = colors.gray[300] // border-200_hover (ced2da)
  } else if (isFilled) {
    // Filled state - same as default but indicates content
    borderColor = colors.border[resolvedTheme].default
  }

  // Apply shadow only for default/classic type (button-shadow)
  if (type === 'classic' && !isFocused && !disabled) {
    shadowStyle = shadows.button
  }

  // Line type has no border radius
  const inputBorderRadius = type === 'line' ? borderRadius.none : borderRadius.m

  const inputContainer: ViewStyle = {
    ...baseInputContainer,
    flex: hasExternalAddon ? undefined : 1, // Fill available space when no external addon
    width: hasExternalAddon ? undefined : '100%', // Full width when no external addon
    minWidth: hasExternalAddon ? undefined : '100%', // Ensure minimum width matches
    backgroundColor,
    borderColor,
    borderRadius: hasExternalAddon && type === 'classic' ? undefined : inputBorderRadius,
    borderTopLeftRadius:
      hasExternalAddon && type === 'classic' ? borderRadius.none : inputBorderRadius,
    borderBottomLeftRadius:
      hasExternalAddon && type === 'classic' ? borderRadius.none : inputBorderRadius,
    ...shadowStyle,
  }

  const inputText: TextStyle = {
    ...baseInputText,
    color: textColor,
  }

  // External addon container (for prefixes like "https://")
  const externalAddonContainer: ViewStyle | undefined = hasExternalAddon
    ? {
        backgroundColor: externalAddonBg,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 0,
        borderColor,
        paddingHorizontal: spacing[12],
        paddingVertical: spacing[8],
        borderTopLeftRadius: borderRadius.m,
        borderBottomLeftRadius: borderRadius.m,
        borderTopRightRadius: borderRadius.none,
        borderBottomRightRadius: borderRadius.none,
        minHeight: 44,
        justifyContent: 'center',
        ...(type === 'classic' ? shadows.button : {}),
      }
    : undefined

  const externalAddonText: TextStyle | undefined = hasExternalAddon
    ? {
        ...typography.body,
        letterSpacing: 0,
        color: colors.text[resolvedTheme].tertiary,
      }
    : undefined

  return {
    container: baseContainer,
    input: inputContainer,
    inputText,
    label: baseLabel,
    helperText: {
      ...baseHelperText,
      color: isError ? colors.error[500] : colors.text[resolvedTheme].tertiary,
    },
    iconColor,
    externalAddonContainer,
    externalAddonText,
  }
}

/**
 * Get focus shadow style (web-only, for focus ring)
 */
export function getFocusShadowStyle(state: InputState): ViewStyle | undefined {
  if (state === 'focused') {
    // Use focusBase shadow for web
    // Note: React Native will need border-based approach for focus rings
    return undefined // Will be handled via boxShadow in web
  }
  return undefined
}

/**
 * Get focus box shadow (web CSS string)
 */
export function getFocusBoxShadow(state: InputState): string | undefined {
  if (state === 'focused') {
    return boxShadows.focusBase
  }
  return undefined
}
