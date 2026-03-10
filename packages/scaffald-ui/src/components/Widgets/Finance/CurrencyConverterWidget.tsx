/**
 * Currency Converter Widget component
 * Currency conversion interface
 *
 * @example
 * ```tsx
 * <CurrencyConverterWidget
 *   fromCurrency="USD"
 *   toCurrency="EUR"
 *   amount={100}
 *   convertedAmount={85.50}
 * />
 * ```
 */

import { View, Text, TextInput, StyleSheet } from 'react-native'
import type { ViewStyle } from 'react-native'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'
import { useThemeContext } from '../../../theme'
import type { ResolvedThemeMode } from '../../../tokens/colors'

export interface CurrencyConverterWidgetProps {
  /**
   * From currency code
   */
  fromCurrency?: string

  /**
   * To currency code
   */
  toCurrency?: string

  /**
   * Amount to convert
   */
  amount?: number | string

  /**
   * Converted amount
   */
  convertedAmount?: number | string

  /**
   * Exchange rate
   */
  exchangeRate?: number

  /**
   * On amount change handler
   */
  onAmountChange?: (amount: string) => void

  /**
   * Custom container style
   */
  style?: ViewStyle
}

export function CurrencyConverterWidget({
  fromCurrency = 'USD',
  toCurrency = 'EUR',
  amount,
  convertedAmount,
  exchangeRate,
  onAmountChange,
  style,
}: CurrencyConverterWidgetProps) {
  const { theme } = useThemeContext()
  const styles = getStyles(theme)
  const amountValue = amount !== undefined ? (typeof amount === 'number' ? amount.toString() : amount) : ''
  const convertedValue =
    convertedAmount !== undefined
      ? typeof convertedAmount === 'number'
        ? convertedAmount.toFixed(2)
        : convertedAmount
      : ''

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Currency Converter</Text>

      <View style={styles.converterSection}>
        <View style={styles.inputSection}>
          <Text style={styles.currencyLabel}>{fromCurrency}</Text>
          <TextInput
            style={styles.amountInput}
            value={amountValue}
            onChangeText={onAmountChange}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>→</Text>
        </View>

        <View style={styles.outputSection}>
          <Text style={styles.currencyLabel}>{toCurrency}</Text>
          <Text style={styles.convertedAmount}>{convertedValue}</Text>
        </View>
      </View>

      {exchangeRate && (
        <Text style={styles.rateText}>
          1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
        </Text>
      )}
    </View>
  )
}

function getStyles(theme: ResolvedThemeMode) {
  return StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[16],
    width: 367,
    minHeight: 348,
    padding: spacing[16],
    backgroundColor: colors.bg[theme].default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border[theme].default,
  },
  title: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text[theme].primary,
  },
  converterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  inputSection: {
    flexDirection: 'column',
    gap: spacing[8],
    flex: 1,
  },
  outputSection: {
    flexDirection: 'column',
    gap: spacing[8],
    flex: 1,
  },
  currencyLabel: {
    ...typographyVariants.paragraphSMedium,
    color: colors.text[theme].secondary,
  },
  amountInput: {
    ...typographyVariants.h5SemiBold,
    color: colors.text[theme].primary,
    padding: spacing[12],
    backgroundColor: colors.bg[theme].default,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border[theme].default,
  },
  convertedAmount: {
    ...typographyVariants.h5SemiBold,
    color: colors.text[theme].primary,
    padding: spacing[12],
    backgroundColor: colors.bg[theme].subtle,
    borderRadius: 8,
  },
  arrowContainer: {
    paddingVertical: spacing[8],
  },
  arrow: {
    ...typographyVariants.paragraphLRegular,
    color: colors.text[theme].tertiary,
  },
  rateText: {
    ...typographyVariants.captionRegular,
    color: colors.text[theme].tertiary,
    textAlign: 'center',
  },
})
}
