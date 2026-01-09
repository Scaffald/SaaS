/**
 * Crypto Balance Widget component
 * Displays cryptocurrency balance information
 *
 * @example
 * ```tsx
 * <CryptoBalanceWidget
 *   symbol="BTC"
 *   balance={0.5}
 *   balanceUSD={22500}
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import type { CryptoBalanceWidgetProps } from './CryptoWidget.types'
import { CircleChart } from '../Charts'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export function CryptoBalanceWidget({
  symbol,
  balance,
  balanceUSD,
  style,
}: CryptoBalanceWidgetProps) {
  const balanceValue = typeof balance === 'number' ? balance.toFixed(8) : balance
  const usdValue =
    balanceUSD !== undefined
      ? typeof balanceUSD === 'number'
        ? `$${balanceUSD.toLocaleString()}`
        : balanceUSD
      : undefined

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Balance</Text>
        <Text style={styles.symbol}>{symbol}</Text>
      </View>

      <View style={styles.balanceSection}>
        <Text style={styles.balance}>{balanceValue}</Text>
        {usdValue && <Text style={styles.usdBalance}>{usdValue}</Text>}
      </View>

      <View style={styles.chartSection}>
        <CircleChart variant="vertical" value={75} color={colors.primary[600]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[16],
    padding: spacing[24],
    backgroundColor: colors.bg.light.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light.default,
    width: 593,
    minHeight: 282,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text.primary,
  },
  symbol: {
    ...typographyVariants.paragraphSMedium,
    color: colors.text.secondary,
  },
  balanceSection: {
    flexDirection: 'column',
    gap: spacing[8],
  },
  balance: {
    ...typographyVariants.h4SemiBold,
    color: colors.text.primary,
  },
  usdBalance: {
    ...typographyVariants.paragraphSRegular,
    color: colors.text.tertiary,
  },
  chartSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
