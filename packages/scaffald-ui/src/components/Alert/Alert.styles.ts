/**
 * Alert styles — iOS 26 glassmorphic modal design
 *
 * Glass card with backdrop blur, pill-shaped buttons, and optional text fields.
 * Matches Apple iOS/iPadOS 26 alert specifications from Figma.
 */

import { StyleSheet, Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { shadows } from '../../tokens/shadows'
import type { ResolvedThemeMode } from '../../tokens/colors'

export function getAlertStyles(theme: ResolvedThemeMode) {
  const isLight = theme === 'light'

  return StyleSheet.create({
    // ── Modal overlay ──────────────────────────────────────────────
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isLight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.5)',
    },

    // ── Glass card container ───────────────────────────────────────
    container: {
      width: 270,
      borderRadius: borderRadius.sheet,
      backgroundColor: isLight
        ? 'rgba(245, 245, 245, 0.6)'
        : 'rgba(44, 44, 46, 0.7)',
      padding: 14,
      gap: 10,
      ...shadows.iosSheet,
      ...(Platform.OS === 'web'
        ? {
            backdropFilter: 'blur(50px)',
            WebkitBackdropFilter: 'blur(50px)',
          }
        : {}),
    },

    // ── Title / Description area ───────────────────────────────────
    textArea: {
      paddingTop: 8,
      paddingBottom: 24,
      paddingHorizontal: 8,
      alignItems: 'center',
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      letterSpacing: -0.43,
      textAlign: 'center',
      color: colors.labels[theme].primary,
    },
    description: {
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 22,
      letterSpacing: -0.43,
      textAlign: 'center',
      marginTop: 4,
      color: colors.labels[theme].primary,
    },

    // ── Text fields ────────────────────────────────────────────────
    textFieldsContainer: {
      borderRadius: borderRadius.alertField,
      backgroundColor: colors.fills[theme].secondary,
      overflow: 'hidden',
    },
    textFieldInput: {
      height: 52,
      paddingHorizontal: 16,
      fontSize: 17,
      fontWeight: '500',
      color: colors.labels[theme].primary,
    },
    textFieldSeparator: {
      height: 1,
      backgroundColor: colors.separators[theme].vibrant,
    },

    // ── Stacked button layout ──────────────────────────────────────
    buttonsStacked: {
      gap: 10,
    },

    // ── Side-by-side button layout ─────────────────────────────────
    buttonsSideBySide: {
      flexDirection: 'row',
      gap: 16,
    },
    buttonSideBySideItem: {
      flex: 1,
    },

    // ── Button base ────────────────────────────────────────────────
    buttonBase: {
      height: 48,
      borderRadius: borderRadius.pill,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonPressed: {
      opacity: 0.7,
    },

    // ── Primary button (accent blue) ───────────────────────────────
    buttonPrimary: {
      backgroundColor: colors.accents[theme].blue,
    },
    buttonPrimaryText: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      letterSpacing: -0.43,
      color: '#ffffff',
    },

    // ── Destructive button (red text on secondary fill) ────────────
    buttonDestructive: {
      backgroundColor: colors.fills[theme].secondary,
    },
    buttonDestructiveText: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      letterSpacing: -0.43,
      color: colors.accents[theme].red,
    },

    // ── Secondary button (primary text on secondary fill) ──────────
    buttonSecondary: {
      backgroundColor: colors.fills[theme].secondary,
    },
    buttonSecondaryText: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      letterSpacing: -0.43,
      color: colors.labels[theme].primary,
    },
  })
}
