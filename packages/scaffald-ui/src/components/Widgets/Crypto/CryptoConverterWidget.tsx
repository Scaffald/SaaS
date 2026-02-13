/**
 * Crypto Converter Widget component
 * Crypto-to-crypto conversion interface
 *
 * @example
 * ```tsx
 * <CryptoConverterWidget
 *   fromSymbol="BTC"
 *   toSymbol="ETH"
 *   amount={1}
 *   convertedAmount={15.5}
 *   exchangeRate={15.5}
 * />
 * ```
 */

import { View, Text, TextInput, StyleSheet } from 'react-native'
import type { CryptoConverterWidgetProps } from './CryptoWidget.types'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export function CryptoConverterWidget({
  fromSymbol = 'BTC',
  toSymbol = 'ETH',
  amount,
  convertedAmount,
  exchangeRate,
  onAmountChange,
  style,
}: CryptoConverterWidgetProps) {
  const amountValue = amount !== undefined ? (typeof amount === 'number' ? amount.toString() : amount) : ''
  const convertedValue =
    convertedAmount !== undefined
      ? typeof convertedAmount === 'number'
        ? convertedAmount.toFixed(8)
        : convertedAmount
      : ''

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Convert</Text>

      <View style={styles.converterSection}>
        <View style={styles.inputSection}>
          <Text style={styles.currencyLabel}>{fromSymbol}</Text>
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
          <Text style={styles.currencyLabel}>{toSymbol}</Text>
          <Text style={styles.convertedAmount}>{convertedValue}</Text>
        </View>
      </View>

      {exchangeRate && (
        <Text style={styles.rateText}>
          1 {fromSymbol} = {exchangeRate.toFixed(8)} {toSymbol}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[16],
    width: 367,
    minHeight: 472,
    padding: spacing[24],
    backgroundColor: colors.bg.light.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light.default,
  },
  title: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text.primary,
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
    color: colors.text.secondary,
  },
  amountInput: {
    ...typographyVariants.h5SemiBold,
    color: colors.text.primary,
    padding: spacing[12],
    backgroundColor: colors.bg.light.default,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light.default,
  },
  convertedAmount: {
    ...typographyVariants.h5SemiBold,
    color: colors.text.primary,
    padding: spacing[12],
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  arrowContainer: {
    paddingVertical: spacing[8],
  },
  arrow: {
    ...typographyVariants.paragraphLRegular,
    color: colors.text.tertiary,
  },
  rateText: {
    ...typographyVariants.captionRegular,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
})
