import { Platform } from 'react-native'

/**
 * Returns the correct font family name for a given weight and style.
 *
 * On web, CSS handles weight-based font selection using a single family name
 * combined with `fontWeight`. On native (iOS), custom fonts must be referenced
 * by their weight-specific registered name because `fontWeight` is ignored for
 * custom loaded fonts.
 *
 * Font registration in _layout.tsx:
 *   'Roboto'         → Roboto_400Regular
 *   'Roboto-Medium'  → Roboto_500Medium
 *   'Roboto-Bold'    → Roboto_700Bold
 *   'Roboto Serif'   → RobotoSerif_400Regular
 *
 * Note: Roboto has no 600-weight variant; semibold maps to 'Roboto-Medium' on native.
 */
export function getFontFamily(
  weight: 'regular' | 'medium' | 'semibold' | 'bold',
  serif?: boolean,
): string {
  if (serif) return 'Roboto Serif'

  if (Platform.OS === 'web') return 'Roboto' // CSS uses fontWeight to select variant

  // Native: use weight-specific registered font family
  if (weight === 'bold') return 'Roboto-Bold'
  if (weight === 'medium' || weight === 'semibold') return 'Roboto-Medium'
  return 'Roboto'
}
