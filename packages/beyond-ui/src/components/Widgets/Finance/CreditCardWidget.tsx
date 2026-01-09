/**
 * Credit Card Widget component
 * Displays credit card information with optional limit indicator
 *
 * @example
 * ```tsx
 * <CreditCardWidget
 *   variant="Interactive - Credit Card"
 *   cardNumber="1234"
 *   cardholderName="John Doe"
 *   balance="$1,234.56"
 *   limit="$10,000"
 *   onPress={() => console.log('Card pressed')}
 * />
 * ```
 */

import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { CreditCardWidgetProps } from './FinanceWidget.types'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export function CreditCardWidget({
  variant = 'Interactive - Credit Card',
  cardNumber,
  cardholderName,
  balance,
  limit,
  cardType,
  onPress,
  style,
}: CreditCardWidgetProps) {
  const showLimit = variant === 'Interactive - Credit Card - Limit On' && limit

  const content = (
    <View style={[styles.container, style]}>
      {cardType && <Text style={styles.cardType}>{cardType}</Text>}
      {cardNumber && (
        <Text style={styles.cardNumber}>**** **** **** {cardNumber}</Text>
      )}
      {cardholderName && <Text style={styles.cardholderName}>{cardholderName}</Text>}
      {balance && <Text style={styles.balance}>{balance}</Text>}
      {showLimit && limit && <Text style={styles.limit}>Limit: {limit}</Text>}
    </View>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    )
  }

  return content
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[8],
    padding: spacing[16],
    backgroundColor: colors.gray[800],
    borderRadius: 12,
    minHeight: 152,
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.8,
  },
  cardType: {
    ...typographyVariants.captionMedium,
    color: colors.text.tertiary,
  },
  cardNumber: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text.primary,
    letterSpacing: 2,
  },
  cardholderName: {
    ...typographyVariants.paragraphSRegular,
    color: colors.text.secondary,
  },
  balance: {
    ...typographyVariants.subtitleSemiBold,
    color: colors.text.primary,
  },
  limit: {
    ...typographyVariants.captionRegular,
    color: colors.text.tertiary,
  },
})
